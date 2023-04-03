import {render} from '@testing-library/react'

import {MemberPlans} from './member-plans'

describe('MemberPlans', () => {
  it('should render successfully', () => {
    const {baseElement} = render(<MemberPlans data={undefined} loading={true} error={undefined} />)
    expect(baseElement).toBeTruthy()
  })
})
