import React, {useEffect, useState} from 'react'
import {useTranslation} from 'react-i18next'
import {Button, Drawer, Form, Message, Panel, Schema, toaster} from 'rsuite'

import {
  NewsroomListDocument,
  useCreateNewsroomMutation,
  useNewsroomQuery,
  useRemotePeerProfileQuery,
  useUpdateNewsroomMutation
} from '../api'
import {ChooseEditImage} from '../atoms/chooseEditImage'
import {DescriptionList, DescriptionListItem} from '../atoms/descriptionList'
import {
  authorise,
  createCheckedPermissionComponent,
  PermissionControl
} from '../atoms/permissionControl'
import {RichTextBlock} from '../blocks/richTextBlock/richTextBlock'
import {toggleRequiredLabel} from '../toggleRequiredLabel'
import {getOperationNameFromDocument, slugify} from '../utility'

export interface PeerEditPanelProps {
  id?: string
  hostURL: string

  onClose?(): void
  onSave?(): void
}

function NewsroomEditPanel({id, hostURL, onClose, onSave}: PeerEditPanelProps) {
  const isAuthorized = authorise('CAN_CREATE_NEWSROOM')
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [urlString, setURLString] = useState('')
  const [token, setToken] = useState('')
  const [profile, setProfile] = useState<any | null>(null)

  const {data, loading: isLoading, error: loadError} = useNewsroomQuery({
    variables: {id: id!},
    fetchPolicy: 'network-only',
    skip: id === undefined
  })

  const [createPeer, {loading: isCreating, error: createError}] = useCreateNewsroomMutation({
    refetchQueries: [getOperationNameFromDocument(NewsroomListDocument)]
  })

  const [updatePeer, {loading: isUpdating, error: updateError}] = useUpdateNewsroomMutation({
    refetchQueries: [getOperationNameFromDocument(NewsroomListDocument)]
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
      setProfile(remote?.remotePeerProfile?.profile ? remote.remotePeerProfile : null)
    } catch (error) {
      toaster.push(
        <Message type="error" showIcon closable duration={0}>
          {(error as Error).message}
        </Message>
      )
    }
  }

  useEffect(() => {
    if (data?.newsroom) {
      setName(data.newsroom.name)
      setSlug(data.newsroom.slug ?? '')
      setURLString(data.newsroom.hostURL ?? '')
      setTimeout(() => {
        // setProfile in timeout because the useEffect that listens on
        // urlString and token will set it otherwise to null
        setProfile(data?.newsroom ? data.newsroom : null)
      }, 400)
    }
  }, [data?.newsroom])

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
        disabled={!isAuthorized}
        onSubmit={validationPassed => validationPassed && handleSave()}
        model={validationModel}
        formValue={{name, url: urlString, token}}
        style={{height: '100%'}}>
        <Drawer.Header>
          <Drawer.Title>
            {id ? t('peerList.panels.editPeer') : t('peerList.panels.createPeer')}
          </Drawer.Title>

          <Drawer.Actions>
            <PermissionControl qualifyingPermissions={['CAN_CREATE_NEWSROOM']}>
              <Button
                type="submit"
                appearance="primary"
                data-testid="saveButton"
                disabled={isDisabled}>
                {id ? t('save') : t('create')}
              </Button>
            </PermissionControl>
            <Button appearance={'subtle'} onClick={() => onClose?.()}>
              {t('peerList.panels.close')}
            </Button>
          </Drawer.Actions>
        </Drawer.Header>

        <Drawer.Body>
          <PermissionControl
            qualifyingPermissions={
              !id
                ? ['CAN_CREATE_NEWSROOM']
                : [
                    'CAN_GET_NEWSROOM',
                    'CAN_GET_NEWSROOMS',
                    'CAN_CREATE_NEWSROOM',
                    'CAN_DELETE_NEWSROOM'
                  ]
            }
            showRejectionMessage>
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
                <Form.ControlLabel>
                  {toggleRequiredLabel(t('peerList.panels.URL'))}
                </Form.ControlLabel>
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
              <Button
                disabled={!isAuthorized}
                className="fetchButton"
                appearance="primary"
                onClick={() => handleFetch()}>
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
                          backgroundColor: profile?.themeColor ?? '#000000',
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
                          backgroundColor: profile?.themeFontColor ?? '#FFFFFF',
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
                    {/* <img src={profile?.callToActionImage?.thumbURL || undefined} /> */}
                  </DescriptionListItem>
                  <DescriptionListItem label={t('peerList.panels.callToActionImageURL')}>
                    {profile?.callToActionImageURL}
                  </DescriptionListItem>
                </DescriptionList>
              </Panel>
            )}
          </PermissionControl>
        </Drawer.Body>
      </Form>
    </>
  )
}

const CheckedPermissionComponent = createCheckedPermissionComponent([
  'CAN_GET_NEWSROOMS',
  'CAN_GET_NEWSROOM',
  'CAN_CREATE_NEWSROOM',
  'CAN_DELETE_NEWSROOM'
])(NewsroomEditPanel)
export {CheckedPermissionComponent as NewsroomEditPanel}
