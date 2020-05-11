import React, {useState, useEffect} from 'react'

import {
  Typography,
  Box,
  Spacing,
  Image,
  Drawer,
  Toast,
  Avatar,
  PlaceholderImage,
  Divider,
  IconButton,
  Dialog,
  Panel,
  PanelHeader,
  NavigationButton,
  PanelSection,
  DescriptionList,
  DescriptionListItem
} from '@karma.run/ui'

import {RouteActionType} from '@karma.run/react'

import {
  MaterialIconSettings,
  MaterialIconDeleteOutline,
  MaterialIconClose,
  MaterialIconCheck
} from '@karma.run/icons'

import {
  RouteLinkIconButton,
  PeerInfoEditRoute,
  RouteType,
  useRoute,
  useRouteDispatch,
  PeerListRoute,
  RouteLinkButton,
  PeerCreateRoute,
  Link,
  PeerEditRoute
} from '../route'

import {
  usePeerListQuery,
  usePeerProfileQuery,
  useDeletePeerMutation,
  PeerListDocument,
  PeerListQuery
} from '../api'

import {PeerInfoEditPanel} from '../panel/peerProfileEditPanel'
import {PeerEditPanel} from '../panel/peerEditPanel'

type Peer = NonNullable<PeerListQuery['peers']>[number]

export function PeerList() {
  const {current} = useRoute()
  const dispatch = useRouteDispatch()

  const [isPeerProfileEditModalOpen, setPeerProfileEditModalOpen] = useState(
    current?.type === RouteType.PeerProfileEdit
  )

  const [isEditModalOpen, setEditModalOpen] = useState(current?.type === RouteType.PeerProfileEdit)

  const [editID, setEditID] = useState<string | undefined>(
    current?.type === RouteType.AuthorEdit ? current.params.id : undefined
  )

  const [isConfirmationDialogOpen, setConfirmationDialogOpen] = useState(false)
  const [currentPeer, setCurrentPeer] = useState<Peer>()

  const [isSuccessToastOpen, setSuccessToastOpen] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const [isErrorToastOpen, setErrorToastOpen] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

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

  useEffect(() => {
    if (peerInfoError ?? peerListError) {
      setErrorToastOpen(true)
      setErrorMessage(peerInfoError?.message ?? peerListError!.message)
    }
  }, [peerInfoError, peerListError])

  useEffect(() => {
    switch (current?.type) {
      case RouteType.PeerProfileEdit:
        setPeerProfileEditModalOpen(true)
        break

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

  const peers = peerListData?.peers?.map(peer => {
    const {id, name, profile, hostURL} = peer

    return (
      <Box key={id} marginBottom={Spacing.Small}>
        <Box display="flex" alignItems="center" marginBottom={Spacing.ExtraSmall}>
          <Avatar flexShrink={0} marginRight={Spacing.ExtraSmall} width={50} height={50}>
            {profile?.logo?.squareURL ? (
              <Image src={profile.logo.squareURL} width="100%" height="100%" />
            ) : (
              <PlaceholderImage width="100%" height="100%" />
            )}
          </Avatar>
          <Box width="100%">
            <Link route={PeerEditRoute.create({id})}>
              <Typography variant="body2" color={profile ? 'dark' : 'alertDark'}>
                {name}
              </Typography>
            </Link>
            <Typography variant="subtitle2" color="grayDark">
              {profile && `${profile.name} - `}
              {hostURL}
            </Typography>
          </Box>
          <IconButton
            icon={MaterialIconDeleteOutline}
            onClick={() => {
              setConfirmationDialogOpen(true)
              setCurrentPeer(peer)
            }}
          />
        </Box>
        <Divider />
      </Box>
    )
  })

  return (
    <>
      <Box display="flex" alignItems="center" marginBottom={Spacing.Small}>
        <Avatar flexShrink={0} marginRight={Spacing.ExtraSmall} width={75} height={75}>
          {peerInfoData?.peerProfile?.logo?.squareURL ? (
            <Image src={peerInfoData.peerProfile.logo.squareURL} width="100%" height="100%" />
          ) : (
            <PlaceholderImage width="100%" height="100%" />
          )}
        </Avatar>
        <Box width="100%">
          <Typography variant="body2">{peerInfoData?.peerProfile.name}</Typography>
          <Typography variant="subtitle2" color="grayDark">
            {peerInfoData?.peerProfile.hostURL}
          </Typography>
        </Box>
        <RouteLinkIconButton icon={MaterialIconSettings} route={PeerInfoEditRoute.create({})} />
      </Box>

      <Box marginBottom={Spacing.Large}>
        <Box marginBottom={Spacing.Small} flexDirection="row" alignItems="center" display="flex">
          <Typography variant="h1">Peers</Typography>
          <Box flexGrow={1} />
          <RouteLinkButton
            color="primary"
            label="New Peer"
            disabled={isPeerInfoLoading}
            route={PeerCreateRoute.create({})}
          />
        </Box>
        {peerListData?.peers?.length ? (
          peers
        ) : !isPeerListLoading ? (
          <Typography variant="body1" color="gray" align="center">
            No peers found
          </Typography>
        ) : null}
      </Box>

      <Drawer open={isPeerProfileEditModalOpen} width={480}>
        {() => (
          <PeerInfoEditPanel
            onClose={() => {
              setPeerProfileEditModalOpen(false)

              dispatch({
                type: RouteActionType.PushRoute,
                route: PeerListRoute.create({})
              })
            }}
          />
        )}
      </Drawer>

      <Drawer open={isEditModalOpen} width={480}>
        {() => (
          <PeerEditPanel
            id={editID}
            onClose={() => {
              setEditModalOpen(false)

              dispatch({
                type: RouteActionType.PushRoute,
                route: PeerListRoute.create({})
              })
            }}
            onSave={() => {
              setEditModalOpen(false)

              setSuccessToastOpen(true)
              setSuccessMessage(editID ? 'Peer Updated' : 'Peer Created')

              dispatch({
                type: RouteActionType.PushRoute,
                route: PeerListRoute.create({})
              })
            }}
          />
        )}
      </Drawer>

      <Dialog open={isConfirmationDialogOpen} width={340}>
        {() => (
          <Panel>
            <PanelHeader
              title="Delete Peer?"
              leftChildren={
                <NavigationButton
                  icon={MaterialIconClose}
                  label="Cancel"
                  onClick={() => setConfirmationDialogOpen(false)}
                />
              }
              rightChildren={
                <NavigationButton
                  icon={MaterialIconCheck}
                  label="Confirm"
                  disabled={isDeleting}
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
                  }}
                />
              }
            />
            <PanelSection>
              <DescriptionList>
                <DescriptionListItem label="Name">
                  {currentPeer?.name || 'Unknown'}
                </DescriptionListItem>
              </DescriptionList>
            </PanelSection>
          </Panel>
        )}
      </Dialog>

      <Toast
        type="success"
        open={isSuccessToastOpen}
        autoHideDuration={2000}
        onClose={() => setSuccessToastOpen(false)}>
        {successMessage}
      </Toast>

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
