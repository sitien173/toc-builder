import test from 'node:test';
import assert from 'node:assert/strict';
import { captureTocScreenshot, resolveBrowser } from '../src/screenshot.js';

function fakePage({ count = 1, boxes = [{ x: 0, y: 0, width: 100, height: 40 }, { x: 0, y: 0, width: 100, height: 40 }] } = {}) {
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
  const page = fakePage();
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

test('browser resolution rejects when no system browser is available', async () => {
  await assert.rejects(
    resolveBrowser({ browserPaths: [], env: {} }),
    /TOC_BROWSER_PATH/i,
  );
});
