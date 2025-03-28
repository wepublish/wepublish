import {cond} from 'ramda'
import {useMemo} from 'react'

import {HighlightBlockStyle, isHighlightTeasers} from './block-styles/highlight'
import {isNewsTeasers, NewsBlockStyle} from './block-styles/news'
import {isRuckSpiegelTeasers, RuckSpiegelBlockStyle} from './block-styles/ruck-spiegel'
import {
  GelesenUndGedachtBlockStyle,
  isGelesenUndGedacthTeasers
} from './block-styles/gelesen-und-gedacht'
import {AktuelleBild, IsAktuelleBildTeasers} from './block-styles/aktuelle-bild'
import {BuilderBlockRendererProps} from '@wepublish/website/builder'
import {BlockRenderer} from '@wepublish/block-content/website'
import {Advertisement} from './components/advertisement'

export const OnlineReportsBlockRenderer = (props: BuilderBlockRendererProps) => {
  const extraBlockMap = useMemo(
    () =>
      cond([
        [isHighlightTeasers, block => <HighlightBlockStyle {...block} />],
        [isNewsTeasers, block => <NewsBlockStyle {...block} />],
        [isRuckSpiegelTeasers, block => <RuckSpiegelBlockStyle {...block} />],
        [isGelesenUndGedacthTeasers, block => <GelesenUndGedachtBlockStyle {...block} />],
        [IsAktuelleBildTeasers, block => <AktuelleBild {...block} />]
      ]),
    []
  )
  const block = extraBlockMap(props.block) ?? <BlockRenderer {...props} />

  if (props.type === 'Page') {
    return block
  }

  return (
    <>
      {block}
      {[6].includes(props.index + 1) && props.index < props.count - 1 && (
        <Advertisement type={'half-page'} />
      )}
      {[3, 10].includes(props.index + 1) && props.index < props.count - 1 && (
        <Advertisement type={'small'} />
      )}
    </>
  )
}
