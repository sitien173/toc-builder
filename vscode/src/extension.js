import * as vscode from 'vscode';
import { render, renderForScreenshot } from '../../src/render.js';
import { captureTocScreenshot } from '../../src/screenshot.js';
import { copyImage } from '../../src/clipboard.js';

export function activate(context) {
  const commands = [
    vscode.commands.registerCommand('tocBuilder.preview', () => {}),
    vscode.commands.registerCommand('tocBuilder.refresh', () => {}),
    vscode.commands.registerCommand('tocBuilder.screenshot', () => {}),
    vscode.commands.registerCommand('tocBuilder.setTemplate', () => {}),
    vscode.commands.registerCommand('tocBuilder.useDefaultTemplate', () => {}),
  ];

  context.subscriptions.push(...commands);

  return {
    render,
    renderForScreenshot,
    captureTocScreenshot,
    copyImage,
  };
}

export function deactivate() {}
