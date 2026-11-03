export const THEME_MODES = ["light", "dark"] as const;
export const THEME_CONTRASTS = ["soft", "medium", "hard"] as const;
export const THEME_DEPTHS = ["original", "dim", "deep"] as const;
export type Theme = {
  mode: typeof THEME_MODES[number];
  contrast: typeof THEME_CONTRASTS[number];
  depth: typeof THEME_DEPTHS[number];
};
export const THEME_STORAGE_KEY = "linefilter:theme:v1";

// Official Everforest bg_dim, bg0, bg1, bg2, bg_red, bg_blue.
// https://github.com/sainnhe/everforest/blob/master/autoload/everforest.vim
const palettes = {
  dark: {
    hard: ["#1e2326", "#272e33", "#2e383c", "#374145", "#493b40", "#384b55"],
    medium: ["#232a2e", "#2d353b", "#343f44", "#3d484d", "#514045", "#3a515d"],
    soft: ["#293136", "#333c43", "#3a464c", "#434f55", "#59464c", "#3f5865"],
  },
  light: {
    hard: ["#f2efdf", "#fffbef", "#f8f5e4", "#f2efdf", "#ffe7de", "#ecf5ed"],
    medium: ["#efebd4", "#fdf6e3", "#f4f0d9", "#efebd4", "#fde3da", "#e9f0e9"],
    soft: ["#e5dfc5", "#f3ead3", "#eae4ca", "#e5dfc5", "#fadbd0", "#e1e7dd"],
  },
};

export function restoreTheme(raw: string | null, mode: Theme["mode"]): Theme {
  let data: Partial<Theme> = {};
  try {
    const value = JSON.parse(raw ?? "null");
    if (value && typeof value === "object" && !Array.isArray(value)) data = value;
  } catch { /* Use the system appearance for invalid saved settings. */ }
  return {
    mode: THEME_MODES.includes(data.mode!) ? data.mode! : mode,
    contrast: THEME_CONTRASTS.includes(data.contrast!) ? data.contrast! : "medium",
    depth: THEME_DEPTHS.includes(data.depth!) ? data.depth! : "original",
  };
}

function mix(a: string, b: string, amount: number): string {
  return "#" + [1, 3, 5].map((offset) => Math.round(
    parseInt(a.slice(offset, offset + 2), 16) * (1 - amount) + parseInt(b.slice(offset, offset + 2), 16) * amount,
  ).toString(16).padStart(2, "0")).join("");
}

export function getThemeTokens(theme: Theme) {
  const dark = theme.mode === "dark";
  const amount = { original: 0, dim: 0.16, deep: 0.32 }[theme.depth];
  const [canvas, surface, hover, pressed, dangerSurface, selection] = palettes[theme.mode][theme.contrast]
    .map((color) => mix(color, dark ? "#101719" : "#b9c0ab", amount));
  const accent = dark ? "#e69875" : "#f57d26";
  return {
    "color-scheme": theme.mode,
    "--canvas": canvas,
    "--surface": surface,
    "--text": dark ? "#d3c6aa" : "#293136",
    "--muted": dark ? "#b3bdb3" : "#505c62",
    "--line": mix(surface, dark ? "#9da9a0" : "#5c6a72", 0.24),
    "--field-line": dark ? "#9da9a0" : "#5c6a72",
    "--hover": hover,
    "--pressed": mix(hover, pressed, 0.25),
    "--accent": accent,
    "--accent-hover": mix(accent, dark ? "#f2efdf" : "#fffbef", 0.12),
    "--accent-pressed": mix(accent, "#1e2326", 0.08),
    "--on-accent": "#1e2326",
    "--focus": dark ? "#7fbbb3" : "#286489",
    "--accent-soft": mix(surface, selection, 0.5),
    "--danger": dark ? "#f3c0b8" : "#8f3033",
    "--danger-soft": dangerSurface,
  };
}

export function applyTheme(theme: Theme) {
  const root = document.documentElement;
  for (const [key, value] of Object.entries(getThemeTokens(theme))) root.style.setProperty(key, value);
  root.dataset.theme = `${theme.mode}-${theme.contrast}-${theme.depth}`;
}

const allTokens = Object.fromEntries(THEME_MODES.flatMap((mode) => THEME_CONTRASTS.flatMap((contrast) => THEME_DEPTHS.map((depth) => [
  `${mode}-${contrast}-${depth}`, getThemeTokens({ mode, contrast, depth }),
]))));

const declarations = (theme: Theme) => Object.entries(getThemeTokens(theme)).map(([key, value]) => `${key}:${value}`).join(";");
export const themeDefaultsCSS = `:root{${declarations({ mode: "light", contrast: "medium", depth: "original" })}}@media(prefers-color-scheme:dark){:root{${declarations({ mode: "dark", contrast: "medium", depth: "original" })}}`;

// Runs before body paint. Only static tokens are serialized; stored values select
// a validated key, never executable code or CSS supplied by the user.
export const themeBootstrap = `(()=>{const tokens=${JSON.stringify(allTokens)};let t={};try{t=JSON.parse(localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)}))||{}}catch{}const mode=['light','dark'].includes(t.mode)?t.mode:matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light';const contrast=['soft','medium','hard'].includes(t.contrast)?t.contrast:'medium';const depth=['original','dim','deep'].includes(t.depth)?t.depth:'original';const key=mode+'-'+contrast+'-'+depth;const root=document.documentElement;for(const [k,v]of Object.entries(tokens[key]))root.style.setProperty(k,v);root.dataset.theme=key;})()`;
