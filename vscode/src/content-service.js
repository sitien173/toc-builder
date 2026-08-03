export class ContentService {
  constructor({ workspace, validateTemplate, defaultTemplateText }) {
    this.workspace = workspace;
    this.validateTemplate = validateTemplate;
    this.defaultTemplateText = defaultTemplateText;
  }

  async resolveTemplate(documentUri, templatePath) {
    if (!templatePath) {
      if (this.defaultTemplateText) {
        this.validateTemplate(this.defaultTemplateText);
        return this.defaultTemplateText;
      }
      throw new Error('No template path provided and no default template available');
    }

    let targetUri;
    if (typeof templatePath === 'object' && templatePath.scheme) {
      targetUri = templatePath;
    } else if (this.workspace.Uri && typeof templatePath === 'string') {
      if (templatePath.startsWith('file://')) {
        targetUri = this.workspace.Uri.parse(templatePath);
      } else if (templatePath.startsWith('/')) {
        targetUri = this.workspace.Uri.file(templatePath);
      } else {
        const folder = this.workspace.getWorkspaceFolder ? this.workspace.getWorkspaceFolder(documentUri) : null;
        if (folder) {
          targetUri = this.workspace.Uri.joinPath(folder.uri, templatePath);
        } else {
          targetUri = this.workspace.Uri.file(templatePath);
        }
      }
    } else {
      targetUri = templatePath;
    }

    const bytes = await this.workspace.fs.readFile(targetUri);
    const templateText = new TextDecoder('utf-8').decode(bytes);
    this.validateTemplate(templateText);
    return templateText;
  }

  async snapshot(document, templatePath) {
    if (!document || typeof document.getText !== 'function') {
      throw new TypeError('Invalid document object');
    }
    const markdown = document.getText();
    const template = await this.resolveTemplate(document.uri, templatePath);
    return {
      markdown,
      template,
      documentUri: document.uri,
    };
  }
}
