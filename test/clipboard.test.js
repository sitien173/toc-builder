import test from 'node:test';
import assert from 'node:assert/strict';
import { copyImage } from '../src/clipboard.js';

test('copies PNG bytes through the image clipboard API', async () => {
  let received;
  const bytes = Buffer.from([137, 80, 78, 71]);
  await copyImage(bytes, {
    findTool: () => null,
    setImageBinary: async value => { received = value; },
  });
  assert.deepEqual(received, [137, 80, 78, 71]);
});

test('copies PNG bytes through the wl-copy tool when on Wayland', async () => {
  let sent;
  const bytes = Buffer.from([137, 80, 78, 71]);
  await copyImage(bytes, {
    findTool: () => ['wl-copy', '--type', 'image/png'],
    copyWithTool: async (command, received) => {
      assert.deepEqual(command, ['wl-copy', '--type', 'image/png']);
      sent = received;
    },
    setImageBinary: async () => assert.fail('must use the tool, not the library'),
  });
  assert.deepEqual(sent, bytes);
});

test('prefers the Wayland tool when both displays are set', async () => {
  const previousWayland = process.env.WAYLAND_DISPLAY;
  const previousDisplay = process.env.DISPLAY;
  process.env.WAYLAND_DISPLAY = 'wayland-0';
  process.env.DISPLAY = ':0';
  try {
    let command;
    await copyImage(Buffer.from([1]), {
      copyWithTool: async received => { command = received; },
      setImageBinary: async () => assert.fail('must use the tool, not the library'),
    });
    assert.deepEqual(command, ['wl-copy', '--type', 'image/png']);
  } finally {
    if (previousWayland === undefined) delete process.env.WAYLAND_DISPLAY;
    else process.env.WAYLAND_DISPLAY = previousWayland;
    if (previousDisplay === undefined) delete process.env.DISPLAY;
    else process.env.DISPLAY = previousDisplay;
  }
});

test('falls back to the library when no display is configured', async () => {
  let received;
  await copyImage(Buffer.from([137, 80, 78, 71]), {
    findTool: () => null,
    setImageBinary: async value => { received = value; },
  });
  assert.deepEqual(received, [137, 80, 78, 71]);
});