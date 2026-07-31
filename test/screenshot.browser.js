import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { captureTocScreenshot } from '../src/screenshot.js';

const fixturePath = path.join(path.dirname(fileURLToPath(import.meta.url)), 'fixtures', 'screenshot-toc.html');

test('captures one local TOC element as a bounded PNG', async () => {
  const html = await fs.readFile(fixturePath, 'utf8');
  const png = await captureTocScreenshot(html);

  assert.deepEqual([...png.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10]);
  assert.equal(png.readUInt32BE(16), 240);
  assert.equal(png.readUInt32BE(20), 80);
});
