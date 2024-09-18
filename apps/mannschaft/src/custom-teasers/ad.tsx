import {BuilderTeaserProps} from '@wepublish/website'
import {allPass, anyPass} from 'ramda'
import {useId} from 'react'
import {Ad} from 'react-ad-manager'
import {AdSizeType} from 'react-ad-manager/dist/types'

export const isAdTeaser = allPass([
  ({teaser}: BuilderTeaserProps) => teaser?.__typename === 'CustomTeaser',
  anyPass([
    ({teaser}: BuilderTeaserProps) => teaser?.preTitle === 'ad-970x250',
    ({teaser}: BuilderTeaserProps) => teaser?.preTitle === 'ad-728x90',
    ({teaser}: BuilderTeaserProps) => teaser?.preTitle === 'ad-320x480',
    ({teaser}: BuilderTeaserProps) => teaser?.preTitle === 'ad-320x416',
    ({teaser}: BuilderTeaserProps) => teaser?.preTitle === 'ad-300x600',
    ({teaser}: BuilderTeaserProps) => teaser?.preTitle === 'ad-300x250'
  ])
])

export const AdTeaser = ({teaser}: BuilderTeaserProps) => {
  const id = useId()

  let size: AdSizeType

  switch (teaser?.preTitle) {
    case 'ad-970x250': {
      size = [970, 250]
      break
    }

    case 'ad-728x90': {
      size = [728, 90]
      break
    }

    case 'ad-320x416': {
      size = [320, 416]
      break
    }

    case 'ad-320x480': {
      size = [320, 480]
      break
    }

    case 'ad-300x600': {
      size = [300, 600]
      break
    }

    case 'ad-300x250':
    default: {
      size = [300, 250]
      break
    }
  }

  return <Ad adUnit={`/22170513353`} name={id} size={size} />
}
