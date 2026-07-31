# Phase 3 — Decision Notes

## Task 1

### Decisions made
- Added a local HTML fixture with one fixed-size `.longTOC` and an explicit readiness sentinel.
- Verified PNG signature and IHDR dimensions rather than pixel-perfect output.

### Spec deviations
- none

### Tradeoffs accepted
- The integration test resolves the pinned Chrome build and may populate the Puppeteer cache.

### Assumptions
- Element screenshot dimensions match the fixture's CSS content box.

### Follow-ups for human
- none

### Test evidence
- RED -> GREEN: `npm run test:screenshot-integration` was initially unavailable before the script and fixture were added; it now passes with a 240x80 PNG.

## Task 2

### Decisions made
- Added a dedicated Node.js 20 screenshot integration job across Ubuntu, macOS, and Windows.
- Kept routine tests explicit and browser-free so Node's test discovery does not execute integration or canary files.

### Spec deviations
- none

### Tradeoffs accepted
- Browser integration is separate from the normal test job and downloads/uses Chrome only in that job.

### Assumptions
- GitHub-hosted runners provide the Chromium sandbox prerequisites for Puppeteer.

### Follow-ups for human
- Real clipboard smoke testing remains an explicit manual desktop operation; CI never touches the system clipboard.

### Test evidence
- RED -> GREEN: routine `npm test` initially auto-discovered browser/canary files; its explicit test list now passes 24/24 without browser integration, while the dedicated integration command passes separately.

## Task 3

### Decisions made
- Added a scheduled and manually dispatched canary job with job-level `continue-on-error`.
- Canary uses remote Markdeep `latest`; ordinary CI does not.

### Spec deviations
- none

### Tradeoffs accepted
- Canary failures are visible but intentionally non-blocking.

### Assumptions
- Remote network access is available on the scheduled GitHub runner.

### Follow-ups for human
- none

### Test evidence
- RED -> GREEN: `npm run test:markdeep-canary` passes against the current remote Markdeep latest build.

## Task 4

### Decisions made
- Documented screenshot commands, output ordering/naming, first-run Chrome download, retained files, clipboard requirements and warnings, trusted duplicate execution, remote compatibility risk, and troubleshooting.
- Confirmed package contents include all runtime source modules and dependency metadata remains package-managed.

### Spec deviations
- none

### Tradeoffs accepted
- none

### Assumptions
- No publishing or release automation is required for this phase.

### Follow-ups for human
- none

### Test evidence
- RED -> GREEN: `npm pack --dry-run` lists `src/clipboard.js` and `src/screenshot.js`; `npm ls --depth=0` resolves all dependencies; all phase verification commands pass.

## Continuation — Explicit Clipboard Smoke Path

### Decisions made
- Added `npm run test:clipboard-smoke` as a manual-only command using a valid 1x1 PNG and the packaged clipboard wrapper.

### Spec deviations
- none

### Tradeoffs accepted
- none

### Assumptions
- The operator understands that the smoke command changes the real desktop clipboard.

### Follow-ups for human
- Run the smoke command only on a desktop session when validating native clipboard integration; it was intentionally not run here.

### Test evidence
- `npm test` passes 24/24; `npm pack --dry-run` includes the runtime modules; `npm ls --depth=0` resolves all dependencies. The smoke command was not run by request.
