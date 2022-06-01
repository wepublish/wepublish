import React, {useEffect, useState} from 'react'

// import {useTranslation} from 'react-i18next'
import {Button, Drawer, Form, InputNumber, Notification, Panel, toaster, Toggle} from 'rsuite'
import {
  Setting,
  SettingInput,
  SettingName,
  useSettingListQuery,
  useUpdateSettingMutation
} from '../api'

export type SettingInputProps = {
  id?: string
  value: any
}

export function SettingsPanel() {
  /*
   // check permissions
   const {data} = useMeQuery()
   console.log('data', data?.me?.roles)
 */

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

  async function handleSettingUpdate(id: string | undefined, input: SettingInput) {
    if (!id) return
    await updateSetting({variables: {id: id, input: input}})
    // eslint-disable-next-line i18next/no-literal-string
    toaster.push(<Notification type="success" header="updated successfully" duration={2000} />)
    await refetch()
  }

  async function handleSettingListUpdate() {
    const maxInput: SettingInput = {
      value: maxCommentLength.value
    }
    await handleSettingUpdate(maxCommentLength.id, maxInput)

    const anonInput: SettingInput = {
      value: allowGuestComment.value
    }
    await handleSettingUpdate(allowGuestComment.id, anonInput)
  }

  useEffect(() => {
    const error = updateSettingError ?? err
    if (error) toaster.push(<Notification type="error" header={error.message} duration={2000} />)
  }, [err, updateSettingError])

  return (
    <>
      <Drawer.Header>
        {/* eslint-disable-next-line i18next/no-literal-string */}
        <Drawer.Title>Edit Settings</Drawer.Title>

        <Drawer.Actions>
          {/* eslint-disable-next-line i18next/no-literal-string */}
          <Button appearance={'primary'} onClick={() => handleSettingListUpdate()}>
            save
          </Button>
        </Drawer.Actions>
      </Drawer.Header>

      <Drawer.Body>
        <Panel>
          <Form fluid={true}>
            <Form.Group>
              {/* eslint-disable-next-line i18next/no-literal-string */}
              <Form.ControlLabel>Max comment chars</Form.ControlLabel>
              {/* TODO set restrictions on setting values */}
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
              {/* eslint-disable-next-line i18next/no-literal-string */}
              <Form.ControlLabel>Allow Anonymous Commenting</Form.ControlLabel>
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
