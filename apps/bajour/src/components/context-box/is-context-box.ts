import {ApiV1, isBreakBlock} from '@wepublish/website'
import {allPass} from 'ramda'

const hasStyle = (blockStyle: string) => (block: ApiV1.Block) => block.blockStyle === blockStyle

export const isContextBox = (block: ApiV1.Block): block is ApiV1.LinkPageBreakBlock =>
  allPass([hasStyle('ContextBox'), isBreakBlock])(block)
