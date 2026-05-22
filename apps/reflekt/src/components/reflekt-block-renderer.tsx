import { css, Theme } from '@emotion/react';
import useMediaQuery from '@mui/material/useMediaQuery';
import {
  BlockRenderer,
  collectSiblings,
  isImageBlock,
  isRichTextBlock,
} from '@wepublish/block-content/website';
import { ImageContext } from '@wepublish/image/website';
import { BlockContent } from '@wepublish/website/api';
import {
  BuilderBlockRendererProps,
  BuilderBlocksProps,
  BuilderBreakBlockProps,
  BuilderFlexBlockProps,
  BuilderTeaserSlotsBlockProps,
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
import { isTeaserSlotsTopic } from './teaser-layouts/teaser-slots-topic';

const ClientOnly = ({ children }: PropsWithChildren) => {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted ? <>{children}</> : null;
};

export const ReflektBlockRenderer = (props: BuilderBlockRendererProps) => {
  const isMobile = useMediaQuery((theme: Theme) =>
    theme.breakpoints.down('md')
  );

  const extraBlockMap = useMemo(
    () =>
      cond([
        [
          isCollapsibleContent,
          (block: BuilderBreakBlockProps) => (
            <CollapsibleContent
              {...block}
              siblings={props.siblings}
            />
          ),
        ],
        [
          isCollapsibleDownloads,
          (block: BuilderBreakBlockProps) => (
            <CollapsibleDownloads
              {...block}
              siblings={props.siblings}
            />
          ),
        ],
        [
          isTextWithImageBreakBlock,
          (block: BuilderBreakBlockProps) => (
            <TextWithImageBreakBlock
              {...block}
              siblings={props.siblings}
            />
          ),
        ],
        [
          isTextWithImageAltColorBreakBlock,
          (block: BuilderBreakBlockProps) => (
            <TextWithImageAltColorBreakBlock
              {...block}
              siblings={props.siblings}
            />
          ),
        ],
        [
          isToc,
          (block: BuilderBreakBlockProps) => (
            <Toc
              {...block}
              siblings={props.siblings}
            />
          ),
        ],
        [
          isFlexBlockFullsizeImage,
          (block: BuilderFlexBlockProps) => (
            <FlexBlockFullsizeImage
              {...block}
              siblings={props.siblings}
            />
          ),
        ],
      ]) as (block: BlockContent) => JSX.Element | undefined,
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
        [
          allPass([
            (block: BlockContent) =>
              anyPass([isImageBlock, isRichTextBlock])(block),
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

  const fallbackRenderer = (
    <BlockRenderer
      {...props}
      siblings={props.siblings}
    />
  );

  const defaultBlock =
    extraBlockMap(props.block) ??
    (isEmbed ? <ClientOnly>{fallbackRenderer}</ClientOnly> : fallbackRenderer);

  if (props.type === 'Page') {
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
