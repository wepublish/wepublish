import {styled} from '@mui/material'
import {BuilderEmbedBlockProps, EmbedBlockValue} from '@wepublish/website/builder'
import {Block, EmbedBlock as EmbedBlockType} from '@wepublish/website/api'

import {BildwurfAdEmbed} from './embeds/bildwurfAd'
import {FacebookPostEmbed} from './embeds/facebook'
import {IframeEmbed} from './embeds/iframe'
import {InstagramPostEmbed} from './embeds/instagram'
import {PolisEmbed} from './embeds/polis'
import {SoundCloudTrackEmbed} from './embeds/soundCloud'
import {TikTokVideoEmbed} from './embeds/tikTok'
import {TwitterTweetEmbed} from './embeds/twitter'
import {VimeoVideoEmbed} from './embeds/vimeo'
import {YouTubeVideoEmbed} from './embeds/youTube'

import {EmbedType} from './embeds/types'

export const isEmbedBlock = (block: Block): block is EmbedBlockType =>
  block.__typename === 'EmbedBlock'

export const EmbedBlockWrapper = styled('div')``

export function EmbedPreview({value}: EmbedBlockValue) {
  switch (value.type) {
    case EmbedType.FacebookPost:
      return <FacebookPostEmbed userID={value.userID} postID={value.postID} />

    // case EmbedType.FacebookVideo:
    //   return <FacebookVideoEmbed userID={value.userID} videoID={value.videoID} />

    case EmbedType.InstagramPost:
      return <InstagramPostEmbed postID={value.postID} />

    case EmbedType.TwitterTweet:
      return <TwitterTweetEmbed userID={value.userID} tweetID={value.tweetID} />

    case EmbedType.VimeoVideo:
      return <VimeoVideoEmbed videoID={value.videoID} />

    case EmbedType.YouTubeVideo:
      return <YouTubeVideoEmbed videoID={value.videoID} />

    case EmbedType.SoundCloudTrack:
      return <SoundCloudTrackEmbed trackID={value.trackID} />

    case EmbedType.PolisConversation:
      return <PolisEmbed conversationID={value.conversationID} />

    case EmbedType.TikTokVideo:
      return <TikTokVideoEmbed userID={value.userID} videoID={value.videoID} />

    case EmbedType.BildwurfAd:
      return <BildwurfAdEmbed zoneID={value.zoneID} />

    case EmbedType.Other:
      return (
        <IframeEmbed
          title={value.title}
          url={value.url}
          width={value.width}
          height={value.height}
          styleCustom={value.styleCustom}
          sandbox={value.sandbox}
        />
      )

    default:
      return null
  }
}

export const EmbedBlock = ({className, value}: BuilderEmbedBlockProps) => {
  console.log('value', value)
  return (
    <EmbedBlockWrapper className={className}>
      <EmbedPreview value={value} />
    </EmbedBlockWrapper>
  )
}
