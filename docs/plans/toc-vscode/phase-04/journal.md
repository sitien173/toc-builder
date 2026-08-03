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
- Finished: 2026-08-03T13:30:48+07:00

## Implementation Response

# EXTERNAL RESPONSE
## META
- Phase: phase-04
- Started: 2026-08-03T13:28:40+07:00
- Finished: 2026-08-03T13:30:48+07:00
- Plan dir: docs/plans/toc-vscode/phase-04
## SUMMARY
Implemented screenshot service with progress UI and Save PNG fallback, hardened URI escaping and resource roots, documented extension, and added CI and publish workflows.
## FILES MODIFIED
| Action | Path | Change |
| Create | vscode/src/screenshot-service.js | Add screenshot service with progress UI, concurrency guard, and clipboard fallback |
| Create | vscode/test/screenshot-service.test.js | Add unit tests for screenshot service, progress UI, and Save PNG fallback |
| Create | vscode/README.md | Add extension README documenting usage, security, requirements, and packaging |
| Modify | vscode/src/webview-html.js | Add safe non-ASCII URI encoding |
| Modify | vscode/src/preview-manager.js | Add localResourceRoots calculation covering document, template, and extension directories |
| Modify | vscode/src/activate.js | Wire ScreenshotService for tocBuilder.screenshot command |
| Modify | .github/workflows/ci.yml | Add isolated VSCode extension CI job |
| Create | .github/workflows/vscode-publish.yml | Add VSCode marketplace publish workflow requiring explicit release trigger |
| Modify | docs/plans/toc-vscode/phase-04/notes.md | Add decision notes and test evidence for tasks 1-4 |
| Modify | docs/plans/toc-vscode/phase-04/journal.md | Update META and append external response |
## NOTES
- docs/plans/toc-vscode/phase-04/notes.md (## Task 1, ## Task 2, ## Task 3, ## Task 4)
## SPEC COMPLIANCE
- Meets Spec? YES — All phase 4 acceptance criteria met, 28 extension tests pass, vsce ls succeeds, root test suite passes unchanged.
## CLARIFICATIONS NEEDED
None
## NEXT
TASK_COMPLETE

## Quality Review

<!-- Coordinator appends the independent review response here. -->

## Review Result

- Spec Status: PENDING
- Debt: none

## Final Commit

- Implementation: pending
- State record: this journal update's commit
