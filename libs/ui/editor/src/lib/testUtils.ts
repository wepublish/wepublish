// https://github.com/wesbos/waait/blob/master/index.js
import { act } from '@testing-library/react';
import { AllPermissions } from '@wepublish/permissions';

export function wait(amount = 0) {
  return new Promise(resolve => setTimeout(resolve, amount));
}

// Use this in your test after mounting if you need just need to let the query finish
export async function actWait(amount = 0) {
  await act(async () => {
    await wait(amount);
  });
}

const adminRole = {
  id: 'admin',
  description: 'Admin',
  name: 'admin',
  systemRole: true,
  permissions: AllPermissions,
};

export const sessionWithPermissions = {
  session: {
    email: 'dev@abc.ch',
    sessionToken: 'abcdefg',
    sessionRoles: [adminRole],
  },
};
