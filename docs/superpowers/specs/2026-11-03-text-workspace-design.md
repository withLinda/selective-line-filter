# Text workspace design

## Intent

Add the referenced replace-text capability and redesign the existing utility for people who value minimalism and low cognitive load. Keep a single purpose, understandable layout, simple implementation, and existing functionality. The user explicitly delegated design and implementation decisions and requested no approval questions.

## Research

- The existing app is a single Next.js page with pure filtering in `lib/filter.ts`. Its 658-line page mixes editing, persistence, file operations, and rendering. It has no tests.
- Existing capabilities: keep/remove lines; comma/newline-separated searches; regex, case and whole-word options; editable output; numbered editors; file selection/drop; clipboard; download; keyboard shortcuts; local drafts.
- https://www.unit-conversion.info/texttools/replace-text/ describes all-occurrence text replacement. Its prose contradicts itself on case sensitivity, but the example replaces `red` and leaves `Red`. Its JavaScript sends source text to the server; this app will continue processing locally.
- https://linear.app emphasizes restrained hierarchy and focus. Borrow the precision, not its marketing layout.
- https://developer.apple.com/design/human-interface-guidelines/accessibility recommends familiar controls, simple actions, readable contrast, keyboard access, and avoiding distracting/timed interfaces.
- The 12ui improve workflow was attempted, but requires an interactive account login before generating any design. No draft or approved image was produced. Proceed with a locally implemented design using the research above, without requiring the user to create an account.
- Installed packages and lockfile differ from package.json (Next 15/React 19 versus declared Next 14/React 18). Reconcile to the existing manifest before verification.

## Chosen approach

One workspace with Filter / Replace navigation, a compact task-specific control strip, and equal Input / Output editors. This keeps the source/result relationship visible and avoids both separate pages (duplicated state) and a combined filter/replace pipeline (ambiguous ordering).

Warm neutral canvas, white editing surfaces, dark text, subtle dividers, restrained blue primary action, system sans-serif controls and monospaced text. Follow system dark appearance. No hero, tagline, helper prose, decorative imagery, stat badges, sidebars, or use-case footer. Visible labels name inputs and actions; titles and accessible names explain icon-only actions.

On phones, controls wrap and editors stack in source-to-result order. Every action supports keyboard access and visible focus. No motion is needed. Success feedback persists until the next relevant interaction.

## Behavior

- Filter preserves current matching semantics and defaults. Empty search returns the original text.
- Replace accepts one literal search string (including spaces, commas, newlines, Unicode, and regex characters), a literal replacement, and Match case (on by default). Replace all non-overlapping occurrences. Dollar tokens and backslashes stay literal. Newlines match logical LF/CRLF/CR breaks because native textarea input normalizes newlines; unmatched source bytes stay intact. An empty replacement deletes matches; an empty search is a no-op at the engine boundary and disables the UI action.
- Both tools run explicitly with one primary action or Cmd/Ctrl+Enter. This keeps large input and editable output predictable. Changing source/settings or switching tools invalidates the previous result immediately; exports cannot silently export a stale result.
- Source text is never overwritten by a transform. Output remains editable; metadata reflects edits. Empty successful results can still be downloaded/copied.
- Keep the input and each tool's settings when switching. Start with blank source rather than an unsolicited example. Restore existing `linefilter:v1` drafts into a validated `linefilter:v2` state without overwriting on mount. Malformed saved values fall back field by field. Storage failures must not prevent editing.
- Preserve paste, upload/drop (.txt, .json, .jsonl, .md), copy, download, Cmd/Ctrl+Shift+C, Escape to dismiss errors, and Clear all. Clear all offers a single Undo clear action until the next edit.
- Keep line counts and outcome summary quiet; detailed filter statistics remain available in a disclosure. Number gutters render only visible rows and follow exact textarea scroll offsets; disable soft wrap to keep logical lines aligned.
- Run transformations in one disposable worker with a 3-second timeout so pathological regex cannot freeze editing. Cancel work on edits/tool switches/unmount; ignore obsolete results. Handle worker/file/clipboard errors inline with accessible announcements.

## Architecture

- `lib/filter.ts`: existing pure filtering contract.
- `lib/replace.ts`: pure literal replacement with replacement count.
- `lib/workspace.ts`: typed state, defaults and validation/migration.
- `lib/transform.ts`, `lib/transform.worker.ts`: shared result contract and worker entry.
- `app/use-workspace.ts`: draft lifecycle, transformation lifecycle, result invalidation and undo.
- `app/components/text-editor.tsx`: native textarea plus visible-only numbered gutter.
- `app/page.tsx`: task controls, file/clipboard actions and composition.
- `app/globals.css`: compact semantic styles and appearance tokens.

No new runtime dependencies, backend, accounts, external fonts, or text transmission. Retain Next.js/React and the existing icon package. Use Node's built-in test runner with TypeScript compilation.

## Verification

Pure behavior tests cover replacement boundaries, literal tokens, Unicode, CRLF, filtering regressions, and corrupted/legacy drafts. Browser checks cover both tools, exports, errors, restore, undo, timeout, keyboard actions, gutter scrolling, empty results, mobile layout, dark mode and zoom. Run lint, type checking and production build; review actual screenshots. Document decisions and evidence in the implementation plan.
