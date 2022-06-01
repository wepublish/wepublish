import React from 'react'
import {Button, Drawer, Message} from 'rsuite'
import {InvoiceFragment, useMeQuery} from '../api'
import {Invoice} from '../atoms/invoice'
import {useTranslation} from 'react-i18next'

export interface InvoiceListPanelProps {
  subscriptionId?: string
  invoices?: InvoiceFragment[]
  disabled?: boolean
  onClose?(): void
  onSave?(): void
  onInvoicePaid(): void
}

export function InvoiceListPanel({
  subscriptionId,
  invoices,
  disabled,
  onClose,
  onInvoicePaid
}: InvoiceListPanelProps) {
  const {data: me} = useMeQuery()
  const {t} = useTranslation()

  /**
   * UI helper functions
   */
  function invoiceHistoryView() {
    // missing subscription
    if (!subscriptionId) {
      return (
        <Drawer.Body>
          <Message type="error">{t('invoice.panel.missingSubscriptionId')}</Message>
        </Drawer.Body>
      )
    }
    // missing invoices
    if (!invoices?.length) {
      return (
        <Drawer.Body>
          <Message type="info">{t('invoice.panel.noInvoices')}</Message>
        </Drawer.Body>
      )
    }
    // iterate invoices
    return (
      <Drawer.Body>
        {invoices?.map((invoice, invoiceId) => (
          <div key={invoiceId} style={{marginBottom: '10px'}}>
            <Invoice
              subscriptionId={subscriptionId}
              invoice={invoice}
              me={me?.me}
              disabled={disabled}
              onInvoicePaid={() => onInvoicePaid()}
            />
          </div>
        ))}
      </Drawer.Body>
    )
  }

  return (
    <>
      <Drawer.Header>
        <Drawer.Title>{t('invoice.panel.invoiceHistory')}</Drawer.Title>
      </Drawer.Header>
      {invoiceHistoryView()}
      <Drawer.Footer>
        <Button appearance="primary" onClick={onClose}>
          {t('close')}
        </Button>
      </Drawer.Footer>
    </>
  )
}
