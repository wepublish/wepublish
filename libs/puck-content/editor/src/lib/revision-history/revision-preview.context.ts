import type { VersionHistoryRevision } from '@wepublish/ui/editor';
import { createContext, useContext } from 'react';

import type { PuckRevisionContent } from './revision-history.context';

export type PuckRevisionPreviewState =
  | { status: 'idle' }
  | { status: 'loading' | 'failed'; revision: VersionHistoryRevision }
  | {
      status: 'ready';
      revision: VersionHistoryRevision;
      content: PuckRevisionContent;
    };

export type PuckRevisionPreview = {
  state: PuckRevisionPreviewState;
  preview: (revisionId: string) => void;
  retry: () => void;
  close: () => void;
  restore: (revisionId: string) => Promise<void>;
};

export const idleRevisionPreview: PuckRevisionPreview = {
  state: { status: 'idle' },
  preview: () => undefined,
  retry: () => undefined,
  close: () => undefined,
  restore: async () => undefined,
};

export const PuckRevisionPreviewContext =
  createContext<PuckRevisionPreview>(idleRevisionPreview);

export const usePuckRevisionPreview = () =>
  useContext(PuckRevisionPreviewContext);

export const previewedRevisionId = ({ state }: PuckRevisionPreview) =>
  state.status === 'idle' ? null : state.revision.id;
