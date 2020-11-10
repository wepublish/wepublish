import React, {useState, useEffect} from 'react'

import {RouteActionType} from '@karma.run/react'

import {
  RouteType,
  useRoute,
  useRouteDispatch,
  TokenListRoute,
  TokenGenerateRoute,
  ButtonLink
} from '../route'

import {
  useTokenListQuery,
  useDeleteTokenMutation,
  TokenRefFragment,
  TokenListDocument
} from '../api'

import {getOperationNameFromDocument} from '../utility'
import {TokenGeneratePanel} from '../panel/tokenGeneratePanel'

import {useTranslation} from 'react-i18next'
import {Button, FlexboxGrid, Icon, List, Loader, IconButton, Drawer, Modal, Alert} from 'rsuite'

export function TokenList() {
  const {current} = useRoute()
  const dispatch = useRouteDispatch()

  const [isTokenGeneratePanelOpen, setTokenGeneratePanelOpen] = useState(
    current?.type === RouteType.TokenGenerate
  )

  const [isConfirmationDialogOpen, setConfirmationDialogOpen] = useState(false)

  const [currentToken, setCurrentToken] = useState<TokenRefFragment>()

  const {
    data: tokenListData,
    loading: isTokenListLoading,
    error: tokenListError
  } = useTokenListQuery({
    fetchPolicy: 'network-only'
  })

  const [deleteToken, {loading: isDeleting, error: deleteTokenError}] = useDeleteTokenMutation({
    refetchQueries: [getOperationNameFromDocument(TokenListDocument)]
  })

  const {t} = useTranslation()

  useEffect(() => {
    const error = tokenListError?.message ?? deleteTokenError?.message
    if (error) Alert.error(error, 0)
  }, [tokenListError, deleteTokenError])

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
      <FlexboxGrid>
        <FlexboxGrid.Item colspan={16}>
          <h2>{t('tokenList.overview.tokens')}</h2>
        </FlexboxGrid.Item>
        <FlexboxGrid.Item colspan={8} style={{textAlign: 'right'}}>
          <ButtonLink
            appearance="primary"
            disabled={isTokenListLoading}
            route={TokenGenerateRoute.create({})}>
            {t('tokenList.overview.generateToken')}
          </ButtonLink>
        </FlexboxGrid.Item>
      </FlexboxGrid>
      {isTokenListLoading ? (
        <Loader backdrop content="loading..." vertical />
      ) : (
        <List bordered={true} style={{marginTop: '40px'}}>
          {tokenListData?.tokens.map((token, index) => (
            <List.Item key={token.name} index={index}>
              <FlexboxGrid>
                <FlexboxGrid.Item colspan={23} style={{paddingLeft: '10px'}}>
                  {token.name}
                </FlexboxGrid.Item>
                <FlexboxGrid.Item colspan={1} style={{paddingRight: '10px'}}>
                  <IconButton
                    icon={<Icon icon="trash" />}
                    circle
                    size="sm"
                    onClick={() => {
                      setConfirmationDialogOpen(true)
                      setCurrentToken(token)
                    }}
                  />
                </FlexboxGrid.Item>
              </FlexboxGrid>
            </List.Item>
          ))}
        </List>
      )}

      <Drawer
        show={isTokenGeneratePanelOpen}
        onHide={() => {
          dispatch({
            type: RouteActionType.PushRoute,
            route: TokenListRoute.create({})
          })
        }}
        size={'sm'}>
        <TokenGeneratePanel
          onClose={() => {
            dispatch({
              type: RouteActionType.PushRoute,
              route: TokenListRoute.create({})
            })
          }}
        />
      </Drawer>

      <Modal show={isConfirmationDialogOpen} onHide={() => setConfirmationDialogOpen(false)}>
        <Modal.Header>
          <Modal.Title>{t('tokenList.panels.deleteToken')}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {t('tokenList.panels.deleteTokenText', {name: currentToken?.name || currentToken?.id})}
        </Modal.Body>
        <Modal.Footer>
          <Button
            disabled={isDeleting}
            onClick={async () => {
              if (!currentToken) return

              await deleteToken({variables: {id: currentToken.id}})
              setConfirmationDialogOpen(false)
            }}
            color="red">
            {t('tokenList.panels.confirm')}
          </Button>
          <Button onClick={() => setConfirmationDialogOpen(false)} appearance="subtle">
            {t('tokenList.panels.cancel')}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  )
}
