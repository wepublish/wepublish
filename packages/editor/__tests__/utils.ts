// https://github.com/wesbos/waait/blob/master/index.js
import {act} from '@testing-library/react'

export function wait(amount = 0) {
  return new Promise(resolve => setTimeout(resolve, amount))
}

// Use this in your test after mounting if you need just need to let the query finish
export async function actWait(amount = 0) {
  await act(async () => {
    await wait(amount)
  })
}

export interface Named {
  name: string
}

export function pTest<T extends Named>(name: string, cases: T[], test: (testCase: T) => any) {
  describe(name, () => cases.forEach((t: T) => it(t.name, () => test(t))))
}

const CanGetAuthor = {
  id: 'CAN_GET_AUTHOR',
  description: 'Allows to get author',
  deprecated: false
}

const CanGetPeers = {
  id: 'CAN_GET_PEERS',
  description: 'Allows to get all peers',
  deprecated: false
}

const CanCreateToken = {
  id: 'CAN_CREATE_TOKEN',
  description: 'Allows to create tokens',
  deprecated: false
}

const CanGetUserRole = {
  id: 'CAN_GET_USER_ROLE',
  description: 'Allows to get an user role',
  deprecated: false
}

export const AllPermissions = [CanGetAuthor, CanGetPeers, CanCreateToken, CanGetUserRole]

const adminRole = {
  id: 'admin',
  description: 'Admin',
  name: 'admin',
  systemRole: true,
  permissions: AllPermissions
}

export const sessionWithPermissions = {
  session: {
    email: 'dev@abc.ch',
    sessionToken: 'abcdefg',
    roles: [adminRole]
  }
}
