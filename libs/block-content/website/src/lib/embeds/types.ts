export enum EmbedType {
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
  Other = 'other'
}

interface FacebookPostEmbed {
  type: EmbedType.FacebookPost
  userID: string
  postID: string
}

interface FacebookVideoEmbed {
  type: EmbedType.FacebookVideo
  userID: string
  videoID: string
}

interface InstagramPostEmbed {
  type: EmbedType.InstagramPost
  postID: string
}

interface TwitterTweetEmbed {
  type: EmbedType.TwitterTweet
  userID: string
  tweetID: string
}

interface VimeoVideoEmbed {
  type: EmbedType.VimeoVideo
  videoID: string
}

interface YouTubeVideoEmbed {
  type: EmbedType.YouTubeVideo
  videoID: string
}

interface SoundCloudTrackEmbed {
  type: EmbedType.SoundCloudTrack
  trackID: string
}

interface PolisConversationEmbed {
  type: EmbedType.PolisConversation
  conversationID: string
}

interface TikTokVideoEmbed {
  type: EmbedType.TikTokVideo
  videoID: string
  userID: string
}

interface BildwurfAdEmbed {
  type: EmbedType.BildwurfAd
  zoneID: string
}

export interface OtherEmbed {
  type: EmbedType.Other
  url?: string
  title?: string
  width?: number
  height?: number
  styleCustom?: string
  sandbox?: string
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
  | TikTokVideoEmbed
  | BildwurfAdEmbed
  | OtherEmbed
