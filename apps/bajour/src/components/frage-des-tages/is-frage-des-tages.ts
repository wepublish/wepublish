import {ApiV1, isTeaserListBlock} from '@wepublish/website'
import {allPass} from 'ramda'

const hasStyle = (blockStyle: string) => (block: ApiV1.Block) => block.blockStyle === blockStyle

export const isFrageDesTages = (block: ApiV1.Block): block is ApiV1.TeaserListBlock =>
  allPass([hasStyle('FrageDesTages'), isTeaserListBlock])(block)
