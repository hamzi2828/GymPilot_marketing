import { useCallback, useEffect, useRef, useState } from "react";

/**
 * One action at a time for a page, a form or a modal, and which one it is,
 * for its button to show.
 *
 * `run(key, fn)` starts `fn` unless an action is already running. That is
 * checked against a ref, not state, so a double click cannot send a second
 * request before React has re-rendered the button as disabled. `pending` is
 * the running action's key (its button's spinner) and `busy` whether any is
 * running (its siblings wait). Both clear when `fn` settles, whether it
 * worked or threw. Errors are not caught here: each page shows its own.
 *
 * An action that leaves the page for good (Stripe's checkout, the panel
 * after signing in) calls `leave()` first, and its button stays busy until
 * the page has gone. If the browser brings the page back from its
 * back-forward cache, everything is released again.
 */
export function useAsyncAction() {
  const lock = useRef(false);
  const [pending, setPending] = useState<string | null>(null);

  useEffect(() => {
    const onShow = (event: PageTransitionEvent) => {
      if (!event.persisted) return;
      lock.current = false;
      setPending(null);
    };
    window.addEventListener("pageshow", onShow);
    return () => window.removeEventListener("pageshow", onShow);
  }, []);

  /** Resolves true once `fn` has run, false when another action was running and nothing was started. */
  const run = useCallback(async (key: string, fn: (leave: () => void) => unknown): Promise<boolean> => {
    if (lock.current) return false;
    lock.current = true;
    setPending(key);
    let leaving = false;
    try {
      await fn(() => {
        leaving = true;
      });
      return true;
    } finally {
      if (!leaving) {
        lock.current = false;
        setPending(null);
      }
    }
  }, []);

  return { pending, busy: pending !== null, run };
}

export type AsyncAction = ReturnType<typeof useAsyncAction>;
