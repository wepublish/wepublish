import {render} from '@testing-library/react'
import {WebsiteBuilderProvider} from './website-builder.context'

describe('WebsiteBuilderContext', () => {
  it('should render successfully', () => {
    const {baseElement} = render(<WebsiteBuilderProvider />)
    expect(baseElement).toBeTruthy()
  })
})
