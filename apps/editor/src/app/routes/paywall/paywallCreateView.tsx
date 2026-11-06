import { useMutation } from '@apollo/client/react';
import { CreatePaywallDocument } from '@wepublish/editor/api';
import { FormPage, useCreateForm } from '@wepublish/form/editor';
import { CanCreatePaywall } from '@wepublish/permissions';
import { PermissionControl } from '@wepublish/ui/editor';

import { toCreatePaywallVariables } from './paywall.schema';
import { paywallView } from './paywall.view';

const createPermissions = [CanCreatePaywall.id];

export const PaywallCreateForm = () => {
  const [createPaywall] = useMutation(CreatePaywallDocument);
  const paywall = useCreateForm(paywallView, {
    title: 'paywall.form.createTitle',
    save: async values => {
      const { data } = await createPaywall({
        variables: toCreatePaywallVariables(values),
      });

      return data?.createPaywall.id;
    },
  });

  return <FormPage controller={paywall} />;
};

export const PaywallCreateView = () => (
  <PermissionControl
    qualifyingPermissions={createPermissions}
    showRejectionMessage
  >
    <PaywallCreateForm />
  </PermissionControl>
);
