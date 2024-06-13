import {styled} from '@mui/material'
import {
  ImageWrapper,
  Teaser,
  TeaserPreTitleNoContent,
  TeaserPreTitleWrapper
} from '@wepublish/website'
import {cond, T} from 'ramda'

import {DailyBriefingTeaser, isDailyBriefingTeaser} from './daily-briefing/daily-briefing-teaser'

const OverridenTeaser = styled(Teaser)`
  &,
  &:hover {
    ${TeaserPreTitleNoContent},
    ${TeaserPreTitleWrapper} {
      background-color: unset;
    }
  }

  &:hover ${ImageWrapper} {
    transform: unset;
  }
`

export const TsriTeaser = cond([
  [isDailyBriefingTeaser, props => <DailyBriefingTeaser {...props} />],
  [T, props => <OverridenTeaser {...props} />]
])
