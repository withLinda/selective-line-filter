import test from "node:test";
import assert from "node:assert/strict";
import { EXAMPLES, applyExample } from "../lib/examples";
import { createWorkspace } from "../lib/workspace";
import { transform } from "../lib/transform";

const expected: Record<string, string> = {
  "error-logs": "WARN Disk space low\nERROR Connection timed out",
  "remove-comments": "PORT=3000\nHOST=localhost\nDEBUG=false",
  "whole-words": "cat\nThe cat sleeps.\nCat",
  "update-urls": "https://example.com\nhttps://docs.example.com\nhttps://already-secure.example.com",
  "rename-project": "Atlas is ready.\nOpen the Atlas folder.\nAtlas → Atlas",
  "remove-labels": "Write release notes\nReview the design\nShip the update",
};

test("every example produces its intended useful result with the real engine", () => {
  for (const tool of ["filter", "replace"] as const) {
    assert.equal(EXAMPLES[tool].length, 3);
    for (const example of EXAMPLES[tool]) {
      assert.ok(expected[example.id] !== undefined, `Expected output for ${example.id}`);
      const workspace = applyExample(createWorkspace(), example);
      assert.equal(workspace.tool, tool);
      assert.equal(transform(workspace).output, expected[example.id], example.id);
    }
  }
});

test("examples preserve the other tool's settings and never mutate the current draft", () => {
  const original = createWorkspace();
  original.input = "my unsaved text";
  original.needles = "custom query";
  original.replace = { find: "private", replacement: "public", caseSensitive: false };
  const filter = applyExample(original, EXAMPLES.filter[0]);
  assert.deepEqual(filter.replace, { find: "private", replacement: "public", caseSensitive: false });
  const replace = applyExample(original, EXAMPLES.replace[0]);
  assert.equal(replace.needles, "custom query");
  assert.equal(original.input, "my unsaved text");
});
