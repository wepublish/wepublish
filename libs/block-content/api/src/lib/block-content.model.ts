import {
  createUnionType,
  Field,
  InputType,
  InterfaceType,
} from '@nestjs/graphql';
import { QuoteBlock, QuoteBlockInput } from './quote/quote-block.model';
import {
  RichTextBlock,
  RichTextBlockInput,
} from './richtext/richtext-block.model';
import { BaseBlock, UnknownBlock } from './base-block.model';
import { HTMLBlock, HTMLBlockInput } from './html/html-block.model';
import { TitleBlock, TitleBlockInput } from './title/title-block.model';
import { ImageBlock, ImageBlockInput } from './image/image-block.model';
import { BreakBlock, BreakBlockInput } from './break/break-block.model';
import { EventBlock, EventBlockInput } from './event/event-block.model';
import { CommentBlock, CommentBlockInput } from './comment/comment-block.model';
import { PollBlock, PollBlockInput } from './poll/poll-block.model';
import {
  ImageGalleryBlock,
  ImageGalleryBlockInput,
} from './image/image-gallery-block.model';
import { BlockType } from './block-type.model';
import { IFrameBlock, IFrameBlockInput } from './embed/iframe-block.model';
import {
  BildwurfAdBlock,
  BildwurfAdBlockInput,
} from './embed/bildwurf-block.model';
import {
  FacebookPostBlock,
  FacebookPostBlockInput,
  FacebookVideoBlock,
  FacebookVideoBlockInput,
} from './embed/facebook-block.model';
import {
  InstagramPostBlock,
  InstagramPostBlockInput,
} from './embed/instagram-block.model';
import {
  PolisConversationBlock,
  PolisConversationBlockInput,
} from './embed/polis-block.model';
import {
  SoundCloudTrackBlock,
  SoundCloudTrackBlockInput,
} from './embed/soundcloud-block.model';
import {
  TikTokVideoBlock,
  TikTokVideoBlockInput,
} from './embed/tiktok-block.model';
import {
  TwitterTweetBlock,
  TwitterTweetBlockInput,
} from './embed/twitter-block.model';
import {
  VimeoVideoBlock,
  VimeoVideoBlockInput,
} from './embed/vimeo-block.model';
import {
  YouTubeVideoBlock,
  YouTubeVideoBlockInput,
} from './embed/youtube-block.model';
import {
  ListicleBlock,
  ListicleBlockInput,
} from './listicle/listicle-block.model';
import {
  TeaserGridBlock,
  TeaserGridBlockInput,
} from './teaser/teaser-grid.model';
import {
  FlexTeaserInput,
  TeaserGridFlexBlock,
  TeaserGridFlexBlockInput,
} from './teaser/teaser-flex.model';
import {
  TeaserListBlock,
  TeaserListBlockInput,
} from './teaser/teaser-list.model';
import { mapTeaserUnionMap } from './teaser/teaser.model';
import {
  SubscribeBlock,
  SubscribeBlockInput,
} from './subscribe/subscribe-block.model';
import {
  TeaserSlotsBlock,
  TeaserSlotsBlockInput,
} from './teaser-slot/teaser-slots.model';
import { TeaserSlotInput } from './teaser-slot/teaser-slot.model';
import {
  CrowdfundingBlock,
  CrowdfundingBlockInput,
} from './crowdfunding/crowdfunding-block.model';
import {
  StreamableVideoBlock,
  StreamableVideoBlockInput,
} from './embed/streamable-block.model';
import { FlexBlock, FlexBlockInput } from './flex/flex-block.model';

export const BlockContent = createUnionType({
  name: 'BlockContent',
  types: () =>
    [
      UnknownBlock,
      QuoteBlock,
      RichTextBlock,
      ListicleBlock,
      HTMLBlock,
      TitleBlock,
      ImageBlock,
      ImageGalleryBlock,
      BreakBlock,
      EventBlock,
      CommentBlock,
      PollBlock,
      CrowdfundingBlock,
      IFrameBlock,
      BildwurfAdBlock,
      FacebookPostBlock,
      FacebookVideoBlock,
      InstagramPostBlock,
      PolisConversationBlock,
      SoundCloudTrackBlock,
      TikTokVideoBlock,
      TwitterTweetBlock,
      VimeoVideoBlock,
      StreamableVideoBlock,
      YouTubeVideoBlock,
      SubscribeBlock,
      TeaserGridBlock,
      TeaserGridFlexBlock,
      TeaserListBlock,
      TeaserSlotsBlock,
      FlexBlock,
    ] as const,
  resolveType: (value: BaseBlock<BlockType>) => {
    switch (value.type) {
      case BlockType.RichText:
        return RichTextBlock.name;
      case BlockType.Quote:
        return QuoteBlock.name;
      case BlockType.Listicle:
        return ListicleBlock.name;
      case BlockType.HTML:
        return HTMLBlock.name;
      case BlockType.Title:
        return TitleBlock.name;
      case BlockType.Image:
        return ImageBlock.name;
      case BlockType.ImageGallery:
        return ImageGalleryBlock.name;
      case BlockType.LinkPageBreak:
        return BreakBlock.name;
      case BlockType.Poll:
        return PollBlock.name;
      case BlockType.Crowdfunding:
        return CrowdfundingBlock.name;
      case BlockType.Event:
        return EventBlock.name;
      case BlockType.Comment:
        return CommentBlock.name;
      case BlockType.Embed:
        return IFrameBlock.name;
      case BlockType.BildwurfAd:
        return BildwurfAdBlock.name;
      case BlockType.FacebookPost:
        return FacebookPostBlock.name;
      case BlockType.FacebookVideo:
        return FacebookVideoBlock.name;
      case BlockType.StreamableVideo:
        return StreamableVideoBlock.name;
      case BlockType.InstagramPost:
        return InstagramPostBlock.name;
      case BlockType.PolisConversation:
        return PolisConversationBlock.name;
      case BlockType.SoundCloudTrack:
        return SoundCloudTrackBlock.name;
      case BlockType.TikTokVideo:
        return TikTokVideoBlock.name;
      case BlockType.TwitterTweet:
        return TwitterTweetBlock.name;
      case BlockType.VimeoVideo:
        return VimeoVideoBlock.name;
      case BlockType.YouTubeVideo:
        return YouTubeVideoBlock.name;
      case BlockType.Subscribe:
        return SubscribeBlock.name;
      case BlockType.TeaserGrid:
        return TeaserGridBlock.name;
      case BlockType.TeaserGridFlex:
        return TeaserGridFlexBlock.name;
      case BlockType.TeaserList:
        return TeaserListBlock.name;
      case BlockType.TeaserSlots:
        return TeaserSlotsBlock.name;
      case BlockType.FlexBlock:
        return FlexBlock.name;
    }

    console.warn(`Block ${value.type} not implemented!`);

    return UnknownBlock.name;
  },
});

@InputType()
export class BlockContentInput {
  @Field(() => RichTextBlockInput, { nullable: true })
  [BlockType.RichText]?: RichTextBlockInput;
  @Field(() => QuoteBlockInput, { nullable: true })
  [BlockType.Quote]?: QuoteBlockInput;
  @Field(() => ListicleBlockInput, { nullable: true })
  [BlockType.Listicle]?: ListicleBlockInput;
  @Field(() => HTMLBlockInput, { nullable: true })
  [BlockType.HTML]?: HTMLBlockInput;
  @Field(() => TitleBlockInput, { nullable: true })
  [BlockType.Title]?: TitleBlockInput;

  @Field(() => ImageBlockInput, { nullable: true })
  [BlockType.Image]?: ImageBlockInput;
  @Field(() => ImageGalleryBlockInput, { nullable: true })
  [BlockType.ImageGallery]?: ImageGalleryBlockInput;

  @Field(() => BreakBlockInput, { nullable: true })
  [BlockType.LinkPageBreak]?: BreakBlockInput;
  @Field(() => PollBlockInput, { nullable: true })
  [BlockType.Poll]?: PollBlockInput;
  @Field(() => CrowdfundingBlockInput, { nullable: true })
  [BlockType.Crowdfunding]?: CrowdfundingBlockInput;
  @Field(() => EventBlockInput, { nullable: true })
  [BlockType.Event]?: EventBlockInput;
  @Field(() => CommentBlockInput, { nullable: true })
  [BlockType.Comment]?: CommentBlockInput;
  @Field(() => SubscribeBlockInput, { nullable: true })
  [BlockType.Subscribe]?: SubscribeBlockInput;

  @Field(() => IFrameBlockInput, { nullable: true })
  [BlockType.Embed]?: IFrameBlockInput;
  @Field(() => BildwurfAdBlockInput, { nullable: true })
  [BlockType.BildwurfAd]?: BildwurfAdBlockInput;
  @Field(() => FacebookPostBlockInput, { nullable: true })
  [BlockType.FacebookPost]?: FacebookPostBlockInput;
  @Field(() => FacebookVideoBlockInput, { nullable: true })
  [BlockType.FacebookVideo]?: FacebookVideoBlockInput;
  @Field(() => InstagramPostBlockInput, { nullable: true })
  [BlockType.InstagramPost]?: InstagramPostBlockInput;
  @Field(() => PolisConversationBlockInput, { nullable: true })
  [BlockType.PolisConversation]?: PolisConversationBlockInput;
  @Field(() => SoundCloudTrackBlockInput, { nullable: true })
  [BlockType.SoundCloudTrack]?: SoundCloudTrackBlockInput;
  @Field(() => TikTokVideoBlockInput, { nullable: true })
  [BlockType.TikTokVideo]?: TikTokVideoBlockInput;
  @Field(() => StreamableVideoBlockInput, { nullable: true })
  [BlockType.StreamableVideo]?: StreamableVideoBlockInput;
  @Field(() => TwitterTweetBlockInput, { nullable: true })
  [BlockType.TwitterTweet]?: TwitterTweetBlockInput;
  @Field(() => VimeoVideoBlockInput, { nullable: true })
  [BlockType.VimeoVideo]?: VimeoVideoBlockInput;
  @Field(() => YouTubeVideoBlockInput, { nullable: true })
  [BlockType.YouTubeVideo]?: YouTubeVideoBlockInput;

  @Field(() => TeaserGridBlockInput, { nullable: true })
  [BlockType.TeaserGrid]?: TeaserGridBlockInput;
  @Field(() => TeaserGridFlexBlockInput, { nullable: true })
  [BlockType.TeaserGridFlex]?: TeaserGridFlexBlockInput;
  @Field(() => TeaserListBlockInput, { nullable: true })
  [BlockType.TeaserList]?: TeaserListBlockInput;
  @Field(() => TeaserSlotsBlockInput, { nullable: true })
  [BlockType.TeaserSlots]?: TeaserSlotsBlockInput;
  @Field(() => FlexBlockInput, { nullable: true })
  [BlockType.FlexBlock]?: FlexBlockInput;
}

export function mapBlockUnionMap(
  value: BlockContentInput
): typeof BlockContent {
  const valueKeys = Object.keys(value);

  if (valueKeys.length === 0) {
    throw new Error(`Received no block types.`);
  }

  if (valueKeys.length > 1) {
    throw new Error(
      `Received multiple block types (${JSON.stringify(
        Object.keys(value)
      )}), they're mutually exclusive.`
    );
  }

  const type = Object.keys(value)[0] as BlockType;

  switch (type) {
    case BlockType.TeaserGrid: {
      const blockValue = value[type];

      return {
        type,
        ...blockValue,
        teasers: blockValue?.teasers.map(mapTeaserUnionMap) ?? [],
      };
    }

    case BlockType.TeaserGridFlex: {
      const blockValue = value[type];

      return {
        type,
        ...blockValue,
        flexTeasers:
          blockValue?.flexTeasers.map(
            ({ teaser, ...value }: FlexTeaserInput) => ({
              ...value,
              teaser: mapTeaserUnionMap(teaser),
            })
          ) ?? [],
      };
    }

    case BlockType.TeaserSlots: {
      const blockValue = value[type];

      return {
        type,
        ...blockValue,
        slots:
          blockValue?.slots.map(({ teaser, ...value }: TeaserSlotInput) => ({
            ...value,
            teaser: mapTeaserUnionMap(teaser),
          })) ?? [],
        teasers: [],
        autofillTeasers: [],
      };
    }

    case BlockType.FlexBlock: {
      const blockValue = value[type];

      return {
        type,
        ...blockValue,
        blocks:
          blockValue?.blocks.map(block => {
            return {
              alignment: block.alignment,
              block: block.block ? mapBlockUnionMap(block.block) : undefined,
            };
          }) ?? [],
      };
    }

    default: {
      const blockValue = value[type];

      return { type, ...blockValue };
    }
  }
}

@InterfaceType()
export class HasBlockContent {
  @Field(() => [BlockContent])
  blocks!: Array<typeof BlockContent>;
}

@InterfaceType()
export class HasOneBlockContent {
  @Field(() => BlockContent, { nullable: true })
  block?: typeof BlockContent;
}
