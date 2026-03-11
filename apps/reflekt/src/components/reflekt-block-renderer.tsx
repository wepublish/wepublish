import { css } from '@emotion/react';
import { useTheme } from '@emotion/react';
import { BlockRenderer } from '@wepublish/block-content/website';
import { ImageContext } from '@wepublish/image/website';
import { BlockContent } from '@wepublish/website/api';
import {
  BuilderBlockRendererProps,
  BuilderBlocksProps,
  useWebsiteBuilder,
} from '@wepublish/website/builder';
import { cond } from 'ramda';
import type { ComponentProps, ComponentType } from 'react';
import { memo, useMemo } from 'react';

import { isFlexBlockHero } from './block-layouts/flex-block-hero';
import {
  isCollapsibleDownloads,
  ReflektCollapsibleDownloads,
} from './block-styles/reflekt-collapsible-downloads';
import {
  isCollapsibleRichText,
  ReflektCollapsibleRichText,
} from './block-styles/reflekt-collapsible-richtext';
import {
  isReflektImageBlockFullsize,
  ReflektImageBlockFullsize,
} from './block-styles/reflekt-image-block-fullsize';
import {
  isTocRichText,
  ReflektTocRichText,
} from './block-styles/reflekt-toc-richtext';
import {
  isTextWithImageBreakBlock,
  TextWithImageBreakBlock,
} from './break-blocks/text-with-image';
import {
  isTextWithImageAltColorBreakBlock,
  TextWithImageAltColorBreakBlock,
} from './break-blocks/text-with-image-alt-color';
import { MainSpacer } from './main-spacer';

export type BlockSiblings = Array<{
  typeName: string;
  blockStyle?: string;
}>;

type CollapsibleRichTextWithSiblings = ComponentType<
  ComponentProps<typeof ReflektCollapsibleRichText> & {
    siblings?: BlockSiblings;
  }
>;
type CollapsibleDownloadsWithSiblings = ComponentType<
  ComponentProps<typeof ReflektCollapsibleDownloads> & {
    siblings?: BlockSiblings;
  }
>;
type TocRichTextWithSiblings = ComponentType<
  ComponentProps<typeof ReflektTocRichText> & { siblings?: BlockSiblings }
>;

const CollapsibleRichText =
  ReflektCollapsibleRichText as CollapsibleRichTextWithSiblings;
const CollapsibleDownloads =
  ReflektCollapsibleDownloads as CollapsibleDownloadsWithSiblings;
const TocRichText = ReflektTocRichText as TocRichTextWithSiblings;

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

  const extraBlockMap: (block: BlockContent) => JSX.Element | null = useMemo(
    () =>
      cond([
        [
          isCollapsibleRichText,
          block => (
            <CollapsibleRichText
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
          isTocRichText,
          block => (
            <TocRichText
              {...(block as any)}
              siblings={props.siblings}
            />
          ),
        ],
        [
          isReflektImageBlockFullsize,
          block => <ReflektImageBlockFullsize {...(block as any)} />,
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
      ]),
    [theme]
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
