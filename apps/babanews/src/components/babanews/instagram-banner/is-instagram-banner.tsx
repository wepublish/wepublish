import {hasBlockStyle, isBreakBlock} from '@wepublish/block-content/website'
import {BlockContent, BreakBlock} from '@wepublish/website/api'
import {allPass} from 'ramda'

export const isInstagramBanner = (block: BlockContent): block is BreakBlock =>
  allPass([hasBlockStyle('Instagram'), isBreakBlock])(block)
