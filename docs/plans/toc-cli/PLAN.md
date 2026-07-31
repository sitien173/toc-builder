# TOC CLI Implementation Plan

## Goal

Build the confirmed cross-platform `toc-builder` npm package.

The installed `toc` command generates temporary Markdeep HTML.
It then opens that file using the default browser.

## Design Source

Read `docs/designs/toc-cli.md` before every phase.

## Route

- Sequence: implement, verify, audit, then review.
- Consultation: completed during design.
- Implement profile: resolve during execution.
- Review profile: resolve during execution.
- Context key: `toc-cli`.
- Done when every fresh phase check passes.

## Global Constraints

- Use ESM and Node.js 20 or newer.
- Use `open` as the only runtime dependency.
- Use Node.js built-in testing tools.
- Keep rendering independent from filesystem operations.
- Never open real browsers during automated tests.
- Do not add unconfirmed features.

### Phase 1: Render Valid Markdeep Documents

**Task Guide Input:** Create the ESM npm package foundation and pure Markdeep renderer. Add the default complete HTML template. Validate exactly one Markdown placeholder inside the body. Inject the owned Markdeep footer before the closing body tag. Preserve Markdown content unchanged. Add focused renderer tests using Node.js built-in testing tools.

**Profile:** Resolve at execution

**Goal:** Produce validated HTML without filesystem side effects.

**Files:**

- Create: `package.json`
- Create: `package-lock.json`
- Create: `src/render.js`
- Create: `templates/default.html`
- Create: `test/render.test.js`

**Tasks:**

1. Define package metadata, scripts, engines, and dependency.
2. Add the confirmed default HTML template.
3. Implement pure template validation and rendering.
4. Cover valid and invalid rendering behavior.

**Acceptance Criteria:**

- Package name is `toc-builder`.
- Package format is ESM.
- Supported Node.js version starts at 20.
- The `toc` binary maps to `src/cli.js`.
- `open` is the only runtime dependency.
- Default HTML contains exactly one `{{markdown}}`.
- Rendering requires exactly one Markdown placeholder.
- Rendering requires one unambiguous body region.
- Rendering requires the placeholder inside that body.
- Rendering requires exactly one closing body tag.
- Footer insertion precedes Markdown replacement.
- Footer configures `tocStyle` as `long`.
- Footer loads `https://morgan3d.github.io/markdeep/latest/markdeep.min.js`.
- Markdown content remains byte-for-byte unchanged.

**Reviewer Checklist:**

- Template validation stays simple and deterministic.
- Tag matching handles reasonable HTML capitalization.
- Markdown containing `</body>` cannot change footer placement.
- Rendering performs no filesystem or browser operations.
- Tests never access the network.

**Verification Checks:**

- `npm test -- test/render.test.js`
- `npm ls --depth=0`

**Commit:** `feat(renderer): add Markdeep HTML rendering`

### Phase 2: Generate And Open Temporary HTML

**Task Guide Input:** Implement the executable `toc` command. Parse one Markdown path and optional `--template` path. Accept case-insensitive `.md` extensions. Read UTF-8 content, render it, create exclusive UUID-named HTML under the operating-system temporary directory, print its absolute path, and open its file URL using `open`. Preserve output after launch failures. Implement confirmed exit codes and focused tests without launching browsers.

**Profile:** Resolve at execution

**Goal:** Deliver the complete local CLI workflow.

**Files:**

- Create: `src/cli.js`
- Create: `test/cli.test.js`

**Tasks:**

1. Parse arguments and validate Markdown inputs.
2. Orchestrate reading, rendering, and exclusive writing.
3. Print output paths and launch browser file URLs.
4. Cover success paths and confirmed failure behavior.

**Acceptance Criteria:**

- Usage is `toc <file.md> [--template <template.html>]`.
- The entry file contains a portable Node.js shebang.
- The installed `toc` command is executable.
- Exactly one Markdown input is accepted.
- `.md` extension matching is case-insensitive.
- Relative paths resolve from the working directory.
- Input and template files use UTF-8.
- Default template loading works after npm installation.
- Output uses `<uuid>_<stem>.md.html`.
- Output lives directly under `os.tmpdir()`.
- File creation uses exclusive write behavior.
- Success prints the absolute generated path.
- Browser launching receives a valid file URL.
- Generated files remain after successful launching.
- Launch failures retain and print generated output.
- Argument failures exit with code `2`.
- Operational failures exit with code `1`.
- Default errors omit stack traces.

**Reviewer Checklist:**

- CLI tests inject or mock browser launching.
- Tests never open an actual browser.
- Input basename cannot escape the temporary directory.
- Errors never hide a retained generated path.
- CLI behavior matches Windows, macOS, and Linux paths.

**Verification Checks:**

- `npm test -- test/cli.test.js`
- `npm test`

**Commit:** `feat(cli): generate and open temporary TOC`

### Phase 3: Document And Package Cross-Platform Usage

**Task Guide Input:** Document installation, command usage, template requirements, output retention, network requirements, and trusted-content risks. Add cross-platform automated verification for Node.js 20 on Linux, macOS, and Windows. Confirm the npm package contains the executable, renderer, and default template. Do not publish the package.

**Profile:** Resolve at execution

**Goal:** Make the package understandable and release-ready.

**Files:**

- Create: `README.md`
- Create: `.github/workflows/ci.yml`
- Modify: `package.json`

**Tasks:**

1. Document installation and basic command usage.
2. Document custom templates and failure recovery.
3. Add a three-platform Node.js test matrix.
4. Restrict and verify packed npm artifact contents.

**Acceptance Criteria:**

- README documents `npm install --global toc-builder`.
- README documents the installed `toc` command.
- README shows default and custom-template usage.
- README describes the exact template placeholder contract.
- README explains temporary file retention.
- README discloses remote Markdeep network requirements.
- README treats Markdown and templates as trusted content.
- CI runs tests on Linux, macOS, and Windows.
- CI uses Node.js 20 or newer.
- Package metadata includes only required runtime files.
- Packed output includes every runtime-required file.
- No release or publish command runs automatically.

**Reviewer Checklist:**

- Documentation matches implemented arguments and errors.
- Examples use the confirmed output naming format.
- CI never launches a real browser.
- Package metadata exposes only required runtime files.
- No unsupported feature appears in documentation.

**Verification Checks:**

- `npm test`
- `npm pack --dry-run`
- `npm ls --depth=0`

**Commit:** `chore(release): prepare cross-platform package`

## Completion Criteria

- Every phase meets its acceptance criteria.
- Every verification command passes freshly.
- Every phase receives independent quality review.
- The final working tree is clean.
- No browser opens during automated verification.
