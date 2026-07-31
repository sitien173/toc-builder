## Original User Request

Build a cross-platform Node.js npm CLI named `toc`.
Render Markdown through Markdeep and open temporary HTML.

## Phase

Create validated Markdeep rendering without filesystem side effects.

## Tasks

- task-1: Define package metadata and install dependencies.
- task-2: Add the confirmed default HTML template.
- task-3: Implement pure template validation and rendering.
- task-4: Cover valid and invalid rendering behavior.

## Context

Read `docs/designs/toc-cli.md` and `docs/plans/toc-cli/PLAN.md`.
The CLI owns the Markdeep footer.
Footer insertion must precede Markdown replacement.

## Files

- `package.json`
- `package-lock.json`
- `src/render.js`
- `templates/default.html`
- `test/render.test.js`
- `docs/plans/toc-cli/phase-01/notes.md`
- `docs/plans/toc-cli/phase-01/journal.md`

## Done When

- Package name is `toc-builder`.
- Package uses ESM and Node.js 20.
- `toc` maps to `src/cli.js`.
- `open` is the only runtime dependency.
- Default HTML contains one `{{markdown}}`.
- Renderer requires one placeholder inside one body.
- Renderer requires exactly one closing body tag.
- Footer insertion precedes Markdown replacement.
- Footer configures `tocStyle` as `long`.
- Footer loads the required Markdeep URL.
- Markdown content remains unchanged.
- `npm test -- test/render.test.js`
- `npm ls --depth=0`

## Rules

Follow the supplied worker contract.
Stay within scope.
Maintain this phase's `notes.md` and `journal.md`.

## Response Format

Return the ERP `# EXTERNAL RESPONSE` block.
Then return the matching status line.
