import {BuilderTeaserProps, TeaserWrapper} from '@wepublish/website'
import {allPass} from 'ramda'
import {useId} from 'react'
import {Ad} from 'react-ad-manager'

export const isAdTeaser = allPass([
  ({teaser}: BuilderTeaserProps) => teaser?.__typename === 'CustomTeaser',
  ({teaser}: BuilderTeaserProps) => teaser?.preTitle === 'ad'
])

export const AdTeaser = ({alignment, teaser}: BuilderTeaserProps) => {
  const id = useId()

  return (
    <TeaserWrapper {...alignment}>
      <Ad
        adUnit={`/22170513353/${teaser?.title}`}
        name={id}
        size={[
          [300, 250],
          [269, 430],
          [300, 424],
          [400, 240],
          [433, 400]
        ]}
      />
    </TeaserWrapper>
  )
}
