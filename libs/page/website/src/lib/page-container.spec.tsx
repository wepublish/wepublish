import {render} from '@testing-library/react'
import {PageContainer} from './page-container'
import {MockedProvider} from '@apollo/client/testing'

describe('PageContainer', () => {
  it('should render successfully', () => {
    const {baseElement} = render(
      <MockedProvider addTypename={false}>
        <PageContainer slug="123" />
      </MockedProvider>
    )

    expect(baseElement).toBeTruthy()
  })
})
