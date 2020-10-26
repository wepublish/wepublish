import React from 'react'
import {MockedProvider} from '@apollo/client/testing'
import {AuthorEditPanel} from '../../src/client/panel/authorEditPanel'
import {AuthorDocument} from '../../src/client/api'
import Enzyme, {mount} from 'enzyme'
import Adapter from 'enzyme-adapter-react-16'
import {ListInput, TextInput} from '@karma.run/ui'

// React 16 Enzyme adapter
Enzyme.configure({adapter: new Adapter()})

import {UIProvider} from '@karma.run/ui'
//import {act} from 'react-dom/test-utils'
import {updateWrapper} from '../utils'
import * as fela from 'fela'
//import wait from 'waait'

const styleRenderer: fela.IRenderer = {
  renderRule: jest.fn(),
  renderKeyframe: jest.fn(),
  renderFont: jest.fn(),
  renderStatic: jest.fn(),
  renderToString: jest.fn(),
  subscribe: jest.fn(),
  clear: jest.fn()
}

test('Author Edit Panel should render', () => {
  const wrapper = mount(
    <UIProvider styleRenderer={styleRenderer} rootElementID={'fskr'}>
      <MockedProvider addTypename={false}>
        <AuthorEditPanel />
      </MockedProvider>
    </UIProvider>
  )
  expect(wrapper).toMatchSnapshot()
})

test('Author Edit Panel should render with id', async () => {
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
  expect(wrapper).toMatchSnapshot()
})

test('Clicking add block button should display two text fields ', async () => {
  const wrapper = mount(
    <UIProvider styleRenderer={styleRenderer} rootElementID={'fskr'}>
      <MockedProvider addTypename={false}>
        <AuthorEditPanel />
      </MockedProvider>
    </UIProvider>
  )
  await updateWrapper(wrapper, 100)

  const button = wrapper.find(ListInput).find('button')
  button.simulate('click')
  expect(wrapper).toMatchSnapshot()

  const inputField = wrapper.find('input[placeholder="authors.panels.title"]')
  inputField.props().value = 'abcd'

  expect(inputField).toMatchSnapshot()
})
