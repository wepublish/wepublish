import {styled} from '@mui/material'
import {BlockContent, FacebookPostBlock as FacebookPostBlockType} from '@wepublish/website/api'
import {BuilderFacebookPostBlockProps} from '@wepublish/website/builder'

export const isFacebookPostBlock = (block: BlockContent): block is FacebookPostBlockType =>
  block.__typename === 'FacebookPostBlock'

export const FacebookPostBlockWrapper = styled('div')``

export function FacebookPostBlock({userID, postID, className}: BuilderFacebookPostBlockProps) {
  return <FacebookPostBlockWrapper className={className}></FacebookPostBlockWrapper>
}
