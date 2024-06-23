import {registerEnumType} from '@nestjs/graphql'

export enum BlockType {
  Title = 'title',
  RichText = 'richText',
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
  Embed = 'embed',
  Quote = 'quote',
  Image = 'image',
  ImageGallery = 'imageGallery',
  Listicle = 'listicle',
  LinkPageBreak = 'linkPageBreak',
  TeaserGrid = 'teaserGrid',
  TeaserGrid1 = 'teaserGrid1',
  TeaserGrid6 = 'teaserGrid6',
  TeaserGridFlex = 'teaserGridFlex',
  TeaserList = 'teaserList',
  HTML = 'html',
  Poll = 'poll',
  Comment = 'comment',
  Event = 'event'
}

registerEnumType(BlockType, {name: 'BlockType'})
