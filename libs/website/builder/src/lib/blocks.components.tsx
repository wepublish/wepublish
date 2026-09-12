import {
  BuilderBildwurfAdBlockProps,
  BuilderBlockRendererProps,
  BuilderBlocksProps,
  BuilderBreakBlockProps,
  BuilderCommentBlockProps,
  BuilderCrowdfundingBlockProps,
  BuilderEventBlockProps,
  BuilderFacebookPostBlockProps,
  BuilderFacebookVideoBlockProps,
  BuilderFlexBlockProps,
  BuilderHTMLBlockProps,
  BuilderIFrameBlockProps,
  BuilderImageBlockProps,
  BuilderImageGalleryBlockProps,
  BuilderInstagramPostBlockProps,
  BuilderListicleBlockProps,
  BuilderMailchimpFormBlockProps,
  BuilderPolisConversationBlockProps,
  BuilderPollBlockProps,
  BuilderQuoteBlockProps,
  BuilderRichTextBlockProps,
  BuilderSoundCloudTrackBlockProps,
  BuilderStreamableVideoBlockProps,
  BuilderSubscribeBlockProps,
  BuilderTeaserGridBlockProps,
  BuilderTeaserGridFlexBlockProps,
  BuilderTeaserListBlockProps,
  BuilderTeaserSlotsBlockProps,
  BuilderTikTokVideoBlockProps,
  BuilderTitleBlockProps,
  BuilderTwitterTweetBlockProps,
  BuilderVimeoVideoBlockProps,
  BuilderYouTubeVideoBlockProps,
} from './blocks.interface';
import { useWebsiteBuilder } from './website-builder.context';

export const Blocks = (props: BuilderBlocksProps) => {
  const {
    blocks: { Blocks },
  } = useWebsiteBuilder();

  return <Blocks {...props} />;
};

export const BlockRenderer = (props: BuilderBlockRendererProps) => {
  const {
    blocks: { Renderer },
  } = useWebsiteBuilder();

  return <Renderer {...props} />;
};

export const TitleBlock = (props: BuilderTitleBlockProps) => {
  const {
    blocks: { Title },
  } = useWebsiteBuilder();

  return <Title {...props} />;
};

export const ImageBlock = (props: BuilderImageBlockProps) => {
  const {
    blocks: { Image },
  } = useWebsiteBuilder();

  return <Image {...props} />;
};

export const BreakBlock = (props: BuilderBreakBlockProps) => {
  const {
    blocks: { Break },
  } = useWebsiteBuilder();

  return <Break {...props} />;
};

export const ImageGalleryBlock = (props: BuilderImageGalleryBlockProps) => {
  const {
    blocks: { ImageGallery },
  } = useWebsiteBuilder();

  return <ImageGallery {...props} />;
};

export const QuoteBlock = (props: BuilderQuoteBlockProps) => {
  const {
    blocks: { Quote },
  } = useWebsiteBuilder();

  return <Quote {...props} />;
};

export const RichTextBlock = (props: BuilderRichTextBlockProps) => {
  const {
    blocks: { RichText },
  } = useWebsiteBuilder();

  return <RichText {...props} />;
};

export const HTMLBlock = (props: BuilderHTMLBlockProps) => {
  const {
    blocks: { HTML },
  } = useWebsiteBuilder();

  return <HTML {...props} />;
};

export const SubscribeBlock = (props: BuilderSubscribeBlockProps) => {
  const {
    blocks: { Subscribe },
  } = useWebsiteBuilder();

  return <Subscribe {...props} />;
};

export const MailchimpFormBlock = (props: BuilderMailchimpFormBlockProps) => {
  const {
    blocks: { MailchimpForm },
  } = useWebsiteBuilder();

  return <MailchimpForm {...props} />;
};

export const FacebookPostBlock = (props: BuilderFacebookPostBlockProps) => {
  const {
    blocks: { FacebookPost },
  } = useWebsiteBuilder();

  return <FacebookPost {...props} />;
};

export const FacebookVideoBlock = (props: BuilderFacebookVideoBlockProps) => {
  const {
    blocks: { FacebookVideo },
  } = useWebsiteBuilder();

  return <FacebookVideo {...props} />;
};

export const InstagramPostBlock = (props: BuilderInstagramPostBlockProps) => {
  const {
    blocks: { InstagramPost },
  } = useWebsiteBuilder();

  return <InstagramPost {...props} />;
};

export const TwitterTweetBlock = (props: BuilderTwitterTweetBlockProps) => {
  const {
    blocks: { TwitterTweet },
  } = useWebsiteBuilder();

  return <TwitterTweet {...props} />;
};

export const VimeoVideoBlock = (props: BuilderVimeoVideoBlockProps) => {
  const {
    blocks: { VimeoVideo },
  } = useWebsiteBuilder();

  return <VimeoVideo {...props} />;
};

export const StreamableVideoBlock = (
  props: BuilderStreamableVideoBlockProps
) => {
  const {
    blocks: { StreamableVideo },
  } = useWebsiteBuilder();

  return <StreamableVideo {...props} />;
};

export const YouTubeVideoBlock = (props: BuilderYouTubeVideoBlockProps) => {
  const {
    blocks: { YouTubeVideo },
  } = useWebsiteBuilder();

  return <YouTubeVideo {...props} />;
};

export const SoundCloudTrackBlock = (
  props: BuilderSoundCloudTrackBlockProps
) => {
  const {
    blocks: { SoundCloudTrack },
  } = useWebsiteBuilder();

  return <SoundCloudTrack {...props} />;
};

export const PolisConversationBlock = (
  props: BuilderPolisConversationBlockProps
) => {
  const {
    blocks: { PolisConversation },
  } = useWebsiteBuilder();

  return <PolisConversation {...props} />;
};

export const TikTokVideoBlock = (props: BuilderTikTokVideoBlockProps) => {
  const {
    blocks: { TikTokVideo },
  } = useWebsiteBuilder();

  return <TikTokVideo {...props} />;
};

export const BildwurfAdBlock = (props: BuilderBildwurfAdBlockProps) => {
  const {
    blocks: { BildwurfAd },
  } = useWebsiteBuilder();

  return <BildwurfAd {...props} />;
};

export const IFrameBlock = (props: BuilderIFrameBlockProps) => {
  const {
    blocks: { IFrame },
  } = useWebsiteBuilder();

  return <IFrame {...props} />;
};

export const EventBlock = (props: BuilderEventBlockProps) => {
  const {
    blocks: { Event },
  } = useWebsiteBuilder();

  return <Event {...props} />;
};

export const PollBlock = (props: BuilderPollBlockProps) => {
  const {
    blocks: { Poll },
  } = useWebsiteBuilder();

  return <Poll {...props} />;
};

export const CrowdfundingBlock = (props: BuilderCrowdfundingBlockProps) => {
  const {
    blocks: { Crowdfunding },
  } = useWebsiteBuilder();

  return <Crowdfunding {...props} />;
};

export const ListicleBlock = (props: BuilderListicleBlockProps) => {
  const {
    blocks: { Listicle },
  } = useWebsiteBuilder();

  return <Listicle {...props} />;
};

export const TeaserGridFlexBlock = (props: BuilderTeaserGridFlexBlockProps) => {
  const {
    blocks: { TeaserGridFlex },
  } = useWebsiteBuilder();

  return <TeaserGridFlex {...props} />;
};

export const TeaserGridBlock = (props: BuilderTeaserGridBlockProps) => {
  const {
    blocks: { TeaserGrid },
  } = useWebsiteBuilder();

  return <TeaserGrid {...props} />;
};

export const TeaserListBlock = (props: BuilderTeaserListBlockProps) => {
  const {
    blocks: { TeaserList },
  } = useWebsiteBuilder();

  return <TeaserList {...props} />;
};

export const TeaserSlotsBlock = (props: BuilderTeaserSlotsBlockProps) => {
  const {
    blocks: { TeaserSlots },
  } = useWebsiteBuilder();

  return <TeaserSlots {...props} />;
};

export const CommentBlock = (props: BuilderCommentBlockProps) => {
  const {
    blocks: { Comment },
  } = useWebsiteBuilder();

  return <Comment {...props} />;
};

export const FlexBlock = (props: BuilderFlexBlockProps) => {
  const {
    blocks: { FlexBlock },
  } = useWebsiteBuilder();

  return <FlexBlock {...props} />;
};
