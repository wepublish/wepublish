import {styled} from '@mui/material'
import {BuilderTikTokVideoBlockProps} from '@wepublish/website/builder'
import {Block, TikTokVideoBlock as TikTokVideoBlockType} from '@wepublish/website/api'
import {useId} from 'react'

export const isTikTokVideoBlock = (block: Block): block is TikTokVideoBlockType =>
  block.__typename === 'TikTokVideoBlock'

export const TikTokVideoBlockWrapper = styled('div')``

export const TikTokVideoBlockPlayer = styled('div')`
  width: 100%;
  aspect-ratio: 9/16;

  iframe {
    border: 0;
  }
`

export function TikTokVideoBlock({videoID, className}: BuilderTikTokVideoBlockProps) {
  const id = useId()
  return (
    <TikTokVideoBlockWrapper className={className}>
      <TikTokVideoBlockPlayer>
        <iframe
          src={`https://www.tiktok.com/embed/v2/${videoID}`}
          allowFullScreen
          title="tik-tok-video-block"
          allow="encrypted-media;"
          id={id}
          width="100%"
          height="100%"
        />
      </TikTokVideoBlockPlayer>
    </TikTokVideoBlockWrapper>
  )
}
