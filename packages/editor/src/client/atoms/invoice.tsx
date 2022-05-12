import React from 'react'
import {Button, Panel} from 'rsuite'
import {InvoiceFragment, InvoiceItem, useUpdateInvoiceMutation} from '../api'

export interface InvoiceProps {
  subscriptionId: string
  invoice: InvoiceFragment
}

export function Invoice({subscriptionId, invoice}: InvoiceProps) {
  /**
   * Manually set invoice as paid. This will trigger an update event in events.ts which updates the paid until of the subscription.
   */
  const [updateInvoice] = useUpdateInvoiceMutation()
  async function payManually() {
    const items = invoice.items.map(item => {
      return {
        name: item.name,
        description: item.description,
        quantity: item.quantity,
        amount: item.amount
      }
    })
    const {data} = await updateInvoice({
      variables: {
        updateInvoiceId: invoice.id,
        input: {
          userID: 'eNXQ4TZr1NIFNj5g',
          mail: 'dev@wepublish.ch',
          items,
          paidAt: new Date().toISOString(),
          description: 'Manuell bezahlte Rechnung',
          subscriptionID: subscriptionId
        }
      }
    })
    console.log('data', data)
  }

  /**
   * UI atoms
   */
  function invoiceAction() {
    if (invoice.paidAt) {
      return <p>Bezahlt am {invoice.paidAt}</p>
    } else {
      return <Button onClick={payManually}>Manuell bezahlen</Button>
    }
  }

  return (
    <>
      <Panel bordered={true} header={`Rechnung ${invoice.id}`}>
        {invoiceAction()}
      </Panel>
    </>
  )
}
