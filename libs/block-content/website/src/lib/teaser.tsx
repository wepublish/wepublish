import {cond, T} from 'ramda'
import {isAlternatingTeaser} from './block-styles/alternating/is-alternating'
import {BuilderTeaserProps, useWebsiteBuilder} from '@wepublish/website/builder'
import {useMemo} from 'react'

export const Teaser = (teaserProps: BuilderTeaserProps) => {
  const {
    blocks: {BaseTeaser},
    blockStyles: {AlternatingTeaser}
  } = useWebsiteBuilder()

  const mapping = useMemo(
    () =>
      cond([
        [isAlternatingTeaser, props => <AlternatingTeaser {...props} />],
        [T, props => <BaseTeaser {...props} />]
      ]),
    [AlternatingTeaser, BaseTeaser]
  )

  return mapping(teaserProps)
}
