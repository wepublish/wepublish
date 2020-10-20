import React, {useState, useEffect} from 'react'

import {
  Box,
  Spacing,
  Panel,
  PanelHeader,
  PanelSection,
  Toast,
  NavigationButton,
  PanelSectionHeader,
  TextInput,
  Drawer,
  PlaceholderInput,
  Card,
  ZIndex,
  IconButton,
  Image
} from '@karma.run/ui'

import {
  MaterialIconClose,
  MaterialIconSaveOutlined,
  MaterialIconImageOutlined,
  MaterialIconEditOutlined
} from '@karma.run/icons'

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

  const [isSuccessToastOpen, setSuccessToastOpen] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const [isErrorToastOpen, setErrorToastOpen] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

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
      setErrorToastOpen(true)
      setErrorMessage(fetchError?.message ?? saveError!.message)
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

    setSuccessToastOpen(true)
    setSuccessMessage('peerList.panels.peerInfoUpdated')
  }

  return (
    <>
      <Panel>
        <PanelHeader
          title={t('peerList.panels.editPeerInfo')}
          leftChildren={
            <NavigationButton
              icon={MaterialIconClose}
              label={t('peerList.panels.close')}
              onClick={() => onClose?.()}
            />
          }
          rightChildren={
            <NavigationButton
              icon={MaterialIconSaveOutlined}
              label={t('peerList.panels.save')}
              onClick={() => handleSave()}
              disabled={isDisabled}
            />
          }
        />
        {!isLoading && (
          <>
            <PanelSection dark>
              <Card height={200}>
                <PlaceholderInput onAddClick={() => setChooseModalOpen(true)}>
                  {logoImage && (
                    <Box position="relative" width="100%" height="100%">
                      <Box position="absolute" zIndex={ZIndex.Default} right={0} top={0}>
                        <Box
                          margin={Spacing.ExtraSmall}
                          flexDirection="row"
                          justifyContent="flex-end"
                          display="flex">
                          <IconButton
                            icon={MaterialIconImageOutlined}
                            title={t('peerList.panels.chooseImage')}
                            onClick={() => setChooseModalOpen(true)}
                          />
                        </Box>
                        <Box
                          margin={Spacing.ExtraSmall}
                          flexDirection="row"
                          justifyContent="flex-end"
                          display="flex">
                          <IconButton
                            icon={MaterialIconEditOutlined}
                            title={t('peerList.panels.editImage')}
                            onClick={() => setEditModalOpen(true)}
                          />
                        </Box>
                        <Box
                          margin={Spacing.ExtraSmall}
                          flexDirection="row"
                          justifyContent="flex-end"
                          display="flex">
                          <IconButton
                            icon={MaterialIconClose}
                            title={t('peerList.panels.removeImage')}
                            onClick={() => setLogoImage(undefined)}
                          />
                        </Box>
                      </Box>
                      {logoImage.previewURL && (
                        <Image src={logoImage.previewURL} width="100%" height={200} />
                      )}
                    </Box>
                  )}
                </PlaceholderInput>
              </Card>
            </PanelSection>
            <PanelSectionHeader title={t('peerList.panels.information')} />
            <PanelSection>
              <TextInput
                label={t('peerList.panels.name')}
                marginBottom={Spacing.ExtraSmall}
                value={name}
                onChange={e => setName(e.target.value)}
              />
              <TextInput
                label={t('peerList.panels.themeColor')}
                marginBottom={Spacing.ExtraSmall}
                value={themeColor}
                onChange={e => setThemeColor(e.target.value)}
              />
            </PanelSection>
          </>
        )}
      </Panel>

      <Drawer open={isChooseModalOpen} width={480}>
        {() => (
          <ImageSelectPanel
            onClose={() => setChooseModalOpen(false)}
            onSelect={value => {
              setChooseModalOpen(false)
              setLogoImage(value)
            }}
          />
        )}
      </Drawer>

      <Drawer open={isEditModalOpen} width={480}>
        {() => <ImagedEditPanel id={logoImage!.id} onClose={() => setEditModalOpen(false)} />}
      </Drawer>

      <Toast
        type="error"
        open={isErrorToastOpen}
        autoHideDuration={5000}
        onClose={() => setErrorToastOpen(false)}>
        {errorMessage}
      </Toast>

      <Toast
        type="success"
        open={isSuccessToastOpen}
        autoHideDuration={2000}
        onClose={() => setSuccessToastOpen(false)}>
        {successMessage}
      </Toast>
    </>
  )
}
