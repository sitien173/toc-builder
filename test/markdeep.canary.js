import test from 'node:test';
import assert from 'node:assert/strict';
import { renderForScreenshot } from '../src/render.js';
import { captureTocScreenshot } from '../src/screenshot.js';

const template = '<!doctype html><html><head><meta charset="utf-8"></head><body>{{markdown}}</body></html>';

test('remote Markdeep latest still renders one capturable long TOC', async () => {
  const html = renderForScreenshot(template, '# Canary\n\n## Compatibility check\n');
  const png = await captureTocScreenshot(html);
  assert.deepEqual([...png.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10]);
});
