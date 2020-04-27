import React, {useState, useEffect} from 'react'

import {
  Spacing,
  Panel,
  PanelHeader,
  PanelSection,
  Toast,
  NavigationButton,
  TextInput,
  Typography,
  PanelSectionHeader,
  Avatar,
  Image,
  PlaceholderImage,
  Card,
  DescriptionList,
  DescriptionListItem
} from '@karma.run/ui'

import {
  MaterialIconClose,
  MaterialIconSaveOutlined,
  MaterialIconAdd,
  MaterialIconAddCircle,
  MaterialIconAddCircleOutlineOutlined
} from '@karma.run/icons'

import {useUpdatePeerInfoMutation, PeerInfoData, PeerInfoQuery} from '../api/peering'

export interface ImageEditPanelProps {
  onClose?(): void
  onSave?(): void
}

export function PeerAddPanel({onClose, onSave}: ImageEditPanelProps) {
  const [urlString, setURLString] = useState('')

  const [isValidURL, setValidURL] = useState<boolean>()
  const [isLoading, setLoading] = useState(false)
  const [data, setData] = useState<PeerInfoData>()

  const [isSuccessToastOpen, setSuccessToastOpen] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const [isErrorToastOpen, setErrorToastOpen] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const [updateSettings, {loading: isSaving, error: saveError}] = useUpdatePeerInfoMutation()
  const isDisabled = isLoading || isSaving || !isValidURL

  useEffect(() => {
    if (saveError) {
      setErrorToastOpen(true)
      setErrorMessage(saveError.message)
    }
  }, [saveError])

  useEffect(() => {
    if (urlString == '') return

    // NOTICE: `useQuery` refetch doesn't cancel and tends to clog up on timeout.
    // So we manually handle the preview request.
    try {
      const url = new URL(urlString)
      const abortController =
        typeof AbortController != 'undefined' ? new AbortController() : undefined

      fetch(url.toString(), {
        method: 'POST',
        headers: {'Content-Type': 'application/json; charset=utf-8'},
        body: JSON.stringify({query: PeerInfoQuery.loc!.source.body}),
        signal: abortController?.signal
      })
        .then(response => {
          if (response.status !== 200) throw new Error()
          return response.json()
        })
        .then(response => {
          setLoading(false)

          // TODO: Better validation
          if (response?.data?.peerInfo) {
            setValidURL(true)
            setData(response.data)
          } else {
            setValidURL(false)
          }
        })
        .catch(err => {
          if (err.name === 'AbortError') return

          setLoading(false)
          setValidURL(false)
        })

      setValidURL(undefined)
      setLoading(true)

      return () => abortController?.abort()
    } catch (err) {
      setLoading(false)
      setValidURL(false)
      return () => {}
    }
  }, [urlString])

  async function handleSave() {
    // await updateSettings({
    //   variables: {
    //     input: {
    //       name: urlString,
    //       logoID: logoImage?.id
    //     }
    //   }
    // })
    // setSuccessToastOpen(true)
    // setSuccessMessage('Peer Info Updated')
  }

  return (
    <>
      <Panel>
        <PanelHeader
          title={'Add Peer'}
          leftChildren={
            <NavigationButton
              icon={MaterialIconClose}
              label={'Close'}
              onClick={() => onClose?.()}
            />
          }
          rightChildren={
            <NavigationButton
              icon={MaterialIconAddCircleOutlineOutlined}
              label={'Add'}
              onClick={() => handleSave()}
              disabled={isDisabled}
            />
          }
        />
        <PanelSection>
          <TextInput
            label="URL"
            marginBottom={Spacing.ExtraSmall}
            value={urlString}
            errorMessage={isValidURL === false ? 'Invalid URL' : undefined}
            onChange={e => {
              setURLString(e.target.value)
            }}
          />
        </PanelSection>
        {isLoading ? null : isValidURL ? (
          <>
            <PanelSectionHeader title="Information" />
            <PanelSection dark>
              <Card marginBottom={Spacing.Medium} height={200}>
                {data?.peerInfo.logo ? (
                  <Image src={data.peerInfo.logo.previewURL} width="100%" height="100%" />
                ) : (
                  <PlaceholderImage width="100%" height="100%" />
                )}
              </Card>
              <DescriptionList>
                <DescriptionListItem label="Name">{data?.peerInfo.name}</DescriptionListItem>
                <DescriptionListItem label="Theme Color">
                  {data?.peerInfo.themeColor}
                </DescriptionListItem>
              </DescriptionList>
            </PanelSection>
          </>
        ) : null}
      </Panel>

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
