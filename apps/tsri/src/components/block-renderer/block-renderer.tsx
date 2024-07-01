import {BlockRenderer, BuilderBlockRendererProps} from '@wepublish/website'
import {cond} from 'ramda'
import {useMemo} from 'react'

import {FocusTeaser, isFocusTeaser} from '../focus-teaser/focus-teaser'

export const TsriBlockRenderer = (props: BuilderBlockRendererProps) => {
  const extraBlockMap = useMemo(
    () => cond([[isFocusTeaser, block => <FocusTeaser {...block} />]]),
    []
  )

  return extraBlockMap(props.block) ?? <BlockRenderer {...props} />
}
