import {ApiV1, BlockRenderer, BuilderBlockRendererProps} from '@wepublish/website'
import {anyPass, cond} from 'ramda'
import {useMemo} from 'react'

import {
  AdTeaserBlockStyle,
  isFirstAdTeaser,
  isSecondAdTeaser,
  isThirdAdTeaser
} from './block-styles/ad'
import {HighlightBlockStyle, isHighlightTeasers} from './block-styles/highlight'
import {isNewsTeasers, NewsBlockStyle} from './block-styles/news'
import {isRuckSpiegelTeasers, RuckSpiegelBlockStyle} from './block-styles/ruck-spiegel'

export const OnlineReportsBlockRenderer = (props: BuilderBlockRendererProps) => {
  const extraBlockMap = useMemo(
    () =>
      cond([
        [
          anyPass([isFirstAdTeaser, isSecondAdTeaser, isThirdAdTeaser]),
          (block: ApiV1.TeaserListBlock) => <AdTeaserBlockStyle {...block} />
        ],
        [isHighlightTeasers, block => <HighlightBlockStyle {...block} />],
        [isNewsTeasers, block => <NewsBlockStyle {...block} />],
        [isRuckSpiegelTeasers, block => <RuckSpiegelBlockStyle {...block} />]
      ]),
    []
  )
  return extraBlockMap(props.block) ?? <BlockRenderer {...props} />
}
