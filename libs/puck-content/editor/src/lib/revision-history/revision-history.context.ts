import type { Config, Data } from '@puckeditor/core';
import type { VersionHistoryTimelineProps } from '@wepublish/ui/editor';
import { createContext, useContext } from 'react';

export type PuckRevisionContent = { data: Data; config?: Config };

export type PuckRevisionHistory = Omit<
  VersionHistoryTimelineProps,
  'onPreview' | 'previewingId'
> & {
  loadRevision?: (revisionId: string) => Promise<PuckRevisionContent>;
};

export const emptyRevisionHistory: PuckRevisionHistory = {
  revisions: [],
  canRestore: false,
  onRestore: () => undefined,
};

export const PuckRevisionHistoryContext =
  createContext<PuckRevisionHistory | null>(null);

export const usePuckRevisionHistory = () =>
  useContext(PuckRevisionHistoryContext) ?? emptyRevisionHistory;
