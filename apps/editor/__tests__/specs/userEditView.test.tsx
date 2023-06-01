import {MockedProvider as MockedProviderBase} from '@apollo/client/testing'
import {fireEvent, render, screen} from '@testing-library/react'
import {CreateUserDocument, UserDocument, UserRoleListDocument} from '@wepublish/editor/api'
import {AuthContext} from '@wepublish/ui/editor'
import React from 'react'
import {BrowserRouter} from 'react-router-dom'
import snapshotDiff from 'snapshot-diff'

import {UserEditView} from '../../src/app/routes/userEditView'
import {actWait, sessionWithPermissions} from '../utils'

const MockedProvider = MockedProviderBase as any

const userRoleListDocumentQuery = {
  request: {
    query: UserRoleListDocument,
    variables: {
      take: 200
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
        flair: 'foobar',
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

describe('User edit view', () => {
  test('should render', async () => {
    const mocks = [userRoleListDocumentQuery]
    const {asFragment} = render(
      <AuthContext.Provider value={sessionWithPermissions}>
        <MockedProvider mocks={mocks} addTypename={false}>
          <BrowserRouter>
            <UserEditView />
          </BrowserRouter>
        </MockedProvider>
      </AuthContext.Provider>
    )
    await actWait()

    expect(asFragment()).toMatchSnapshot()
  })

  test('should render with ID', async () => {
    const mocks = [userDocumentQuery, userRoleListDocumentQuery]

    const {asFragment} = render(
      <AuthContext.Provider value={sessionWithPermissions}>
        <MockedProvider mocks={mocks} addTypename>
          <BrowserRouter>
            <UserEditView />
          </BrowserRouter>
        </MockedProvider>
      </AuthContext.Provider>
    )
    await actWait()

    expect(asFragment()).toMatchSnapshot()
  })

  test('should allow user role to be added', async () => {
    const mocks = [userRoleListDocumentQuery]

    const {asFragment} = render(
      <AuthContext.Provider value={sessionWithPermissions}>
        <MockedProvider mocks={mocks} addTypename={false}>
          <BrowserRouter>
            <UserEditView />
          </BrowserRouter>
        </MockedProvider>
      </AuthContext.Provider>
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
      <AuthContext.Provider value={sessionWithPermissions}>
        <MockedProvider mocks={mocks} addTypename>
          <BrowserRouter>
            <UserEditView />
          </BrowserRouter>
        </MockedProvider>
      </AuthContext.Provider>
    )
    await actWait()
    const initialRender = asFragment()

    fireEvent.click(await screen.findByRole('combobox'))
    const checkboxLabels = await screen.findAllByRole('checkbox', {checked: false})
    fireEvent.click(checkboxLabels[checkboxLabels.length - 1])

    expect(snapshotDiff(initialRender, asFragment())).toMatchSnapshot()
  })

  test('should allow user properties to be added', async () => {
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

    const {asFragment, getByTestId} = render(
      <AuthContext.Provider value={sessionWithPermissions}>
        <MockedProvider mocks={mocks} addTypename={false}>
          <BrowserRouter>
            <UserEditView />
          </BrowserRouter>
        </MockedProvider>
      </AuthContext.Provider>
    )
    await actWait()
    const initialRender = asFragment()

    const addPropertyButton = getByTestId('addProperty')
    const saveButton = getByTestId('saveButton')

    fireEvent.click(addPropertyButton)

    const keyInput = getByTestId('propertyKey')
    const valueInput = getByTestId('propertyValue')

    fireEvent.change(keyInput, {
      target: {value: 'some key'}
    })
    fireEvent.change(valueInput, {
      target: {value: 'some value'}
    })

    fireEvent.click(saveButton)

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

    const {asFragment, getByLabelText, getByTestId} = render(
      <AuthContext.Provider value={sessionWithPermissions}>
        <MockedProvider mocks={mocks} addTypename={false}>
          <BrowserRouter>
            <UserEditView />
          </BrowserRouter>
        </MockedProvider>
      </AuthContext.Provider>
    )
    await actWait()
    const initialRender = asFragment()

    const nameInput = getByLabelText('userCreateOrEditView.name*')
    const emailInput = getByLabelText('userCreateOrEditView.email*')
    const passwordInput = getByLabelText('userCreateOrEditView.password*')

    const saveButton = getByTestId('saveButton')

    fireEvent.change(nameInput, {
      target: {value: user.name}
    })

    fireEvent.change(emailInput, {
      target: {value: user.email}
    })

    fireEvent.change(passwordInput, {
      target: {value: user.password}
    })

    fireEvent.click(saveButton)

    expect(snapshotDiff(initialRender, asFragment())).toMatchSnapshot()
  })
})
