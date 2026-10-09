import { useCallback, useEffect, useRef, useState } from 'react';

export const AUTOSAVE_INTERVAL_MS = 30_000;

type UseAutosaveProps = {
  enabled: boolean;
  hasChanged: boolean;
  onAutosave: () => Promise<unknown>;
  intervalMs?: number;
};

/**
 * Calls `onAutosave` `intervalMs` after the last save if there are unsaved changes.
 * If nothing changed, the countdown restarts. Call `markSaved` after a manual save
 * to restart the countdown. Errors thrown by `onAutosave` are swallowed.
 */
export function useAutosave({
  enabled,
  hasChanged,
  onAutosave,
  intervalMs = AUTOSAVE_INTERVAL_MS,
}: UseAutosaveProps) {
  const [lastSavedAt, setLastSavedAt] = useState(() => Date.now());

  const onAutosaveRef = useRef(onAutosave);
  const hasChangedRef = useRef(hasChanged);
  onAutosaveRef.current = onAutosave;
  hasChangedRef.current = hasChanged;

  const markSaved = useCallback(() => setLastSavedAt(Date.now()), []);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const timeout = setTimeout(
      async () => {
        try {
          if (hasChangedRef.current) {
            await onAutosaveRef.current();
          }
        } catch {
          // Callers surface mutation errors themselves; just retry next interval.
        } finally {
          // Always restart the countdown, even if saving disabled the hook
          // meanwhile, so a failed save doesn't immediately retry.
          markSaved();
        }
      },
      Math.max(0, lastSavedAt + intervalMs - Date.now())
    );

    return () => clearTimeout(timeout);
  }, [enabled, lastSavedAt, intervalMs, markSaved]);

  return { markSaved };
}
