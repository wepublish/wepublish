import {ApiV1, BlockRenderer, BuilderBlockRendererProps} from '@wepublish/website'
import {anyPass} from 'ramda'

import {Archive, ArchiveProps, isArchive} from '../../bajour'
import {
  BaselBriefing,
  BaselBriefingProps,
  BestOfWePublish,
  BestOfWePublishProps,
  isBaselBriefing,
  isBestOfWePublish,
  isFasnachtsBriefing,
  isFCBBriefing
} from '../../bajour'

const isAnyBriefing = (block: ApiV1.Block): block is ApiV1.TeaserGridBlock =>
  anyPass([isBaselBriefing, isFCBBriefing, isFasnachtsBriefing])(block)

const extraBlockMap = (block: ApiV1.Block) => {
  if (isBestOfWePublish(block)) {
    return <BestOfWePublish {...(block as BestOfWePublishProps)} />
  } else if (isAnyBriefing(block)) {
    return <BaselBriefing {...(block as BaselBriefingProps)} />
  } else if (isArchive(block)) {
    return <Archive {...(block as ArchiveProps)} />
  }
  return null
}

export const BajourBlockRenderer = (props: BuilderBlockRendererProps) => {
  return extraBlockMap(props.block) ?? <BlockRenderer {...props} />
}
