import {render} from '@testing-library/react'

import {Page} from './page'

describe('Page', () => {
  it('should render successfully', () => {
    const {baseElement} = render(<Page data={undefined} loading={true} error={undefined} />)
    expect(baseElement).toBeTruthy()
  })
})
