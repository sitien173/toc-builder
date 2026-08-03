import test from 'node:test';
import assert from 'node:assert/strict';
import { TemplateCommands } from '../src/template-commands.js';

function createMockVsCode({ dialogResult = null, activeUri = null } = {}) {
  let errorMessage = '';
  return {
    get errorMessage() { return errorMessage; },
    window: {
      activeTextEditor: activeUri ? { document: { uri: activeUri } } : null,
      showOpenDialog: async () => dialogResult,
      showErrorMessage: (msg) => { errorMessage = msg; },
    },
  };
}

test('TemplateCommands setTemplateCommand calls setTemplate and refreshes preview', async () => {
  const docUri = { scheme: 'file', path: '/doc.md' };
  const pickedUri = { scheme: 'file', path: '/custom.html' };

  let setTemplateCalled = false;
  let refreshCalled = false;

  const templateService = {
    setTemplate: async (dUri, pUri) => {
      assert.equal(dUri, docUri);
      assert.equal(pUri, pickedUri);
      setTemplateCalled = true;
    },
  };

  const previewManager = {
    refreshPreview: async () => { refreshCalled = true; },
  };

  const vscode = createMockVsCode({ dialogResult: [pickedUri] });
  const commands = new TemplateCommands({ vscode, templateService, previewManager });

  await commands.setTemplateCommand(docUri);
  assert.equal(setTemplateCalled, true);
  assert.equal(refreshCalled, true);
});

test('TemplateCommands setTemplateCommand shows error message on invalid template', async () => {
  const docUri = { scheme: 'file', path: '/doc.md' };
  const pickedUri = { scheme: 'file', path: '/bad.html' };

  const templateService = {
    setTemplate: async () => {
      throw new Error('Template must contain exactly one {{markdown}} placeholder');
    },
  };

  const previewManager = {
    refreshPreview: async () => {
      assert.fail('refreshPreview should not be called on validation error');
    },
  };

  const vscode = createMockVsCode({ dialogResult: [pickedUri] });
  const commands = new TemplateCommands({ vscode, templateService, previewManager });

  await commands.setTemplateCommand(docUri);
  assert.ok(vscode.errorMessage.includes('Template must contain exactly one {{markdown}} placeholder'));
});

test('TemplateCommands useDefaultTemplateCommand clears template and refreshes preview', async () => {
  const docUri = { scheme: 'file', path: '/doc.md' };

  let clearCalled = false;
  let refreshCalled = false;

  const templateService = {
    clearTemplate: async (dUri) => {
      assert.equal(dUri, docUri);
      clearCalled = true;
    },
  };

  const previewManager = {
    refreshPreview: async () => { refreshCalled = true; },
  };

  const vscode = createMockVsCode();
  const commands = new TemplateCommands({ vscode, templateService, previewManager });

  await commands.useDefaultTemplateCommand(docUri);
  assert.equal(clearCalled, true);
  assert.equal(refreshCalled, true);
});
