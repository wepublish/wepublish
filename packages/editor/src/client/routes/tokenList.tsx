import React, {useState, useEffect} from 'react'

import {
  Typography,
  Box,
  Spacing,
  Drawer,
  Toast,
  Divider,
  Button,
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
import {MaterialIconDeleteOutline, MaterialIconClose, MaterialIconCheck} from '@karma.run/icons'

import {RouteType, useRoute, useRouteDispatch, PeerListRoute} from '../route'

import {PeerInfoEditPanel} from '../panel/peerProfileEditPanel'
import {PeerEditPanel} from '../panel/peerEditPanel'
import {useTokenListQuery, useDeleteTokenMutation, Token, TokenListQueryName} from '../api/token'

export function TokenList() {
  const {current} = useRoute()
  const dispatch = useRouteDispatch()

  const [isPeerInfoEditModalOpen, setPeerInfoEditModalOpen] = useState(
    current?.type === RouteType.PeerProfileEdit
  )

  const [isPeerAddModalOpen, setPeerAddModalOpen] = useState(
    current?.type === RouteType.PeerProfileEdit
  )

  const [isConfirmationDialogOpen, setConfirmationDialogOpen] = useState(false)

  const [currentToken, setCurrentToken] = useState<Token>()

  const [isSuccessToastOpen, setSuccessToastOpen] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const [isErrorToastOpen, setErrorToastOpen] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const {
    data: tokenListData,
    loading: isTokenListLoading,
    error: tokenListError
  } = useTokenListQuery({
    fetchPolicy: 'network-only'
  })

  const [deleteToken, {loading: isDeleting}] = useDeleteTokenMutation({
    refetchQueries: [TokenListQueryName]
  })

  useEffect(() => {
    if (tokenListError) {
      setErrorToastOpen(true)
      setErrorMessage(tokenListError.message)
    }
  }, [tokenListError])

  return (
    <>
      <Box>
        <Box marginBottom={Spacing.Small} flexDirection="row" alignItems="center" display="flex">
          <Typography variant="h1">Tokens</Typography>
          <Box flexGrow={1} />
          <Button
            color="primary"
            label="New Token"
            disabled={isTokenListLoading}
            onClick={() => setPeerAddModalOpen(true)}
          />
        </Box>
        {isTokenListLoading
          ? null
          : tokenListData?.tokens.map(token => (
              <Box key={token.id} marginBottom={Spacing.Small}>
                <Box display="flex" alignItems="center" marginBottom={Spacing.ExtraSmall}>
                  <Typography variant="body2">{token.name}</Typography>
                  <Box flexGrow={1} />
                  <IconButton
                    icon={MaterialIconDeleteOutline}
                    onClick={() => {
                      setConfirmationDialogOpen(true)
                      setCurrentToken(token)
                    }}
                  />
                </Box>
                <Divider />
              </Box>
            ))}
      </Box>

      <Drawer open={isPeerInfoEditModalOpen} width={480}>
        {() => (
          <PeerInfoEditPanel
            onClose={() => {
              setPeerInfoEditModalOpen(false)

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
          <PeerEditPanel
            onClose={() => {
              setPeerAddModalOpen(false)

              dispatch({
                type: RouteActionType.PushRoute,
                route: PeerListRoute.create({})
              })
            }}
            onSave={() => {
              setPeerAddModalOpen(false)

              setSuccessToastOpen(true)
              setSuccessMessage('Peer Created')

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
                    if (!currentToken) return

                    await deleteToken({variables: {id: currentToken.id}})
                    setConfirmationDialogOpen(false)
                  }}
                />
              }
            />
            <PanelSection>
              <DescriptionList>
                <DescriptionListItem label="Name">
                  {currentToken?.name || 'Unknown'}
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
