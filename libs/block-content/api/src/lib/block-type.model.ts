import { registerEnumType } from '@nestjs/graphql';

export enum BlockType {
  Title = 'title',
  RichText = 'richText',
  FacebookPost = 'facebookPost',
  FacebookVideo = 'facebookVideo',
  InstagramPost = 'instagramPost',
  TwitterTweet = 'twitterTweet',
  VimeoVideo = 'vimeoVideo',
  StreamableVideo = 'streamableVideo',
  YouTubeVideo = 'youTubeVideo',
  SoundCloudTrack = 'soundCloudTrack',
  PolisConversation = 'polisConversation',
  TikTokVideo = 'tikTokVideo',
  BildwurfAd = 'bildwurfAd',
  Embed = 'embed',
  Quote = 'quote',
  Image = 'image',
  ImageGallery = 'imageGallery',
  Listicle = 'listicle',
  LinkPageBreak = 'linkPageBreak',
  TeaserGrid = 'teaserGrid',
  TeaserGridFlex = 'teaserGridFlex',
  TeaserList = 'teaserList',
  TeaserSlots = 'teaserSlots',
  HTML = 'html',
  Poll = 'poll',
  Crowdfunding = 'crowdfunding',
  Comment = 'comment',
  Event = 'event',
  Subscribe = 'subscribe',
  FlexBlock = 'flexBlock',
}

registerEnumType(BlockType, {
  name: 'BlockType',
});
