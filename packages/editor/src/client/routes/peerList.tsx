import React, {useState, useEffect} from 'react'

import {RouteActionType} from '@wepublish/karma.run-react'

import {
  RouteType,
  useRoute,
  useRouteDispatch,
  PeerListRoute,
  PeerCreateRoute,
  PeerEditRoute,
  routeLink
} from '../route'

import {
  usePeerListQuery,
  usePeerProfileQuery,
  useDeletePeerMutation,
  PeerListDocument,
  PeerListQuery
} from '../api'

import {PeerEditPanel} from '../panel/peerEditPanel'

import {useTranslation} from 'react-i18next'
import {
  Drawer,
  FlexboxGrid,
  List,
  Avatar,
  Icon,
  IconButton,
  Button,
  Divider,
  Modal,
  Alert,
  Popover,
  Whisper
} from 'rsuite'
import {DescriptionList, DescriptionListItem} from '../atoms/descriptionList'
import {NavigationBar} from '../atoms/navigationBar'
import {PeerInfoEditPanel} from '../panel/peerProfileEditPanel'

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
const ListItemLink = routeLink(List.Item)
const ButtonLink = routeLink(Button)

type Peer = NonNullable<PeerListQuery['peers']>[number]

export function PeerList() {
  const {current} = useRoute()
  const dispatch = useRouteDispatch()

  const [isEditModalOpen, setEditModalOpen] = useState(current?.type === RouteType.PeerProfileEdit)

  const [editID, setEditID] = useState<string | undefined>(
    current?.type === RouteType.AuthorEdit ? current.params.id : undefined
  )

  const [isConfirmationDialogOpen, setConfirmationDialogOpen] = useState(false)
  const [currentPeer, setCurrentPeer] = useState<Peer>()

  const {
    data: peerInfoData,
    loading: isPeerInfoLoading,
    error: peerInfoError
  } = usePeerProfileQuery({fetchPolicy: 'network-only'})

  const {data: peerListData, loading: isPeerListLoading, error: peerListError} = usePeerListQuery({
    fetchPolicy: 'network-only',
    errorPolicy: 'ignore'
  })

  const [deletePeer, {loading: isDeleting}] = useDeletePeerMutation()

  const {t} = useTranslation()

  useEffect(() => {
    const error = peerInfoError?.message ?? peerListError?.message
    if (error) Alert.error(error, 0)
  }, [peerInfoError, peerListError])

  useEffect(() => {
    switch (current?.type) {
      case RouteType.PeerCreate:
        setEditID(undefined)
        setEditModalOpen(true)
        break

      case RouteType.PeerEdit:
        setEditID(current.params.id)
        setEditModalOpen(true)
        break
    }
  }, [current])

  const [menuIsOpen, setMenuIsOpen] = useState<boolean>(false)

  const peers = peerListData?.peers?.map((peer, index) => {
    const {id, name, profile, hostURL} = peer

    return (
      <ListItemLink
        key={name}
        index={index}
        route={PeerEditRoute.create({id})}
        style={{cursor: 'pointer'}}>
        <FlexboxGrid>
          <FlexboxGrid.Item
            colspan={2}
            style={{
              textAlign: 'center'
            }}>
            <Avatar
              circle
              src={profile?.logo?.squareURL || undefined}
              alt={profile?.name?.substr(0, 2)}
            />
          </FlexboxGrid.Item>
          <FlexboxGrid.Item colspan={21}>
            <h5>{name}</h5>
            <p>
              {profile && `${profile.name} - `}
              {hostURL}
            </p>
          </FlexboxGrid.Item>
          <FlexboxGrid.Item colspan={1} style={{textAlign: 'center'}}>
            <IconButton
              disabled={isPeerInfoLoading}
              icon={<Icon icon="trash" />}
              circle
              size="sm"
              onClick={e => {
                e.preventDefault()
                setConfirmationDialogOpen(true)
                setCurrentPeer(peer)
              }}
            />
          </FlexboxGrid.Item>
        </FlexboxGrid>
      </ListItemLink>
    )
  })

  return (
    <>
      <div style={{border: 'solid 4px #f7f7fa', padding: '10px', borderRadius: '5px'}}>
        <NavigationBar
          centerChildren={
            <div style={{textAlign: 'center'}}>
              {' '}
              <Avatar
                size="lg"
                circle
                src={peerInfoData?.peerProfile?.logo?.squareURL || undefined}
                alt={peerInfoData?.peerProfile?.name?.substr(0, 2)}
              />
              <h5>{peerInfoData?.peerProfile.name || t('peerList.panels.unnamed')}</h5>
              <p>{peerInfoData?.peerProfile.hostURL}</p>
            </div>
          }
          rightChildren={
            <Whisper
              enterable
              open={menuIsOpen}
              onBlur={() => setMenuIsOpen(true)}
              onClick={() => setMenuIsOpen(!menuIsOpen)}
              placement="autoHorizontalStart"
              // width set at 500px to allow for richtext toolbar
              speaker={
                <Popover style={{width: '500px'}}>
                  <PeerInfoEditPanel
                    onClose={() => setMenuIsOpen(false)}
                    onSave={() => setMenuIsOpen(false)}
                  />
                </Popover>
              }>
              <IconButton icon={<Icon icon={'ellipsis-v'} />} />
            </Whisper>
          }
        />
      </div>

      <FlexboxGrid>
        <FlexboxGrid.Item colspan={24}>
          <Divider />
        </FlexboxGrid.Item>
        <FlexboxGrid.Item colspan={16}>
          <h2>{t('peerList.overview.peers')}</h2>
        </FlexboxGrid.Item>
        <FlexboxGrid.Item colspan={8} style={{textAlign: 'right'}}>
          <ButtonLink
            appearance="primary"
            disabled={isPeerListLoading}
            route={PeerCreateRoute.create({})}>
            {t('peerList.overview.newPeer')}
          </ButtonLink>
        </FlexboxGrid.Item>
      </FlexboxGrid>
      <div style={{marginTop: '20px'}}>
        {peerListData?.peers?.length ? (
          <List>{peers}</List>
        ) : !isPeerListLoading ? (
          <p>{t('peerList.overview.noPeersFound')}</p>
        ) : null}
      </div>

      <Drawer show={isEditModalOpen} size={'sm'} onHide={() => setEditModalOpen(false)}>
        {peerInfoData?.peerProfile.hostURL && (
          <PeerEditPanel
            id={editID}
            hostURL={peerInfoData.peerProfile.hostURL}
            onClose={() => {
              setEditModalOpen(false)

              dispatch({
                type: RouteActionType.PushRoute,
                route: PeerListRoute.create({})
              })
            }}
            onSave={() => {
              setEditModalOpen(false)

              Alert.success(
                editID ? t('peerList.panels.peerUpdated') : t('peerList.panels.peerCreated'),
                2000
              )

              dispatch({
                type: RouteActionType.PushRoute,
                route: PeerListRoute.create({})
              })
            }}
          />
        )}
      </Drawer>

      <Modal show={isConfirmationDialogOpen} onHide={() => setConfirmationDialogOpen(false)}>
        <Modal.Header>
          <Modal.Title>{t('peerList.panels.deletePeer')}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <DescriptionList>
            <DescriptionListItem label={t('peerList.panels.name')}>
              {currentPeer?.name || t('peerList.panels.unknown')}
            </DescriptionListItem>
          </DescriptionList>
        </Modal.Body>
        <Modal.Footer>
          <Button
            disabled={isDeleting}
            color="red"
            onClick={async () => {
              if (!currentPeer) return
              await deletePeer({
                variables: {id: currentPeer.id},
                update: cache => {
                  const query = cache.readQuery<PeerListQuery>({
                    query: PeerListDocument
                  })

                  if (!query) return

                  cache.writeQuery<PeerListQuery>({
                    query: PeerListDocument,
                    data: {
                      peers: query.peers?.filter(peer => peer.id !== currentPeer.id)
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
