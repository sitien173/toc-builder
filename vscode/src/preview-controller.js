import { validateInboundMessage } from './protocol.js';

export class PreviewController {
  constructor({
    panel,
    document,
    workspace,
    contentService,
    templateService,
    render,
    prepareWebviewHtml,
    debounceMs = 250,
    setTimeoutFn = setTimeout,
    clearTimeoutFn = clearTimeout,
  }) {
    this.panel = panel;
    this.document = document;
    this.workspace = workspace;
    this.contentService = contentService;
    this.templateService = templateService;
    this.render = render;
    this.prepareWebviewHtml = prepareWebviewHtml;
    this.debounceMs = debounceMs;
    this.setTimeoutFn = setTimeoutFn;
    this.clearTimeoutFn = clearTimeoutFn;

    this.revision = 0;
    this.generation = 0;
    this.disposed = false;
    this.debounceTimer = null;
    this.subscriptions = [];

    this.setupMessaging();
    this.setupWatchers();
  }

  setupMessaging() {
    if (this.panel?.webview?.onDidReceiveMessage) {
      const sub = this.panel.webview.onDidReceiveMessage((msg) => {
        this.handleInboundMessage(msg);
      });
      if (sub && typeof sub.dispose === 'function') {
        this.subscriptions.push(sub);
      }
    }
  }

  handleInboundMessage(msg) {
    if (this.disposed) return;
    if (!validateInboundMessage(msg)) return;
    if (msg.revision !== this.revision) return;
    // Handled valid inbound message for current revision
  }

  setupWatchers() {
    if (!this.workspace) return;

    if (typeof this.workspace.onDidChangeTextDocument === 'function') {
      const sub = this.workspace.onDidChangeTextDocument((e) => {
        if (this.disposed) return;
        if (e.document === this.document) {
          this.scheduleRefresh();
        }
      });
      if (sub && typeof sub.dispose === 'function') this.subscriptions.push(sub);
    }

    if (typeof this.workspace.onDidSaveTextDocument === 'function') {
      const sub = this.workspace.onDidSaveTextDocument((e) => {
        if (this.disposed) return;
        if (e.document === this.document) {
          this.forceRefresh();
        }
      });
      if (sub && typeof sub.dispose === 'function') this.subscriptions.push(sub);
    }

    if (typeof this.workspace.onDidChangeConfiguration === 'function') {
      const sub = this.workspace.onDidChangeConfiguration((e) => {
        if (this.disposed) return;
        if (e.affectsConfiguration('tocBuilder.templatePath', this.document.uri)) {
          this.forceRefresh();
        }
      });
      if (sub && typeof sub.dispose === 'function') this.subscriptions.push(sub);
    }
  }

  scheduleRefresh() {
    if (this.disposed) return;
    this.cancelDebounce();
    this.debounceTimer = this.setTimeoutFn(() => {
      this.debounceTimer = null;
      this.refresh();
    }, this.debounceMs);
  }

  forceRefresh() {
    if (this.disposed) return;
    this.cancelDebounce();
    return this.refresh();
  }

  cancelDebounce() {
    if (this.debounceTimer !== null) {
      this.clearTimeoutFn(this.debounceTimer);
      this.debounceTimer = null;
    }
  }

  async refresh() {
    if (this.disposed) return;

    const currentGeneration = ++this.generation;
    this.revision++;

    try {
      const templatePath = this.templateService.getTemplatePath(this.document.uri);
      const snapshot = await this.contentService.snapshot(this.document, templatePath);

      if (this.disposed || currentGeneration !== this.generation) {
        return;
      }

      const rendered = this.render(snapshot.template, snapshot.markdown);

      if (this.disposed || currentGeneration !== this.generation) {
        return;
      }

      const cspSource = this.panel.webview.cspSource || '';
      const baseUri = this.document.uri ? this.document.uri.toString() : '';
      const html = this.prepareWebviewHtml(rendered, {
        cspSource,
        baseUri,
        revision: this.revision,
        sourceUri: baseUri,
      });

      if (this.disposed || currentGeneration !== this.generation) {
        return;
      }

      this.panel.webview.html = html;
    } catch (err) {
      if (this.disposed || currentGeneration !== this.generation) {
        return;
      }
      // Leave previous valid preview unchanged on error
    }
  }

  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    this.cancelDebounce();
    this.generation++;
    for (const sub of this.subscriptions) {
      if (sub && typeof sub.dispose === 'function') {
        sub.dispose();
      }
    }
    this.subscriptions = [];
    this.panel = null;
    this.document = null;
  }
}
