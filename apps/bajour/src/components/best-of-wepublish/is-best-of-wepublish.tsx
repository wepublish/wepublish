import {hasBlockStyle, isTeaserGridBlock} from '@wepublish/block-content/website'
import {BlockContent, TeaserGridBlock} from '@wepublish/website/api'
import {allPass} from 'ramda'

export const isBestOfWePublish = (block: BlockContent): block is TeaserGridBlock =>
  allPass([hasBlockStyle('BestOfWePublish'), isTeaserGridBlock])(block)
