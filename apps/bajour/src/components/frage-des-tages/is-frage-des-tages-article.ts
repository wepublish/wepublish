import {ApiV1, isPollBlock} from '@wepublish/website'
import {allPass} from 'ramda'

const hasStyle = (blockStyle: string) => (block: ApiV1.Block) => block.blockStyle === blockStyle

export const isFrageDesTagesArticle = (block: ApiV1.Block): block is ApiV1.PollBlock =>
  allPass([hasStyle('FrageDesTagesArticle'), isPollBlock])(block)
