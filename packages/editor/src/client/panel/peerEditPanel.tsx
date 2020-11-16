import React, {useState, useEffect} from 'react'

import {Alert, Button, ControlLabel, Drawer, Form, FormControl, FormGroup, Panel} from 'rsuite'

import {
  PeerListDocument,
  useCreatePeerMutation,
  usePeerQuery,
  useUpdatePeerMutation,
  PeerProfileDocument,
  FullPeerProfileFragment
} from '../api'

import {slugify, getOperationNameFromDocument} from '../utility'

import {useTranslation} from 'react-i18next'
import {DescriptionList, DescriptionListItem} from '../atoms/descriptionList'

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

  const {t} = useTranslation()

  useEffect(() => {
    if (data?.peer) {
      setName(data.peer.name)
      setSlug(data.peer.slug)
      setURLString(data.peer.hostURL)
    }
  }, [data?.peer])

  useEffect(() => {
    const error = loadError?.message ?? createError?.message ?? updateError?.message
    if (error) Alert.error(error, 0)
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
      <Drawer.Header>
        <Drawer.Title>
          {id ? t('peerList.panels.editPeer') : t('peerList.panels.createPeer')}
        </Drawer.Title>
      </Drawer.Header>

      <Drawer.Body>
        <Panel>
          <Form fluid={true}>
            <FormGroup>
              <ControlLabel>{t('peerList.panels.name')}</ControlLabel>
              <FormControl
                value={name}
                onChange={value => {
                  setName(value)
                  setSlug(slugify(value))
                }}
              />
            </FormGroup>
            <FormGroup>
              <ControlLabel>{t('peerList.panels.URL')}</ControlLabel>
              <FormControl
                value={urlString}
                errorMessage={isValidURL === false ? 'Invalid URL' : undefined}
                onChange={value => {
                  setURLString(value)
                }}
              />
            </FormGroup>
            <FormGroup>
              <ControlLabel>{t('peerList.panels.token')}</ControlLabel>
              <FormControl
                value={token}
                placeholder={id ? "Leave empty if you don't want to change it" : undefined}
                onChange={value => {
                  setToken(value)
                }}
              />
            </FormGroup>
          </Form>
        </Panel>
        {!isLoadingPeerProfile && isValidURL && (
          <Panel header={t('peerList.panels.information')}>
            <Panel
              bordered={true}
              style={{
                height: '200px',
                marginBottom: '20px',
                backgroundSize: 'cover',
                backgroundImage: `url(${
                  profile?.logo?.previewURL ?? 'https://via.placeholder.com/240x240'
                }`
              }}
            />
            <DescriptionList>
              <DescriptionListItem label={t('peerList.panels.name')}>
                {profile?.name}
              </DescriptionListItem>
              <DescriptionListItem label={t('peerList.panels.themeColor')}>
                {profile?.themeColor}
              </DescriptionListItem>
            </DescriptionList>
          </Panel>
        )}
      </Drawer.Body>

      <Drawer.Footer>
        <Button appearance={'primary'} disabled={isDisabled} onClick={() => handleSave()}>
          {id ? t('peerList.panels.save') : t('peerList.panels.create')}
        </Button>
        <Button appearance={'subtle'} onClick={() => onClose?.()}>
          {t('peerList.panels.close')}
        </Button>
      </Drawer.Footer>
    </>
  )
}
