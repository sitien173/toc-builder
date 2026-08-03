import test from 'node:test';
import assert from 'node:assert/strict';
import { TemplateService } from '../src/template-service.js';
import { ContentService } from '../src/content-service.js';
import { validateTemplate } from '../../src/render.js';

function createMockWorkspace({ files = {}, config = {} } = {}) {
  const configStore = { ...config };
  let updateCalled = false;

  return {
    get updateCalled() { return updateCalled; },
    configStore,
    Uri: {
      file: (p) => ({ scheme: 'file', path: p, toString: () => `file://${p}` }),
      parse: (str) => ({ scheme: 'file', path: str.replace('file://', ''), toString: () => str }),
      joinPath: (baseUri, ...segments) => {
        const newPath = `${baseUri.path}/${segments.join('/')}`.replace(/\/+/g, '/');
        return {
          scheme: baseUri.scheme,
          path: newPath,
          toString: () => `${baseUri.scheme}://${newPath}`,
        };
      },
    },
    fs: {
      readFile: async (uri) => {
        const uriStr = uri.toString();
        const content = files[uriStr] ?? files[uri.path];
        if (content === undefined) {
          throw new Error(`File not found: ${uriStr}`);
        }
        return new TextEncoder().encode(content);
      },
    },
    getWorkspaceFolder: (documentUri) => {
      return {
        uri: { scheme: 'file', path: '/workspace/project', toString: () => 'file:///workspace/project' },
        name: 'project',
      };
    },
    getConfiguration: (section, scopeUri) => {
      assert.equal(section, 'tocBuilder');
      const scopeKey = scopeUri ? scopeUri.toString() : 'global';
      return {
        get: (key, defaultValue) => {
          const val = configStore[`${scopeKey}:${key}`] ?? configStore[key];
          return val !== undefined ? val : defaultValue;
        },
        update: async (key, value) => {
          updateCalled = true;
          configStore[`${scopeKey}:${key}`] = value;
          configStore[key] = value;
        },
      };
    },
  };
}

test('TemplateService resolves multi-root config with documentUri', () => {
  const doc1 = { scheme: 'file', path: '/w1/doc.md', toString: () => 'file:///w1/doc.md' };
  const doc2 = { scheme: 'file', path: '/w2/doc.md', toString: () => 'file:///w2/doc.md' };

  const mockWorkspace = createMockWorkspace({
    config: {
      'file:///w1/doc.md:templatePath': 'templates/t1.html',
      'file:///w2/doc.md:templatePath': 'templates/t2.html',
    },
  });

  const contentService = new ContentService({
    workspace: mockWorkspace,
    validateTemplate,
    defaultTemplateText: '<html><head></head><body>{{markdown}}</body></html>',
  });

  const service = new TemplateService({
    workspace: mockWorkspace,
    contentService,
    validateTemplate,
  });

  assert.equal(service.getTemplatePath(doc1), 'templates/t1.html');
  assert.equal(service.getTemplatePath(doc2), 'templates/t2.html');
});

test('TemplateService setTemplate commits config ONLY after validation succeeds', async () => {
  const validTemplate = '<html><head></head><body>Valid {{markdown}}</body></html>';
  const invalidTemplate = '<html><head></head><body>Invalid</body></html>';

  const mockWorkspace = createMockWorkspace({
    files: {
      'file:///workspace/project/valid.html': validTemplate,
      'file:///workspace/project/invalid.html': invalidTemplate,
    },
  });

  const contentService = new ContentService({
    workspace: mockWorkspace,
    validateTemplate,
    defaultTemplateText: '<html><head></head><body>{{markdown}}</body></html>',
  });

  const service = new TemplateService({
    workspace: mockWorkspace,
    contentService,
    validateTemplate,
  });

  const docUri = { scheme: 'file', path: '/workspace/project/doc.md', toString: () => 'file:///workspace/project/doc.md' };

  // Fail case
  await assert.rejects(
    async () => service.setTemplate(docUri, 'invalid.html'),
    /Template must contain exactly one {{markdown}} placeholder/
  );
  assert.equal(mockWorkspace.updateCalled, false, 'Config must NOT be updated on invalid template');

  // Success case
  await service.setTemplate(docUri, 'valid.html');
  assert.equal(mockWorkspace.updateCalled, true);
  assert.equal(service.getTemplatePath(docUri), 'valid.html');
});

test('TemplateService clearTemplate clears configuration path', async () => {
  const mockWorkspace = createMockWorkspace({
    config: { templatePath: 'custom.html' },
  });

  const contentService = new ContentService({
    workspace: mockWorkspace,
    validateTemplate,
    defaultTemplateText: '<html><head></head><body>{{markdown}}</body></html>',
  });

  const service = new TemplateService({
    workspace: mockWorkspace,
    contentService,
    validateTemplate,
  });

  const docUri = { scheme: 'file', path: '/workspace/project/doc.md', toString: () => 'file:///workspace/project/doc.md' };

  assert.equal(service.getTemplatePath(docUri), 'custom.html');
  await service.clearTemplate(docUri);
  assert.equal(service.getTemplatePath(docUri), '');
});
