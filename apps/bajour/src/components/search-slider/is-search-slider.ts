import {ApiV1, hasBlockStyle, isTeaserListBlock} from '@wepublish/website'
import {allPass} from 'ramda'

export const isSearchSlider = (block: ApiV1.Block): block is ApiV1.TeaserListBlock =>
  allPass([hasBlockStyle('SearchSlider'), isTeaserListBlock])(block)
