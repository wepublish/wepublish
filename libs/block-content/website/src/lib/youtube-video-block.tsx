import {styled} from '@mui/material'
import {Block, YouTubeVideoBlock as YouTubeVideoBlockType} from '@wepublish/website/api'
import {BuilderYouTubeVideoBlockProps} from '@wepublish/website/builder'

export const isYouTubeVideoBlock = (block: Block): block is YouTubeVideoBlockType =>
  block.__typename === 'YouTubeVideoBlock'

export const YouTubeVideoBlockWrapper = styled('div')``

export function YouTubeVideoBlock({videoID, className}: BuilderYouTubeVideoBlockProps) {
  return <YouTubeVideoBlockWrapper className={className}></YouTubeVideoBlockWrapper>
}
