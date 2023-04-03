import {render} from '@testing-library/react'

import {Subscribe} from './subscribe'

describe('Subscribe', () => {
  it('should render successfully', () => {
    const {baseElement} = render(
      <Subscribe challenge={{data: undefined, error: undefined, loading: true}} />
    )
    expect(baseElement).toBeTruthy()
  })
})
