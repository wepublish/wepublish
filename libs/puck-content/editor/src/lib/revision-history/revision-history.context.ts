import type { Config, Data } from '@puckeditor/core';
import type { VersionHistoryTimelineProps } from '@wepublish/ui/editor';
import { createContext, useContext } from 'react';

export type PuckRevisionContent = { data: Data; config?: Config };

export type PuckRevisionHistory = Omit<
  VersionHistoryTimelineProps,
  'onRestore' | 'onPreview' | 'previewingId' | 'restoringId' | 'confirmRestore'
> & {
  loadRevision?: (revisionId: string) => Promise<PuckRevisionContent>;
};

export const emptyRevisionHistory: PuckRevisionHistory = {
  revisions: [],
  canRestore: false,
};

export const PuckRevisionHistoryContext =
  createContext<PuckRevisionHistory | null>(null);

export const usePuckRevisionHistory = () =>
  useContext(PuckRevisionHistoryContext) ?? emptyRevisionHistory;
