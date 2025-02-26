import {cond, T} from 'ramda'

import {OnlineReportsBaseTeaser} from './onlinereports-base-teaser'
import {AdTeaser, isAdTeaser} from './custom-teasers/ad'

export const OnlineReportsTeaser = cond([
  [isAdTeaser, props => <AdTeaser {...props} />],
  [T, props => <OnlineReportsBaseTeaser {...props} />]
])
