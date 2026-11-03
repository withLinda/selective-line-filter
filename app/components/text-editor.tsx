"use client";

import { forwardRef, useCallback, useLayoutEffect, useMemo, useRef, useState, type TextareaHTMLAttributes } from "react";

type Props = Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "value"> & { value: string };

export const TextEditor = forwardRef<HTMLTextAreaElement, Props>(function TextEditor({ value, ...props }, ref) {
  const textarea = useRef<HTMLTextAreaElement | null>(null);
  const [viewport, setViewport] = useState({ top: 0, height: 400, line: 24, padding: 20 });
  const lineCount = useMemo(() => value.split(/\r\n|\r|\n/).length, [value]);
  const measure = useCallback(() => {
    const node = textarea.current;
    if (!node) return;
    const style = getComputedStyle(node);
    setViewport({ top: node.scrollTop, height: node.clientHeight, line: parseFloat(style.lineHeight) || 24, padding: parseFloat(style.paddingTop) || 0 });
  }, []);

  useLayoutEffect(() => {
    measure();
    const node = textarea.current;
    if (!node) return;
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, [measure]);

  useLayoutEffect(measure, [value, measure]);

  const start = Math.max(0, Math.floor((viewport.top - viewport.padding) / viewport.line) - 1);
  const visible = Math.max(0, Math.min(lineCount - start, Math.ceil(viewport.height / viewport.line) + 3));

  return (
    <div className="text-editor">
      <div className="editor-gutter" aria-hidden="true" style={{ width: `${Math.max(2, String(lineCount).length) + 2}ch` }}>
        <div style={{ transform: `translateY(${viewport.padding + start * viewport.line - viewport.top}px)` }}>
          {Array.from({ length: visible }, (_, index) => (
            <div key={start + index} style={{ height: viewport.line }}>{start + index + 1}</div>
          ))}
        </div>
      </div>
      <textarea
        {...props}
        ref={(node) => {
          textarea.current = node;
          if (typeof ref === "function") ref(node);
          else if (ref) ref.current = node;
        }}
        value={value}
        wrap="off"
        spellCheck={false}
        autoCapitalize="off"
        autoComplete="off"
        autoCorrect="off"
        onScroll={measure}
      />
    </div>
  );
});
