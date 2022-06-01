import React, {useEffect, useState} from 'react'

// import {useTranslation} from 'react-i18next'
import {Button, Drawer, Form, Toggle, Panel, InputNumber, Notification, toaster} from 'rsuite'
import {SettingInput, useSettingListQuery, useSettingQuery, useUpdateSettingMutation} from '../api'

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

  const {data: settingListData, refetch} = useSettingListQuery()
  const {data: settingData} = useSettingQuery({variables: {name: 'ALLOW_GUEST_COMMENTING'}})
  console.log('setting data', settingData)
  const [settingList, setSettingList] = useState(settingListData?.settings)
  console.log('setting list', settingList)
  console.log('setting list', settingListData)
  const [maxCommentLength, setMaxCommentLength] = useState<number>(
    settingListData?.settings.find(setting => setting.name === 'MAXIMUM_COMMENT_LENGTH')?.value
  )

  const [canCommentAnon, setCanCommentAnon] = useState<boolean>(
    settingListData?.settings.find(setting => setting.name === 'ALLOW_GUEST_COMMENTING')?.value
  )

  useEffect(() => {
    setSettingList(settingListData?.settings)
    setMaxCommentLength(
      settingListData?.settings.find(setting => setting.name === 'MAXIMUM_COMMENT_LENGTH')?.value
    )
  }, [settingListData])

  const maxCommentSetting = settingListData?.settings.find(
    setting => setting.name === 'MAXIMUM_COMMENT_LENGTH'
  )

  const anonCommentingSetting = settingListData?.settings.find(
    setting => setting.name === 'ALLOW_GUEST_COMMENTING'
  )

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
      name: maxCommentSetting?.name ?? 'maximum comment length',
      value: maxCommentLength
    }
    handleSettingUpdate(maxCommentSetting?.id, maxInput)

    const anonInput: SettingInput = {
      name: anonCommentingSetting?.name ?? 'ALLOW_GUEST_COMMENTING',
      value: canCommentAnon
    }
    handleSettingUpdate(anonCommentingSetting?.id, anonInput)
  }

  useEffect(() => {
    const id = settingList?.find(setting => setting.name === 'MAXIMUM_COMMENT_LENGTH')?.id
    console.log(id)
    console.log('max value', maxCommentLength)
  }, [maxCommentLength])

  useEffect(() => {
    const error = updateSettingError
    if (error) toaster.push(<Notification type="error" header={error.message} duration={2000} />)
  }, [updateSettingError])

  console.log(
    'setting max',
    settingList?.find(v => v.name === 'MAXIMUM_COMMENT_LENGTH')
  )
  return (
    <>
      <Drawer.Header>
        {/* eslint-disable-next-line i18next/no-literal-string */}
        <Drawer.Title>Edit Settings</Drawer.Title>
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
                  maxCommentSetting?.settingRestriction?.maxValue
                    ? maxCommentSetting.settingRestriction.maxValue
                    : undefined
                }
                value={maxCommentLength}
                onChange={value => {
                  setMaxCommentLength(Number(value))
                }}
              />
            </Form.Group>
            <Form.Group>
              {/* eslint-disable-next-line i18next/no-literal-string */}
              <Form.ControlLabel>Allow Anonymous Commenting</Form.ControlLabel>
              <Toggle
                checked={canCommentAnon}
                onChange={() => setCanCommentAnon(!canCommentAnon)}
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

      <Drawer.Footer>
        {/* eslint-disable-next-line i18next/no-literal-string */}
        <Button appearance={'primary'} onClick={() => handleSettingListUpdate()}>
          Save
        </Button>
      </Drawer.Footer>
    </>
  )
}
