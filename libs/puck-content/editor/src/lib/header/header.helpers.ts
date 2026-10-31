import { createUsePuck, Data } from '@puckeditor/core';
import { StateColor } from '@wepublish/ui/editor';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { PuckDocumentStatus } from './header.context';
import { listenToEditorDocuments, usePuckFrameDocument } from './header.frame';
import { serializeDocument } from './header.serialize';

const usePuck = createUsePuck();

export const PUCK_AUTOSAVE_INTERVAL_MS = 30_000;

const stateColors = {
  draft: StateColor.draft,
  pending: StateColor.pending,
  published: StateColor.published,
  none: StateColor.none,
} satisfies Record<PuckDocumentStatus, StateColor>;

export const toStateColor = (status: PuckDocumentStatus) => stateColors[status];

export const usePuckDocumentDirty = () => {
  const frameDocument = usePuckFrameDocument();
  const data = usePuck(puck => puck.appState.data);
  const snapshot = useMemo(() => serializeDocument(data), [data]);
  const latestSnapshot = useRef(snapshot);
  const [baseline, setBaseline] = useState<string | null>(null);

  useEffect(() => {
    latestSnapshot.current = snapshot;
  }, [snapshot]);

  useEffect(() => {
    if (baseline !== null) {
      return;
    }

    const settle = () => setBaseline(latestSnapshot.current);
    const unsubscribe = listenToEditorDocuments(
      frameDocument,
      ['pointerdown', 'keydown'],
      settle
    );
    window.addEventListener('blur', settle);

    return () => {
      unsubscribe();
      window.removeEventListener('blur', settle);
    };
  }, [baseline, frameDocument]);

  const markSaved = useCallback(
    (saved: Partial<Data>) => setBaseline(serializeDocument(saved)),
    []
  );

  return { dirty: baseline !== null && snapshot !== baseline, markSaved };
};

type UsePuckAutosaveProps = {
  enabled: boolean;
  hasChanged: boolean;
  onAutosave: () => Promise<unknown>;
  savedAt?: Date;
  intervalMs?: number;
};

export const usePuckAutosave = ({
  enabled,
  hasChanged,
  onAutosave,
  savedAt,
  intervalMs = PUCK_AUTOSAVE_INTERVAL_MS,
}: UsePuckAutosaveProps) => {
  const [lastAttemptAt, setLastAttemptAt] = useState(() => Date.now());
  const onAutosaveRef = useRef(onAutosave);
  const hasChangedRef = useRef(hasChanged);
  const countdownStart = Math.max(lastAttemptAt, savedAt?.getTime() ?? 0);

  useEffect(() => {
    onAutosaveRef.current = onAutosave;
    hasChangedRef.current = hasChanged;
  });

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const timeout = setTimeout(
      async () => {
        if (hasChangedRef.current) {
          await onAutosaveRef.current().catch(() => undefined);
        }

        setLastAttemptAt(Date.now());
      },
      Math.max(0, countdownStart + intervalMs - Date.now())
    );

    return () => clearTimeout(timeout);
  }, [enabled, countdownStart, intervalMs]);
};

const isSaveShortcut = (event: Event) =>
  'key' in event &&
  typeof event.key === 'string' &&
  event.key.toLowerCase() === 's' &&
  !('shiftKey' in event && event.shiftKey) &&
  !('altKey' in event && event.altKey) &&
  (('metaKey' in event && !!event.metaKey) ||
    ('ctrlKey' in event && !!event.ctrlKey));

export const useSaveShortcut = (onSave: () => void) => {
  const frameDocument = usePuckFrameDocument();
  const onSaveRef = useRef(onSave);

  useEffect(() => {
    onSaveRef.current = onSave;
  });

  useEffect(
    () =>
      listenToEditorDocuments(frameDocument, ['keydown'], event => {
        if (event.defaultPrevented || !isSaveShortcut(event)) {
          return;
        }

        event.preventDefault();
        onSaveRef.current();
      }),
    [frameDocument]
  );
};
