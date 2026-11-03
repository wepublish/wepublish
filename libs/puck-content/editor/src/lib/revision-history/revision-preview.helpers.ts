import { VersionHistoryRevision } from '@wepublish/ui/editor';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { usePuckRevisionHistory } from './revision-history.context';
import {
  PuckRevisionPreview,
  PuckRevisionPreviewState,
} from './revision-preview.context';

const isInsideOverlay = (target: EventTarget | null) =>
  target instanceof Element &&
  !!target.closest('[role="dialog"], [role="menu"], [role="listbox"]');

export function useEscapeKey(
  target: Document | undefined,
  onEscape: (() => void) | undefined
) {
  useEffect(() => {
    if (!target || !onEscape) {
      return;
    }

    const listener = (event: KeyboardEvent) => {
      if (
        event.key === 'Escape' &&
        !event.defaultPrevented &&
        !isInsideOverlay(event.target)
      ) {
        onEscape();
      }
    };

    target.addEventListener('keydown', listener);

    return () => target.removeEventListener('keydown', listener);
  }, [target, onEscape]);
}

export function useRevisionPreviewController(): PuckRevisionPreview {
  const { revisions, loadRevision, onRestore } = usePuckRevisionHistory();
  const [state, setState] = useState<PuckRevisionPreviewState>({
    status: 'idle',
  });
  const requestedId = useRef<string | null>(null);
  const returnFocus = useRef<HTMLElement | null>(null);

  const findRevision = useCallback(
    (revisionId: string) =>
      revisions.find(revision => revision.id === revisionId),
    [revisions]
  );

  const load = useCallback(
    async (revision: VersionHistoryRevision) => {
      if (!loadRevision) {
        return;
      }

      requestedId.current = revision.id;
      setState({ status: 'loading', revision });

      try {
        const content = await loadRevision(revision.id);

        if (requestedId.current === revision.id) {
          setState({ status: 'ready', revision, content });
        }
      } catch {
        if (requestedId.current === revision.id) {
          setState({ status: 'failed', revision });
        }
      }
    },
    [loadRevision]
  );

  const preview = useCallback(
    (revisionId: string) => {
      const revision = findRevision(revisionId);

      if (!revision) {
        return;
      }

      if (document.activeElement instanceof HTMLElement) {
        returnFocus.current = document.activeElement;
      }

      load(revision);
    },
    [findRevision, load]
  );

  const retry = useCallback(() => {
    if (state.status !== 'idle') {
      load(state.revision);
    }
  }, [load, state]);

  const end = useCallback(() => {
    requestedId.current = null;
    setState({ status: 'idle' });
  }, []);

  const close = useCallback(() => {
    end();

    const focusTarget = returnFocus.current;
    returnFocus.current = null;

    if (focusTarget?.isConnected) {
      focusTarget.focus();
    }
  }, [end]);

  const restore = useCallback(
    async (revisionId: string) => {
      end();
      returnFocus.current = null;
      await onRestore(revisionId);
    },
    [end, onRestore]
  );

  return useMemo(
    () => ({ state, preview, retry, close, restore }),
    [state, preview, retry, close, restore]
  );
}
