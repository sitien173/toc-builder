## Original User Request

Execute every phase of the `toc-screenshot` plan through completion.

## Phase

Make screenshot behavior verifiable and release-ready.

## Tasks

- task-1: Add deterministic local browser integration coverage.
- task-2: Add three-platform Node.js 20 screenshot verification in CI.
- task-3: Add scheduled remote Markdeep compatibility monitoring.
- task-4: Document usage, packaging, risks, and recovery.

## Context

Routine `npm test` currently uses offline injected boundaries. Keep it that way.
Current GitHub Actions documentation confirms matrix `runs-on` selection,
scheduled triggers, and job-level `continue-on-error`. Use local HTML fixtures
for browser integration. Keep remote Markdeep access isolated to the canary.
The package already includes `src/` through its `files` metadata.

## Files

- `README.md`
- `package.json`
- `.github/workflows/ci.yml`
- `.github/workflows/markdeep-canary.yml`
- `test/screenshot.browser.js`
- `test/markdeep.canary.js`
- `test/fixtures/screenshot-toc.html`
- `docs/plans/toc-screenshot/phase-03/notes.md`
- `docs/plans/toc-screenshot/phase-03/journal.md`

## Done When

- Routine `npm test` remains browser-free and offline.
- Browser integration uses local fixtures only.
- Integration validates PNG signatures, dimensions, and element boundaries.
- Browser integration runs on Windows, macOS, and Linux using Node.js 20.
- Normal CI never touches the real clipboard.
- Real clipboard smoke testing is explicit and opt-in.
- A scheduled, manually runnable canary checks remote Markdeep `latest`.
- Canary failure never blocks ordinary pull requests.
- README covers screenshot usage, two output paths, first-run download, retained
  files, desktop clipboard requirements, warning behavior, trusted duplicate
  execution, remote compatibility risk, and troubleshooting.
- Packed output includes every screenshot runtime module and native metadata.
- No publishing command, permission, or automatic release step is added.
- `npm test`
- `npm run test:screenshot-integration`
- `npm run test:markdeep-canary`
- `npm pack --dry-run`
- `npm ls --depth=0`

## Rules

Follow the supplied worker contract. Stay within scope. Maintain this phase's
`notes.md` and `journal.md`. Avoid pixel-perfect assertions. Do not touch a real
clipboard during routine checks. Do not publish or release anything.

## Response Format

Return the ERP `# EXTERNAL RESPONSE` block and matching status line.
