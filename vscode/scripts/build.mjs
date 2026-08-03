import { build } from 'esbuild';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const vscodeDir = path.resolve(__dirname, '..');
const rootDir = path.resolve(vscodeDir, '..');

const templateSrc = path.join(rootDir, 'templates', 'default.html');
const distDir = path.join(vscodeDir, 'dist');
const templateDst = path.join(distDir, 'default.html');

await fs.mkdir(distDir, { recursive: true });

await build({
  entryPoints: [path.join(vscodeDir, 'src', 'extension.js')],
  outfile: path.join(distDir, 'extension.cjs'),
  bundle: true,
  platform: 'node',
  target: 'node20',
  format: 'cjs',
  external: ['vscode', 'playwright-core', '@mariozechner/clipboard'],
  sourcemap: true,
});

await fs.copyFile(templateSrc, templateDst);
