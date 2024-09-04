import {BuilderTeaserProps} from '@wepublish/website'
import {allPass, anyPass} from 'ramda'
import {useId} from 'react'
import {Ad} from 'react-ad-manager'
import {AdSizeType} from 'react-ad-manager/dist/types'

export const isAdTeaser = allPass([
  ({teaser}: BuilderTeaserProps) => teaser?.__typename === 'CustomTeaser',
  anyPass([
    ({teaser}: BuilderTeaserProps) => teaser?.preTitle === 'ad-970',
    ({teaser}: BuilderTeaserProps) => teaser?.preTitle === 'ad-728',
    ({teaser}: BuilderTeaserProps) => teaser?.preTitle === 'ad-320',
    ({teaser}: BuilderTeaserProps) => teaser?.preTitle === 'ad-300'
  ])
])

export const AdTeaser = ({teaser}: BuilderTeaserProps) => {
  const id = useId()

  let size: AdSizeType

  switch (teaser?.preTitle) {
    case 'ad-970': {
      size = [970, 250]
      break
    }

    case 'ad-728': {
      size = [728, 90]
      break
    }

    case 'ad-320': {
      size = [
        [320, 416],
        [320, 480]
      ]
      break
    }

    case 'ad-300':
    default: {
      size = [
        [300, 250],
        [300, 600]
      ]
      break
    }
  }

  return <Ad adUnit={`/22170513353`} name={id} size={size} />
}
