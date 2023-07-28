import {styled} from '@mui/material'
import {Block, YouTubeVideoBlock as YouTubeVideoBlockType} from '@wepublish/website/api'
import {BuilderYouTubeVideoBlockProps} from '@wepublish/website/builder'
import ReactPlayer from 'react-player'

export const isYouTubeVideoBlock = (block: Block): block is YouTubeVideoBlockType =>
  block.__typename === 'YouTubeVideoBlock'

export const YouTubeVideoBlockWrapper = styled('div')``

export const YouTubeVideoBlockPlayer = styled(ReactPlayer)`
  width: 100%;
  aspect-ratio: 16/9;
`

export function YouTubeVideoBlock({videoID, className}: BuilderYouTubeVideoBlockProps) {
  return (
    <YouTubeVideoBlockWrapper className={className}>
      <YouTubeVideoBlockPlayer
        width={'auto'}
        height={'auto'}
        url={`https://www.youtube.com/watch?v=${videoID}`}
        controls={true}
      />
    </YouTubeVideoBlockWrapper>
  )
}
