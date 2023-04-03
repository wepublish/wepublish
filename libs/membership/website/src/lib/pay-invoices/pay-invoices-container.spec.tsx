import {render} from '@testing-library/react'

import {PayInvoicesContainer} from './pay-invoices-container'
import {MockedProvider} from '@apollo/client/testing'

describe('PayInvoicesContainer', () => {
  it('should render successfully', () => {
    const {baseElement} = render(
      <MockedProvider addTypename={false}>
        <PayInvoicesContainer />
      </MockedProvider>
    )

    expect(baseElement).toBeTruthy()
  })
})
