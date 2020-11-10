import React from 'react'
import {MockedProvider as MockedProviderBase} from '@apollo/client/testing'
import {AuthorEditPanel} from '../../src/client/panel/authorEditPanel'
import {CreateAuthorDocument, AuthorDocument} from '../../src/client/api'
import {mount} from 'enzyme'

import {UIProvider} from '@karma.run/ui'
import {act} from 'react-dom/test-utils'
import {updateWrapper} from '../utils'
import * as fela from 'fela'
import {createDefaultValue} from '../../src/client/blocks/richTextBlock'

const MockedProvider = MockedProviderBase as any

const styleRenderer: fela.IRenderer = {
  renderRule: jest.fn(),
  renderKeyframe: jest.fn(),
  renderFont: jest.fn(),
  renderStatic: jest.fn(),
  renderToString: jest.fn(),
  subscribe: jest.fn(),
  clear: jest.fn()
}

describe('Author Edit Panel', () => {
  test('should render', () => {
    const wrapper = mount(
      <UIProvider styleRenderer={styleRenderer} rootElementID={'fskr'}>
        <MockedProvider addTypename={false}>
          <AuthorEditPanel />
        </MockedProvider>
      </UIProvider>
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
      <UIProvider styleRenderer={styleRenderer} rootElementID={'fskr'}>
        <MockedProvider mocks={mocks} addTypename={true}>
          <AuthorEditPanel id={'fakeId2'} />
        </MockedProvider>
      </UIProvider>
    )

    await updateWrapper(wrapper, 100)
    const panel = wrapper.find('AuthorEditPanel')
    expect(panel).toMatchSnapshot()
  })

  test('should expand links fields when Add Block button is clicked', async () => {
    const wrapper = mount(
      <UIProvider styleRenderer={styleRenderer} rootElementID={'fskr'}>
        <MockedProvider addTypename={false}>
          <AuthorEditPanel />
        </MockedProvider>
      </UIProvider>
    )
    await updateWrapper(wrapper, 100)

    const button = wrapper.find('button[title="Add Block"]')
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
      <UIProvider styleRenderer={styleRenderer} rootElementID={'fskr'}>
        <MockedProvider mocks={mocks} addTypename={false}>
          <AuthorEditPanel />
        </MockedProvider>
      </UIProvider>
    )
    await updateWrapper(wrapper, 100)

    act(() => {
      wrapper
        .find('input[placeholder="authors.panels.name"]')
        .simulate('change', {target: {value: author.name}})
    })

    await act(async () => {
      wrapper.find('ForwardRef(NavigationButton)[label="authors.panels.create"]').simulate('click')
    })

    const panel = wrapper.find('AuthorEditPanel')
    expect(panel).toMatchSnapshot()
  })
})
