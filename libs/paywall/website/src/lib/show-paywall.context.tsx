import {FullPaywallFragment} from '@wepublish/website/api'
import {createContext, useContext, useMemo} from 'react'
import {useActiveSubscriptions} from '@wepublish/membership/website'

export const ShowPaywallContext = createContext<{showPaywall?: boolean; hideContent?: boolean}>({})

export const useShowPaywall = (
  paywall?: FullPaywallFragment | null
): {showPaywall: boolean; hideContent: boolean} => {
  const subscriptions = useActiveSubscriptions()
  const ctx = useContext(ShowPaywallContext)

  return useMemo(() => {
    const memberPlanIds = subscriptions?.map(s => s.memberPlan.id) ?? []

    if (!paywall || !paywall.active) {
      return {hideContent: false, showPaywall: false}
    }

    if (paywall.anyMemberPlan && subscriptions?.length) {
      return {showPaywall: true, hideContent: false}
    }

    return {
      showPaywall:
        ctx.showPaywall ??
        !paywall?.memberPlans.some(memberPlan => memberPlanIds.includes(memberPlan.id)),
      hideContent:
        ctx.hideContent ??
        !paywall?.memberPlans.some(memberPlan => memberPlanIds.includes(memberPlan.id))
    }
  }, [ctx.showPaywall, ctx.hideContent, paywall, subscriptions])
}
