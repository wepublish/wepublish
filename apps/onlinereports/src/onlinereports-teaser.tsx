import {cond, T} from 'ramda'

import {OnlineReportsBaseTeaser} from './onlinereports-base-teaser'
import {AdTeaser, isAdTeaser} from './custom-teasers/ad'
import {
  GelesenUndGedachtTeaser,
  isGelesenUndGedachtTeaser
} from './custom-teasers/gelesen-und-gedacht'
import {isRuckSpiegelTeaser, RuckSpiegelTeaser} from './custom-teasers/ruck-spiegel'

export const OnlineReportsTeaser = cond([
  [isAdTeaser, props => <AdTeaser {...props} />],
  [isGelesenUndGedachtTeaser, props => <GelesenUndGedachtTeaser {...props} />],
  [isRuckSpiegelTeaser, props => <RuckSpiegelTeaser {...props} />],
  [T, props => <OnlineReportsBaseTeaser {...props} />]
])
