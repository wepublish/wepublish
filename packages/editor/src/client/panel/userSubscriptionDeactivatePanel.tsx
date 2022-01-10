import React, {useState} from 'react'
import {useTranslation} from 'react-i18next'
import {
  Button,
  ControlLabel,
  DatePicker,
  Form,
  FormGroup,
  Message,
  Modal,
  SelectPicker
} from 'rsuite'

import {FullUserFragment, SubscriptionDeactivationReason} from '../api'

export interface DeactivateSubscription {
  date: Date
  reason: SubscriptionDeactivationReason
}

export interface UserSubscriptionDeactivatePanelProps {
  isDeactivated: boolean
  user: FullUserFragment

  onDeactivate(data: DeactivateSubscription): void
  onReactivate(): void
  onClose(): void
}

export function UserSubscriptionDeactivatePanel({
  isDeactivated,
  user,
  onDeactivate,
  onReactivate,
  onClose
}: UserSubscriptionDeactivatePanelProps) {
  const {t} = useTranslation()

  const [deactivationDate, setDeactivationDate] = useState(
    user.subscription?.paidUntil ? new Date(user.subscription?.paidUntil) : new Date()
  )
  const [deactivationReason, setDeactivationReason] = useState(null)

  return (
    <>
      <Modal.Header>
        <Modal.Title>
          {t(
            isDeactivated
              ? 'userSubscriptionEdit.deactivation.modalTitel.deactivated'
              : 'userSubscriptionEdit.deactivation.modalTitel.activated'
          )}
        </Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <p>
          {t(
            isDeactivated
              ? 'userSubscriptionEdit.deactivation.modalMessage.deactivated'
              : 'userSubscriptionEdit.deactivation.modalMessage.activated',
            {userName: user.preferredName ?? user.name, userEmail: user.email}
          )}
        </p>
        {!isDeactivated && (
          <Form style={{marginTop: '20px'}} fluid={true}>
            <FormGroup>
              <ControlLabel>{t('userSubscriptionEdit.deactivation.date')}</ControlLabel>
              <DatePicker
                block
                placement="auto"
                value={deactivationDate}
                onChange={value => setDeactivationDate(value)}
              />
            </FormGroup>

            <FormGroup>
              <ControlLabel>{t('userSubscriptionEdit.deactivation.reason')}</ControlLabel>
              <SelectPicker
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
            </FormGroup>
            <Message
              showIcon
              type="info"
              description={t('userSubscriptionEdit.deactivation.help')}
            />
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
              : onDeactivate({date: deactivationDate, reason: deactivationReason!})
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
