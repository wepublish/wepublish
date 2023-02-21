import {render} from '@testing-library/react'

import {MemberPlansContainer} from './member-plans-container'
import {MockedProvider} from '@apollo/client/testing'

describe('MemberPlansContainer', () => {
  it('should render successfully', () => {
    const {baseElement} = render(
      <MockedProvider addTypename={false}>
        <MemberPlansContainer />
      </MockedProvider>
    )

    expect(baseElement).toBeTruthy()
  })
})
