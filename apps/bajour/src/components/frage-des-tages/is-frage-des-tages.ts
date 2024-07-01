import {ApiV1, hasBlockStyle, isTeaserListBlock} from '@wepublish/website'
import {allPass} from 'ramda'

export const isFrageDesTages = (block: ApiV1.Block): block is ApiV1.TeaserListBlock =>
  allPass([hasBlockStyle('FrageDesTages'), isTeaserListBlock])(block)
