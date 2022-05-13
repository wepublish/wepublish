import React, {useState} from 'react'
import {Alert, Button, FlexboxGrid, Icon, Modal, Panel} from 'rsuite'
import {InvoiceFragment, InvoiceItem, useUpdateInvoiceMutation, FullUserFragment} from '../api'
import {useTranslation} from 'react-i18next'

export interface InvoiceProps {
  subscriptionId: string
  invoice: InvoiceFragment
  me?: FullUserFragment | null
  disabled?: boolean
  onInvoicePaid(): void
}

export function Invoice({subscriptionId, invoice, me, disabled, onInvoicePaid}: InvoiceProps) {
  // variable definitions
  const [modalOpen, setModalOpen] = useState<boolean>(false)
  const [updateInvoice] = useUpdateInvoiceMutation()
  const {t} = useTranslation()

  /**
   * Manually set invoice as paid.
   * This will trigger an update event in events.ts which updates the subscriptions "paid until".
   */
  async function payManually() {
    // close modal
    setModalOpen(false)
    // error pre-check
    const myId = me?.id
    if (!myId) {
      Alert.error(t('invoice.userNotLoaded'), 4000)
      return
    }
    // talk with the private api
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
    onInvoicePaid()
  }

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
   * UI helper functions
   */
  function invoiceActionView() {
    if (invoice.paidAt) {
      return (
        <p>
          {t('invoice.paidAt')}{' '}
          {new Date(invoice.paidAt).toLocaleString('de-CH', {timeZone: 'europe/zurich'})}
        </p>
      )
    } else {
      return (
        <>
          <Button
            onClick={() => setModalOpen(true)}
            appearance="primary"
            style={{marginTop: '20px'}}
            disabled={!me?.id || disabled}>
            {t('invoice.payManually')}
          </Button>
        </>
      )
    }
  }

  function invoiceHeaderView() {
    return (
      <FlexboxGrid justify="space-between" align="middle">
        <FlexboxGrid.Item>
          {`${t('invoice.invoiceNo')} ${invoice.id}`}{' '}
          {!invoice.paidAt && <span>({t('invoice.unpaid')})</span>}
        </FlexboxGrid.Item>
        <FlexboxGrid.Item style={{textAlign: 'right'}}>{invoiceIconView()}</FlexboxGrid.Item>
      </FlexboxGrid>
    )
  }

  function invoiceIconView() {
    if (invoice.paidAt) {
      return <Icon icon="check" size="2x" style={{color: 'green'}} />
    } else {
      return <Icon icon="envelope-open" size="2x" style={{color: 'red'}} />
    }
  }

  return (
    <>
      <Panel bordered={true} header={invoiceHeaderView()}>
        <p>{invoice.description}</p>
        <p>
          {t('invoice.total')} {(invoice.total / 100).toFixed(2)} {t('currency.chf')}
        </p>
        {invoiceActionView()}
      </Panel>

      <Modal show={modalOpen} backdrop="static" size="xs" onHide={() => setModalOpen(false)}>
        <Modal.Title>{t('invoice.areYouSure')}</Modal.Title>
        <Modal.Body>{t('invoice.manuallyPaidModalBody')}</Modal.Body>
        <Modal.Footer>
          <Button appearance="primary" onClick={payManually}>
            {t('confirm')}
          </Button>
          <Button appearance="subtle" onClick={() => setModalOpen(false)}>
            {t('cancel')}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  )
}
