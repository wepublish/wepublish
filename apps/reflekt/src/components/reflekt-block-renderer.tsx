import { css, Theme } from '@emotion/react';
import useMediaQuery from '@mui/material/useMediaQuery';
import {
  BlockRenderer,
  isImageBlock,
  isRichTextBlock,
  isSubscribeBlock,
  isTitleBlock,
} from '@wepublish/block-content/website';
import { BlockSibling, collectSiblings } from './block-siblings';
import { ImageContext } from '@wepublish/image/website';
import { FullBlockFragment } from '@wepublish/website/api';
import {
  BuilderBlockRendererProps,
  BuilderBlocksProps,
  BuilderBreakBlockProps,
  BuilderFlexBlockProps,
  BuilderTeaserSlotsBlockProps,
  BuilderTitleBlockProps,
  useWebsiteBuilder,
} from '@wepublish/website/builder';
import { allPass, anyPass, cond } from 'ramda';
import {
  type PropsWithChildren,
  memo,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  FlexBlockFullsizeImage,
  isFlexBlockFullsizeImage,
} from './block-layouts/flex-block-fullsize-image';
import { isFlexBlockHero } from './block-layouts/flex-block-hero';
import {
  CollapsibleContent,
  isCollapsibleContent,
} from './break-blocks/reflekt-collapsible-content';
import {
  CollapsibleDownloads,
  isCollapsibleDownloads,
} from './break-blocks/reflekt-collapsible-downloads';
import { isToc, Toc } from './break-blocks/reflekt-toc';
import {
  isTextWithImageBreakBlock,
  TextWithImageBreakBlock,
} from './break-blocks/text-with-image';
import {
  isTextWithImageAltColorBreakBlock,
  TextWithImageAltColorBreakBlock,
} from './break-blocks/text-with-image-alt-color';
import { MainSpacer } from './main-spacer';
import { ReflektTitleBlock } from './reflekt-title-block';
import { isTeaserSlotsTopic } from './teaser-layouts/teaser-slots-topic';

const ClientOnly = ({ children }: PropsWithChildren) => {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted ? <>{children}</> : null;
};

export const ReflektBlockRenderer = (
  props: BuilderBlockRendererProps & { siblings?: BlockSibling[] }
) => {
  const isMobile = useMediaQuery((theme: Theme) =>
    theme.breakpoints.down('md')
  );

  const extraBlockMap = useMemo(
    () =>
      cond([
        [
          isCollapsibleContent,
          (block: BuilderBreakBlockProps) => <CollapsibleContent {...block} />,
        ],
        [
          isCollapsibleDownloads,
          (block: BuilderBreakBlockProps) => (
            <CollapsibleDownloads {...block} />
          ),
        ],
        [
          isTextWithImageBreakBlock,
          (block: BuilderBreakBlockProps) => (
            <TextWithImageBreakBlock {...block} />
          ),
        ],
        [
          isTextWithImageAltColorBreakBlock,
          (block: BuilderBreakBlockProps) => (
            <TextWithImageAltColorBreakBlock {...block} />
          ),
        ],
        [isToc, (block: BuilderBreakBlockProps) => <Toc {...block} />],
        [
          isFlexBlockFullsizeImage,
          (block: BuilderFlexBlockProps) => (
            <FlexBlockFullsizeImage {...block} />
          ),
        ],
      ]) as (block: FullBlockFragment) => JSX.Element | undefined,
    []
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
            (block: FullBlockFragment) =>
              isTeaserSlotsTopic(block as BuilderTeaserSlotsBlockProps),
            () => isMobile,
          ]),
          () => css`
            grid-template-columns: auto !important;
            padding: 0 !important;
          `,
        ],
        [
          allPass([
            (block: FullBlockFragment) =>
              anyPass([
                isImageBlock,
                isRichTextBlock,
                isTitleBlock,
                isSubscribeBlock,
              ])(block),
            () => !isMobile,
          ]),
          () => css`
            grid-template-columns:
              max(calc(100vw - var(--breakpoint-width)) / 2, 0px)
              repeat(12, 1fr) max(
                calc(100vw - var(--breakpoint-width)) / 2,
                0px
              ) !important;
            & > * {
              grid-column: 2/13;
              margin-left: 0;
              margin-right: 0;
            }
          `,
        ],
      ]),
    [isMobile]
  );

  const isEmbed =
    props.block.__typename === 'YouTubeVideoBlock' ||
    props.block.__typename === 'VimeoVideoBlock' ||
    props.block.__typename === 'SoundCloudTrackBlock' ||
    props.block.__typename === 'IFrameBlock';

  const fallbackRenderer = <BlockRenderer {...props} />;

  const titleBlock =
    isTitleBlock(props.block) ?
      <ReflektTitleBlock
        {...(props.block as BuilderTitleBlockProps)}
        siblings={props.siblings}
      />
    : undefined;

  const defaultBlock =
    titleBlock ??
    extraBlockMap(props.block) ??
    (isEmbed ? <ClientOnly>{fallbackRenderer}</ClientOnly> : fallbackRenderer);

  if (props.type === 'Page' && (props.level ?? 0) === 0) {
    return (
      <MainSpacer
        maxWidth="lg"
        css={styles(props.block)}
      >
        {defaultBlock}
      </MainSpacer>
    );
  }

  return defaultBlock;
};

// eslint-disable-next-line react/display-name
export const ReflektBlocks = memo(({ blocks, type }: BuilderBlocksProps) => {
  const {
    blocks: { Renderer },
  } = useWebsiteBuilder();
  const TypedRenderer = Renderer as typeof ReflektBlockRenderer;
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
          <TypedRenderer
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
