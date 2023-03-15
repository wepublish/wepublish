import {render} from '@testing-library/react'

import ConsentList from './consent-list'

describe('ConsentList', () => {
  it('should render successfully', () => {
    const {baseElement} = render(<ConsentList />)
    expect(baseElement).toBeTruthy()
  })
})
