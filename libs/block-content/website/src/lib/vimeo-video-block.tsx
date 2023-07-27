import {styled} from '@mui/material'
import {Block, VimeoVideoBlock as VimeoVideoBlockType} from '@wepublish/website/api'
import {BuilderVimeoVideoBlockProps} from '@wepublish/website/builder'

export const isVimeoVideoBlock = (block: Block): block is VimeoVideoBlockType =>
  block.__typename === 'VimeoVideoBlock'

export const VimeoVideoBlockWrapper = styled('div')``

export function VimeoVideoBlock({videoID, className}: BuilderVimeoVideoBlockProps) {
  return <VimeoVideoBlockWrapper className={className}></VimeoVideoBlockWrapper>
}
