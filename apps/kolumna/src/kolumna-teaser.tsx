import {BuilderTeaserProps, Teaser} from '@wepublish/website'
import {allPass, cond, T} from 'ramda'

import Mitmachen from '../pages/mitmachen'

export const isSubscribeTeaser = allPass([
  ({teaser}: BuilderTeaserProps) => teaser?.__typename === 'CustomTeaser',
  ({teaser}: BuilderTeaserProps) => teaser?.preTitle === 'subscribe'
])

export const KolumnaTeaser = cond([
  [isSubscribeTeaser, props => <Mitmachen />],
  [T, props => <Teaser {...props} />]
])
