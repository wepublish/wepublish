import {
  BildwurfAdBlock,
  BuilderBildwurfAdBlockProps,
  BuilderFacebookPostBlockProps,
  BuilderFacebookVideoBlockProps,
  BuilderHTMLBlockProps,
  BuilderIFrameBlockProps,
  BuilderInstagramPostBlockProps,
  BuilderPolisConversationBlockProps,
  BuilderSoundCloudTrackBlockProps,
  BuilderStreamableVideoBlockProps,
  BuilderTikTokVideoBlockProps,
  BuilderTwitterTweetBlockProps,
  BuilderVimeoVideoBlockProps,
  BuilderYouTubeVideoBlockProps,
  FacebookPostBlock,
  FacebookVideoBlock,
  HTMLBlock,
  IFrameBlock,
  InstagramPostBlock,
  PolisConversationBlock,
  SoundCloudTrackBlock,
  StreamableVideoBlock,
  TikTokVideoBlock,
  TwitterTweetBlock,
  VimeoVideoBlock,
  YouTubeVideoBlock,
} from '@wepublish/website/builder';

import { builderBlock } from '../../blocks/builder-block';

export type HtmlConfigProps = Omit<BuilderHTMLBlockProps, 'className'>;
export type IFrameConfigProps = Omit<BuilderIFrameBlockProps, 'className'>;
export type YouTubeConfigProps = Omit<
  BuilderYouTubeVideoBlockProps,
  'className'
>;
export type VimeoConfigProps = Omit<BuilderVimeoVideoBlockProps, 'className'>;
export type TikTokConfigProps = Omit<BuilderTikTokVideoBlockProps, 'className'>;
export type FacebookVideoConfigProps = Omit<
  BuilderFacebookVideoBlockProps,
  'className'
>;
export type FacebookConfigProps = Omit<
  BuilderFacebookPostBlockProps,
  'className'
>;
export type InstagramConfigProps = Omit<
  BuilderInstagramPostBlockProps,
  'className'
>;
export type TwitterConfigProps = Omit<
  BuilderTwitterTweetBlockProps,
  'className'
>;
export type SoundCloudConfigProps = Omit<
  BuilderSoundCloudTrackBlockProps,
  'className'
>;
export type StreamableConfigProps = Omit<
  BuilderStreamableVideoBlockProps,
  'className'
>;
export type PolisConfigProps = Omit<
  BuilderPolisConversationBlockProps,
  'className'
>;
export type BildwurfAdConfigProps = Omit<
  BuilderBildwurfAdBlockProps,
  'className'
>;

export const HtmlRender = builderBlock<HtmlConfigProps>(HTMLBlock);
export const IFrameRender = builderBlock<IFrameConfigProps>(IFrameBlock);
export const YouTubeRender =
  builderBlock<YouTubeConfigProps>(YouTubeVideoBlock);
export const VimeoRender = builderBlock<VimeoConfigProps>(VimeoVideoBlock);
export const TikTokRender = builderBlock<TikTokConfigProps>(TikTokVideoBlock);
export const FacebookVideoRender =
  builderBlock<FacebookVideoConfigProps>(FacebookVideoBlock);
export const FacebookRender =
  builderBlock<FacebookConfigProps>(FacebookPostBlock);
export const InstagramRender =
  builderBlock<InstagramConfigProps>(InstagramPostBlock);
export const TwitterRender =
  builderBlock<TwitterConfigProps>(TwitterTweetBlock);
export const SoundCloudRender =
  builderBlock<SoundCloudConfigProps>(SoundCloudTrackBlock);
export const StreamableRender =
  builderBlock<StreamableConfigProps>(StreamableVideoBlock);
export const PolisRender = builderBlock<PolisConfigProps>(
  PolisConversationBlock
);
export const BildwurfAdRender =
  builderBlock<BildwurfAdConfigProps>(BildwurfAdBlock);
