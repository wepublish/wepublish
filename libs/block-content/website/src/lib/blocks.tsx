import {
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
  ({ block, className }: BuilderBlockRendererProps) => {
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
          />
        ),
      ],
      [
        isTeaserSliderBlockStyle,
        block => (
          <blockStyles.TeaserSlider
            {...block}
            className={className}
          />
        ),
      ],
      [
        isFocusTeaserBlockStyle,
        block => (
          <blockStyles.FocusTeaser
            {...block}
            className={className}
          />
        ),
      ],
      [
        isContextBoxBlockStyle,
        block => (
          <blockStyles.ContextBox
            {...block}
            className={className}
          />
        ),
      ],
      [
        isBannerBlockStyle,
        block => (
          <blockStyles.Banner
            {...block}
            className={className}
          />
        ),
      ],
      [
        isAlternatingTeaserGridBlockStyle,
        block => (
          <blockStyles.AlternatingTeaserGrid
            {...block}
            className={className}
          />
        ),
      ],
      [
        isAlternatingTeaserListBlockStyle,
        block => (
          <blockStyles.AlternatingTeaserList
            {...block}
            className={className}
          />
        ),
      ],
      [
        isAlternatingTeaserSlotsBlockStyle,
        block => (
          <blockStyles.AlternatingTeaserSlots
            {...block}
            className={className}
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
          />
        ),
      ],
      [
        isFacebookVideoBlock,
        block => (
          <blocks.FacebookVideo
            {...block}
            className={className}
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
          />
        ),
      ],
      [
        isBildwurfAdBlock,
        block => (
          <blocks.BildwurfAd
            {...block}
            className={className}
          />
        ),
      ],
      [
        isInstagramBlock,
        block => (
          <blocks.InstagramPost
            {...block}
            className={className}
          />
        ),
      ],
      [
        isSoundCloudTrackBlock,
        block => (
          <blocks.SoundCloudTrack
            {...block}
            className={className}
          />
        ),
      ],
      [
        isTikTokVideoBlock,
        block => (
          <blocks.TikTokVideo
            {...block}
            className={className}
          />
        ),
      ],
      [
        isTwitterTweetBlock,
        block => (
          <blocks.TwitterTweet
            {...block}
            className={className}
          />
        ),
      ],
      [
        isVimeoVideoBlock,
        block => (
          <blocks.VimeoVideo
            {...block}
            className={className}
          />
        ),
      ],
      [
        isYouTubeVideoBlock,
        block => (
          <blocks.YouTubeVideo
            {...block}
            className={className}
          />
        ),
      ],
      [
        isStreamableVideoBlock,
        block => (
          <blocks.StreamableVideo
            {...block}
            className={className}
          />
        ),
      ],
      [
        isPolisConversationBlock,
        block => (
          <blocks.PolisConversation
            {...block}
            className={className}
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
          />
        ),
      ],
      [
        isTeaserGridBlock,
        block => (
          <blocks.TeaserGrid
            {...block}
            className={className}
          />
        ),
      ],
      [
        isTeaserListBlock,
        block => (
          <blocks.TeaserList
            {...block}
            className={className}
          />
        ),
      ],
      [
        isTeaserSlotsBlock,
        block => (
          <blocks.TeaserSlots
            {...block}
            className={className}
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
          />
        ),
      ],
      [
        isImageGalleryBlock,
        block => (
          <blocks.ImageGallery
            {...block}
            className={className}
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
            />
          ),
        ],
        [
          isTitleBlock,
          block => (
            <blocks.Title
              {...(block as BuilderTitleBlockProps)}
              className={className}
            />
          ),
        ],
        [
          isQuoteBlock,
          block => (
            <blocks.Quote
              {...(block as BuilderQuoteBlockProps)}
              className={className}
            />
          ),
        ],
        [
          isBreakBlock,
          block => (
            <blocks.Break
              {...(block as BuilderBreakBlockProps)}
              className={className}
            />
          ),
        ],
        [
          isRichTextBlock,
          block => (
            <blocks.RichText
              {...(block as BuilderRichTextBlockProps)}
              className={className}
            />
          ),
        ],
        [
          isHtmlBlock,
          block => (
            <blocks.HTML
              {...(block as BuilderHTMLBlockProps)}
              className={className}
            />
          ),
        ],
        [
          isSubscribeBlock,
          block => (
            <blocks.Subscribe
              {...(block as BuilderSubscribeBlockProps)}
              className={className}
            />
          ),
        ],
        [
          isEventBlock,
          block => (
            <blocks.Event
              {...(block as BuilderEventBlockProps)}
              className={className}
            />
          ),
        ],
        [
          isPollBlock,
          block => (
            <blocks.Poll
              {...(block as BuilderPollBlockProps)}
              className={className}
            />
          ),
        ],
        [
          isListicleBlock,
          block => (
            <blocks.Listicle
              {...(block as BuilderListicleBlockProps)}
              className={className}
            />
          ),
        ],
        [
          isCommentBlock,
          block => (
            <blocks.Comment
              {...(block as BuilderCommentBlockProps)}
              className={className}
            />
          ),
        ],
        [
          isFlexBlock,
          block => <blocks.FlexBlock {...(block as BuilderFlexBlockProps)} />,
        ],
      ])(block)
    );
  }
);

export const Blocks = memo(({ blocks, type }: BuilderBlocksProps) => {
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
          <Renderer
            block={block}
            index={index}
            count={blocks.length}
            type={type}
          />
        </ImageContext.Provider>
      ))}
    </>
  );
});
