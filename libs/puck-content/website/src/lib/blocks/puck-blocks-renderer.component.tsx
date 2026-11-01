import { ImageContext } from '@wepublish/image/website';
import {
  FullPuckBlockFragment,
  FullPuckRegistryFragment,
} from '@wepublish/website/api';
import { BuilderImageProviderProps } from '@wepublish/website/builder';
import { memo, useMemo } from 'react';

import { GeneratedBlocksProvider } from '../generated/generated-blocks.component';
import { buildPuckBlockTree } from './block-tree';
import { PuckBlockRenderer } from './puck-block.component';
import {
  isGeneratedPuckBlock,
  PuckBlockComponents,
  PuckBlockComponentsContext,
  puckBlockRegistry,
} from './puck-block-registry';

export type PuckBlocksProps = {
  blocks: readonly FullPuckBlockFragment[] | null | undefined;
  registry?: FullPuckRegistryFragment | null;
  components?: PuckBlockComponents;
};

const aboveTheFoldCount = 3;

const aboveTheFoldImages: BuilderImageProviderProps = {
  fetchPriority: 'high',
  loading: 'eager',
};

const belowTheFoldImages: BuilderImageProviderProps = {};

export const PuckBlocks = memo(
  ({ blocks, registry, components }: PuckBlocksProps) => {
    const roots = useMemo(
      () => buildPuckBlockTree(blocks ?? []).roots,
      [blocks]
    );
    const blockComponents = useMemo(
      () => ({ ...puckBlockRegistry, ...components }),
      [components]
    );

    return (
      <PuckBlockComponentsContext.Provider value={blockComponents}>
        <GeneratedBlocksProvider
          registry={blocks?.some(isGeneratedPuckBlock) ? registry : null}
        >
          {roots.map((node, index) => (
            <ImageContext.Provider
              key={node.block.id}
              value={
                index < aboveTheFoldCount ? aboveTheFoldImages : (
                  belowTheFoldImages
                )
              }
            >
              <PuckBlockRenderer node={node} />
            </ImageContext.Provider>
          ))}
        </GeneratedBlocksProvider>
      </PuckBlockComponentsContext.Provider>
    );
  }
);
