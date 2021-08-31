import React, {useState, useEffect} from 'react'

import {Button, Drawer, Panel, Form, FormGroup, ControlLabel, FormControl, Alert, FlexboxGrid} from 'rsuite'

import {
  usePeerProfileQuery,
  useUpdatePeerProfileMutation,
  PeerProfileDocument,
  PeerProfileQuery,
  Maybe,
  ImageRefFragment
} from '../api'

import {ImageSelectPanel} from '../panel/imageSelectPanel'
import {ImagedEditPanel} from '../panel/imageEditPanel'
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

export function MyPeerInfo({onClose, onSave}: ImageEditPanelProps) {
  const [isChooseModalOpen, setChooseModalOpen] = useState(false)
  const [isEditModalOpen, setEditModalOpen] = useState(false)

  const [logoImage, setLogoImage] = useState<PeerProfileImage>()
  const [name, setName] = useState('')
  const [themeColor, setThemeColor] = useState('')
  const [callToActionText, setCallToActionText] = useState<RichTextBlockValue>(createDefaultValue())
  const [callToActionTextURL, setCallToActionTextURL] = useState('')
  const [callToActionImage, setCallToActionImage] = useState<Maybe<ImageRefFragment>>()
  const [callToActionImageURL, setCallToActionImageURL] = useState<string | undefined>()
  const [isLogoChange, setIsLogoChange] = useState(false)

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
      setCallToActionImage(data?.peerProfile?.callToActionImage)
      setCallToActionImageURL(data.peerProfile.callToActionImageURL ?? '')
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
          callToActionURL: callToActionTextURL,
          callToActionImageID: callToActionImage?.id,
          callToActionImageURL
        }
      }
    })
    Alert.success(t('peerList.panels.peerInfoUpdated'), 2000)
    onClose?.()
  }

  return (
    <>
      <FlexboxGrid style={{marginBottom : '10px'}}>
        <FlexboxGrid.Item colspan={16}>
          <h2>{t('peerList.panels.editPeerInfo')}</h2>
        </FlexboxGrid.Item>
      </FlexboxGrid>
      <div>
        <div>{t('peerList.panels.image')}</div>
        <br></br>
        <div>
          <ChooseEditImage
            image={logoImage}
            header={''}
            top={0}
            left={20}
            disabled={isLoading}
            openChooseModalOpen={() => {
              setIsLogoChange(true)
              setChooseModalOpen(true)
            }}
            openEditModalOpen={() => {
              setIsLogoChange(true)
              setEditModalOpen(true)
            }}
            removeImage={() => setLogoImage(undefined)}
          />
        </div>
        <div>{t('peerList.panels.information')}</div>
        <br></br>
        <div>
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

            <ControlLabel>{t('peerList.panels.callToActionText')}</ControlLabel>
            <div
              style={{
                border: 'solid 1px #cad5e4',
                borderRadius: '8px',
                padding: '12px',
                marginTop: '4px'
              }}>
              <FormGroup>
                <ControlLabel>{t('peerList.panels.text')}</ControlLabel>
                <RichTextBlock value={callToActionText} onChange={setCallToActionText} />
              </FormGroup>
              <FormGroup>
                <FormControl
                  placeholder={t('peerList.panels.URL')}
                  name="callToActionTextURL"
                  value={callToActionTextURL}
                  onChange={url => setCallToActionTextURL(url)}
                />
              </FormGroup>
            </div>
            <br />
            <ControlLabel>{t('peerList.panels.callToActionImage')}</ControlLabel>
            <div
              style={{
                border: 'solid 1px #cad5e4',
                borderRadius: '8px',
                padding: '12px',
                marginTop: '4px'
              }}>
              <FormGroup>
                <ControlLabel>{t('peerList.panels.image')}</ControlLabel>
                <ChooseEditImage
                  image={callToActionImage}
                  header={''}
                  top={0}
                  left={20}
                  disabled={isLoading}
                  openChooseModalOpen={() => {
                    setIsLogoChange(false)
                    setChooseModalOpen(true)
                  }}
                  openEditModalOpen={() => {
                    setIsLogoChange(false)
                    setEditModalOpen(true)
                  }}
                  removeImage={() => setCallToActionImage(undefined)}
                />
              </FormGroup>
              <FormGroup>
                <FormControl
                  placeholder={t('peerList.panels.URL')}
                  name="callToActionImageURL"
                  value={callToActionImageURL}
                  onChange={url => setCallToActionImageURL(url)}
                />
              </FormGroup>
            </div>
          </Form>
        </div>

        <Button appearance={'primary'} disabled={isDisabled} onClick={() => handleSave()} style={{float: 'right'}}>
          {t('peerList.panels.save')}
        </Button>
      </div>

      <Drawer show={isChooseModalOpen} size={'sm'} onHide={() => setChooseModalOpen(false)}>
        <ImageSelectPanel
          onClose={() => setChooseModalOpen(false)}
          onSelect={value => {
            setChooseModalOpen(false)
            isLogoChange ? setLogoImage(value) : setCallToActionImage(value)
          }}
        />
      </Drawer>

      <Drawer show={isEditModalOpen} size={'sm'} onHide={() => setEditModalOpen(false)}>
        {(logoImage || callToActionImage) && (
          <ImagedEditPanel
            id={isLogoChange ? logoImage?.id : callToActionImage?.id}
            onClose={() => setEditModalOpen(false)}
          />
        )}
      </Drawer>
    </>
  )
}
