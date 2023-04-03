import {render} from '@testing-library/react'

import {Navbar} from './navbar'

describe('Navbar', () => {
  it('should render successfully', () => {
    const {baseElement} = render(<Navbar data={undefined} loading={true} error={undefined} />)
    expect(baseElement).toBeTruthy()
  })
})
