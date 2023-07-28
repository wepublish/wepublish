import {styled} from '@mui/material'
import {BuilderTikTokVideoBlockProps} from '@wepublish/website/builder'
import {Block, TikTokVideoBlock as TikTokVideoBlockType} from '@wepublish/website/api'

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

export function TikTokVideoBlock({userID, videoID, className}: BuilderTikTokVideoBlockProps) {
  return (
    <TikTokVideoBlockWrapper className={className}>
      <TikTokVideoBlockPlayer>
        <iframe
          src={`https://www.tiktok.com/embed/${videoID}`}
          allowFullScreen
          title="tiktok-embed"
          allow="encrypted-media;"
          width={450}
          height={800}></iframe>
      </TikTokVideoBlockPlayer>
    </TikTokVideoBlockWrapper>
  )
}
