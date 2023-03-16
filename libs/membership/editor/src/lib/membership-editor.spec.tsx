import {render} from '@testing-library/react'

import MembershipEditor from './membership-editor'

describe('MembershipEditor', () => {
  it('should render successfully', () => {
    const {baseElement} = render(<MembershipEditor />)
    expect(baseElement).toBeTruthy()
  })
})
