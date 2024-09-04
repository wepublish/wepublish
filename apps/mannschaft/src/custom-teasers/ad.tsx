import {BuilderTeaserProps} from '@wepublish/website'
import {allPass, anyPass} from 'ramda'
import {useId} from 'react'
import {Ad} from 'react-ad-manager'
import {SingleSizeType} from 'react-ad-manager/dist/types'

export const isAdTeaser = allPass([
  ({teaser}: BuilderTeaserProps) => teaser?.__typename === 'CustomTeaser',
  anyPass([
    ({teaser}: BuilderTeaserProps) => teaser?.preTitle === 'ad-970',
    ({teaser}: BuilderTeaserProps) => teaser?.preTitle === 'ad-728',
    ({teaser}: BuilderTeaserProps) => teaser?.preTitle === 'ad-300'
  ])
])

export const AdTeaser = ({teaser}: BuilderTeaserProps) => {
  const id = useId()

  const size: SingleSizeType =
    teaser?.preTitle === 'ad-728'
      ? [728, 90]
      : teaser?.preTitle === 'ad-970'
      ? [970, 250]
      : [300, 250]

  return <Ad adUnit={`/22170513353`} name={id} size={size} />
}
