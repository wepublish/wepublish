import React, {useEffect, useState} from 'react'

import {useTranslation} from 'react-i18next'
import {Button, Drawer, Form, InputNumber, Notification, Panel, toaster, Toggle} from 'rsuite'
import {Setting, SettingName, useSettingListQuery, useUpdateSettingMutation} from '../api'

export type SettingInputProps = {
  id?: string
  value: any
}

export function SettingsPanel() {
  const {t} = useTranslation()

  const {data: settingListData, refetch, error: err} = useSettingListQuery()

  const [maxCommentLength, setMaxCommentLength] = useState<Setting>({
    id: '',
    value: 0,
    name: SettingName.Default
  })
  const [allowGuestComment, setAllowGuestComment] = useState<Setting>({
    id: '',
    value: false,
    name: SettingName.Default
  })

  useEffect(() => {
    if (settingListData?.settings) {
      const allowGuestCommentSetting = settingListData?.settings?.find(
        setting => setting.name === SettingName.AllowGuestCommenting
      )
      if (allowGuestCommentSetting) setAllowGuestComment(allowGuestCommentSetting)
      const maxCommentLengthSetting = settingListData?.settings?.find(
        setting => setting.name === SettingName.MaximumCommentLength
      )
      if (maxCommentLengthSetting) setMaxCommentLength(maxCommentLengthSetting)
    }
  }, [settingListData?.settings])

  const [updateSetting, {error: updateSettingError}] = useUpdateSettingMutation({
    fetchPolicy: 'no-cache'
  })

  async function handleSettingListUpdate() {
    await updateSetting({
      variables: {id: maxCommentLength.id, input: {value: maxCommentLength.value}}
    })
    await updateSetting({
      variables: {id: allowGuestComment.id, input: {value: allowGuestComment.value}}
    })
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
      <Drawer.Header>
        <Drawer.Title>{t('navbar.settingsPanel.editSettings')}</Drawer.Title>

        <Drawer.Actions>
          <Button appearance={'primary'} onClick={() => handleSettingListUpdate()}>
            {t('navbar.settingsPanel.save')}
          </Button>
        </Drawer.Actions>
      </Drawer.Header>

      <Drawer.Body>
        <Panel>
          <Form fluid={true}>
            <Form.Group>
              <Form.ControlLabel>{t('navbar.settingsPanel.commentLength')}</Form.ControlLabel>
              <InputNumber
                max={
                  maxCommentLength?.settingRestriction?.maxValue
                    ? maxCommentLength.settingRestriction.maxValue
                    : undefined
                }
                value={maxCommentLength?.value}
                onChange={value => {
                  setMaxCommentLength({
                    id: maxCommentLength.id,
                    name: maxCommentLength.name,
                    value: value
                  })
                }}
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
              <Form.ControlLabel>Setting 2</Form.ControlLabel>
              <Toggle />
            </Form.Group>
          </Form>
        </Panel>
      </Drawer.Body>
    </>
  )
}
