import { useMutation } from '@apollo/client/react';
import { CreateMemberPlanDocument } from '@wepublish/editor/api';
import { FormPage, useCreateForm } from '@wepublish/form/editor';
import { PermissionControl } from '@wepublish/ui/editor';

import { useMemberPlanFields } from './memberplan-fields';
import { memberPlanPermissions } from './memberplan-permissions';
import {
  createMemberPlanDefaults,
  toMemberPlanVariables,
} from './memberplan.schema';
import { memberPlanView } from './memberplan.view';

export const MemberPlanCreateForm = () => {
  const fields = useMemberPlanFields({ deriveSlug: true });
  const [createMemberPlan] = useMutation(CreateMemberPlanDocument);
  const memberPlan = useCreateForm(memberPlanView, {
    title: 'memberPlanEdit.createMemberPlanHeader',
    defaultValues: createMemberPlanDefaults,
    fields,
    save: async values => {
      const { data } = await createMemberPlan({
        variables: toMemberPlanVariables(values),
      });

      return data?.createMemberPlan.id;
    },
  });

  return <FormPage controller={memberPlan} />;
};

export const MemberPlanCreateView = () => (
  <PermissionControl
    qualifyingPermissions={memberPlanPermissions}
    showRejectionMessage
  >
    <MemberPlanCreateForm />
  </PermissionControl>
);
