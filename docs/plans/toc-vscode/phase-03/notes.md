<!-- ccg-shared-version: 10.0.0 -->

# Phase 3 — Decision Notes

## Task 1

### Decisions made
- Created `vscode/src/preview-controller.js` managing document preview lifecycle, 250 ms edit debounce, immediate save refresh, configuration triggers, and a monotonic generation counter.
- Validated inbound webview messages against protocol version and revision.

### Spec deviations
- none

### Tradeoffs accepted
- none

### Assumptions
- none

### Follow-ups for human
- none

### Test evidence
- RED -> GREEN: `test/preview-controller.test.js` created; 4 tests verifying 250ms edit debounce, save cancellation, ignoring unrelated documents, and generation guard passed.

## Task 2

### Decisions made
- Created `vscode/src/preview-manager.js` managing at most one reusable `WebviewPanel` per window, retargeting across preview invocations with `retainContextWhenHidden: false`.
- Implemented `deserializeWebviewPanel` for best-effort state restoration or error page presentation if document is missing.

### Spec deviations
- none

### Tradeoffs accepted
- none

### Assumptions
- none

### Follow-ups for human
- none

### Test evidence
- RED -> GREEN: `test/preview-manager.test.js` created; 3 tests covering panel creation/reuse, disposal cleanup, and serializer restoration passed.

## Task 3

### Decisions made
- Created `vscode/src/template-commands.js` handling `setTemplate` (with HTML file dialog and validation error display) and `useDefaultTemplate`.
- Created `vscode/src/activate.js` wiring `createExtension` to register all 5 commands and the `tocBuilder.preview` webview panel serializer.
- Updated `vscode/src/extension.js` to read default template file and initialize extension instance.

### Spec deviations
- none

### Tradeoffs accepted
- none

### Assumptions
- none

### Follow-ups for human
- none

### Test evidence
- RED -> GREEN: `test/template-commands.test.js` and `test/activate.test.js` created; 4 tests covering command invocation, validation error handling, default template clearing, and command/serializer registration passed.

## Task 4

### Decisions made
- Verified lifecycle, debounce, generation guard, serializer restoration, template commands, and activation registration using mocked-VSCode node tests without launching real extension host or browser.

### Spec deviations
- none

### Tradeoffs accepted
- none

### Assumptions
- none

### Follow-ups for human
- none

### Test evidence
- RED -> GREEN: `npm test --prefix vscode` passed (24/24 tests pass), `npm run build --prefix vscode` succeeded, and `npm test` passed (33/33 tests pass).
