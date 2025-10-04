import {
  BlockContent,
  SubscribeBlock as SubscribeBlockType,
} from '@wepublish/website/api';

export const isSubscribeBlock = (
  block: Pick<BlockContent, '__typename'>
): block is SubscribeBlockType => block.__typename === 'SubscribeBlock';
