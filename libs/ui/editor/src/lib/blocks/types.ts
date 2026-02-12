import {
  ArticleWithoutBlocksFragment,
  BlockContentInput,
  BlockWithAlignment,
  CommentBlockCommentFragment,
  EditorBlockType,
  FullBlockFragment,
  FullCrowdfundingFragment,
  FullEventFragment,
  FullImageFragment,
  FullPoll,
  FullTeaserFragment,
  PageWithoutBlocksFragment,
  SubscribeBlockField,
  Tag,
  TeaserInput,
  TeaserListBlockSort,
  TeaserSlotsAutofillConfigInput,
  TeaserSlotType,
  TeaserType,
} from '@wepublish/editor/api-v2';
import nanoid from 'nanoid';
import { Descendant } from 'slate';

import { BlockListValue } from '../atoms/blockList';
import { ListValue } from '../atoms/listInput';
import { TeaserMetadataProperty } from '../panel/teaserEditPanel';

export interface BaseBlockValue {
  blockStyle?: string | null;
}

export interface RichTextBlockValue extends BaseBlockValue {
  richText: Descendant[];
}

export interface ImageBlockValue extends BaseBlockValue {
  image: FullImageFragment | null;
  caption: string;
  linkUrl?: string;
}

export interface GalleryImageEdge {
  image: FullImageFragment | null;
  caption: string;
}

export interface ImageGalleryBlockValue extends BaseBlockValue {
  images: GalleryImageEdge[];
}

export interface ListicleItem {
  title: string | null | undefined;
  image: FullImageFragment | null;
  richText: Descendant[];
}

export interface ListicleBlockValue extends BaseBlockValue {
  items: ListValue<ListicleItem>[];
}

export interface TitleBlockValue extends BaseBlockValue {
  preTitle: string;
  title: string;
  lead: string;
}

export interface HTMLBlockValue extends BaseBlockValue {
  html: string;
}

export interface SubscribeBlockValue extends BaseBlockValue {
  memberPlanIds: string[];
  fields: SubscribeBlockField[];
}

export interface PollBlockValue extends BaseBlockValue {
  poll: Pick<FullPoll, 'id' | 'question'> | null | undefined;
}

export interface CrowdfundingBlockValue extends BaseBlockValue {
  crowdfunding: Partial<FullCrowdfundingFragment> | null | undefined;
}

export interface EventBlockValue extends BaseBlockValue {
  filter: Partial<{
    tags: string[] | null;
    events: string[] | null;
  }>;
  events: FullEventFragment[];
}

export interface CommentBlockValue extends BaseBlockValue {
  filter: Partial<{
    item: string | null;
    tags: string[] | null;
    comments: string[] | null;
  }>;
  comments: CommentBlockCommentFragment[];
}

export interface QuoteBlockValue extends BaseBlockValue {
  quote: string;
  author: string;
  image?: FullImageFragment | null;
}

export interface LinkPageBreakBlockValue extends BaseBlockValue {
  text: string;
  richText: RichTextBlockValue['richText'];
  linkURL: string;
  linkText: string;
  linkTarget?: string;
  hideButton: boolean;
  image?: FullImageFragment;
}

export type FlexBlockWithAlignment = {
  alignment: BlockWithAlignment['alignment'];
  block?: BlockValue | null;
};

export interface FlexBlockValue extends BaseBlockValue {
  blocks: Array<FlexBlockWithAlignment>;
}

export enum EmbedType {
  StreamableVideo = 'streamableVideo',
  FacebookPost = 'facebookPost',
  FacebookVideo = 'facebookVideo',
  InstagramPost = 'instagramPost',
  TwitterTweet = 'twitterTweet',
  VimeoVideo = 'vimeoVideo',
  YouTubeVideo = 'youTubeVideo',
  SoundCloudTrack = 'soundCloudTrack',
  PolisConversation = 'polisConversation',
  TikTokVideo = 'tikTokVideo',
  BildwurfAd = 'bildwurfAd',
  Other = 'other',
}

interface FacebookPostEmbed extends BaseBlockValue {
  type: EmbedType.FacebookPost;
  userID: string | null | undefined;
  postID: string | null | undefined;
}

interface FacebookVideoEmbed extends BaseBlockValue {
  type: EmbedType.FacebookVideo;
  userID: string | null | undefined;
  videoID: string | null | undefined;
}

interface StreamableVideoEmbed extends BaseBlockValue {
  type: EmbedType.StreamableVideo;
  videoID: string | null | undefined;
}

interface InstagramPostEmbed extends BaseBlockValue {
  type: EmbedType.InstagramPost;
  postID: string | null | undefined;
}

interface TwitterTweetEmbed extends BaseBlockValue {
  type: EmbedType.TwitterTweet;
  userID: string | null | undefined;
  tweetID: string | null | undefined;
}

interface VimeoVideoEmbed extends BaseBlockValue {
  type: EmbedType.VimeoVideo;
  videoID: string | null | undefined;
}

interface YouTubeVideoEmbed extends BaseBlockValue {
  type: EmbedType.YouTubeVideo;
  videoID: string | null | undefined;
}

interface SoundCloudTrackEmbed extends BaseBlockValue {
  type: EmbedType.SoundCloudTrack;
  trackID: string | null | undefined;
}

interface PolisConversationEmbed extends BaseBlockValue {
  type: EmbedType.PolisConversation;
  conversationID: string | null | undefined;
}

interface TikTokVideoEmbed extends BaseBlockValue {
  type: EmbedType.TikTokVideo;
  videoID: string | null | undefined;
  userID: string | null | undefined;
}

interface BildwurfAdEmbed extends BaseBlockValue {
  type: EmbedType.BildwurfAd;
  zoneID: string | null | undefined;
}

export interface OtherEmbed extends BaseBlockValue {
  type: EmbedType.Other;
  url?: string;
  title?: string;
  width?: number;
  height?: number;
  styleCustom?: string;
  sandbox?: string;
}

export type EmbedBlockValue =
  | FacebookPostEmbed
  | FacebookVideoEmbed
  | InstagramPostEmbed
  | TwitterTweetEmbed
  | VimeoVideoEmbed
  | YouTubeVideoEmbed
  | SoundCloudTrackEmbed
  | PolisConversationEmbed
  | StreamableVideoEmbed
  | TikTokVideoEmbed
  | BildwurfAdEmbed
  | OtherEmbed;

export enum MetaDataType {
  General = 'general',
  SocialMedia = 'socialMedia',
  Properties = 'properties',
  Comments = 'Comments',
  Tracking = 'Tracking',
}

export interface ArticleTeaserLink {
  type: TeaserType.Article;
  article: ArticleWithoutBlocksFragment;
}

export interface PageTeaserLink {
  type: TeaserType.Page;
  page: PageWithoutBlocksFragment;
}

export interface EventTeaserLink {
  type: TeaserType.Event;
  event: FullEventFragment;
}

export interface CustomTeaserLink extends BaseTeaser {
  type: TeaserType.Custom;
  contentUrl?: string | null;
  properties?: TeaserMetadataProperty[];
  openInNewTab?: boolean | null;
}

export type TeaserLink =
  | ArticleTeaserLink
  | PageTeaserLink
  | CustomTeaserLink
  | EventTeaserLink;

export interface BaseTeaser {
  image?: FullImageFragment | null;
  preTitle?: string | null;
  title?: string | null;
  lead?: string | null;
}

export interface ArticleTeaser extends ArticleTeaserLink, BaseTeaser {}

export interface PageTeaser extends PageTeaserLink, BaseTeaser {}

export interface CustomTeaser extends CustomTeaserLink, BaseTeaser {}

export interface EventTeaser extends EventTeaserLink, BaseTeaser {}

export type Teaser = ArticleTeaser | PageTeaser | CustomTeaser | EventTeaser;

export type TeaserSlot = {
  type: TeaserSlotType;
  teaser?: Teaser | null;
};

export interface TeaserListBlockValue extends BaseBlockValue {
  title?: string | null;
  filter: {
    tags?: string[] | null;
    tagObjects: Pick<Tag, 'id' | 'tag'>[];
  };
  teaserType: TeaserType;
  skip: number;
  take: number;
  sort?: TeaserListBlockSort | null;
  teasers: Array<[string, Teaser]>;
}

export interface TeaserGridBlockValue extends BaseBlockValue {
  teasers: Array<[string, Teaser | null]>;
  numColumns: number;
}

export interface FlexAlignment {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
  static: boolean;
}

export interface FlexTeaser {
  alignment: FlexAlignment;
  teaser: Teaser | null;
}

export interface TeaserGridFlexBlockValue extends BaseBlockValue {
  flexTeasers: FlexTeaser[];
}

export interface TeaserSlotsBlockValue extends BaseBlockValue {
  title?: string | null;
  autofillConfig: TeaserSlotsAutofillConfigInput;
  slots: Array<TeaserSlot>;
  autofillTeasers: Array<Teaser | null>;
  teasers: Array<Teaser | null>;
}

export type RichTextBlockListValue = BlockListValue<
  EditorBlockType.RichText,
  RichTextBlockValue
>;
export type ImageBlockListValue = BlockListValue<
  EditorBlockType.Image,
  ImageBlockValue
>;
export type ImageGalleryBlockListValue = BlockListValue<
  EditorBlockType.ImageGallery,
  ImageGalleryBlockValue
>;
export type ListicleBlockListValue = BlockListValue<
  EditorBlockType.Listicle,
  ListicleBlockValue
>;
export type TitleBlockListValue = BlockListValue<
  EditorBlockType.Title,
  TitleBlockValue
>;
export type QuoteBlockListValue = BlockListValue<
  EditorBlockType.Quote,
  QuoteBlockValue
>;
export type EmbedBlockListValue = BlockListValue<
  EditorBlockType.Embed,
  EmbedBlockValue
>;
export type LinkPageBreakBlockListValue = BlockListValue<
  EditorBlockType.LinkPageBreak,
  LinkPageBreakBlockValue
>;

export type TeaserListBlockListValue = BlockListValue<
  EditorBlockType.TeaserList,
  TeaserListBlockValue
>;
export type TeaserGridBlock1ListValue = BlockListValue<
  EditorBlockType.TeaserGrid1,
  TeaserGridBlockValue
>;
export type TeaserGridBlock6ListValue = BlockListValue<
  EditorBlockType.TeaserGrid6,
  TeaserGridBlockValue
>;

export type TeaserGridFlexBlockListValue = BlockListValue<
  EditorBlockType.TeaserGridFlex,
  TeaserGridFlexBlockValue
>;

export type TeaserSlotsBlockListValue = BlockListValue<
  EditorBlockType.TeaserSlots,
  TeaserSlotsBlockValue
>;

export type HTMLBlockListValue = BlockListValue<
  EditorBlockType.Html,
  HTMLBlockValue
>;

export type PollBlockListValue = BlockListValue<
  EditorBlockType.Poll,
  PollBlockValue
>;
export type CrowdfundingBlockListValue = BlockListValue<
  EditorBlockType.Crowdfunding,
  CrowdfundingBlockValue
>;
export type SubscribeBlockListValue = BlockListValue<
  EditorBlockType.Subscribe,
  SubscribeBlockValue
>;

export type CommentBlockListValue = BlockListValue<
  EditorBlockType.Comment,
  CommentBlockValue
>;

export type EventBlockListValue = BlockListValue<
  EditorBlockType.Event,
  EventBlockValue
>;

export type FlexBlockListValue = BlockListValue<
  EditorBlockType.FlexBlock,
  FlexBlockValue
>;

export type BlockValue =
  | TitleBlockListValue
  | RichTextBlockListValue
  | ImageBlockListValue
  | ImageGalleryBlockListValue
  | ListicleBlockListValue
  | QuoteBlockListValue
  | EmbedBlockListValue
  | LinkPageBreakBlockListValue
  | TeaserGridBlock1ListValue
  | TeaserGridBlock6ListValue
  | TeaserGridFlexBlockListValue
  | TeaserSlotsBlockListValue
  | HTMLBlockListValue
  | SubscribeBlockListValue
  | PollBlockListValue
  | CrowdfundingBlockListValue
  | CommentBlockListValue
  | EventBlockListValue
  | TeaserListBlockListValue
  | FlexBlockListValue;

export function mapBlockValueToBlockInput(
  block: BlockValue
): BlockContentInput {
  switch (block.type) {
    case EditorBlockType.Comment:
      return {
        comment: {
          filter: {
            item: block.value?.filter.item,
            tags: block.value?.filter.tags ?? [],
            comments: block.value?.filter.comments ?? [],
          },
          blockStyle: block.value.blockStyle,
        },
      };

    case EditorBlockType.Poll:
      return {
        poll: {
          pollId: block.value?.poll?.id,
          blockStyle: block.value.blockStyle,
        },
      };

    case EditorBlockType.Crowdfunding:
      return {
        crowdfunding: {
          crowdfundingId: block.value?.crowdfunding?.id,
          blockStyle: block.value.blockStyle,
        },
      };

    case EditorBlockType.Event:
      return {
        event: {
          filter: {
            events: block.value?.filter.events ?? [],
            tags: block.value?.filter.tags ?? [],
          },
          blockStyle: block.value.blockStyle,
        },
      };

    case EditorBlockType.Html:
      return {
        html: {
          html: block.value?.html,
          blockStyle: block.value.blockStyle,
        },
      };

    case EditorBlockType.Subscribe:
      return {
        subscribe: {
          blockStyle: block.value.blockStyle,
          memberPlanIds: block.value.memberPlanIds ?? [],
          fields: block.value.fields,
        },
      };

    case EditorBlockType.Image:
      return {
        image: {
          imageID: block.value.image?.id,
          caption: block.value.caption || undefined,
          linkUrl: block.value.linkUrl,
          blockStyle: block.value.blockStyle,
        },
      };

    case EditorBlockType.ImageGallery:
      return {
        imageGallery: {
          images: block.value.images.map(item => ({
            caption: item.caption,
            imageID: item.image?.id,
          })),
          blockStyle: block.value.blockStyle,
        },
      };

    case EditorBlockType.Listicle:
      return {
        listicle: {
          items: block.value.items.map(
            ({ value: { title, richText, image } }) => ({
              title,
              richText,
              imageID: image?.id,
            })
          ),
          blockStyle: block.value.blockStyle,
        },
      };

    case EditorBlockType.Title:
      return {
        title: {
          preTitle: block.value.preTitle || undefined,
          title: block.value.title || undefined,
          lead: block.value.lead || undefined,
          blockStyle: block.value.blockStyle,
        },
      };

    case EditorBlockType.RichText:
      return {
        richText: {
          richText: block.value.richText,
          blockStyle: block.value.blockStyle,
        },
      };

    case EditorBlockType.Quote:
      return {
        quote: {
          quote: block.value.quote || undefined,
          author: block.value.author || undefined,
          imageID: block.value.image?.id || undefined,
          blockStyle: block.value.blockStyle,
        },
      };

    case EditorBlockType.LinkPageBreak:
      return {
        linkPageBreak: {
          text: block.value.text || undefined,
          linkText: block.value.linkText || undefined,
          linkURL: block.value.linkURL || undefined,
          richText: block.value.richText,
          linkTarget: block.value.linkTarget || undefined,
          hideButton: block.value.hideButton,
          imageID: block.value.image?.id || undefined,
          blockStyle: block.value.blockStyle,
        },
      };

    case EditorBlockType.Embed: {
      const { value } = block;

      switch (value.type) {
        case EmbedType.FacebookPost:
          return {
            facebookPost: {
              userID: value.userID,
              postID: value.postID,
              blockStyle: block.value.blockStyle,
            },
          };

        case EmbedType.FacebookVideo:
          return {
            facebookVideo: {
              userID: value.userID,
              videoID: value.videoID,
              blockStyle: block.value.blockStyle,
            },
          };

        case EmbedType.StreamableVideo:
          return {
            streamableVideo: {
              videoID: value.videoID,
              blockStyle: block.value.blockStyle,
            },
          };

        case EmbedType.InstagramPost:
          return {
            instagramPost: {
              postID: value.postID,
              blockStyle: block.value.blockStyle,
            },
          };

        case EmbedType.TwitterTweet:
          return {
            twitterTweet: {
              userID: value.userID,
              tweetID: value.tweetID,
              blockStyle: block.value.blockStyle,
            },
          };

        case EmbedType.VimeoVideo:
          return {
            vimeoVideo: {
              videoID: value.videoID,
              blockStyle: block.value.blockStyle,
            },
          };

        case EmbedType.YouTubeVideo:
          return {
            youTubeVideo: {
              videoID: value.videoID,
              blockStyle: block.value.blockStyle,
            },
          };

        case EmbedType.SoundCloudTrack:
          return {
            soundCloudTrack: {
              trackID: value.trackID,
              blockStyle: block.value.blockStyle,
            },
          };

        case EmbedType.PolisConversation:
          return {
            polisConversation: {
              conversationID: value.conversationID,
              blockStyle: block.value.blockStyle,
            },
          };

        case EmbedType.TikTokVideo:
          return {
            tikTokVideo: {
              videoID: value.videoID,
              userID: value.userID,
              blockStyle: block.value.blockStyle,
            },
          };

        case EmbedType.BildwurfAd:
          return {
            bildwurfAd: {
              zoneID: value.zoneID,
              blockStyle: block.value.blockStyle,
            },
          };

        case EmbedType.Other:
          return {
            embed: {
              title: value.title,
              url: value.url,
              width: value.width,
              height: value.height,
              styleCustom: value.styleCustom,
              sandbox: value.sandbox,
              blockStyle: block.value.blockStyle,
            },
          };
      }
      break;
    }

    case EditorBlockType.TeaserList:
      return {
        teaserList: {
          title: block.value.title,
          filter: {
            tags: block.value.filter.tags || [],
          },
          take: block.value.take,
          skip: block.value.skip,
          blockStyle: block.value.blockStyle,
          teaserType: block.value.teaserType,
          sort: block.value.sort,
        },
      };

    case EditorBlockType.TeaserSlots:
      return {
        teaserSlots: {
          title: block.value.title,
          autofillConfig: {
            ...(block.value.autofillConfig.enabled ?
              {
                ...block.value.autofillConfig,
                filter: {
                  tags: block.value.autofillConfig.filter?.tags,
                },
              }
            : {
                enabled: false,
              }),
            enabled: block.value.autofillConfig.enabled ?? false,
          },
          slots: block.value.slots.map(({ teaser, ...slot }) => {
            return {
              ...slot,
              teaser: mapTeaserToTeaserInput(teaser),
            };
          }) ?? [
            { type: TeaserSlotType.Manual },
            { type: TeaserSlotType.Manual },
            { type: TeaserSlotType.Manual },
            { type: TeaserSlotType.Manual },
            { type: TeaserSlotType.Manual },
            { type: TeaserSlotType.Manual },
          ],
          blockStyle: block.value.blockStyle,
        },
      };

    case EditorBlockType.TeaserGridFlex:
      return {
        teaserGridFlex: {
          flexTeasers: block.value.flexTeasers.map(flexTeaser => ({
            teaser: mapTeaserToTeaserInput(flexTeaser.teaser),
            alignment: {
              i: flexTeaser.alignment.i,
              x: flexTeaser.alignment.x,
              y: flexTeaser.alignment.y,
              w: flexTeaser.alignment.w,
              h: flexTeaser.alignment.h,
              static: flexTeaser.alignment.static ?? false,
            },
          })),
          blockStyle: block.value.blockStyle,
        },
      };

    case EditorBlockType.TeaserGrid1:
    case EditorBlockType.TeaserGrid6:
      return {
        teaserGrid: {
          teasers: block.value.teasers.map(([, teaser]) =>
            mapTeaserToTeaserInput(teaser)
          ),
          numColumns: block.value.numColumns,
          blockStyle: block.value.blockStyle,
        },
      };

    case EditorBlockType.FlexBlock: {
      const flexBlock = {
        blocks: block.value.blocks.map(nb => ({
          alignment: nb.alignment,
          block:
            nb.block ? mapBlockValueToBlockInput(nb.block as BlockValue) : null,
        })),
        blockStyle: block.value.blockStyle,
      };

      return { flexBlock };
    }
  }
}

export function mapTeaserToTeaserInput(
  teaser: Teaser | null | undefined
): TeaserInput | null {
  switch (teaser?.type) {
    case TeaserType.Article:
      return {
        article: {
          imageID: teaser.image?.id,
          preTitle: teaser.preTitle || undefined,
          title: teaser.title || undefined,
          lead: teaser.lead || undefined,
          articleID: teaser.article?.id,
        },
      };

    case TeaserType.Page:
      return {
        page: {
          imageID: teaser.image?.id,
          preTitle: teaser.preTitle || undefined,
          title: teaser.title || undefined,
          lead: teaser.lead || undefined,
          pageID: teaser.page?.id,
        },
      };

    case TeaserType.Event:
      return {
        event: {
          imageID: teaser.image?.id,
          preTitle: teaser.preTitle || undefined,
          title: teaser.title || undefined,
          lead: teaser.lead || undefined,
          eventID: teaser.event?.id,
        },
      };

    case TeaserType.Custom:
      return {
        custom: {
          imageID: teaser.image?.id,
          preTitle: teaser.preTitle || undefined,
          title: teaser.title || undefined,
          lead: teaser.lead || undefined,
          contentUrl: teaser.contentUrl || undefined,
          openInNewTab: teaser.openInNewTab ?? false,
          properties: teaser.properties || [],
        },
      };
  }

  return null;
}

export function blockForQueryBlock(
  block: FullBlockFragment | null
): BlockValue {
  const key: string = nanoid();

  switch (block?.__typename) {
    case 'ImageBlock':
      return {
        key,
        type: EditorBlockType.Image,
        value: {
          blockStyle: block.blockStyle,
          caption: block.caption ?? '',
          linkUrl: block.linkUrl ?? '',
          image: block.image ? block.image : null,
        },
      };

    case 'ImageGalleryBlock':
      return {
        key,
        type: EditorBlockType.ImageGallery,
        value: {
          blockStyle: block.blockStyle,
          images: block.images.map(({ image, caption }) => ({
            image: image ?? null,
            caption: caption ?? '',
          })),
        },
      };

    case 'ListicleBlock':
      return {
        key,
        type: EditorBlockType.Listicle,
        value: {
          blockStyle: block.blockStyle,
          items: block.items.map(({ title, richText, image }) => ({
            id: nanoid(),
            value: {
              title,
              image: image ?? null,
              richText,
            },
          })),
        },
      };

    case 'TitleBlock': {
      return {
        key,
        type: EditorBlockType.Title,
        value: {
          blockStyle: block.blockStyle,
          preTitle: block.preTitle ?? '',
          title: block.title ?? '',
          lead: block.lead ?? '',
        },
      };
    }

    case 'RichTextBlock':
      return {
        key,
        type: EditorBlockType.RichText,
        value: {
          blockStyle: block.blockStyle,
          richText: block.richText,
        },
      };

    case 'QuoteBlock':
      return {
        key,
        type: EditorBlockType.Quote,
        value: {
          blockStyle: block.blockStyle,
          quote: block.quote ?? '',
          author: block.author ?? '',
          image: block.image ?? null,
        },
      };

    case 'FacebookPostBlock':
      return {
        key,
        type: EditorBlockType.Embed,
        value: {
          blockStyle: block.blockStyle,
          type: EmbedType.FacebookPost,
          userID: block.userID,
          postID: block.postID,
        },
      };

    case 'FacebookVideoBlock':
      return {
        key,
        type: EditorBlockType.Embed,
        value: {
          blockStyle: block.blockStyle,
          type: EmbedType.FacebookVideo,
          userID: block.userID,
          videoID: block.videoID,
        },
      };

    case 'StreamableVideoBlock':
      return {
        key,
        type: EditorBlockType.Embed,
        value: {
          blockStyle: block.blockStyle,
          type: EmbedType.StreamableVideo,
          videoID: block.videoID,
        },
      };

    case 'InstagramPostBlock':
      return {
        key,
        type: EditorBlockType.Embed,
        value: {
          blockStyle: block.blockStyle,
          type: EmbedType.InstagramPost,
          postID: block.postID,
        },
      };

    case 'TwitterTweetBlock':
      return {
        key,
        type: EditorBlockType.Embed,
        value: {
          blockStyle: block.blockStyle,
          type: EmbedType.TwitterTweet,
          userID: block.userID,
          tweetID: block.tweetID,
        },
      };

    case 'VimeoVideoBlock':
      return {
        key,
        type: EditorBlockType.Embed,
        value: {
          blockStyle: block.blockStyle,
          type: EmbedType.VimeoVideo,
          videoID: block.videoID,
        },
      };

    case 'YouTubeVideoBlock':
      return {
        key,
        type: EditorBlockType.Embed,
        value: {
          blockStyle: block.blockStyle,
          type: EmbedType.YouTubeVideo,
          videoID: block.videoID,
        },
      };

    case 'SoundCloudTrackBlock':
      return {
        key,
        type: EditorBlockType.Embed,
        value: {
          blockStyle: block.blockStyle,
          type: EmbedType.SoundCloudTrack,
          trackID: block.trackID,
        },
      };

    case 'PolisConversationBlock':
      return {
        key,
        type: EditorBlockType.Embed,
        value: {
          blockStyle: block.blockStyle,
          type: EmbedType.PolisConversation,
          conversationID: block.conversationID,
        },
      };

    case 'TikTokVideoBlock':
      return {
        key,
        type: EditorBlockType.Embed,
        value: {
          blockStyle: block.blockStyle,
          type: EmbedType.TikTokVideo,
          videoID: block.videoID,
          userID: block.userID,
        },
      };

    case 'BildwurfAdBlock':
      return {
        key,
        type: EditorBlockType.Embed,
        value: {
          blockStyle: block.blockStyle,
          type: EmbedType.BildwurfAd,
          zoneID: block.zoneID,
        },
      };

    case 'IFrameBlock':
      return {
        key,
        type: EditorBlockType.Embed,
        value: {
          blockStyle: block.blockStyle,
          type: EmbedType.Other,
          url: block.url ?? undefined,
          title: block.title ?? undefined,
          width: block.width ?? undefined,
          height: block.height ?? undefined,
          styleCustom: block.styleCustom ?? undefined,
          sandbox: block.sandbox ?? undefined,
        },
      };

    case 'HTMLBlock':
      return {
        key,
        type: EditorBlockType.Html,
        value: {
          blockStyle: block.blockStyle,
          html: block.html ?? '',
        },
      };

    case 'SubscribeBlock':
      return {
        key,
        type: EditorBlockType.Subscribe,
        value: {
          blockStyle: block.blockStyle,
          fields: block.fields ?? [],
          memberPlanIds: block.memberPlanIds ?? [],
        },
      };

    case 'TeaserListBlock':
      return {
        key,
        type: EditorBlockType.TeaserList,
        value: {
          title: block.title,
          blockStyle: block.blockStyle,
          filter: block.filter,
          skip: block.skip ?? 0,
          take: block.take ?? 6,
          sort: block.sort,
          teaserType: block.teaserType ?? TeaserType.Article,
          teasers: block.teasers.map((teaser, index) => [
            `${index}`,
            {
              ...teaser,
              type:
                teaser?.__typename === 'ArticleTeaser' ? TeaserType.Article
                : teaser?.__typename === 'PageTeaser' ? TeaserType.Page
                : teaser?.__typename === 'EventTeaser' ? TeaserType.Event
                : TeaserType.Custom,
            } as Teaser,
          ]),
        },
      };

    case 'TeaserGridFlexBlock':
      return {
        key,
        type: EditorBlockType.TeaserGridFlex,
        value: {
          blockStyle: block.blockStyle,
          flexTeasers: block?.flexTeasers.map(flexTeaser => ({
            teaser: mapTeaserToQueryTeaser(flexTeaser.teaser),
            alignment: {
              i: flexTeaser?.alignment.i ?? nanoid(),
              x: flexTeaser?.alignment.x ?? 1,
              y: flexTeaser?.alignment.y ?? 1,
              w: flexTeaser?.alignment.w ?? 1,
              h: flexTeaser?.alignment.h ?? 1,
              static: flexTeaser?.alignment.static ?? false,
            },
          })),
        },
      };

    case 'TeaserGridBlock':
      return {
        key,
        type:
          block.numColumns === 1 ?
            EditorBlockType.TeaserGrid1
          : EditorBlockType.TeaserGrid6,
        value: {
          blockStyle: block.blockStyle,
          numColumns: block.numColumns,
          teasers: block.teasers.map(teaser => [
            nanoid(),
            mapTeaserToQueryTeaser(teaser) as Teaser | null,
          ]) as Array<[string, Teaser | null]>,
        },
      };

    case 'TeaserSlotsBlock':
      return (() => {
        return {
          key,
          type: EditorBlockType.TeaserSlots,
          value: {
            title: block.title,
            blockStyle: block.blockStyle,
            slots: block.slots.map(({ teaser, type }) => ({
              type,
              teaser:
                !teaser ? null : (
                  ({
                    ...teaser,
                    type:
                      teaser?.__typename === 'ArticleTeaser' ?
                        TeaserType.Article
                      : teaser?.__typename === 'PageTeaser' ? TeaserType.Page
                      : teaser?.__typename === 'EventTeaser' ? TeaserType.Event
                      : TeaserType.Custom,
                  } as Teaser)
                ),
            })),
            autofillConfig: block.autofillConfig,
            autofillTeasers: block.autofillTeasers.map(mapTeaserToQueryTeaser),
            teasers: block.autofillTeasers.map(mapTeaserToQueryTeaser),
          },
        };
      })();

    case 'BreakBlock':
      return {
        key,
        type: EditorBlockType.LinkPageBreak,
        value: {
          blockStyle: block.blockStyle,
          text: block.text ?? '',
          linkText: block.linkText ?? '',
          linkURL: block.linkURL ?? '',
          richText: block.richText,
          linkTarget: block.linkTarget ?? '',
          hideButton: block.hideButton ?? false,
          image: block.image ?? undefined,
        },
      };

    case 'FlexBlock':
      return {
        key,
        type: EditorBlockType.FlexBlock,
        value: {
          blockStyle: block.blockStyle,
          blocks: block.blocks.map(({ alignment, block }) => ({
            alignment,
            block:
              block ?
                blockForQueryBlock(block as FullBlockFragment)
              : undefined,
          })),
        },
      };

    case 'PollBlock':
      return {
        key,
        type: EditorBlockType.Poll,
        value: {
          blockStyle: block.blockStyle,
          poll: block.poll,
        },
      };

    case 'CrowdfundingBlock':
      return {
        key,
        type: EditorBlockType.Crowdfunding,
        value: {
          blockStyle: block.blockStyle,
          crowdfunding: block.crowdfunding,
        },
      };

    case 'EventBlock':
      return {
        key,
        type: EditorBlockType.Event,
        value: {
          blockStyle: block.blockStyle,
          filter: block.filter,
          events: block.events,
        },
      };

    case 'CommentBlock':
      return {
        key,
        type: EditorBlockType.Comment,
        value: {
          blockStyle: block.blockStyle,
          filter: block.filter,
          comments: block.comments,
        },
      };

    default: {
      throw new Error('Invalid Block');
    }
  }
}

const mapTeaserToQueryTeaser = (
  teaser: FullTeaserFragment | null | undefined
): Teaser | null => {
  if (!teaser) {
    return null;
  }
  switch (teaser.__typename) {
    case 'ArticleTeaser':
      return teaser.article ?
          {
            type: TeaserType.Article,
            image: teaser.image ?? undefined,
            preTitle: teaser.preTitle ?? undefined,
            title: teaser.title ?? undefined,
            lead: teaser.lead ?? undefined,
            article: teaser.article,
          }
        : null;

    case 'PageTeaser':
      return teaser.page ?
          {
            type: TeaserType.Page,
            image: teaser.image ?? undefined,
            preTitle: teaser.preTitle ?? undefined,
            title: teaser.title ?? undefined,
            lead: teaser.lead ?? undefined,
            page: teaser.page,
          }
        : null;

    case 'EventTeaser':
      return teaser.event ?
          {
            type: TeaserType.Event,
            image: teaser.image ?? undefined,
            preTitle: teaser.preTitle ?? undefined,
            title: teaser.title ?? undefined,
            lead: teaser.lead ?? undefined,
            event: teaser.event,
          }
        : null;

    case 'CustomTeaser':
      return teaser ?
          {
            type: TeaserType.Custom,
            image: teaser.image ?? undefined,
            preTitle: teaser.preTitle ?? undefined,
            title: teaser.title ?? undefined,
            lead: teaser.lead ?? undefined,
            contentUrl: teaser.contentUrl ?? undefined,
            openInNewTab: teaser.openInNewTab ?? false,
            properties: teaser?.properties ?? undefined,
          }
        : null;

    default:
      return null;
  }
};
