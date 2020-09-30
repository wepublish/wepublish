import React from 'react'
import renderer from 'react-test-renderer'
import {MockedProvider} from '@apollo/client/testing'
import {AuthorEditPanel} from '../../src/client/panel/authorEditPanel'
import {AuthorDocument} from '../../src/client/api'

import {UIProvider, createStyleRenderer} from '@karma.run/ui'

test('Author Edit Panel should render', () => {
  const mocks = [
    {
      request: {
        query: AuthorDocument,
        variables: {
          id: 'fakeid'
        }
      },
      result: {
        data: {
          dog: {
            name: 'douglas'
          }
        }
      }
    }
  ]

  const styleRenderer = createStyleRenderer()

  const component = renderer.create(
    <UIProvider styleRenderer={styleRenderer} rootElementID={'fskr'}>
      <MockedProvider mocks={mocks} addTypename={false}>
        <AuthorEditPanel />
      </MockedProvider>
    </UIProvider>
  )
  let tree = component.toJSON()
  expect(tree).toMatchSnapshot()
})
