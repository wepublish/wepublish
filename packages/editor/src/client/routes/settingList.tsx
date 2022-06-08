import React, {useEffect, useState} from 'react'

import {useTranslation} from 'react-i18next'
import {FlexboxGrid, Form, Input, InputNumber, Notification, toaster, Toggle} from 'rsuite'
import {Setting, SettingName, useSettingListQuery, useUpdateSettingMutation} from '../api'
import {ButtonLink} from '../route'

export function SettingList() {
  const {t} = useTranslation()

  const {data: settingListData, refetch, error: err} = useSettingListQuery()

  // TODO where to use?
  const [googleDiscoveryUrl, setGoogleDiscoveryUrl] = useState<Setting>({
    id: '',
    value: ' ',
    name: SettingName.Default
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

  const [jwtSecretKey, setJwtSecretKey] = useState<Setting>({
    id: '',
    value: ' ',
    name: SettingName.Default
  })

  useEffect(() => {
    if (settingListData?.settings) {
      const allowGuestCommentSetting = settingListData?.settings?.find(
        setting => setting.name === SettingName.AllowGuestCommenting
      )
      if (allowGuestCommentSetting) setAllowGuestComment(allowGuestCommentSetting)

      const googleDiscoveryUrlSetting = settingListData?.settings?.find(
        setting => setting.name === SettingName.OauthGoogleDiscoveryUrl
      )
      if (googleDiscoveryUrlSetting) setGoogleDiscoveryUrl(googleDiscoveryUrlSetting)

      const sendLoginJwtExpiresSetting = settingListData?.settings?.find(
        setting => setting.name === SettingName.SendLoginJwtExpiresMin
      )
      if (sendLoginJwtExpiresSetting) setSendLoginJwtExpiresMin(sendLoginJwtExpiresSetting)

      const resetPwdJwtExpiresSetting = settingListData?.settings?.find(
        setting => setting.name === SettingName.ResetPasswordJwtExpiresMin
      )
      if (resetPwdJwtExpiresSetting) setResetPwdJwtExpiresMin(resetPwdJwtExpiresSetting)

      const jwtSecretKeySetting = settingListData?.settings?.find(
        setting => setting.name === SettingName.JwtSecretKey
      )
      if (jwtSecretKeySetting) setJwtSecretKey(jwtSecretKeySetting)
    }
  }, [settingListData?.settings])

  const [updateSetting, {error: updateSettingError}] = useUpdateSettingMutation({
    fetchPolicy: 'no-cache'
  })

  async function handleSettingListUpdate() {
    const allSettings = [
      allowGuestComment,
      googleDiscoveryUrl,
      sendLoginJwtExpiresMin,
      resetPwdJwtExpiresMin,
      jwtSecretKey
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
          <Form.ControlLabel>{t('navbar.settingsPanel.discoveryUrl')}</Form.ControlLabel>
          <Input
            onChange={value =>
              setGoogleDiscoveryUrl({
                id: googleDiscoveryUrl.id,
                name: googleDiscoveryUrl.name,
                value: value
              })
            }
            value={googleDiscoveryUrl.value}
          />
        </Form.Group>
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
          <Form.ControlLabel>JWT secret key</Form.ControlLabel>
          <Input
            value={jwtSecretKey.value}
            // type="password"
            onChange={value =>
              setJwtSecretKey({
                id: jwtSecretKey.id,
                name: jwtSecretKey.name,
                value: value
              })
            }
          />
        </Form.Group>
      </Form>
    </>
  )
}
