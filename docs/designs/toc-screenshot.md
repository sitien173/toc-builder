# TOC Screenshot Design

## Purpose

Add optional table-of-contents screenshots to `toc-builder`.

Existing commands keep their current behavior.
Screenshot behavior requires the `--screenshot` flag.

The flag creates a temporary PNG.
It also copies that PNG into the clipboard.

## Usage

```text
toc <file.md> [--template <template.html>] [--screenshot]
```

`--screenshot` may appear after either existing argument.
Duplicate or unknown flags remain invalid.

Without `--screenshot`, generated HTML remains unchanged.
No browser automation module loads without the flag.

## Confirmed Behavior

The normal HTML workflow runs first:

1. Read the Markdown and selected template.
2. Render and write temporary HTML.
3. Print the absolute HTML path.
4. Open HTML using the default browser.

Screenshot mode then runs these steps:

1. Resolve an installed Chrome, Chromium, Brave, Edge, or Firefox browser.
2. Open generated HTML using the headless browser.
4. Wait for Markdeep and layout readiness.
5. Require exactly one rendered long TOC.
6. Capture only that TOC element.
7. Write the PNG inside `os.tmpdir()`.
8. Print the absolute PNG path.
9. Copy PNG bytes into the system clipboard.
10. Close the headless browser.

The default browser opens before screenshot completion.
Both generated files remain after command completion.

## Architecture

`src/cli.js` remains the workflow coordinator.

It owns these responsibilities:

- Parse `--screenshot`.
- Preserve the existing HTML workflow.
- Generate related HTML and PNG paths.
- Print both successful output paths.
- Map failures into existing exit codes.
- Emit clipboard warnings through standard error.

`src/render.js` remains the pure HTML renderer.

Screenshot rendering adds a readiness sentinel.
Normal rendering keeps the current footer unchanged.

`src/screenshot.js` owns screenshot behavior:

- Dynamically load Playwright Core.
- Resolve an installed Chrome, Chromium, Brave, Edge, or Firefox browser.
- Launch a fresh headless browser profile.
- Wait for rendering readiness.
- Validate the TOC selection.
- Capture the TOC element.
- Close browser resources reliably.

`src/clipboard.js` owns image clipboard writes.

It wraps the selected native clipboard dependency.
The boundary remains injectable during automated tests.

No separate browser abstraction is required.
Set `TOC_BROWSER_PATH` when automatic system-browser discovery cannot find the executable.

## Dependencies

Use `playwright-core` for browser automation.
It does not download browsers during package installation.

Use an installed Chrome, Chromium, Brave, Edge, or Firefox browser.
Set `TOC_BROWSER_PATH` when automatic discovery cannot find it.

Use `@mariozechner/clipboard` for image clipboard writes.
It provides native binaries for supported desktop targets.

Pin native dependency versions in `package-lock.json`.
Review binary provenance during dependency updates.

## Readiness Contract

Markdeep 1.20 exposes no supported `onLoad` option.
Do not depend upon an unsupported callback.

Screenshot HTML adds a sentinel script after Markdeep.
The external Markdeep loader remains parser-blocking.

Headless capture waits for these conditions:

1. The post-loader sentinel becomes visible.
2. `document.fonts.ready` resolves.
3. Exactly one `.longTOC` element exists.
4. Its bounding box remains stable twice.

Use animation frames for bounding-box checks.
Disable animations and transitions before capture.

Use Playwright's element screenshot operation.
Do not crop a full-page screenshot manually.

Rendering receives a thirty-second timeout.
Timeouts report a concise operational failure.

The remote `latest` build may change selectors.
A scheduled canary detects this compatibility drift.

## Output Naming

Reuse one UUID for both generated files.

For input `README.md`, use these patterns:

```text
<uuid>_README.md.html
<uuid>_README.md.toc.png
```

Both files live directly inside `os.tmpdir()`.
Both writes use exclusive file creation.

Successful screenshot mode prints two stdout lines:

```text
<absolute-html-path>
<absolute-png-path>
```

The HTML path always appears first.
Status messages use standard error.
Warnings also use standard error.

## Clipboard Contract

Copy PNG bytes, not the generated path.

Support desktop Windows, macOS, and Linux.
Linux requires an active X11 or Wayland session.

Clipboard failure never deletes generated files.
It prints a warning containing the PNG path.
The command still returns exit code `0`.

Headless servers may lack a clipboard session.
That condition follows the same warning behavior.

## Error Behavior

Argument failures return exit code `2`.
They create no generated output.

Existing read and rendering failures remain unchanged.
Existing default-browser failures remain unchanged.

These screenshot failures return exit code `1`:

- Browser resolution or launch failure.
- Markdeep rendering timeout.
- Missing or duplicate TOC elements.
- Unstable or invalid TOC dimensions.
- Screenshot capture failure.
- PNG creation failure.

Retain every successfully created file after failures.
Always close headless browser resources inside `finally`.
Cleanup failures never replace the primary failure.

Clipboard failure is the only warning-only failure.

## Security

Markdown and custom templates remain trusted content.
Their scripts execute inside both opened browsers.

Use a fresh browser profile for every capture.
Keep Chromium's sandbox enabled.

Never disable web security or filesystem protections.
Close headless browser resources immediately after capture.

Markdeep remains remote and mutable.
Screenshot mode therefore still requires network access.

System browser updates remain the host's responsibility.

## Testing

Use Node.js built-in test tooling.

Unit tests cover:

- Optional flag parsing and duplicate rejection.
- Unchanged behavior without `--screenshot`.
- Dynamic dependency loading only when requested.
- HTML and PNG output ordering.
- Related UUID-based output names.
- Browser, screenshot, and clipboard failure mapping.
- Clipboard warning and successful exit behavior.
- Browser cleanup after every terminal result.

Browser integration tests cover:

- Sentinel-based readiness.
- Delayed TOC creation.
- Missing and duplicate TOCs.
- Stable element-only capture dimensions.
- Valid PNG signatures and dimensions.
- Thirty-second timeout enforcement.

Integration tests use local rendering fixtures.
Routine tests never require remote Markdeep.

Set `TOC_BROWSER_PATH` for browser-test CI jobs.
Mock clipboard behavior during normal CI runs.

Keep real clipboard tests opt-in.
Linux clipboard tests require a desktop compositor.

Run a scheduled non-blocking Markdeep canary.
That canary detects remote compatibility changes.

## Migration

Existing command lines require no changes.
Existing successful stdout remains one HTML path.

Only flagged commands produce two output paths.
Only flagged commands launch the headless system browser.

Document the system-browser requirement and `TOC_BROWSER_PATH` fallback.
Document desktop clipboard requirements and fallback behavior.

No generated file migration is required.
Temporary files remain intentionally unmanaged.

## Non-Goals

- Full-page screenshots.
- Browser viewport screenshots.
- Capturing non-TOC elements.
- Automatic screenshots without the flag.
- Clipboard support without desktop sessions.
- Pixel-identical screenshots across operating systems.
- Offline Markdeep bundling.
- Temporary output deletion.
- Arbitrarily tall bitmap support.

## Success Criteria

- Existing commands retain current behavior.
- `--screenshot` captures only the rendered TOC.
- HTML and PNG use one related UUID.
- Both absolute paths print in confirmed order.
- PNG bytes reach supported desktop clipboards.
- Clipboard failures warn without failing commands.
- Other screenshot failures return exit code `1`.
- Generated files remain after every later failure.
- Routine tests avoid real browsers and clipboards.
- Cross-platform browser verification passes freshly.

## Verified References

- Playwright supports element-specific screenshots.
- Playwright Core supports a configured system-browser executable.
- Markdeep 1.20 contains `.longTOC` styling.
- Markdeep 1.20 exposes no `onLoad` option.
