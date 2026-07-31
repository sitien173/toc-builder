# Console Logging Implementation Plan

## Goal

Add optional console-only lifecycle logging to `toc-builder`.

The `--verbose` flag enables human-readable standard-error messages.
Unflagged commands retain their current output exactly.

## Design Source

Read `docs/designs/console-logging.md` before implementation.

## Route

- Sequence: implement, verify, audit, then review.
- Consultation: completed through confirmed design dialogue.
- Implement profile: resolve during execution.
- Review profile: resolve during execution.
- Context key: `console-logging`.
- Done when every fresh verification check passes.

## Global Constraints

- Keep logging entirely inside `src/cli.js`.
- Add no dependencies or shared logging abstraction.
- Preserve path-only standard output.
- Send verbose messages through standard error.
- Emit every milestone before its named operation.
- Emit completion only after successful command completion.
- Include no timing or document contents.
- Preserve current normal-mode output and exit codes.
- Keep clipboard failures warning-only and stack-free.
- Keep routine tests offline and side-effect free.
- Do not change non-CLI runtime modules.

### Phase 1: Deliver Optional Lifecycle Logging

**Task Guide Input:** Implement the confirmed console-only logging design. Add one order-independent `--verbose` flag with duplicate rejection. Keep all logging inside `src/cli.js` using the existing injectable standard-error boundary. Emit the confirmed `[toc]` lifecycle messages immediately before regular and screenshot operations. Emit `[toc] Complete` only after success. Keep stdout path-only and preserve all unflagged output. Preserve underlying operational errors as causes. Add originating stack traces for fatal verbose failures, including argument failures. Keep clipboard failures concise, warning-only, and stack-free. Add focused CLI tests first, update README usage, and avoid new dependencies or non-CLI module changes.

**Profile:** `Resolve at execution`

**Goal:** Provide complete opt-in CLI lifecycle diagnostics.

**Files:**

- Modify: `src/cli.js`
- Modify: `test/cli.test.js`
- Modify: `README.md`

**Tasks:**

1. Add failing tests for verbose parsing and output.
2. Implement inline lifecycle and fatal-stack logging.
3. Document verbose usage and compatibility guarantees.

**Acceptance Criteria:**

- Usage includes the optional `--verbose` flag.
- `--verbose` works in every valid argument position.
- Duplicate verbose flags return exit code `2`.
- Unflagged successful output remains unchanged.
- Unflagged errors remain concise and stack-free.
- Verbose messages use only standard error.
- Generated paths remain exclusive to standard output.
- Every confirmed milestone uses the `[toc]` prefix.
- Every lifecycle milestone precedes its named operation.
- Screenshot milestones require `--screenshot`.
- Completion appears only after complete command success.
- Messages contain relevant paths but no document contents.
- Messages contain no timestamps or elapsed durations.
- Fatal verbose failures include originating stack traces.
- Wrapped failures retain their underlying `cause`.
- Verbose argument failures include available stack traces.
- Clipboard failures still return exit code `0`.
- Clipboard warnings never include stack traces.
- Existing generated-file retention behavior remains unchanged.
- No dependency or non-CLI runtime file changes occur.

**Reviewer Checklist:**

- No verbose message reaches standard output.
- Existing path ordering remains unchanged.
- Milestone ordering matches actual workflow ordering.
- No screenshot message appears during regular execution.
- Failure paths never print a completion message.
- Cause handling retains original troubleshooting details.
- Stack traces remain strictly opt-in for fatal failures.
- Clipboard warnings remain concise during verbose execution.
- Logging never exposes Markdown or template contents.
- No needless logger abstraction or dependency appears.
- Tests mock browser, screenshot, and clipboard boundaries.
- README text matches implemented behavior exactly.

**Verification Checks:**

- `node --test test/cli.test.js`
- `npm test`

**Commit:** `feat(cli): add verbose lifecycle logging`

## Completion Criteria

- Every acceptance criterion passes inspection.
- Both verification commands pass freshly.
- Specification and independent quality reviews pass.
- Normal command output remains compatible.
- Verbose output matches the confirmed lifecycle.
- The final working tree is clean.
