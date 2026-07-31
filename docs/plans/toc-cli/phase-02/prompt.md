## Original User Request

Build a cross-platform Node.js npm CLI named `toc`.
Render Markdown through Markdeep and open temporary HTML.

## Phase

Deliver the complete temporary-file and browser-launch workflow.

## Tasks

- task-1: Parse arguments and validate Markdown inputs.
- task-2: Read, render, and exclusively write temporary HTML.
- task-3: Print paths and launch browser file URLs.
- task-4: Cover successful and failing CLI behavior.

## Context

Read `docs/designs/toc-cli.md` and `docs/plans/toc-cli/PLAN.md`.
Reuse `src/render.js`.
The default template must load after npm installation.

## Files

- `src/cli.js`
- `test/cli.test.js`
- `docs/plans/toc-cli/phase-02/notes.md`
- `docs/plans/toc-cli/phase-02/journal.md`

## Done When

- Usage is `toc <file.md> [--template <template.html>]`.
- The entry file has a portable Node.js shebang.
- Exactly one Markdown input is accepted.
- `.md` matching is case-insensitive.
- Relative paths resolve from the working directory.
- Input and templates use UTF-8.
- Installed default template loading works.
- Output uses `<uuid>_<stem>.md.html`.
- Output lives directly under `os.tmpdir()`.
- File creation uses exclusive behavior.
- Success prints the absolute output path.
- Browser launching receives a valid file URL.
- Generated files remain after launching.
- Launch failures retain and print output.
- Argument failures use exit code `2`.
- Operational failures use exit code `1`.
- Default errors omit stack traces.
- `npm test -- test/cli.test.js`
- `npm test`

## Rules

Follow the supplied worker contract.
Stay within scope.
Maintain this phase's `notes.md` and `journal.md`.

## Response Format

Return the ERP `# EXTERNAL RESPONSE` block.
Then return the matching status line.
