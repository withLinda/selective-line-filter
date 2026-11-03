"use client";

import { useCallback, useRef, useState, type KeyboardEvent } from "react";
import { ArrowRight, Check, ClipboardPaste, Copy, Download, ListFilter, RotateCcw, Upload, X } from "lucide-react";
import { TextEditor } from "./components/text-editor";
import { useWorkspace } from "./use-workspace";
import type { Tool } from "@/lib/workspace";
import { ThemePicker } from "./components/theme-picker";
import { ExamplesPicker } from "./components/examples-picker";

const FILE_TYPES = [".txt", ".json", ".jsonl", ".md"];
const countLines = (text: string) => text ? text.split(/\r\n|\r|\n/).length : 0;
const linesLabel = (count: number) => `${count.toLocaleString()} ${count === 1 ? "line" : "lines"}`;

export default function Home() {
  const { workspace, update, ready, result, busy, error, setError, run, clear, undo, canUndo, undoKind, loadExample, editOutput, revision } = useWorkspace();
  const { input, needles, opts, replace, tool } = workspace;
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [copied, setCopied] = useState<{ result: typeof result; revision: number } | null>(null);
  const [dragging, setDragging] = useState(false);
  const importId = useRef(0);
  const canRun = ready && !!input && (tool === "filter" || !!replace.find);
  const hasContent = !!(input || needles || replace.find || replace.replacement || result);

  const paste = async () => {
    const version = revision.current;
    const id = ++importId.current;
    try {
      const text = await navigator.clipboard.readText();
      if (version !== revision.current || id !== importId.current) return;
      update({ input: text });
      inputRef.current?.focus();
    } catch {
      if (version === revision.current && id === importId.current) setError("Clipboard unavailable. Paste directly into Input with ⌘V or Ctrl+V.");
    }
  };

  const upload = async (file: File) => {
    const id = ++importId.current;
    const version = revision.current;
    if (!FILE_TYPES.some((extension) => file.name.toLowerCase().endsWith(extension)) && !["text/plain", "application/json"].includes(file.type)) {
      setError("Choose a .txt, .json, .jsonl, or .md file.");
      return;
    }
    try {
      const text = await file.text();
      if (version !== revision.current || id !== importId.current) return;
      update({ input: text });
      inputRef.current?.focus();
    } catch {
      if (version === revision.current && id === importId.current) setError("Could not read this file. Please try again.");
    }
  };

  const copy = useCallback(async () => {
    if (!result) return;
    setCopied(null);
    const version = revision.current;
    try {
      await navigator.clipboard.writeText(result.output);
      if (version === revision.current) {
        setCopied({ result, revision: version });
        setError(null);
      }
    } catch {
      if (version === revision.current) setError("Clipboard unavailable. Select the output and copy it directly.");
    }
  }, [result, revision, setError]);

  const download = () => {
    if (!result) return;
    const url = URL.createObjectURL(new Blob([result.output], { type: "text/plain;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = result.tool === "filter" ? "filtered.txt" : "replaced.txt";
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.nativeEvent.isComposing) return;
    if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
      event.preventDefault();
      run();
    } else if ((event.metaKey || event.ctrlKey) && event.shiftKey && event.key.toLowerCase() === "c" && result) {
      event.preventDefault();
      void copy();
    } else if (event.key === "Escape") {
      setError(null);
    }
  };

  const switchTool = (next: Tool) => {
    if (next !== tool) update({ tool: next });
  };

  const summary = result?.edited
    ? "Edited"
    : result?.tool === "replace"
      ? `${result.replacements.toLocaleString()} ${result.replacements === 1 ? "replacement" : "replacements"}`
      : result?.tool === "filter"
        ? `${result.stats.kept.toLocaleString()} of ${result.stats.total.toLocaleString()} lines`
        : "";
  const isCopied = result !== null && copied?.result === result && copied.revision === revision.current;

  return (
    <main className="app-shell" onKeyDown={onKeyDown}>
      <header className="app-header">
        <h1><ListFilter size={20} aria-hidden="true" />Line Filter</h1>
        <div className="tool-switch" role="group" aria-label="Text tool">
          <button aria-pressed={tool === "filter"} onClick={() => switchTool("filter")} disabled={!ready}>Filter</button>
          <button aria-pressed={tool === "replace"} onClick={() => switchTool("replace")} disabled={!ready}>Replace</button>
        </div>
        <div className="header-actions">
        <ThemePicker />
        <button className="button quiet clear-button" disabled={!ready || (!canUndo && !hasContent)} onClick={() => { setCopied(null); canUndo ? undo() : clear(); }}>
          {canUndo ? <RotateCcw size={15} aria-hidden="true" /> : <X size={15} aria-hidden="true" />}
          {canUndo ? `Undo ${undoKind}` : "Clear all"}
        </button>
        </div>
      </header>

      <section className="workspace" aria-label={tool === "filter" ? "Filter lines" : "Replace text"}>
        <form className="task-controls" onSubmit={(event) => { event.preventDefault(); setCopied(null); run(); }}>
          {tool === "filter" ? (
            <div className="filter-fields">
              <label className="field-label" htmlFor="filter-find">
                Find
                <textarea id="filter-find" className="search-field" rows={2} value={needles} spellCheck={false} disabled={!ready} title="Separate search terms with commas or new lines" onChange={(event) => update({ needles: event.target.value })} />
              </label>
              <div className="mode-switch" role="group" aria-label="Matching lines">
                <button type="button" aria-pressed={opts.mode === "keep"} disabled={!ready} onClick={() => update({ opts: { ...opts, mode: "keep" } })}>Keep</button>
                <button type="button" aria-pressed={opts.mode === "remove"} disabled={!ready} onClick={() => update({ opts: { ...opts, mode: "remove" } })}>Remove</button>
              </div>
            </div>
          ) : (
            <div className="replace-fields">
              <label className="field-label" htmlFor="replace-find">
                Find
                <textarea id="replace-find" className="search-field" rows={2} value={replace.find} spellCheck={false} disabled={!ready} onChange={(event) => update({ replace: { ...replace, find: event.target.value } })} />
              </label>
              <label className="field-label" htmlFor="replace-with">
                Replace with
                <textarea id="replace-with" className="search-field" rows={2} value={replace.replacement} spellCheck={false} disabled={!ready} onChange={(event) => update({ replace: { ...replace, replacement: event.target.value } })} />
              </label>
            </div>
          )}
          <div className="control-actions">
            <div className="match-options">
              <label><input type="checkbox" disabled={!ready} checked={tool === "filter" ? opts.caseSensitive : replace.caseSensitive} onChange={(event) => update(tool === "filter" ? { opts: { ...opts, caseSensitive: event.target.checked } } : { replace: { ...replace, caseSensitive: event.target.checked } })} />Match case</label>
              {tool === "filter" && <>
                <label><input type="checkbox" disabled={!ready} checked={opts.wholeWord} onChange={(event) => update({ opts: { ...opts, wholeWord: event.target.checked } })} />Whole word</label>
                <label><input type="checkbox" disabled={!ready} checked={opts.useRegex} onChange={(event) => update({ opts: { ...opts, useRegex: event.target.checked } })} />Regex</label>
              </>}
            </div>
            <ExamplesPicker tool={tool} disabled={!ready} onSelect={(example) => { setCopied(null); loadExample(example); }} />
            <button type="submit" className="button primary" disabled={!canRun || busy} title="Run · ⌘Enter / Ctrl+Enter" aria-keyshortcuts="Meta+Enter Control+Enter">
              {busy ? "Processing…" : tool === "filter" ? "Filter lines" : "Replace all"}
              <ArrowRight size={16} aria-hidden="true" />
            </button>
          </div>
        </form>

        {error && <div className="error-message" role="alert"><span>{error}</span><button className="icon-button" aria-label="Dismiss error" onClick={() => setError(null)}><X size={16} aria-hidden="true" /></button></div>}

        <div className="editors">
          <section className={`editor-pane${dragging ? " is-dragging" : ""}`} aria-labelledby="input-label"
            onDragOver={(event) => { if (Array.from(event.dataTransfer.types).includes("Files")) { event.preventDefault(); setDragging(true); } }}
            onDragLeave={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDragging(false); }}
            onDrop={(event) => { event.preventDefault(); setDragging(false); const file = event.dataTransfer.files[0]; if (file && ready) void upload(file); }}>
            <div className="pane-header">
              <label id="input-label" htmlFor="input-text">Input</label>
              <div className="pane-actions">
                <button className="button quiet" disabled={!ready} onClick={paste}><ClipboardPaste size={15} aria-hidden="true" />Paste</button>
                <button className="icon-button" disabled={!ready} aria-label="Upload file" title="Upload .txt, .json, .jsonl, or .md" onClick={() => fileRef.current?.click()}><Upload size={16} aria-hidden="true" /></button>
                <input ref={fileRef} type="file" accept={FILE_TYPES.join(",")} hidden onChange={(event) => { const file = event.target.files?.[0]; if (file) void upload(file); event.target.value = ""; }} />
              </div>
            </div>
            <TextEditor id="input-text" ref={inputRef} value={input} disabled={!ready} onChange={(event) => update({ input: event.target.value })} />
            <div className="pane-footer"><span>{linesLabel(countLines(input))}</span></div>
          </section>

          <section className="editor-pane output-pane" aria-labelledby="output-label" aria-busy={busy}>
            <div className="pane-header">
              <label id="output-label" htmlFor="output-text">Output</label>
              <div className="pane-actions">
                <button className="button quiet" disabled={!result} onClick={copy} title="Copy output · ⌘⇧C / Ctrl+Shift+C" aria-keyshortcuts="Meta+Shift+C Control+Shift+C">
                  {isCopied ? <Check size={15} aria-hidden="true" /> : <Copy size={15} aria-hidden="true" />}{isCopied ? "Copied" : "Copy"}
                </button>
                <button className="icon-button" disabled={!result} onClick={download} aria-label="Download output" title="Download output"><Download size={16} aria-hidden="true" /></button>
              </div>
            </div>
            <TextEditor id="output-text" value={result?.output ?? ""} readOnly={!result} onChange={(event) => { setCopied(null); editOutput(event.target.value); }} />
            <div className="pane-footer">
              <span role="status">{busy ? "Processing…" : summary}</span>
              {result?.edited && <span>{linesLabel(countLines(result.output))}</span>}
              {result && !result.edited && <details className="result-details">
                <summary aria-label="Result details">{linesLabel(countLines(result.output))}</summary>
                <dl>
                  {result.tool === "filter" && <>
                    <div><dt>Original lines</dt><dd>{result.stats.total.toLocaleString()}</dd></div>
                    <div><dt>Matched</dt><dd>{result.stats.matchedLines.toLocaleString()}</dd></div>
                    <div><dt>Kept</dt><dd>{result.stats.kept.toLocaleString()}</dd></div>
                    <div><dt>Removed</dt><dd>{result.stats.removed.toLocaleString()}</dd></div>
                  </>}
                  <div><dt>Processing</dt><dd>{result.ms.toFixed(1)} ms</dd></div>
                </dl>
              </details>}
            </div>
          </section>
        </div>
      </section>
      <span className="sr-only" role="status">{isCopied ? "Output copied to clipboard." : ""}</span>
    </main>
  );
}
