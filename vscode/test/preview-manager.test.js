import test from 'node:test';
import assert from 'node:assert/strict';
import { PreviewManager } from '../src/preview-manager.js';
import { prepareWebviewHtml } from '../src/webview-html.js';
import { render } from '../../src/render.js';

function createMockVsCode() {
  let createdPanel = null;
  let disposeCb = null;
  let openDocError = false;

  return {
    get createdPanel() { return createdPanel; },
    setOpenDocError: (val) => { openDocError = val; },
    ViewColumn: { Beside: 2 },
    Uri: {
      parse: (str) => ({ scheme: 'file', path: str.replace('file://', ''), toString: () => str }),
    },
    window: {
      activeTextEditor: null,
      createWebviewPanel: (viewType, title, viewColumn, options) => {
        let htmlVal = '';
        let revealed = false;
        createdPanel = {
          viewType,
          title,
          viewColumn,
          options,
          webview: {
            cspSource: 'vscode-webview://test',
            get html() { return htmlVal; },
            set html(v) { htmlVal = v; },
            onDidReceiveMessage: () => ({ dispose: () => {} }),
          },
          reveal: (col) => { revealed = true; },
          onDidDispose: (cb) => { disposeCb = cb; },
          dispose: () => { if (disposeCb) disposeCb(); },
          get isRevealed() { return revealed; },
        };
        return createdPanel;
      },
    },
    workspace: {
      onDidChangeTextDocument: () => ({ dispose: () => {} }),
      onDidSaveTextDocument: () => ({ dispose: () => {} }),
      onDidChangeConfiguration: () => ({ dispose: () => {} }),
      openTextDocument: async (uri) => {
        if (openDocError) throw new Error('File not found');
        return {
          uri,
          getText: () => '# Restored Document',
        };
      },
    },
  };
}

const mockTemplate = '<html><head></head><body>{{markdown}}</body></html>';
const mockContentService = {
  snapshot: async (doc) => ({ markdown: doc.getText(), template: mockTemplate, documentUri: doc.uri }),
};
const mockTemplateService = {
  getTemplatePath: () => '',
};

test('PreviewManager creates one panel and reuses/retargets it on next preview call', async () => {
  const vscode = createMockVsCode();
  const manager = new PreviewManager({
    vscode,
    contentService: mockContentService,
    templateService: mockTemplateService,
    render,
    prepareWebviewHtml,
  });

  const doc1 = { uri: { scheme: 'file', path: '/doc1.md', toString: () => 'file:///doc1.md' }, getText: () => '# Doc 1' };
  const doc2 = { uri: { scheme: 'file', path: '/doc2.md', toString: () => 'file:///doc2.md' }, getText: () => '# Doc 2' };

  await manager.showPreview(doc1);
  const panel1 = vscode.createdPanel;
  assert.ok(panel1 !== null);
  assert.equal(panel1.options.retainContextWhenHidden, false);
  assert.ok(panel1.webview.html.includes('# Doc 1'));

  // Show preview on doc2 -> reuses panel1
  await manager.showPreview(doc2);
  assert.equal(vscode.createdPanel, panel1, 'Panel must be reused');
  assert.equal(panel1.isRevealed, true, 'Panel must be revealed');
  assert.ok(panel1.webview.html.includes('# Doc 2'));
});

test('PreviewManager clears references when panel is disposed', async () => {
  const vscode = createMockVsCode();
  const manager = new PreviewManager({
    vscode,
    contentService: mockContentService,
    templateService: mockTemplateService,
    render,
    prepareWebviewHtml,
  });

  const doc = { uri: { scheme: 'file', path: '/doc.md', toString: () => 'file:///doc.md' }, getText: () => '# Doc' };

  await manager.showPreview(doc);
  assert.ok(manager.activePanel !== null);

  vscode.createdPanel.dispose();
  assert.equal(manager.activePanel, null);
  assert.equal(manager.activeController, null);
});

test('PreviewManager serializer restores panel for existing document and error page for missing document', async () => {
  const vscode = createMockVsCode();
  const manager = new PreviewManager({
    vscode,
    contentService: mockContentService,
    templateService: mockTemplateService,
    render,
    prepareWebviewHtml,
  });

  const panel = vscode.window.createWebviewPanel('tocBuilder.preview', 'TOC Preview', 2, {});

  // Success restoration
  await manager.deserializeWebviewPanel(panel, { protocol: 1, sourceUri: 'file:///existing.md' });
  assert.ok(panel.webview.html.includes('# Restored Document'));

  // Missing document restoration
  vscode.setOpenDocError(true);
  const deadPanel = vscode.window.createWebviewPanel('tocBuilder.preview', 'TOC Preview', 2, {});
  await manager.deserializeWebviewPanel(deadPanel, { protocol: 1, sourceUri: 'file:///missing.md' });
  assert.ok(deadPanel.webview.html.includes('Document no longer exists'));
});
