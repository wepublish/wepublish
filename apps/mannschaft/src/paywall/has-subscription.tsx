import {ApiV1, useUser} from '@wepublish/website'

export const useHasSubscription = () => {
  const {hasUser} = useUser()
  const {data} = ApiV1.useSubscriptionsQuery({
    skip: !hasUser
  })

  //@TODO: Filter for the correct subscription
  return !!data?.subscriptions.find(
    subscription =>
      subscription.paidUntil &&
      new Date() > new Date(subscription.startsAt) &&
      new Date(subscription.paidUntil) > new Date()
  )
}
