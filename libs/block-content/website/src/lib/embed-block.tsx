import {styled} from '@mui/material'
import {BuilderEmbedBlockProps} from '@wepublish/website/builder'
import {
  BildwurfAdBlock,
  Block,
  EmbedBlock as EmbedBlockType,
  FacebookPostBlock,
  FacebookVideoBlock,
  InstagramPostBlock,
  SoundCloudTrackBlock,
  TikTokVideoBlock,
  TwitterTweetBlock,
  VimeoVideoBlock,
  YouTubeVideoBlock
} from '@wepublish/website/api'

import {BildwurfAdEmbed} from './embeds/bildwurfAd'
import {FacebookPostEmbed, FacebookVideoEmbed} from './embeds/facebook'
import {IframeEmbed} from './embeds/iframe'
import {InstagramPostEmbed} from './embeds/instagram'
import {PolisEmbed} from './embeds/polis'
import {SoundCloudTrackEmbed} from './embeds/soundCloud'
import {TikTokVideoEmbed} from './embeds/tikTok'
import {TwitterProvider, TwitterTweetEmbed} from './embeds/twitter'
import {VimeoVideoEmbed} from './embeds/vimeo'
import {YouTubeVideoEmbed} from './embeds/youTube'

import {EmbedType} from './embeds/types'

export const isEmbedBlock = (block: Block): block is EmbedBlockType =>
  block.__typename === 'EmbedBlock'

export const isInstagramBlock = (block: Block): block is InstagramPostBlock =>
  block.__typename === 'InstagramPostBlock'

export const isFacebookPostBlock = (block: Block): block is FacebookPostBlock =>
  block.__typename === 'FacebookPostBlock'

export const isFacebookVideoBlock = (block: Block): block is FacebookVideoBlock =>
  block.__typename === 'FacebookVideoBlock'

export const isTwitterTweetBlock = (block: Block): block is TwitterTweetBlock =>
  block.__typename === 'TwitterTweetBlock'

export const isBildwurfAdBlock = (block: Block): block is BildwurfAdBlock =>
  block.__typename === 'BildwurfAdBlock'

export const isSoundCloudTrackBlock = (block: Block): block is SoundCloudTrackBlock =>
  block.__typename === 'SoundCloudTrackBlock'

export const isYouTubeVideoBlock = (block: Block): block is YouTubeVideoBlock =>
  block.__typename === 'YouTubeVideoBlock'

export const isVimeoVideoBlock = (block: Block): block is VimeoVideoBlock =>
  block.__typename === 'VimeoVideoBlock'

export const isTikTokVideoBlock = (block: Block): block is TikTokVideoBlock =>
  block.__typename === 'TikTokVideoBlock'

export const EmbedBlockWrapper = styled('div')``

export function EmbedPreview({
  type,
  userID,
  postID,
  videoID,
  trackID,
  conversationID,
  zoneID,
  tweetID,
  title,
  url,
  width,
  height,
  styleCustom,
  sandbox
}: EmbedBlockValue) {
  switch (type) {
    case EmbedType.FacebookPost:
      return <FacebookPostEmbed userID={userID} postID={postID} />

    case EmbedType.FacebookVideo:
      return <FacebookVideoEmbed userID={userID} videoID={videoID} />

    case EmbedType.InstagramPost:
      return <InstagramPostEmbed postID={postID} />

    case EmbedType.TwitterTweet:
      return <TwitterTweetEmbed userID={userID} tweetID={tweetID} />

    case EmbedType.VimeoVideo:
      return <VimeoVideoEmbed videoID={videoID} />

    case EmbedType.YouTubeVideo:
      return <YouTubeVideoEmbed videoID={videoID} />

    case EmbedType.SoundCloudTrack:
      return <SoundCloudTrackEmbed trackID={trackID} />

    case EmbedType.PolisConversation:
      return <PolisEmbed conversationID={conversationID} />

    case EmbedType.TikTokVideo:
      return <TikTokVideoEmbed userID={userID} videoID={videoID} />

    case EmbedType.BildwurfAd:
      return <BildwurfAdEmbed zoneID={zoneID} />

    case EmbedType.Other:
      return (
        <IframeEmbed
          title={title}
          url={url}
          width={width}
          height={height}
          styleCustom={styleCustom}
          sandbox={sandbox}
        />
      )

    default:
      return null
  }
}

export const EmbedBlock = ({className, ...args}: BuilderEmbedBlockProps) => {
  return (
    <TwitterProvider>
      <EmbedBlockWrapper className={className}>
        <EmbedPreview {...args} />
      </EmbedBlockWrapper>
    </TwitterProvider>
  )
}
