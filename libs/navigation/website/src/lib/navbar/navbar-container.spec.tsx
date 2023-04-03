import {render} from '@testing-library/react'
import {NavbarContainer} from './navbar-container'
import {MockedProvider} from '@apollo/client/testing'

describe('NavbarContainer', () => {
  it('should render successfully', () => {
    const {baseElement} = render(
      <MockedProvider addTypename={false}>
        <NavbarContainer />
      </MockedProvider>
    )

    expect(baseElement).toBeTruthy()
  })
})
