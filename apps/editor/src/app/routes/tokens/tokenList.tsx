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
  UpdateTokenDocument,
  UserRoleListDocument,
} from '@wepublish/editor/api';
import {
  CanCreateToken,
  CanDeleteToken,
  CanGetTokens,
} from '@wepublish/permissions';
import {
  createCheckedPermissionComponent,
  DataTable,
  DRAWER_WIDTHS,
  enqueueSnackbar,
  getOperationNameFromDocument,
  IconButton,
  IconButtonTooltip,
  InfoTooltip,
  ListViewActions,
  ListViewContainer,
  ListViewHeader,
  PermissionControl,
  TableWrapper,
  TokenGeneratePanel,
  TokenRolePicker,
  useSeededState,
  PageTitle,
} from '@wepublish/ui/editor';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdDelete, MdEdit, MdGeneratingTokens } from 'react-icons/md';
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom';

function TokenList() {
  const location = useLocation();
  const navigate = useNavigate();

  const isGenerateRoute = location.pathname.includes('generate');

  const [isTokenGeneratePanelOpen, setTokenGeneratePanelOpen] =
    useState(isGenerateRoute);
  const [isConfirmationDialogOpen, setConfirmationDialogOpen] = useState(false);
  const [currentToken, setCurrentToken] = useState<FullTokenFragment>();
  const [tokenToEdit, setTokenToEdit] = useState<FullTokenFragment>();
  const [editedRoleIDs, setEditedRoleIDs] = useState<string[]>([]);

  const {
    data: tokenListData,
    loading: isTokenListLoading,
    error: tokenListError,
  } = useQuery(TokenListDocument, {});

  const [deleteToken, { loading: isDeleting, error: deleteTokenError }] =
    useMutation(DeleteTokenDocument, {
      refetchQueries: [getOperationNameFromDocument(TokenListDocument)],
    });

  const [updateToken, { loading: isUpdating, error: updateTokenError }] =
    useMutation(UpdateTokenDocument, {
      refetchQueries: [getOperationNameFromDocument(TokenListDocument)],
    });

  const { data: roleData } = useQuery(UserRoleListDocument, {
    variables: { take: 200 },
  });
  const roleNames = new Map(
    (roleData?.userRoles.nodes ?? []).map(role => [role.id, role.name])
  );

  const { t } = useTranslation();

  useEffect(() => {
    const error =
      tokenListError?.message ??
      deleteTokenError?.message ??
      updateTokenError?.message;
    if (error) {
      enqueueSnackbar(error, { variant: 'error', autoHideDuration: null });
    }
  }, [tokenListError, deleteTokenError, updateTokenError]);

  useSeededState(isGenerateRoute ? location.pathname : undefined, () =>
    setTokenGeneratePanelOpen(true)
  );

  return (
    <>
      <ListViewContainer>
        <ListViewHeader>
          <PageTitle>
            {t('tokenList.overview.tokens')}{' '}
            <InfoTooltip text={t('tokenList.overview.tokensInfo')} />
          </PageTitle>
        </ListViewHeader>
        <PermissionControl qualifyingPermissions={[CanCreateToken.id]}>
          <ListViewActions>
            <Button
              component={RouterLink}
              to="/tokens/generate"
              variant="contained"
              startIcon={<MdGeneratingTokens />}
              disabled={isTokenListLoading}
            >
              {t('tokenList.overview.generateToken')}
            </Button>
          </ListViewActions>
        </PermissionControl>
      </ListViewContainer>

      <TableWrapper>
        <DataTable
          storageKey="tokens"
          data={tokenListData?.tokens ?? []}
          loading={isTokenListLoading}
          columns={[
            {
              id: 'name',
              alwaysVisible: true,
              label: t('tokenList.panels.name'),
              width: 400,
              align: 'left',
              sortKey: 'name',
              render: row => row.name,
            },
            {
              id: 'roles',
              label: t('tokenList.panels.roles'),
              align: 'left',
              render: row =>
                row.roleIDs?.length ?
                  row.roleIDs.map(id => roleNames.get(id) ?? id).join(', ')
                : t('tokenList.panels.noRoles'),
            },
            {
              id: 'action',
              label: t('action'),
              width: 120,
              align: 'center',
              fixed: true,
              render: rowData => (
                <>
                  <PermissionControl
                    qualifyingPermissions={[CanCreateToken.id]}
                  >
                    <IconButtonTooltip
                      caption={t('tokenList.panels.editRoles')}
                    >
                      <IconButton
                        size="small"
                        aria-label={t('tokenList.panels.editRoles')}
                        onClick={() => {
                          setTokenToEdit(rowData as FullTokenFragment);
                          setEditedRoleIDs(rowData.roleIDs ?? []);
                        }}
                      >
                        <MdEdit />
                      </IconButton>
                    </IconButtonTooltip>
                  </PermissionControl>
                  <PermissionControl
                    qualifyingPermissions={[CanDeleteToken.id]}
                  >
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
                </>
              ),
            },
          ]}
        />
      </TableWrapper>

      <Drawer
        anchor="right"
        slotProps={{
          paper: {
            sx: {
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
        open={!!tokenToEdit}
        onClose={() => setTokenToEdit(undefined)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          {t('tokenList.panels.editRolesOf', { name: tokenToEdit?.name })}
        </DialogTitle>
        <DialogContent>
          <p>{t('tokenList.panels.rolesInfo')}</p>
          <TokenRolePicker
            value={editedRoleIDs}
            disabled={isUpdating}
            onChange={setEditedRoleIDs}
          />
        </DialogContent>
        <DialogActions>
          <Button
            variant="text"
            onClick={() => setTokenToEdit(undefined)}
          >
            {t('tokenList.panels.cancel')}
          </Button>
          <Button
            variant="contained"
            disabled={isUpdating}
            onClick={async () => {
              if (!tokenToEdit) {
                return;
              }

              await updateToken({
                variables: { id: tokenToEdit.id, roleIDs: editedRoleIDs },
              });
              setTokenToEdit(undefined);
            }}
          >
            {t('save')}
          </Button>
        </DialogActions>
      </Dialog>

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
            variant="text"
            onClick={() => setConfirmationDialogOpen(false)}
          >
            {t('tokenList.panels.cancel')}
          </Button>

          <Button
            variant="contained"
            disabled={isDeleting}
            onClick={async () => {
              if (!currentToken) {
                return;
              }

              await deleteToken({ variables: { id: currentToken.id } });
              setConfirmationDialogOpen(false);
            }}
            color="error"
          >
            {t('tokenList.panels.confirm')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
const CheckedPermissionComponent = createCheckedPermissionComponent([
  CanCreateToken.id,
  CanGetTokens.id,
  CanDeleteToken.id,
])(TokenList);
export { CheckedPermissionComponent as TokenList };
