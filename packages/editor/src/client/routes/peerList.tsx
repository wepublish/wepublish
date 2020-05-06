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
  Button
} from '@karma.run/ui'

import {RouteActionType} from '@karma.run/react'
import {MaterialIconSettings} from '@karma.run/icons'

import {
  RouteLinkIconButton,
  PeerInfoEditRoute,
  RouteType,
  useRoute,
  useRouteDispatch,
  PeerListRoute
} from '../route'

import {usePeerListQuery, usePeerInfoQuery} from '../api/peering'
import {PeerInfoEditPanel} from '../panel/peerInfoEditPanel'
import {PeerAddPanel} from '../panel/peerAddPanel'

export function PeerList() {
  const {current} = useRoute()
  const dispatch = useRouteDispatch()

  const [isPeerInfoEditModalOpen, setPeerInfoEditModalOpen] = useState(
    current?.type === RouteType.PeerInfoEdit
  )

  const [isPeerAddModalOpen, setPeerAddModalOpen] = useState(
    current?.type === RouteType.PeerInfoEdit
  )

  const [isSuccessToastOpen, setSuccessToastOpen] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const [isErrorToastOpen, setErrorToastOpen] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const {
    data: peerInfoData,
    refetch: refetchPeerInfo,
    loading: isPeerInfoLoading,
    error: peerInfoError
  } = usePeerInfoQuery({fetchPolicy: 'network-only'})

  const {
    data: peerListData,
    refetch: refetchPeerList,
    loading: isPeerListLoading,
    error: peerListError
  } = usePeerListQuery({fetchPolicy: 'network-only'})

  useEffect(() => {
    if (peerInfoError ?? peerListError) {
      setErrorToastOpen(true)
      setErrorMessage(peerInfoError?.message ?? peerListError!.message)
    }
  }, [peerInfoError])

  useEffect(() => {
    if (current?.type === RouteType.PeerInfoEdit) {
      setPeerInfoEditModalOpen(true)
    }
  }, [current])

  return (
    <>
      <Box display="flex" alignItems="center" marginBottom={Spacing.Small}>
        <Avatar flexShrink={0} marginRight={Spacing.ExtraSmall} width={75} height={75}>
          {peerInfoData?.peerInfo.logo ? (
            <Image src={peerInfoData.peerInfo.logo.squareURL} width="100%" height="100%" />
          ) : (
            <PlaceholderImage width="100%" height="100%" />
          )}
        </Avatar>
        <Box width="100%">
          <Typography variant="body2">{peerInfoData?.peerInfo.name}</Typography>
          <Typography variant="subtitle2" color="grayDark">
            {peerInfoData?.peerInfo.hostURL}
          </Typography>
        </Box>
        <RouteLinkIconButton icon={MaterialIconSettings} route={PeerInfoEditRoute.create({})} />
      </Box>

      <Box marginBottom={Spacing.Small} flexDirection="row" alignItems="center" display="flex">
        <Typography variant="h1">Peers</Typography>
        <Box flexGrow={1} />
        <Button
          color="primary"
          label="Add Peer"
          disabled={isPeerInfoLoading}
          onClick={() => setPeerAddModalOpen(true)}
        />
      </Box>
      {isPeerListLoading
        ? null
        : peerListData?.peers.map(peer => (
            <Box key={peer.id} marginBottom={Spacing.Small}>
              <Box display="flex" alignItems="center" marginBottom={Spacing.ExtraSmall}>
                <Avatar flexShrink={0} marginRight={Spacing.ExtraSmall} width={50} height={50}>
                  {peer.info?.logo ? (
                    <Image src={peer.info.logo.squareURL} width="100%" height="100%" />
                  ) : (
                    <PlaceholderImage width="100%" height="100%" />
                  )}
                </Avatar>
                <Box width="100%">
                  <Typography variant="body2" color={peer.info ? 'dark' : 'alertDark'}>
                    {peer.info?.name ?? peer.name}
                  </Typography>
                  <Typography variant="subtitle2" color="grayDark">
                    {peer.hostURL}
                  </Typography>
                </Box>
                <RouteLinkIconButton icon={MaterialIconSettings} />
              </Box>
              <Divider />
            </Box>
          ))}

      <Drawer open={isPeerInfoEditModalOpen} width={480}>
        {() => (
          <PeerInfoEditPanel
            onClose={() => {
              setPeerInfoEditModalOpen(false)
              refetchPeerInfo()
              dispatch({
                type: RouteActionType.PushRoute,
                route: PeerListRoute.create({})
              })
            }}
          />
        )}
      </Drawer>

      <Drawer open={isPeerAddModalOpen} width={480}>
        {() => (
          <PeerAddPanel
            onClose={() => {
              setPeerAddModalOpen(false)
              setSuccessToastOpen(true)
              setSuccessMessage('Peering Requested')
              refetchPeerList()
              dispatch({
                type: RouteActionType.PushRoute,
                route: PeerListRoute.create({})
              })
            }}
          />
        )}
      </Drawer>

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
