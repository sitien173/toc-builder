## Original User Request

Port the toc-builder CLI into a VSCode extension: webview preview with a
long Markdeep table of contents, custom templates, live refresh, and a
screenshot-to-clipboard command, reusing the shared `src/` modules.

## Phase

Add the screenshot command and release hardening.

## Tasks

- task-1: Implement the screenshot service.
- task-2: Add screenshot service tests.
- task-3: Harden message validation, URI escaping, and resource roots.
- task-4: Document the extension and add CI and release workflows.

## Context

Phase 1 scaffolded `vscode/` with the manifest, esbuild bundle, and
`vscode/src/extension.js`. Phase 2 added `protocol.js`, `webview-html.js`,
`content-service.js`, and `template-service.js`. Phase 3 added
`preview-controller.js`, `preview-manager.js`, `template-commands.js`, and
`activate.js`.

The shared `src/render.js` exports `render`, `renderForScreenshot`,
`validateTemplate`, `MARKDEEP_FOOTER`, and `SCREENSHOT_READY_MARKUP`.
`src/screenshot.js` exports `captureTocScreenshot`. `src/clipboard.js`
exports `copyImage`.

The `tocBuilder.screenshot` command is currently a no-op stub in
`activate.js`; phase 4 wires it to a real screenshot service.

The extension is plain JavaScript. `extension.js` is the only module that
imports the real `vscode`. Tests use `node:test` with a mocked VSCode API
and never launch a real extension host or browser.

## Files

- Create: `vscode/src/screenshot-service.js`
- Create: `vscode/test/screenshot-service.test.js`
- Create: `vscode/README.md`
- Modify: `vscode/src/preview-controller.js`
- Modify: `vscode/src/webview-html.js`
- Modify: `vscode/src/activate.js`
- Modify: `.github/workflows/ci.yml`
- Create: `.github/workflows/vscode-publish.yml`

## Done When

- The screenshot uses `renderForScreenshot`, not preview HTML.
- The screenshot uses a fresh `document.getText()` snapshot.
- The screenshot runs under progress UI.
- Concurrent captures for one controller are prevented.
- Clipboard failure keeps the PNG bytes and offers Save PNG.
- The bundle externalizes `playwright-core` and `@mariozechner/clipboard`.
- Local resource roots cover document, template, and extension resources.
- Non-ASCII URIs are escaped once.
- Untrusted workspaces are unsupported.
- The extension README documents usage, security, and risks.
- The CI job builds and tests the extension without affecting root `npm test`.
- The publish workflow requires a marketplace token and does not run in normal CI.
- Root `npm test` passes.

Fresh verification commands:

- `npm test --prefix vscode`
- `npm run build --prefix vscode`
- `npm exec --prefix vscode vsce ls`
- `npm test`

## Rules

Follow the supplied worker contract. Stay within scope. Maintain this phase's
`notes.md` and `journal.md`.

## Response Format

Return the ERP `# EXTERNAL RESPONSE` block and matching status line.
