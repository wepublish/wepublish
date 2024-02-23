import {ApiV1, BlockRenderer, BuilderBlockRendererProps} from '@wepublish/website'

import {Archive, ArchiveProps, isArchive} from '../../bajour'

const extraBlockMap = (block: ApiV1.Block) => {
  if (isArchive(block)) {
    return <Archive {...(block as ArchiveProps)} />
  }
  return null
}

export const BajourBlockRenderer = (props: BuilderBlockRendererProps) => {
  return extraBlockMap(props.block) ?? <BlockRenderer {...props} />
}
