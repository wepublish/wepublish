import {
  FullPuckBlockFragment,
  FullPuckRegistryFragment,
} from '@wepublish/website/api';
import { createContext, ReactNode, useContext } from 'react';

export type NestedPuckBlocksProps = {
  blocks: readonly FullPuckBlockFragment[];
  registry?: FullPuckRegistryFragment | null;
};

export const NestedPuckBlocksContext = createContext<
  ((props: NestedPuckBlocksProps) => ReactNode) | null
>(null);

export const useNestedPuckBlocks = () => useContext(NestedPuckBlocksContext);
