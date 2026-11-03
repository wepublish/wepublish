import { useMutation } from '@apollo/client/react';
import { CreateDiscountCodeDocument } from '@wepublish/editor/api';
import { FormPage, useCreateForm } from '@wepublish/form/editor';
import { CanCreateDiscountCode } from '@wepublish/permissions';
import { PermissionControl } from '@wepublish/ui/editor';

import { toCreateDiscountCodeVariables } from './discountCode.schema';
import { discountCodeView } from './discountCode.view';

const CREATE_PERMISSIONS = [CanCreateDiscountCode.id];

export const DiscountCodeCreateForm = () => {
  const [createDiscountCode] = useMutation(CreateDiscountCodeDocument);
  const discountCode = useCreateForm(discountCodeView, {
    title: 'discountCode.form.createTitle',
    save: async values => {
      const { data } = await createDiscountCode({
        variables: toCreateDiscountCodeVariables(values),
      });

      return data?.createDiscountCode.id;
    },
  });

  return <FormPage controller={discountCode} />;
};

export const DiscountCodeCreateView = () => (
  <PermissionControl
    qualifyingPermissions={CREATE_PERMISSIONS}
    showRejectionMessage
  >
    <DiscountCodeCreateForm />
  </PermissionControl>
);
