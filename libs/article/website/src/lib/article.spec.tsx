import {render} from '@testing-library/react'

import {Article} from './article'

describe('Article', () => {
  it('should render successfully', () => {
    const {baseElement} = render(<Article data={undefined} loading={true} error={undefined} />)
    expect(baseElement).toBeTruthy()
  })
})
