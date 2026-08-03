## Original User Request

Port the toc-builder CLI into a VSCode extension: webview preview with a
long Markdeep table of contents, custom templates, live refresh, and a
screenshot-to-clipboard command, reusing the shared `src/` modules.

## Phase

Add the preview panel controller and command wiring.

## Tasks

- task-1: Implement the preview controller with debounce, generation guard, and refresh triggers.
- task-2: Implement the reusable panel manager and disposal lifecycle.
- task-3: Implement the template commands and command and serializer registration.
- task-4: Cover lifecycle, debounce, generation, template, and messaging with tests.

## Context

Phase 1 scaffolded `vscode/` with the manifest, esbuild bundle, and
`vscode/src/extension.js`. Phase 2 added `protocol.js`, `webview-html.js`,
`content-service.js`, and `template-service.js`.

The shared `src/render.js` exports `render`, `renderForScreenshot`,
`validateTemplate`, `MARKDEEP_FOOTER`, and `SCREENSHOT_READY_MARKUP`.

The extension is plain JavaScript. `extension.js` is the only module that
imports the real `vscode`; every other module takes injected dependencies.
Tests use `node:test` with a mocked VSCode API and never launch a real
extension host or browser.

The five commands must register on activation:

- `tocBuilder.preview`
- `tocBuilder.refresh`
- `tocBuilder.screenshot`
- `tocBuilder.setTemplate`
- `tocBuilder.useDefaultTemplate`

Plus the `tocBuilder.preview` webview panel serializer.

## Files

- Create: `vscode/src/preview-controller.js`
- Create: `vscode/src/preview-manager.js`
- Create: `vscode/src/template-commands.js`
- Create: `vscode/src/activate.js`
- Modify: `vscode/src/extension.js`
- Create: `vscode/test/preview-controller.test.js`
- Create: `vscode/test/preview-manager.test.js`
- Create: `vscode/test/template-commands.test.js`
- Create: `vscode/test/activate.test.js`

## Done When

- One panel is reused and retargeted across preview invocations.
- The panel binds to the document selected at preview time.
- The panel never auto-follows the active editor.
- Edits coalesce into one refresh after 250 ms.
- Save cancels the debounce and refreshes immediately.
- Unrelated document changes are ignored.
- Stale async renders never overwrite newer content.
- Disposed panels receive no updates.
- The serializer restores state best-effort and shows an error page for missing documents.
- Inbound messages are validated and stale revisions ignored.
- `retainContextWhenHidden` is false.
- Invalid templates leave the previous preview and configuration unchanged.
- All five commands and the serializer register on activation.
- Root `npm test` passes unchanged.

Fresh verification commands:

- `npm test --prefix vscode`
- `npm run build --prefix vscode`
- `npm test`

## Rules

Follow the supplied worker contract. Stay within scope. Maintain this phase's
`notes.md` and `journal.md`.

## Response Format

Return the ERP `# EXTERNAL RESPONSE` block and matching status line.
