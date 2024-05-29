import {ApiV1, hasBlockStyle, isTeaserGridBlock} from '@wepublish/website'
import {allPass, anyPass} from 'ramda'

export enum BriefingType {
  BaselBriefing = 'BaselBriefing',
  FCBBriefing = 'FCBBriefing',
  FasnachtsBriefing = 'FasnachtsBriefing'
}

export const isBaselBriefing = (block: ApiV1.Block): block is ApiV1.TeaserGridBlock =>
  allPass([hasBlockStyle(BriefingType.BaselBriefing), isTeaserGridBlock])(block)

export const isFCBBriefing = (block: ApiV1.Block): block is ApiV1.TeaserGridBlock =>
  allPass([hasBlockStyle(BriefingType.FCBBriefing), isTeaserGridBlock])(block)

export const isFasnachtsBriefing = (block: ApiV1.Block): block is ApiV1.TeaserGridBlock =>
  allPass([hasBlockStyle(BriefingType.FasnachtsBriefing), isTeaserGridBlock])(block)

export const isAnyBriefing = (block: ApiV1.Block): block is ApiV1.TeaserGridBlock =>
  anyPass([isBaselBriefing, isFCBBriefing, isFasnachtsBriefing])(block)
