import {ImageRefData} from './image'

export enum VersionState {
  Draft = 'DRAFT',
  Published = 'PUBLISHED'
}

export enum BlockType {
  RichText = 'richText',
  Title = 'title',
  Image = 'image',
  Quote = 'quote',
  FacebookPost = 'facebookPost',
  InstagramPost = 'instagramPost',
  TwitterTweet = 'twitterTweet',
  VimeoVideo = 'vimeoVideo',
  YouTubeVideo = 'youTubeVideo',
  SoundCloudTrack = 'soundCloudTrack',
  Embed = 'embed',
  ArticleTeaserGrid1 = 'articleTeaserGrid1',
  ArticleTeaserGrid6 = 'articleTeaserGrid6'
}

export interface ArticleReference {
  readonly id: string
  readonly title: string
  readonly image: ImageRefData
}
