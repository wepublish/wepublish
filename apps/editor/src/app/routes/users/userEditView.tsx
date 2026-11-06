import { useMutation } from '@apollo/client/react';
import {
  type FullUserFragment,
  UpdateUserDocument,
  UserDocument,
} from '@wepublish/editor/api';
import { FormPage, useEditForm, useQueryLoader } from '@wepublish/form/editor';
import { PermissionControl } from '@wepublish/ui/editor';
import { useState } from 'react';
import { useParams } from 'react-router-dom';

import {
  fromUser,
  toUpdateUserVariables,
  userTitleParams,
} from './user.schema';
import { editUserView } from './user.view';
import { userPermissions } from './userCreateView';
import { useUserRoleField } from './userRoleOptions';

type UserEditFormProps = {
  userId: string;
};

export function UserEditForm({ userId }: UserEditFormProps) {
  const [loaded, setLoaded] = useState<FullUserFragment | null>(null);
  const roleIds = useUserRoleField(loaded?.roles);
  const loadUser = useQueryLoader(
    UserDocument,
    { id: userId },
    data => data.user
  );
  const [updateUser] = useMutation(UpdateUserDocument);
  const user = useEditForm(editUserView, {
    title: 'userCreateOrEditView.editTitle',
    titleParams: userTitleParams,
    fields: { roleIds },
    load: async () => {
      const record = await loadUser();

      if (!record) {
        throw new Error('');
      }

      setLoaded(record);

      return fromUser(record);
    },
    save: values =>
      updateUser({
        variables: toUpdateUserVariables(
          userId,
          loaded?.emailVerifiedAt ?? null,
          values
        ),
      }),
  });

  return <FormPage controller={user} />;
}

export function UserEditView() {
  const { id = '' } = useParams();

  return (
    <PermissionControl
      qualifyingPermissions={userPermissions}
      showRejectionMessage
    >
      <UserEditForm
        key={id}
        userId={id}
      />
    </PermissionControl>
  );
}
