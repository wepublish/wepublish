import styled from '@emotion/styled'
import {BuilderPayInvoicesProps} from '@wepublish/website/builder'

export type PayInvoicesProps = BuilderPayInvoicesProps

const StyledPayInvoices = styled.div`
  color: pink;
`

export function PayInvoices({className, invoices}: PayInvoicesProps) {
  return (
    <StyledPayInvoices className={className}>
      <h1>Welcome to PayInvoices!</h1>
    </StyledPayInvoices>
  )
}
