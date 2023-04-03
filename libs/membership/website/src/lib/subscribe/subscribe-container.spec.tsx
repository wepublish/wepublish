import {render} from '@testing-library/react'

import {SubscribeContainer} from './subscribe-container'
import {MockedProvider} from '@apollo/client/testing'

describe('SubscribeContainer', () => {
  it('should render successfully', () => {
    const {baseElement} = render(
      <MockedProvider addTypename={false}>
        <SubscribeContainer />
      </MockedProvider>
    )

    expect(baseElement).toBeTruthy()
  })
})
