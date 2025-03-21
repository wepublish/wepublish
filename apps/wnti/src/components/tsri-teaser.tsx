import {styled} from '@mui/material'
import {
  Teaser,
  TeaserImageWrapper,
  TeaserPreTitleNoContent,
  TeaserPreTitleWrapper
} from '@wepublish/block-content/website'
import {ImageWrapper} from '@wepublish/image/website'
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

  ${TeaserImageWrapper}:empty {
    min-height: unset;
  }
`

export const TsriTeaser = cond([
  [isDailyBriefingTeaser, props => <DailyBriefingTeaser {...props} />],
  [T, props => <OverridenTeaser {...props} />]
])
