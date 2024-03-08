import {ApiV1, hasBlockStyle, isTeaserGridBlock} from '@wepublish/website'
import {allPass} from 'ramda'

export const isArchive = (block: ApiV1.Block): block is ApiV1.TeaserGridBlock =>
  allPass([hasBlockStyle('Archive'), isTeaserGridBlock])(block)
