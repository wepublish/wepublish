import {render} from '@testing-library/react'

import {PayInvoices} from './pay-invoices'

describe('PayInvoices', () => {
  it('should render successfully', () => {
    const {baseElement} = render(
      <PayInvoices challenge={{data: undefined, error: undefined, loading: true}} />
    )
    expect(baseElement).toBeTruthy()
  })
})
