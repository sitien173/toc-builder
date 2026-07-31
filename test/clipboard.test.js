import test from 'node:test';
import assert from 'node:assert/strict';
import { copyImage } from '../src/clipboard.js';

test('copies PNG bytes through the image clipboard API', async () => {
  let received;
  const bytes = Buffer.from([137, 80, 78, 71]);
  await copyImage(bytes, { setImageBinary: async value => { received = value; } });
  assert.deepEqual(received, [137, 80, 78, 71]);
});
