import type { VersionHistoryTimelineProps } from '@wepublish/ui/editor';
import { createContext, useContext } from 'react';

export type PuckRevisionHistory = VersionHistoryTimelineProps;

export const emptyRevisionHistory: PuckRevisionHistory = {
  revisions: [],
  canRestore: false,
  onRestore: () => undefined,
};

export const PuckRevisionHistoryContext =
  createContext<PuckRevisionHistory | null>(null);

export const usePuckRevisionHistory = () =>
  useContext(PuckRevisionHistoryContext) ?? emptyRevisionHistory;
