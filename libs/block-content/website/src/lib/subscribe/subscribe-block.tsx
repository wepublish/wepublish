import {BuilderSubscribeBlockProps} from '@wepublish/website/builder'
import {BlockContent, SubscribeBlock as SubscribeBlockType} from '@wepublish/website/api'
import {SubscribeContainer} from '@wepublish/membership/website'

export const isSubscribeBlock = (
  block: Pick<BlockContent, '__typename'>
): block is SubscribeBlockType => block.__typename === 'SubscribeBlock'

export const SubscribeBlock = ({className}: BuilderSubscribeBlockProps) => (
  <SubscribeContainer className={className} />
)
