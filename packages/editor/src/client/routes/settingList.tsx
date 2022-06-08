import React, {useEffect, useState} from 'react'

import {useTranslation} from 'react-i18next'
import {FlexboxGrid, Form, InputNumber, Notification, toaster, Toggle} from 'rsuite'
import {Setting, SettingName, useSettingListQuery, useUpdateSettingMutation} from '../api'
import {ButtonLink} from '../route'

export function SettingList() {
  const {t} = useTranslation()

  const {data: settingListData, refetch, error: err} = useSettingListQuery()

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
    }
  }, [settingListData?.settings])

  const [updateSetting, {error: updateSettingError}] = useUpdateSettingMutation({
    fetchPolicy: 'no-cache'
  })

  async function handleSettingListUpdate() {
    const allSettings = [
      allowGuestComment,
      sendLoginJwtExpiresMin,
      resetPwdJwtExpiresMin,
      peeringTimeoutMs
    ]
    allSettings.map(
      async setting =>
        await updateSetting({variables: {id: setting.id, input: {value: setting.value}}})
    )

    await refetch()
    toaster.push(
      <Notification header={t('navbar.settingsPanel.successTitle')} type="success" duration={2000}>
        {t('navbar.settingsPanel.successMessage')}
      </Notification>
    )
  }

  useEffect(() => {
    const error = updateSettingError ?? err
    if (error)
      toaster.push(
        <Notification type="error" header={t('navbar.settingsPanel.errorTitle')} duration={2000}>
          {error.message.toString()}
        </Notification>
      )
  }, [err, updateSettingError])

  return (
    <>
      <FlexboxGrid>
        <FlexboxGrid.Item colspan={16}>
          <h2>{t('navbar.settings')}</h2>
        </FlexboxGrid.Item>
        <FlexboxGrid.Item colspan={8} style={{textAlign: 'right'}}>
          <ButtonLink
            appearance="primary"
            onClick={() => {
              handleSettingListUpdate()
            }}>
            {t('navbar.settingsPanel.save')}
          </ButtonLink>
        </FlexboxGrid.Item>
      </FlexboxGrid>
      <Form fluid={true}>
        <Form.Group>
          <Form.ControlLabel>{t('navbar.settingsPanel.guestCommenting')}</Form.ControlLabel>
          <Toggle
            checked={allowGuestComment?.value}
            onChange={checked =>
              setAllowGuestComment({
                id: allowGuestComment.id,
                name: allowGuestComment.name,
                value: checked
              })
            }
          />
        </Form.Group>
        <Form.Group>
          {/* eslint-disable-next-line i18next/no-literal-string */}
          <Form.ControlLabel>JWT expires min</Form.ControlLabel>
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
                id: sendLoginJwtExpiresMin.id,
                name: sendLoginJwtExpiresMin.name,
                value: value
              })
            }
          />
        </Form.Group>
        <Form.Group>
          {/* eslint-disable-next-line i18next/no-literal-string */}
          <Form.ControlLabel>reset password JWT expires min</Form.ControlLabel>
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
                id: resetPwdJwtExpiresMin.id,
                name: resetPwdJwtExpiresMin.name,
                value: value
              })
            }
          />
        </Form.Group>
        <Form.Group>
          {/* eslint-disable-next-line i18next/no-literal-string */}
          <Form.ControlLabel>timeout peer ms</Form.ControlLabel>
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
                id: peeringTimeoutMs.id,
                name: peeringTimeoutMs.name,
                value: value
              })
            }
          />
        </Form.Group>
      </Form>
    </>
  )
}
