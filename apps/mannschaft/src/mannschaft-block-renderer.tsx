import {BlockRenderer, BuilderBlockRendererProps} from '@wepublish/website'
import {cond} from 'ramda'
import {useMemo} from 'react'

import {HotAndTrendingBlockStyle, isHotAndTrendingTeasers} from './block-styles/hot-and-trending'

export const MannschaftBlockRenderer = (props: BuilderBlockRendererProps) => {
  const extraBlockMap = useMemo(
    () => cond([[isHotAndTrendingTeasers, block => <HotAndTrendingBlockStyle {...block} />]]),
    []
  )

  return extraBlockMap(props.block) ?? <BlockRenderer {...props} />
}
