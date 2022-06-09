import React from 'react'
import {UserEditPanel} from '../../src/client/panel/userEditPanel'
import {UserDocument, CreateUserDocument, UserRoleListDocument} from '../../src/client/api'
import {mount} from 'enzyme'

import {updateWrapper} from '../utils'
import {act} from 'react-dom/test-utils'
import {MockedProvider as MockedProviderBase} from '@apollo/client/testing'

const MockedProvider = MockedProviderBase as any

const userRoleListDocumentQuery = {
  request: {
    query: UserRoleListDocument,
    variables: {
      first: 200
    }
  },
  result: () => {
    return {
      data: {
        userRoles: {
          nodes: [
            {
              __typename: 'UserRole',
              id: 'roleId1',
              name: 'Role 1',
              description: 'Description for role 1',
              systemRole: false,
              permissions: []
            },
            {
              __typename: 'UserRole',
              id: 'roleId2',
              name: 'Role 2',
              description: 'Description for role 2',
              systemRole: false,
              permissions: []
            }
          ],
          pageInfo: {
            hasNextPage: false,
            hasPreviousPage: false,
            startCursor: null,
            endCursor: null
          },
          totalCount: 2
        }
      }
    }
  }
}

const userDocumentQuery = {
  request: {
    query: UserDocument,
    variables: {
      id: 'fakeId3'
    }
  },
  result: () => ({
    data: {
      user: {
        __typename: 'User',
        id: 'fakeId3',
        firstName: 'Peter',
        name: 'Parker',
        preferredName: 'Peter Parker',
        email: 'peter@parker.com',
        address: null,
        active: false,
        roles: [
          {
            __typename: 'UserRole',
            id: 'roleId1',
            name: 'Role 1',
            description: 'Description for role 1',
            systemRole: false,
            permissions: []
          }
        ],
        properties: [],
        emailVerifiedAt: null,
        lastLogin: null,
        createdAt: null,
        modifiedAt: null
      }
    }
  })
}

describe('User Edit Panel', () => {
  test('should render', async () => {
    const mocks = [userRoleListDocumentQuery]
    const wrapper = mount(
      <MockedProvider mocks={mocks} addTypename={false}>
        <UserEditPanel />
      </MockedProvider>
    )
    await updateWrapper(wrapper, 100)

    const panel = wrapper.find('UserEditPanel')
    expect(panel).toMatchSnapshot()
  })

  test('should render with ID', async () => {
    const mocks = [userDocumentQuery, userRoleListDocumentQuery]

    const wrapper = mount(
      <MockedProvider mocks={mocks} addTypename={true}>
        <UserEditPanel id={'fakeId3'} />
      </MockedProvider>
    )
    await updateWrapper(wrapper, 100)

    const panel = wrapper.find('UserEditPanel')
    expect(panel).toMatchSnapshot()
  })

  test('should allow user role to be added', async () => {
    const mocks = [userRoleListDocumentQuery]

    const wrapper = mount(
      <MockedProvider mocks={mocks} addTypename={false}>
        <UserEditPanel />
      </MockedProvider>
    )
    await updateWrapper(wrapper, 100)

    wrapper.find('a[name="userList.panels.userRoles"]').simulate('click')
    wrapper.find('div[role="menuitem"]').last().simulate('click')

    const panel = wrapper.find('UserEditPanel')
    expect(panel).toMatchSnapshot()
  })

  test('should allow user role to be removed', async () => {
    const mocks = [userDocumentQuery, userRoleListDocumentQuery]

    const wrapper = mount(
      <MockedProvider mocks={mocks} addTypename={true}>
        <UserEditPanel id={'fakeId3'} />
      </MockedProvider>
    )
    await updateWrapper(wrapper, 100)

    wrapper.find('a[name="userList.panels.userRoles"]').simulate('click')
    wrapper.find('div.rs-checkbox-checked').simulate('click')

    const panel = wrapper.find('UserEditPanel')
    expect(panel).toMatchSnapshot()
  })

  test('should allow a new user to be created', async () => {
    const user = {
      name: 'Testing Müller',
      email: 'testing@mueller.com',
      active: true,
      properties: [],
      roleIDs: [],
      password: 'superSecret'
    }

    const mocks = [
      {
        request: {
          query: CreateUserDocument,
          variables: {
            input: {
              name: user.name,
              firstName: undefined,
              preferredName: undefined,
              email: user.email,
              active: user.active,
              properties: user.properties,
              roleIDs: user.roleIDs
            },
            password: user.password
          }
        },
        result: () => ({
          data: {
            user: {
              __typename: 'User',
              id: 'fakeId4',
              name: user.name,
              email: user.email,
              roles: user.roleIDs,
              active: user.active,
              properties: user.properties
            }
          }
        })
      },
      userRoleListDocumentQuery
    ]

    const wrapper = mount(
      <MockedProvider mocks={mocks} addTypename={false}>
        <UserEditPanel />
      </MockedProvider>
    )
    await updateWrapper(wrapper, 100)

    act(() => {
      wrapper
        .find('input[name="userList.panels.name"]')
        .simulate('change', {target: {value: user.name}})
      wrapper
        .find('input[name="userList.panels.email"]')
        .simulate('change', {target: {value: user.email}})
      wrapper
        .find('input[name="userList.panels.password"]')
        .simulate('change', {target: {value: user.password}})
    })

    wrapper.find('button[className="rs-btn rs-btn-primary"]').simulate('click')

    const panel = wrapper.find('UserEditPanel')
    expect(panel).toMatchSnapshot()
  })
})
