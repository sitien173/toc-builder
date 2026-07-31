# Phase 2 — Decision Notes

## Task 1

### Decisions made
- Wrapped `@mariozechner/clipboard` behind a lazy `copyImage` function and used its `setImageBinary` API.

### Spec deviations
- none

### Tradeoffs accepted
- Convert the Buffer to an equivalent numeric byte array required by the native API.

### Assumptions
- `setImageBinary` preserves the PNG byte values without re-encoding.

### Follow-ups for human
- none

### Test evidence
- RED -> GREEN: clipboard test initially failed because `src/clipboard.js` was absent; `test/clipboard.test.js` passes after adding the wrapper.

## Task 2

### Decisions made
- Added a boolean screenshot flag to parsed arguments and rejected duplicate occurrences with usage exit code 2.

### Spec deviations
- none

### Tradeoffs accepted
- none

### Assumptions
- The flag is valid anywhere among the existing positional/template arguments.

### Follow-ups for human
- none

### Test evidence
- RED -> GREEN: parser tests initially failed because screenshot metadata was absent; all argument tests pass with both template orderings.

## Task 3

### Decisions made
- Reused one UUID for exclusive HTML and PNG paths; HTML is printed and opened before capture, and PNG is printed only after exclusive write succeeds.
- Screenshot and clipboard implementations are dynamically imported only after the HTML browser-open step in flagged execution.

### Spec deviations
- none

### Tradeoffs accepted
- none

### Assumptions
- Existing default-browser behavior remains authoritative for the HTML stage.

### Follow-ups for human
- none

### Test evidence
- RED -> GREEN: workflow tests initially failed because screenshot orchestration was absent; success, ordering, naming, and retained-output coverage now passes.

## Task 4

### Decisions made
- Clipboard errors are warning-only and receive the PNG path; capture and PNG-write errors remain operational failures.
- Injection points are limited to capture, clipboard copy, browser opening, printing, and warnings for offline tests.

### Spec deviations
- none

### Tradeoffs accepted
- none

### Assumptions
- Tests must not invoke the native clipboard or browser because all flagged boundaries are injected.

### Follow-ups for human
- none

### Test evidence
- RED -> GREEN: `node --test test/cli.test.js test/clipboard.test.js` passes 13/13; `npm ls @mariozechner/clipboard --depth=0` resolves 0.3.9; `npm test` passes 24/24.
