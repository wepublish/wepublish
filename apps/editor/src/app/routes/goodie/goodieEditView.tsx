import { useMutation } from '@apollo/client/react';
import { GoodieDocument, UpdateGoodieDocument } from '@wepublish/editor/api';
import { FormPage, useEditForm, useQueryLoader } from '@wepublish/form/editor';
import { CanUpdateGoodie } from '@wepublish/permissions';
import { PermissionControl } from '@wepublish/ui/editor';
import { useParams } from 'react-router-dom';

import {
  fromGoodie,
  goodieTitleParams,
  toUpdateGoodieVariables,
} from './goodie.schema';
import { goodieView } from './goodie.view';

const updatePermissions = [CanUpdateGoodie.id];

type GoodieEditFormProps = {
  id: string;
};

export const GoodieEditForm = ({ id }: GoodieEditFormProps) => {
  const load = useQueryLoader(GoodieDocument, { id }, data =>
    fromGoodie(data.goodie)
  );
  const [updateGoodie] = useMutation(UpdateGoodieDocument);
  const goodie = useEditForm(goodieView, {
    title: 'goodie.form.editTitle',
    titleParams: goodieTitleParams,
    load,
    save: values =>
      updateGoodie({ variables: toUpdateGoodieVariables(id, values) }),
  });

  return <FormPage controller={goodie} />;
};

export const GoodieEditView = () => {
  const { id = '' } = useParams();

  return (
    <PermissionControl
      qualifyingPermissions={updatePermissions}
      showRejectionMessage
    >
      <GoodieEditForm
        key={id}
        id={id}
      />
    </PermissionControl>
  );
};
