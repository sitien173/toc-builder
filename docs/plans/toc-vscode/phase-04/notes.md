<!-- ccg-shared-version: 10.0.0 -->

# Phase 4 — Decision Notes

## Task 1

### Decisions made
- Created `vscode/src/screenshot-service.js` implementing `ScreenshotService` with progress UI (`window.withProgress`), concurrency guard (`isCapturing`), fresh `document.getText()` snapshot, `renderForScreenshot`, headless capture (`captureTocScreenshot`), and clipboard fallback ("Save PNG" action with `workspace.fs.writeFile`).

### Spec deviations
- none

### Tradeoffs accepted
- none

### Assumptions
- none

### Follow-ups for human
- none

### Test evidence
- RED -> GREEN: `test/screenshot-service.test.js` created; tests covering execution under progress UI, preventing concurrent captures, and clipboard fallback passed.

## Task 2

### Decisions made
- Covered `ScreenshotService` with unit tests covering progress notification, clipboard copy success/failure paths, and save PNG fallback.

### Spec deviations
- none

### Tradeoffs accepted
- none

### Assumptions
- none

### Follow-ups for human
- none

### Test evidence
- RED -> GREEN: 3 tests in `test/screenshot-service.test.js` passed cleanly.

## Task 3

### Decisions made
- Hardened `safeEncodeURI` in `vscode/src/webview-html.js` to escape non-ASCII URI characters without stripping or double-encoding.
- Hardened `localResourceRoots` in `vscode/src/preview-manager.js` to cover document, template, and extension directories.
- Wired `ScreenshotService` into `vscode/src/activate.js` for the `tocBuilder.screenshot` command.

### Spec deviations
- none

### Tradeoffs accepted
- none

### Assumptions
- none

### Follow-ups for human
- none

### Test evidence
- RED -> GREEN: Added non-ASCII URI encoding test in `test/webview-html.test.js`; all 28 vscode tests passed.

## Task 4

### Decisions made
- Created `vscode/README.md` documenting usage, configuration, CSP security model, requirements (`extensionKind: ["ui"]`), and packaging instructions.
- Modified `.github/workflows/ci.yml` adding a dedicated `vscode` job running `npm ci`, `npm test`, and `npm run build` for the extension package.
- Created `.github/workflows/vscode-publish.yml` for manual/release marketplace publishing.

### Spec deviations
- none

### Tradeoffs accepted
- none

### Assumptions
- none

### Follow-ups for human
- none

### Test evidence
- RED -> GREEN: Fresh verification checks passed: `npm test --prefix vscode` (28/28 tests pass), `npm run build --prefix vscode` succeeded, `npx vsce ls` listed package contents without error, and root `npm test` passed (33/33 tests pass).
