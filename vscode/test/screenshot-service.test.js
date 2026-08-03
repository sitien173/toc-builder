import test from 'node:test';
import assert from 'node:assert/strict';
import { ScreenshotService } from '../src/screenshot-service.js';

function createMockVsCode({ clipboardFail = false, selectSave = false } = {}) {
  let progressCalled = false;
  let infoMessage = '';
  let errorMessage = '';
  let writtenFile = null;

  return {
    get progressCalled() { return progressCalled; },
    get infoMessage() { return infoMessage; },
    get errorMessage() { return errorMessage; },
    get writtenFile() { return writtenFile; },
    ProgressLocation: { Notification: 15 },
    Uri: { file: (p) => ({ scheme: 'file', path: p, toString: () => `file://${p}` }) },
    window: {
      activeTextEditor: null,
      withProgress: async (options, task) => {
        progressCalled = true;
        assert.equal(options.title, 'Capturing TOC Screenshot...');
        return task();
      },
      showInformationMessage: (msg) => { infoMessage = msg; },
      showErrorMessage: async (msg, ...actions) => {
        errorMessage = msg;
        if (selectSave && actions.includes('Save PNG')) return 'Save PNG';
        return undefined;
      },
      showSaveDialog: async (options) => ({ scheme: 'file', path: '/saved/toc.png', toString: () => 'file:///saved/toc.png' }),
    },
    workspace: {
      fs: {
        writeFile: async (uri, bytes) => {
          writtenFile = { uri, bytes };
        },
      },
    },
  };
}

const mockTemplate = '<html><head></head><body>{{markdown}}</body></html>';
const mockDoc = { uri: { scheme: 'file', path: '/doc.md' }, getText: () => '# Doc Header' };

const mockContentService = {
  snapshot: async (doc) => ({ markdown: doc.getText(), template: mockTemplate, documentUri: doc.uri }),
};

const mockTemplateService = {
  getTemplatePath: () => '',
};

test('ScreenshotService executes snapshot, renderForScreenshot, headless capture, and clipboard copy under progress UI', async () => {
  let renderForScreenshotCalled = false;
  let captureTocScreenshotCalled = false;
  let copyImageCalled = false;

  const mockRenderForScreenshot = (template, markdown) => {
    renderForScreenshotCalled = true;
    return `<!--screenshot-->${markdown}`;
  };

  const mockCaptureTocScreenshot = async (html) => {
    captureTocScreenshotCalled = true;
    assert.equal(html, '<!--screenshot--># Doc Header');
    return Buffer.from('fake-png-bytes');
  };

  const mockCopyImage = async (pngBuffer) => {
    copyImageCalled = true;
    assert.equal(pngBuffer.toString(), 'fake-png-bytes');
  };

  const vscode = createMockVsCode();
  const service = new ScreenshotService({
    vscode,
    contentService: mockContentService,
    templateService: mockTemplateService,
    renderForScreenshot: mockRenderForScreenshot,
    captureTocScreenshot: mockCaptureTocScreenshot,
    copyImage: mockCopyImage,
  });

  await service.captureScreenshot(mockDoc);

  assert.equal(vscode.progressCalled, true);
  assert.equal(renderForScreenshotCalled, true);
  assert.equal(captureTocScreenshotCalled, true);
  assert.equal(copyImageCalled, true);
  assert.equal(vscode.infoMessage, 'TOC screenshot copied to clipboard.');
});

test('ScreenshotService prevents concurrent captures', async () => {
  let captureCount = 0;
  const vscode = createMockVsCode();

  const slowCapture = async () => {
    captureCount++;
    await new Promise((r) => setTimeout(r, 50));
    return Buffer.from('png');
  };

  const service = new ScreenshotService({
    vscode,
    contentService: mockContentService,
    templateService: mockTemplateService,
    renderForScreenshot: () => '',
    captureTocScreenshot: slowCapture,
    copyImage: async () => {},
  });

  const p1 = service.captureScreenshot(mockDoc);
  const p2 = service.captureScreenshot(mockDoc);

  await Promise.all([p1, p2]);
  assert.equal(captureCount, 1, 'Only one capture should be executed concurrently');
});

test('ScreenshotService handles clipboard failure and offers Save PNG fallback', async () => {
  const vscode = createMockVsCode({ selectSave: true });

  const service = new ScreenshotService({
    vscode,
    contentService: mockContentService,
    templateService: mockTemplateService,
    renderForScreenshot: () => 'html',
    captureTocScreenshot: async () => Buffer.from('bytes'),
    copyImage: async () => {
      throw new Error('wl-copy missing');
    },
  });

  await service.captureScreenshot(mockDoc);

  assert.ok(vscode.errorMessage.includes('Failed to copy image to clipboard: wl-copy missing'));
  assert.ok(vscode.writtenFile !== null);
  assert.equal(vscode.writtenFile.bytes.toString(), 'bytes');
  assert.equal(vscode.infoMessage, 'TOC screenshot saved successfully.');
});
