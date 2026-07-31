<!-- ccg-shared-version: 10.0.0 -->

# Phase 3: Decision Notes

## Task 1

### Decisions made
- Documented global installation, the `toc` executable, default usage, custom-template usage, path rules, and canonical output naming.

### Spec deviations
- none

### Tradeoffs accepted
- none

### Assumptions
- Users have Node.js 20 or newer when developing or running from source.

### Follow-ups for human
- none

### Test evidence
- README content reviewed against the confirmed CLI usage and output contract.

## Task 2

### Decisions made
- Documented the exact template contract, retained temporary output, manual recovery after browser launch failure, remote Markdeep dependency, and trusted-content security warning.

### Spec deviations
- none

### Tradeoffs accepted
- none

### Assumptions
- The remote Markdeep `latest` URL remains the intended documented loader.

### Follow-ups for human
- none

### Test evidence
- README includes all required operational, network, retention, and security guidance.

## Task 3

### Decisions made
- Added a GitHub Actions matrix for Ubuntu, macOS, and Windows across Node.js 20 and 22.
- CI uses `npm ci` and `npm test`; tests inject browser launchers and never open a real browser.

### Spec deviations
- none

### Tradeoffs accepted
- Testing Node.js 22 in addition to the minimum Node.js 20 increases coverage without changing the support floor.

### Assumptions
- GitHub-hosted runners provide the required cross-platform Node.js environments.

### Follow-ups for human
- none

### Test evidence
- Workflow reviewed for all three operating systems, Node.js 20+, dependency installation, and test execution.

## Task 4

### Decisions made
- Restricted the packed artifact with `package.json` `files` metadata to README, source runtime files, and templates.
- Kept tests, CI configuration, and planning documents out of the npm package.

### Spec deviations
- none

### Tradeoffs accepted
- npm-generated package metadata remains included automatically as required by npm.

### Assumptions
- `src/cli.js`, `src/render.js`, and `templates/default.html` are the complete runtime file set.

### Follow-ups for human
- none

### Test evidence
- `npm test`: 14 passed, 0 failed.
- `npm pack --dry-run`: package contains exactly README.md, package.json, src/cli.js, src/render.js, and templates/default.html.
- `npm ls --depth=0`: `open@11.0.0` is the only runtime dependency.
- No publish command was run or added.
