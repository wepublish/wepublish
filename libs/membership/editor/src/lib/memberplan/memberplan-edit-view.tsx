import { useMutation } from '@apollo/client/react';
import {
  MemberPlanDocument,
  UpdateMemberPlanDocument,
} from '@wepublish/editor/api';
import { FormPage, useEditForm, useQueryLoader } from '@wepublish/form/editor';
import { PermissionControl } from '@wepublish/ui/editor';
import { useParams } from 'react-router-dom';

import { useMemberPlanFields } from './memberplan-fields';
import { memberPlanPermissions } from './memberplan-permissions';
import {
  editTitleParams,
  fromMemberPlan,
  toMemberPlanVariables,
} from './memberplan.schema';
import { memberPlanView } from './memberplan.view';

type MemberPlanEditFormProps = {
  memberPlanId: string;
};

export const MemberPlanEditForm = ({
  memberPlanId,
}: MemberPlanEditFormProps) => {
  const fields = useMemberPlanFields();
  const load = useQueryLoader(
    MemberPlanDocument,
    { id: memberPlanId },
    data => fromMemberPlan(data.memberPlan)
  );
  const [updateMemberPlan] = useMutation(UpdateMemberPlanDocument);
  const memberPlan = useEditForm(memberPlanView, {
    title: 'memberPlanEdit.editTitle',
    titleParams: editTitleParams,
    load,
    fields,
    save: values =>
      updateMemberPlan({
        variables: { id: memberPlanId, ...toMemberPlanVariables(values) },
      }),
  });

  return <FormPage controller={memberPlan} />;
};

export const MemberPlanEditView = () => {
  const { id = '' } = useParams();

  return (
    <PermissionControl
      qualifyingPermissions={memberPlanPermissions}
      showRejectionMessage
    >
      <MemberPlanEditForm
        key={id}
        memberPlanId={id}
      />
    </PermissionControl>
  );
};
