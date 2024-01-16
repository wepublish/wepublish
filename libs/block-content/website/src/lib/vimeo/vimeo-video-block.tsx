import {styled} from '@mui/material'
import {Block, VimeoVideoBlock as VimeoVideoBlockType} from '@wepublish/website/api'
import {BuilderVimeoVideoBlockProps} from '@wepublish/website/builder'
import ReactPlayer from 'react-player/vimeo'

export const isVimeoVideoBlock = (block: Block): block is VimeoVideoBlockType =>
  block.__typename === 'VimeoVideoBlock'

export const VimeoVideoBlockWrapper = styled('div')``

export const VimeoVideoBlockPlayer = styled(ReactPlayer)`
  width: 100%;
  aspect-ratio: 16/9;
`
export function VimeoVideoBlock({videoID, className}: BuilderVimeoVideoBlockProps) {
  return (
    <VimeoVideoBlockWrapper className={className}>
      <VimeoVideoBlockPlayer
        controls={true}
        url={`https://vimeo.com/${videoID}`}
        width="auto"
        height="auto"
      />
    </VimeoVideoBlockWrapper>
  )
}
