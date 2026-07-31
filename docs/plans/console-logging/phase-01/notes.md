# Phase 1 — Decision Notes

## Task 1

### Decisions made
- none

### Spec deviations
- none

### Tradeoffs accepted
- none

### Assumptions
- none

### Follow-ups for human
- none

### Test evidence
- RED -> GREEN: Added verbose parsing and lifecycle tests; initial `node --test test/cli.test.js` failed on missing `--verbose` support, then passed after implementation.
- Root cause (bugfix only): none

## Task 2

### Decisions made
- Kept lifecycle logging inline in `src/cli.js` through the injected `warn` boundary.
- Attached wrapped operational failures as `CliError.cause` and printed originating stacks only in verbose mode.

### Spec deviations
- none

### Tradeoffs accepted
- none

### Assumptions
- `--verbose` present in the raw argv is sufficient to include stacks for argument failures.

### Follow-ups for human
- none

### Test evidence
- RED -> GREEN: Focused CLI tests pass with ordered regular and screenshot lifecycle messages, path-only stdout, and stack-free clipboard warnings.
- Root cause (bugfix only): none

## Task 3

### Decisions made
- Documented verbose placement, stderr routing, stdout compatibility, and fatal-stack behavior in README troubleshooting.

### Spec deviations
- none

### Tradeoffs accepted
- none

### Assumptions
- none

### Follow-ups for human
- none

### Test evidence
- RED -> GREEN: `node --test test/cli.test.js` and `npm test` both pass.
- Root cause (bugfix only): none
