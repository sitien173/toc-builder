import test from 'node:test';
import assert from 'node:assert/strict';
import { ContentService } from '../src/content-service.js';
import { validateTemplate } from '../../src/render.js';

function createMockWorkspace(files = {}) {
  return {
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
  };
}

const defaultTemplateText = '<html><head></head><body>{{markdown}}</body></html>';

test('ContentService snapshot uses document.getText() and default template', async () => {
  const mockWorkspace = createMockWorkspace();
  const service = new ContentService({
    workspace: mockWorkspace,
    validateTemplate,
    defaultTemplateText,
  });

  const mockDocument = {
    uri: { scheme: 'file', path: '/workspace/project/doc.md', toString: () => 'file:///workspace/project/doc.md' },
    getText: () => '# Header 1\nContent text',
  };

  const snap = await service.snapshot(mockDocument, '');
  assert.equal(snap.markdown, '# Header 1\nContent text');
  assert.equal(snap.template, defaultTemplateText);
  assert.equal(snap.documentUri, mockDocument.uri);
});

test('ContentService resolves relative template through workspace.fs and UTF-8 decodes', async () => {
  const validCustomTemplate = '<html><head></head><body><h1>Custom</h1>{{markdown}}</body></html>';
  const mockWorkspace = createMockWorkspace({
    'file:///workspace/project/templates/custom.html': validCustomTemplate,
  });

  const service = new ContentService({
    workspace: mockWorkspace,
    validateTemplate,
    defaultTemplateText,
  });

  const mockDocument = {
    uri: { scheme: 'file', path: '/workspace/project/doc.md', toString: () => 'file:///workspace/project/doc.md' },
    getText: () => 'Markdown content',
  };

  const snap = await service.snapshot(mockDocument, 'templates/custom.html');
  assert.equal(snap.template, validCustomTemplate);
});

test('ContentService rejects invalid template during snapshot before returning', async () => {
  const invalidTemplate = '<html><head></head><body>No placeholder</body></html>';
  const mockWorkspace = createMockWorkspace({
    'file:///workspace/project/bad.html': invalidTemplate,
  });

  const service = new ContentService({
    workspace: mockWorkspace,
    validateTemplate,
    defaultTemplateText,
  });

  const mockDocument = {
    uri: { scheme: 'file', path: '/workspace/project/doc.md', toString: () => 'file:///workspace/project/doc.md' },
    getText: () => 'Markdown content',
  };

  await assert.rejects(
    async () => service.snapshot(mockDocument, 'bad.html'),
    /Template must contain exactly one {{markdown}} placeholder/
  );
});
