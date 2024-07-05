import {ApiV1, hasBlockStyle, isBreakBlock} from '@wepublish/website'
import {allPass} from 'ramda'

export const isInstagramBanner = (block: ApiV1.Block): block is ApiV1.LinkPageBreakBlock =>
  allPass([hasBlockStyle('Instagram'), isBreakBlock])(block)
