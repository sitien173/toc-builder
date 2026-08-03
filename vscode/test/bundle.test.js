import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const vscodeDir = path.resolve(__dirname, '..');

test('vscode package manifest specifications', async () => {
  const pkgJsonPath = path.join(vscodeDir, 'package.json');
  const pkg = JSON.parse(await fs.readFile(pkgJsonPath, 'utf8'));

  assert.equal(pkg.name, 'toc-builder');
  assert.equal(pkg.main, './dist/extension.cjs');
  assert.equal(pkg.capabilities?.untrustedWorkspaces?.supported, false);
  assert.deepEqual(pkg.extensionKind, ['ui']);
  assert.ok(pkg.engines?.vscode, 'engines.vscode must be pinned');

  const commands = pkg.contributes?.commands?.map(c => c.command);
  const expectedCommands = [
    'tocBuilder.preview',
    'tocBuilder.refresh',
    'tocBuilder.screenshot',
    'tocBuilder.setTemplate',
    'tocBuilder.useDefaultTemplate',
  ];
  assert.deepEqual(commands, expectedCommands);

  const templateConfig = pkg.contributes?.configuration?.properties?.['tocBuilder.templatePath'];
  assert.ok(templateConfig, 'tocBuilder.templatePath config must exist');
  assert.equal(templateConfig.scope, 'resource');

  const webviewTitleMenu = pkg.contributes?.menus?.['webview/title'];
  assert.ok(Array.isArray(webviewTitleMenu), 'webview/title menu must be an array');
  const menuCommands = webviewTitleMenu.map(m => m.command);
  assert.ok(menuCommands.includes('tocBuilder.refresh'));
  assert.ok(menuCommands.includes('tocBuilder.screenshot'));

  const editorContextMenu = pkg.contributes?.menus?.['editor/context'];
  assert.ok(Array.isArray(editorContextMenu), 'editor/context menu must be an array');
  const contextCommands = editorContextMenu.map(m => m.command);
  assert.ok(contextCommands.includes('tocBuilder.preview'));
  assert.ok(contextCommands.includes('tocBuilder.screenshot'));
  for (const entry of editorContextMenu) {
    assert.equal(entry.when, 'resourceLangId == markdown', 'context menu must be scoped to Markdown files');
  }
});

test('bundle output files exist', async () => {
  const distExtension = path.join(vscodeDir, 'dist', 'extension.cjs');
  const distTemplate = path.join(vscodeDir, 'dist', 'default.html');

  const extensionStat = await fs.stat(distExtension);
  assert.ok(extensionStat.size > 0, 'extension.cjs should exist and be non-empty');

  const templateStat = await fs.stat(distTemplate);
  assert.ok(templateStat.size > 0, 'default.html should exist and be non-empty');
});
