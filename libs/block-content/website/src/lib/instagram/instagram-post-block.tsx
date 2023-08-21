import {styled} from '@mui/material'
import {Block, InstagramPostBlock as InstagramPostBlockType} from '@wepublish/website/api'
import {BuilderInstagramPostBlockProps} from '@wepublish/website/builder'

export const isInstagramBlock = (block: Block): block is InstagramPostBlockType =>
  block.__typename === 'InstagramPostBlock'

export const InstagramBlockWrapper = styled('div')``

export function InstagramPostBlock({postID, className}: BuilderInstagramPostBlockProps) {
  return <InstagramBlockWrapper className={className}></InstagramBlockWrapper>
}
