import React from 'react'
import {Drawer} from 'rsuite'
import {useInvoicesQuery, useMeQuery} from '../api'
import {Invoice} from '../atoms/invoice'

export interface InvoiceListPanelProps {
  id?: string
  onClose?(): void
  onSave?(): void
}

export function InvoiceListPanel({id, onClose, onSave}: InvoiceListPanelProps) {
  const {data: me} = useMeQuery()

  const {data: invoices} = useInvoicesQuery({
    variables: {
      first: 100,
      filter: {
        subscriptionID: id
      }
    }
  })

  function invoiceHistoryView() {
    if (id) {
      return (
        <Drawer.Body>
          {invoices?.invoices?.nodes.map((invoice, invoiceId) => (
            <div key={invoiceId} style={{marginBottom: '10px'}}>
              <Invoice subscriptionId={id} invoice={invoice} me={me?.me} />
            </div>
          ))}
        </Drawer.Body>
      )
    }
    return <span />
  }

  return (
    <>
      <Drawer.Header>
        <Drawer.Title>Rechnungsverlauf</Drawer.Title>
      </Drawer.Header>
      {invoiceHistoryView()}
    </>
  )
}
