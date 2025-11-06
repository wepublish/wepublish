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
import { BlockContent } from '@wepublish/website/api';

export const BlockRenderer = memo(({ block }: BuilderBlockRendererProps) => {
  const { blocks, blockStyles } = useWebsiteBuilder();

  console.log('BlockRenderer: memo: received:', block);

  const blockStylesCond = cond([
    [isImageSliderBlockStyle, block => <blockStyles.ImageSlider {...block} />],
    [
      isTeaserSliderBlockStyle,
      block => <blockStyles.TeaserSlider {...block} />,
    ],
    [isFocusTeaserBlockStyle, block => <blockStyles.FocusTeaser {...block} />],
    [isContextBoxBlockStyle, block => <blockStyles.ContextBox {...block} />],
    [isBannerBlockStyle, block => <blockStyles.Banner {...block} />],
    [
      isAlternatingTeaserGridBlockStyle,
      block => <blockStyles.AlternatingTeaserGrid {...block} />,
    ],
    [
      isAlternatingTeaserListBlockStyle,
      block => <blockStyles.AlternatingTeaserList {...block} />,
    ],
    [
      isAlternatingTeaserSlotsBlockStyle,
      block => <blockStyles.AlternatingTeaserSlots {...block} />,
    ],
  ]);

  const facebookEmbedCond = cond([
    [isFacebookPostBlock, block => <blocks.FacebookPost {...block} />],
    [isFacebookVideoBlock, block => <blocks.FacebookVideo {...block} />],
  ]);

  const embedCond = cond([
    [isIFrameBlock, block => <blocks.IFrame {...block} />],
    [isBildwurfAdBlock, block => <blocks.BildwurfAd {...block} />],
    [isInstagramBlock, block => <blocks.InstagramPost {...block} />],
    [isSoundCloudTrackBlock, block => <blocks.SoundCloudTrack {...block} />],
    [isTikTokVideoBlock, block => <blocks.TikTokVideo {...block} />],
    [isTwitterTweetBlock, block => <blocks.TwitterTweet {...block} />],
    [isVimeoVideoBlock, block => <blocks.VimeoVideo {...block} />],
    [isYouTubeVideoBlock, block => <blocks.YouTubeVideo {...block} />],
    [
      isPolisConversationBlock,
      block => <blocks.PolisConversation {...block} />,
    ],
  ]);

  const teaserCond = cond([
    [isTeaserGridFlexBlock, block => <blocks.TeaserGridFlex {...block} />],
    [isTeaserGridBlock, block => <blocks.TeaserGrid {...block} />],
    [isTeaserListBlock, block => <blocks.TeaserList {...block} />],
    [isTeaserSlotsBlock, block => <blocks.TeaserSlots {...block} />],
  ]);

  const imageCond = cond([
    [isImageBlock, block => <blocks.Image {...block} />],
    [isImageGalleryBlock, block => <blocks.ImageGallery {...block} />],
  ]);

  /*
  console.log(
    'flexBlock',
    cond([
      [
        isFlexBlock,
        block => <blocks.FlexBlock {...(block as BuilderFlexBlockProps)} />,
      ],
    ])(block)
  );
  */

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
          <blocks.Crowdfunding {...(block as BuilderCrowdfundingBlockProps)} />
        ),
      ],
      [
        isTitleBlock,
        block => <blocks.Title {...(block as BuilderTitleBlockProps)} />,
      ],
      [
        isQuoteBlock,
        block => <blocks.Quote {...(block as BuilderQuoteBlockProps)} />,
      ],
      [
        isBreakBlock,
        block => <blocks.Break {...(block as BuilderBreakBlockProps)} />,
      ],
      [
        isRichTextBlock,
        block => <blocks.RichText {...(block as BuilderRichTextBlockProps)} />,
      ],
      [
        isHtmlBlock,
        block => <blocks.HTML {...(block as BuilderHTMLBlockProps)} />,
      ],
      [
        isSubscribeBlock,
        block => (
          <blocks.Subscribe {...(block as BuilderSubscribeBlockProps)} />
        ),
      ],
      [
        isEventBlock,
        block => <blocks.Event {...(block as BuilderEventBlockProps)} />,
      ],
      [
        isPollBlock,
        block => <blocks.Poll {...(block as BuilderPollBlockProps)} />,
      ],
      [
        isListicleBlock,
        block => <blocks.Listicle {...(block as BuilderListicleBlockProps)} />,
      ],
      [
        isCommentBlock,
        block => <blocks.Comment {...(block as BuilderCommentBlockProps)} />,
      ],
      [
        isFlexBlock,
        block => {
          const nestedBlocks = (
            block as BuilderFlexBlockProps
          ).nestedBlocks.map(nb => nb.block);

          console.log('FlexBlock nestedBlocks. length:', nestedBlocks.length);

          const children = (
            <Blocks
              blocks={nestedBlocks as BlockContent[]}
              type="Article"
            />
          );

          console.log('Rendering FlexBlock with children:', children);

          return (
            <blocks.FlexBlock
              {...(block as BuilderFlexBlockProps)}
              children={children}
            />
          );
        },
      ],
    ])(block)
  );
});

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
