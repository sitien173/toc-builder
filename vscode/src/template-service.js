export class TemplateService {
  constructor({ workspace, contentService, validateTemplate }) {
    this.workspace = workspace;
    this.contentService = contentService;
    this.validateTemplate = validateTemplate;
  }

  getTemplatePath(documentUri) {
    const config = this.workspace.getConfiguration('tocBuilder', documentUri);
    return config.get('templatePath') || '';
  }

  async getTemplate(documentUri) {
    const templatePath = this.getTemplatePath(documentUri);
    return this.contentService.resolveTemplate(documentUri, templatePath);
  }

  async setTemplate(documentUri, candidatePathOrUri, ConfigurationTarget) {
    const templateText = await this.contentService.resolveTemplate(documentUri, candidatePathOrUri);
    this.validateTemplate(templateText);

    let storedPath = candidatePathOrUri;
    if (typeof candidatePathOrUri === 'object' && candidatePathOrUri.path) {
      storedPath = candidatePathOrUri.path;
    }

    const folder = this.workspace.getWorkspaceFolder ? this.workspace.getWorkspaceFolder(documentUri) : null;
    if (folder && typeof storedPath === 'string') {
      const folderPath = folder.uri.path.endsWith('/') ? folder.uri.path : `${folder.uri.path}/`;
      if (storedPath.startsWith(folderPath)) {
        storedPath = storedPath.slice(folderPath.length);
      }
    }

    const config = this.workspace.getConfiguration('tocBuilder', documentUri);
    const target = ConfigurationTarget !== undefined ? ConfigurationTarget : 1; // ConfigurationTarget.Workspace = 1
    await config.update('templatePath', storedPath, target);
    return templateText;
  }

  async clearTemplate(documentUri, ConfigurationTarget) {
    const config = this.workspace.getConfiguration('tocBuilder', documentUri);
    const target = ConfigurationTarget !== undefined ? ConfigurationTarget : 1;
    await config.update('templatePath', '', target);
  }
}
