# TOC VSCode Extension Implementation Plan

## Goal

Add a VSCode extension package to the `toc-builder` repo.

The extension renders the active Markdown document with a long Markdeep
table of contents inside a reusable webview panel. It supports custom
templates, live refresh on edit and save, and a screenshot command that
captures the rendered TOC element to the desktop clipboard.

The extension reuses the shared `src/` modules. The root npm package,
its tests, and its publishing stay unchanged.

## Design Source

Read `docs/designs/toc-vscode.md` before every phase.

## Route

- Sequence: implement, verify, audit, then review.
- Consultation: completed during design.
- Implement profile: resolve during execution.
- Review profile: resolve during execution.
- Context key: `toc-vscode`.
- Done when every fresh phase check passes.

## Global Constraints

- Keep the root npm package unchanged and non-workspace.
- Keep all shared `src/` modules byte-for-byte unchanged.
- Use plain JavaScript, never TypeScript.
- Load Markdeep from the remote URL, same as the CLI.
- Keep `capabilities.untrustedWorkspaces.supported: false`.
- Keep `extensionKind: ["ui"]`.
- Run tests with `node:test` and a mocked VSCode API.
- Never launch a real browser or extension host in routine tests.
- Keep root `npm test` and publishing unchanged.
- Never commit a duplicate of shared source or the default template.
- Document the trusted-content model.

### Phase 1: Scaffold The Extension Package

**Task Guide Input:** Add the VSCode extension package foundation. Create an independent `vscode/` package inside the repo with its own manifest, lockfile, and ignore list. Keep the root npm package unchanged and non-workspace. Define a plain-JavaScript esbuild bundle that inlines the shared `src/render.js`, `src/screenshot.js`, and `src/clipboard.js` modules, externalizes `vscode`, `playwright-core`, and `@mariozechner/clipboard`, and copies the shared `templates/default.html` into the bundle. Declare the five commands, the webview title-bar menus, the resource-scoped template configuration, untrusted-workspace support off, the UI extension kind, and a pinned minimum VSCode engine. Add a minimal loadable extension entry with an activation registration skeleton. Verify the bundle builds and that the root test suite is unaffected.

**Profile:** `Resolve at execution`

**Goal:** Produce a buildable extension package that reuses the shared modules without altering the root package.

**Files:**

- Create: `vscode/package.json`
- Create: `vscode/package-lock.json`
- Create: `vscode/.vscodeignore`
- Create: `vscode/scripts/build.mjs`
- Create: `vscode/src/extension.js`

**Tasks:**

1. Create the `vscode/` package manifest with commands, menus, config, capabilities, engine, and dependencies.
2. Add the esbuild bundle script that inlines shared modules and copies the default template.
3. Add a minimal loadable extension entry and activation registration skeleton.
4. Verify the bundle output and root test isolation.

**Acceptance Criteria:**

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
- Root `npm test` passes unchanged.

**Reviewer Checklist:**

- No duplicate of shared source exists inside `vscode/src/`.
- No npm workspace or root package change was introduced.
- Externalized modules are also declared as runtime dependencies.
- The default template is copied, not re-authored.
- Manifest command IDs match the activation registration skeleton.
- No release or publish step runs automatically.

**Verification Checks:**

- `npm ci --prefix vscode`
- `npm run build --prefix vscode`
- `ls vscode/dist`
- `npm test`

**Commit:** `chore(vscode): scaffold extension package`

### Phase 2: Add The Rendering And Template Layer

**Task Guide Input:** Add the pure rendering and template layer for the extension. Define the versioned message protocol constants. Add the webview HTML adapter that injects the CSP meta, an optional base element, and a bootstrap ready script into the shared render output, rejects or replaces any template-supplied CSP, and safely JSON-encodes state. Add the content service that snapshots the in-memory document text and resolves the active template through `workspace.fs`, validating with the shared `validateTemplate`. Add the template service that resolves the resource-scoped `tocBuilder.templatePath` configuration for the document URI, reads and validates candidate templates, and commits configuration only after validation succeeds. Cover the adapter, content service, and template service with mocked-VSCode node tests. Keep the layer free of any dependency on the panel or webview lifecycle.

**Profile:** `Resolve at execution`

**Goal:** Deliver the testable rendering and template resolution layer.

**Files:**

- Create: `vscode/src/protocol.js`
- Create: `vscode/src/webview-html.js`
- Create: `vscode/src/content-service.js`
- Create: `vscode/src/template-service.js`
- Create: `vscode/test/webview-html.test.js`
- Create: `vscode/test/content-service.test.js`
- Create: `vscode/test/template-service.test.js`

**Tasks:**

1. Add protocol constants and the webview HTML adapter.
2. Add the content snapshot service.
3. Add the template resolution and validation service.
4. Cover the layer with mocked-VSCode tests.

**Acceptance Criteria:**

- `protocol.js` exports versioned message shapes.
- Webview HTML keeps the shared render output for the body.
- The CSP is the first element in the head.
- The webview CSP includes `webview.cspSource`.
- The CSP allows only the remote Markdeep origin for scripts.
- A template-supplied CSP is rejected or replaced.
- The bootstrap acquires the VSCode API and posts a ready message on load.
- State is JSON-encoded with `<` escaped.
- Content snapshots use `document.getText()`.
- Templates resolve through `workspace.fs` and decode UTF-8.
- Invalid templates fail validation before any config write.
- Multi-root config resolves against the document URI.
- Tests never import the real `vscode` module.

**Reviewer Checklist:**

- Raw URIs are never interpolated into script blocks.
- The base URI keeps a trailing slash.
- Exactly one `.longTOC` remains the screenshot authority.
- No path, command, or HTML input is accepted from template content.
- Config writes happen only after successful validation.
- The layer has no dependency on the panel or webview lifecycle.

**Verification Checks:**

- `npm test --prefix vscode`
- `npm test`

**Commit:** `feat(vscode): add webview rendering and template layer`

### Phase 3: Add The Preview Panel And Commands

**Task Guide Input:** Add the preview panel controller and command wiring. Implement a single reusable webview panel manager that creates, reveals, and retargets one panel per window, binds it to the document selected at preview time, and cleans up debounce timers, watchers, and generation state on disposal. Implement the preview controller with a 250 ms change debounce, save-triggered immediate refresh, template and configuration refresh triggers, a monotonic generation guard, and validation of inbound webview messages. Add the template commands that pick, validate, and commit a template or clear it to the default. Add the extension entry that constructs the manager with injected dependencies and registers the five commands plus the webview panel serializer. Cover panel lifecycle, debounce, generation, serializer restoration, template commands, and message validation with mocked-VSCode node tests.

**Profile:** `Resolve at execution`

**Goal:** Deliver the working preview panel, refresh behavior, and command wiring.

**Files:**

- Create: `vscode/src/preview-controller.js`
- Create: `vscode/src/preview-manager.js`
- Create: `vscode/src/template-commands.js`
- Create: `vscode/src/activate.js`
- Modify: `vscode/src/extension.js`
- Create: `vscode/test/preview-controller.test.js`
- Create: `vscode/test/preview-manager.test.js`
- Create: `vscode/test/template-commands.test.js`
- Create: `vscode/test/activate.test.js`

**Tasks:**

1. Implement the preview controller with debounce, generation guard, and refresh triggers.
2. Implement the reusable panel manager and disposal lifecycle.
3. Implement the template commands and command and serializer registration.
4. Cover lifecycle, debounce, generation, template, and messaging with tests.

**Acceptance Criteria:**

- One panel is reused and retargeted across preview invocations.
- The panel binds to the document selected at preview time.
- The panel never auto-follows the active editor.
- Edits coalesce into one refresh after 250 ms.
- Save cancels the debounce and refreshes immediately.
- Unrelated document changes are ignored.
- Stale async renders never overwrite newer content.
- Disposed panels receive no updates.
- The serializer restores state best-effort and shows an error page for missing documents.
- Inbound messages are validated and stale revisions ignored.
- `retainContextWhenHidden` is false.
- Invalid templates leave the previous preview and configuration unchanged.
- All five commands and the serializer register on activation.

**Reviewer Checklist:**

- No raw HTML travels over `postMessage`.
- The panel reference is cleared on disposal.
- Debounce timers are cancelled on disposal.
- Generation checks run after every await.
- Serializer validation rejects malformed source URIs.
- Command registration matches the manifest IDs.

**Verification Checks:**

- `npm test --prefix vscode`
- `npm run build --prefix vscode`
- `npm test`

**Commit:** `feat(vscode): add preview panel and commands`

### Phase 4: Add The Screenshot Command And Release Hardening

**Task Guide Input:** Add the screenshot command and release hardening. Implement a screenshot service that builds a fresh snapshot from the in-memory document, renders with the shared screenshot renderer, captures the single `.longTOC` element through the shared headless capture, copies PNG bytes through the shared clipboard adapter, runs under progress UI, prevents concurrent captures, and offers a Save PNG fallback when clipboard copying fails. Harden message validation, non-ASCII URI escaping, local resource roots, and untrusted-workspace handling. Document usage, trusted-content risks, remote Markdeep dependency, and packaging in the extension README. Add a CI job that installs, tests, and builds the extension without touching the root suite, and add a marketplace publish workflow that requires explicit release steps. Cover the screenshot service and hardening with mocked-VSCode node tests.

**Profile:** `Resolve at execution`

**Goal:** Deliver the screenshot command and release-ready hardening.

**Files:**

- Create: `vscode/src/screenshot-service.js`
- Create: `vscode/test/screenshot-service.test.js`
- Create: `vscode/README.md`
- Modify: `vscode/src/preview-controller.js`
- Modify: `vscode/src/webview-html.js`
- Modify: `.github/workflows/ci.yml`
- Create: `.github/workflows/vscode-publish.yml`

**Tasks:**

1. Implement the screenshot service.
2. Add screenshot service tests.
3. Harden message validation, URI escaping, and resource roots.
4. Document the extension and add CI and release workflows.

**Acceptance Criteria:**

- The screenshot uses `renderForScreenshot`, not preview HTML.
- The screenshot uses a fresh `document.getText()` snapshot.
- The screenshot runs under progress UI.
- Concurrent captures for one controller are prevented.
- Clipboard failure keeps the PNG bytes and offers Save PNG.
- The bundle externalizes `playwright-core` and `@mariozechner/clipboard`.
- Local resource roots cover document, template, and extension resources.
- Non-ASCII URIs are escaped once.
- Untrusted workspaces are unsupported.
- The extension README documents usage, security, and risks.
- The CI job builds and tests the extension without affecting root `npm test`.
- The publish workflow requires a marketplace token and does not run in normal CI.
- Root `npm test` passes.

**Reviewer Checklist:**

- No live-webview capture is attempted.
- Clipboard failures never return success.
- The exact PNG buffer reaches the clipboard adapter.
- Stale or malformed messages cannot trigger screenshots.
- The CI job stays isolated from the root suite.
- The publish workflow cannot run without explicit release steps and secrets.
- README claims match implemented behavior.

**Verification Checks:**

- `npm test --prefix vscode`
- `npm run build --prefix vscode`
- `cd vscode && npx vsce ls`
- `npm test`

**Commit:** `feat(vscode): add screenshot command and release hardening`

## Completion Criteria

- Every phase meets its acceptance criteria.
- Every verification command passes freshly.
- Every phase receives independent quality review.
- The root package, its tests, and its publishing remain unchanged.
- Shared modules are reused, never duplicated.
- The extension builds, tests, and packages without launching a browser or extension host.
- The final working tree is clean.
