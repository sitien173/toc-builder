## Original User Request

Build a cross-platform Node.js npm CLI named `toc`.
Keep installation, updates, and maintenance simple.

## Phase

Document usage and prepare the package for release.

## Tasks

- task-1: Document installation and basic command usage.
- task-2: Document templates, retention, and security.
- task-3: Add cross-platform Node.js verification.
- task-4: Restrict and verify packed package contents.

## Context

Read `docs/designs/toc-cli.md` and `docs/plans/toc-cli/PLAN.md`.
Do not publish the package.
Automated tests must never launch a real browser.

## Files

- `README.md`
- `.github/workflows/ci.yml`
- `package.json`
- `package-lock.json`
- `docs/plans/toc-cli/phase-03/notes.md`
- `docs/plans/toc-cli/phase-03/journal.md`

## Done When

- README documents `npm install --global toc-builder`.
- README documents the installed `toc` command.
- README shows default and custom-template usage.
- README describes the exact template contract.
- README explains temporary file retention.
- README explains launch-failure recovery.
- README discloses Markdeep network requirements.
- README treats Markdown and templates as trusted.
- CI tests Linux, macOS, and Windows.
- CI uses Node.js 20 or newer.
- Package metadata includes required runtime files only.
- Packed output contains every runtime-required file.
- No command publishes the package.
- `npm test`
- `npm pack --dry-run`
- `npm ls --depth=0`

## Rules

Follow the supplied worker contract.
Stay within scope.
Maintain this phase's `notes.md` and `journal.md`.

## Response Format

Return the ERP `# EXTERNAL RESPONSE` block.
Then return the matching status line.
