import {render} from '@testing-library/react'

import {Navigation} from './navigation'

describe('Navigation', () => {
  it('should render successfully', () => {
    const {baseElement} = render(<Navigation data={undefined} loading={true} error={undefined} />)
    expect(baseElement).toBeTruthy()
  })
})
