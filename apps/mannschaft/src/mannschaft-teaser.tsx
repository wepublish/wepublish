import {Teaser} from '@wepublish/website'
import {cond, T} from 'ramda'

import {HotAndTrendingTeaser, isHotAndTrendingTeaser} from './custom-teasers/hot-and-trending'

export const MannschaftTeaser = cond([
  [isHotAndTrendingTeaser, props => <HotAndTrendingTeaser {...props} />],
  [T, props => <Teaser {...props} />]
])
