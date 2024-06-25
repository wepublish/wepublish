import {render} from '@testing-library/react'

import ErrorsWebsite from './errors-website'

describe('ErrorsWebsite', () => {
  it('should render successfully', () => {
    const {baseElement} = render(<ErrorsWebsite />)
    expect(baseElement).toBeTruthy()
  })
})
