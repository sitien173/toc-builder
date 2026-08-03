<!-- ccg-shared-version: 10.0.0 -->

# Phase 4 — Journal: Add The Screenshot Command And Release Hardening

## META

- Plan: docs/plans/toc-vscode/PLAN.md
- Implementation Profile: default
- Consultation Profile: n/a
- Review Profile: default
- Implementation Job: n/a
- Review Job: n/a
- Started: 2026-08-03T13:28:40+07:00
- Finished: 2026-08-03T13:35:32+07:00

## Implementation Response

# EXTERNAL RESPONSE
## META
- Phase: phase-04
- Started: 2026-08-03T13:28:40+07:00
- Finished: 2026-08-03T13:35:32+07:00
- Plan dir: docs/plans/toc-vscode/phase-04
## SUMMARY
Implemented screenshot service with progress UI and Save PNG fallback, hardened URI escaping and resource roots (including extensionUri), documented extension, and added CI and publish workflows.
## FILES MODIFIED
| Action | Path | Change |
| Modify | vscode/src/preview-manager.js | Thread extensionUri into PreviewManager and include in localResourceRoots alongside document and template roots |
| Modify | vscode/test/preview-manager.test.js | Add test asserting extension resource root is included in localResourceRoots |
| Modify | vscode/src/activate.js | Set previewManager.extensionUri from context on activation |
| Modify | docs/plans/toc-vscode/phase-04/notes.md | Update decision notes and test evidence for task 3 fix |
| Modify | docs/plans/toc-vscode/phase-04/journal.md | Update META and append external response |
## NOTES
- docs/plans/toc-vscode/phase-04/notes.md (## Task 1, ## Task 2, ## Task 3, ## Task 4)
## SPEC COMPLIANCE
- Meets Spec? YES — All phase 4 acceptance criteria met, extension resource root included, 29 vscode tests pass, vsce ls succeeds, root test suite passes unchanged.
## CLARIFICATIONS NEEDED
None
## NEXT
TASK_COMPLETE

## Quality Review

<!-- Coordinator appends the independent review response here. -->

## Review Result

- Spec Status: PASS
- Debt: none

## Fix Re-Review

# CODE QUALITY REVIEW (fix delta)

- **Status:** PASS
- **Findings:**
- The missing extension resource URI is securely captured in `vscode/src/activate.js` via `context.extensionUri` and correctly threaded into `PreviewManager`.
- `PreviewManager.getLocalResourceRoots()` correctly consumes `this.extensionUri` and pushes it into the `roots` array alongside the document directory and custom template directory.
- The corresponding unit test in `vscode/test/preview-manager.test.js` successfully and rigorously asserts that all three distinct roots (`extensionUri`, document root, and template root) are actively populated within the `localResourceRoots` option array.
- The fix is fully contained within the authorized scope of files (`preview-manager.js`, `activate.js`, `preview-manager.test.js`, and the phase 04 documentation logs).
- All 29 vscode tests pass seamlessly, successfully verifying the new security requirement and resolving the blocking finding.
- **Scope:** 560f90c (a813941..HEAD)

## Final Commit

- Implementation: a813941 (feat(vscode): add screenshot command and release hardening)
- Fix: 560f90c (fix(vscode): include extension resource root in local resource roots)
- State record: this journal update's commit
