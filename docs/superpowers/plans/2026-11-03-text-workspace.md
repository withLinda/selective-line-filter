# Text Workspace Implementation Plan

> **For agentic workers:** Use executing-plans to implement inline; review the complete change with a fresh reviewer.

**Goal:** Add literal text replacement and deliver a minimal, accessible, responsive text workspace without losing existing filtering workflows.

**Architecture:** Keep transforms pure, validate persisted state at its boundary, and isolate asynchronous processing from the UI. Compose two native editors with compact task controls.

**Tech Stack:** Existing Next.js, React, TypeScript, Lucide, CSS; Node test runner.

**Spec:** `docs/superpowers/specs/2026-11-03-text-workspace-design.md`

## Steps

- [x] Research and design
- [x] Pure transforms and draft compatibility
- [x] Workspace and editor redesign
- [x] Verification, review and documentation

## Global constraints

- No new runtime dependencies, backend, accounts, external fonts, or text transmission.
- No hero, tagline, helper prose, decorative imagery, stat badges, sidebars, or use-case footer.
- Preserve the existing filter semantics and all input/output workflows.
- Source text is never overwritten by a transform.
- User delegated decisions; implement inline in the current checkout and leave changes available for review.

## Review focus

1. Literal dollar sequences, whitespace and regex characters must not be interpreted in replacement.
2. Changing inputs or switching tools during processing must never expose stale output for export.
3. Legacy, partially malformed and unavailable browser storage must not crash or erase a usable draft.
4. Large documents and pathological regex must keep the UI responsive and line gutters aligned.
5. An empty successful result, output edits and failed clipboard/file access must have truthful state.

## Task 1: Pure transforms and drafts

Files: `lib/replace.ts`, `lib/workspace.ts`, `lib/transform.ts`, `tests/*.test.ts`, `tsconfig.test.json`, package scripts/lockfile.

Interfaces: `replaceText(input, find, replacement, caseSensitive): {output, replacements}`; `restoreWorkspace(raw: string | null): Workspace`; `transform(state: Workspace): TransformResult`. Workspace includes shared input, active tool, existing filter options/search and independent replacement settings.

- [x] Reconcile installed dependencies/lockfile with existing manifest; add dependency-free test command.
- [x] Write tests with hand-derived outputs: all occurrences; case; literal `$&`, `$1`, backslashes and regex characters; multiline CRLF; Unicode; empty query; deletion; non-overlap. Run and observe missing capability failure.
- [x] Implement pure replacement, preserving original bytes outside matches.
- [x] Add filtering regression tests for keep/remove, comma/newline queries, whole words, regex errors and empty query.
- [x] Write draft migration/validation tests, observe failure, then implement fieldwise validation and defaults.
- [x] Run all engine/draft tests and type checks.

## Task 2: Workspace and editors

Files: `app/use-workspace.ts`, `lib/transform.worker.ts`, `app/components/text-editor.tsx`, `app/page.tsx`, `app/globals.css`, `app/layout.tsx`, `tailwind.config.ts`.

Interfaces: hook exposes workspace/update/run/result/editOutput/clear/undo/error/busy/ready; editors expose native textarea value/change/ref and accessible label IDs. Worker consumes Workspace and returns TransformResult.

- [x] Check baseline UI in a real browser and confirm replacement is unavailable.
- [x] Implement hydration-gated persistence and worker lifecycle (3-second timeout, cancel on edit, terminate on completion/unmount).
- [x] Implement a visible-row gutter sharing the textarea's measured line-height/padding and exact scroll position.
- [x] Build compact Filter / Replace switch, task fields, equal editors, primary action and quiet outcome metadata. Use native buttons and labeled fields.
- [x] Preserve import, paste, drop, editable output, exports, shortcuts and Clear/Undo. Protect asynchronous file/paste completion from overwriting newer edits.
- [x] Validate desktop/mobile and keyboard operation; inspect screenshots and refine spacing/contrast.

## Task 3: Verification and handoff

Files: `README.md`, this plan, current screenshot.

- [x] Run pure suite, lint, `tsc --noEmit`, and production build.
- [x] Browser checks: literal replacements, filter options, invalid regex, worker timeout, stale result invalidation, copy/download (including empty output), file/drop handling, draft restore, Clear/Undo, output edits and keyboard actions.
- [x] Check narrow widths, dark appearance, zoom, long-line scrolling and virtualized gutters; inspect errors.
- [x] Request one fresh code review; resolve material findings and verify affected behavior.
- [x] Update concise README and screenshot; record final commands/outcomes below.

## Execution record

- Research completed: existing source and history, referenced replacement page and JavaScript, Linear website, Apple accessibility guidance.
- Design tooling: 12ui stopped at account authentication before generation; no generated target exists. Use the researched local design rather than blocking on an external account.
- Preflight: transform and hook share Workspace/TransformResult; editor accepts native textarea attributes. No conflicting interfaces.
- Workflow: user explicitly waived questions and delegated design decisions. Keep work in the supplied checkout, no publish/push/merge.
- Dependency decision: keep the declared Next 14/React 18 architecture, use Next 14.2.35 and matching ESLint config, and track the previously ignored lockfile for repeatable installs. No new runtime dependencies. Broader framework upgrades are outside this feature.
- Pure suite: initial missing replacement/draft modules failed compilation; implementation passed 15 cases. Added CRLF UI-boundary regression failed (0 vs 1 replacement), then passed after logical newline matching. Final suite: **16/16**.
- Browser baseline confirmed existing UI and missing replacement. Production-browser checks passed: legacy draft, both tools, literal tokens, Match case, source preservation, invalidation, keyboard run/copy, edited output, Clear/Undo, reload persistence, empty exports, clipboard, upload/drop and file validation.
- Failure checks passed: invalid regex, three-second regex timeout, cancel-on-switch, partial malformed storage, blocked storage, clipboard denial, late paste/file reads and rejected file reads.
- Layout checks passed: 320/390px widths without document overflow, light/dark appearance, 200% text enlargement, 10,000-line / 1.6 MB import with visible-only gutter, exact fractional scroll alignment and horizontal long-line scrolling. Direct automation fill of 1.6 MB stalled Chrome; importing the identical file completed and demonstrated responsive rendering. No production change was inferred from that automation-path failure.
- Independent review: fixed all three findings. Multiline queries now match imported CRLF/CR while preserving unmatched bytes; copied feedback is tied to result identity/revision and cleared before retries; edited output hides historical statistics. Browser regression script failed for all three before fixes and passed after fixes.
- Desktop fit: measured workspace bottom exceeded the 900px viewport before adjustment; editor height now leaves 40px beneath the workspace. Added a small SVG favicon to eliminate missing-icon requests.
- Final commands: `npm test` **16 passed**; `npm run lint` **no warnings/errors**; `npm run typecheck` **passed**; `npm run build` **passed**, static home route, 92.8 kB first-load JS. Build emits non-blocking browser compatibility database age notices.
- Browser evidence and local executable check snippets: `output/playwright/` (git-ignored). Updated repository screenshot shows the actual production build, not a mockup.
