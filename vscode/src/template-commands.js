export class TemplateCommands {
  constructor({ vscode, templateService, previewManager }) {
    this.vscode = vscode;
    this.templateService = templateService;
    this.previewManager = previewManager;
  }

  getDocumentUri(providedUri) {
    if (providedUri) return providedUri;
    if (this.previewManager?.activeController?.document?.uri) {
      return this.previewManager.activeController.document.uri;
    }
    if (this.vscode.window.activeTextEditor?.document?.uri) {
      return this.vscode.window.activeTextEditor.document.uri;
    }
    return null;
  }

  async setTemplateCommand(providedUri) {
    const documentUri = this.getDocumentUri(providedUri);
    if (!documentUri) {
      if (this.vscode.window.showWarningMessage) {
        this.vscode.window.showWarningMessage('No active Markdown document to configure template.');
      }
      return;
    }

    const uris = await this.vscode.window.showOpenDialog({
      canSelectMany: false,
      filters: { 'HTML Templates': ['html', 'htm'] },
      openLabel: 'Select Template',
    });

    if (!uris || uris.length === 0) return;

    try {
      await this.templateService.setTemplate(documentUri, uris[0]);
      await this.previewManager.refreshPreview();
    } catch (err) {
      if (this.vscode.window.showErrorMessage) {
        this.vscode.window.showErrorMessage(`Invalid template: ${err.message}`);
      }
    }
  }

  async useDefaultTemplateCommand(providedUri) {
    const documentUri = this.getDocumentUri(providedUri);
    if (!documentUri) {
      if (this.vscode.window.showWarningMessage) {
        this.vscode.window.showWarningMessage('No active Markdown document to reset template.');
      }
      return;
    }

    await this.templateService.clearTemplate(documentUri);
    await this.previewManager.refreshPreview();
  }
}
