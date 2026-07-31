import test from 'node:test';
import assert from 'node:assert/strict';
import { captureTocScreenshot, resetBrowserResolution } from '../src/screenshot.js';

function fakePage({ count = 1, boxes = [{ x: 0, y: 0, width: 100, height: 40 }, { x: 0, y: 0, width: 100, height: 40 }] } = {}) {
  let frame = 0;
  const element = {
    async boundingBox() { return boxes[Math.min(frame++, boxes.length - 1)]; },
    async screenshot(options) { assert.deepEqual(options, { type: 'png' }); return Buffer.from('PNG'); },
  };
  return {
    async setContent() {},
    async waitForFunction(fn, options) {
      assert.equal(options.timeout, 30_000);
      assert.equal(typeof fn, 'function');
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

test('browser resolution installs once and then uses the cache', async () => {
  resetBrowserResolution();
  let installs = 0;
  const options = {
    install: async () => { installs += 1; },
    executablePath: () => '/cached-chrome',
  };
  assert.equal(await (await import('../src/screenshot.js')).resolveBrowser(options), '/cached-chrome');
  assert.equal(await (await import('../src/screenshot.js')).resolveBrowser(options), '/cached-chrome');
  assert.equal(installs, 1);
});
