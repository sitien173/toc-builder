import test from 'node:test';
import assert from 'node:assert/strict';
import { createExtension } from '../src/activate.js';
import { render, renderForScreenshot } from '../../src/render.js';
import { captureTocScreenshot } from '../../src/screenshot.js';
import { copyImage } from '../../src/clipboard.js';

function createMockVsCode() {
  const registeredCommands = [];
  const commandHandlers = {};
  let registeredSerializer = null;

  return {
    get registeredCommands() { return registeredCommands; },
    get registeredSerializer() { return registeredSerializer; },
    workspace: {
      onDidChangeTextDocument: () => ({ dispose: () => {} }),
      onDidSaveTextDocument: () => ({ dispose: () => {} }),
      onDidChangeConfiguration: () => ({ dispose: () => {} }),
      openTextDocument: async (resource) => {
        if (resource && resource.scheme === 'file') {
          return { uri: resource, getText: () => '# Resolved from URI' };
        }
        throw new Error('Cannot open document');
      },
    },
    commands: {
      registerCommand: (commandId, handler) => {
        registeredCommands.push(commandId);
        commandHandlers[commandId] = handler;
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

test('resolveDocument returns a TextDocument unchanged and opens a resource URI', async () => {
  const doc = { uri: { scheme: 'file', path: '/a.md' }, getText: () => 'x' };
  const vscode = createMockVsCode();
  const { resolveDocument } = await import('../src/activate.js');

  const direct = await resolveDocument(vscode, doc);
  assert.equal(direct, doc);

  const uri = { scheme: 'file', path: '/b.md', toString: () => 'file:///b.md' };
  const opened = await resolveDocument(vscode, uri);
  assert.equal(opened.getText(), '# Resolved from URI');
  assert.equal(opened.uri, uri);

  const empty = await resolveDocument(vscode, undefined);
  assert.equal(empty, undefined);
});

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
