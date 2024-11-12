import {BuilderTeaserProps, Teaser} from '@wepublish/website'
import {allPass, cond, T} from 'ramda'

import Mitmachen from '../pages/mitmachen'

export const isSubscribeTeaser = allPass([
  ({teaser}: BuilderTeaserProps) => teaser?.__typename === 'CustomTeaser',
  ({teaser}: BuilderTeaserProps) => teaser?.preTitle === 'subscribe'
])

export const isDonationTeaser = allPass([
  ({teaser}: BuilderTeaserProps) => teaser?.__typename === 'CustomTeaser',
  ({teaser}: BuilderTeaserProps) => teaser?.preTitle === 'spende'
])

export const KolumnaTeaser = cond([
  [isSubscribeTeaser, props => <Mitmachen />],
  [isDonationTeaser, props => <Mitmachen donate />],
  [T, props => <Teaser {...props} />]
])
