import React, {useState, useEffect} from 'react'

import {Button, Drawer, Panel, Form, FormGroup, ControlLabel, FormControl, Alert} from 'rsuite'

import {
  usePeerProfileQuery,
  useUpdatePeerProfileMutation,
  PeerProfileDocument,
  PeerProfileQuery,
  Image
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
  const [callToActionTextURL, setCallToActionTextURL] = useState('')
  const [callToActionImageID, setCallToActionImageID] = useState<Image>()
  const [callToActionImageURL, setCallToActionImageURL] = useState('')

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
      setCallToActionTextURL(data.peerProfile.callToActionURL)
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
          callToActionText,
          callToActionTextURL,
          callToActionImageID,
          callToActionImageURL
        }
      }
    })
    Alert.success(t('peerList.panels.peerInfoUpdated'), 2000)
    onClose?.()
  }

  return (
    <>
      <Drawer.Header>
        <Drawer.Title>{t('peerList.panels.editPeerInfo')}</Drawer.Title>
      </Drawer.Header>

      <Drawer.Body>
        <Panel bodyFill header={t('peerList.panels.image')}>
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

            <ControlLabel>Call to action text</ControlLabel>
            <div style={{border: 'solid 1px #cad5e4', borderRadius: '8px', padding: '16px'}}>
              <FormGroup>
                <ControlLabel>text</ControlLabel>
                <RichTextBlock value={callToActionText} onChange={setCallToActionText} />
              </FormGroup>

              <FormGroup>
                <FormControl
                  placeholder="URL"
                  name="callToActionTextURL"
                  value={callToActionTextURL}
                  onChange={url => setCallToActionTextURL(url)}
                />
              </FormGroup>
            </div>
            <br />
            <ControlLabel>Call to action image</ControlLabel>
            <div style={{border: 'solid 1px #cad5e4', borderRadius: '8px', padding: '10px'}}>
              <FormGroup>
                <ControlLabel>image</ControlLabel>
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
              </FormGroup>

              <FormGroup>
                <ControlLabel>url</ControlLabel>
                <FormControl
                  name="callToActionTextURL"
                  value={callToActionTextURL}
                  onChange={url => setCallToActionTextURL(url)}
                />
              </FormGroup>
            </div>
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

      <Drawer show={isChooseModalOpen} size={'sm'} onHide={() => setChooseModalOpen(false)}>
        <ImageSelectPanel
          onClose={() => setChooseModalOpen(false)}
          onSelect={value => {
            setChooseModalOpen(false)
            setLogoImage(value)
          }}
        />
      </Drawer>

      <Drawer show={isEditModalOpen} size={'sm'} onHide={() => setEditModalOpen(false)}>
        {logoImage && (
          <ImagedEditPanel id={logoImage!.id} onClose={() => setEditModalOpen(false)} />
        )}
      </Drawer>
    </>
  )
}
