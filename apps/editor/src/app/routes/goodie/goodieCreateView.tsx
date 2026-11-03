import { useMutation } from '@apollo/client/react';
import { CreateGoodieDocument } from '@wepublish/editor/api';
import { FormPage, useCreateForm } from '@wepublish/form/editor';
import { CanCreateGoodie } from '@wepublish/permissions';
import { PermissionControl } from '@wepublish/ui/editor';

import { toCreateGoodieVariables } from './goodie.schema';
import { goodieView } from './goodie.view';

const createPermissions = [CanCreateGoodie.id];

export const GoodieCreateForm = () => {
  const [createGoodie] = useMutation(CreateGoodieDocument);
  const goodie = useCreateForm(goodieView, {
    title: 'goodie.form.createTitle',
    save: async values => {
      const { data } = await createGoodie({
        variables: toCreateGoodieVariables(values),
      });

      return data?.createGoodie.id;
    },
  });

  return <FormPage controller={goodie} />;
};

export const GoodieCreateView = () => (
  <PermissionControl
    qualifyingPermissions={createPermissions}
    showRejectionMessage
  >
    <GoodieCreateForm />
  </PermissionControl>
);
