import { constants } from 'node:fs';
import { access } from 'node:fs/promises';

const READY_TIMEOUT = 30_000;

async function defaultDependencies() {
  const { chromium, firefox } = await import('playwright-core');
  return {
    launch: chromium.launch.bind(chromium),
    launchFirefox: firefox.launch.bind(firefox),
  };
}

function defaultBrowserPaths(platform, env) {
  if (platform === 'darwin') {
    return [
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      '/Applications/Chromium.app/Contents/MacOS/Chromium',
      '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser',
      '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
      '/Applications/Firefox.app/Contents/MacOS/firefox',
    ];
  }
  if (platform === 'win32') {
    return [env.PROGRAMFILES, env['PROGRAMFILES(X86)'], env.LOCALAPPDATA]
      .filter(Boolean)
      .flatMap(directory => [
        `${directory}\\Google\\Chrome\\Application\\chrome.exe`,
        `${directory}\\BraveSoftware\\Brave-Browser\\Application\\brave.exe`,
        `${directory}\\Microsoft\\Edge\\Application\\msedge.exe`,
        `${directory}\\Mozilla Firefox\\firefox.exe`,
      ]);
  }
  return [
    '/usr/bin/google-chrome',
    '/opt/google/chrome/chrome',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
    '/usr/bin/brave-browser',
    '/opt/brave.com/brave/brave-browser',
    '/usr/bin/microsoft-edge',
    '/opt/microsoft/msedge/msedge',
    '/usr/bin/firefox',
  ];
}

function isFirefox(executablePath) {
  return /firefox(?:-bin)?(?:\.exe)?$/i.test(executablePath);
}

export async function resolveBrowser({ executablePath, browserPaths, env = process.env, isExecutable, platform = process.platform } = {}) {
  if (executablePath ?? env.TOC_BROWSER_PATH) {
    return executablePath ?? env.TOC_BROWSER_PATH;
  }
  const candidates = browserPaths ?? defaultBrowserPaths(platform, env);
  const canExecute = isExecutable ?? (path => access(path, constants.X_OK).then(() => true, () => false));
  for (const candidate of candidates) {
    if (await canExecute(candidate)) return candidate;
  }
  throw new Error('No system browser found. Install Chrome, Brave, Edge, or Firefox, or set TOC_BROWSER_PATH.');
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
  const launch = isFirefox(executablePath) ? dependencies.launchFirefox : dependencies.launch;
  const browser = await launch({
    executablePath,
    headless: true,
    args: [],
    ...(isFirefox(executablePath) ? {} : { chromiumSandbox: true }),
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
      undefined,
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

export { READY_TIMEOUT };
