import {render} from '@testing-library/react'
import {FooterContainer} from './footer-container'
import {MockedProvider} from '@apollo/client/testing'

describe('FooterContainer', () => {
  it('should render successfully', () => {
    const {baseElement} = render(
      <MockedProvider addTypename={false}>
        <FooterContainer />
      </MockedProvider>
    )

    expect(baseElement).toBeTruthy()
  })
})
