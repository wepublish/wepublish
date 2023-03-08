import {render} from '@testing-library/react'

import {Footer} from './footer'

describe('Footer', () => {
  it('should render successfully', () => {
    const {baseElement} = render(<Footer data={undefined} loading={true} error={undefined} />)
    expect(baseElement).toBeTruthy()
  })
})
