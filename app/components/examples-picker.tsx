"use client";

import { EXAMPLES, type Example } from "@/lib/examples";
import type { Tool } from "@/lib/workspace";
import { Disclosure } from "./disclosure";

export function ExamplesPicker({ tool, disabled, onSelect }: { tool: Tool; disabled: boolean; onSelect: (example: Example) => void }) {
  return <Disclosure label="Examples" className="examples-picker">
    {EXAMPLES[tool].map((example) => <button type="button" className="example-option" key={example.id} disabled={disabled} onClick={(event) => {
      const details = event.currentTarget.closest("details");
      if (details) { details.open = false; details.querySelector("summary")?.focus(); }
      onSelect(example);
    }}>{example.label}</button>)}
  </Disclosure>;
}
