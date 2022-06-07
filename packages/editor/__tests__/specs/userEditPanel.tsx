import {MockedProvider as MockedProviderBase} from '@apollo/client/testing'
import {fireEvent, getByLabelText, render, screen} from '@testing-library/react'
import React from 'react'
import snapshotDiff from 'snapshot-diff'
import {CreateUserDocument, UserDocument, UserRoleListDocument} from '../../src/client/api'
import {UserEditPanel} from '../../src/client/panel/userEditPanel'
import {actWait} from '../utils'

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
    const {asFragment} = render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <UserEditPanel />
      </MockedProvider>
    )
    await actWait()

    expect(asFragment()).toMatchSnapshot()
  })

  test('should render with ID', async () => {
    const mocks = [userDocumentQuery, userRoleListDocumentQuery]

    const {asFragment} = render(
      <MockedProvider mocks={mocks} addTypename={true}>
        <UserEditPanel id={'fakeId3'} />
      </MockedProvider>
    )
    await actWait()

    expect(asFragment()).toMatchSnapshot()
  })

  test('should allow user role to be added', async () => {
    const mocks = [userRoleListDocumentQuery]

    const {asFragment} = render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <UserEditPanel />
      </MockedProvider>
    )
    await actWait()
    const initialRender = asFragment()

    fireEvent.click(await screen.findByRole('combobox'))
    const checkboxLabels = await screen.findAllByRole('checkbox')
    fireEvent.click(checkboxLabels[checkboxLabels.length - 1])

    expect(snapshotDiff(initialRender, asFragment())).toMatchSnapshot()
  })

  test('should allow user role to be removed', async () => {
    const mocks = [userDocumentQuery, userRoleListDocumentQuery]

    const {asFragment} = render(
      <MockedProvider mocks={mocks} addTypename={true}>
        <UserEditPanel id={'fakeId3'} />
      </MockedProvider>
    )
    await actWait()
    const initialRender = asFragment()

    fireEvent.click(await screen.findByRole('combobox'))
    fireEvent.click(
      await screen.findByRole('checkbox', {
        checked: true
      })
    )

    expect(snapshotDiff(initialRender, asFragment())).toMatchSnapshot()
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

    const {asFragment, container, getByLabelText} = render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <UserEditPanel />
      </MockedProvider>
    )
    await actWait()
    const initialRender = asFragment()

    const firstNameInput = getByLabelText('userList.panels.firstName*')
    const nameInput = getByLabelText('userList.panels.name*')
    const emailInput = getByLabelText('userList.panels.email*')
    const passwordInput = getByLabelText('userList.panels.password*')

    fireEvent.change(firstNameInput!, {
      target: {value: user.name}
    })

    fireEvent.change(nameInput!, {
      target: {value: user.name}
    })

    fireEvent.change(emailInput!, {
      target: {value: user.email}
    })

    fireEvent.change(passwordInput!, {
      target: {value: user.password}
    })

    fireEvent.click(container.querySelector('button.rs-btn.rs-btn-primary')!)

    expect(snapshotDiff(initialRender, asFragment())).toMatchSnapshot()
  })
})
