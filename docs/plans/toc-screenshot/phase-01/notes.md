# Phase 1 — Decision Notes

## Task 1

### Decisions made
- Pinned `puppeteer-core` 24.16.0 and `@puppeteer/browsers` 2.10.6 with exact package ranges.

### Spec deviations
- none

### Tradeoffs accepted
- none

### Assumptions
- Puppeteer's default cache location is appropriate for the pinned Chrome build.

### Follow-ups for human
- none

### Test evidence
- RED -> GREEN: `npm ls puppeteer-core @puppeteer/browsers --depth=0` passes with both exact versions.

## Task 2

### Decisions made
- Added a screenshot-only `document.documentElement.dataset.tocBuilderReady` sentinel after the unchanged parser-blocking Markdeep loader.

### Spec deviations
- none

### Tradeoffs accepted
- none

### Assumptions
- The parser-blocking external loader executes before the following sentinel script.

### Follow-ups for human
- none

### Test evidence
- RED -> GREEN: render test initially failed because `renderForScreenshot` was absent; it passes after adding the screenshot-only renderer. Normal render characterization remains passing.

## Task 3

### Decisions made
- Cached browser resolution is represented by one module-level promise; each capture launches headless Chrome without `--no-sandbox`, relying on Puppeteer to create a fresh profile.
- Browser installation, executable resolution, launch, and motion disabling accept injected boundaries for offline tests.

### Spec deviations
- none

### Tradeoffs accepted
- none

### Assumptions
- Puppeteer's omitted `userDataDir` creates an isolated temporary profile per launch.

### Follow-ups for human
- none

### Test evidence
- RED -> GREEN: screenshot module import and behavior tests initially failed because the module and exports were absent; focused capture tests pass with injected browser boundaries.

## Task 4

### Decisions made
- Readiness waits for the sentinel and `document.fonts.ready`, validates exactly one `.longTOC`, checks two bounding boxes across an animation frame, disables motion, captures with element `screenshot({type: 'png'})`, and closes in `finally`.

### Spec deviations
- none

### Tradeoffs accepted
- none

### Assumptions
- Cleanup errors should only surface when no primary capture error exists.

### Follow-ups for human
- none

### Test evidence
- RED -> GREEN: `node --test test/render.test.js test/screenshot.test.js` passes 11/11; `npm test` passes 20/20. Tests use fakes and perform no Chrome download, Markdeep access, filesystem output, or clipboard access.

## Fix — Cache Directory

### Decisions made
- Use the deterministic per-user Puppeteer cache path `join(homedir(), '.cache', 'puppeteer')` for both executable resolution and browser installation.

### Spec deviations
- none

### Tradeoffs accepted
- none

### Assumptions
- The user home directory is stable for the lifetime of a process and is the intended Puppeteer cache root.

### Follow-ups for human
- none

### Test evidence
- RED -> GREEN: the new cache-directory assertion initially failed because `PUPPETEER_CACHE_DIR` was absent; all requested screenshot, focused render, and full test commands now pass.
