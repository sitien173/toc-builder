## Original User Request

Execute every phase of the `toc-screenshot` plan through completion.

## Phase

Deliver the complete optional screenshot command workflow.

## Tasks

- task-1: Add and wrap the native image clipboard dependency.
- task-2: Parse one optional screenshot flag safely.
- task-3: Orchestrate related exclusive HTML and PNG output.
- task-4: Cover successful and failing screenshot workflows offline.

## Context

`src/cli.js` already parses arguments, writes HTML exclusively, prints its path,
and opens it. Preserve that exact unflagged path. Registry metadata confirms
`@mariozechner/clipboard` 0.3.9 supports Node.js 10 and later. Context7 has no
matching entry, so inspect the installed package's type declarations before
using its image API. Screenshot and clipboard modules must load dynamically
only when `--screenshot` is present.

## Files

- `package.json`
- `package-lock.json`
- `src/cli.js`
- `test/cli.test.js`
- `src/clipboard.js`
- `test/clipboard.test.js`
- `docs/plans/toc-screenshot/phase-02/notes.md`
- `docs/plans/toc-screenshot/phase-02/journal.md`

## Done When

- Usage includes one optional `--screenshot` in either template ordering.
- Duplicate screenshot flags return exit code 2 without output.
- Unflagged commands retain behavior and never import screenshot modules.
- One UUID creates exclusive temporary HTML and PNG paths.
- PNG names use `<uuid>_<stem>.md.toc.png`.
- HTML prints before default-browser launch.
- Default-browser failure prevents capture.
- PNG prints after its successful write.
- PNG bytes reach clipboard copying unchanged after printing.
- Screenshot failures return exit code 1 and retain created files.
- Clipboard failures warn on stderr with the PNG path and return exit code 0.
- Successful runs return both generated paths.
- Tests never open browsers or system clipboards.
- `node --test test/cli.test.js test/clipboard.test.js`
- `npm ls @mariozechner/clipboard --depth=0`
- `npm test`

## Rules

Follow the supplied worker contract. Stay within scope. Maintain this phase's
`notes.md` and `journal.md`. Keep dynamic imports inside flagged execution.
Keep injected boundaries minimal.

## Response Format

Return the ERP `# EXTERNAL RESPONSE` block and matching status line.
