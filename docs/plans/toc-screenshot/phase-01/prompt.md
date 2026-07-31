## Original User Request

Execute every phase of the `toc-screenshot` plan through completion.

## Phase

Produce PNG bytes from one rendered TOC element.

## Tasks

- task-1: Add exact browser automation dependencies compatible with Node.js 20.
- task-2: Add screenshot-only post-loader readiness markup without changing normal HTML.
- task-3: Implement cached browser resolution and TOC element capture.
- task-4: Cover readiness, selection, capture, and cleanup offline.

## Context

`src/render.js` owns the unchanged Markdeep footer. Screenshot rendering may add
one sentinel after its parser-blocking loader. Use `puppeteer-core` and
`@puppeteer/browsers`. Current Puppeteer documentation confirms custom
`executablePath` launches and element-level `screenshot()` capture. Keep browser
and installer boundaries injectable. The completed design consultation is job
`72c780af-5485-4d69-88a1-516eab1956b1`.

## Files

- `package.json`
- `package-lock.json`
- `src/render.js`
- `test/render.test.js`
- `src/screenshot.js`
- `test/screenshot.test.js`
- `docs/plans/toc-screenshot/phase-01/notes.md`
- `docs/plans/toc-screenshot/phase-01/journal.md`

## Done When

- Normal rendering remains byte-for-byte unchanged.
- Screenshot rendering adds one post-loader readiness sentinel.
- Exact Node.js 20-compatible dependency versions are pinned.
- Browser resolution caches one pinned Chrome-for-Testing build.
- Every capture launches a fresh profile with Chromium sandboxing enabled.
- Readiness is bounded to thirty seconds and awaits fonts.
- Exactly one `.longTOC` survives stable two-frame bounding-box validation.
- Animations and transitions are disabled before element-only PNG capture.
- Browser cleanup always runs and preserves primary failures.
- Unit tests never download Chrome, access Markdeep, or touch files or clipboards.
- `node --test test/render.test.js test/screenshot.test.js`
- `npm ls puppeteer-core @puppeteer/browsers --depth=0`
- `npm test`

## Rules

Follow the supplied worker contract. Stay within scope. Maintain this phase's
`notes.md` and `journal.md`. Do not add `--no-sandbox`, filesystem output, or
clipboard behavior to `src/screenshot.js`.

## Response Format

Return the ERP `# EXTERNAL RESPONSE` block and matching status line.
