import { PreviewController } from './preview-controller.js';

export class PreviewManager {
  constructor({
    vscode,
    contentService,
    templateService,
    render,
    prepareWebviewHtml,
    extensionUri,
  }) {
    this.vscode = vscode;
    this.contentService = contentService;
    this.templateService = templateService;
    this.render = render;
    this.prepareWebviewHtml = prepareWebviewHtml;
    this.extensionUri = extensionUri || null;

    this.activePanel = null;
    this.activeController = null;
  }

  getLocalResourceRoots(document) {
    const roots = [];
    if (this.extensionUri) {
      roots.push(this.extensionUri);
    }
    if (this.vscode.Uri?.file) {
      if (document?.uri?.path) {
        const docDir = document.uri.path.substring(0, document.uri.path.lastIndexOf('/'));
        roots.push(this.vscode.Uri.file(docDir));
      }
      const templatePath = this.templateService?.getTemplatePath?.(document?.uri);
      if (templatePath && typeof templatePath === 'string') {
        const tDir = templatePath.substring(0, templatePath.lastIndexOf('/'));
        if (tDir) roots.push(this.vscode.Uri.file(tDir));
      }
    }
    return roots;
  }

  async showPreview(targetDocument, viewColumn) {
    let document = targetDocument;

    if (!document && this.vscode.window.activeTextEditor) {
      document = this.vscode.window.activeTextEditor.document;
    }

    if (!document) {
      if (this.vscode.window.showWarningMessage) {
        this.vscode.window.showWarningMessage('No active document to preview.');
      }
      return;
    }

    const column = viewColumn || (this.vscode.ViewColumn ? this.vscode.ViewColumn.Beside : 2);

    if (this.activePanel) {
      this.activePanel.reveal(column);
      this.retargetController(document);
      await this.activeController.forceRefresh();
      return;
    }

    const localResourceRoots = this.getLocalResourceRoots(document);

    const panel = this.vscode.window.createWebviewPanel(
      'tocBuilder.preview',
      'TOC Preview',
      column,
      {
        enableScripts: true,
        retainContextWhenHidden: false,
        localResourceRoots,
      }
    );

    this.setupPanel(panel, document);
    await this.activeController.forceRefresh();
  }

  setupPanel(panel, document) {
    this.activePanel = panel;
    this.activeController = new PreviewController({
      panel,
      document,
      workspace: this.vscode.workspace,
      contentService: this.contentService,
      templateService: this.templateService,
      render: this.render,
      prepareWebviewHtml: this.prepareWebviewHtml,
    });

    panel.onDidDispose(() => {
      this.disposeActiveController();
    });
  }

  retargetController(newDocument) {
    if (this.activeController) {
      this.activeController.dispose();
    }
    this.activeController = new PreviewController({
      panel: this.activePanel,
      document: newDocument,
      workspace: this.vscode.workspace,
      contentService: this.contentService,
      templateService: this.templateService,
      render: this.render,
      prepareWebviewHtml: this.prepareWebviewHtml,
    });
  }

  async refreshPreview() {
    if (this.activeController) {
      await this.activeController.forceRefresh();
    } else {
      await this.showPreview();
    }
  }

  async deserializeWebviewPanel(panel, state) {
    if (!state || state.protocol !== 1 || !state.sourceUri) {
      panel.webview.html = '<html><body><h1>Error restoring preview</h1><p>Invalid session state.</p></body></html>';
      return;
    }

    try {
      const uri = this.vscode.Uri.parse(state.sourceUri);
      const document = await this.vscode.workspace.openTextDocument(uri);
      this.setupPanel(panel, document);
      await this.activeController.forceRefresh();
    } catch (err) {
      panel.webview.html = '<html><body><h1>Error loading preview</h1><p>Document no longer exists.</p></body></html>';
    }
  }

  disposeActiveController() {
    if (this.activeController) {
      this.activeController.dispose();
      this.activeController = null;
    }
    this.activePanel = null;
  }
}
