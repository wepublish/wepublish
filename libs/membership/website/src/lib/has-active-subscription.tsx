import {useUser} from '@wepublish/authentication/website'
import {useSubscriptionsQuery} from '@wepublish/website/api'
import {useMemo} from 'react'

export const useHasActiveSubscription = () => {
  const {hasUser} = useUser()
  const {data} = useSubscriptionsQuery({
    fetchPolicy: 'cache-first',
    skip: !hasUser
  })

  return useMemo(
    () =>
      !!data?.subscriptions.find(
        subscription =>
          subscription.paidUntil &&
          new Date() > new Date(subscription.startsAt) &&
          new Date(subscription.paidUntil) > new Date()
      ),
    [data?.subscriptions]
  )
}
