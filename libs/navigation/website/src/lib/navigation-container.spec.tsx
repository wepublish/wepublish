import {render} from '@testing-library/react'
import {NavigationContainer} from './navigation-container'
import {MockedProvider} from '@apollo/client/testing'

describe('NavigationContainer', () => {
  it('should render successfully', () => {
    const {baseElement} = render(
      <MockedProvider addTypename={false}>
        <NavigationContainer />
      </MockedProvider>
    )

    expect(baseElement).toBeTruthy()
  })
})
