import {Block, SubscribeBlock as SubscribeBlockType} from '@wepublish/website/api'

export const isSubscribeBlock = (block: Block): block is SubscribeBlockType =>
  block.__typename === 'SubscribeBlock'
