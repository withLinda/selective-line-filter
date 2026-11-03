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

function luminance(hex: string): number {
  const channels = [1, 3, 5].map((offset) => {
    const value = parseInt(hex.slice(offset, offset + 2), 16) / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
}

// Keep the palette hue, adjusting only as much as its actual surfaces require.
function readable(color: string, surfaces: string[], dark: boolean, minimum = 7): string {
  const backgrounds = surfaces.map(luminance);
  for (let step = 0; step <= 100; step++) {
    const candidate = mix(color, dark ? "#ffffff" : "#101719", step / 100);
    const foreground = luminance(candidate);
    if (backgrounds.every((background) =>
      (Math.max(foreground, background) + 0.05) / (Math.min(foreground, background) + 0.05) >= minimum,
    )) return candidate;
  }
  throw new Error("Theme surfaces cannot meet the required contrast.");
}

export function getThemeTokens(theme: Theme) {
  const dark = theme.mode === "dark";
  const amount = { original: 0, dim: 0.16, deep: 0.32 }[theme.depth];
  const [canvas, surface, hover, pressed, dangerSurface, selection] = palettes[theme.mode][theme.contrast]
    .map((color) => mix(color, dark ? "#101719" : "#b9c0ab", amount));
  const accent = dark ? "#e69875" : "#f57d26";
  // All seven original accents retain one meaning. Raw colors tint surfaces;
  // adjusted companions make labels and essential indicators accessible.
  const colors = dark
    ? { navigation: "#7fbbb3", success: "#a7c080", active: "#83c092", warning: "#dbbc7f", danger: "#e67e80", example: "#d699b6" }
    : { navigation: "#3a94c5", success: "#8da101", active: "#35a77c", warning: "#dfa000", danger: "#f85552", example: "#df69ba" };
  const pressedSurface = mix(hover, pressed, 0.25);
  const baseSurfaces = [canvas, surface, hover, pressedSurface];
  const soft = (color: string) => mix(surface, color, dark ? 0.12 : 0.09);
  const tints = { navigation: soft(colors.navigation), success: soft(colors.success), active: soft(colors.active), warning: soft(colors.warning), danger: dangerSurface, example: soft(colors.example) };
  const surfaces = [...baseSurfaces, ...Object.values(tints), mix(surface, selection, 0.5)];
  const label = (role: keyof typeof colors) => readable(colors[role], surfaces, dark);
  const indicator = (role: keyof typeof colors) => readable(colors[role], surfaces, dark, 3);
  return {
    "color-scheme": theme.mode,
    "--canvas": canvas,
    "--surface": surface,
    "--text": readable(dark ? "#d3c6aa" : "#293136", surfaces, dark),
    "--muted": readable(dark ? "#b3bdb3" : "#505c62", surfaces, dark),
    "--line": mix(surface, dark ? "#9da9a0" : "#5c6a72", 0.24),
    "--field-line": dark ? "#9da9a0" : "#5c6a72",
    "--hover": hover,
    "--pressed": pressedSurface,
    "--accent": accent,
    "--accent-hover": mix(accent, dark ? "#f2efdf" : "#fffbef", 0.12),
    "--accent-pressed": mix(accent, dark ? "#f2efdf" : "#fffbef", 0.04),
    "--on-accent": "#080c0e",
    "--focus": indicator("navigation"),
    "--accent-soft": mix(surface, selection, 0.5),
    "--navigation": label("navigation"),
    "--navigation-indicator": indicator("navigation"),
    "--navigation-soft": tints.navigation,
    "--success": label("success"),
    "--success-indicator": indicator("success"),
    "--success-soft": tints.success,
    "--active": label("active"),
    "--active-indicator": indicator("active"),
    "--active-soft": tints.active,
    "--warning": label("warning"),
    "--warning-indicator": indicator("warning"),
    "--warning-soft": tints.warning,
    "--example": label("example"),
    "--example-indicator": indicator("example"),
    "--example-soft": tints.example,
    "--danger": label("danger"),
    "--danger-indicator": indicator("danger"),
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
