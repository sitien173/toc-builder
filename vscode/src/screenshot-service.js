export class ScreenshotService {
  constructor({
    vscode,
    contentService,
    templateService,
    renderForScreenshot,
    captureTocScreenshot,
    copyImage,
    previewManager,
  }) {
    this.vscode = vscode;
    this.contentService = contentService;
    this.templateService = templateService;
    this.renderForScreenshot = renderForScreenshot;
    this.captureTocScreenshot = captureTocScreenshot;
    this.copyImage = copyImage;
    this.previewManager = previewManager;

    this.isCapturing = false;
  }

  getDocument(targetDocument) {
    if (targetDocument) return targetDocument;
    if (this.previewManager?.activeController?.document) {
      return this.previewManager.activeController.document;
    }
    if (this.vscode.window?.activeTextEditor?.document) {
      return this.vscode.window.activeTextEditor.document;
    }
    return null;
  }

  async captureScreenshot(targetDocument) {
    const document = this.getDocument(targetDocument);

    if (!document) {
      if (this.vscode.window?.showWarningMessage) {
        this.vscode.window.showWarningMessage('No active Markdown document to capture.');
      }
      return;
    }

    if (this.isCapturing) {
      if (this.vscode.window?.showWarningMessage) {
        this.vscode.window.showWarningMessage('Screenshot capture is already in progress.');
      }
      return;
    }

    this.isCapturing = true;

    try {
      const withProgress = this.vscode.window?.withProgress
        ? this.vscode.window.withProgress.bind(this.vscode.window)
        : async (_options, task) => task();

      await withProgress(
        {
          location: this.vscode.ProgressLocation?.Notification || 15,
          title: 'Capturing TOC Screenshot...',
          cancellable: false,
        },
        async () => {
          const templatePath = this.templateService.getTemplatePath(document.uri);
          const snapshot = await this.contentService.snapshot(document, templatePath);
          const html = this.renderForScreenshot(snapshot.template, snapshot.markdown);
          const pngBuffer = await this.captureTocScreenshot(html);

          try {
            await this.copyImage(pngBuffer);
            if (this.vscode.window?.showInformationMessage) {
              this.vscode.window.showInformationMessage('TOC screenshot copied to clipboard.');
            }
          } catch (err) {
            let choice;
            if (this.vscode.window?.showErrorMessage) {
              choice = await this.vscode.window.showErrorMessage(
                `Failed to copy image to clipboard: ${err.message}`,
                'Save PNG'
              );
            }
            if (choice === 'Save PNG') {
              const defaultUri = this.vscode.Uri?.file
                ? this.vscode.Uri.file('toc.png')
                : 'toc.png';
              const saveUri = await this.vscode.window?.showSaveDialog?.({
                defaultUri,
                filters: { PNG: ['png'] },
              });
              if (saveUri && this.vscode.workspace?.fs?.writeFile) {
                await this.vscode.workspace.fs.writeFile(saveUri, pngBuffer);
                if (this.vscode.window?.showInformationMessage) {
                  this.vscode.window.showInformationMessage('TOC screenshot saved successfully.');
                }
              }
            }
          }
        }
      );
    } catch (err) {
      if (this.vscode.window?.showErrorMessage) {
        this.vscode.window.showErrorMessage(`Screenshot capture failed: ${err.message}`);
      }
    } finally {
      this.isCapturing = false;
    }
  }
}
