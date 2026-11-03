"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createWorkspace, LEGACY_STORAGE_KEY, restoreWorkspace, STORAGE_KEY, type Workspace } from "@/lib/workspace";
import type { TransformResult, WorkerReply } from "@/lib/transform";
import { applyExample, type Example } from "@/lib/examples";

type Result = TransformResult & { edited: boolean };

export function useWorkspace() {
  const [workspace, setWorkspace] = useState(createWorkspace);
  const [ready, setReady] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [undoState, setUndoState] = useState<{ workspace: Workspace; result: Result | null; kind: "clear" | "example" } | null>(null);
  const activeJob = useRef<{ worker: Worker; timer: ReturnType<typeof setTimeout> } | null>(null);
  // Also guards delayed clipboard/file reads against newer user actions.
  const revision = useRef(0);

  const cancel = useCallback(() => {
    if (activeJob.current) {
      activeJob.current.worker.terminate();
      clearTimeout(activeJob.current.timer);
      activeJob.current = null;
    }
  }, []);

  useEffect(() => {
    const currentRevision = revision;
    try {
      setWorkspace(restoreWorkspace(localStorage.getItem(STORAGE_KEY) ?? localStorage.getItem(LEGACY_STORAGE_KEY)));
    } catch {
      // Editing remains available when browser storage is disabled.
    }
    setReady(true);
    return () => {
      currentRevision.current++;
      cancel();
    };
  }, [cancel]);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(workspace));
    } catch {
      // A full or unavailable store must not interrupt the current session.
    }
  }, [workspace, ready]);

  const update = useCallback((change: Partial<Workspace>) => {
    revision.current++;
    cancel();
    setBusy(false);
    setResult(null);
    setError(null);
    setUndoState(null);
    setWorkspace((current) => ({ ...current, ...change }));
  }, [cancel]);

  const process = useCallback((target: Workspace) => {
    if (!ready || !target.input || (target.tool === "replace" && !target.replace.find)) return;
    cancel();
    revision.current++;
    setBusy(true);
    setResult(null);
    setError(null);

    try {
      const worker = new Worker(new URL("../lib/transform.worker.ts", import.meta.url));
      const finish = () => {
        if (activeJob.current?.worker !== worker) return false;
        cancel();
        setBusy(false);
        return true;
      };
      const timer = setTimeout(() => {
        if (finish()) setError("Processing took too long. Try a simpler pattern or a smaller file.");
      }, 3000);
      activeJob.current = { worker, timer };
      worker.onmessage = (event: MessageEvent<WorkerReply>) => {
        if (!finish()) return;
        if (event.data.result) setResult({ ...event.data.result, edited: false });
        else setError(event.data.error);
      };
      worker.onerror = () => {
        if (finish()) setError("Could not process this text. Please try again.");
      };
      worker.postMessage(target);
    } catch {
      cancel();
      setBusy(false);
      setError("Could not start text processing. Please try again.");
    }
  }, [ready, cancel]);

  const run = useCallback(() => process(workspace), [process, workspace]);

  const loadExample = useCallback((example: Example) => {
    const target = applyExample(workspace, example);
    // Browsing multiple examples keeps the original draft recoverable.
    setUndoState((previous) => previous?.kind === "example" ? previous : { workspace, result, kind: "example" });
    setWorkspace(target);
    process(target);
  }, [process, workspace, result]);

  const clear = useCallback(() => {
    revision.current++;
    cancel();
    setBusy(false);
    setUndoState({ workspace, result, kind: "clear" });
    setWorkspace({ ...createWorkspace(), tool: workspace.tool, opts: workspace.opts, replace: { ...workspace.replace, find: "", replacement: "" } });
    setResult(null);
    setError(null);
  }, [cancel, workspace, result]);

  const undo = useCallback(() => {
    if (!undoState) return;
    revision.current++;
    cancel();
    setBusy(false);
    setWorkspace(undoState.workspace);
    setResult(undoState.result);
    setUndoState(null);
    setError(null);
  }, [undoState, cancel]);

  const editOutput = useCallback((output: string) => {
    revision.current++;
    setResult((current) => current ? { ...current, output, edited: true } : null);
    setUndoState(null);
  }, []);

  return { workspace, update, ready, result, busy, error, setError, run, clear, undo, canUndo: !!undoState, undoKind: undoState?.kind, loadExample, editOutput, revision };
}
