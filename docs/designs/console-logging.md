# Console Logging Design

## Purpose

Add optional human-readable lifecycle logging to `toc-builder`.

Logging requires the `--verbose` flag.
Normal command output remains unchanged.
Logs only target the process console.

## Usage

```text
toc <file.md> [--template <template.html>] [--screenshot] [--verbose]
```

`--verbose` may appear in any valid argument position.
Duplicate `--verbose` flags remain invalid usage.

## Output Contract

Generated paths remain exclusive to standard output.
Verbose messages use standard error.
Existing warnings and errors also use standard error.

Messages use this human-readable prefix:

```text
[toc] Reading input and template
```

Messages contain relevant paths when useful.
They never contain Markdown or template contents.
Messages contain no timestamps or elapsed durations.

## Architecture

Keep all logging inside `src/cli.js`.
Do not add a logger module or dependency.

Extend existing argument parsing with `--verbose`.
Use the existing injected standard-error writer.
Disabled logging performs no console writes.

`src/screenshot.js` and other modules remain unchanged.
The CLI reports their major workflow boundaries.

## Lifecycle Messages

Verbose mode reports these major milestones:

1. Read the input and template.
2. Render the generated HTML.
3. Write the generated HTML.
4. Open the generated HTML.
5. Capture the TOC screenshot.
6. Write the TOC screenshot.
7. Copy the screenshot into the clipboard.
8. Complete the command.

Screenshot milestones only appear with `--screenshot`.
Each lifecycle message precedes its named operation.
The completion message follows successful command completion.

The expected message vocabulary is:

```text
[toc] Reading input and template
[toc] Rendering HTML
[toc] Writing generated HTML
[toc] Opening generated HTML
[toc] Capturing TOC screenshot
[toc] Writing TOC screenshot
[toc] Copying screenshot to clipboard
[toc] Complete
```

## Error Behavior

Normal mode keeps current concise errors unchanged.
Verbose fatal errors add the originating stack trace.

Wrapped operational failures preserve their original `cause`.
The concise contextual error remains the primary message.
Its originating stack follows on standard error.

Argument failures include their available stack trace.
Clipboard failures remain warning-only.
Clipboard warnings never print stack traces.

Existing exit codes remain unchanged.
Generated file retention behavior also remains unchanged.

## Compatibility

Existing command lines require no changes.
Existing stdout consumers continue receiving path-only lines.
No environment variable or configuration file is introduced.
No generated data migration is required.

## Testing

Use Node.js built-in test tooling.

Tests cover:

- `--verbose` parsing and duplicate rejection.
- Unchanged output without `--verbose`.
- Path-only stdout during verbose execution.
- Ordered regular-workflow lifecycle messages.
- Ordered screenshot-workflow lifecycle messages.
- Fatal stack traces only during verbose execution.
- Originating stacks from wrapped operational failures.
- Concise clipboard warnings without stack traces.
- Existing exit codes and retained output files.

Update README usage and troubleshooting documentation.

## Non-Goals

- File-based logging.
- Structured or machine-readable logging.
- Configurable log levels.
- Environment-controlled logging.
- Timestamps or elapsed durations.
- Browser-internal or dependency-internal tracing.
- Logging inside non-CLI modules.
- Stack traces for non-fatal clipboard warnings.

## Success Criteria

- `--verbose` reports every confirmed lifecycle milestone.
- All verbose messages use standard error.
- Generated paths remain exclusive to standard output.
- Normal command output remains byte-for-byte compatible.
- Fatal verbose failures include originating stack traces.
- Clipboard warnings remain concise and non-fatal.
- No logging dependency or shared abstraction is added.
