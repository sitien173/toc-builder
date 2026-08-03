## Original User Request

Port the toc-builder CLI into a VSCode extension: webview preview with a
long Markdeep table of contents, custom templates, live refresh, and a
screenshot-to-clipboard command, reusing the shared `src/` modules.

## Phase

Scaffold the extension package foundation.

## Tasks

- task-1: Create the `vscode/` package manifest with commands, menus, config, capabilities, engine, and dependencies.
- task-2: Add the esbuild bundle script that inlines shared modules and copies the default template.
- task-3: Add a minimal loadable extension entry and activation registration skeleton.
- task-4: Verify the bundle output and root test isolation.

## Context

The root npm package is `toc-builder` with ESM modules in `src/render.js`,
`src/screenshot.js`, `src/clipboard.js`, and `templates/default.html`. The
root package must stay unchanged and non-workspace.

The shared `src/` modules are imported directly by the extension bundle.
`playwright-core` and `@mariozechner/clipboard` are runtime dependencies of
the root package and become runtime dependencies of the extension. `vscode`
is externalized and never bundled.

The extension is plain JavaScript. Its source lives in `vscode/src/`, its
tests in `vscode/test/`, and its bundle output in `vscode/dist/`.

The manifest declares five commands:

- `tocBuilder.preview`
- `tocBuilder.refresh`
- `tocBuilder.screenshot`
- `tocBuilder.setTemplate`
- `tocBuilder.useDefaultTemplate`

The manifest declares `tocBuilder.templatePath` with `"scope": "resource"`,
`capabilities.untrustedWorkspaces.supported: false`, `extensionKind: ["ui"]`,
and a pinned `engines.vscode`.

## Files

- Create: `vscode/package.json`
- Create: `vscode/package-lock.json`
- Create: `vscode/.vscodeignore`
- Create: `vscode/scripts/build.mjs`
- Create: `vscode/src/extension.js`

## Done When

- `vscode/` has its own `package.json` and `package-lock.json`.
- Root `package.json` is unchanged and is not a workspace root.
- The bundle inlines shared `src/` modules without copying them into `vscode/src/`.
- The bundle externalizes `vscode`, `playwright-core`, and `@mariozechner/clipboard`.
- The bundle emits `vscode/dist/extension.cjs`.
- The bundle copies `templates/default.html` into `vscode/dist/`.
- The manifest declares the five commands and the webview title menus.
- The manifest declares `tocBuilder.templatePath` with resource scope.
- The manifest declares `capabilities.untrustedWorkspaces.supported: false`.
- The manifest declares `extensionKind: ["ui"]`.
- The manifest pins a minimum `engines.vscode`.
- `dist/` and `node_modules/` stay ignored.
- `npm test` at the repo root passes unchanged.

Fresh verification commands:

- `npm ci --prefix vscode`
- `npm run build --prefix vscode`
- `ls vscode/dist`
- `npm test`

## Rules

Follow the supplied worker contract. Stay within scope. Maintain this phase's
`notes.md` and `journal.md`.

## Response Format

Return the ERP `# EXTERNAL RESPONSE` block and matching status line.
