import { useMutation, useQuery } from '@apollo/client/react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Drawer,
} from '@mui/material';
import {
  DeleteTokenDocument,
  FullTokenFragment,
  TokenListDocument,
} from '@wepublish/editor/api';
import {
  createCheckedPermissionComponent,
  DRAWER_WIDTHS,
  enqueueSnackbar,
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
import { Table as RTable } from 'rsuite';
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
      enqueueSnackbar(error, { variant: 'error', autoHideDuration: null });
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
              <Button
                variant="contained"
                startIcon={<MdGeneratingTokens />}
                disabled={isTokenListLoading}
              >
                {t('tokenList.overview.generateToken')}
              </Button>
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
                      size="small"
                      color="error"
                      aria-label={t('delete')}
                      onClick={() => {
                        setConfirmationDialogOpen(true);
                        setCurrentToken(rowData as FullTokenFragment);
                      }}
                    >
                      <MdDelete />
                    </IconButton>
                  </IconButtonTooltip>
                </PermissionControl>
              )}
            </PaddedCell>
          </Column>
        </Table>
      </TableWrapper>

      <Drawer
        anchor="right"
        slotProps={{
          paper: {
            sx: {
              display: 'flex',
              flexDirection: 'column',
              width: DRAWER_WIDTHS.sm,
              maxWidth: '100vw',
            },
          },
        }}
        open={isTokenGeneratePanelOpen}
        onClose={() => {
          setTokenGeneratePanelOpen(false);
          navigate('/tokens');
        }}
      >
        <TokenGeneratePanel
          onClose={() => {
            setTokenGeneratePanelOpen(false);
            navigate('/tokens');
          }}
        />
      </Drawer>

      <Dialog
        open={isConfirmationDialogOpen}
        onClose={() => setConfirmationDialogOpen(false)}
      >
        <DialogTitle>{t('tokenList.panels.deleteToken')}</DialogTitle>
        <DialogContent>
          {t('tokenList.panels.deleteTokenText', {
            name: currentToken?.name || currentToken?.id,
          })}
        </DialogContent>
        <DialogActions>
          <Button
            variant="outlined"
            disabled={isDeleting}
            onClick={async () => {
              if (!currentToken) return;

              await deleteToken({ variables: { id: currentToken.id } });
              setConfirmationDialogOpen(false);
            }}
            color="error"
          >
            {t('tokenList.panels.confirm')}
          </Button>
          <Button
            variant="text"
            onClick={() => setConfirmationDialogOpen(false)}
          >
            {t('tokenList.panels.cancel')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
const CheckedPermissionComponent = createCheckedPermissionComponent([
  'CAN_CREATE_TOKEN',
  'CAN_GET_TOKENS',
  'CAN_DELETE_TOKEN',
])(TokenList);
export { CheckedPermissionComponent as TokenList };
