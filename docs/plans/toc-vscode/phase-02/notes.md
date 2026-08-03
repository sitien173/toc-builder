<!-- ccg-shared-version: 10.0.0 -->

# Phase 2 — Decision Notes

## Task 1

### Decisions made
- Created `vscode/src/protocol.js` exporting versioned protocol constants (`PROTOCOL_VERSION = 1`, `MESSAGE_TYPES`) and `validateInboundMessage`.
- Created `vscode/src/webview-html.js` exporting `prepareWebviewHtml` to strip template-supplied CSP metas, insert default strict CSP meta as the first element in `<head>`, format base tag with trailing slash, and inject bootstrap script with safe `<` JSON-encoded state.

### Spec deviations
- none

### Tradeoffs accepted
- none

### Assumptions
- none

### Follow-ups for human
- none

### Test evidence
- RED -> GREEN: `test/webview-html.test.js` created; fixed JS string escaping for `\u003c`, 5 tests passed cleanly.

## Task 2

### Decisions made
- Created `vscode/src/content-service.js` implementing `ContentService` with `snapshot` and `resolveTemplate` methods reading `document.getText()`, decoding UTF-8 through `workspace.fs`, and validating with `validateTemplate`.

### Spec deviations
- none

### Tradeoffs accepted
- none

### Assumptions
- none

### Follow-ups for human
- none

### Test evidence
- RED -> GREEN: `test/content-service.test.js` created; fixed mock workspace URI joinPath to produce proper `file:///` URLs, 3 tests passed.

## Task 3

### Decisions made
- Created `vscode/src/template-service.js` implementing `TemplateService` with `getTemplatePath`, `getTemplate`, `setTemplate`, and `clearTemplate`.
- Ensured configuration updates occur only after template reading and validation succeed, storing relative paths when inside workspace folders.

### Spec deviations
- none

### Tradeoffs accepted
- none

### Assumptions
- none

### Follow-ups for human
- none

### Test evidence
- RED -> GREEN: `test/template-service.test.js` created; 3 tests verifying multi-root resolution, failed validation blocking config update, and clearing templates passed.

## Task 4

### Decisions made
- Verified complete Phase 2 layer with mocked-VSCode node tests without importing real `vscode` module or launching browser/extension host.
- Verified build and root test suite isolation.

### Spec deviations
- none

### Tradeoffs accepted
- none

### Assumptions
- none

### Follow-ups for human
- none

### Test evidence
- RED -> GREEN: `npm test --prefix vscode` passed (13/13 tests pass), `npm run build --prefix vscode` succeeded, and `npm test` passed (33/33 tests pass).
