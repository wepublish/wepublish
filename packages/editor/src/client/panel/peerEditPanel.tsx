import React, {useState, useEffect} from 'react'

import {
  Spacing,
  Panel,
  PanelHeader,
  PanelSection,
  Toast,
  NavigationButton,
  TextInput,
  PanelSectionHeader,
  Image,
  PlaceholderImage,
  Card,
  DescriptionList,
  DescriptionListItem
} from '@karma.run/ui'

import {MaterialIconClose, MaterialIconSaveOutlined} from '@karma.run/icons'

import {
  PeerListDocument,
  useCreatePeerMutation,
  usePeerQuery,
  useUpdatePeerMutation,
  PeerProfileDocument,
  FullPeerProfileFragment
} from '../api'

import {slugify, getOperationNameFromDocument} from '../utility'

export interface ImageEditPanelProps {
  id?: string

  onClose?(): void
  onSave?(): void
}

export function PeerEditPanel({id, onClose, onSave}: ImageEditPanelProps) {
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [urlString, setURLString] = useState('')
  const [token, setToken] = useState('')

  const [isValidURL, setValidURL] = useState<boolean>()
  const [isLoadingPeerProfile, setLoadingPeerProfile] = useState(false)
  const [profile, setProfile] = useState<FullPeerProfileFragment>()

  const [isErrorToastOpen, setErrorToastOpen] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const {data, loading: isLoading, error: loadError} = usePeerQuery({
    variables: {id: id!},
    fetchPolicy: 'network-only',
    skip: id === undefined
  })

  const [createPeer, {loading: isCreating, error: createError}] = useCreatePeerMutation({
    refetchQueries: [getOperationNameFromDocument(PeerListDocument)]
  })

  const [updatePeer, {loading: isUpdating, error: updateError}] = useUpdatePeerMutation({
    refetchQueries: [getOperationNameFromDocument(PeerListDocument)]
  })

  const isDisabled = isLoading || isLoadingPeerProfile || isCreating || isUpdating || !isValidURL

  useEffect(() => {
    if (data?.peer) {
      setName(data.peer.name)
      setSlug(data.peer.slug)
      setURLString(data.peer.hostURL)
    }
  }, [data?.peer])

  useEffect(() => {
    if (createError) {
      setErrorToastOpen(true)
      setErrorMessage(createError.message)
    }
  }, [createError])

  useEffect(() => {
    if (loadError) {
      setErrorToastOpen(true)
      setErrorMessage(loadError.message)
    } else if (createError) {
      setErrorToastOpen(true)
      setErrorMessage(createError.message)
    } else if (updateError) {
      setErrorToastOpen(true)
      setErrorMessage(updateError.message)
    }
  }, [loadError, createError, updateError])

  useEffect(() => {
    if (urlString === '') return

    // NOTICE: `useQuery` refetch doesn't cancel and tends to clog up on timeout.
    // So we manually handle the preview request.
    try {
      const url = new URL(urlString)
      const abortController =
        typeof AbortController !== 'undefined' ? new AbortController() : undefined

      fetch(url.toString(), {
        method: 'POST',
        headers: {'Content-Type': 'application/json; charset=utf-8'},
        body: JSON.stringify({query: PeerProfileDocument.loc!.source.body}),
        signal: abortController?.signal
      })
        .then(response => {
          if (response.status !== 200) throw new Error()
          return response.json()
        })
        .then(response => {
          setLoadingPeerProfile(false)

          // TODO: Better validation
          if (response?.data?.peerProfile) {
            setValidURL(true)
            setProfile(response.data.peerProfile)
          } else {
            setValidURL(false)
          }
        })
        .catch(err => {
          if (err.name === 'AbortError') return

          setLoadingPeerProfile(false)
          setValidURL(false)
        })

      setValidURL(undefined)
      setLoadingPeerProfile(true)

      return () => abortController?.abort()
    } catch (err) {
      setLoadingPeerProfile(false)
      setValidURL(false)
      return () => {
        /* do nothing */
      }
    }
  }, [urlString])

  async function handleSave() {
    if (id) {
      await updatePeer({
        variables: {
          id,
          input: {
            name,
            slug,
            hostURL: new URL(urlString).toString(),
            token: token || undefined
          }
        }
      })
    } else {
      await createPeer({
        variables: {
          input: {
            name,
            slug,
            hostURL: new URL(urlString).toString(),
            token
          }
        }
      })
    }

    onSave?.()
  }

  return (
    <>
      <Panel>
        <PanelHeader
          title={id ? 'Edit Peer' : 'Create Peer'}
          leftChildren={
            <NavigationButton icon={MaterialIconClose} label="Close" onClick={() => onClose?.()} />
          }
          rightChildren={
            <NavigationButton
              icon={MaterialIconSaveOutlined}
              label={id ? 'Save' : 'Create'}
              onClick={() => handleSave()}
              disabled={isDisabled}
            />
          }
        />
        <PanelSection>
          <TextInput
            label="Name"
            marginBottom={Spacing.ExtraSmall}
            value={name}
            onChange={e => {
              setName(e.target.value)
              setSlug(slugify(e.target.value))
            }}
          />
          <TextInput
            label="URL"
            marginBottom={Spacing.ExtraSmall}
            value={urlString}
            errorMessage={isValidURL === false ? 'Invalid URL' : undefined}
            onChange={e => {
              setURLString(e.target.value)
            }}
          />
          <TextInput
            label="Token"
            marginBottom={Spacing.ExtraSmall}
            value={token}
            description={id ? "Leave empty if you don't want to change it" : undefined}
            onChange={e => {
              setToken(e.target.value)
            }}
          />
        </PanelSection>
        <PanelSectionHeader title="Information" />
        {isLoadingPeerProfile ? null : isValidURL ? (
          <>
            <PanelSection dark>
              <Card marginBottom={Spacing.Medium} height={200}>
                {profile?.logo ? (
                  <Image src={profile.logo.previewURL!} width="100%" height="100%" />
                ) : (
                  <PlaceholderImage width="100%" height="100%" />
                )}
              </Card>
              <DescriptionList>
                <DescriptionListItem label="Name">{profile?.name}</DescriptionListItem>
                <DescriptionListItem label="Theme Color">{profile?.themeColor}</DescriptionListItem>
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
    </>
  )
}
