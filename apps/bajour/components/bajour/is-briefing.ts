import {BuilderTeaserProps} from '@wepublish/website'

export enum BriefingType {
  BaselBriefing = 'BaselBriefing',
  FCB_Briefing = 'FCB-Briefing',
  FasnachtsBriefing = 'FasnachtsBriefing'
}

export const isBriefing = (teaser: BuilderTeaserProps['teaser']) => {
  // todo the logic will be aligned once we finishg the block "style" property
  if (teaser?.__typename === 'CustomTeaser') {
    if (
      teaser?.properties[0].key === BriefingType.BaselBriefing ||
      teaser?.properties[0].key === BriefingType.FCB_Briefing ||
      teaser?.properties[0].key === BriefingType.FasnachtsBriefing
    ) {
      return true
    }
    return false
  }
  return false
}
