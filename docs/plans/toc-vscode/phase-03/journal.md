<!-- ccg-shared-version: 10.0.0 -->

# Phase 3 — Journal: Add The Preview Panel And Commands

## META

- Plan: docs/plans/toc-vscode/PLAN.md
- Implementation Profile: default
- Consultation Profile: n/a
- Review Profile: default
- Implementation Job: n/a
- Review Job: n/a
- Started: 2026-08-03T13:24:38+07:00
- Finished: 2026-08-03T13:25:44+07:00

## Implementation Response

# EXTERNAL RESPONSE
## META
- Phase: phase-03
- Started: 2026-08-03T13:24:38+07:00
- Finished: 2026-08-03T13:25:44+07:00
- Plan dir: docs/plans/toc-vscode/phase-03
## SUMMARY
Added preview panel controller, reusable panel manager, template commands, webview panel serializer, and activation wiring with full mocked-VSCode test coverage.
## FILES MODIFIED
| Action | Path | Change |
| Create | vscode/src/preview-controller.js | Add preview controller with 250ms edit debounce, save refresh, generation guard, and inbound message validation |
| Create | vscode/src/preview-manager.js | Add reusable panel manager for single window panel, retargeting, and serializer restoration |
| Create | vscode/src/template-commands.js | Add template pick/set and reset commands with validation error handling |
| Create | vscode/src/activate.js | Add extension factory and activation wiring for commands and serializer |
| Modify | vscode/src/extension.js | Update extension entry to load default template and delegate activation |
| Create | vscode/test/preview-controller.test.js | Add unit tests for debounce, save, generation guard, and document filtering |
| Create | vscode/test/preview-manager.test.js | Add unit tests for panel reuse, disposal cleanup, and serializer restoration |
| Create | vscode/test/template-commands.test.js | Add unit tests for template command flows and validation error handling |
| Create | vscode/test/activate.test.js | Add unit tests for command and serializer registration on activation |
| Modify | docs/plans/toc-vscode/phase-03/notes.md | Add decision notes and test evidence for tasks 1-4 |
| Modify | docs/plans/toc-vscode/phase-03/journal.md | Update META and append external response |
## NOTES
- docs/plans/toc-vscode/phase-03/notes.md (## Task 1, ## Task 2, ## Task 3, ## Task 4)
## SPEC COMPLIANCE
- Meets Spec? YES — All phase 3 requirements implemented, 24 vscode tests pass, bundle builds cleanly, root test suite passes unchanged.
## CLARIFICATIONS NEEDED
None
## NEXT
TASK_COMPLETE

## Quality Review

# CODE QUALITY REVIEW

- **Status:** PASS
- **Findings:**
- The `PreviewManager` strictly maintains exactly one preview panel, correctly retargeting its `PreviewController` to new documents when `showPreview` is triggered without ever auto-following active editor changes.
- Edits made to the currently targeted document robustly trigger a debounced `scheduleRefresh` (with the required 250 ms delay), while document saves actively cancel the debounce and trigger a `forceRefresh` instantly.
- Irrelevant document changes are effectively filtered out by checking `e.document === this.document` in the workspace event subscriptions.
- Async renders are protected against race conditions using strict generation tracking; `++this.generation` securely prevents older, stale asynchronous data from overwriting newer preview renders.
- Webview disposal mechanisms meticulously set the `disposed` flag, clear all panel references (`this.panel = null`), aggressively cancel debounce timers, and aggressively sweep event subscriptions, guaranteeing that disposed panels receive absolutely zero updates.
- The webview serializer performs a robust best-effort recovery: it intercepts malformed state or missing URIs and elegantly halts restoration with an inline error HTML fallback without corrupting internal state.
- Message traffic adheres to strict validation; inbound commands are vetted by `validateInboundMessage`, and explicitly ignore stale payloads when `msg.revision !== this.revision`.
- Raw HTML content avoids crossing the `postMessage` boundary entirely, relying directly on `panel.webview.html = ...` for updates.
- `retainContextWhenHidden: false` and `localResourceRoots: []` are explicitly declared in the panel options exactly as designed for Phase 3.
- Failed rendering passes due to template parsing errors safely abort processing via a try-catch, leaving both the prior configuration and the previously rendered HTML undisturbed.
- All 5 manifest commands and the webview serializer successfully wire themselves in `activate.js`, keeping the screenshot feature intentionally stubbed.
- Root `npm test` successfully executes with zero disruption.
- **Scope:** 09dd763 (962f31a..HEAD)

## Review Result

- Spec Status: PASS
- Debt: none

## Final Commit

- Implementation: 09dd763 (feat(vscode): add preview panel and commands)
- State record: this journal update's commit
