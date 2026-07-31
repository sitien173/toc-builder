# Phase 1 — Decision Notes

## Task 1

### Decisions made
- Used Node's built-in test runner through the `npm test` script.

### Spec deviations
- none

### Tradeoffs accepted
- Pinned the `open` dependency with a compatible caret range; npm lock records the resolved version.

### Assumptions
- `src/cli.js` may be added in Phase 2 while the package binary mapping is declared now.

### Follow-ups for human
- none

### Test evidence
- `npm install` completed successfully; `npm ls --depth=0` reports only `open@11.0.0` as the runtime dependency.

## Task 2

### Decisions made
- Added the confirmed complete HTML document structure verbatim, including one Markdown placeholder.

### Spec deviations
- none

### Tradeoffs accepted
- none

### Assumptions
- none

### Follow-ups for human
- none

### Test evidence
- Default-template structure is exercised by the renderer contract tests; no filesystem or browser behavior is involved.

## Task 3

### Decisions made
- Validation uses deterministic case-insensitive body-tag matching and exact placeholder counts.
- Rendering inserts the owned footer before replacing the placeholder.

### Spec deviations
- none

### Tradeoffs accepted
- Validation requires exactly one opening body tag as part of enforcing one unambiguous body region.

### Assumptions
- Reasonable HTML body tags may include attributes and capitalization differences.

### Follow-ups for human
- none

### Test evidence
- RED -> GREEN: renderer tests were written first and initially failed on footer ordering assertion; implementation and corrected assertion now pass all 5 tests.

## Task 4

### Decisions made
- Tests cover unchanged Markdown, raw HTML, Markdown containing `</body>`, footer configuration and URL, duplicate/missing placeholders, placement, and ambiguous body regions.

### Spec deviations
- none

### Tradeoffs accepted
- none

### Assumptions
- Error message matching is intentionally broad because the phase contract specifies behavior rather than exact wording.

### Follow-ups for human
- none

### Test evidence
- `npm test -- test/render.test.js`: 5 passed, 0 failed.
- `npm ls --depth=0`: dependency tree clean with `open` only.

## Fix — Markdown replacement tokens

### Decisions made
- Use a replacement callback so Markdown is inserted as literal content rather than interpreted by `String.prototype.replace`.

### Spec deviations
- none

### Tradeoffs accepted
- none

### Assumptions
- Markdown may legitimately contain replacement-token sequences such as `$&`, `$$`, `$\``, and `$\'`.

### Follow-ups for human
- none

### Test evidence
- RED -> GREEN: regression test failed with string replacement, then passed after changing replacement to `() => markdown`.
- `npm test -- test/render.test.js`: 6 passed, 0 failed.
- `npm ls --depth=0`: `open@11.0.0` only runtime dependency.
