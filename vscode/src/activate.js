import { ContentService } from './content-service.js';
import { TemplateService } from './template-service.js';
import { PreviewManager } from './preview-manager.js';
import { TemplateCommands } from './template-commands.js';
import { ScreenshotService } from './screenshot-service.js';
import { prepareWebviewHtml } from './webview-html.js';
import { validateTemplate } from '../../src/render.js';

function isTextDocument(value) {
  return value && typeof value.getText === 'function' && value.uri;
}

export async function resolveDocument(vscode, resource) {
  if (isTextDocument(resource)) return resource;
  if (resource?.scheme && typeof vscode.workspace.openTextDocument === 'function') {
    return vscode.workspace.openTextDocument(resource);
  }
  return undefined;
}

export function createExtension({
  vscode,
  render,
  renderForScreenshot,
  captureTocScreenshot,
  copyImage,
  defaultTemplateText,
}) {
  const contentService = new ContentService({
    workspace: vscode.workspace,
    validateTemplate,
    defaultTemplateText,
  });

  const templateService = new TemplateService({
    workspace: vscode.workspace,
    contentService,
    validateTemplate,
  });

  const previewManager = new PreviewManager({
    vscode,
    contentService,
    templateService,
    render,
    prepareWebviewHtml,
  });

  const templateCommands = new TemplateCommands({
    vscode,
    templateService,
    previewManager,
  });

  const screenshotService = new ScreenshotService({
    vscode,
    contentService,
    templateService,
    renderForScreenshot,
    captureTocScreenshot,
    copyImage,
    previewManager,
  });

  return {
    contentService,
    templateService,
    previewManager,
    templateCommands,
    screenshotService,
    activate: (context) => {
      if (context?.extensionUri) {
        previewManager.extensionUri = context.extensionUri;
      }

      const subscriptions = [
        vscode.commands.registerCommand('tocBuilder.preview', async (resource) => {
          const document = await resolveDocument(vscode, resource);
          return previewManager.showPreview(document);
        }),
        vscode.commands.registerCommand('tocBuilder.refresh', () => {
          return previewManager.refreshPreview();
        }),
        vscode.commands.registerCommand('tocBuilder.screenshot', async (resource) => {
          const document = await resolveDocument(vscode, resource);
          return screenshotService.captureScreenshot(document);
        }),
        vscode.commands.registerCommand('tocBuilder.setTemplate', (uri) => {
          return templateCommands.setTemplateCommand(uri);
        }),
        vscode.commands.registerCommand('tocBuilder.useDefaultTemplate', (uri) => {
          return templateCommands.useDefaultTemplateCommand(uri);
        }),
        vscode.window.registerWebviewPanelSerializer('tocBuilder.preview', {
          deserializeWebviewPanel: (panel, state) => {
            return previewManager.deserializeWebviewPanel(panel, state);
          },
        }),
      ];

      context.subscriptions.push(...subscriptions);
    },
  };
}
