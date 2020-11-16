import React from 'react'
import {MockedProvider as MockedProviderBase} from '@apollo/client/testing'
import {AuthorEditPanel} from '../../src/client/panel/authorEditPanel'
import {CreateAuthorDocument, AuthorDocument} from '../../src/client/api'
import {mount} from 'enzyme'

import {act} from 'react-dom/test-utils'
import {updateWrapper} from '../utils'
import {createDefaultValue} from '../../src/client/blocks/richTextBlock'

const MockedProvider = MockedProviderBase as any

describe('Author Edit Panel', () => {
  test('should render', () => {
    const wrapper = mount(
      <MockedProvider addTypename={false}>
        <AuthorEditPanel />
      </MockedProvider>
    )
    const panel = wrapper.find('AuthorEditPanel')
    expect(panel).toMatchSnapshot()
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
              name: 'Douglas Cole'
            }
          }
        })
      }
    ]

    const wrapper = mount(
      <MockedProvider mocks={mocks} addTypename={true}>
        <AuthorEditPanel id={'fakeId2'} />
      </MockedProvider>
    )

    await updateWrapper(wrapper, 100)
    const panel = wrapper.find('AuthorEditPanel')
    expect(panel).toMatchSnapshot()
  })

  test('should expand links fields when Add Block button is clicked', async () => {
    const wrapper = mount(
      <MockedProvider addTypename={false}>
        <AuthorEditPanel />
      </MockedProvider>
    )
    await updateWrapper(wrapper, 100)

    const button = wrapper.find('ListInput IconButton[classPrefix="rs-btn-icon"]')
    button.simulate('click')

    const inputField = wrapper.find('input[placeholder="authors.panels.title"]')
    inputField.props().value = 'abcd'

    const panel = wrapper.find('AuthorEditPanel')
    expect(panel).toMatchSnapshot()
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
    const wrapper = mount(
      <MockedProvider mocks={mocks} addTypename={false}>
        <AuthorEditPanel />
      </MockedProvider>
    )
    await updateWrapper(wrapper, 100)

    act(() => {
      wrapper
        .find('input[name="authors.panels.name"]')
        .simulate('change', {target: {value: author.name}})
    })

    wrapper.find('button[className="rs-btn rs-btn-primary"]').simulate('click')

    const panel = wrapper.find('AuthorEditPanel')
    expect(panel).toMatchSnapshot()
  })
})
