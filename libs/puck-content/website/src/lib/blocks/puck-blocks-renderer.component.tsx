import { ImageContext } from '@wepublish/image/website';
import {
  FullPuckBlockFragment,
  FullPuckRegistryFragment,
} from '@wepublish/website/api';
import { BuilderImageProviderProps } from '@wepublish/website/builder';
import { memo, useMemo } from 'react';

import {
  NestedPuckBlocksContext,
  NestedPuckBlocksProps,
} from '../contexts/nested-puck-blocks.context';
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

const noBlocks: readonly FullPuckBlockFragment[] = [];

const PuckBlocksContent = memo(
  ({ blocks, registry }: NestedPuckBlocksProps) => {
    const roots = useMemo(() => buildPuckBlockTree(blocks).roots, [blocks]);

    return (
      <GeneratedBlocksProvider
        registry={blocks.some(isGeneratedPuckBlock) ? registry : null}
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
    );
  }
);

const renderNestedBlocks = (props: NestedPuckBlocksProps) => (
  <PuckBlocksContent {...props} />
);

export const PuckBlocks = memo(
  ({ blocks, registry, components }: PuckBlocksProps) => {
    const blockComponents = useMemo(
      () => ({ ...puckBlockRegistry, ...components }),
      [components]
    );

    return (
      <PuckBlockComponentsContext.Provider value={blockComponents}>
        <NestedPuckBlocksContext.Provider value={renderNestedBlocks}>
          <PuckBlocksContent
            blocks={blocks ?? noBlocks}
            registry={registry}
          />
        </NestedPuckBlocksContext.Provider>
      </PuckBlockComponentsContext.Provider>
    );
  }
);
