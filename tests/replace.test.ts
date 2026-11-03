import test from "node:test";
import assert from "node:assert/strict";
import { replaceText } from "../lib/replace";

test("replaces every exact occurrence and leaves different case alone", () => {
  assert.deepEqual(replaceText("red Red red", "red", "yellow", true), {
    output: "yellow Red yellow", replacements: 2,
  });
});

test("can match without case sensitivity", () => {
  assert.deepEqual(replaceText("Red RED red", "red", "blue", false), {
    output: "blue blue blue", replacements: 3,
  });
});

test("search and replacement tokens are literal", () => {
  assert.deepEqual(replaceText("a.b aXb a.b", "a.b", "$& $1 \\n", true), {
    output: "$& $1 \\n aXb $& $1 \\n", replacements: 2,
  });
  assert.equal(replaceText("[x] + [x]", "[x]", "$`$'$$", true).output, "$`$'$$ + $`$'$$");
});

test("preserves whitespace, commas and original line endings", () => {
  assert.deepEqual(replaceText(" a,b\r\n a,b\r\n", " a,b", "", true), {
    output: "\r\n\r\n", replacements: 2,
  });
  assert.equal(replaceText("a\r\nb\r\na\r\nb", "a\r\nb", "c\nd", true).output, "c\nd\r\nc\nd");
});

test("empty search and absent matches leave input intact", () => {
  assert.deepEqual(replaceText("hello\r\n", "", "x", true), { output: "hello\r\n", replacements: 0 });
  assert.deepEqual(replaceText("hello", "z", "x", true), { output: "hello", replacements: 0 });
  assert.deepEqual(replaceText("", "a", "b", true), { output: "", replacements: 0 });
});

test("replacements are non-overlapping and do not recursively replace new text", () => {
  assert.deepEqual(replaceText("aaaaa", "aa", "aaa", true), { output: "aaaaaaa", replacements: 2 });
});

test("supports Unicode without corrupting surrogate pairs", () => {
  assert.deepEqual(replaceText("🙂 café 🙂 CAFÉ", "🙂", "🌱", true), {
    output: "🌱 café 🌱 CAFÉ", replacements: 2,
  });
  assert.equal(replaceText("café CAFÉ", "café", "tea", false).output, "tea tea");
});

test("multiline queries match imported line endings without rewriting unmatched text", () => {
  assert.deepEqual(replaceText("a\r\nb\r\nc", "a\nb", "X", true), {
    output: "X\r\nc", replacements: 1,
  });
  assert.deepEqual(replaceText("a\rb\rc", "a\nb", "X", true), {
    output: "X\rc", replacements: 1,
  });
  assert.equal(replaceText("a\nb\nc", "a\r\nb", "X", true).output, "X\nc");
});
