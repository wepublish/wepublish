import { useMutation } from '@apollo/client/react';
import {
  CreateUserRoleDocument,
  UpdateUserRoleDocument,
  UserRoleDocument,
  UserRoleListDocument,
} from '@wepublish/editor/api';
import {
  FormDrawer,
  FormDrawerPanel,
  useCreateForm,
  useEditForm,
  useQueryLoader,
  useRouteDrawer,
} from '@wepublish/form/editor';
import { CanCreateUserRole } from '@wepublish/permissions';
import { useState } from 'react';

import { SystemRoleContext } from './systemRoleNotice';
import { fromUserRole, toUserRoleVariables } from './userRole.schema';
import { userRoleRoutes, userRoleView } from './userRole.view';

const writePermissions = [CanCreateUserRole.id];

export function UserRoleCreateForm() {
  const [createUserRole] = useMutation(CreateUserRoleDocument, {
    refetchQueries: [UserRoleListDocument],
  });
  const userRole = useCreateForm(userRoleView, {
    title: 'userRoles.panels.createUserRole',
    writePermissions,
    save: async values => {
      const { data } = await createUserRole({
        variables: toUserRoleVariables(values),
      });

      return data?.createUserRole.id;
    },
  });

  return <FormDrawerPanel controller={userRole} />;
}

type UserRoleEditFormProps = {
  userRoleId: string;
};

export function UserRoleEditForm({ userRoleId }: UserRoleEditFormProps) {
  const [systemRole, setSystemRole] = useState(false);
  const loadUserRole = useQueryLoader(
    UserRoleDocument,
    { id: userRoleId },
    data => data.userRole
  );
  const [updateUserRole] = useMutation(UpdateUserRoleDocument);
  const userRole = useEditForm(userRoleView, {
    title: 'userRoles.panels.editUserRole',
    readOnly: systemRole,
    writePermissions,
    load: async () => {
      const loaded = await loadUserRole();

      setSystemRole(loaded.systemRole);

      return fromUserRole(loaded);
    },
    save: values =>
      updateUserRole({
        variables: { id: userRoleId, ...toUserRoleVariables(values) },
      }),
  });

  return (
    <SystemRoleContext.Provider value={systemRole}>
      <FormDrawerPanel controller={userRole} />
    </SystemRoleContext.Provider>
  );
}

export function UserRoleDrawer() {
  const drawer = useRouteDrawer(userRoleRoutes);

  return (
    <FormDrawer
      open={drawer.open}
      onClose={drawer.close}
      width="md"
    >
      {drawer.mode === 'edit' && drawer.id !== undefined ?
        <UserRoleEditForm
          key={drawer.id}
          userRoleId={drawer.id}
        />
      : <UserRoleCreateForm />}
    </FormDrawer>
  );
}
