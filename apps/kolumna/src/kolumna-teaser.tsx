import {BuilderTeaserProps, SubscribeContainer, Teaser} from '@wepublish/website'
import {allPass, cond, T} from 'ramda'

export const isSubscribeTeaser = allPass([
  ({teaser}: BuilderTeaserProps) => teaser?.__typename === 'CustomTeaser',
  ({teaser}: BuilderTeaserProps) => teaser?.preTitle === 'subscribe'
])

export const KolumnaTeaser = cond([
  [
    isSubscribeTeaser,
    props => {
      const locationOrigin = typeof window !== 'undefined' ? location.origin : ''
      const thisLocation = typeof window !== 'undefined' ? location.href : ''

      return (
        <SubscribeContainer
          successURL={`${locationOrigin}/profile/subscription`}
          failureURL={thisLocation}
          filter={memberPlans => memberPlans.filter(mb => mb.tags?.includes('crowdfunding'))}
        />
      )
    }
  ],
  [T, props => <Teaser {...props} />]
])
