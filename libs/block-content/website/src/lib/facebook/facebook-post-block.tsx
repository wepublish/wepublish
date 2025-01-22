import styled from '@emotion/styled'
import {Block, FacebookPostBlock as FacebookPostBlockType} from '@wepublish/website/api'
import {BuilderFacebookPostBlockProps} from '@wepublish/website/builder'

export const isFacebookPostBlock = (block: Block): block is FacebookPostBlockType =>
  block.__typename === 'FacebookPostBlock'

export const FacebookPostBlockWrapper = styled('div')``

export function FacebookPostBlock({userID, postID, className}: BuilderFacebookPostBlockProps) {
  return <FacebookPostBlockWrapper className={className}></FacebookPostBlockWrapper>
}
