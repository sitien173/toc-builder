<!-- ccg-shared-version: 10.0.0 -->

# Phase 2 — Journal: Add The Rendering And Template Layer

## META

- Plan: docs/plans/toc-vscode/PLAN.md
- Implementation Profile: default
- Consultation Profile: n/a
- Review Profile: default
- Implementation Job: n/a
- Review Job: n/a
- Started: 2026-08-03T13:20:26+07:00
- Finished: 2026-08-03T13:21:55+07:00

## Implementation Response

# EXTERNAL RESPONSE
## META
- Phase: phase-02
- Started: 2026-08-03T13:20:26+07:00
- Finished: 2026-08-03T13:21:55+07:00
- Plan dir: docs/plans/toc-vscode/phase-02
## SUMMARY
Added the pure rendering and template resolution layer including protocol constants, webview HTML adapter, content snapshot service, template service, and unit tests.
## FILES MODIFIED
| Action | Path | Change |
| Create | vscode/src/protocol.js | Add protocol constants and message validator |
| Create | vscode/src/webview-html.js | Add webview HTML adapter with CSP, base tag, and bootstrap script |
| Create | vscode/src/content-service.js | Add content snapshot service using document.getText() and UTF-8 workspace.fs template reads |
| Create | vscode/src/template-service.js | Add template resolution service with validation-guarded configuration updates |
| Create | vscode/test/webview-html.test.js | Add tests for protocol validation and webview HTML adapter |
| Create | vscode/test/content-service.test.js | Add mocked-VSCode tests for content snapshot service |
| Create | vscode/test/template-service.test.js | Add mocked-VSCode tests for template resolution service |
| Modify | docs/plans/toc-vscode/phase-02/notes.md | Add decision notes and test evidence for tasks 1-4 |
| Modify | docs/plans/toc-vscode/phase-02/journal.md | Update META and append external response |
## NOTES
- docs/plans/toc-vscode/phase-02/notes.md (## Task 1, ## Task 2, ## Task 3, ## Task 4)
## SPEC COMPLIANCE
- Meets Spec? YES — All phase 2 requirements implemented, 13 vscode tests pass, root test suite passes unchanged.
## CLARIFICATIONS NEEDED
None
## NEXT
TASK_COMPLETE

## Quality Review

# CODE QUALITY REVIEW

- **Status:** PASS
- **Findings:**
- `protocol.js` successfully exports `PROTOCOL_VERSION`, `MESSAGE_TYPES`, and a robust `validateInboundMessage` function that strictly checks message shapes.
- The `webview-html.js` adapter correctly preserves the shared render output for the HTML body by surgically injecting required assets strictly inside `<head>`.
- The Content-Security-Policy (CSP) is explicitly enforced as the very first element inside the `<head>`.
- The injected webview CSP perfectly binds `webview.cspSource` for styles, images, and fonts while securely locking `script-src` to `'unsafe-inline'` and the remote `https://morgan3d.github.io` Markdeep origin.
- Any pre-existing template-supplied CSP `<meta>` tag is safely identified via regex and cleanly stripped before replacement.
- The bootstrap script safely acquires the `vscode` API and fires the `ready` message reliably inside `window.addEventListener('load', ...)` after verifying font readiness and requesting an animation frame.
- Webview initial state securely serializes to JSON with all `<` characters aggressively escaped as `\\u003c`, completely preventing script injection.
- Content snapshots correctly invoke `document.getText()` on the raw text document object without binding to editor lifecycles.
- Custom templates are successfully resolved via `workspace.fs` and are cleanly decoded from raw bytes using a UTF-8 `TextDecoder`.
- Both validation and preview fail fast; `TemplateService` stringently validates a template's placeholders before attempting any configuration update.
- The `TemplateService` uses `workspace.getConfiguration('tocBuilder', documentUri)`, properly respecting multi-root configurations.
- None of the test files import the real `vscode` module; they all effectively utilize mock workspaces.
- Raw URIs are never directly interpolated into script blocks (only via the safe JSON payload), the base URI appropriately appends a trailing slash, and the layer is completely decoupled from VSCode webview panels.
- Root `npm test` runs and passes successfully.
- **Scope:** 75ad07b (0aec0bb..HEAD)

## Review Result

- Spec Status: PASS
- Debt: none

## Final Commit

- Implementation: 75ad07b (feat(vscode): add webview rendering and template layer)
- State record: this journal update's commit
