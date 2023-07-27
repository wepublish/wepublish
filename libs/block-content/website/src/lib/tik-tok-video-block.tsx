import {styled} from '@mui/material'
import {BuilderTikTokVideoBlockProps} from '@wepublish/website/builder'
import {Block, TikTokVideoBlock as TikTokVideoBlockType} from '@wepublish/website/api'

export const isTikTokVideoBlock = (block: Block): block is TikTokVideoBlockType =>
  block.__typename === 'TikTokVideoBlock'

export const TikTokVideoBlockWrapper = styled('div')``

export function TikTokVideoBlock({userID, videoID, className}: BuilderTikTokVideoBlockProps) {
  return <TikTokVideoBlockWrapper className={className}></TikTokVideoBlockWrapper>
}
