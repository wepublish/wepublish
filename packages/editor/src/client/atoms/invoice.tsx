import React from 'react'
import {Button, Panel} from 'rsuite'
import {InvoiceFragment, InvoiceItem, useUpdateInvoiceMutation, useMeQuery} from '../api'

export interface InvoiceProps {
  subscriptionId: string
  invoice: InvoiceFragment
}

export function Invoice({subscriptionId, invoice}: InvoiceProps) {
  // variable definitions
  const [updateInvoice] = useUpdateInvoiceMutation()
  const {data: me} = useMeQuery()

  /**
   * Manually set invoice as paid.
   * This will trigger an update event in events.ts which updates the subscriptions "paid until".
   */
  async function payManually() {
    // todo: indicate user is loading
    const myId = me?.me?.id
    if (!myId) {
      // todo: send error message to ui
      return
    }
    const items = prepareInvoiceItemsForApi(invoice.items)
    await updateInvoice({
      variables: {
        updateInvoiceId: invoice.id,
        input: {
          items,
          mail: invoice.mail,
          paidAt: new Date().toISOString(),
          description: invoice.description,
          subscriptionID: subscriptionId,
          manuallySetAsPaidByUserId: myId
        }
      }
    })
  }

  /**
   * helper function
   * get my user to be able to pass my user id when updating the invoice
   */

  /**
   * helper function
   * to be compatible with the api, we have to prepare the current invoice items
   */
  function prepareInvoiceItemsForApi(items: InvoiceItem[]): InvoiceItem[] {
    return items.map(item => {
      return {
        name: item.name,
        description: item.description,
        quantity: item.quantity,
        amount: item.amount,
        createdAt: new Date(item.createdAt).toISOString(),
        modifiedAt: new Date(item.modifiedAt).toISOString(),
        total: item.total
      }
    })
  }

  /**
   * UI atoms
   */
  function invoiceActionView() {
    if (invoice.paidAt) {
      return <p>Bezahlt am {invoice.paidAt}</p>
    } else {
      return <Button onClick={payManually}>Manuell bezahlen</Button>
    }
  }

  return (
    <>
      <Panel bordered={true} header={`Rechnung ${invoice.id} von ${me?.me?.id}`}>
        {invoiceActionView()}
      </Panel>
    </>
  )
}
