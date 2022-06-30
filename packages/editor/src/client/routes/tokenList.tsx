import React, {useState, useEffect} from 'react'

import {RouteActionType} from '@wepublish/karma.run-react'

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

import {IconButtonTooltip} from '../atoms/iconButtonTooltip'

import {getOperationNameFromDocument} from '../utility'
import {TokenGeneratePanel} from '../panel/tokenGeneratePanel'

import {useTranslation} from 'react-i18next'
import {
  Button,
  FlexboxGrid,
  List,
  Loader,
  IconButton,
  Drawer,
  Modal,
  toaster,
  Message
} from 'rsuite'
import TrashIcon from '@rsuite/icons/legacy/Trash'

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
    if (error)
      toaster.push(
        <Message type="error" showIcon closable duration={0}>
          {error}
        </Message>
      )
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
        <Loader backdrop content={t('tokenList.overview.loading')} vertical />
      ) : (
        <List bordered style={{marginTop: '40px'}}>
          {tokenListData?.tokens.map((token, index) => (
            <List.Item key={token.name} index={index}>
              <FlexboxGrid>
                <FlexboxGrid.Item colspan={23} style={{paddingLeft: '10px'}}>
                  {token.name}
                </FlexboxGrid.Item>
                <FlexboxGrid.Item colspan={1} style={{paddingRight: '10px'}}>
                  <IconButtonTooltip caption={t('tokenList.overview.delete')}>
                    <IconButton
                      icon={<TrashIcon />}
                      circle
                      size="sm"
                      onClick={() => {
                        setConfirmationDialogOpen(true)
                        setCurrentToken(token)
                      }}
                    />
                  </IconButtonTooltip>
                </FlexboxGrid.Item>
              </FlexboxGrid>
            </List.Item>
          ))}
        </List>
      )}

      <Drawer
        open={isTokenGeneratePanelOpen}
        onClose={() => {
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

      <Modal open={isConfirmationDialogOpen} onClose={() => setConfirmationDialogOpen(false)}>
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
