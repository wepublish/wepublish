import {hasBlockStyle, isTeaserGridBlock} from '@wepublish/block-content/website'
import {BlockContent, TeaserGridBlock} from '@wepublish/website/api'
import {allPass, anyPass} from 'ramda'

export enum BriefingType {
  BaselBriefing = 'BaselBriefing',
  FCBBriefing = 'FCBBriefing',
  FasnachtsBriefing = 'FasnachtsBriefing'
}

export const isBaselBriefingIgnoringBlockType = (block: Pick<BlockContent, 'blockStyle'>) =>
  hasBlockStyle(BriefingType.BaselBriefing)(block)

export const isBaselBriefing = (block: BlockContent): block is TeaserGridBlock =>
  allPass([isBaselBriefingIgnoringBlockType, isTeaserGridBlock])(block)

export const isFCBBriefing = (block: BlockContent): block is TeaserGridBlock =>
  allPass([hasBlockStyle(BriefingType.FCBBriefing), isTeaserGridBlock])(block)

export const isFasnachtsBriefing = (block: BlockContent): block is TeaserGridBlock =>
  allPass([hasBlockStyle(BriefingType.FasnachtsBriefing), isTeaserGridBlock])(block)

export const isAnyBriefing = (block: BlockContent): block is TeaserGridBlock =>
  anyPass([isBaselBriefing, isFCBBriefing, isFasnachtsBriefing])(block)
