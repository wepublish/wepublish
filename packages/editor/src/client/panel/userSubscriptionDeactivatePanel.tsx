import React, {useState} from 'react'
import {useTranslation} from 'react-i18next'
import {Button, DatePicker, Form, Message, Modal, SelectPicker} from 'rsuite'

import {SubscriptionDeactivationReason} from '../api'

export interface DeactivateSubscription {
  date: Date
  reason: SubscriptionDeactivationReason
}

export interface SubscriptionDeactivatePanelProps {
  isDeactivated: boolean
  displayName: string
  paidUntil?: Date

  onDeactivate(data: DeactivateSubscription): void
  onReactivate(): void
  onClose(): void
}

export function UserSubscriptionDeactivatePanel({
  isDeactivated,
  displayName,
  paidUntil,
  onDeactivate,
  onReactivate,
  onClose
}: SubscriptionDeactivatePanelProps) {
  const {t} = useTranslation()

  const [deactivationDate, setDeactivationDate] = useState<Date | null>(
    paidUntil ? new Date(paidUntil) : new Date()
  )
  const [
    deactivationReason,
    setDeactivationReason
  ] = useState<SubscriptionDeactivationReason | null>(null)

  return (
    <>
      <Modal.Header>
        <Modal.Title>
          {t(
            isDeactivated
              ? 'userSubscriptionEdit.deactivation.modalTitle.deactivated'
              : 'userSubscriptionEdit.deactivation.modalTitle.activated'
          )}
        </Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <p>
          {t(
            isDeactivated
              ? 'userSubscriptionEdit.deactivation.modalMessage.deactivated'
              : 'userSubscriptionEdit.deactivation.modalMessage.activated',
            {userName: displayName}
          )}
        </p>
        {!isDeactivated && (
          <Form style={{marginTop: '20px'}} fluid>
            <Form.Group>
              <Form.ControlLabel>{t('userSubscriptionEdit.deactivation.date')}</Form.ControlLabel>
              <DatePicker
                block
                placement="auto"
                value={deactivationDate}
                onChange={value => setDeactivationDate(value)}
              />
            </Form.Group>

            <Form.Group>
              <Form.ControlLabel>{t('userSubscriptionEdit.deactivation.reason')}</Form.ControlLabel>
              <SelectPicker
                virtualized
                searchable={false}
                data={[
                  {
                    value: SubscriptionDeactivationReason.None,
                    label: t('userSubscriptionEdit.deactivation.reasonNone')
                  },
                  {
                    value: SubscriptionDeactivationReason.UserSelfDeactivated,
                    label: t('userSubscriptionEdit.deactivation.reasonUserSelfDeactivated')
                  },
                  {
                    value: SubscriptionDeactivationReason.InvoiceNotPaid,
                    label: t('userSubscriptionEdit.deactivation.reasonInvoiceNotPaid')
                  }
                ]}
                value={deactivationReason}
                block
                placement="auto"
                onChange={value => setDeactivationReason(value)}
              />
            </Form.Group>
            <Message showIcon type="info">
              {t('userSubscriptionEdit.deactivation.help')}
            </Message>
          </Form>
        )}
      </Modal.Body>

      <Modal.Footer>
        <Button
          disabled={isDeactivated ? false : !deactivationDate || !deactivationReason}
          appearance="primary"
          onClick={() =>
            isDeactivated
              ? onReactivate()
              : onDeactivate({date: deactivationDate!, reason: deactivationReason!})
          }>
          {t(
            isDeactivated
              ? 'userSubscriptionEdit.deactivation.action.deactivated'
              : 'userSubscriptionEdit.deactivation.action.activated'
          )}
        </Button>
        <Button appearance="subtle" onClick={() => onClose()}>
          {t('articleEditor.panels.close')}
        </Button>
      </Modal.Footer>
    </>
  )
}
