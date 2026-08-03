## Original User Request

Port the toc-builder CLI into a VSCode extension: webview preview with a
long Markdeep table of contents, custom templates, live refresh, and a
screenshot-to-clipboard command, reusing the shared `src/` modules.

## Phase

Add the pure rendering and template resolution layer.

## Tasks

- task-1: Add protocol constants and the webview HTML adapter.
- task-2: Add the content snapshot service.
- task-3: Add the template resolution and validation service.
- task-4: Cover the layer with mocked-VSCode tests.

## Context

Phase 1 scaffolded `vscode/` with the manifest, esbuild bundle, and
`vscode/src/extension.js`. The shared `src/` modules remain unchanged.

`src/render.js` exports `render`, `renderForScreenshot`, `validateTemplate`,
`MARKDEEP_FOOTER`, and `SCREENSHOT_READY_MARKUP`. `src/clipboard.js` exports
`copyImage`. `src/screenshot.js` exports `captureTocScreenshot`.

The extension is plain JavaScript and its tests use `node:test` with a mocked
VSCode API. `extension.js` is the only module that may import the real
`vscode`; every other module takes injected dependencies.

The webview HTML adapter must add, to the shared render output:

- A CSP meta as the first element in the head. The CSP must include
  `webview.cspSource`, allow `default-src 'none'`, allow `script-src
  'unsafe-inline' https://morgan3d.github.io`, allow styles from `cspSource`
  and inline, allow images and fonts from `cspSource`, `data:`, and `https:`,
  and deny form, object, and frame.
- An optional `<base>` element for document-relative resources; the URI must
  keep a trailing slash.
- A bootstrap script that acquires the VSCode API, calls `setState`, and on
  load waits for `document.fonts.ready` and a `requestAnimationFrame` before
  posting a ready message with `revision` and `tocCount`.
- Safe JSON encoding of state with `<` escaped. A raw URI is never
  interpolated into a script block.
- Rejection or replacement of any template-supplied CSP.

The content service snapshots the in-memory document text and resolves the
active template through `workspace.fs`, decoding UTF-8 and validating with the
shared `validateTemplate`.

The template service resolves the resource-scoped `tocBuilder.templatePath`
configuration for the document URI, reads and validates candidate templates,
and commits configuration only after validation succeeds.

The layer must stay free of any dependency on the panel or webview lifecycle.

## Files

- Create: `vscode/src/protocol.js`
- Create: `vscode/src/webview-html.js`
- Create: `vscode/src/content-service.js`
- Create: `vscode/src/template-service.js`
- Create: `vscode/test/webview-html.test.js`
- Create: `vscode/test/content-service.test.js`
- Create: `vscode/test/template-service.test.js`

## Done When

- `protocol.js` exports versioned message shapes.
- Webview HTML keeps the shared render output for the body.
- The CSP is the first element in the head.
- The webview CSP includes `webview.cspSource`.
- The CSP allows only the remote Markdeep origin for scripts.
- A template-supplied CSP is rejected or replaced.
- The bootstrap acquires the VSCode API and posts a ready message on load.
- State is JSON-encoded with `<` escaped.
- Content snapshots use `document.getText()`.
- Templates resolve through `workspace.fs` and decode UTF-8.
- Invalid templates fail validation before any config write.
- Multi-root config resolves against the document URI.
- Tests never import the real `vscode` module.
- Root `npm test` passes unchanged.

Fresh verification commands:

- `npm test --prefix vscode`
- `npm test`

## Rules

Follow the supplied worker contract. Stay within scope. Maintain this phase's
`notes.md` and `journal.md`.

## Response Format

Return the ERP `# EXTERNAL RESPONSE` block and matching status line.
