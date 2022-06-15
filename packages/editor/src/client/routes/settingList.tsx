import React, {useEffect, useState} from 'react'

import {useTranslation} from 'react-i18next'
import {Form, InputNumber, Notification, toaster, Toggle} from 'rsuite'
import {Setting, SettingName, useSettingListQuery, useUpdateSettingMutation} from '../api'
import {ButtonLink} from '../route'

export function SettingList() {
  const {t} = useTranslation()

  const {data: settingListData, refetch, error: fetchError} = useSettingListQuery({
    fetchPolicy: 'network-only'
  })

  const [allowGuestComment, setAllowGuestComment] = useState<Setting>({
    id: '',
    value: false,
    name: SettingName.Default
  })
  const [sendLoginJwtExpiresMin, setSendLoginJwtExpiresMin] = useState<Setting>({
    id: '',
    value: 0,
    name: SettingName.Default
  })

  const [resetPwdJwtExpiresMin, setResetPwdJwtExpiresMin] = useState<Setting>({
    id: '',
    value: 0,
    name: SettingName.Default
  })

  const [peeringTimeoutMs, setPeeringTimeoutMs] = useState<Setting>({
    id: '',
    value: 0,
    name: SettingName.Default
  })

  const [invoiceReminderTries, setInvoiceReminderTries] = useState<Setting>({
    id: '',
    value: 0,
    name: SettingName.Default
  })

  const [invoiceReminderFreq, setInvoiceReminderFreq] = useState<Setting>({
    id: '',
    value: 0,
    name: SettingName.Default
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

  const [updateSetting, {error: updateSettingError}] = useUpdateSettingMutation({
    fetchPolicy: 'network-only'
  })

  async function handleSettingListUpdate() {
    const allSettings = [
      allowGuestComment,
      sendLoginJwtExpiresMin,
      resetPwdJwtExpiresMin,
      peeringTimeoutMs,
      invoiceReminderTries,
      invoiceReminderFreq
    ]
    allSettings.map(
      async setting =>
        await updateSetting({variables: {id: setting.id, input: {value: setting.value}}})
    )

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

  return (
    <>
      <Form>
        <Form.Group>
          <h2>{t('settingList.settings')}</h2>
        </Form.Group>
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
        <Form.Group>
          <Form.ControlLabel>{t('settingList.loginMinutes')}</Form.ControlLabel>
          <InputNumber
            value={sendLoginJwtExpiresMin.value}
            min={
              sendLoginJwtExpiresMin.settingRestriction?.minValue
                ? sendLoginJwtExpiresMin.settingRestriction.minValue
                : undefined
            }
            max={
              sendLoginJwtExpiresMin.settingRestriction?.maxValue
                ? sendLoginJwtExpiresMin.settingRestriction.maxValue
                : undefined
            }
            onChange={value =>
              setSendLoginJwtExpiresMin({
                ...sendLoginJwtExpiresMin,
                value: value
              })
            }
            postfix={t('settingList.minutes')}
          />
        </Form.Group>
        <Form.Group>
          <Form.ControlLabel>{t('settingList.passwordToken')}</Form.ControlLabel>
          <InputNumber
            value={resetPwdJwtExpiresMin.value}
            min={
              resetPwdJwtExpiresMin.settingRestriction?.minValue
                ? resetPwdJwtExpiresMin.settingRestriction.minValue
                : undefined
            }
            max={
              resetPwdJwtExpiresMin.settingRestriction?.maxValue
                ? resetPwdJwtExpiresMin.settingRestriction.maxValue
                : undefined
            }
            onChange={value =>
              setResetPwdJwtExpiresMin({
                ...resetPwdJwtExpiresMin,
                value: value
              })
            }
            postfix={t('settingList.minutes')}
          />
        </Form.Group>
        <Form.Group>
          <Form.ControlLabel>{t('settingList.peerToken')}</Form.ControlLabel>
          <InputNumber
            value={peeringTimeoutMs.value}
            min={
              peeringTimeoutMs.settingRestriction?.minValue
                ? peeringTimeoutMs.settingRestriction.minValue
                : undefined
            }
            max={
              peeringTimeoutMs.settingRestriction?.maxValue
                ? peeringTimeoutMs.settingRestriction.maxValue
                : undefined
            }
            onChange={value =>
              setPeeringTimeoutMs({
                ...peeringTimeoutMs,
                value: value
              })
            }
            postfix={t('settingList.ms')}
          />
        </Form.Group>
        <Form.Group>
          {/* eslint-disable-next-line i18next/no-literal-string */}
          <Form.ControlLabel>invoice reminder retries</Form.ControlLabel>
          <InputNumber
            value={invoiceReminderTries.value}
            min={
              invoiceReminderTries.settingRestriction?.minValue
                ? invoiceReminderTries.settingRestriction.minValue
                : undefined
            }
            max={
              invoiceReminderTries.settingRestriction?.maxValue
                ? invoiceReminderTries.settingRestriction.maxValue
                : undefined
            }
            onChange={value =>
              setInvoiceReminderTries({
                ...invoiceReminderTries,
                value: value
              })
            }
          />
        </Form.Group>
        <Form.Group>
          {/* eslint-disable-next-line i18next/no-literal-string */}
          <Form.ControlLabel>invoice reminder frequency</Form.ControlLabel>
          <InputNumber
            value={invoiceReminderFreq.value}
            min={
              invoiceReminderFreq.settingRestriction?.minValue
                ? invoiceReminderFreq.settingRestriction.minValue
                : undefined
            }
            max={
              invoiceReminderFreq.settingRestriction?.maxValue
                ? invoiceReminderFreq.settingRestriction.maxValue
                : undefined
            }
            onChange={value =>
              setInvoiceReminderFreq({
                ...invoiceReminderFreq,
                value: value
              })
            }
            postfix={t('settingList.days')}
          />
        </Form.Group>
        <ButtonLink
          appearance="primary"
          onClick={async () => {
            await handleSettingListUpdate()
          }}>
          {t('settingList.save')}
        </ButtonLink>
      </Form>
    </>
  )
}
