import { safeFilter, type FilterResult } from "./filter";
import { replaceText } from "./replace";
import type { Workspace } from "./workspace";

export type TransformResult = {
  output: string;
  ms: number;
} & (
  | { tool: "filter"; stats: FilterResult }
  | { tool: "replace"; replacements: number }
);

export type WorkerReply = { result: TransformResult; error?: never } | { error: string; result?: never };

export function transform(state: Workspace): TransformResult {
  const start = performance.now();
  if (state.tool === "replace") {
    const result = replaceText(state.input, state.replace.find, state.replace.replacement, state.replace.caseSensitive);
    return { ...result, tool: "replace", ms: performance.now() - start };
  }
  const { result, error } = safeFilter(state.input, state.needles, state.opts);
  if (!result) throw new Error(error ?? "Could not filter this text.");
  return { tool: "filter", output: result.output, stats: result, ms: performance.now() - start };
}
