import CogIcon from '@rsuite/icons/legacy/Cog'
import TrashIcon from '@rsuite/icons/legacy/Trash'
import React, {useEffect, useState, useMemo} from 'react'
import {Trans, useTranslation} from 'react-i18next'
import {Link, useLocation, useNavigate, useParams} from 'react-router-dom'
import {
  Avatar,
  Button,
  Divider,
  Drawer,
  FlexboxGrid,
  Form,
  IconButton,
  List,
  Message,
  Modal,
  toaster
} from 'rsuite'

import {
  NewsroomListDocument,
  NewsroomListQuery,
  useDeleteNewsroomMutation,
  useNewsroomListQuery,
  useUpdateNewsroomMutation
} from '../api'
import {DescriptionList, DescriptionListItem} from '../atoms/descriptionList'
import {IconButtonTooltip} from '../atoms/iconButtonTooltip'
import {NavigationBar} from '../atoms/navigationBar'
import {createCheckedPermissionComponent, PermissionControl} from '../atoms/permissionControl'
import {NewsroomEditPanel} from '../panel/newsroomEditPanel'
import {NewsroomInfoEditPanel} from '../panel/newsroomProfileEditPanel'
import {addOrUpdateOneInArray} from '../utility'

type Newsroom = NonNullable<NewsroomListQuery['newsrooms']>[number]

function NewsroomList() {
  const location = useLocation()
  const params = useParams()
  const navigate = useNavigate()
  const {id} = params

  const isCreateRoute = location.pathname.includes('create')
  const isPeerEditRoute = location.pathname.includes('peering/edit')
  const isPeerProfileEditRoute = location.pathname.includes('peering/profile/edit')
  const isAuthorRoute = location.pathname.includes('author')

  const [isPeerProfileEditModalOpen, setPeerProfileEditModalOpen] = useState(isPeerProfileEditRoute)
  const [isEditModalOpen, setEditModalOpen] = useState(isPeerProfileEditRoute)
  const [editID, setEditID] = useState<string | undefined>(isAuthorRoute ? id : undefined)
  const [isConfirmationDialogOpen, setConfirmationDialogOpen] = useState(false)
  const [currentNewsroom, setCurrentNewsroom] = useState<Newsroom>()

  const {
    data: newsroomListData,
    loading: isNewsroomListLoading,
    error: newsroomListError
  } = useNewsroomListQuery({
    fetchPolicy: 'network-only',
    errorPolicy: 'ignore'
  })

  const peerProfile = useMemo(() => {
    return newsroomListData?.newsrooms?.find(newsroom => newsroom.isSelf)
  }, [newsroomListData])

  const [deleteNewsroom, {loading: isDeleting}] = useDeleteNewsroomMutation()
  const [updateNewsroom, {loading: isUpdating}] = useUpdateNewsroomMutation()

  const {t} = useTranslation()

  useEffect(() => {
    const error = newsroomListError?.message
    if (error)
      toaster.push(
        <Message type="error" showIcon closable duration={0}>
          {error}
        </Message>
      )
  }, [newsroomListError])

  useEffect(() => {
    if (isPeerProfileEditRoute) {
      setPeerProfileEditModalOpen(true)
    }

    if (isCreateRoute) {
      setEditID(undefined)
      setEditModalOpen(true)
    }

    if (isPeerEditRoute) {
      setEditID(id)
      setEditModalOpen(true)
    }
  }, [location])

  const newsrooms = newsroomListData?.newsrooms
    ?.filter(newsroom => !newsroom.isSelf)
    ?.map(newsroom => {
      const {id, name, hostURL, isDisabled, logo} = newsroom
      return (
        <Link to={isDisabled ? '#' : `/peering/edit/${id}`} key={name}>
          <List.Item style={{cursor: isDisabled ? 'default' : 'pointer'}}>
            <FlexboxGrid>
              <FlexboxGrid.Item
                colspan={2}
                style={{
                  textAlign: 'center'
                }}>
                <Avatar circle src={logo?.squareURL || undefined} alt={name?.substr(0, 2)} />
              </FlexboxGrid.Item>
              <FlexboxGrid.Item colspan={18}>
                <h5>{name}</h5>
                <p>
                  {name && `${name} - `}
                  {hostURL}
                </p>
              </FlexboxGrid.Item>
              <FlexboxGrid.Item colspan={3}>
                <PermissionControl qualifyingPermissions={['CAN_CREATE_NEWSROOM']}>
                  <Button
                    appearance="primary"
                    disabled={isUpdating}
                    onClick={async e => {
                      e.preventDefault()
                      await updateNewsroom({
                        variables: {id, input: {isDisabled: !isDisabled}},
                        update: cache => {
                          const query = cache.readQuery<NewsroomListQuery>({
                            query: NewsroomListDocument
                          })

                          if (!query) return

                          cache.writeQuery({
                            query: NewsroomListDocument,
                            data: {
                              peers: addOrUpdateOneInArray(query.newsrooms, {
                                ...newsroom,
                                isDisabled: !isDisabled
                              })
                            }
                          })
                        }
                      })
                    }}>
                    {isDisabled ? t('peerList.overview.enable') : t('peerList.overview.disable')}
                  </Button>
                </PermissionControl>
              </FlexboxGrid.Item>
              <FlexboxGrid.Item colspan={1} style={{textAlign: 'center'}}>
                <PermissionControl qualifyingPermissions={['CAN_DELETE_NEWSROOM']}>
                  <IconButtonTooltip caption={t('delete')}>
                    <IconButton
                      disabled={isNewsroomListLoading}
                      icon={<TrashIcon />}
                      circle
                      size="sm"
                      onClick={e => {
                        e.preventDefault()
                        setConfirmationDialogOpen(true)
                        setCurrentNewsroom(newsroom)
                      }}
                    />
                  </IconButtonTooltip>
                </PermissionControl>
              </FlexboxGrid.Item>
            </FlexboxGrid>
          </List.Item>
        </Link>
      )
    })

  return (
    <>
      <PermissionControl qualifyingPermissions={['CAN_GET_NEWSROOM']}>
        <h5>{t('peerList.overview.myPeerProfile')}</h5>
        <div style={{border: 'solid 2px #3498ff', padding: '10px', borderRadius: '5px'}}>
          <NavigationBar
            centerChildren={
              <div style={{textAlign: 'center'}}>
                <Avatar
                  size="lg"
                  circle
                  style={{border: 'solid 2px #3498ff'}}
                  src={peerProfile?.logo?.squareURL || undefined}
                  alt={peerProfile?.name?.substr(0, 2)}
                />
                <h5>{peerProfile?.name || t('peerList.panels.unnamed')}</h5>
                <p>{peerProfile?.hostURL}</p>
                <Form.HelpText>
                  <Trans i18nKey={'peerList.panels.checkOwnPeerProfileHelpBlock'}>
                    text{' '}
                    <a
                      href="https://wepublish.ch/peering-infos-preview/"
                      target="_blank"
                      rel="noreferrer"
                    />
                  </Trans>
                </Form.HelpText>
              </div>
            }
            rightChildren={
              <PermissionControl qualifyingPermissions={['CAN_UPDATE_NEWSROOM']}>
                <IconButtonTooltip caption={t('peerList.overview.editProfile')}>
                  <Link to="/peering/profile/edit">
                    <IconButton size="lg" appearance="link" icon={<CogIcon />} circle />
                  </Link>
                </IconButtonTooltip>
              </PermissionControl>
            }
          />
        </div>
      </PermissionControl>

      <FlexboxGrid>
        <FlexboxGrid.Item colspan={24}>
          <Divider />
        </FlexboxGrid.Item>
        <FlexboxGrid.Item colspan={16}>
          <h2>{t('peerList.overview.peers')}</h2>
        </FlexboxGrid.Item>
        <FlexboxGrid.Item colspan={8} style={{textAlign: 'right'}}>
          <Link to="/peering/create">
            <PermissionControl qualifyingPermissions={['CAN_CREATE_NEWSROOM']}>
              <Button appearance="primary" disabled={isNewsroomListLoading}>
                {t('peerList.overview.newPeer')}
              </Button>
            </PermissionControl>
          </Link>
        </FlexboxGrid.Item>
      </FlexboxGrid>
      <div style={{marginTop: '20px'}}>
        {newsroomListData?.newsrooms?.length ? (
          <List>{newsrooms}</List>
        ) : !isNewsroomListLoading ? (
          <p>{t('peerList.overview.noPeersFound')}</p>
        ) : null}
      </div>

      <Drawer
        open={isPeerProfileEditModalOpen}
        size={'sm'}
        onClose={() => {
          setPeerProfileEditModalOpen(false)
          navigate('/peering')
        }}>
        <NewsroomInfoEditPanel
          onClose={() => {
            setPeerProfileEditModalOpen(false)
            navigate('/peering')
          }}
        />
      </Drawer>

      <Drawer
        open={isEditModalOpen}
        size={'sm'}
        onClose={() => {
          setEditModalOpen(false)
          navigate('/peering')
        }}>
        {peerProfile?.hostURL && (
          <NewsroomEditPanel
            id={editID}
            hostURL={peerProfile?.hostURL ?? ''}
            onClose={() => {
              setEditModalOpen(false)
              navigate('/peering')
            }}
            onSave={() => {
              setEditModalOpen(false)
              toaster.push(
                <Message type="success" showIcon closable duration={2000}>
                  {editID ? t('peerList.panels.peerUpdated') : t('peerList.panels.peerCreated')}
                </Message>
              )
              navigate('/peering')
            }}
          />
        )}
      </Drawer>

      <Modal open={isConfirmationDialogOpen} onClose={() => setConfirmationDialogOpen(false)}>
        <Modal.Header>
          <Modal.Title>{t('peerList.panels.deletePeer')}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <DescriptionList>
            <DescriptionListItem label={t('peerList.panels.name')}>
              {currentNewsroom?.name || t('peerList.panels.unknown')}
            </DescriptionListItem>
          </DescriptionList>
        </Modal.Body>
        <Modal.Footer>
          <Button
            disabled={isDeleting}
            color="red"
            onClick={async () => {
              if (!currentNewsroom) return
              await deleteNewsroom({
                variables: {id: currentNewsroom.id},
                update: cache => {
                  const query = cache.readQuery<NewsroomListQuery>({
                    query: NewsroomListDocument
                  })

                  if (!query) return

                  cache.writeQuery<NewsroomListQuery>({
                    query: NewsroomListDocument,
                    data: {
                      newsrooms: query.newsrooms?.filter(peer => peer.id !== currentNewsroom.id)
                    }
                  })
                }
              })
              setConfirmationDialogOpen(false)
            }}>
            {t('peerList.panels.confirm')}
          </Button>
          <Button onClick={() => setConfirmationDialogOpen(false)} appearance="subtle">
            {t('peerList.panels.cancel')}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  )
}
const CheckedPermissionComponent = createCheckedPermissionComponent([
  'CAN_GET_NEWSROOMS',
  'CAN_GET_NEWSROOM',
  'CAN_DELETE_NEWSROOM',
  'CAN_CREATE_NEWSROOM',
  'CAN_UPDATE_NEWSROOM'
])(NewsroomList)
export {CheckedPermissionComponent as NewsroomList}
