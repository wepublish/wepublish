import { BlockRenderer } from '@wepublish/block-content/website';
import { ImageContext } from '@wepublish/image/website';
import {
  BuilderBlockRendererProps,
  BuilderBlocksProps,
  BuilderBreakBlockProps,
  useWebsiteBuilder,
} from '@wepublish/website/builder';
import { cond } from 'ramda';
import type { ComponentType } from 'react';
import { memo, useMemo } from 'react';

import { TsriTabbedContent } from './block-layouts/tsri-base-tabbed-content';
import {
  isTsriSidebarContent,
  TsriSidebarContent,
} from './break-blocks/tsri-sidebar-content';
import { isTabbedContentBlockStyle } from './tabbed-content/tabbed-content';

export type BlockSiblings = Array<{
  typeName: string;
  blockStyle?: string;
}>;

export const TsriBlockRenderer = (
  props: BuilderBlockRendererProps & { siblings: BlockSiblings }
) => {
  const extraBlockMap = useMemo(
    () =>
      cond([
        [isTabbedContentBlockStyle, block => <TsriTabbedContent {...block} />],
        [
          isTsriSidebarContent,
          block => (
            <TsriSidebarContent
              {...block}
              count={props.count}
              index={props.index}
              siblings={props.siblings}
            />
          ),
        ],
      ]),
    [props.count, props.index, props.siblings]
  );

  const block = extraBlockMap(props.block as BuilderBreakBlockProps) ?? (
    <BlockRenderer {...props} />
  );

  if (props.type === 'Page') {
    return block;
  }

  return <>{block}</>;
};

// eslint-disable-next-line react/display-name
export const TsriBlocks = memo(({ blocks, type }: BuilderBlocksProps) => {
  const {
    blocks: { Renderer },
  } = useWebsiteBuilder() as {
    blocks: {
      Renderer: ComponentType<
        BuilderBlockRendererProps & { siblings: BlockSiblings }
      >;
    };
  };

  const siblings = blocks.map(b => ({
    typeName: b.__typename,
    blockStyle: b.blockStyle,
  })) as BlockSiblings;

  return (
    <>
      {blocks.map((block, index) => (
        <ImageContext.Provider
          key={index}
          value={
            // Above the fold images should be loaded with a high priority
            3 > index ?
              {
                fetchPriority: 'high',
                loading: 'eager',
              }
            : {}
          }
        >
          <Renderer
            block={block}
            index={index}
            count={blocks.length}
            siblings={siblings}
            type={type}
          />
        </ImageContext.Provider>
      ))}
    </>
  );
});
