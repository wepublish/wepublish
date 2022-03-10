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
  Message
} from 'rsuite'

import {
  usePeerProfileQuery,
  useUpdatePeerProfileMutation,
  PeerProfileDocument,
  PeerProfileQuery,
  Maybe,
  ImageRefFragment
} from '../api'

import {ImageSelectPanel} from './imageSelectPanel'
import {ImagedEditPanel} from './imageEditPanel'
import {getOperationNameFromDocument, validateURL} from '../utility'

import {ChooseEditImage} from '../atoms/chooseEditImage'
import {createDefaultValue, RichTextBlock} from '../blocks/richTextBlock/richTextBlock'
import {RichTextBlockValue} from '../blocks/types'
import {ColorPicker} from '../atoms/colorPicker'
import {FormControlUrl} from '../atoms/formControlUrl'

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
  const [themeFontColor, setThemeFontColor] = useState('')
  const [callToActionText, setCallToActionText] = useState<RichTextBlockValue>(createDefaultValue())
  const [callToActionTextURL, setCallToActionTextURL] = useState('')
  const [callToActionImage, setCallToActionImage] = useState<Maybe<ImageRefFragment>>()
  const [callToActionImageURL, setCallToActionImageURL] = useState('')
  const [isLogoChange, setIsLogoChange] = useState(false)
  const [validCallToActionURL, setValidCallToActionURL] = useState(true)

  const {data, loading: isLoading, error: fetchError} = usePeerProfileQuery({
    fetchPolicy: 'network-only'
  })

  const [updateSettings, {loading: isSaving, error: saveError}] = useUpdatePeerProfileMutation({
    refetchQueries: [getOperationNameFromDocument(PeerProfileDocument)]
  })
  const isDisabled = isLoading || isSaving || validCallToActionURL

  const {t} = useTranslation()

  useEffect(() => {
    if (data?.peerProfile) {
      setLogoImage(data.peerProfile.logo)
      setName(data.peerProfile.name)
      setThemeColor(data.peerProfile.themeColor)
      setThemeFontColor(data.peerProfile.themeFontColor)
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

  useEffect(() => {
    const checkCallToActionURL = async () => {
      const isValidTextURL = validateURL(callToActionTextURL)
      const isValidImageURL = validateURL(callToActionImageURL)
      setValidCallToActionURL(!(isValidTextURL && isValidImageURL))
    }
    checkCallToActionURL()
  }, [callToActionTextURL, callToActionImageURL])

  async function handleSave() {
    await updateSettings({
      variables: {
        input: {
          name,
          logoID: logoImage?.id,
          themeColor,
          themeFontColor,
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
        </Panel>
        <Panel header={t('peerList.panels.information')}>
          <Form fluid={true}>
            <FormGroup>
              <ControlLabel>{t('peerList.panels.name')}</ControlLabel>
              <FormControl name="name" value={name} onChange={value => setName(value)} />
            </FormGroup>
            <FormGroup>
              <ControlLabel>{t('peerList.panels.themeColor')}</ControlLabel>
              <ColorPicker
                setColor={color => {
                  setThemeColor(color)
                }}
                currentColor={themeColor}
              />
            </FormGroup>
            <FormGroup>
              <ControlLabel>{t('peerList.panels.themeFontColor')}</ControlLabel>
              <ColorPicker
                setColor={color => {
                  setThemeFontColor(color)
                }}
                currentColor={themeFontColor}
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
                <FormControlUrl
                  placeholder={t('peerList.panels.URL')}
                  name="callToActionTextURL"
                  value={callToActionTextURL}
                  onChange={setCallToActionTextURL}
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
                <FormControlUrl
                  placeholder={t('peerList.panels.URL')}
                  name="callToActionImageURL"
                  value={callToActionImageURL}
                  onChange={setCallToActionImageURL}
                />
                <Message
                  style={{marginTop: '5px'}}
                  showIcon
                  type="info"
                  description={t('peerList.panels.ctaImageInfo')}
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
