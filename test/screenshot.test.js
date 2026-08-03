import test from 'node:test';
import assert from 'node:assert/strict';
import { captureTocScreenshot, resolveBrowser } from '../src/screenshot.js';

function fakePage({ count = 1, boxes = [{ x: 0, y: 0, width: 100, height: 40 }, { x: 0, y: 0, width: 100, height: 40 }], onScreenshot } = {}) {
  let frame = 0;
  const element = {
    async boundingBox() { return boxes[Math.min(frame++, boxes.length - 1)]; },
    async screenshot(options) { assert.deepEqual(options, { type: 'png' }); return Buffer.from('PNG'); },
  };
  return {
    async setContent() {},
    async waitForFunction(fn, arg, options) {
      assert.equal(options.timeout, 30_000);
      assert.equal(typeof fn, 'function');
      assert.equal(arg, undefined);
    },
    async evaluate(fn) {
      assert.equal(typeof fn, 'function');
    },
    async $$() { return count === 1 ? [element] : Array.from({ length: count }, () => element); },
    async screenshot(options) { return onScreenshot ? onScreenshot(options) : assert.fail('page.screenshot must be called with a clip'); },
  };
}

function harness(page, { closeError } = {}) {
  let closed = false;
  const browser = {
    async newPage() { return page; },
    async close() { closed = true; if (closeError) throw closeError; },
  };
  return { browser, wasClosed: () => closed };
}

test('waits for readiness, selects one stable TOC, disables motion, and returns PNG bytes', async () => {
  const page = fakePage({
    onScreenshot: options => {
      assert.deepEqual(options, { type: 'png', clip: { x: -24, y: -12, width: 136, height: 76 } });
      return Buffer.from('PNG');
    },
  });
  const { browser, wasClosed } = harness(page);
  let launchOptions;
  const bytes = await captureTocScreenshot('<html></html>', {
    launch: async options => { launchOptions = options; return browser; },
    resolveBrowser: async () => '/chrome',
  });

  assert.deepEqual(bytes, Buffer.from('PNG'));
  assert.equal(launchOptions.executablePath, '/chrome');
  assert.equal(launchOptions.headless, true);
  assert.equal(launchOptions.chromiumSandbox, true);
  assert.ok(!launchOptions.args?.includes('--no-sandbox'));
  assert.equal(wasClosed(), true);
});

test('adds symmetric margins around the TOC and honors a margin override', async () => {
  const boxes = [
    { x: 30, y: 40, width: 200, height: 80 },
    { x: 30, y: 40, width: 200, height: 80 },
  ];
  const clips = [];
  const page = fakePage({
    boxes,
    onScreenshot: options => {
      clips.push(options.clip);
      return Buffer.from('PNG');
    },
  });
  const { browser } = harness(page);
  await captureTocScreenshot('<html></html>', {
    launch: async () => browser,
    resolveBrowser: async () => '/chrome',
  });
  assert.deepEqual(clips, [{ x: 6, y: 28, width: 236, height: 116 }]);

  const page2 = fakePage({
    boxes,
    onScreenshot: options => {
      clips.push(options.clip);
      return Buffer.from('PNG');
    },
  });
  const { browser: browser2 } = harness(page2);
  await captureTocScreenshot('<html></html>', {
    launch: async () => browser2,
    resolveBrowser: async () => '/chrome',
    margin: { left: 10, bottom: 20 },
  });
  assert.deepEqual(clips[1], { x: 20, y: 28, width: 222, height: 112 });
});

test('launches Firefox through Playwright Firefox', async () => {
  const page = fakePage({
    onScreenshot: options => {
      assert.equal(options.type, 'png');
      assert.ok(options.clip);
      return Buffer.from('PNG');
    },
  });
  const { browser } = harness(page);
  let launchOptions;
  await captureTocScreenshot('<html></html>', {
    launch: async () => assert.fail('Chromium must not launch Firefox'),
    launchFirefox: async options => { launchOptions = options; return browser; },
    resolveBrowser: async () => '/usr/bin/firefox',
  });

  assert.equal(launchOptions.executablePath, '/usr/bin/firefox');
  assert.equal(launchOptions.headless, true);
  assert.equal(launchOptions.chromiumSandbox, undefined);
});

test('rejects missing or duplicate TOCs and still closes the browser', async () => {
  for (const count of [0, 2]) {
    const { browser, wasClosed } = harness(fakePage({ count }));
    await assert.rejects(
      captureTocScreenshot('<html></html>', { launch: async () => browser, resolveBrowser: async () => '/chrome' }),
      /exactly one.*longTOC/i,
    );
    assert.equal(wasClosed(), true);
  }
});

test('preserves the primary capture failure when cleanup also fails', async () => {
  const { browser } = harness(fakePage(), { closeError: new Error('cleanup') });
  await assert.rejects(
    captureTocScreenshot('<html></html>', {
      launch: async () => browser,
      resolveBrowser: async () => '/chrome',
      disableMotion: async () => { throw new Error('capture failed'); },
    }),
    /capture failed/,
  );
});

test('browser resolution uses an explicitly configured system browser', async () => {
  assert.equal(await resolveBrowser({ executablePath: '/usr/bin/chromium' }), '/usr/bin/chromium');
});

test('browser resolution detects an executable system browser', async () => {
  const browser = await resolveBrowser({
    browserPaths: ['/missing-browser', '/usr/bin/chromium'],
    isExecutable: async path => path === '/usr/bin/chromium',
  });
  assert.equal(browser, '/usr/bin/chromium');
});

test('browser resolution checks Chrome, Brave, Edge, and Firefox paths', async () => {
  const checked = [];
  const browser = await resolveBrowser({
    env: {},
    platform: 'linux',
    isExecutable: async path => {
      checked.push(path);
      return path === '/usr/bin/firefox';
    },
  });

  assert.equal(browser, '/usr/bin/firefox');
  assert.ok(checked.includes('/usr/bin/google-chrome'));
  assert.ok(checked.includes('/usr/bin/brave-browser'));
  assert.ok(checked.includes('/usr/bin/microsoft-edge'));
  assert.ok(checked.includes('/usr/bin/firefox'));
});

test('browser resolution rejects when no system browser is available', async () => {
  await assert.rejects(
    resolveBrowser({ browserPaths: [], env: {} }),
    /TOC_BROWSER_PATH/i,
  );
});
