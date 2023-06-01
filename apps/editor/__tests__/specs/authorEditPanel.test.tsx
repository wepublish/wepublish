import {MockedProvider as MockedProviderBase} from '@apollo/client/testing'
import {fireEvent, render} from '@testing-library/react'
import {AuthorDocument, CreateAuthorDocument} from '@wepublish/editor/api'
import {AuthContext, createDefaultValue} from '@wepublish/ui/editor'
import React from 'react'
import snapshotDiff from 'snapshot-diff'

import {AuthorEditPanel} from '../../src/app/panel/authorEditPanel'
import {actWait, sessionWithPermissions} from '../utils'

const MockedProvider = MockedProviderBase as any

describe('Author Edit Panel', () => {
  test('should render', () => {
    const {asFragment} = render(
      <AuthContext.Provider value={sessionWithPermissions}>
        <MockedProvider addTypename={false}>
          <AuthorEditPanel />
        </MockedProvider>
      </AuthContext.Provider>
    )
    expect(asFragment()).toMatchSnapshot()
  })

  test('should render with ID', async () => {
    const mocks = [
      {
        request: {
          query: AuthorDocument,
          variables: {
            id: 'fakeId2'
          }
        },
        result: () => ({
          data: {
            author: {
              __typename: 'Author',
              id: 'fakeId2',
              name: 'Douglas Cole',
              slug: '',
              links: null,
              bio: '',
              createdAt: '',
              jobTitle: '',
              image: null
            }
          }
        })
      }
    ]

    const {asFragment} = render(
      <AuthContext.Provider value={sessionWithPermissions}>
        <MockedProvider mocks={mocks} addTypename>
          <AuthorEditPanel id={'fakeId2'} />
        </MockedProvider>
      </AuthContext.Provider>
    )
    await actWait()

    expect(asFragment()).toMatchSnapshot()
  })

  test('should fill the link field', async () => {
    const {asFragment, container} = render(
      <AuthContext.Provider value={sessionWithPermissions}>
        <MockedProvider addTypename={false}>
          <AuthorEditPanel />
        </MockedProvider>
      </AuthContext.Provider>
    )
    await actWait()
    const initialRender = asFragment()

    fireEvent.change(container.querySelector('input[placeholder="authors.panels.title"]')!, {
      target: {value: 'abcd'}
    })

    expect(snapshotDiff(initialRender, asFragment())).toMatchSnapshot()
  })

  test('should allow a new author to be created ', async () => {
    const author = {
      name: 'Clark Kent',
      id: 'fakeId3',
      slug: 'clark-kent',
      url: 'url',
      links: [],
      bio: createDefaultValue(),
      imageID: undefined
    }
    const mocks = [
      {
        request: {
          query: CreateAuthorDocument,
          variables: {
            input: {
              name: author.name,
              slug: author.slug,
              links: author.links,
              bio: author.bio,
              imageID: author.imageID
            }
          }
        },
        result: () => ({
          data: {
            author: {
              __typename: 'Author',
              id: author.id,
              name: author.name,
              slug: author.slug,
              url: author.url,
              links: author.links,
              bio: author.bio
            }
          }
        })
      }
    ]
    const {asFragment, getByTestId, getByLabelText} = render(
      <AuthContext.Provider value={sessionWithPermissions}>
        <MockedProvider mocks={mocks} addTypename={false}>
          <AuthorEditPanel />
        </MockedProvider>
      </AuthContext.Provider>
    )
    await actWait()
    const initialRender = asFragment()

    const nameInput = getByLabelText('authors.panels.name*')
    const saveButton = getByTestId('saveButton')

    fireEvent.change(nameInput, {
      target: {value: author.name}
    })
    fireEvent.click(saveButton)

    expect(snapshotDiff(initialRender, asFragment())).toMatchSnapshot()
  })

  const sessionWithoutPermission = {
    session: {
      email: 'user@abc.ch',
      sessionToken: 'abcdefg',
      sessionRoles: [
        {
          id: 'user',
          description: 'User',
          name: 'user',
          systemRole: true,
          permissions: []
        }
      ]
    }
  }

  test('will not render without correct permission', () => {
    const {asFragment} = render(
      <AuthContext.Provider value={sessionWithoutPermission}>
        <MockedProvider addTypename={false}>
          <AuthorEditPanel />
        </MockedProvider>
      </AuthContext.Provider>
    )
    expect(asFragment()).toMatchSnapshot()
  })
})
