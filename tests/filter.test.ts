import test from "node:test";
import assert from "node:assert/strict";
import { safeFilter, type FilterOptions } from "../lib/filter";

const options: FilterOptions = { mode: "keep", useRegex: false, caseSensitive: false, wholeWord: false };

test("keeps or removes any matching line and reports counts", () => {
  const input = "INFO start\nWARN disk\nERROR db\nDEBUG value";
  assert.deepEqual(safeFilter(input, "WARN,ERROR", options).result, {
    output: "WARN disk\nERROR db", total: 4, kept: 2, removed: 2, matchedLines: 2,
  });
  assert.equal(safeFilter(input, "WARN\nERROR", { ...options, mode: "remove" }).result?.output, "INFO start\nDEBUG value");
});

test("preserves exact input with no search", () => {
  assert.equal(safeFilter("a\r\nb\r\n", " , \n", options).result?.output, "a\r\nb\r\n");
});

test("preserves case-sensitive, literal and whole-word filtering", () => {
  assert.equal(safeFilter("cat\nCat\ncatalog", "cat", { ...options, caseSensitive: true, wholeWord: true }).result?.output, "cat");
  assert.equal(safeFilter("a.b\naXb", "a.b", options).result?.output, "a.b");
});

test("supports regex and returns invalid-pattern errors without throwing", () => {
  assert.equal(safeFilter("foo\nbar\nfood", "^foo$", { ...options, useRegex: true }).result?.output, "foo");
  const invalid = safeFilter("text", "[", { ...options, useRegex: true });
  assert.ok(invalid.error);
  assert.equal(invalid.result, undefined);
});
