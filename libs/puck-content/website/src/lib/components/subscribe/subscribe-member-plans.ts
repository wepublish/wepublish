import { useQuery } from '@apollo/client/react';
import {
  MemberPlanListDocument,
  MemberPlanListQuery,
} from '@wepublish/website/api';
import { useMemo } from 'react';

export const subscribeMemberPlansTake = 100;

type SubscribeMemberPlan = MemberPlanListQuery['memberPlans']['nodes'][number];

const noMemberPlans: SubscribeMemberPlan[] = [];

export const selectMemberPlans = <Plan extends { id: string }>(
  plans: Plan[],
  ids: string[]
): Plan[] =>
  ids.length ?
    ids.flatMap(id => plans.find(plan => plan.id === id) ?? [])
  : plans;

export const useSubscribeMemberPlans = (ids: string[]) => {
  const { data } = useQuery(MemberPlanListDocument, {
    variables: { take: subscribeMemberPlansTake, filter: { active: true } },
  });
  const plans = data?.memberPlans.nodes ?? noMemberPlans;

  return useMemo(() => selectMemberPlans(plans, ids), [plans, ids]);
};
