"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type {
  DragEvent,
  KeyboardEvent,
  MutableRefObject,
  TextareaHTMLAttributes,
} from "react";
import { safeFilter, FilterOptions } from "@/lib/filter";
import { clsx } from "clsx";
import {
  ClipboardPaste,
  Upload,
  Filter as FilterIcon,
  Copy,
  Download,
  Trash2,
  Regex,
} from "lucide-react";

type Persist = {
  input: string;
  needles: string;
  opts: FilterOptions;
};

const DEFAULTS: Persist = {
  input: `# Sample lines
INFO 2025-01-01 App started
DEBUG temp value=42
WARN Disk space low
ERROR unable to connect database
user@example.com
foo@gmail.com
import os
// comment
https://example.com
http://insecure.test
NULL,42,ok`,
  needles: `ERROR
WARN`,
  opts: {
    mode: "keep",
    useRegex: false,
    caseSensitive: false,
    wholeWord: false,
  },
};

const SUPPORTED_FILE_TYPES = [".json", ".jsonl", ".txt", ".md"] as const;

const friendlySupported = SUPPORTED_FILE_TYPES.map((ext) =>
  ext.replace(".", "").toUpperCase(),
);

type LineNumberedTextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  containerClassName?: string;
};

const LineNumberedTextarea = forwardRef<HTMLTextAreaElement, LineNumberedTextareaProps>(
  ({ className, containerClassName, value = "", ...props }, ref) => {
    const textareaRef = useRef<HTMLTextAreaElement | null>(null);
    // Outer gutter: clipping container (fixed size, overflow hidden)
    const numberRef = useRef<HTMLDivElement | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);

    const updateContainerShadows = useCallback(() => {
      const textarea = textareaRef.current;
      const container = containerRef.current;
      if (!textarea || !container) return;

      const atTop = textarea.scrollTop <= 0;
      const atBottom =
        textarea.scrollTop + textarea.clientHeight >= textarea.scrollHeight - 1;

      container.dataset.shadowTop = atTop ? "off" : "on";
      container.dataset.shadowBottom = atBottom ? "off" : "on";
    }, []);

    const mergedRef = useCallback(
      (node: HTMLTextAreaElement | null) => {
        textareaRef.current = node;
        if (typeof ref === "function") {
          ref(node);
        } else if (ref) {
          (ref as MutableRefObject<HTMLTextAreaElement | null>).current = node;
        }
      },
      [ref],
    );

    const normalizedValue = useMemo(() => {
      return Array.isArray(value)
        ? value.join("\n")
        : value === undefined || value === null
          ? ""
          : String(value);
    }, [value]);

    // Virtualized line-number state
    const totalLines = useMemo(
      () => Math.max(1, normalizedValue.split(/\r?\n/).length),
      [normalizedValue],
    );
    const [lineHeight, setLineHeight] = useState<number>(24); // fallback; will measure

    // Measure actual line-height from the textarea so math is exact
    useLayoutEffect(() => {
      const textarea = textareaRef.current;
      if (!textarea) return;
      const lh = parseFloat(getComputedStyle(textarea).lineHeight || "0");
      if (!Number.isNaN(lh) && lh > 0) setLineHeight(lh);
    }, []);

    // Keep the gutter perfectly in sync with the textarea scroll,
    // and avoid virtualizing line numbers (render all of them).
    useEffect(() => {
      const textarea = textareaRef.current;
      const numbers = numberRef.current;
      if (!textarea || !numbers) return;
      let raf = 0;
      const syncScroll = () => {
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(() => {
          numbers.scrollTop = textarea.scrollTop;
          updateContainerShadows();
        });
      };
      textarea.addEventListener("scroll", syncScroll);
      syncScroll();
      return () => {
        textarea.removeEventListener("scroll", syncScroll);
        cancelAnimationFrame(raf);
      };
    }, [updateContainerShadows]);

    useEffect(() => {
      const textarea = textareaRef.current;
      const numbers = numberRef.current;
      if (!textarea) return;
      if (numbers) numbers.style.height = `${textarea.clientHeight}px`;
      updateContainerShadows();
    }, [normalizedValue, lineHeight, totalLines, updateContainerShadows]);

    useEffect(() => {
      const textarea = textareaRef.current;
      const numbers = numberRef.current;
      if (!textarea || !numbers) return;

      if (typeof window === "undefined" || typeof ResizeObserver === "undefined") {
        // Keep the outer gutter matched to the textarea's visible height.
        numbers.style.height = `${textarea.clientHeight}px`;
        updateContainerShadows();
        return;
      }

      const syncHeight = () => {
        numbers.style.height = `${textarea.clientHeight}px`;
        updateContainerShadows();
      };

      syncHeight();

      const observer = new ResizeObserver(syncHeight);
      observer.observe(textarea);

      return () => {
        observer.disconnect();
      };
    }, [updateContainerShadows]);

    return (
      <div ref={containerRef} className={clsx("line-numbered", containerClassName)}>
        <div
          ref={numberRef}
          aria-hidden="true"
          className="line-numbered-gutter"
        >
          <div
            className="line-numbered-virtualizer"
            style={{ height: totalLines * lineHeight }}
          >
            <div className="line-numbered-virtualizer-inner">
              {Array.from({ length: totalLines }, (_, i) => (
                <div key={i} className="line-numbered-row">{i + 1}</div>
              ))}
            </div>
          </div>
        </div>
        <textarea
          ref={mergedRef}
          value={normalizedValue}
          className={clsx("line-numbered-textarea", className)}
          {...props}
        />
      </div>
    );
  },
);

LineNumberedTextarea.displayName = "LineNumberedTextarea";

export default function Home() {
  const [input, setInput] = useState<string>(DEFAULTS.input);
  const [needles, setNeedles] = useState<string>(DEFAULTS.needles);
  const [opts, setOpts] = useState<FilterOptions>(DEFAULTS.opts);
  const [output, setOutput] = useState<string>("");
  const [stats, setStats] = useState<{
    total: number;
    kept: number;
    removed: number;
    matched: number;
    ms: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const outputRef = useRef<HTMLTextAreaElement | null>(null);

  // Load from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem("linefilter:v1");
      if (raw) {
        const parsed: Persist = JSON.parse(raw);
        setInput(parsed.input ?? DEFAULTS.input);
        setNeedles(parsed.needles ?? DEFAULTS.needles);
        setOpts(parsed.opts ?? DEFAULTS.opts);
      }
    } catch {
      // ignore corrupted payloads
    }
  }, []);

  // Save to localStorage
  useEffect(() => {
    const data: Persist = { input, needles, opts };
    try {
      localStorage.setItem("linefilter:v1", JSON.stringify(data));
    } catch {
      // storage may be unavailable (e.g. private mode)
    }
  }, [input, needles, opts]);

  const runFilter = useCallback(() => {
    setError(null);
    const t0 = performance.now();
    const { result, error } = safeFilter(input, needles, opts);
    const t1 = performance.now();
    if (error) {
      setError(error);
      return;
    }
    if (result) {
      setOutput(result.output);
      setStats({
        total: result.total,
        kept: result.kept,
        removed: result.removed,
        matched: result.matchedLines,
        ms: Math.max(0, t1 - t0),
      });
    }
  }, [input, needles, opts]);

  const onPaste = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) setInput(text);
    } catch {
      setError("Clipboard read failed. Use ⌘/Ctrl+V instead.");
    }
  }, []);

  const onCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(output);
    } catch {
      setError("Clipboard write failed. Select and copy manually.");
    }
  }, [output]);

  const onDownload = useCallback(() => {
    const blob = new Blob([output], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "filtered.txt";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }, [output]);

  const onUpload = useCallback(async (file: File) => {
    const isSupported = SUPPORTED_FILE_TYPES.some((ext) =>
      file.name.toLowerCase().endsWith(ext),
    );

    if (!isSupported && file.type !== "application/json" && file.type !== "text/plain") {
      setError(
        `Unsupported file format. Please upload one of: ${SUPPORTED_FILE_TYPES.join(", ")}.`,
      );
      return;
    }

    const text = await file.text();
    setInput(text);
    setError(null);
  }, []);

  const onDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      const f = e.dataTransfer.files?.[0];
      if (f) onUpload(f);
    },
    [onUpload],
  );

  const onKey = useCallback(
    (e: KeyboardEvent<HTMLElement>) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        runFilter();
      }
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === "c") {
        e.preventDefault();
        onCopy();
      }
      if (e.key === "Escape") {
        setError(null);
      }
    },
    [runFilter, onCopy],
  );

  const statChips = useMemo(
    () => (
      <div className="flex flex-wrap gap-2">
        <span className="chip">Total: {stats?.total ?? 0}</span>
        <span className="chip">Kept: {stats?.kept ?? 0}</span>
        <span className="chip">Removed: {stats?.removed ?? 0}</span>
        <span className="chip">Matched: {stats?.matched ?? 0}</span>
        <span className="chip">
          Time: {stats ? stats.ms.toFixed(1) : "0.0"} ms
        </span>
      </div>
    ),
    [stats],
  );

  return (
    <main className="min-h-screen px-4 py-10 sm:px-6 lg:px-8" onKeyDown={onKey}>
      <div className="mx-auto max-w-7xl space-y-8">
        <header className="hero">
          <div className="hero-overlay" />
          <div className="hero-content">
            <div className="space-y-3">
              <span className="badge-glass">Selective Line Filter</span>
              <h1 className="text-3xl font-semibold text-fg sm:text-4xl">
                Curate your text streams with artistry.
              </h1>
              <p className="max-w-xl text-sm text-fg-subtle sm:text-base">
                Sculpt log files, prose, JSON, or markdown in a single sweep.
                Paste, drop, or upload your files—then filter with precision and
                see results shimmer in real time.
              </p>
              <div className="flex flex-wrap gap-2 text-[11px] text-fg-subtle">
                <span className="chip">⌘/Ctrl + Enter → Filter</span>
                <span className="chip">⌘/Ctrl + ⇧ + C → Copy</span>
                <span className="chip">Esc → Clear error</span>
              </div>
            </div>
            <div className="support-card">
              <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-fg-subtle">
                Supported uploads
              </h2>
              <ul className="mt-3 space-y-2 text-sm text-fg">
                {friendlySupported.map((label) => (
                  <li key={label} className="flex items-center gap-2">
                    <span className="bullet" aria-hidden="true">
                      ●
                    </span>
                    <span className="font-medium tracking-wide">.{label.toLowerCase()}</span>
                    <span className="text-[11px] uppercase tracking-[0.3em] text-fg-subtle">
                      {label}
                    </span>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-[12px] text-fg-muted">
                Drag and drop or select any of these formats. Your text stays in
                the browser—no uploads sent to servers.
              </p>
            </div>
          </div>
        </header>

        {/* Panels */}
        <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Input Panel */}
          <div className="card p-4 sm:p-6">
            <div className="mb-3 flex items-center justify-between">
              <label className="label">Input Text</label>
              <div className="flex items-center gap-2">
                <button
                  className="btn btn-ghost"
                  onClick={onPaste}
                  title="Paste from clipboard"
                >
                  <ClipboardPaste size={16} />
                  Paste
                </button>
                <label
                  className="btn btn-ghost cursor-pointer"
                  title="Upload a text file"
                >
                  <Upload size={16} /> Upload
                  <input
                    type="file"
                    accept={SUPPORTED_FILE_TYPES.join(",")}
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) onUpload(f);
                    }}
                  />
                </label>
              </div>
            </div>

            <div
              className="dropzone"
              onDragOver={(e) => {
                e.preventDefault();
              }}
              onDrop={onDrop}
            >
              <LineNumberedTextarea
                ref={inputRef}
                spellCheck={false}
                containerClassName="textarea-balanced"
                className="textarea-balanced"
                placeholder="Paste or type your lines here..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
              />
              <p className="mt-2 text-[11px] text-fg-subtle">
                Tip: Drop files ending with {SUPPORTED_FILE_TYPES.join(", ")}
                {" "}or paste raw text.
              </p>
            </div>
          </div>

          {/* Needles & Options */}
          <div className="card space-y-4 p-4 sm:p-6">
            <div className="grid grid-cols-1 gap-3">
              <div className="flex items-center justify-between">
                <label className="label">
                  Needles (one per line or comma-separated)
                </label>
                <div className="flex items-center gap-2">
                  <span className="chip">
                    {
                      needles
                        .split(/\r?\n|,/)
                        .map((s) => s.trim())
                        .filter(Boolean).length
                    }{" "}
                    needles
                  </span>
                </div>
              </div>
              <LineNumberedTextarea
                spellCheck={false}
                containerClassName="textarea-compact"
                className="textarea-compact"
                placeholder={"Examples: ERROR\n^WARN\n\\.com$"}
                value={needles}
                onChange={(e) => setNeedles(e.target.value)}
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <fieldset className="space-y-2">
                <legend className="label mb-1">Mode</legend>
                <div className="flex items-center gap-2">
                  <button
                    className={clsx(
                      "btn",
                      opts.mode === "keep" ? "btn-primary" : "btn-ghost",
                    )}
                    onClick={() => setOpts({ ...opts, mode: "keep" })}
                  >
                    Keep
                  </button>
                  <button
                    className={clsx(
                      "btn",
                      opts.mode === "remove" ? "btn-danger" : "btn-ghost",
                    )}
                    onClick={() => setOpts({ ...opts, mode: "remove" })}
                  >
                    Remove
                  </button>
                </div>
              </fieldset>

              <fieldset className="space-y-2">
                <legend className="label mb-1">Pattern</legend>
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <label className="inline-flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={opts.useRegex}
                      onChange={(e) =>
                        setOpts({ ...opts, useRegex: e.target.checked })
                      }
                    />
                    <span className="inline-flex items-center gap-1">
                      Regex <Regex size={14} />
                    </span>
                  </label>
                  <label className="inline-flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={opts.caseSensitive}
                      onChange={(e) =>
                        setOpts({ ...opts, caseSensitive: e.target.checked })
                      }
                    />
                    <span>Case sensitive</span>
                  </label>
                  <label className="inline-flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={opts.wholeWord}
                      onChange={(e) =>
                        setOpts({ ...opts, wholeWord: e.target.checked })
                      }
                    />
                    <span>Whole word</span>
                  </label>
                </div>
              </fieldset>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button className="btn btn-primary" onClick={runFilter}>
                <FilterIcon size={16} />
                Filter
              </button>
              <button
                className="btn btn-ghost"
                onClick={() => {
                  setInput("");
                  setNeedles("");
                  setOutput("");
                  setStats(null);
                  setError(null);
                }}
              >
                <Trash2 size={16} />
                Clear All
              </button>
              {error && (
                <span className="text-sm text-accent-rose backdrop-blur-sm">
                  {error}
                </span>
              )}
            </div>
          </div>
        </section>

        {/* Results */}
        <section className="card space-y-3 p-4 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-medium text-fg">Results</h2>
              {statChips}
            </div>
            <div className="flex items-center gap-2">
              <button className="btn btn-ghost" onClick={onCopy}>
                <Copy size={16} />
                Copy
              </button>
              <button className="btn btn-ghost" onClick={onDownload}>
                <Download size={16} />
                Download
              </button>
            </div>
          </div>

          <LineNumberedTextarea
            ref={outputRef}
            spellCheck={false}
            className="textarea-balanced"
            containerClassName={clsx("textarea-balanced", "bg-bg-3/60")}
            placeholder="Filtered output will appear here..."
            value={output}
            onChange={(e) => setOutput(e.target.value)}
          />
        </section>

        {/* Use cases quick reference */}
        <section className="space-y-2 text-xs text-fg-subtle">
          <p>
            Use cases: logs (keep ERROR, remove DEBUG), emails (.com only or
            remove gmail), code (extract imports / drop comments), CSV (remove
            rows with NULL), URLs (keep https), configs (prefix keys), git diff
            (only + or - lines), scraping (keyword filter), and more.
          </p>
        </section>
      </div>
    </main>
  );
}
