import React, {useState, useEffect} from 'react'

import {
  Alert,
  Button,
  ControlLabel,
  Drawer,
  Form,
  FormControl,
  FormGroup,
  Panel,
  HelpBlock
} from 'rsuite'
import {ChooseEditImage} from '../atoms/chooseEditImage'

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
import {RichTextBlock} from '../blocks/richTextBlock/richTextBlock'

export interface PeerEditPanelProps {
  id?: string
  hostURL: string

  onClose?(): void
  onSave?(): void
}

export function PeerEditPanel({id, hostURL, onClose, onSave}: PeerEditPanelProps) {
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [urlString, setURLString] = useState('')
  const [token, setToken] = useState('')

  const [isValidPeer, setValidPeer] = useState<boolean>()
  const [errorMessage, setErrorMessage] = useState('')
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

  const isDisabled =
    isLoading || isLoadingPeerProfile || isCreating || isUpdating || !isValidPeer || (!token && !id)

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
    setErrorMessage('')
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

          if (!response?.data?.peerProfile) {
            setValidPeer(false)
            setErrorMessage(t('peerList.panels.invalidURL'))
          } else if (response?.data?.peerProfile.hostURL === hostURL) {
            setValidPeer(false)
            setErrorMessage(t('peerList.panels.peeredToHost'))
          } else {
            setValidPeer(true)
            setProfile(response.data.peerProfile)
          }
        })
        .catch(err => {
          if (err.name === 'AbortError') return

          setLoadingPeerProfile(false)
          setValidPeer(false)
          setErrorMessage(t('peerList.panels.invalidURL'))
        })

      setValidPeer(undefined)
      setLoadingPeerProfile(true)

      return () => abortController?.abort()
    } catch (err) {
      setLoadingPeerProfile(false)
      setValidPeer(false)
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
                name={t('peerList.panels.name')}
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
                name={t('peerList.panels.URL')}
                errorMessage={errorMessage}
                onChange={value => {
                  setURLString(value)
                }}
              />
            </FormGroup>
            <FormGroup>
              <ControlLabel>{t('peerList.panels.token')}</ControlLabel>
              <FormControl
                value={token}
                name={t('peerList.panels.token')}
                placeholder={id ? t('peerList.panels.leaveEmpty') : undefined}
                onChange={value => {
                  setToken(value)
                }}
              />
              <HelpBlock>{token ? t('peerList.panels.validateToken') : ''}</HelpBlock>
            </FormGroup>
          </Form>
        </Panel>
        {!isLoadingPeerProfile && (token || id) && isValidPeer && (
          <Panel header={t('peerList.panels.information')}>
            <ChooseEditImage disabled image={profile?.logo} />
            <DescriptionList>
              <DescriptionListItem label={t('peerList.panels.name')}>
                {profile?.name}
              </DescriptionListItem>
              <DescriptionListItem label={t('peerList.panels.themeColor')}>
                <div style={{display: 'flex', flexDirection: 'row'}}>
                  <p>{profile?.themeColor}</p>
                  <div
                    style={{
                      backgroundColor: profile?.themeColor,
                      width: '30px',
                      height: '20px',
                      padding: '5px',
                      marginLeft: '5px'
                    }}></div>
                </div>
              </DescriptionListItem>
              <DescriptionListItem label={t('peerList.panels.callToActionText')}>
                {!!profile?.callToActionText && (
                  <RichTextBlock
                    disabled
                    displayOnly
                    // TODO: remove this
                    onChange={console.log}
                    value={profile?.callToActionText}
                  />
                )}
              </DescriptionListItem>
              <DescriptionListItem label={t('peerList.panels.callToActionURL')}>
                {profile?.callToActionURL}
              </DescriptionListItem>
              <DescriptionListItem label={t('peerList.panels.callToActionImage')}>
                <img src={profile?.callToActionImage?.thumbURL || undefined} />
              </DescriptionListItem>
              <DescriptionListItem label={t('peerList.panels.callToActionImageURL')}>
                {profile?.callToActionImageURL}
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
