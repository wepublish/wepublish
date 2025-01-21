import {styled} from '@mui/material'
import {
  BuilderTeaserProps,
  ImageWrapper,
  Teaser,
  TeaserImageWrapper,
  TeaserPreTitleNoContent,
  TeaserPreTitleWrapper
} from '@wepublish/website'
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

export const KolumnaTeaser = cond([
  [isSubscribeTeaser, props => <Mitmachen />],
  [isDonationTeaser, props => <Mitmachen donate />],
  [T, props => <OverridenTeaser {...props} />]
])
