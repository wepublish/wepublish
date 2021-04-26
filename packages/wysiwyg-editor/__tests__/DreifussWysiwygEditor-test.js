import React from 'react'
import renderer from 'react-test-renderer'
import DreifussWysiwygEditor from '../src/DreifussWysiwygEditor'

test('Props is displayed', () => {
  const component = renderer.create(<DreifussWysiwygEditor title="Hello" />)
  const instance = component.root
  expect(instance.findByProps({className: 'title'}).children).toEqual(['Hello'])
})
