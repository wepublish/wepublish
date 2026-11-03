import { useMutation } from '@apollo/client/react';
import { PaywallDocument, UpdatePaywallDocument } from '@wepublish/editor/api';
import { FormPage, useEditForm, useQueryLoader } from '@wepublish/form/editor';
import { CanUpdatePaywall } from '@wepublish/permissions';
import { PermissionControl } from '@wepublish/ui/editor';
import { useParams } from 'react-router-dom';

import { fromPaywall, toUpdatePaywallVariables } from './paywall.schema';
import { paywallView } from './paywall.view';

const updatePermissions = [CanUpdatePaywall.id];

type PaywallEditFormProps = {
  id: string;
};

export const PaywallEditForm = ({ id }: PaywallEditFormProps) => {
  const load = useQueryLoader(PaywallDocument, { id }, data =>
    fromPaywall(data.paywall)
  );
  const [updatePaywall] = useMutation(UpdatePaywallDocument);
  const paywall = useEditForm(paywallView, {
    title: 'paywall.form.editTitle',
    load,
    save: values =>
      updatePaywall({ variables: toUpdatePaywallVariables(id, values) }),
  });

  return <FormPage controller={paywall} />;
};

export const PaywallEditView = () => {
  const { id = '' } = useParams();

  return (
    <PermissionControl
      qualifyingPermissions={updatePermissions}
      showRejectionMessage
    >
      <PaywallEditForm
        key={id}
        id={id}
      />
    </PermissionControl>
  );
};
