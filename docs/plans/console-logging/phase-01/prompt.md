## Original User Request

Execute the console-logging plan through completion.

## Phase

Deliver opt-in CLI lifecycle logging.

## Tasks

- task-1: Add failing focused CLI tests for verbose parsing and output.
- task-2: Implement inline lifecycle and fatal-stack logging in `src/cli.js`.
- task-3: Document verbose usage and compatibility guarantees.

## Context

Read `docs/designs/console-logging.md` and `docs/plans/console-logging/PLAN.md`.
Keep logging inside `src/cli.js`. Use its injected `warn` boundary for standard
error. Preserve path-only standard output and normal-mode behavior.

## Files

- `src/cli.js`
- `test/cli.test.js`
- `README.md`
- `docs/plans/console-logging/phase-01/notes.md`
- `docs/plans/console-logging/phase-01/journal.md`

## Done When

- `--verbose` works in every valid position and rejects duplicates with exit code 2.
- All specified lifecycle, output, error, and clipboard behaviors pass.
- `node --test test/cli.test.js`
- `npm test`

## Rules

Follow the supplied worker contract. Stay within scope. Maintain this phase's
`notes.md` and `journal.md`.

## Response Format

Return the ERP `# EXTERNAL RESPONSE` block and matching status line.
