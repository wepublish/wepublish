import {render} from '@testing-library/react'

import UiEditor from './ui-editor'

describe('UiEditor', () => {
  it('should render successfully', () => {
    const {baseElement} = render(<UiEditor />)
    expect(baseElement).toBeTruthy()
  })
})
