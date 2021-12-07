import React, {useState, useEffect} from 'react'

import {Alert, Button, ControlLabel, Drawer, Form, FormControl, FormGroup, Panel} from 'rsuite'
import {ChooseEditImage} from '../atoms/chooseEditImage'

import {
  PeerListDocument,
  useCreatePeerMutation,
  usePeerQuery,
  useUpdatePeerMutation,
  FullPeerProfileFragment,
  useRemotePeerProfileQuery
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
  const [profile, setProfile] = useState<FullPeerProfileFragment | null>(null)

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

  const {refetch: fetchRemote} = useRemotePeerProfileQuery({skip: true})

  const isDisabled = isLoading || isCreating || isUpdating || !profile || !name

  const {t} = useTranslation()

  async function handleFetch() {
    try {
      const {data: remote} = await fetchRemote({
        hostURL: urlString,
        token
      })
      setProfile(remote?.remotePeerProfile ? remote.remotePeerProfile : null)
    } catch (error) {
      Alert.error(error.message, 0)
    }
  }

  useEffect(() => {
    if (data?.peer) {
      setName(data.peer.name)
      setSlug(data.peer.slug)
      setURLString(data.peer.hostURL)
      setTimeout(() => {
        // setProfile in timeout because the useEffect that listens on
        // urlString and token will set it otherwise to null
        setProfile(data?.peer?.profile ? data.peer.profile : null)
      }, 400)
    }
  }, [data?.peer])

  useEffect(() => {
    const error = loadError?.message ?? createError?.message ?? updateError?.message
    if (error) Alert.error(error, 0)
  }, [loadError, createError, updateError])

  useEffect(() => {
    setProfile(null)
  }, [urlString, token])

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
            </FormGroup>
            <Button
              className="fetchButton"
              appearance={'primary'}
              disabled={!urlString || !token}
              onClick={() => handleFetch()}>
              {t('peerList.panels.getRemote')}
            </Button>
          </Form>
        </Panel>
        {profile && (
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
                      marginLeft: '5px',
                      border: '1px solid #575757'
                    }}></div>
                </div>
              </DescriptionListItem>
              <DescriptionListItem label={t('peerList.panels.themeFontColor')}>
                <div style={{display: 'flex', flexDirection: 'row'}}>
                  <p>{profile?.themeFontColor}</p>
                  <div
                    style={{
                      backgroundColor: profile?.themeFontColor,
                      width: '30px',
                      height: '20px',
                      padding: '5px',
                      marginLeft: '5px',
                      border: '1px solid #575757'
                    }}></div>
                </div>
              </DescriptionListItem>
              <DescriptionListItem label={t('peerList.panels.callToActionText')}>
                {profile?.callToActionString}
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
