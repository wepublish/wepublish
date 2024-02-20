import {render} from '@testing-library/react'

import {OrderedList, UnorderedList} from './lists'

describe('UnorderedList', () => {
  it('should render successfully', () => {
    const {baseElement} = render(
      <UnorderedList>
        <li>Foobar</li>
      </UnorderedList>
    )
    expect(baseElement).toMatchSnapshot()
  })
})

describe('OrderedList', () => {
  it('should render successfully', () => {
    const {baseElement} = render(
      <OrderedList>
        <li>Foobar</li>
      </OrderedList>
    )
    expect(baseElement).toMatchSnapshot()
  })
})
