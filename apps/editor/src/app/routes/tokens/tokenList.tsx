import { useMutation, useQuery } from '@apollo/client/react';
import {
  DeleteTokenDocument,
  FullTokenFragment,
  TokenListDocument,
} from '@wepublish/editor/api';
import {
  createCheckedPermissionComponent,
  getOperationNameFromDocument,
  IconButton,
  IconButtonTooltip,
  InfoTooltip,
  ListViewActions,
  ListViewContainer,
  ListViewHeader,
  PaddedCell,
  PermissionControl,
  Table,
  TableWrapper,
  TokenGeneratePanel,
} from '@wepublish/ui/editor';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdDelete, MdGeneratingTokens } from 'react-icons/md';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Button,
  Drawer,
  IconButton as RIconButton,
  Message,
  Modal,
  Table as RTable,
  toaster,
} from 'rsuite';
import { RowDataType } from 'rsuite-table';

const { Column, HeaderCell, Cell: RCell } = RTable;

function TokenList() {
  const location = useLocation();
  const navigate = useNavigate();

  const isGenerateRoute = location.pathname.includes('generate');

  const [isTokenGeneratePanelOpen, setTokenGeneratePanelOpen] =
    useState(isGenerateRoute);
  const [isConfirmationDialogOpen, setConfirmationDialogOpen] = useState(false);
  const [currentToken, setCurrentToken] = useState<FullTokenFragment>();

  const {
    data: tokenListData,
    loading: isTokenListLoading,
    error: tokenListError,
  } = useQuery(TokenListDocument, {});

  const [deleteToken, { loading: isDeleting, error: deleteTokenError }] =
    useMutation(DeleteTokenDocument, {
      refetchQueries: [getOperationNameFromDocument(TokenListDocument)],
    });

  const { t } = useTranslation();

  useEffect(() => {
    const error = tokenListError?.message ?? deleteTokenError?.message;
    if (error)
      toaster.push(
        <Message
          type="error"
          showIcon
          closable
          duration={0}
        >
          {error}
        </Message>
      );
  }, [tokenListError, deleteTokenError]);

  useEffect(() => {
    if (isGenerateRoute) {
      setTokenGeneratePanelOpen(true);
    }
  }, [location]);

  return (
    <>
      <ListViewContainer>
        <ListViewHeader>
          <h2>
            {t('tokenList.overview.tokens')}{' '}
            <InfoTooltip text={t('tokenList.overview.tokensInfo')} />
          </h2>
        </ListViewHeader>
        <PermissionControl qualifyingPermissions={['CAN_CREATE_TOKEN']}>
          <ListViewActions>
            <Link to="/tokens/generate">
              <RIconButton
                appearance="primary"
                disabled={isTokenListLoading}
                icon={<MdGeneratingTokens />}
              >
                {t('tokenList.overview.generateToken')}
              </RIconButton>
            </Link>
          </ListViewActions>
        </PermissionControl>
      </ListViewContainer>

      <TableWrapper>
        <Table
          fillHeight
          loading={isTokenListLoading}
          data={tokenListData?.tokens ?? []}
        >
          <Column
            width={400}
            align="left"
            resizable
          >
            <HeaderCell>{t('tokenList.panels.name')}</HeaderCell>
            <RCell dataKey="name" />
          </Column>

          <Column
            width={100}
            align="center"
            fixed="right"
          >
            <HeaderCell align="center">{t('action')}</HeaderCell>
            <PaddedCell>
              {(rowData: RowDataType<FullTokenFragment>) => (
                <PermissionControl qualifyingPermissions={['CAN_DELETE_TOKEN']}>
                  <IconButtonTooltip caption={t('delete')}>
                    <IconButton
                      icon={<MdDelete />}
                      circle
                      size="sm"
                      appearance="ghost"
                      color="red"
                      aria-label={t('delete')}
                      onClick={() => {
                        setConfirmationDialogOpen(true);
                        setCurrentToken(rowData as FullTokenFragment);
                      }}
                    />
                  </IconButtonTooltip>
                </PermissionControl>
              )}
            </PaddedCell>
          </Column>
        </Table>
      </TableWrapper>

      <Drawer
        open={isTokenGeneratePanelOpen}
        onClose={() => {
          setTokenGeneratePanelOpen(false);
          navigate('/tokens');
        }}
        size="sm"
      >
        <TokenGeneratePanel
          onClose={() => {
            setTokenGeneratePanelOpen(false);
            navigate('/tokens');
          }}
        />
      </Drawer>

      <Modal
        open={isConfirmationDialogOpen}
        onClose={() => setConfirmationDialogOpen(false)}
      >
        <Modal.Header>
          <Modal.Title>{t('tokenList.panels.deleteToken')}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {t('tokenList.panels.deleteTokenText', {
            name: currentToken?.name || currentToken?.id,
          })}
        </Modal.Body>
        <Modal.Footer>
          <Button
            disabled={isDeleting}
            onClick={async () => {
              if (!currentToken) return;

              await deleteToken({ variables: { id: currentToken.id } });
              setConfirmationDialogOpen(false);
            }}
            color="red"
          >
            {t('tokenList.panels.confirm')}
          </Button>
          <Button
            onClick={() => setConfirmationDialogOpen(false)}
            appearance="subtle"
          >
            {t('tokenList.panels.cancel')}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}
const CheckedPermissionComponent = createCheckedPermissionComponent([
  'CAN_CREATE_TOKEN',
  'CAN_GET_TOKENS',
  'CAN_DELETE_TOKEN',
])(TokenList);
export { CheckedPermissionComponent as TokenList };
