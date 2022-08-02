import {toggleRequiredLabel} from '../../src/client/toggleRequiredLabel'

test('should add the required symbol by default', () => {
  const result = toggleRequiredLabel('foobar', true)

  expect(result).toMatchSnapshot()
})

test('should add the required symbol if required is set to true', () => {
  const result = toggleRequiredLabel('foobar', true)

  expect(result).toMatchSnapshot()
})

test('should not add the required symbol if required is set to false', () => {
  const result = toggleRequiredLabel('foobar', false)

  expect(result).toMatchSnapshot()
})
