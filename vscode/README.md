# TOC Builder VSCode Extension

Generate temporary Markdeep HTML table-of-contents previews for Markdown files directly inside VSCode.

## Features

- **Markdeep TOC Preview**: Render active Markdown document with a long Markdeep table of contents in a side-by-side webview.
- **Live Refresh**: Automatically refreshes the preview on document edits (debounced by 250 ms) and immediately on save.
- **Custom Templates**: Select custom HTML templates with `{{markdown}}` placeholders per workspace or document.
- **Screenshot to Clipboard**: Capture the rendered `.longTOC` element into a PNG image and copy it to system clipboard, or save to disk.

## Install

The repository ships a packaged extension as `vscode/toc-builder-<version>.vsix`.
Install it with the VSCode CLI:

```sh
code --install-extension toc-builder-0.1.1.vsix --force
```

Run the command from the `vscode/` directory, or pass the full path to the
`.vsix`. Alternatively, open the Extensions view, use the `...` menu, and
choose **Install from VSIX...**.

## Getting Started

Open a Markdown file and run **TOC Builder: Open Preview** from the Command
Palette (`Ctrl+Shift+P`), from the editor title bar, or from the editor
right-click context menu. The preview renders alongside the editor and
refreshes as you type.

## Commands

- `tocBuilder.preview` — Open TOC preview for the active Markdown file.
- `tocBuilder.refresh` — Refresh the current TOC preview.
- `tocBuilder.screenshot` — Capture rendered TOC to clipboard (or Save PNG fallback).
- `tocBuilder.setTemplate` — Select a custom HTML template.
- `tocBuilder.useDefaultTemplate` — Reset to default template.

Preview and screenshot commands also appear in the editor right-click context
menu for Markdown files, and refresh and screenshot appear in the preview
webview title bar.

## Configuration

- `tocBuilder.templatePath` (`string`, resource scope): Path to custom HTML template relative to the workspace folder, or absolute path.

## Security & Trusted Content Model

- Markdown content and custom HTML templates are treated as trusted local content.
- The webview enforces a Content Security Policy (CSP) allowing script execution only from inline scripts and remote Markdeep at `https://morgan3d.github.io`.
- Untrusted workspaces are unsupported (`capabilities.untrustedWorkspaces.supported: false`).

## Requirements

- Requires Desktop VSCode (`extensionKind: ["ui"]`).
- Screenshot feature requires a installed system browser (Chrome, Brave, Edge, or Firefox) and desktop clipboard integration (`wl-copy` or `xclip` on Linux).

## Building & Packaging

```sh
npm ci --prefix vscode
npm run build --prefix vscode
npx vsce package
```
