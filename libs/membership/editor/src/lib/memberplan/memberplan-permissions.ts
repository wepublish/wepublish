import {
  CanCreateMemberPlan,
  CanDeleteMemberPlan,
  CanGetMemberPlan,
  CanGetMemberPlans,
} from '@wepublish/permissions';

export const memberPlanPermissions = [
  CanGetMemberPlans.id,
  CanGetMemberPlan.id,
  CanCreateMemberPlan.id,
  CanDeleteMemberPlan.id,
];
