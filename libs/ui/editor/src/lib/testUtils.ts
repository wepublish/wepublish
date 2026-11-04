// https://github.com/wesbos/waait/blob/master/index.js
import { act } from '@testing-library/react';
import { FullUserRoleFragment } from '@wepublish/editor/api';
import { AllPermissions } from '@wepublish/permissions';

import { AuthContextState } from './authContext';

export function wait(amount = 0) {
  return new Promise(resolve => setTimeout(resolve, amount));
}

// Use this in your test after mounting if you need just need to let the query finish
export async function actWait(amount = 0) {
  await act(async () => {
    await wait(amount);
  });
}

const adminRole: FullUserRoleFragment = {
  __typename: 'UserRole',
  id: 'admin',
  description: 'Admin',
  name: 'admin',
  systemRole: true,
  permissions: AllPermissions.map(permission => ({
    __typename: 'Permission' as const,
    ...permission,
  })),
};

export const sessionWithPermissions: AuthContextState = {
  session: {
    email: 'dev@abc.ch',
    sessionToken: 'abcdefg',
    sessionRoles: [adminRole],
  },
};
