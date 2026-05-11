"use client";

import { useRef, useCallback, useEffect, useState } from "react";

export type AutoSaveStatus = "idle" | "saving" | "saved" | "error";

interface UseAutoSaveOptions {
  /** Debounce delay in ms before triggering save. Default: 1500 */
  debounceMs?: number;
  /** Retry delays in ms after failure. Default: [1000, 3000, 8000] */
  retryDelays?: number[];
  /** Called to check whether there are unsaved changes (for beforeunload). */
  isDirty?: () => boolean;
}

interface UseAutoSaveReturn {
  status: AutoSaveStatus;
  /** Trigger an immediate save (bypassing debounce). Returns true on success. */
  saveNow: () => Promise<boolean>;
  /** Call this from a change handler to schedule a debounced auto-save. */
  scheduleAutoSave: () => void;
  /** Error message if status === 'error' */
  errorMessage: string | null;
}

/**
 * useAutoSave — debounced auto-save with retry, AbortController, and beforeunload protection.
 *
 * @param saveFn  Async function that performs the save. Must throw on error.
 * @param options Configuration options.
 */
export function useAutoSave(
  saveFn: (signal: AbortSignal) => Promise<void>,
  options: UseAutoSaveOptions = {}
): UseAutoSaveReturn {
  const {
    debounceMs = 1500,
    retryDelays = [1000, 3000, 8000],
    isDirty,
  } = options;

  const [status, setStatus] = useState<AutoSaveStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortCtrlRef = useRef<AbortController | null>(null);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryCountRef = useRef(0);

  // Keep saveFn stable via ref so we don't re-register effects on every render
  const saveFnRef = useRef(saveFn);
  saveFnRef.current = saveFn;

  const isDirtyRef = useRef(isDirty);
  isDirtyRef.current = isDirty;

  /** Cancel pending debounce, retry timers, and any in-flight request */
  const cancelAll = useCallback(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
      debounceTimer.current = null;
    }
    if (retryTimerRef.current) {
      clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }
    if (abortCtrlRef.current) {
      abortCtrlRef.current.abort();
      abortCtrlRef.current = null;
    }
    retryCountRef.current = 0;
  }, []);

  /** Core save execution with optional retry */
  const executeWithRetry = useCallback(async (): Promise<boolean> => {
    cancelAll();

    const attempt = async (): Promise<boolean> => {
      const ctrl = new AbortController();
      abortCtrlRef.current = ctrl;
      setStatus("saving");
      setErrorMessage(null);

      try {
        await saveFnRef.current(ctrl.signal);
        if (ctrl.signal.aborted) return false;
        abortCtrlRef.current = null;
        retryCountRef.current = 0;
        setStatus("saved");
        // Reset to idle after 3 seconds
        setTimeout(() => setStatus((s) => (s === "saved" ? "idle" : s)), 3000);
        return true;
      } catch (err) {
        if (ctrl.signal.aborted) return false;
        abortCtrlRef.current = null;

        const delays = retryDelays;
        const retryIdx = retryCountRef.current;

        if (retryIdx < delays.length) {
          retryCountRef.current += 1;
          const delay = delays[retryIdx];
          return new Promise<boolean>((resolve) => {
            retryTimerRef.current = setTimeout(async () => {
              const result = await attempt();
              resolve(result);
            }, delay);
          });
        }

        // All retries exhausted
        retryCountRef.current = 0;
        const msg = err instanceof Error ? err.message : "Unbekannter Fehler";
        setErrorMessage(msg);
        setStatus("error");
        return false;
      }
    };

    return attempt();
  }, [cancelAll, retryDelays]);

  /** Immediate save, bypasses debounce */
  const saveNow = useCallback((): Promise<boolean> => {
    return executeWithRetry();
  }, [executeWithRetry]);

  /** Schedule a debounced auto-save */
  const scheduleAutoSave = useCallback(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      debounceTimer.current = null;
      executeWithRetry();
    }, debounceMs);
  }, [debounceMs, executeWithRetry]);

  // beforeunload protection: warn if there are unsaved changes
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      const dirty = isDirtyRef.current?.() ?? (status === "saving" || !!debounceTimer.current);
      if (dirty) {
        e.preventDefault();
        // Modern browsers show a generic message; setting returnValue still triggers the dialog
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [status]);

  // Cleanup on unmount
  useEffect(() => {
    return () => cancelAll();
  }, [cancelAll]);

  return { status, saveNow, scheduleAutoSave, errorMessage };
}
