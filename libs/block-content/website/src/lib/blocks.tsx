import {
  BlockSibling,
  BuilderBlockRendererProps,
  BuilderBlocksProps,
  BuilderBreakBlockProps,
  BuilderCommentBlockProps,
  BuilderCrowdfundingBlockProps,
  BuilderEventBlockProps,
  BuilderFlexBlockProps,
  BuilderHTMLBlockProps,
  BuilderListicleBlockProps,
  BuilderPollBlockProps,
  BuilderQuoteBlockProps,
  BuilderRichTextBlockProps,
  BuilderSubscribeBlockProps,
  BuilderTitleBlockProps,
  useWebsiteBuilder,
} from '@wepublish/website/builder';
import { isFlexBlock } from './nested-blocks/flex-block';
import { isHtmlBlock } from './html/html-block';
import { isSubscribeBlock } from './subscribe/subscribe-block';
import { isImageBlock } from './image/image-block';
import { isQuoteBlock } from './quote/quote-block';
import { isRichTextBlock } from './richtext/richtext-block';
import { isTeaserGridFlexBlock } from './teaser/teaser-grid-flex-block';
import { isTitleBlock } from './title/title-block';
import { cond } from 'ramda';
import { isIFrameBlock } from './iframe/iframe-block';
import { isCommentBlock } from './comment/comment-block';
import { isBildwurfAdBlock } from './bildwurf-ad/bildwurf-ad-block';
import { isFacebookPostBlock } from './facebook/facebook-post-block';
import { isFacebookVideoBlock } from './facebook/facebook-video-block';
import { isInstagramBlock } from './instagram/instagram-post-block';
import { isSoundCloudTrackBlock } from './sound-cloud/sound-cloud-block';
import { isTikTokVideoBlock } from './tik-tok/tik-tok-video-block';
import { isTwitterTweetBlock } from './twitter/twitter-tweet-block';
import { isVimeoVideoBlock } from './vimeo/vimeo-video-block';
import { isYouTubeVideoBlock } from './youtube/youtube-video-block';
import { isStreamableVideoBlock } from './streamable/streamable-video-block';
import { isTeaserGridBlock } from './teaser/teaser-grid-block';
import { isImageGalleryBlock } from './image-gallery/image-gallery-block';
import { isPollBlock } from './poll/poll-block';
import { isListicleBlock } from './listicle/listicle-block';
import { isEventBlock } from './event/event-block';
import { isPolisConversationBlock } from './polis-conversation/polis-conversation-block';
import { isBreakBlock } from './break/break-block';
import { memo } from 'react';
import { isTeaserListBlock } from './teaser/teaser-list-block';
import { isTeaserSliderBlockStyle } from './block-styles/teaser-slider/teaser-slider';
import { isImageSliderBlockStyle } from './block-styles/image-slider/image-slider';
import { isFocusTeaserBlockStyle } from './block-styles/focus-teaser/focus-teaser';
import { isContextBoxBlockStyle } from './block-styles/context-box/context-box';
import { isBannerBlockStyle } from './block-styles/banner/banner';
import { isCrowdfundingBlock } from './crowdfunding/crowdfunding-block';
import { ImageContext } from '@wepublish/image/website';
import {
  isAlternatingTeaserGridBlockStyle,
  isAlternatingTeaserListBlockStyle,
  isAlternatingTeaserSlotsBlockStyle,
} from './block-styles/alternating/is-alternating';
import { isTeaserSlotsBlock } from './teaser/teaser-slots-block';
import { css } from '@emotion/react';

export const BlockRenderer = memo(
  ({ block, className, siblings }: BuilderBlockRendererProps) => {
    const { blocks, blockStyles } = useWebsiteBuilder();

    const emptyBlockCss = css`
      height: 100%;
      width: 100%;
      background-color: red;
      color: white;
      font-size: 2rem;
      text-align: center;
      display: flex;
      align-content: center;
      justify-content: center;
      justify-items: center;
      align-items: center;
      font-weight: 700;
      border-radius: 1rem;
    `;

    if (!block) {
      return <div css={emptyBlockCss}>empty block</div>;
    }

    const blockStylesCond = cond([
      [
        isImageSliderBlockStyle,
        block => (
          <blockStyles.ImageSlider
            {...block}
            className={className}
            siblings={siblings}
          />
        ),
      ],
      [
        isTeaserSliderBlockStyle,
        block => (
          <blockStyles.TeaserSlider
            {...block}
            className={className}
            siblings={siblings}
          />
        ),
      ],
      [
        isFocusTeaserBlockStyle,
        block => (
          <blockStyles.FocusTeaser
            {...block}
            className={className}
            siblings={siblings}
          />
        ),
      ],
      [
        isContextBoxBlockStyle,
        block => (
          <blockStyles.ContextBox
            {...block}
            className={className}
            siblings={siblings}
          />
        ),
      ],
      [
        isBannerBlockStyle,
        block => (
          <blockStyles.Banner
            {...block}
            className={className}
            siblings={siblings}
          />
        ),
      ],
      [
        isAlternatingTeaserGridBlockStyle,
        block => (
          <blockStyles.AlternatingTeaserGrid
            {...block}
            className={className}
            siblings={siblings}
          />
        ),
      ],
      [
        isAlternatingTeaserListBlockStyle,
        block => (
          <blockStyles.AlternatingTeaserList
            {...block}
            className={className}
            siblings={siblings}
          />
        ),
      ],
      [
        isAlternatingTeaserSlotsBlockStyle,
        block => (
          <blockStyles.AlternatingTeaserSlots
            {...block}
            className={className}
            siblings={siblings}
          />
        ),
      ],
    ]);

    const facebookEmbedCond = cond([
      [
        isFacebookPostBlock,
        block => (
          <blocks.FacebookPost
            {...block}
            className={className}
            siblings={siblings}
          />
        ),
      ],
      [
        isFacebookVideoBlock,
        block => (
          <blocks.FacebookVideo
            {...block}
            className={className}
            siblings={siblings}
          />
        ),
      ],
    ]);

    const embedCond = cond([
      [
        isIFrameBlock,
        block => (
          <blocks.IFrame
            {...block}
            className={className}
            siblings={siblings}
          />
        ),
      ],
      [
        isBildwurfAdBlock,
        block => (
          <blocks.BildwurfAd
            {...block}
            className={className}
            siblings={siblings}
          />
        ),
      ],
      [
        isInstagramBlock,
        block => (
          <blocks.InstagramPost
            {...block}
            className={className}
            siblings={siblings}
          />
        ),
      ],
      [
        isSoundCloudTrackBlock,
        block => (
          <blocks.SoundCloudTrack
            {...block}
            className={className}
            siblings={siblings}
          />
        ),
      ],
      [
        isTikTokVideoBlock,
        block => (
          <blocks.TikTokVideo
            {...block}
            className={className}
            siblings={siblings}
          />
        ),
      ],
      [
        isTwitterTweetBlock,
        block => (
          <blocks.TwitterTweet
            {...block}
            className={className}
            siblings={siblings}
          />
        ),
      ],
      [
        isVimeoVideoBlock,
        block => (
          <blocks.VimeoVideo
            {...block}
            className={className}
            siblings={siblings}
          />
        ),
      ],
      [
        isYouTubeVideoBlock,
        block => (
          <blocks.YouTubeVideo
            {...block}
            className={className}
            siblings={siblings}
          />
        ),
      ],
      [
        isStreamableVideoBlock,
        block => (
          <blocks.StreamableVideo
            {...block}
            className={className}
            siblings={siblings}
          />
        ),
      ],
      [
        isPolisConversationBlock,
        block => (
          <blocks.PolisConversation
            {...block}
            className={className}
            siblings={siblings}
          />
        ),
      ],
    ]);

    const teaserCond = cond([
      [
        isTeaserGridFlexBlock,
        block => (
          <blocks.TeaserGridFlex
            {...block}
            className={className}
            siblings={siblings}
          />
        ),
      ],
      [
        isTeaserGridBlock,
        block => (
          <blocks.TeaserGrid
            {...block}
            className={className}
            siblings={siblings}
          />
        ),
      ],
      [
        isTeaserListBlock,
        block => (
          <blocks.TeaserList
            {...block}
            className={className}
            siblings={siblings}
          />
        ),
      ],
      [
        isTeaserSlotsBlock,
        block => (
          <blocks.TeaserSlots
            {...block}
            className={className}
            siblings={siblings}
          />
        ),
      ],
    ]);

    const imageCond = cond([
      [
        isImageBlock,
        block => (
          <blocks.Image
            {...block}
            className={className}
            siblings={siblings}
          />
        ),
      ],
      [
        isImageGalleryBlock,
        block => (
          <blocks.ImageGallery
            {...block}
            className={className}
            siblings={siblings}
          />
        ),
      ],
    ]);

    return (
      blockStylesCond(block) ??
      facebookEmbedCond(block) ??
      embedCond(block) ??
      teaserCond(block) ??
      imageCond(block) ??
      cond([
        [
          isCrowdfundingBlock,
          block => (
            <blocks.Crowdfunding
              {...(block as BuilderCrowdfundingBlockProps)}
              className={className}
              siblings={siblings}
            />
          ),
        ],
        [
          isTitleBlock,
          block => (
            <blocks.Title
              {...(block as BuilderTitleBlockProps)}
              className={className}
              siblings={siblings}
            />
          ),
        ],
        [
          isQuoteBlock,
          block => (
            <blocks.Quote
              {...(block as BuilderQuoteBlockProps)}
              className={className}
              siblings={siblings}
            />
          ),
        ],
        [
          isBreakBlock,
          block => (
            <blocks.Break
              {...(block as BuilderBreakBlockProps)}
              className={className}
              siblings={siblings}
            />
          ),
        ],
        [
          isRichTextBlock,
          block => (
            <blocks.RichText
              {...(block as BuilderRichTextBlockProps)}
              className={className}
              siblings={siblings}
            />
          ),
        ],
        [
          isHtmlBlock,
          block => (
            <blocks.HTML
              {...(block as BuilderHTMLBlockProps)}
              className={className}
              siblings={siblings}
            />
          ),
        ],
        [
          isSubscribeBlock,
          block => (
            <blocks.Subscribe
              {...(block as BuilderSubscribeBlockProps)}
              className={className}
              siblings={siblings}
            />
          ),
        ],
        [
          isEventBlock,
          block => (
            <blocks.Event
              {...(block as BuilderEventBlockProps)}
              className={className}
              siblings={siblings}
            />
          ),
        ],
        [
          isPollBlock,
          block => (
            <blocks.Poll
              {...(block as BuilderPollBlockProps)}
              className={className}
              siblings={siblings}
            />
          ),
        ],
        [
          isListicleBlock,
          block => (
            <blocks.Listicle
              {...(block as BuilderListicleBlockProps)}
              className={className}
              siblings={siblings}
            />
          ),
        ],
        [
          isCommentBlock,
          block => (
            <blocks.Comment
              {...(block as BuilderCommentBlockProps)}
              className={className}
              siblings={siblings}
            />
          ),
        ],
        [
          isFlexBlock,
          block => (
            <blocks.FlexBlock
              {...(block as BuilderFlexBlockProps)}
              className={className}
              siblings={siblings}
            />
          ),
        ],
      ])(block)
    );
  }
);

export const Blocks = memo(({ blocks, type }: BuilderBlocksProps) => {
  const {
    blocks: { Renderer },
  } = useWebsiteBuilder();

  const siblings = blocks.map(b => ({
    typeName: b.__typename,
    blockStyle: b.blockStyle,
  })) as BlockSibling[];

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
            type={type}
            siblings={siblings}
          />
        </ImageContext.Provider>
      ))}
    </>
  );
});
