import styled from '@emotion/styled'
import {Block, FacebookVideoBlock as FacebookVideoBlockType} from '@wepublish/website/api'
import {BuilderFacebookVideoBlockProps} from '@wepublish/website/builder'

export const isFacebookVideoBlock = (block: Block): block is FacebookVideoBlockType =>
  block.__typename === 'FacebookVideoBlock'

export const FacebookVideoBlockWrapper = styled('div')`
  display: flex;
  justify-content: center;
  min-height: 300px;
  padding: 20px;
`

export function FacebookVideoBlock({userID, videoID, className}: BuilderFacebookVideoBlockProps) {
  return <FacebookVideoBlockWrapper className={className}></FacebookVideoBlockWrapper>
}
