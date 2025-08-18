import {useUser} from '@wepublish/authentication/website'
import {FullSubscriptionFragment, useSubscriptionsQuery} from '@wepublish/website/api'
import {addDays} from 'date-fns'
import {useMemo} from 'react'

const isWithinGracePeriode = (subscription: FullSubscriptionFragment, today: Date): boolean => {
  const {gracePeriod} = subscription.paymentMethod
  if (!gracePeriod) {
    return false
  }

  const startDate = new Date(subscription?.paidUntil || subscription.startsAt)
  const withinGracePeriod = addDays(startDate, gracePeriod)
  return today <= withinGracePeriod
}

const isPaidAndActive = (subscription: FullSubscriptionFragment, today: Date): boolean => {
  return !!(
    subscription.paidUntil &&
    // @todo: startsAt is supposedly not necessary. Thus, it could go into a single check with grace period.
    today > new Date(subscription.startsAt) &&
    new Date(subscription.paidUntil) > today
  )
}

export const useActiveSubscriptions = () => {
  const {hasUser} = useUser()
  const {data} = useSubscriptionsQuery({
    fetchPolicy: 'cache-first',
    skip: !hasUser
  })

  const subscriptions = useMemo(() => {
    const today = new Date()
    return data?.subscriptions.filter(
      subscription =>
        // @todo: could possibly be combined into a single check if 'startAt' is not needed (which is supposedly the case).
        isPaidAndActive(subscription, today) || isWithinGracePeriode(subscription, today)
    )
  }, [data?.subscriptions])

  if (!hasUser) {
    return subscriptions
  }

  if (!data?.subscriptions) {
    // return null so we know if it hasn't been loaded yet
    return null
  }

  return subscriptions
}

export const useHasActiveSubscription = () => {
  const runningSubscriptions = useActiveSubscriptions()

  return !!runningSubscriptions?.length
}
