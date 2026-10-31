import {
  emptyPuckBlockData,
  PuckBlockData,
} from '@wepublish/puck-content/website';
import { createContext, useContext } from 'react';

export type PuckBlockDataMap = ReadonlyMap<string, PuckBlockData>;

export const PuckBlockDataContext = createContext<PuckBlockDataMap>(new Map());

export const usePuckBlockData = (id: string): PuckBlockData =>
  useContext(PuckBlockDataContext).get(id) ?? emptyPuckBlockData;
