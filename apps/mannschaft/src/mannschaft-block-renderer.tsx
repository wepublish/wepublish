import {BlockRenderer, BuilderBlockRendererProps} from '@wepublish/website'
import {cond} from 'ramda'
import {useMemo} from 'react'

import {HighlightBlockStyle, isHighlightTeasers} from './block-styles/highlight'
import {HotAndTrendingBlockStyle, isHotAndTrendingTeasers} from './block-styles/hot-and-trending'

export const MannschaftBlockRenderer = (props: BuilderBlockRendererProps) => {
  const extraBlockMap = useMemo(
    () =>
      cond([
        [isHotAndTrendingTeasers, block => <HotAndTrendingBlockStyle {...block} />],
        [isHighlightTeasers, block => <HighlightBlockStyle {...block} />]
      ]),
    []
  )

  return extraBlockMap(props.block) ?? <BlockRenderer {...props} />
}
