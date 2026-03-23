import { css, Theme } from '@emotion/react';
import { useTheme } from '@emotion/react';
import useMediaQuery from '@mui/material/useMediaQuery';
import { BlockRenderer } from '@wepublish/block-content/website';
import { ImageContext } from '@wepublish/image/website';
import { BlockContent } from '@wepublish/website/api';
import {
  BuilderBlockRendererProps,
  BuilderBlocksProps,
  BuilderTeaserSlotsBlockProps,
  useWebsiteBuilder,
} from '@wepublish/website/builder';
import { allPass, cond } from 'ramda';
import type { ComponentProps, ComponentType } from 'react';
import { memo, useMemo } from 'react';

import {
  FlexBlockFullsizeImage,
  isFlexBlockFullsizeImage,
} from './block-layouts/flex-block-fullsize-image';
import { isFlexBlockHero } from './block-layouts/flex-block-hero';
import {
  isCollapsibleContent,
  ReflektCollapsibleContent,
} from './break-blocks/reflekt-collapsible-content';
import {
  isCollapsibleDownloads,
  ReflektCollapsibleDownloads,
} from './break-blocks/reflekt-collapsible-downloads';
import { isToc, ReflektToc } from './break-blocks/reflekt-toc';
import {
  isTextWithImageBreakBlock,
  TextWithImageBreakBlock,
} from './break-blocks/text-with-image';
import {
  isTextWithImageAltColorBreakBlock,
  TextWithImageAltColorBreakBlock,
} from './break-blocks/text-with-image-alt-color';
import { MainSpacer } from './main-spacer';
import { isTeaserSlotsTopic } from './teaser-layouts/teaser-slots-topic';

export type BlockSiblings = Array<{
  typeName: string;
  blockStyle?: string;
}>;

type CollapsibleContentWithSiblings = ComponentType<
  ComponentProps<typeof ReflektCollapsibleContent> & {
    siblings?: BlockSiblings;
  }
>;
type CollapsibleDownloadsWithSiblings = ComponentType<
  ComponentProps<typeof ReflektCollapsibleDownloads> & {
    siblings?: BlockSiblings;
  }
>;
type TocWithSiblings = ComponentType<
  ComponentProps<typeof ReflektToc> & { siblings?: BlockSiblings }
>;

const CollapsibleContent =
  ReflektCollapsibleContent as CollapsibleContentWithSiblings;
const CollapsibleDownloads =
  ReflektCollapsibleDownloads as CollapsibleDownloadsWithSiblings;
const Toc = ReflektToc as TocWithSiblings;

const isBreakBlockTextWithImage = isTextWithImageBreakBlock as (
  b: BlockContent
) => boolean;
const isBreakBlockTextWithImageAltColor = isTextWithImageAltColorBreakBlock as (
  b: BlockContent
) => boolean;

export const ReflektBlockRenderer = (
  props: BuilderBlockRendererProps & { siblings: BlockSiblings }
) => {
  const theme = useTheme();
  const isMobile = useMediaQuery((theme: Theme) =>
    theme.breakpoints.down('md')
  );

  const extraBlockMap: (block: BlockContent) => JSX.Element | null = useMemo(
    () =>
      cond([
        [
          isCollapsibleContent,
          block => (
            <CollapsibleContent
              {...(block as any)}
              siblings={props.siblings}
            />
          ),
        ],
        [
          isCollapsibleDownloads,
          block => (
            <CollapsibleDownloads
              {...(block as any)}
              siblings={props.siblings}
            />
          ),
        ],
        [
          isBreakBlockTextWithImage,
          block => (
            <TextWithImageBreakBlock
              {...(block as any)}
              siblings={props.siblings}
            />
          ),
        ],
        [
          isBreakBlockTextWithImageAltColor,
          block => (
            <TextWithImageAltColorBreakBlock
              {...(block as any)}
              siblings={props.siblings}
            />
          ),
        ],
        [
          isToc,
          block => (
            <Toc
              {...(block as any)}
              siblings={props.siblings}
            />
          ),
        ],
        [
          isFlexBlockFullsizeImage,
          block => <FlexBlockFullsizeImage {...(block as any)} />,
        ],
      ]),
    [props.siblings]
  );

  const styles = useMemo(
    () =>
      cond([
        [
          isFlexBlockHero,
          () => css`
            grid-template-columns: auto !important;
            padding: 0 !important;
          `,
        ],
        [
          allPass([
            (block: BlockContent) =>
              isTeaserSlotsTopic(block as BuilderTeaserSlotsBlockProps),
            () => isMobile,
          ]),
          () => css`
            grid-template-columns: auto !important;
            padding: 0 !important;
          `,
        ],
      ]),
    [theme, isMobile]
  );

  if (props.type === 'Page') {
    return (
      <MainSpacer
        maxWidth="lg"
        css={styles(props.block)}
      >
        {extraBlockMap(props.block) ?? (
          <BlockRenderer
            {...props}
            siblings={props.siblings}
          />
        )}
      </MainSpacer>
    );
  }

  return (
    extraBlockMap(props.block) ?? (
      <BlockRenderer
        {...props}
        siblings={props.siblings}
      />
    )
  );
};

// eslint-disable-next-line react/display-name
export const ReflektBlocks = memo(({ blocks, type }: BuilderBlocksProps) => {
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
            block={
              { ...block, siblings } as BlockContent & {
                siblings: BlockSiblings;
              }
            }
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
