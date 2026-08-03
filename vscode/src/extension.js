import * as vscode from 'vscode';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { render, renderForScreenshot } from '../../src/render.js';
import { captureTocScreenshot } from '../../src/screenshot.js';
import { copyImage } from '../../src/clipboard.js';
import { createExtension } from './activate.js';

function getDefaultTemplateText() {
  try {
    const dir = typeof __dirname !== 'undefined'
      ? __dirname
      : path.dirname(fileURLToPath(import.meta.url));
    const templatePath = path.join(dir, 'default.html');
    if (fs.existsSync(templatePath)) {
      return fs.readFileSync(templatePath, 'utf8');
    }
  } catch (err) {
    // Fallback default template if file read fails
  }
  return '<!doctype html><html><head><meta charset="utf-8"></head><body>{{markdown}}</body></html>';
}

let extensionInstance = null;

export function activate(context) {
  const defaultTemplateText = getDefaultTemplateText();
  extensionInstance = createExtension({
    vscode,
    render,
    renderForScreenshot,
    captureTocScreenshot,
    copyImage,
    defaultTemplateText,
  });
  extensionInstance.activate(context);
}

export function deactivate() {}
