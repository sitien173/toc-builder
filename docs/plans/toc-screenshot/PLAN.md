# TOC Screenshot Implementation Plan

## Goal

Add optional TOC element screenshots to `toc-builder`.

The `--screenshot` flag creates temporary PNG output.
It also copies PNG bytes into the clipboard.

Unflagged commands retain their current behavior.

## Design Source

Read `docs/designs/toc-screenshot.md` before every phase.

## Route

- Sequence: implement, verify, audit, then review.
- Consultation: completed during design.
- Implement profile: resolve during execution.
- Review profile: resolve during execution.
- Context key: `toc-screenshot`.
- Done when every fresh phase check passes.

## Global Constraints

- Keep Node.js 20 as the minimum version.
- Preserve existing behavior without `--screenshot`.
- Keep normal generated HTML unchanged.
- Load screenshot dependencies only when requested.
- Keep Chromium's sandbox enabled.
- Use one UUID for related output files.
- Write both generated files exclusively.
- Keep clipboard failures warning-only.
- Retain every successfully created output file.
- Keep routine tests offline and browser-free.
- Never touch a real clipboard during routine tests.
- Do not add unrelated CLI features.

### Phase 1: Capture Rendered TOC Elements

**Task Guide Input:** Add the screenshot rendering foundation. Preserve normal Markdeep output exactly. Add screenshot-only readiness markup after the parser-blocking Markdeep loader. Add pinned Node.js 20-compatible Puppeteer Core and browser-installer dependencies. Implement cached Chrome-for-Testing resolution, lazy installation, fresh-profile headless launching, thirty-second readiness checks, exact single `.longTOC` selection, stable bounding-box checks, animation disabling, element-only PNG capture, and reliable browser cleanup. Return PNG bytes without writing or copying them. Add focused offline tests with injected browser and installer boundaries.

**Profile:** `Resolve at execution`

**Goal:** Produce PNG bytes from one rendered TOC element.

**Files:**

- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `src/render.js`
- Modify: `test/render.test.js`
- Create: `src/screenshot.js`
- Create: `test/screenshot.test.js`

**Tasks:**

1. Add pinned browser automation and installer dependencies.
2. Add screenshot-only Markdeep readiness markup.
3. Implement cached browser resolution and TOC capture.
4. Cover readiness, selection, capture, and cleanup behavior.

**Acceptance Criteria:**

- Normal rendering remains byte-for-byte unchanged.
- Screenshot rendering adds one post-loader readiness sentinel.
- Puppeteer Core performs no installation-time Chrome download.
- Browser installation uses one pinned compatible Chrome build.
- Cached browser builds avoid repeated downloads.
- Each capture uses a fresh browser profile.
- Chromium's sandbox remains enabled.
- Capture waits no longer than thirty seconds.
- Capture waits for `document.fonts.ready`.
- Capture requires exactly one `.longTOC` element.
- Capture disables animations and transitions.
- Bounding-box stability spans two animation frames.
- Puppeteer's element screenshot returns PNG bytes.
- Browser resources always close inside `finally`.
- Cleanup failures never replace primary failures.
- Unit tests never download Chrome or access Markdeep.

**Reviewer Checklist:**

- No unsupported Markdeep callback is introduced.
- Normal HTML footer output remains identical.
- Browser versions match Puppeteer compatibility requirements.
- No `--no-sandbox` or insecure browser flags appear.
- Selector ambiguity fails before screenshot capture.
- Timeout and cleanup paths cannot leak browser processes.
- Installer and browser boundaries remain easily mockable.
- No filesystem or clipboard work enters `src/screenshot.js`.

**Verification Checks:**

- `node --test test/render.test.js test/screenshot.test.js`
- `npm ls puppeteer-core @puppeteer/browsers --depth=0`
- `npm test`

**Commit:** `feat(screenshot): add headless TOC capture`

### Phase 2: Integrate Screenshot And Clipboard Workflow

**Task Guide Input:** Integrate the confirmed `--screenshot` CLI behavior. Add the vetted cross-platform native image clipboard dependency and a small injectable clipboard adapter. Parse one optional screenshot flag without changing existing arguments. Generate related exclusive HTML and PNG paths using one UUID. Preserve current HTML printing and default-browser opening. Dynamically load screenshot and clipboard modules only for flagged commands. Capture PNG bytes, write and print the PNG path, then copy PNG bytes. Map screenshot failures to exit code 1 while retaining created files. Treat clipboard failures as standard-error warnings with exit code 0. Add focused CLI and clipboard tests without launching browsers or touching real clipboards.

**Profile:** `Resolve at execution`

**Goal:** Deliver the complete optional screenshot command workflow.

**Files:**

- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `src/cli.js`
- Modify: `test/cli.test.js`
- Create: `src/clipboard.js`
- Create: `test/clipboard.test.js`

**Tasks:**

1. Add and wrap the native image clipboard dependency.
2. Parse the optional screenshot flag safely.
3. Orchestrate related HTML and PNG output.
4. Cover successful and failing screenshot workflows.

**Acceptance Criteria:**

- Usage includes the optional `--screenshot` flag.
- The flag works with either template argument ordering.
- Duplicate screenshot flags return exit code `2`.
- Unflagged commands retain existing output behavior.
- Unflagged commands never import screenshot modules.
- One UUID relates HTML and PNG filenames.
- PNG output uses `<uuid>_<stem>.md.toc.png`.
- Both output paths live inside `os.tmpdir()`.
- Both generated files use exclusive creation.
- HTML prints before default-browser launching.
- Default-browser failure prevents screenshot capture.
- PNG prints after successful exclusive writing.
- Clipboard copying occurs after PNG printing.
- Screenshot failures return exit code `1`.
- Screenshot failures retain every created file.
- Clipboard failures warn through standard error.
- Clipboard warnings contain the retained PNG path.
- Clipboard failures still return exit code `0`.
- Successful runs return both generated paths.
- Tests never open browsers or system clipboards.

**Reviewer Checklist:**

- Existing unflagged tests require no behavioral changes.
- Dynamic imports occur only within flagged execution.
- Input basenames cannot escape temporary output paths.
- PNG bytes remain unchanged through writing and copying.
- Standard output contains only confirmed absolute paths.
- Warnings never pollute standard output.
- Native clipboard failures remain narrowly warning-only.
- Injected boundaries do not become needless abstractions.

**Verification Checks:**

- `node --test test/cli.test.js test/clipboard.test.js`
- `npm ls @mariozechner/clipboard --depth=0`
- `npm test`

**Commit:** `feat(cli): add optional screenshot workflow`

### Phase 3: Verify And Document Cross-Platform Support

**Task Guide Input:** Add deterministic browser integration coverage, platform CI, remote compatibility monitoring, documentation, and package verification for the screenshot feature. Use local fixtures for routine element capture tests. Exercise lazy Chrome installation and element-only PNG capture on Windows, macOS, and Linux using Node.js 20. Keep clipboard mocked in normal CI. Add an opt-in clipboard smoke-test path. Add a scheduled non-blocking canary against remote Markdeep `latest`. Document first-run downloads, two-line output, temporary retention, desktop clipboard requirements, warning behavior, trusted-content execution, and troubleshooting. Verify the packed npm artifact without publishing.

**Profile:** `Resolve at execution`

**Goal:** Make screenshot behavior verifiable and release-ready.

**Files:**

- Modify: `README.md`
- Modify: `package.json`
- Modify: `.github/workflows/ci.yml`
- Create: `.github/workflows/markdeep-canary.yml`
- Create: `test/screenshot.browser.js`
- Create: `test/markdeep.canary.js`
- Create: `test/fixtures/screenshot-toc.html`

**Tasks:**

1. Add deterministic local browser integration coverage.
2. Add three-platform screenshot verification in CI.
3. Add scheduled remote Markdeep compatibility monitoring.
4. Document usage, packaging, risks, and recovery.

**Acceptance Criteria:**

- Routine `npm test` remains browser-free and offline.
- Browser integration tests use only local fixtures.
- Integration tests validate PNG signatures and dimensions.
- Integration tests verify element-only capture boundaries.
- Browser integration runs on all three desktop platforms.
- Cross-platform browser CI uses Node.js 20.
- Normal CI never touches the real clipboard.
- Real clipboard smoke testing remains opt-in.
- Scheduled canary checks remote Markdeep `latest`.
- Canary failures never block ordinary pull requests.
- README documents `--screenshot` usage.
- README documents both successful output paths.
- README documents first-run Chrome downloads.
- README documents temporary file retention.
- README documents desktop clipboard requirements.
- README documents warning-only clipboard failures.
- README discloses duplicate trusted-content execution.
- README explains remote Markdeep compatibility risks.
- Packed output includes every runtime screenshot module.
- No release or publish command runs automatically.

**Reviewer Checklist:**

- Local fixtures exercise readiness without public networking.
- Browser assertions avoid pixel-perfect platform comparisons.
- CI browser downloads remain isolated from routine unit jobs.
- Canary scheduling and failure handling remain non-blocking.
- Documentation matches implemented output and exit behavior.
- Package contents include native runtime dependency metadata.
- No test silently requires an interactive clipboard session.
- No publishing permissions or release steps are added.

**Verification Checks:**

- `npm test`
- `npm run test:screenshot-integration`
- `npm run test:markdeep-canary`
- `npm pack --dry-run`
- `npm ls --depth=0`

**Commit:** `chore(screenshot): verify cross-platform support`

## Completion Criteria

- Every phase meets its acceptance criteria.
- Every verification command passes freshly.
- Every phase receives independent quality review.
- Normal commands retain existing behavior.
- Flagged commands produce confirmed screenshot output.
- Cross-platform browser verification passes freshly.
- The final working tree is clean.
- No real clipboard opens during routine verification.
