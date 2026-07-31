# Phase 2: Decision Notes

## Task 1

### Decisions made
- Exposed `parseArgs` and `main` for deterministic unit testing while keeping the executable entry point self-contained.
- Argument and input-extension errors use `CliError` with exit code 2.

### Spec deviations
- none

### Tradeoffs accepted
- Options are accepted in either order, while duplicate and unknown options are rejected.

### Assumptions
- A Markdown input basename is retained in the output name, producing `<uuid>_<basename>.html` such as `README.md.html`.

### Follow-ups for human
- none

### Test evidence
- RED -> GREEN: CLI tests initially failed because `src/cli.js` did not exist; argument parsing and exit-code tests now pass.

## Task 2

### Decisions made
- Resolve relative input and custom-template paths against the supplied/current working directory.
- Resolve the default template relative to the installed module using `import.meta.url`.
- Use `fs.writeFile` with `flag: 'wx'` for exclusive creation directly under `os.tmpdir()`.

### Spec deviations
- none

### Tradeoffs accepted
- UUID collisions are surfaced as operational write failures rather than silently overwriting an existing file.

### Assumptions
- `crypto.randomUUID()` is available under the required Node.js 20 engine.

### Follow-ups for human
- none

### Test evidence
- RED -> GREEN: successful workflow test now confirms UTF-8 Markdown rendering, UUID naming, temporary-directory placement, and generated-file contents.

## Task 3

### Decisions made
- Print the absolute generated path before attempting browser launch.
- Pass `pathToFileURL(outputPath).href` to the injected/default `open` function.
- Preserve generated output and attach its path to launch failures.

### Spec deviations
- none

### Tradeoffs accepted
- Launch failures are reported as operational failures after the output has been retained.

### Assumptions
- The `open` package accepts a file URL string.

### Follow-ups for human
- none

### Test evidence
- RED -> GREEN: launch-failure test confirms the generated file remains readable and its path is reported; success test confirms a valid file URL is passed.

## Task 4

### Decisions made
- Tests inject browser opening and output functions, so no real browser is launched.
- `main` maps argument failures to 2 and operational failures to 1, emitting concise messages without stack traces.

### Spec deviations
- none

### Tradeoffs accepted
- Tests clean up generated temporary files while production intentionally leaves them for the operating system/user.

### Assumptions
- Error message wording is not part of the public contract beyond concise output and exit-code mapping.

### Follow-ups for human
- none

### Test evidence
- `npm test -- test/cli.test.js`: 8 passed, 0 failed.
- `npm test`: 14 passed, 0 failed.
- `npm ls --depth=0`: `open@11.0.0` is the only runtime dependency.

## Reconciliation — normalized Markdown suffix

### Decisions made
- Derive the output stem from the input basename and always append the canonical lowercase `.md.html` suffix.

### Spec deviations
- none

### Tradeoffs accepted
- none

### Assumptions
- Only the Markdown extension is normalized; the user-provided stem casing is preserved.

### Follow-ups for human
- none

### Test evidence
- RED -> GREEN: `README.MD` regression test first failed with `README.MD.html`, then passed after normalizing the suffix to `README.md.html`.
- `npm test -- test/cli.test.js`: 8 passed, 0 failed.
- `npm test`: 14 passed, 0 failed.
