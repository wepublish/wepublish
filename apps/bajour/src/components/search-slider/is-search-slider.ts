import {hasBlockStyle, isTeaserListBlock} from '@wepublish/block-content/website'
import {BlockContent, TeaserListBlock} from '@wepublish/website/api'
import {allPass} from 'ramda'

export const isSearchSlider = (block: BlockContent): block is TeaserListBlock =>
  allPass([hasBlockStyle('SearchSlider'), isTeaserListBlock])(block)
