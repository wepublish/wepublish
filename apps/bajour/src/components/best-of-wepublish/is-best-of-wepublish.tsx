import {ApiV1, hasBlockStyle, isTeaserGridBlock} from '@wepublish/website'
import {allPass} from 'ramda'

export const isBestOfWePublish = (block: ApiV1.Block): block is ApiV1.TeaserGridBlock =>
  allPass([hasBlockStyle('BestOfWePublish'), isTeaserGridBlock])(block)
