import { useApolloClient, useMutation } from '@apollo/client/react';
import {
  AccountCreationMailDocument,
  CreateUserDocument,
} from '@wepublish/editor/api';
import { cancelSave, FormPage, useCreateForm } from '@wepublish/form/editor';
import {
  CanCreateUser,
  CanDeleteUser,
  CanGetUser,
  CanGetUsers,
  CanResetUserPassword,
} from '@wepublish/permissions';
import {
  PermissionControl,
  skipMailFor,
  useActionMailQuestion,
  useAuthorisation,
} from '@wepublish/ui/editor';

import { toCreateUserVariables } from './user.schema';
import { createUserView } from './user.view';
import { useUserRoleField } from './userRoleOptions';

export const userPermissions = [
  CanGetUser.id,
  CanCreateUser.id,
  CanDeleteUser.id,
  CanGetUsers.id,
  CanResetUserPassword.id,
];

export function UserCreateForm() {
  const client = useApolloClient();
  const { askMail, actionMailDialog } = useActionMailQuestion();
  const canResetPassword = useAuthorisation(CanResetUserPassword.id) === true;
  const roleIds = useUserRoleField();
  const [createUser] = useMutation(CreateUserDocument);
  const user = useCreateForm(createUserView, {
    title: 'userCreateOrEditView.createNewUser',
    fields: { roleIds, password: { disabled: !canResetPassword } },
    save: async values => {
      const { data: mailData } = await client.query({
        query: AccountCreationMailDocument,
        fetchPolicy: 'network-only',
      });
      const mail = mailData?.accountCreationMail;

      if (!mail) {
        throw new Error('Could not look up the mail of this action');
      }

      const decision = await askMail({ ...mail, recipient: values.email });

      if (decision === 'cancel') {
        cancelSave();
      }

      const { data } = await createUser({
        variables: toCreateUserVariables(values, skipMailFor(decision)),
      });

      return data?.createUser.id;
    },
  });

  return (
    <>
      <FormPage controller={user} />
      {actionMailDialog}
    </>
  );
}

export function UserCreateView() {
  return (
    <PermissionControl
      qualifyingPermissions={userPermissions}
      showRejectionMessage
    >
      <UserCreateForm />
    </PermissionControl>
  );
}
