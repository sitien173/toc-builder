import { ContentService } from './content-service.js';
import { TemplateService } from './template-service.js';
import { PreviewManager } from './preview-manager.js';
import { TemplateCommands } from './template-commands.js';
import { ScreenshotService } from './screenshot-service.js';
import { prepareWebviewHtml } from './webview-html.js';
import { validateTemplate } from '../../src/render.js';

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
      const subscriptions = [
        vscode.commands.registerCommand('tocBuilder.preview', (uri) => {
          return previewManager.showPreview(uri);
        }),
        vscode.commands.registerCommand('tocBuilder.refresh', () => {
          return previewManager.refreshPreview();
        }),
        vscode.commands.registerCommand('tocBuilder.screenshot', (uri) => {
          return screenshotService.captureScreenshot(uri);
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
