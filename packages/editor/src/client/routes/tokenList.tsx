import React, {useState, useEffect} from 'react'

import {
  Typography,
  Box,
  Spacing,
  Drawer,
  Toast,
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
import {MaterialIconDeleteOutline, MaterialIconClose, MaterialIconCheck} from '@karma.run/icons'

import {
  RouteType,
  useRoute,
  useRouteDispatch,
  TokenListRoute,
  RouteLinkButton,
  TokenGenerateRoute
} from '../route'

import {
  useTokenListQuery,
  useDeleteTokenMutation,
  TokenRefFragment,
  TokenListDocument
} from '../api'

import {getOperationNameFromDocument} from '../utility'
import {TokenGeneratePanel} from '../panel/tokenGeneratePanel'

export function TokenList() {
  const {current} = useRoute()
  const dispatch = useRouteDispatch()

  const [isTokenGeneratePanelOpen, setTokenGeneratePanelOpen] = useState(
    current?.type === RouteType.TokenGenerate
  )

  const [isConfirmationDialogOpen, setConfirmationDialogOpen] = useState(false)

  const [currentToken, setCurrentToken] = useState<TokenRefFragment>()

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
    refetchQueries: [getOperationNameFromDocument(TokenListDocument)]
  })

  useEffect(() => {
    if (tokenListError) {
      setErrorToastOpen(true)
      setErrorMessage(tokenListError.message)
    }
  }, [tokenListError])

  useEffect(() => {
    switch (current?.type) {
      case RouteType.TokenGenerate:
        setTokenGeneratePanelOpen(true)
        break

      default:
        setTokenGeneratePanelOpen(false)
        break
    }
  }, [current])

  return (
    <>
      <Box>
        <Box marginBottom={Spacing.Small} flexDirection="row" alignItems="center" display="flex">
          <Typography variant="h1">Tokens</Typography>
          <Box flexGrow={1} />
          <RouteLinkButton
            color="primary"
            label="Generate Token"
            disabled={isTokenListLoading}
            route={TokenGenerateRoute.create({})}
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

      <Drawer open={isTokenGeneratePanelOpen} width={480}>
        {() => (
          <TokenGeneratePanel
            onClose={() => {
              dispatch({
                type: RouteActionType.PushRoute,
                route: TokenListRoute.create({})
              })
            }}
          />
        )}
      </Drawer>

      <Dialog open={isConfirmationDialogOpen} width={340}>
        {() => (
          <Panel>
            <PanelHeader
              title="Delete Token?"
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
        type="error"
        open={isErrorToastOpen}
        autoHideDuration={5000}
        onClose={() => setErrorToastOpen(false)}>
        {errorMessage}
      </Toast>
    </>
  )
}
