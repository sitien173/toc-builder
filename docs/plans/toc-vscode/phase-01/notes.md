<!-- ccg-shared-version: 10.0.0 -->

# Phase 1 — Decision Notes

## Task 1

### Decisions made
- Created `vscode/package.json` with commands (`tocBuilder.preview`, `tocBuilder.refresh`, `tocBuilder.screenshot`, `tocBuilder.setTemplate`, `tocBuilder.useDefaultTemplate`), title menu contributions, `tocBuilder.templatePath` setting, `untrustedWorkspaces` disabled, `extensionKind: ["ui"]`, and pinned `engines.vscode`.
- Generated `vscode/package-lock.json` via npm install and added `vscode/.vscodeignore`.

### Spec deviations
- none

### Tradeoffs accepted
- none

### Assumptions
- none

### Follow-ups for human
- none

### Test evidence
- RED -> GREEN: `npm ci --prefix vscode` completed successfully and lockfile generated.

## Task 2

### Decisions made
- Created `vscode/scripts/build.mjs` using esbuild to bundle `vscode/src/extension.js` into CJS output at `vscode/dist/extension.cjs`.
- Externalized `vscode`, `playwright-core`, and `@mariozechner/clipboard`.
- Inlined shared `src/render.js`, `src/screenshot.js`, and `src/clipboard.js` without copying files into `vscode/src/`.
- Copied `templates/default.html` into `vscode/dist/default.html`.

### Spec deviations
- none

### Tradeoffs accepted
- none

### Assumptions
- none

### Follow-ups for human
- none

### Test evidence
- RED -> GREEN: Initial build failed with missing `renderForScreenshot` import in screenshot module, fixed import to `src/render.js`, then `npm run build --prefix vscode` passed producing `vscode/dist/extension.cjs` and `vscode/dist/default.html`.

## Task 3

### Decisions made
- Added `vscode/src/extension.js` exporting `activate` and `deactivate`.
- Registered disposables for all 5 commands in `activate(context)`.

### Spec deviations
- none

### Tradeoffs accepted
- none

### Assumptions
- none

### Follow-ups for human
- none

### Test evidence
- RED -> GREEN: Bundle built cleanly and exported `activate` and `deactivate` functions in CJS format.

## Task 4

### Decisions made
- Added `vscode/test/bundle.test.js` to programmatically verify `package.json` manifest requirements and bundle output artifacts.
- Ran fresh verification checks across `vscode/` package and root test suite.

### Spec deviations
- none

### Tradeoffs accepted
- none

### Assumptions
- none

### Follow-ups for human
- none

### Test evidence
- RED -> GREEN: `npm test --prefix vscode` passed (2/2 tests), `ls vscode/dist` verified files exist, and root `npm test` passed (33/33 tests).
