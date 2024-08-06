import {Teaser} from '@wepublish/website'
import {cond, T} from 'ramda'

import {AdTeaser, isAdTeaser} from './custom-teasers/ad'
import {HotAndTrendingTeaser, isHotAndTrendingTeaser} from './custom-teasers/hot-and-trending'

export const MannschaftTeaser = cond([
  [isHotAndTrendingTeaser, props => <HotAndTrendingTeaser {...props} />],
  [isAdTeaser, props => <AdTeaser {...props} />],
  [T, props => <Teaser {...props} />]
])
