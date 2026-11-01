import { createUsePuck } from '@puckeditor/core';
import { enqueueSnackbar, VersionHistoryRevision } from '@wepublish/ui/editor';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import {
  PuckRevisionContent,
  usePuckRevisionHistory,
} from './revision-history.context';
import {
  PuckRevisionPreview,
  PuckRevisionPreviewState,
} from './revision-preview.context';

const usePuck = createUsePuck();

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
  const { t } = useTranslation();
  const { revisions, loadRevision } = usePuckRevisionHistory();
  const dispatch = usePuck(puck => puck.dispatch);
  const [state, setState] = useState<PuckRevisionPreviewState>({
    status: 'idle',
  });
  const [restoringId, setRestoringId] = useState<string | null>(null);
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
      const revision = findRevision(revisionId);

      if (!revision || !loadRevision) {
        return;
      }

      let content: PuckRevisionContent | undefined =
        state.status === 'ready' && state.revision.id === revisionId ?
          state.content
        : undefined;

      if (!content) {
        setRestoringId(revisionId);

        try {
          content = await loadRevision(revisionId);
        } catch {
          enqueueSnackbar(t('puck.revisionPreview.failed'), {
            variant: 'error',
          });

          return;
        } finally {
          setRestoringId(null);
        }
      }

      dispatch({ type: 'setUi', ui: { itemSelector: null } });
      dispatch({ type: 'setData', data: content.data, recordHistory: true });
      close();

      enqueueSnackbar(t('puck.revisionPreview.restoredHint'), {
        variant: 'success',
        title: t('puck.revisionPreview.restored', {
          date: new Date(revision.createdAt),
        }),
      });
    },
    [close, dispatch, findRevision, loadRevision, state, t]
  );

  return useMemo(
    () => ({ state, restoringId, preview, retry, close, restore }),
    [state, restoringId, preview, retry, close, restore]
  );
}
