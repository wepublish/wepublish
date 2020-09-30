import React from 'react'
import {MockedProvider} from '@apollo/client/testing'
import {AuthorEditPanel} from '../../src/client/panel/authorEditPanel'
import {AuthorDocument} from '../../src/client/api'
import Enzyme, {mount} from 'enzyme'
import Adapter from 'enzyme-adapter-react-16'

// React 16 Enzyme adapter
Enzyme.configure({adapter: new Adapter()})

import {UIProvider} from '@karma.run/ui'
import {act} from 'react-dom/test-utils'
import * as fela from 'fela'
import wait from 'waait'

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
  let wrapper

  await act(async () => {
    wrapper = mount(
      <UIProvider styleRenderer={styleRenderer} rootElementID={'fskr'}>
        <MockedProvider mocks={mocks} addTypename={true}>
          <AuthorEditPanel id={'fakeId2'} />
        </MockedProvider>
      </UIProvider>
    )
    await wait(100)
    wrapper.update()
  })

  expect(wrapper).toMatchSnapshot()
})
