import {FullPaywallFragment} from '@wepublish/website/api'
import {createContext, useContext, useMemo} from 'react'
import {useActiveSubscriptions} from '@wepublish/membership/website'

export const ShowPaywallContext = createContext<{showPaywall?: boolean}>({})

export const useShowPaywall = (
  paywall?: FullPaywallFragment | null
): paywall is FullPaywallFragment => {
  const subscriptions = useActiveSubscriptions()
  const ctx = useContext(ShowPaywallContext)

  return useMemo(() => {
    const memberPlanIds = subscriptions?.map(s => s.memberPlan.id) ?? []

    if (!paywall || !paywall.active) {
      return false
    }

    if (ctx.showPaywall != null) {
      return ctx.showPaywall
    }

    if (paywall.anyMemberPlan && subscriptions?.length) {
      return true
    }

    return !paywall?.memberPlans.some(memberPlan => memberPlanIds.includes(memberPlan.id))
  }, [ctx.showPaywall, paywall, subscriptions])
}
