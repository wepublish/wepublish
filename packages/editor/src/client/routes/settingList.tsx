import React, {useEffect, useState} from 'react'

import {useTranslation} from 'react-i18next'
import {
  Button,
  Form,
  InputGroup,
  InputNumber,
  Notification,
  Panel,
  Schema,
  toaster,
  Toggle
} from 'rsuite'
import {
  Setting,
  SettingName,
  UpdateSettingArgs,
  useSettingListQuery,
  useUpdateSettingListMutation
} from '../api'
import InputGroupAddon from 'rsuite/cjs/InputGroup/InputGroupAddon'
import FormControl from 'rsuite/FormControl'

export function SettingList() {
  const {t} = useTranslation()

  const {data: settingListData, refetch, error: fetchError} = useSettingListQuery({
    fetchPolicy: 'network-only'
  })

  const [allowGuestComment, setAllowGuestComment] = useState<Setting>({
    id: '',
    value: false,
    name: SettingName.AllowGuestCommenting
  })
  const [sendLoginJwtExpiresMin, setSendLoginJwtExpiresMin] = useState<Setting>({
    id: '',
    value: 0,
    name: SettingName.SendLoginJwtExpiresMin
  })

  const [resetPwdJwtExpiresMin, setResetPwdJwtExpiresMin] = useState<Setting>({
    id: '',
    value: 0,
    name: SettingName.ResetPasswordJwtExpiresMin
  })

  const [peeringTimeoutMs, setPeeringTimeoutMs] = useState<Setting>({
    id: '',
    value: 0,
    name: SettingName.PeeringTimeoutMs
  })

  const [invoiceReminderTries, setInvoiceReminderTries] = useState<Setting>({
    id: '',
    value: 0,
    name: SettingName.PeeringTimeoutMs
  })

  const [invoiceReminderFreq, setInvoiceReminderFreq] = useState<Setting>({
    id: '',
    value: 0,
    name: SettingName.InvoiceReminderFreq
  })

  useEffect(() => {
    if (settingListData?.settings) {
      const allowGuestCommentSetting = settingListData?.settings?.find(
        setting => setting.name === SettingName.AllowGuestCommenting
      )
      if (allowGuestCommentSetting) setAllowGuestComment(allowGuestCommentSetting)

      const peeringTimeoutMsSetting = settingListData?.settings?.find(
        setting => setting.name === SettingName.PeeringTimeoutMs
      )
      if (peeringTimeoutMsSetting) setPeeringTimeoutMs(peeringTimeoutMsSetting)

      const sendLoginJwtExpiresSetting = settingListData?.settings?.find(
        setting => setting.name === SettingName.SendLoginJwtExpiresMin
      )
      if (sendLoginJwtExpiresSetting) setSendLoginJwtExpiresMin(sendLoginJwtExpiresSetting)

      const resetPwdJwtExpiresSetting = settingListData?.settings?.find(
        setting => setting.name === SettingName.ResetPasswordJwtExpiresMin
      )
      if (resetPwdJwtExpiresSetting) setResetPwdJwtExpiresMin(resetPwdJwtExpiresSetting)

      const invoiceRetries = settingListData?.settings?.find(
        setting => setting.name === SettingName.InvoiceReminderMaxTries
      )
      if (invoiceRetries) setInvoiceReminderTries(invoiceRetries)

      const invoiceFreq = settingListData?.settings?.find(
        setting => setting.name === SettingName.InvoiceReminderFreq
      )
      if (invoiceFreq) setInvoiceReminderFreq(invoiceFreq)
    }
  }, [settingListData])

  const [updateSettings, {error: updateSettingError}] = useUpdateSettingListMutation({
    fetchPolicy: 'network-only'
  })

  async function handleSettingListUpdate() {
    const allSettings: UpdateSettingArgs[] = [
      {name: SettingName.AllowGuestCommenting, value: allowGuestComment.value},
      {name: SettingName.SendLoginJwtExpiresMin, value: parseInt(sendLoginJwtExpiresMin?.value)},
      {name: SettingName.ResetPasswordJwtExpiresMin, value: parseInt(resetPwdJwtExpiresMin.value)},
      {name: SettingName.PeeringTimeoutMs, value: parseInt(peeringTimeoutMs.value)},
      {name: SettingName.InvoiceReminderMaxTries, value: parseInt(invoiceReminderTries.value)},
      {name: SettingName.InvoiceReminderFreq, value: parseInt(invoiceReminderFreq.value)}
    ]
    await updateSettings({variables: {input: allSettings}})

    toaster.push(
      <Notification header={t('settingList.successTitle')} type="success" duration={2000}>
        {t('settingList.successMessage')}
      </Notification>
    )
    await refetch()
  }

  useEffect(() => {
    const error = updateSettingError ?? fetchError
    if (error)
      toaster.push(
        <Notification type="error" header={t('settingList.errorTitle')} duration={2000}>
          {error.message.toString()}
        </Notification>
      )
  }, [fetchError, updateSettingError])

  const {NumberType} = Schema.Types

  const validationModel = Schema.Model({
    loginToken: NumberType()
      .isRequired(t('errorMessages.required'))
      .range(
        sendLoginJwtExpiresMin?.settingRestriction?.minValue ?? 1,
        sendLoginJwtExpiresMin?.settingRestriction?.maxValue ?? 10080,
        t('errorMessages.invalidRange', {
          min: sendLoginJwtExpiresMin?.settingRestriction?.minValue ?? 1,
          max: sendLoginJwtExpiresMin?.settingRestriction?.maxValue ?? 10080
        })
      ),
    passwordExpire: NumberType()
      .isRequired(t('errorMessages.required'))
      .range(
        resetPwdJwtExpiresMin.settingRestriction?.minValue ?? 10,
        resetPwdJwtExpiresMin.settingRestriction?.maxValue ?? 10080,
        t('errorMessages.invalidRange', {
          min: resetPwdJwtExpiresMin.settingRestriction?.minValue ?? 10,
          max: resetPwdJwtExpiresMin.settingRestriction?.maxValue ?? 10080
        })
      ),
    peeringTimeout: NumberType()
      .isRequired(t('errorMessages.required'))
      .range(
        peeringTimeoutMs.settingRestriction?.minValue ?? 1000,
        peeringTimeoutMs.settingRestriction?.maxValue ?? 10000,
        t('errorMessages.invalidRange', {
          min: peeringTimeoutMs.settingRestriction?.minValue ?? 1000,
          max: peeringTimeoutMs.settingRestriction?.maxValue ?? 10000
        })
      ),
    invoiceTries: NumberType()
      .isRequired(t('errorMessages.required'))
      .range(
        invoiceReminderTries.settingRestriction?.minValue ?? 0,
        invoiceReminderTries.settingRestriction?.maxValue ?? 10,
        t('errorMessages.invalidRange', {
          min: invoiceReminderTries.settingRestriction?.minValue ?? 0,
          max: invoiceReminderTries.settingRestriction?.maxValue ?? 10
        })
      ),
    invoiceFrequency: NumberType()
      .isRequired(t('errorMessages.required'))
      .range(
        invoiceReminderFreq.settingRestriction?.minValue ?? 0,
        invoiceReminderFreq.settingRestriction?.maxValue ?? 30,
        t('errorMessages.invalidRange', {
          min: invoiceReminderFreq.settingRestriction?.minValue ?? 0,
          max: invoiceReminderFreq.settingRestriction?.maxValue ?? 30
        })
      )
  })

  return (
    <>
      <Form
        disabled={!settingListData}
        model={validationModel}
        formValue={{
          loginToken: sendLoginJwtExpiresMin.value,
          passwordExpire: resetPwdJwtExpiresMin.value,
          peeringTimeout: peeringTimeoutMs.value,
          invoiceTries: invoiceReminderTries.value,
          invoiceFrequency: invoiceReminderFreq.value
        }}
        onSubmit={async validationPassed => {
          validationPassed && (await handleSettingListUpdate())
        }}>
        <Form.Group>
          <h2>{t('settingList.settings')}</h2>
        </Form.Group>
        <Panel bordered header={t('settingList.comments')} style={{marginBottom: 10}}>
          <Form.Group>
            <Form.ControlLabel>{t('settingList.guestCommenting')}</Form.ControlLabel>
            <Toggle
              checked={allowGuestComment?.value}
              onChange={checked =>
                setAllowGuestComment({
                  ...allowGuestComment,
                  value: checked
                })
              }
            />
          </Form.Group>
        </Panel>

        <Panel bordered header={t('settingList.login')} style={{marginBottom: 10}}>
          <Form.Group>
            <Form.ControlLabel>{t('settingList.loginMinutes')}</Form.ControlLabel>
            <InputGroup>
              <FormControl
                name="loginToken"
                accepter={InputNumber}
                value={sendLoginJwtExpiresMin.value}
                onChange={(value: number) =>
                  setSendLoginJwtExpiresMin({
                    ...sendLoginJwtExpiresMin,
                    value: value
                  })
                }
              />
              <InputGroupAddon>{t('settingList.minutes')}</InputGroupAddon>
            </InputGroup>
          </Form.Group>
          <Form.Group>
            <Form.ControlLabel>{t('settingList.passwordToken')}</Form.ControlLabel>
            <InputGroup>
              <Form.Control
                name="passwordExpire"
                accepter={InputNumber}
                value={resetPwdJwtExpiresMin.value}
                onChange={(value: number) => {
                  setResetPwdJwtExpiresMin({...resetPwdJwtExpiresMin, value: value})
                }}
              />
              <InputGroupAddon>{t('settingList.minutes')}</InputGroupAddon>
            </InputGroup>
          </Form.Group>
        </Panel>

        <Panel bordered header={t('settingList.peering')} style={{marginBottom: 10}}>
          <Form.Group>
            <Form.ControlLabel>{t('settingList.peerToken')}</Form.ControlLabel>
            <InputGroup>
              <Form.Control
                name="peeringTimeout"
                accepter={InputNumber}
                value={peeringTimeoutMs.value}
                onChange={(value: number) => {
                  setPeeringTimeoutMs({
                    ...peeringTimeoutMs,
                    value: value
                  })
                }}
              />
              <InputGroupAddon>{t('settingList.ms')}</InputGroupAddon>
            </InputGroup>
          </Form.Group>
        </Panel>

        <Panel bordered header={t('settingList.payment')} style={{marginBottom: 10}}>
          <Form.Group>
            <Form.ControlLabel>{t('settingList.invoiceReminders')}</Form.ControlLabel>
            <Form.Control
              name="invoiceTries"
              accepter={InputNumber}
              value={invoiceReminderTries.value}
              onChange={(value: number) =>
                setInvoiceReminderTries({
                  ...invoiceReminderTries,
                  value: value
                })
              }
            />
          </Form.Group>
          <Form.Group>
            <Form.ControlLabel>{t('settingList.invoiceFrequency')}</Form.ControlLabel>
            <InputGroup>
              <Form.Control
                name="invoiceFrequency"
                accepter={InputNumber}
                value={invoiceReminderFreq.value}
                onChange={(value: number) =>
                  setInvoiceReminderFreq({
                    ...invoiceReminderFreq,
                    value: value
                  })
                }
              />
              <InputGroupAddon>{t('settingList.days')}</InputGroupAddon>
            </InputGroup>
          </Form.Group>
        </Panel>

        <Button type="submit" appearance="primary" disabled={!settingListData}>
          {t('settingList.save')}
        </Button>
      </Form>
    </>
  )
}
