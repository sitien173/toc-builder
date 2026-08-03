# TOC VSCode Extension Design

## Purpose

`toc-vscode` ports the `toc-builder` CLI into a VSCode extension.

The extension renders the active Markdown document with a long Markdeep
table of contents inside a VSCode webview panel. It supports custom
templates, live refresh on edit and save, and a screenshot command that
captures the rendered table of contents to the desktop clipboard.

The extension reuses the shared modules in `src/` directly. It does not
duplicate render, screenshot, or clipboard logic.

## Package Layout

The extension lives in a separate `vscode/` package inside the same repo.
The root package stays unchanged: no npm workspace, no change to root
`npm test`, `npm ci`, package contents, or publishing.

```text
toc-builder/
├── package.json             # CLI package, unchanged
├── src/
│   ├── render.js            # shared, unchanged
│   ├── screenshot.js        # shared, unchanged
│   └── clipboard.js         # shared, unchanged
├── templates/default.html   # shared, unchanged
└── vscode/
    ├── package.json         # extension manifest
    ├── package-lock.json
    ├── .vscodeignore
    ├── scripts/build.mjs    # esbuild bundle
    ├── src/
    │   ├── extension.js           # thin entry, imports real vscode
    │   ├── activate.js            # command registration
    │   ├── preview-manager.js     # one reusable panel, lifecycle
    │   ├── preview-controller.js  # render, debounce, generation guard
    │   ├── content-service.js     # document and template snapshots
    │   ├── template-service.js    # config, picker, validation
    │   ├── webview-html.js        # CSP, base, bootstrap adapter
    │   ├── screenshot-service.js  # headless capture and clipboard
    │   └── protocol.js            # message protocol constants
    └── test/                # node:test, mocked vscode
```

## Package

- Extension name: `toc-builder`
- Module format: ESM source, bundled to CJS
- Build tool: esbuild, producing `vscode/dist/extension.cjs`
- Runtime dependency (externalized): `playwright-core`, `@mariozechner/clipboard`
- `vscode` is externalized and never bundled
- `capabilities.untrustedWorkspaces.supported: false`
- `extensionKind: ["ui"]`
- `main`: `dist/extension.cjs`

The bundle inlines the shared `src/render.js`, `src/screenshot.js`, and
`src/clipboard.js` sources. `templates/default.html` is copied into the
bundle or imported through a text loader. Shared source is never
committed as a duplicate file.

## Activation and Commands

`extension.js` is the only module that imports the real `vscode`.
Everything else is constructed with injected dependencies:

```js
createExtension({
  vscode,
  render,
  renderForScreenshot,
  captureTocScreenshot,
  copyImage,
  scheduler,
  clock,
});
```

`activate(context)` registers:

- `tocBuilder.preview` — create or reveal the panel, bind to active Markdown
- `tocBuilder.refresh` — refresh the bound document
- `tocBuilder.screenshot` — capture the bound or active document
- `tocBuilder.setTemplate` — pick and validate a template
- `tocBuilder.useDefaultTemplate` — clear the configured template
- `tocBuilder.preview` webview panel serializer

Refresh and screenshot commands appear in the webview title bar menu.
Native title-bar commands are preferred over injecting controls into
arbitrary custom templates.

## Panel Lifecycle

`PreviewManager` owns at most one reusable webview panel per VSCode window.

- Invoking `preview` on another Markdown file retargets the existing panel.
- `refresh` with no panel behaves like `preview`.
- `screenshot` uses the panel-bound document if a panel exists, otherwise
  the active Markdown editor.
- `retainContextWhenHidden: false`; a TOC preview is cheap to reconstruct.

On `panel.onDidDispose`:

- Cancel debounce timers.
- Dispose document, save, config, and template watchers.
- Invalidate the current render generation.
- Clear the panel and controller reference.
- Prevent outstanding async reads from assigning to the disposed webview.

The serializer persists state via `vscode.setState`:

```js
{ protocol: 1, sourceUri: document.uri.toString(), revision }
```

Restoration is best-effort: adopt the restored panel, validate
`sourceUri`, reopen the document with `workspace.openTextDocument`,
resolve the workspace template, and render a new page. Show an error
page if the document no longer exists.

## Content and Live Refresh

The panel binds to the document selected when `preview` runs. It does
not auto-follow the active editor; that keeps the preview and screenshot
targets predictable.

Content comes from the in-memory `TextDocument.getText()`, so unsaved
edits preview correctly. Reading from disk would make the preview
disagree with the editor.

Refresh triggers:

- `onDidChangeTextDocument` for the bound document: debounce 250 ms.
- `onDidSaveTextDocument` for the bound document: cancel the debounce,
  refresh immediately.
- Template document save or template file change: refresh immediately.
- Configuration change affecting `tocBuilder.templatePath`: re-resolve
  and refresh.
- Changes to unrelated documents are ignored.

A monotonically increasing generation counter guards every async render:

```js
const generation = ++this.generation;
const snapshot = await contentService.load(...);
if (this.disposed || generation !== this.generation) return;
panel.webview.html = ...;
```

This prevents slow template reads from overwriting newer content.

A refresh is implemented by assigning a complete new `webview.html`.
The new page's `ready` message is the refresh-complete notification.

## Webview HTML and CSP

Rendering pipeline:

```js
const rendered = render(templateText, markdownText);
const webviewHtml = prepareWebviewHtml(rendered, webview, context);
```

`prepareWebviewHtml` adds only webview-specific material:

- CSP meta as the first element in `<head>`.
- Optional `<base>` for document-relative resources; the URI must keep
  a trailing slash.
- The bootstrap ready script.
- Rejects or replaces any template-supplied CSP. Multiple CSP policies
  combine restrictively and are hard to diagnose.

The minimum workable CSP for CLI-parity trusted content:

```html
<meta
  http-equiv="Content-Security-Policy"
  content="
    default-src 'none';
    script-src 'unsafe-inline' https://morgan3d.github.io;
    style-src ${webview.cspSource} 'unsafe-inline';
    img-src ${webview.cspSource} data: https:;
    font-src ${webview.cspSource} data: https:;
    form-action 'none';
    object-src 'none';
    frame-src 'none';
  "
>
```

This allows the inline `markdeepOptions` footer, the remote Markdeep
script, Markdeep inline styles, and local and remote images and fonts.

Raw HTML remains unsanitized. This is a trusted-content-only feature,
same as the CLI. The screenshot path executes the same raw HTML in a
headless browser, so sanitizing only the preview would not make the
screenshot command safe. Untrusted workspaces are unsupported, and the
README documents that workspace trust is not a guarantee that an
individual Markdown or template file is harmless.

`localResourceRoots` is restricted to the document directory, the
template directory, and the extension resource directory.

The bootstrap script is inserted before custom template content, keeps
`acquireVsCodeApi()` inside a closure, calls `setState`, and on `load`
waits for `document.fonts.ready` and a `requestAnimationFrame` before
posting `ready`. State is JSON-encoded with `<` replaced by `<`;
a raw URI is never interpolated into a script block.

## Messaging Protocol

Versioned protocol, `protocol: 1`.

Webview to extension:

```js
{ protocol: 1, type: 'ready', revision, tocCount }
{ protocol: 1, type: 'requestRefresh', requestId, revision }
{ protocol: 1, type: 'requestScreenshot', requestId, revision }
```

Extension to webview:

```js
{
  protocol: 1,
  type: 'operationResult',
  requestId,
  operation: 'refresh' | 'screenshot',
  ok: true | false,
  revision,
  message,
}
```

Every inbound message is validated: exact protocol and type, primitive
field types, matching panel and revision. The webview never supplies
file paths, arbitrary command names, HTML, or shell arguments.

Raw Markdown or HTML is never sent over `postMessage`. Refresh is always
a full `webview.html` assignment. Messages targeting an old revision or
a disposed panel are ignored. A `postMessage` returning `false` means the
panel is disposed or not ready.

## Screenshot Command

The screenshot uses a separate headless render, not the live webview.
VSCode exposes no supported pixel-capture API for webviews.

```js
const snapshot = await contentService.snapshot(document);
const html = renderForScreenshot(snapshot.template, snapshot.markdown);
const png = await captureTocScreenshot(html);
await copyImage(png);
```

This directly reuses the tested shared behavior: waits for fonts and the
readiness marker, requires exactly one `.longTOC`, checks bounding-box
stability, and produces a real element screenshot.

The command:

- Bypasses any pending debounce.
- Builds a fresh snapshot from `document.getText()`.
- Does not rely on the last preview HTML.
- Runs under `window.withProgress`.
- Prevents concurrent captures for the same controller.
- On clipboard failure, keeps the PNG bytes and offers a Save PNG action.

Known trade-offs, documented:

- The Electron webview and the discovered browser may render slightly
  differently.
- Markdeep `/latest` can change between preview and screenshot loads.
- Webview CSP and base-URI adaptation are absent from the screenshot HTML.
- A browser must be installed on the extension host machine.
- Relative local CSS and images may behave differently under
  `page.setContent`.

`extensionKind: ["ui"]` keeps browser launch and clipboard access on the
user's local machine while document reads use `workspace.fs`, including
remote workspaces. The extension cannot work in browser-only VSCode
because Playwright and native clipboard require Node and a desktop.

The shared `copyImage` selects `wl-copy` or `xclip` by environment
variable and does not fall back if the selected tool is missing. That
error is surfaced rather than claiming the image was copied.

## Custom Templates

Resource-scoped setting:

```json
"tocBuilder.templatePath": {
  "type": "string",
  "default": "",
  "scope": "resource",
  "description": "Template path, relative to the Markdown file's workspace folder or absolute."
}
```

Multi-root workspaces resolve configuration with the Markdown URI:

```js
workspace.getConfiguration('tocBuilder', document.uri);
```

`setTemplate` flow:

1. Determine the workspace folder for the bound or active document.
2. Show an HTML file picker.
3. Read the file through `workspace.fs`.
4. Decode as UTF-8.
5. Call the shared `validateTemplate()`.
6. Update configuration only after validation succeeds.
7. Store a workspace-relative path when possible, else absolute.
8. Refresh the panel.

`useDefaultTemplate` clears the configuration and refreshes.

Read or validation failures:

- Show a concise `showErrorMessage`.
- Log the detailed error to an extension output channel.
- Leave the previous valid preview and configuration unchanged.
- Disable screenshot until a hand-edited invalid configuration is fixed.
- Never silently fall back to the default template; that hides
  configuration errors.

## Testing

The test suite uses Node's built-in test runner with a mocked VSCode
API. It does not use `@vscode/test-electron` and never launches a real
extension host or browser.

`extension.js` is the only module importing the real `vscode`. All other
modules take injected dependencies, so tests construct the extension
with a fake `vscode` plus real shared modules.

Mocked VSCode surface:

- `commands.registerCommand`
- `window.createWebviewPanel`
- `window.registerWebviewPanelSerializer`
- `window.activeTextEditor`
- `window.showOpenDialog`, `showErrorMessage`, `withProgress`
- `workspace.openTextDocument`
- `workspace.fs.readFile`
- `workspace.getConfiguration`
- document change, save, and configuration events
- `Uri`, `asWebviewUri`
- panel and webview `html`, `postMessage`, `onDidReceiveMessage`,
  `onDidDispose`

Small fake event emitters and disposable objects stand in for VSCode
objects; the full VSCode API is not reproduced.

Key tests:

- Preview uses unsaved `document.getText()`.
- Changes coalesce into one refresh after 250 ms.
- Save forces an immediate refresh.
- Unrelated documents are ignored.
- Stale async renders cannot replace newer content.
- Disposed panels receive no updates.
- Reinvoking preview reuses and retargets the panel.
- CSP contains `webview.cspSource` and only the intended remote origin.
- Non-ASCII URI values are escaped once, not double encoded.
- Invalid templates do not overwrite valid configuration.
- Screenshot uses `renderForScreenshot`, not preview HTML.
- Clipboard is called with the exact PNG buffer.
- Malformed and stale webview messages are ignored.
- Serializer restoration handles missing documents.

Root tests remain unchanged and run independently. A separate CI job
runs the extension suite:

```sh
npm ci --prefix vscode
npm test --prefix vscode
npm run build --prefix vscode
```

Root `npm test` never implicitly installs or tests the extension.

## Errors

- Preview and refresh failures keep the previous valid page where
  possible and show a concise message.
- Screenshot failures show a concise message and log details to an
  output channel.
- Template validation failures leave configuration unchanged.
- Browser or clipboard failures surface, never silently succeed.
- The serializer shows an error page for missing documents.

## Security

- Markdown and custom templates are trusted local content, same as the
  CLI. Raw HTML can execute in the webview.
- The webview only loads the remote Markdeep origin.
- `localResourceRoots` is restricted to document, template, and extension
  resources.
- The webview never supplies paths, commands, or HTML to the extension.
- Untrusted workspaces are unsupported.
- Remote Markdeep requires internet access and inherits the `/latest`
  supply-chain and compatibility risk from the CLI.

## Non-Goals

- One panel per document.
- Capturing the live webview for screenshots.
- Sending raw HTML over `postMessage`.
- Auto-following the active editor.
- `retainContextWhenHidden: true`.
- Duplicating shared modules.
- Converting the root package into an npm workspace.
- Browser-only VSCode support.
- A bundled offline Markdeep copy.

## Success Criteria

- `tocBuilder.preview` renders the active Markdown with a long TOC in a
  webview panel.
- Editing the document refreshes the preview after a 250 ms debounce.
- Saving the document refreshes the preview immediately.
- A custom template can be selected, validated, and applied.
- Invalid templates fail without changing the previous preview or config.
- `tocBuilder.screenshot` copies a PNG of the `.longTOC` element to the
  clipboard, or offers Save PNG on clipboard failure.
- The panel survives extension reload via the serializer.
- Root `npm test` and publishing are unchanged.
- The extension test suite runs under `node:test` with a mocked VSCode
  API and never launches a real browser or extension host.
