import React, {useState, useEffect} from 'react'

import {toaster, Message, Button, Drawer, Form, Panel, Schema} from 'rsuite'
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
import {toggleRequiredLabel} from '../toggleRequiredLabel'

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

  const isDisabled = isLoading || isCreating || isUpdating
  const {t} = useTranslation()

  async function handleFetch() {
    try {
      const {data: remote} = await fetchRemote({
        hostURL: urlString,
        token
      })
      setProfile(remote?.remotePeerProfile ? remote.remotePeerProfile : null)
    } catch (error) {
      toaster.push(
        <Message type="error" showIcon closable duration={0}>
          {(error as Error).message}
        </Message>
      )
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
    if (error)
      toaster.push(
        <Message type="error" showIcon closable duration={0}>
          {error}
        </Message>
      )
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

  // Schema used for form validation
  const {StringType} = Schema.Types
  const validationModel = Schema.Model({
    name: StringType().isRequired(t('errorMessages.noNameErrorMessage')),
    url: StringType()
      .isRequired(t('errorMessages.noUrlErrorMessage'))
      .isURL(t('errorMessages.invalidUrlErrorMessage')),
    token: id ? StringType() : StringType().isRequired(t('errorMessages.noTokenErrorMessage'))
  })

  return (
    <>
      <Form
        fluid
        onSubmit={validationPassed => validationPassed && handleSave()}
        model={validationModel}
        formValue={{name: name, url: urlString, token: token}}
        style={{height: '100%'}}>
        <Drawer.Header>
          <Drawer.Title>
            {id ? t('peerList.panels.editPeer') : t('peerList.panels.createPeer')}
          </Drawer.Title>

          <Drawer.Actions>
            <Button
              type="submit"
              appearance="primary"
              data-testid="saveButton"
              disabled={isDisabled}>
              {id ? t('peerList.panels.save') : t('peerList.panels.create')}
            </Button>
            <Button appearance={'subtle'} onClick={() => onClose?.()}>
              {t('peerList.panels.close')}
            </Button>
          </Drawer.Actions>
        </Drawer.Header>

        <Drawer.Body>
          <Panel>
            <Form.Group controlId="name">
              <Form.ControlLabel>
                {toggleRequiredLabel(t('peerList.panels.name'))}
              </Form.ControlLabel>

              <Form.Control
                value={name}
                name="name"
                onChange={(value: string) => {
                  setName(value)
                  setSlug(slugify(value))
                }}
              />
            </Form.Group>
            <Form.Group controlId="url">
              <Form.ControlLabel>{toggleRequiredLabel(t('peerList.panels.URL'))}</Form.ControlLabel>
              <Form.Control
                value={urlString}
                name="url"
                onChange={(value: string) => {
                  setURLString(value)
                }}
              />
            </Form.Group>
            <Form.Group controlId="token">
              <Form.ControlLabel>
                {toggleRequiredLabel(t('peerList.panels.token'), !id)}
              </Form.ControlLabel>

              <Form.Control
                value={token}
                name="token"
                placeholder={id ? t('peerList.panels.leaveEmpty') : undefined}
                onChange={(value: string) => {
                  setToken(value)
                }}
              />
            </Form.Group>
            <Button className="fetchButton" appearance="primary" onClick={() => handleFetch()}>
              {t('peerList.panels.getRemote')}
            </Button>
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
                      }}
                    />
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
                      }}
                    />
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
      </Form>
    </>
  )
}
