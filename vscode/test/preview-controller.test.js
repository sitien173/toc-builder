import test from 'node:test';
import assert from 'node:assert/strict';
import { PreviewController } from '../src/preview-controller.js';
import { prepareWebviewHtml } from '../src/webview-html.js';
import { render } from '../../src/render.js';

function createMockPanel() {
  let htmlValue = '';
  let messageHandler = null;
  return {
    webview: {
      cspSource: 'vscode-webview://test',
      get html() { return htmlValue; },
      set html(val) { htmlValue = val; },
      onDidReceiveMessage: (handler) => {
        messageHandler = handler;
        return { dispose: () => { messageHandler = null; } };
      },
      postMessageFromWebview: (msg) => {
        if (messageHandler) messageHandler(msg);
      },
    },
  };
}

function createMockWorkspace() {
  let docChangeCb = null;
  let docSaveCb = null;
  let configChangeCb = null;
  return {
    onDidChangeTextDocument: (cb) => { docChangeCb = cb; return { dispose: () => { docChangeCb = null; } }; },
    onDidSaveTextDocument: (cb) => { docSaveCb = cb; return { dispose: () => { docSaveCb = null; } }; },
    onDidChangeConfiguration: (cb) => { configChangeCb = cb; return { dispose: () => { configChangeCb = null; } }; },
    fireChange: (doc) => docChangeCb && docChangeCb({ document: doc }),
    fireSave: (doc) => docSaveCb && docSaveCb({ document: doc }),
    fireConfigChange: (uri) => configChangeCb && configChangeCb({ affectsConfiguration: (key, u) => key === 'tocBuilder.templatePath' }),
  };
}

const mockTemplate = '<html><head></head><body>{{markdown}}</body></html>';

function createMockContentService() {
  return {
    snapshot: async (doc, tPath) => ({
      markdown: doc.getText(),
      template: mockTemplate,
      documentUri: doc.uri,
    }),
  };
}

function createMockTemplateService() {
  return {
    getTemplatePath: () => '',
  };
}

test('PreviewController debounces document changes (250ms coalescing)', async () => {
  let timerCb = null;
  const mockSetTimeout = (cb, ms) => {
    timerCb = cb;
    assert.equal(ms, 250);
    return 123;
  };
  const mockClearTimeout = (id) => {
    assert.equal(id, 123);
    timerCb = null;
  };

  const panel = createMockPanel();
  const workspace = createMockWorkspace();
  const doc = {
    uri: { scheme: 'file', path: '/doc.md', toString: () => 'file:///doc.md' },
    getText: () => '# Title 1',
  };

  const controller = new PreviewController({
    panel,
    document: doc,
    workspace,
    contentService: createMockContentService(),
    templateService: createMockTemplateService(),
    render,
    prepareWebviewHtml,
    setTimeoutFn: mockSetTimeout,
    clearTimeoutFn: mockClearTimeout,
  });

  // Initial render
  await controller.forceRefresh();
  assert.ok(panel.webview.html.includes('# Title 1'));

  // Edit document
  doc.getText = () => '# Title 2';
  workspace.fireChange(doc);
  assert.ok(timerCb !== null, 'Timer should be set for debounce');

  // Trigger timer
  await timerCb();
  assert.ok(panel.webview.html.includes('# Title 2'));

  controller.dispose();
});

test('PreviewController save cancels debounce and refreshes immediately', async () => {
  let timerCleared = false;
  const mockSetTimeout = (cb, ms) => 456;
  const mockClearTimeout = (id) => {
    if (id === 456) timerCleared = true;
  };

  const panel = createMockPanel();
  const workspace = createMockWorkspace();
  const doc = {
    uri: { scheme: 'file', path: '/doc.md', toString: () => 'file:///doc.md' },
    getText: () => '# Version 1',
  };

  const controller = new PreviewController({
    panel,
    document: doc,
    workspace,
    contentService: createMockContentService(),
    templateService: createMockTemplateService(),
    render,
    prepareWebviewHtml,
    setTimeoutFn: mockSetTimeout,
    clearTimeoutFn: mockClearTimeout,
  });

  // Edit sets debounce
  workspace.fireChange(doc);

  // Save occurs
  doc.getText = () => '# Saved Version';
  await workspace.fireSave(doc);

  assert.equal(timerCleared, true, 'Save must cancel debounce timer');
  assert.ok(panel.webview.html.includes('# Saved Version'));

  controller.dispose();
});

test('PreviewController ignores changes to unrelated documents', async () => {
  let timerSet = false;
  const mockSetTimeout = () => { timerSet = true; return 1; };

  const panel = createMockPanel();
  const workspace = createMockWorkspace();
  const boundDoc = { uri: { scheme: 'file', path: '/bound.md' }, getText: () => 'Bound' };
  const otherDoc = { uri: { scheme: 'file', path: '/other.md' }, getText: () => 'Other' };

  const controller = new PreviewController({
    panel,
    document: boundDoc,
    workspace,
    contentService: createMockContentService(),
    templateService: createMockTemplateService(),
    render,
    prepareWebviewHtml,
    setTimeoutFn: mockSetTimeout,
  });

  workspace.fireChange(otherDoc);
  assert.equal(timerSet, false);

  controller.dispose();
});

test('PreviewController generation guard prevents stale async render from overwriting newer HTML', async () => {
  const panel = createMockPanel();
  const workspace = createMockWorkspace();
  const doc = { uri: { scheme: 'file', path: '/doc.md' }, getText: () => 'Fast' };

  let slowResolve;
  const slowContentService = {
    snapshot: async () => {
      return new Promise((resolve) => {
        slowResolve = () => resolve({ markdown: 'Slow Content', template: mockTemplate, documentUri: doc.uri });
      });
    },
  };

  const controller = new PreviewController({
    panel,
    document: doc,
    workspace,
    contentService: slowContentService,
    templateService: createMockTemplateService(),
    render,
    prepareWebviewHtml,
  });

  // Start first slow refresh
  const firstPromise = controller.refresh();

  // Fast refresh starts and finishes before slow finishes
  const fastContentService = createMockContentService();
  controller.contentService = fastContentService;
  doc.getText = () => 'Fast Content';
  await controller.refresh();

  assert.ok(panel.webview.html.includes('Fast Content'));

  // Resolve slow refresh
  slowResolve();
  await firstPromise;

  // Stale slow render must NOT overwrite fast render
  assert.ok(panel.webview.html.includes('Fast Content'));

  controller.dispose();
});
