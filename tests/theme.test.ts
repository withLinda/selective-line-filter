import test from "node:test";
import assert from "node:assert/strict";
import { getThemeTokens, restoreTheme, THEME_MODES, THEME_CONTRASTS, THEME_DEPTHS } from "../lib/theme";

function luminance(hex: string): number {
  const channels = hex.slice(1).match(/../g)!.map((channel) => {
    const value = parseInt(channel, 16) / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
}

function contrast(a: string, b: string): number {
  const values = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (values[0] + 0.05) / (values[1] + 0.05);
}

test("restores theme settings independently and rejects invalid stored values", () => {
  assert.deepEqual(restoreTheme('{"mode":"light","contrast":"hard","depth":"deep"}', "dark"), { mode: "light", contrast: "hard", depth: "deep" });
  assert.deepEqual(restoreTheme('{"mode":"bad","contrast":"soft","depth":42}', "light"), { mode: "light", contrast: "soft", depth: "original" });
  for (const raw of [null, "{", "null", "[]", "false"]) {
    assert.deepEqual(restoreTheme(raw, "dark"), { mode: "dark", contrast: "medium", depth: "original" });
  }
});

test("every theme keeps readable text, action labels and meaningful boundaries", () => {
  for (const mode of THEME_MODES) for (const family of THEME_CONTRASTS) for (const depth of THEME_DEPTHS) {
    const t = getThemeTokens({ mode, contrast: family, depth });
    const name = `${mode}/${family}/${depth}`;
    for (const surface of ["--canvas", "--surface", "--hover", "--pressed"] as const) {
      assert.ok(contrast(t["--text"], t[surface]) >= 5, `${name}: dense text on ${surface}`);
      assert.ok(contrast(t["--muted"], t[surface]) >= 4.5, `${name}: secondary text on ${surface}`);
    }
    for (const state of ["--accent", "--accent-hover", "--accent-pressed"] as const) {
      assert.ok(contrast(t["--on-accent"], t[state]) >= 4.5, `${name}: action ${state}`);
    }
    assert.ok(contrast(t["--danger"], t["--danger-soft"]) >= 4.5, `${name}: error text`);
    assert.ok(contrast(t["--text"], t["--accent-soft"]) >= 4.5, `${name}: selection text`);
    assert.ok(contrast(t["--field-line"], t["--surface"]) >= 3, `${name}: field boundary`);
    for (const surface of ["--surface", "--canvas", "--hover"] as const) {
      assert.ok(contrast(t["--focus"], t[surface]) >= 3, `${name}: focus on ${surface}`);
    }
  }
});

test("depth darkens surfaces progressively without changing action family or appearance", () => {
  for (const mode of THEME_MODES) for (const contrast of THEME_CONTRASTS) {
    const variants = THEME_DEPTHS.map((depth) => getThemeTokens({ mode, contrast, depth }));
    for (const surface of ["--canvas", "--surface", "--hover"] as const) {
      assert.ok(luminance(variants[0][surface]) > luminance(variants[1][surface]));
      assert.ok(luminance(variants[1][surface]) > luminance(variants[2][surface]));
    }
    assert.equal(new Set(variants.map((theme) => theme["--accent"])).size, 1);
    for (const theme of variants) assert.equal(theme["color-scheme"], mode);
  }
});
