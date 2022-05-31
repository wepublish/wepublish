import React, {useEffect, useState} from 'react'

// import {useTranslation} from 'react-i18next'
import {
  Button,
  ControlLabel,
  Drawer,
  Form,
  Toggle,
  FormGroup,
  Panel,
  InputNumber,
  Alert,
  Notification
} from 'rsuite'
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
    Notification.success({
      title: 'updated',
      duration: 2000
    })
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
    if (error) Alert.error(error.message, 0)
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
            <FormGroup>
              {/* eslint-disable-next-line i18next/no-literal-string */}
              <ControlLabel>Max comment chars</ControlLabel>
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
            </FormGroup>
            <FormGroup>
              {/* eslint-disable-next-line i18next/no-literal-string */}
              <ControlLabel>Allow Anonymous Commenting</ControlLabel>
              <Toggle
                checked={canCommentAnon}
                onChange={() => setCanCommentAnon(!canCommentAnon)}
              />
            </FormGroup>
            <FormGroup>
              {/* eslint-disable-next-line i18next/no-literal-string */}
              <ControlLabel>Setting 2</ControlLabel>
              <Toggle />
            </FormGroup>
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
