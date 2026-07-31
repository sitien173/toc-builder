const CHROME_BUILD_ID = '128.0.6613.119';
const READY_TIMEOUT = 30_000;
let browserResolution;

async function defaultDependencies() {
  const [{ launch }, browsers] = await Promise.all([
    import('puppeteer-core'),
    import('@puppeteer/browsers'),
  ]);
  return { launch, install: browsers.install, executablePath: browsers.computeExecutablePath };
}

export function resetBrowserResolution() {
  browserResolution = undefined;
}

export async function resolveBrowser(overrides = {}) {
  if (!browserResolution) {
    browserResolution = (async () => {
      const dependencies = { ...(await defaultDependencies()), ...overrides };
      const executablePath = dependencies.executablePath({
        browser: 'chrome',
        buildId: CHROME_BUILD_ID,
      });
      try {
        await dependencies.install({ browser: 'chrome', buildId: CHROME_BUILD_ID });
      } catch (error) {
        // Installation can report an existing cached build as a failure; the
        // executable path remains the authoritative cache lookup.
        if (!executablePath) throw error;
      }
      return executablePath;
    })();
  }
  return browserResolution;
}

async function disableMotion(page) {
  await page.evaluate(() => {
    const style = document.createElement('style');
    style.textContent = '*, *::before, *::after { animation: none !important; transition: none !important; }';
    document.head.appendChild(style);
  });
}

export async function captureTocScreenshot(html, options = {}) {
  const dependencies = { ...(await defaultDependencies()), ...options };
  const executablePath = options.resolveBrowser
    ? await options.resolveBrowser()
    : await resolveBrowser(options);
  const browser = await dependencies.launch({
    executablePath,
    headless: true,
    args: [],
  });

  let primaryError;
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'domcontentloaded', timeout: READY_TIMEOUT });
    await page.waitForFunction(
      async () => {
        await document.fonts.ready;
        return document.documentElement.dataset.tocBuilderReady === 'true';
      },
      { timeout: READY_TIMEOUT },
    );
    const elements = await page.$$('.longTOC');
    if (elements.length !== 1) throw new Error(`Expected exactly one .longTOC element, found ${elements.length}`);
    const element = elements[0];
    if (options.disableMotion) await options.disableMotion(page);
    else await disableMotion(page);

    const first = await element.boundingBox();
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => resolve())));
    const second = await element.boundingBox();
    if (!first || !second || first.x !== second.x || first.y !== second.y || first.width !== second.width || first.height !== second.height) {
      throw new Error('TOC bounding box did not remain stable');
    }
    if (first.width <= 0 || first.height <= 0) throw new Error('TOC bounding box is invalid');
    return Buffer.from(await element.screenshot({ type: 'png' }));
  } catch (error) {
    primaryError = error;
    throw error;
  } finally {
    try {
      await browser.close();
    } catch (cleanupError) {
      if (!primaryError) throw cleanupError;
    }
  }
}

export { CHROME_BUILD_ID, READY_TIMEOUT };
