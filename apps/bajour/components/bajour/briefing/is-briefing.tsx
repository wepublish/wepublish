import {ApiV1, isTeaserGridBlock} from '@wepublish/website'
import {allPass} from 'ramda'

export enum BriefingType {
  BaselBriefing = 'BaselBriefing',
  FCBBriefing = 'FCBBriefing',
  FasnachtsBriefing = 'FasnachtsBriefing'
}

const hasStyle = (blockStyle: string) => (block: ApiV1.Block) => block.blockStyle === blockStyle

export const isBaselBriefing = (block: ApiV1.Block): block is ApiV1.TeaserGridBlock =>
  allPass([hasStyle(BriefingType.BaselBriefing), isTeaserGridBlock])(block)

export const isFCBBriefing = (block: ApiV1.Block): block is ApiV1.TeaserGridBlock =>
  allPass([hasStyle(BriefingType.FCBBriefing), isTeaserGridBlock])(block)

export const isFasnachtsBriefing = (block: ApiV1.Block): block is ApiV1.TeaserGridBlock =>
  allPass([hasStyle(BriefingType.FasnachtsBriefing), isTeaserGridBlock])(block)
