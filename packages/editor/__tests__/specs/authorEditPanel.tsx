import {MockedProvider as MockedProviderBase} from '@apollo/client/testing'
import {fireEvent, render} from '@testing-library/react'
import React from 'react'
import snapshotDiff from 'snapshot-diff'
import {AuthorDocument, CreateAuthorDocument} from '../../src/client/api'
import {createDefaultValue} from '../../src/client/blocks/richTextBlock/richTextBlock'
import {AuthorEditPanel} from '../../src/client/panel/authorEditPanel'
import {actWait} from '../utils'

const MockedProvider = MockedProviderBase as any

describe('Author Edit Panel', () => {
  test('should render', () => {
    const {asFragment} = render(
      <MockedProvider addTypename={false}>
        <AuthorEditPanel />
      </MockedProvider>
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
      <MockedProvider mocks={mocks} addTypename>
        <AuthorEditPanel id={'fakeId2'} />
      </MockedProvider>
    )
    await actWait()

    expect(asFragment()).toMatchSnapshot()
  })

  test('should fill the link field', async () => {
    const {asFragment, container} = render(
      <MockedProvider addTypename={false}>
        <AuthorEditPanel />
      </MockedProvider>
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
      <MockedProvider mocks={mocks} addTypename={false}>
        <AuthorEditPanel />
      </MockedProvider>
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
})
