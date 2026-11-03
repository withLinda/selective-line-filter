import type { Workspace, Tool } from "./workspace";

export type Example = { id: string; label: string; input: string } & (
  | { tool: "filter"; needles: string; opts: Workspace["opts"] }
  | { tool: "replace"; replace: Workspace["replace"] }
);

export const EXAMPLES: Record<Tool, Example[]> = {
  filter: [
    { id: "error-logs", label: "Keep warnings & errors", tool: "filter", input: "INFO Server started\nDEBUG Cache warmed\nWARN Disk space low\nINFO Request complete\nERROR Connection timed out", needles: "WARN\nERROR", opts: { mode: "keep", useRegex: false, wholeWord: false, caseSensitive: false } },
    { id: "remove-comments", label: "Remove comments", tool: "filter", input: "# Server configuration\nPORT=3000\nHOST=localhost\n  # Disable debug in production\nDEBUG=false", needles: "^\\s*#", opts: { mode: "remove", useRegex: true, wholeWord: false, caseSensitive: false } },
    { id: "whole-words", label: "Match whole words", tool: "filter", input: "cat\ncatalog\nThe cat sleeps.\nconcatenate\nCat", needles: "cat", opts: { mode: "keep", useRegex: false, wholeWord: true, caseSensitive: false } },
  ],
  replace: [
    { id: "update-urls", label: "Upgrade URLs to HTTPS", tool: "replace", input: "http://example.com\nhttp://docs.example.com\nhttps://already-secure.example.com", replace: { find: "http://", replacement: "https://", caseSensitive: true } },
    { id: "rename-project", label: "Rename a project", tool: "replace", input: "Orion is ready.\nOpen the orion folder.\nORION → Orion", replace: { find: "orion", replacement: "Atlas", caseSensitive: false } },
    { id: "remove-labels", label: "Remove task prefixes", tool: "replace", input: "TODO: Write release notes\nTODO: Review the design\nTODO: Ship the update", replace: { find: "TODO: ", replacement: "", caseSensitive: true } },
  ],
};

export function applyExample(workspace: Workspace, example: Example): Workspace {
  return example.tool === "filter"
    ? { ...workspace, tool: example.tool, input: example.input, needles: example.needles, opts: { ...example.opts } }
    : { ...workspace, tool: example.tool, input: example.input, replace: { ...example.replace } };
}
