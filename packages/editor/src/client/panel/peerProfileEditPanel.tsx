import React, {useState, useEffect} from 'react'

import {
  Button,
  Drawer,
  Icon,
  Panel,
  IconButton,
  Dropdown,
  Notification,
  Form,
  FormGroup,
  ControlLabel,
  FormControl
} from 'rsuite'

import {
  usePeerProfileQuery,
  useUpdatePeerProfileMutation,
  PeerProfileDocument,
  PeerProfileQuery
} from '../api'

import {ImageSelectPanel} from './imageSelectPanel'
import {ImagedEditPanel} from './imageEditPanel'
import {getOperationNameFromDocument} from '../utility'

import {useTranslation} from 'react-i18next'

type PeerProfileImage = NonNullable<PeerProfileQuery['peerProfile']>['logo']

export interface ImageEditPanelProps {
  onClose?(): void
  onSave?(): void
}

export function PeerInfoEditPanel({onClose, onSave}: ImageEditPanelProps) {
  const [isChooseModalOpen, setChooseModalOpen] = useState(false)
  const [isEditModalOpen, setEditModalOpen] = useState(false)

  const [logoImage, setLogoImage] = useState<PeerProfileImage>()
  const [name, setName] = useState('')
  const [themeColor, setThemeColor] = useState('')

  const {data, loading: isLoading, error: fetchError} = usePeerProfileQuery({
    fetchPolicy: 'network-only'
  })

  const [updateSettings, {loading: isSaving, error: saveError}] = useUpdatePeerProfileMutation({
    refetchQueries: [getOperationNameFromDocument(PeerProfileDocument)]
  })
  const isDisabled = isLoading || isSaving

  const {t} = useTranslation()

  useEffect(() => {
    if (data?.peerProfile) {
      setLogoImage(data.peerProfile.logo)
      setName(data.peerProfile.name)
      setThemeColor(data.peerProfile.themeColor)
    }
  }, [data?.peerProfile])

  useEffect(() => {
    if (fetchError || saveError) {
      Notification.error({
        title: t('peerList.panels.infoEditError'),
        description: fetchError?.message ?? saveError!.message,
        duration: 5000
      })
    }
  }, [fetchError, saveError])

  async function handleSave() {
    await updateSettings({
      variables: {
        input: {
          name,
          logoID: logoImage?.id,
          themeColor
        }
      }
    })

    Notification.success({
      title: t('peerList.panels.peerInfoUpdated'),
      duration: 2000
    })
    onClose?.()
  }

  return (
    <>
      <Drawer.Header>
        <Drawer.Title>{t('peerList.panels.editPeerInfo')}</Drawer.Title>
      </Drawer.Header>

      <Drawer.Body>
        <Panel
          bordered={true}
          style={{
            height: '200px',
            backgroundSize: 'cover',
            backgroundImage: `url(${
              logoImage?.previewURL ?? 'https://via.placeholder.com/240x240'
            })`
          }}>
          <Dropdown
            renderTitle={() => {
              return <IconButton appearance="subtle" icon={<Icon icon="wrench" />} circle />
            }}>
            <Dropdown.Item disabled={isLoading} onClick={() => setChooseModalOpen(true)}>
              <Icon icon="image" /> {t('peerList.panels.chooseImage')}
            </Dropdown.Item>
            <Dropdown.Item
              disabled={isLoading || !logoImage}
              onClick={() => setEditModalOpen(true)}>
              <Icon icon="pencil" /> {t('peerList.panels.editImage')}
            </Dropdown.Item>
            <Dropdown.Item
              disabled={isLoading || !logoImage}
              onClick={() => setLogoImage(undefined)}>
              <Icon icon="close" /> {t('peerList.panels.removeImage')}
            </Dropdown.Item>
          </Dropdown>
        </Panel>
        <Panel header={t('peerList.panels.information')}>
          <Form fluid={true}>
            <FormGroup>
              <ControlLabel>{t('peerList.panels.name')}</ControlLabel>
              <FormControl name="name" value={name} onChange={value => setName(value)} />
            </FormGroup>
            <FormGroup>
              <ControlLabel>{t('peerList.panels.themeColor')}</ControlLabel>
              <FormControl
                name="themeColor"
                value={themeColor}
                onChange={value => setThemeColor(value)}
              />
            </FormGroup>
          </Form>
        </Panel>
      </Drawer.Body>

      <Drawer.Footer>
        <Button appearance={'primary'} disabled={isDisabled} onClick={() => handleSave()}>
          {t('peerList.panels.save')}
        </Button>
        <Button appearance={'subtle'} onClick={() => onClose?.()}>
          {t('peerList.panels.close')}
        </Button>
      </Drawer.Footer>

      <Drawer show={isChooseModalOpen} size={'sm'}>
        <ImageSelectPanel
          onClose={() => setChooseModalOpen(false)}
          onSelect={value => {
            setChooseModalOpen(false)
            setLogoImage(value)
          }}
        />
      </Drawer>

      <Drawer show={isEditModalOpen} size={'sm'}>
        {logoImage && (
          <ImagedEditPanel id={logoImage!.id} onClose={() => setEditModalOpen(false)} />
        )}
      </Drawer>
    </>
  )
}
