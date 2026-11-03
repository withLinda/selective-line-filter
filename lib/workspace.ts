import type { FilterOptions } from "./filter";

export type Tool = "filter" | "replace";

export interface Workspace {
  tool: Tool;
  input: string;
  needles: string;
  opts: FilterOptions;
  replace: { find: string; replacement: string; caseSensitive: boolean };
}

export const STORAGE_KEY = "linefilter:v2";
export const LEGACY_STORAGE_KEY = "linefilter:v1";

export function createWorkspace(): Workspace {
  return {
    tool: "filter",
    input: "",
    needles: "",
    opts: { mode: "keep", useRegex: false, caseSensitive: false, wholeWord: false },
    replace: { find: "", replacement: "", caseSensitive: true },
  };
}

function record(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

export function restoreWorkspace(raw: string | null): Workspace {
  const defaults = createWorkspace();
  try {
    const data = record(JSON.parse(raw ?? "null"));
    const opts = record(data.opts);
    const replace = record(data.replace);
    return {
      tool: data.tool === "replace" ? "replace" : "filter",
      input: typeof data.input === "string" ? data.input : defaults.input,
      needles: typeof data.needles === "string" ? data.needles : defaults.needles,
      opts: {
        mode: opts.mode === "remove" ? "remove" : "keep",
        useRegex: typeof opts.useRegex === "boolean" ? opts.useRegex : defaults.opts.useRegex,
        caseSensitive: typeof opts.caseSensitive === "boolean" ? opts.caseSensitive : defaults.opts.caseSensitive,
        wholeWord: typeof opts.wholeWord === "boolean" ? opts.wholeWord : defaults.opts.wholeWord,
      },
      replace: {
        find: typeof replace.find === "string" ? replace.find : "",
        replacement: typeof replace.replacement === "string" ? replace.replacement : "",
        caseSensitive: typeof replace.caseSensitive === "boolean" ? replace.caseSensitive : true,
      },
    };
  } catch {
    return defaults;
  }
}
