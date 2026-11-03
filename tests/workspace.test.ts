import test from "node:test";
import assert from "node:assert/strict";
import { createWorkspace, restoreWorkspace } from "../lib/workspace";

test("restores a legacy draft without losing source or options", () => {
  const state = restoreWorkspace(JSON.stringify({ input: "saved\r\ntext", needles: "ERROR", opts: { mode: "remove", useRegex: true, caseSensitive: true, wholeWord: true } }));
  assert.equal(state.input, "saved\r\ntext");
  assert.equal(state.needles, "ERROR");
  assert.deepEqual(state.opts, { mode: "remove", useRegex: true, caseSensitive: true, wholeWord: true });
  assert.equal(state.tool, "filter");
  assert.equal(state.replace.caseSensitive, true);
});

test("round-trips replacement settings independently from filter settings", () => {
  const state = { ...createWorkspace(), tool: "replace", input: "source", replace: { find: "a,b\n", replacement: "$1", caseSensitive: false } };
  assert.deepEqual(restoreWorkspace(JSON.stringify(state)), state);
});

test("validates saved state field by field", () => {
  const state = restoreWorkspace(JSON.stringify({ input: "keep me", needles: 12, tool: "oops", opts: { mode: "oops", useRegex: "true", caseSensitive: true }, replace: { find: "valid", replacement: null, caseSensitive: 0 } }));
  assert.equal(state.input, "keep me");
  assert.equal(state.needles, "");
  assert.equal(state.tool, "filter");
  assert.deepEqual(state.opts, { mode: "keep", useRegex: false, caseSensitive: true, wholeWord: false });
  assert.deepEqual(state.replace, { find: "valid", replacement: "", caseSensitive: true });
});

test("malformed storage falls back to an empty usable workspace", () => {
  for (const raw of [null, "", "{", "null", "42", "[]", '{"opts":null,"replace":[]}']) {
    assert.deepEqual(restoreWorkspace(raw), createWorkspace());
  }
});
