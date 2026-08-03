import test from 'node:test';
import assert from 'node:assert/strict';
import { createExtension } from '../src/activate.js';
import { render, renderForScreenshot } from '../../src/render.js';
import { captureTocScreenshot } from '../../src/screenshot.js';
import { copyImage } from '../../src/clipboard.js';

function createMockVsCode() {
  const registeredCommands = [];
  let registeredSerializer = null;

  return {
    get registeredCommands() { return registeredCommands; },
    get registeredSerializer() { return registeredSerializer; },
    workspace: {
      onDidChangeTextDocument: () => ({ dispose: () => {} }),
      onDidSaveTextDocument: () => ({ dispose: () => {} }),
      onDidChangeConfiguration: () => ({ dispose: () => {} }),
    },
    commands: {
      registerCommand: (commandId, handler) => {
        registeredCommands.push(commandId);
        return { dispose: () => {} };
      },
    },
    window: {
      registerWebviewPanelSerializer: (viewType, serializer) => {
        registeredSerializer = { viewType, serializer };
        return { dispose: () => {} };
      },
    },
  };
}

test('createExtension registers all 5 commands and webview panel serializer', () => {
  const vscode = createMockVsCode();
  const ext = createExtension({
    vscode,
    render,
    renderForScreenshot,
    captureTocScreenshot,
    copyImage,
    defaultTemplateText: '<html><head></head><body>{{markdown}}</body></html>',
  });

  const subscriptions = [];
  const context = { subscriptions };

  ext.activate(context);

  const expectedCommands = [
    'tocBuilder.preview',
    'tocBuilder.refresh',
    'tocBuilder.screenshot',
    'tocBuilder.setTemplate',
    'tocBuilder.useDefaultTemplate',
  ];

  assert.deepEqual(vscode.registeredCommands, expectedCommands);
  assert.equal(vscode.registeredSerializer?.viewType, 'tocBuilder.preview');
  assert.equal(subscriptions.length, 6, 'Should push 5 command disposables + 1 serializer disposable');
});
