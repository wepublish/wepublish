import React, {useState, useEffect} from 'react'

import {
  Button,
  Drawer,
  Panel,
  Form,
  FormGroup,
  ControlLabel,
  FormControl,
  Alert,
  Modal
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
import {ChooseEditImage} from '../atoms/chooseEditImage'
import {createDefaultValue, RichTextBlock} from '../blocks/richTextBlock/richTextBlock'
import {RichTextBlockValue} from '../blocks/types'

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
  const [callToActionText, setCallToActionText] = useState<RichTextBlockValue>(createDefaultValue())
  const [callToActionURL, setCallToActionURL] = useState('')

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
      setCallToActionText(
        data.peerProfile.callToActionText.length
          ? data.peerProfile.callToActionText
          : createDefaultValue()
      )
      setCallToActionURL(data.peerProfile.callToActionURL)
    }
  }, [data?.peerProfile])

  useEffect(() => {
    const error = fetchError?.message ?? saveError?.message
    if (error) Alert.error(error, 0)
  }, [fetchError, saveError])

  async function handleSave() {
    await updateSettings({
      variables: {
        input: {
          name,
          logoID: logoImage?.id,
          themeColor,
          callToActionURL,
          callToActionText
        }
      }
    })
    Alert.success(t('peerList.panels.peerInfoUpdated'), 2000)
    onClose?.()
  }

  return (
    <>
      <Modal.Header>
        <Modal.Title>{t('peerList.panels.editPeerInfo')}</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <h5 className="wep-section-title">{t('peerList.panels.image')}</h5>
        <Panel bodyFill>
          <ChooseEditImage
            image={logoImage}
            header={''}
            top={0}
            left={20}
            disabled={isLoading}
            openChooseModalOpen={() => setChooseModalOpen(true)}
            openEditModalOpen={() => setEditModalOpen(true)}
            removeImage={() => setLogoImage(undefined)}
          />
        </Panel>

        <h5 className="wep-section-title">{t('peerList.panels.information')}</h5>

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
          <FormGroup>
            <ControlLabel>{t('peerList.panels.callToActionText')}</ControlLabel>
            <Panel bordered>
              <RichTextBlock value={callToActionText} onChange={setCallToActionText} />
            </Panel>
          </FormGroup>
          <FormGroup>
            <ControlLabel>{t('peerList.panels.callToActionURL')}</ControlLabel>
            <FormControl
              name="callToActionURL"
              value={callToActionURL}
              onChange={url => setCallToActionURL(url)}
            />
          </FormGroup>
        </Form>
      </Modal.Body>

      <Modal.Footer classPrefix="wep-modal-footer">
        <Button appearance={'primary'} disabled={isDisabled} onClick={() => handleSave()}>
          {t('peerList.panels.save')}
        </Button>
        <Button appearance={'subtle'} onClick={() => onClose?.()}>
          {t('peerList.panels.close')}
        </Button>
      </Modal.Footer>

      <Modal show={isChooseModalOpen} size={'sm'} onHide={() => setChooseModalOpen(false)}>
        <ImageSelectPanel
          onClose={() => setChooseModalOpen(false)}
          onSelect={value => {
            setChooseModalOpen(false)
            setLogoImage(value)
          }}
        />
      </Modal>

      <Modal show={isEditModalOpen} size={'sm'} onHide={() => setEditModalOpen(false)}>
        {logoImage && (
          <ImagedEditPanel id={logoImage!.id} onClose={() => setEditModalOpen(false)} />
        )}
      </Modal>
    </>
  )
}
