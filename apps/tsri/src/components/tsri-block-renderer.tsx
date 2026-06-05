import {
  BlockRenderer,
  collectSiblings,
} from '@wepublish/block-content/website';
import { ImageContext } from '@wepublish/image/website';
import {
  BuilderBlockRendererProps,
  BuilderBlocksProps,
  useWebsiteBuilder,
} from '@wepublish/website/builder';
import { cond } from 'ramda';
import { memo, useMemo } from 'react';

import { TsriTabbedContent } from './block-layouts/tsri-base-tabbed-content';
import {
  isTsriSidebarContent,
  TsriSidebarContent,
} from './break-blocks/tsri-sidebar-content';
import {
  isTsriSidebarContentAltColor,
  TsriSidebarContentAltColor,
} from './break-blocks/tsri-sidebar-content-alt-color';
import { isTabbedContentBlockStyle } from './tabbed-content/tabbed-content';

export const TsriBlockRenderer = (props: BuilderBlockRendererProps) => {
  const extraBlockMap = useMemo(
    () =>
      cond([
        [isTabbedContentBlockStyle, block => <TsriTabbedContent {...block} />],
        [
          isTsriSidebarContentAltColor,
          block => (
            <TsriSidebarContentAltColor
              {...block}
              count={props.count}
              index={props.index}
              siblings={props.siblings ?? []}
            />
          ),
        ],
        [
          isTsriSidebarContent,
          block => (
            <TsriSidebarContent
              {...block}
              count={props.count}
              index={props.index}
              siblings={props.siblings ?? []}
            />
          ),
        ],
      ]),
    [props.count, props.index, props.siblings]
  );

  const block = extraBlockMap(props.block) ?? <BlockRenderer {...props} />;

  if (props.type === 'Page') {
    return block;
  }

  return <>{block}</>;
};

// eslint-disable-next-line react/display-name
export const TsriBlocks = memo(({ blocks, type }: BuilderBlocksProps) => {
  const {
    blocks: { Renderer },
  } = useWebsiteBuilder();

  const siblings = collectSiblings(blocks);

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
