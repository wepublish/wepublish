import React, {useState, useEffect, useRef} from 'react'

import {Button, Drawer, Panel, Form, toaster, Message, Schema} from 'rsuite'

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
import {getOperationNameFromDocument} from '../utility'

import {ChooseEditImage} from '../atoms/chooseEditImage'
import {createDefaultValue, RichTextBlock} from '../blocks/richTextBlock/richTextBlock'
import {RichTextBlockValue} from '../blocks/types'
import {ColorPicker} from '../atoms/colorPicker'
import {useTranslation} from 'react-i18next'
import {FormInstance} from 'rsuite/esm/Form'
import {toggleRequiredLabel} from '../toggleRequiredLabel'

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
    if (error)
      toaster.push(
        <Message type="error" showIcon closable duration={0}>
          {error}
        </Message>
      )
  }, [fetchError, saveError])

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
    toaster.push(
      <Message type="success" showIcon closable duration={2000}>
        {t('peerList.panels.peerInfoUpdated')}
      </Message>
    )
    onClose?.()
  }

  const form = useRef<FormInstance>(null)
  const {StringType, ObjectType} = Schema.Types

  const validationModel = Schema.Model({
    name: StringType().isRequired(t('errorMessages.noNameErrorMessage')),
    // Validation for richText - not needed for now
    // callToActionText: ArrayType().of(
    //   ObjectType().shape({
    //     children: ArrayType().of(
    //       ObjectType().shape({
    //         text: StringType().isRequired(t('errorMessages.noCallToActionTextErrorMessage'))
    //       })
    //     )
    //   })
    // ),
    callToActionTextURL: StringType()
      .isURL(t('errorMessages.invalidUrlErrorMessage'))
      .isRequired(t('errorMessages.noUrlErrorMessage')),
    callToActionImage: ObjectType().isRequired(t('errorMessages.noCallToActionImageErrorMessage')),
    callToActionImageURL: StringType()
      .isURL(t('errorMessages.invalidUrlErrorMessage'))
      .isRequired(t('errorMessages.noUrlErrorMessage')),
    profileImg: StringType().isRequired(t('errorMessages.noImageErrorMessage'))
  })

  return (
    <>
      <Form
        onSubmit={validationPassed => validationPassed && handleSave()}
        fluid
        ref={form}
        model={validationModel}
        style={{height: '100%'}}
        formValue={{
          name: name,
          callToActionText: callToActionText,
          callToActionImage: callToActionImage,
          callToActionTextURL: callToActionTextURL,
          callToActionImageURL: callToActionImageURL,
          profileImg: logoImage?.id
        }}>
        <Drawer.Header>
          <Drawer.Title>{t('peerList.panels.editPeerInfo')}</Drawer.Title>
          <Drawer.Actions>
            <Button appearance="primary" disabled={isDisabled} type="submit">
              {t('peerList.panels.save')}
            </Button>
            <Button appearance={'subtle'} onClick={() => onClose?.()}>
              {t('peerList.panels.close')}
            </Button>
          </Drawer.Actions>
        </Drawer.Header>

        <Drawer.Body>
          <Panel bodyFill header={toggleRequiredLabel(t('peerList.panels.image'))}>
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
            <Form.Group
            // style={{height: '45px'}}
            >
              <Form.Control
                style={{display: 'none'}}
                name="profileImg"
                value={logoImage?.id || ''}
              />
            </Form.Group>
          </Panel>

          <Panel header={t('peerList.panels.information')}>
            <Form.Group>
              <Form.ControlLabel>
                {toggleRequiredLabel(t('peerList.panels.name'))}
              </Form.ControlLabel>
              <Form.Control name="name" value={name} onChange={(value: string) => setName(value)} />
            </Form.Group>
            <Form.Group>
              <Form.ControlLabel>{t('peerList.panels.themeColor')}</Form.ControlLabel>
              <ColorPicker
                setColor={color => {
                  setThemeColor(color)
                }}
                currentColor={themeColor}
              />
            </Form.Group>
            <Form.Group>
              <Form.ControlLabel>{t('peerList.panels.themeFontColor')}</Form.ControlLabel>
              <ColorPicker
                setColor={color => {
                  setThemeFontColor(color)
                }}
                currentColor={themeFontColor}
              />
            </Form.Group>

            <Form.ControlLabel>{t('peerList.panels.callToActionText')}</Form.ControlLabel>
            <div
              style={{
                border: 'solid 1px #cad5e4',
                borderRadius: '8px',
                padding: '12px',
                marginTop: '4px'
              }}>
              <Form.Group>
                <Form.ControlLabel>{t('peerList.panels.text')}</Form.ControlLabel>
                <Form.Control
                  name="callToActionText"
                  value={callToActionText}
                  onChange={setCallToActionText}
                  accepter={RichTextBlock}
                />
              </Form.Group>
              <Form.Group>
                <Form.Control
                  placeholder={t('peerList.panels.URL')}
                  name="callToActionTextURL"
                  value={callToActionTextURL}
                  onChange={setCallToActionTextURL}
                />
              </Form.Group>
            </div>
            <br />
            <Form.ControlLabel>
              {toggleRequiredLabel(t('peerList.panels.callToActionImage'))}
            </Form.ControlLabel>
            <div
              style={{
                border: 'solid 1px #cad5e4',
                borderRadius: '8px',
                padding: '12px',
                marginTop: '4px'
              }}>
              <Form.Group>
                <Form.ControlLabel>
                  {toggleRequiredLabel(t('peerList.panels.image'))}
                </Form.ControlLabel>
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
                <Form.Control
                  name="callToActionImage"
                  value={callToActionImage?.filename}
                  style={{display: 'none'}}
                />
              </Form.Group>
              <Form.Group>
                <Form.Control
                  placeholder={t('peerList.panels.URL')}
                  name="callToActionImageURL"
                  value={callToActionImageURL}
                  onChange={setCallToActionImageURL}
                />
                <Message style={{marginTop: '5px'}} showIcon type="info">
                  {t('peerList.panels.ctaImageInfo')}
                </Message>
              </Form.Group>
            </div>
          </Panel>
        </Drawer.Body>

        <Drawer open={isChooseModalOpen} size={'sm'} onClose={() => setChooseModalOpen(false)}>
          <ImageSelectPanel
            onClose={() => setChooseModalOpen(false)}
            onSelect={value => {
              setChooseModalOpen(false)
              isLogoChange ? setLogoImage(value) : setCallToActionImage(value)
              setTimeout(() => {
                form.current?.check?.()
              }, 500)
            }}
          />
        </Drawer>

        <Drawer open={isEditModalOpen} size={'sm'} onClose={() => setEditModalOpen(false)}>
          {(logoImage || callToActionImage) && (
            <ImagedEditPanel
              id={isLogoChange ? logoImage?.id : callToActionImage?.id}
              onClose={() => setEditModalOpen(false)}
            />
          )}
        </Drawer>
      </Form>
    </>
  )
}
