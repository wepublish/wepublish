import {MockedProvider as MockedProviderBase} from '@apollo/client/testing'
import {fireEvent, render, screen, waitFor} from '@testing-library/react'
import {UserListDocument, UserRoleListDocument} from '@wepublish/editor/api'
import {AuthContext} from '@wepublish/ui/editor'
import {BrowserRouter} from 'react-router-dom'

import {UserList} from '../../src/app/routes/userList'
import {actWait, sessionWithPermissions} from '../utils'

const MockedProvider = MockedProviderBase as any

const userRoleDocumentQuery = {
  request: {
    query: UserRoleListDocument,
    variables: {take: 200}
  },
  result: () => {
    return {
      data: {
        userRoles: {
          nodes: [
            {
              __typename: 'UserRole',
              id: 'editor',
              name: 'editor',
              description: 'Description for role 1',
              systemRole: false,
              permissions: [
                {
                  __typename: 'Permission',
                  id: 'permissionId1',
                  description: 'permission description 1',
                  checked: true,
                  deprecated: false
                },
                {
                  __typename: 'Permission',
                  id: 'permissionId2',
                  description: 'permission description 2',
                  checked: false,
                  deprecated: false
                },
                {
                  __typename: 'Permission',
                  id: 'permissionId3',
                  description: 'permission description 3',
                  checked: false,
                  deprecated: false
                },
                {
                  __typename: 'Permission',
                  id: 'permissionId4',
                  description: 'permission description 4',
                  checked: true,
                  deprecated: false
                }
              ]
            }
          ],
          pageInfo: {
            hasNextPage: false,
            hasPreviousPage: false,
            startCursor: null,
            endCursor: null
          },
          totalCount: 1
        }
      }
    }
  }
}

let queryCalled = false
const userListDocumentQuery = {
  request: {
    query: UserListDocument,
    variables: {
      filter: {},
      take: 10,
      skip: 0,
      sort: 'CREATED_AT',
      order: 'DESCENDING'
    },
    fetchPolicy: 'network-only'
  },
  result: jest.fn(() => {
    if (queryCalled) {
      return {
        data: {
          users: {
            __typename: 'UserConnection',
            nodes: [
              {
                __typename: 'User',
                active: true,
                createdAt: '2023-02-09T11:43:15.846Z',
                modifiedAt: '2023-02-17T16:00:49.988Z',
                id: 'some-id',
                name: 'test-name',
                firstName: 'test-name',
                preferredName: 'test-name',
                email: 'some-email',
                emailVerifiedAt: null,
                properties: [],
                lastLogin: null,
                flair: 'foobar',
                address: {
                  city: null,
                  company: null,
                  country: null,
                  streetAddress: null,
                  streetAddress2: null,
                  zipCode: null,
                  __typename: 'UserAddress'
                },
                userImage: null,
                roles: [
                  {
                    __typename: 'UserRole',
                    id: 'editor',
                    name: 'Editor',
                    description: '',
                    permissions: [],
                    systemRole: true
                  }
                ],
                subscriptions: [{}]
              },
              {
                __typename: 'User',
                active: true,
                createdAt: '2023-02-09T11:43:15.846Z',
                modifiedAt: '2023-02-17T16:00:49.988Z',
                id: 'some-id-2',
                name: 'test-name-2',
                firstName: 'test-name-2',
                preferredName: 'test-name',
                email: 'some-email-2',
                emailVerifiedAt: null,
                properties: [],
                lastLogin: null,
                flair: null,
                address: {
                  city: null,
                  company: null,
                  country: null,
                  streetAddress: null,
                  streetAddress2: null,
                  zipCode: null,
                  __typename: 'UserAddress'
                },
                userImage: null,
                roles: [
                  {
                    __typename: 'UserRole',
                    id: 'editor',
                    name: 'Editor',
                    description: '',
                    permissions: [],
                    systemRole: true
                  },
                  {
                    __typename: 'UserRole',
                    id: 'admin',
                    name: 'Admin',
                    description: '',
                    permissions: [],
                    systemRole: true
                  }
                ],
                subscriptions: [{}]
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
    queryCalled = true
    return {
      data: {
        users: {
          __typename: 'UserConnection',
          nodes: [
            {
              __typename: 'User',
              active: true,
              createdAt: '2023-02-09T11:43:15.846Z',
              modifiedAt: '2023-02-17T16:00:49.988Z',
              id: 'some-id',
              name: 'test-name',
              firstName: 'test-name',
              preferredName: 'test-name',
              email: 'some-email',
              emailVerifiedAt: null,
              properties: [],
              lastLogin: null,
              flair: 'foobar',
              address: {
                city: null,
                company: null,
                country: null,
                streetAddress: null,
                streetAddress2: null,
                zipCode: null,
                __typename: 'UserAddress'
              },
              userImage: null,
              roles: [
                {
                  __typename: 'UserRole',
                  id: 'editor',
                  name: 'Editor',
                  description: '',
                  permissions: [],
                  systemRole: true
                }
              ],
              subscriptions: [{}]
            },
            {
              __typename: 'User',
              active: true,
              createdAt: '2023-02-09T11:43:15.846Z',
              modifiedAt: '2023-02-17T16:00:49.988Z',
              id: 'some-id-2',
              name: 'test-name-2',
              firstName: 'test-name-2',
              preferredName: 'test-name',
              email: 'some-email-2',
              emailVerifiedAt: null,
              properties: [],
              lastLogin: null,
              flair: null,
              address: {
                city: null,
                company: null,
                country: null,
                streetAddress: null,
                streetAddress2: null,
                zipCode: null,
                __typename: 'UserAddress'
              },
              userImage: null,
              roles: [
                {
                  __typename: 'UserRole',
                  id: 'editor',
                  name: 'Editor',
                  description: '',
                  permissions: [],
                  systemRole: true
                },
                {
                  __typename: 'UserRole',
                  id: 'admin',
                  name: 'Admin',
                  description: '',
                  permissions: [],
                  systemRole: true
                }
              ],
              subscriptions: [{}]
            },
            {
              __typename: 'User',
              active: true,
              createdAt: '2023-02-09T11:43:15.846Z',
              modifiedAt: '2023-02-17T16:00:49.988Z',
              id: 'some-id-2',
              name: 'test-name-2',
              firstName: 'test-name-2',
              preferredName: 'test-name',
              email: 'some-email-2',
              emailVerifiedAt: null,
              properties: [],
              lastLogin: null,
              flair: 'foobar',
              address: {
                city: null,
                company: null,
                country: null,
                streetAddress: null,
                streetAddress2: null,
                zipCode: null,
                __typename: 'UserAddress'
              },
              userImage: null,
              roles: [
                {
                  __typename: 'UserRole',
                  id: 'editor',
                  name: 'Editor',
                  description: '',
                  permissions: [],
                  systemRole: true
                },
                {
                  __typename: 'UserRole',
                  id: 'admin',
                  name: 'Admin',
                  description: '',
                  permissions: [],
                  systemRole: true
                }
              ],
              subscriptions: [{}]
            }
          ],
          pageInfo: {
            hasNextPage: false,
            hasPreviousPage: false,
            startCursor: null,
            endCursor: null
          },
          totalCount: 3
        }
      }
    }
  })
}

const userListDocumentQueryError = {
  request: {
    query: UserListDocument,
    variables: {
      filter: {},
      take: 10,
      skip: 0,
      sort: 'CREATED_AT',
      order: 'DESCENDING'
    },
    fetchPolicy: 'network-only'
  },
  error: new Error('An error occurred')
}

describe('User list view', () => {
  test('should render successfully', async () => {
    const mocks = [userListDocumentQuery]
    const {asFragment} = render(
      <AuthContext.Provider value={sessionWithPermissions}>
        <MockedProvider mocks={mocks}>
          <BrowserRouter>
            <UserList />
          </BrowserRouter>
        </MockedProvider>
      </AuthContext.Provider>
    )
    await actWait()

    expect(asFragment()).toMatchSnapshot()
  })

  test('refetches data after changing filter', async () => {
    const mocks = [userListDocumentQuery, userRoleDocumentQuery]
    render(
      <AuthContext.Provider value={sessionWithPermissions}>
        <MockedProvider mocks={mocks} addTypename={false}>
          <BrowserRouter>
            <UserList />
          </BrowserRouter>
        </MockedProvider>
      </AuthContext.Provider>
    )
    await actWait()

    expect(screen.getAllByRole('row')).toHaveLength(3)
    fireEvent.click(await screen.findByTestId('userRole-combobox'))
    const checkboxLabels = await screen.findAllByRole('checkbox')
    await fireEvent.click(checkboxLabels[0])

    await waitFor(() => expect(userListDocumentQuery.result).toBeCalledTimes(2))
  })

  test('does not render list when encounter apollo error', async () => {
    const mocks = [userListDocumentQueryError, userRoleDocumentQuery]
    const {asFragment, getByText} = render(
      <AuthContext.Provider value={sessionWithPermissions}>
        <MockedProvider mocks={mocks} addTypename={false}>
          <BrowserRouter>
            <UserList />
          </BrowserRouter>
        </MockedProvider>
      </AuthContext.Provider>
    )
    await actWait()

    expect(asFragment()).toMatchSnapshot()
    expect(getByText('An error occurred')).not.toBeFalsy()
  })
})
