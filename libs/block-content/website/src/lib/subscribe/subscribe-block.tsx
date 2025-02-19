import {BuilderSubscribeBlockProps} from '@wepublish/website/builder'
import {Block, SubscribeBlock as SubscribeBlockType} from '@wepublish/website/api'
import {SubscribeContainer} from '@wepublish/membership/website'

export const isSubscribeBlock = (block: Block): block is SubscribeBlockType =>
  block.__typename === 'SubscribeBlock'

export const SubscribeBlock = ({className}: BuilderSubscribeBlockProps) => (
  <SubscribeContainer className={className} />
)
