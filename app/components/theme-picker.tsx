"use client";

import { useEffect, useState } from "react";
import { applyTheme, restoreTheme, THEME_CONTRASTS, THEME_DEPTHS, THEME_MODES, THEME_STORAGE_KEY, type Theme } from "@/lib/theme";
import { Disclosure } from "./disclosure";

export function ThemePicker() {
  const [theme, setTheme] = useState<Theme>({ mode: "light", contrast: "medium", depth: "original" });
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const systemMode = matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    let raw = null;
    try { raw = localStorage.getItem(THEME_STORAGE_KEY); } catch { /* Memory-only settings still work. */ }
    const initial = restoreTheme(raw, systemMode);
    setTheme(initial);
    applyTheme(initial);
    setReady(true);
  }, []);

  const change = (patch: Partial<Theme>) => {
    const next = { ...theme, ...patch };
    setTheme(next);
    applyTheme(next);
    try { localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(next)); } catch { /* Keep the applied theme. */ }
  };

  return <Disclosure label="Theme" className="theme-picker">
    <div className="picker-title">Everforest</div>
    {([
      ["mode", "Appearance", THEME_MODES],
      ["contrast", "Contrast", THEME_CONTRASTS],
      ["depth", "Depth", THEME_DEPTHS],
    ] as const).map(([key, label, choices]) => <fieldset key={key}>
      <legend>{label}</legend>
      <div className="picker-options">
        {choices.map((value) => <button key={value} type="button" disabled={!ready} aria-pressed={theme[key] === value} onClick={() => change({ [key]: value })}>
          {value[0].toUpperCase() + value.slice(1)}
        </button>)}
      </div>
    </fieldset>)}
  </Disclosure>;
}
