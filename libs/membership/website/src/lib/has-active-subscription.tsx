import {useUser} from '@wepublish/authentication/website'
import {FullSubscriptionFragment, useSubscriptionsQuery} from '@wepublish/website/api'
import {addDays} from 'date-fns'
import {anyPass} from 'ramda'
import {useMemo} from 'react'

const isWithinGracePeriod = ({
  paidUntil,
  startsAt,
  paymentMethod: {gracePeriod}
}: FullSubscriptionFragment): boolean => {
  if (!gracePeriod) {
    return false
  }

  const today = new Date()
  const startDate = new Date(paidUntil || startsAt)
  const gracePeriodEnd = addDays(startDate, gracePeriod)

  return gracePeriodEnd >= today
}

const isActiveSubscription = (subscription: FullSubscriptionFragment): boolean => {
  const today = new Date()

  return !!(
    subscription.paidUntil &&
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
    return data?.subscriptions.filter(anyPass([isActiveSubscription, isWithinGracePeriod]))
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
