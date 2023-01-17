import styled from '@emotion/styled'
import {useEffect, useState} from 'react'
import {useTranslation} from 'react-i18next'
import {MdDelete, MdGeneratingTokens} from 'react-icons/md'
import {Link, useLocation, useNavigate} from 'react-router-dom'
import {
  Button,
  Drawer,
  FlexboxGrid,
  IconButton,
  List as RList,
  Loader,
  Message,
  Modal,
  toaster
} from 'rsuite'

import {
  TokenListDocument,
  TokenRefFragment,
  useDeleteTokenMutation,
  useTokenListQuery
} from '../api'
import {IconButtonTooltip} from '../atoms/iconButtonTooltip'
import {createCheckedPermissionComponent, PermissionControl} from '../atoms/permissionControl'
import {TokenGeneratePanel} from '../panel/tokenGeneratePanel'
import {getOperationNameFromDocument} from '../utility'

const List = styled(RList)`
  margin-top: 40px;
`

const FlexItemAlignRight = styled(FlexboxGrid.Item)`
  text-align: right;
`

const FlexItemPLeft = styled(FlexboxGrid.Item)`
  padding-left: 10px;
`

const FlexItemPRight = styled(FlexboxGrid.Item)`
  padding-right: 10px;
`

function TokenList() {
  const location = useLocation()
  const navigate = useNavigate()

  const isGenerateRoute = location.pathname.includes('generate')

  const [isTokenGeneratePanelOpen, setTokenGeneratePanelOpen] = useState(isGenerateRoute)
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
    if (isGenerateRoute) {
      setTokenGeneratePanelOpen(true)
    }
  }, [location])

  return (
    <>
      <FlexboxGrid>
        <FlexboxGrid.Item colspan={16}>
          <h2>{t('tokenList.overview.tokens')}</h2>
        </FlexboxGrid.Item>
        <PermissionControl qualifyingPermissions={['CAN_CREATE_TOKEN']}>
          <FlexItemAlignRight colspan={8}>
            <Link to="/tokens/generate">
              <IconButton
                appearance="primary"
                disabled={isTokenListLoading}
                icon={<MdGeneratingTokens />}>
                {t('tokenList.overview.generateToken')}
              </IconButton>
            </Link>
          </FlexItemAlignRight>
        </PermissionControl>
      </FlexboxGrid>
      {isTokenListLoading ? (
        <Loader backdrop content={t('tokenList.overview.loading')} vertical />
      ) : (
        <List bordered>
          {tokenListData?.tokens.map((token, index) => (
            <RList.Item key={token.name} index={index}>
              <FlexboxGrid>
                <FlexItemPLeft colspan={23}>{token.name}</FlexItemPLeft>
                <FlexItemPRight colspan={1}>
                  <PermissionControl qualifyingPermissions={['CAN_DELETE_TOKEN']}>
                    <IconButtonTooltip caption={t('delete')}>
                      <IconButton
                        icon={<MdDelete />}
                        circle
                        size="sm"
                        appearance="ghost"
                        color="red"
                        onClick={() => {
                          setConfirmationDialogOpen(true)
                          setCurrentToken(token)
                        }}
                      />
                    </IconButtonTooltip>
                  </PermissionControl>
                </FlexItemPRight>
              </FlexboxGrid>
            </RList.Item>
          ))}
        </List>
      )}

      <Drawer
        open={isTokenGeneratePanelOpen}
        onClose={() => {
          setTokenGeneratePanelOpen(false)
          navigate('/tokens')
        }}
        size="sm">
        <TokenGeneratePanel
          onClose={() => {
            setTokenGeneratePanelOpen(false)
            navigate('/tokens')
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
const CheckedPermissionComponent = createCheckedPermissionComponent([
  'CAN_CREATE_TOKEN',
  'CAN_GET_TOKENS',
  'CAN_DELETE_TOKEN'
])(TokenList)
export {CheckedPermissionComponent as TokenList}
