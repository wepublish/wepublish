import {Teaser} from '@wepublish/website'
import {cond, T} from 'ramda'

import {DailyBriefingTeaser, isDailyBriefingTeaser} from './daily-briefing/daily-briefing-teaser'

export const TsriTeaser = cond([
  [isDailyBriefingTeaser, props => <DailyBriefingTeaser {...props} />],
  [T, props => <Teaser {...props} />]
])
