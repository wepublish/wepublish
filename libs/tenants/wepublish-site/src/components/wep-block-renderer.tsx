import { css, useTheme } from '@emotion/react';
import {
  BlockRenderer,
  isRichTextBlock,
  isYouTubeVideoBlock,
} from '@wepublish/block-content/website';
import { ImageContext } from '@wepublish/image/website';
import { FullBlockFragment } from '@wepublish/website/api';
import {
  BuilderBlockRendererProps,
  BuilderBlocksProps,
  BuilderBreakBlockProps,
  useWebsiteBuilder,
} from '@wepublish/website/builder';
import { useRouter } from 'next/router';
import { anyPass, cond } from 'ramda';
import { createContext, JSX, memo, useContext, useMemo } from 'react';

import {
  AttentionCatcher,
  isAttentionCatcher,
} from './break-blocks/attention-catcher';
import { isPlainBreakBlock } from './break-blocks/wep-break-block';
import { isEventList } from './event-list/event-list';
import { Feature, isFeature } from './feature/feature';
import { Hero, isHero } from './hero/hero';
import { isLatestNews } from './latest-news/latest-news';
import { isLogoBand } from './logo-band/logo-band';
import { isNetworkNews } from './network-news/network-news';
import { isOffers } from './offers/offers';
import { isTeaserCards } from './teaser-cards/teaser-cards';
import { MainSpacer } from './wep-main-spacer';

/** The block after the one being rendered, e.g. to know that a text is the title of a video */
const NextBlockContext = createContext<FullBlockFragment | undefined>(
  undefined
);

/** A video and the text right before it (its title) are as wide as the hero */
export const isVideoOrItsTitle = (
  block: FullBlockFragment,
  nextBlock?: FullBlockFragment
) =>
  isYouTubeVideoBlock(block) ||
  (isRichTextBlock(block) && !!nextBlock && isYouTubeVideoBlock(nextBlock));

export const WepBlockRenderer = (props: BuilderBlockRendererProps) => {
  const nextBlock = useContext(NextBlockContext);
  const { asPath } = useRouter();
  const isHomePage = asPath === '/' || asPath === '/de' || asPath === '/fr';
  const theme = useTheme();

  const extraBlockMap = useMemo(
    () =>
      cond([
        [isHero, (block: BuilderBreakBlockProps) => <Hero {...block} />],
        [isFeature, (block: BuilderBreakBlockProps) => <Feature {...block} />],
        [
          isAttentionCatcher,
          (block: BuilderBreakBlockProps) => <AttentionCatcher {...block} />,
        ],
      ]) as (block: FullBlockFragment) => JSX.Element | undefined,
    []
  );

  const styles = useMemo(
    () =>
      cond([
        [
          anyPass([block => true]),
          (block: FullBlockFragment) =>
            (
              (isHomePage && props.index < 2) ||
              isLogoBand(block) ||
              isFeature(block) ||
              isAttentionCatcher(block) ||
              isTeaserCards(block) ||
              isLatestNews(block) ||
              isNetworkNews(block) ||
              isEventList(block) ||
              isOffers(block) ||
              isPlainBreakBlock(block) ||
              isVideoOrItsTitle(block, nextBlock)
            ) ?
              css``
            : css`
                ${theme.breakpoints.up('md')} {
                  grid-template-columns: minmax(
                    auto,
                    calc(
                      ${theme.breakpoints.values['lg']}px - ${theme.spacing(16)}
                    )
                  ) !important;
                }
              `,
        ],
      ]),
    [isHomePage, props.index, theme, nextBlock]
  );

  if (props.type === 'Page') {
    return (
      <MainSpacer
        maxWidth="lg"
        css={styles(props.block)}
      >
        {extraBlockMap(props.block) ?? <BlockRenderer {...props} />}
      </MainSpacer>
    );
  }

  return extraBlockMap(props.block) ?? <BlockRenderer {...props} />;
};

// eslint-disable-next-line react/display-name
export const WepBlocks = memo(({ blocks, type }: BuilderBlocksProps) => {
  const {
    blocks: { Renderer },
  } = useWebsiteBuilder();

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
          <NextBlockContext.Provider value={blocks[index + 1]}>
            <Renderer
              block={block}
              index={index}
              count={blocks.length}
              type={type}
            />
          </NextBlockContext.Provider>
        </ImageContext.Provider>
      ))}
    </>
  );
});
