import { useMutation } from '@apollo/client/react';
import {
  DiscountCodeDocument,
  UpdateDiscountCodeDocument,
} from '@wepublish/editor/api';
import { FormPage, useEditForm, useQueryLoader } from '@wepublish/form/editor';
import { CanUpdateDiscountCode } from '@wepublish/permissions';
import { PermissionControl } from '@wepublish/ui/editor';
import { useParams } from 'react-router-dom';

import {
  discountCodeTitleParams,
  fromDiscountCode,
  toUpdateDiscountCodeVariables,
} from './discountCode.schema';
import { discountCodeView } from './discountCode.view';

const UPDATE_PERMISSIONS = [CanUpdateDiscountCode.id];

type DiscountCodeEditFormProps = {
  id: string;
};

export const DiscountCodeEditForm = ({ id }: DiscountCodeEditFormProps) => {
  const load = useQueryLoader(DiscountCodeDocument, { id }, data =>
    fromDiscountCode(data.discountCode)
  );
  const [updateDiscountCode] = useMutation(UpdateDiscountCodeDocument);
  const discountCode = useEditForm(discountCodeView, {
    title: 'discountCode.form.editTitle',
    titleParams: discountCodeTitleParams,
    load,
    save: values =>
      updateDiscountCode({
        variables: toUpdateDiscountCodeVariables(id, values),
      }),
  });

  return <FormPage controller={discountCode} />;
};

export const DiscountCodeEditView = () => {
  const { id = '' } = useParams();

  return (
    <PermissionControl
      qualifyingPermissions={UPDATE_PERMISSIONS}
      showRejectionMessage
    >
      <DiscountCodeEditForm
        key={id}
        id={id}
      />
    </PermissionControl>
  );
};
