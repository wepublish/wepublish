import {ApiV1, isTeaserGridBlock} from '@wepublish/website'
import {allPass} from 'ramda'

const hasStyle = (blockStyle: string) => (block: ApiV1.Block) => block.blockStyle === blockStyle

export const isArchive = (block: ApiV1.Block): block is ApiV1.TeaserGridBlock =>
  allPass([hasStyle('Archive'), isTeaserGridBlock])(block)
