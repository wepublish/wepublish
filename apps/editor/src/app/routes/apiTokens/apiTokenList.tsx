import { useMutation, useQuery } from '@apollo/client/react';
import styled from '@emotion/styled';
import {
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  TextField,
  Tooltip,
} from '@mui/material';
import {
  ApiTokenListDocument,
  ApiTokenStatus,
  FullApiTokenFragment,
  FullUserFragment,
  RevokeApiTokenDocument,
} from '@wepublish/editor/api';
import {
  CanCreateApiToken,
  CanGetAllApiTokens,
  CanGetApiTokens,
  CanRevokeApiToken,
} from '@wepublish/permissions';
import {
  createCheckedPermissionComponent,
  DataTable,
  enqueueSnackbar,
  getOperationNameFromDocument,
  IconButton,
  IconButtonTooltip,
  InfoTooltip,
  ListViewActions,
  ListViewContainer,
  ListViewHeader,
  PageTitle,
  Pagination,
  PermissionControl,
  TableWrapper,
  useAuthorisation,
  useListViewState,
  UserSearch,
} from '@wepublish/ui/editor';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdBlock, MdGeneratingTokens } from 'react-icons/md';
import { Link as RouterLink, Outlet, useNavigate } from 'react-router-dom';

const Filters = styled.div`
  display: grid;
  grid-template-columns: minmax(180px, 220px) 1fr;
  align-items: start;
  gap: ${({ theme }) => theme.spacing(2)};
`;

const StatusSelect = styled(TextField)`
  .MuiInputBase-root {
    background: ${({ theme }) => theme.vars.palette.background.paper};
  }
`;

function ApiTokenList() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const { limit, setLimit } = useListViewState<string>('apiTokens', {
    defaultFilter: '',
  });

  const [activePage, setActivePage] = useState(1);
  const [isConfirmationDialogOpen, setConfirmationDialogOpen] = useState(false);
  const [owner, setOwner] = useState<FullUserFragment | null>(null);
  const [status, setStatus] = useState<ApiTokenStatus | ''>('');
  const [currentToken, setCurrentToken] = useState<FullApiTokenFragment>();

  const {
    data,
    loading: isLoading,
    error,
  } = useQuery(ApiTokenListDocument, {
    variables: {
      take: limit,
      skip: (activePage - 1) * limit,
      createdById: owner?.id,
      status: status || undefined,
    },
  });

  const [revokeApiToken, { loading: isRevoking, error: revokeError }] =
    useMutation(RevokeApiTokenDocument, {
      refetchQueries: [getOperationNameFromDocument(ApiTokenListDocument)],
    });

  useEffect(() => {
    const message = error?.message ?? revokeError?.message;

    if (message) {
      enqueueSnackbar(message, { variant: 'error', autoHideDuration: null });
    }
  }, [error, revokeError]);

  const never = t('apiTokenList.overview.never');

  const seesEveryKey = useAuthorisation(CanGetAllApiTokens.id);

  const hasExpired = (expiresAt?: string | null) =>
    Boolean(expiresAt && new Date(expiresAt).getTime() <= Date.now());

  return (
    <>
      <ListViewContainer>
        <ListViewHeader>
          <PageTitle>
            {t('apiTokenList.overview.apiTokens')}{' '}
            <InfoTooltip text={t('apiTokenList.overview.apiTokensInfo')} />
          </PageTitle>
        </ListViewHeader>

        <PermissionControl qualifyingPermissions={[CanCreateApiToken.id]}>
          <ListViewActions>
            <Button
              component={RouterLink}
              to="/api-tokens/generate"
              variant="contained"
              startIcon={<MdGeneratingTokens />}
            >
              {t('apiTokenList.overview.generateToken')}
            </Button>
          </ListViewActions>
        </PermissionControl>
      </ListViewContainer>

      <TableWrapper>
        <DataTable
          storageKey="apiTokens"
          filters={
            <Filters>
              <StatusSelect
                select
                label={t('apiTokenList.overview.status')}
                value={status}
                onChange={event => {
                  setStatus(event.target.value as ApiTokenStatus | '');
                  setActivePage(1);
                }}
                slotProps={{
                  select: { displayEmpty: true },
                  inputLabel: { shrink: true },
                }}
              >
                <MenuItem value="">
                  {t('apiTokenList.overview.anyStatus')}
                </MenuItem>

                {Object.values(ApiTokenStatus).map(option => (
                  <MenuItem
                    key={option}
                    value={option}
                  >
                    {t(`apiTokenList.overview.${option.toLowerCase()}`)}
                  </MenuItem>
                ))}
              </StatusSelect>

              {seesEveryKey && (
                <UserSearch
                  name="owner"
                  user={owner}
                  placeholder={t('apiTokenList.overview.filterByOwner')}
                  onUpdateUser={user => {
                    setOwner(user ?? null);
                    setActivePage(1);
                  }}
                />
              )}
            </Filters>
          }
          filterCount={(owner ? 1 : 0) + (status ? 1 : 0)}
          onResetFilters={() => {
            setOwner(null);
            setStatus('');
            setActivePage(1);
          }}
          data={data?.apiTokens.nodes ?? []}
          loading={isLoading}
          columns={[
            {
              id: 'status',
              alwaysVisible: true,
              label: t('apiTokenList.overview.status'),
              width: 130,
              align: 'left',
              render: row =>
                row.revokedAt ?
                  <Chip
                    size="small"
                    color="error"
                    label={t('apiTokenList.overview.revoked')}
                  />
                : hasExpired(row.expiresAt) ?
                  <Chip
                    size="small"
                    color="warning"
                    label={t('apiTokenList.overview.expired')}
                  />
                : <Chip
                    size="small"
                    color="success"
                    label={t('apiTokenList.overview.active')}
                  />,
            },
            {
              id: 'name',
              alwaysVisible: true,
              label: t('apiTokenList.overview.name'),
              width: 220,
              align: 'left',
              render: row => row.name,
            },
            {
              id: 'prefix',
              label: t('apiTokenList.overview.prefix'),
              width: 160,
              align: 'left',
              render: row => <code>{row.prefix}…</code>,
            },
            {
              id: 'scopes',
              label: t('apiTokenList.overview.scopes'),
              width: 260,
              align: 'left',
              render: row => (
                <Tooltip title={row.scopes.join(', ')}>
                  <Stack
                    direction="row"
                    spacing={0.5}
                  >
                    <Chip
                      size="small"
                      label={t('apiTokenList.overview.scopeCount', {
                        count: row.scopes.length,
                      })}
                    />
                  </Stack>
                </Tooltip>
              ),
            },
            ...(seesEveryKey ?
              [
                {
                  id: 'owner',
                  label: t('apiTokenList.overview.owner'),
                  width: 200,
                  align: 'left' as const,
                  render: (row: FullApiTokenFragment) =>
                    row.createdBy?.name ??
                    t('apiTokenList.overview.ownerUnknown'),
                },
              ]
            : []),
            {
              id: 'lastUsedAt',
              label: t('apiTokenList.overview.lastUsed'),
              width: 170,
              align: 'left',
              render: row =>
                row.lastUsedAt ?
                  t('apiTokenList.overview.lastUsedDate', {
                    lastUsedDate: new Date(row.lastUsedAt),
                  })
                : never,
            },
            {
              id: 'expiresAt',
              label: t('apiTokenList.overview.expires'),
              width: 170,
              align: 'left',
              render: row =>
                t('apiTokenList.overview.expiresDate', {
                  expiresDate: new Date(row.expiresAt),
                }),
            },
            {
              id: 'action',
              label: t('action'),
              width: 100,
              align: 'center',
              fixed: true,
              render: row => (
                <PermissionControl
                  qualifyingPermissions={[CanRevokeApiToken.id]}
                >
                  <IconButtonTooltip
                    caption={t('apiTokenList.overview.revoke')}
                  >
                    <IconButton
                      size="small"
                      color="error"
                      disabled={
                        Boolean(row.revokedAt) || hasExpired(row.expiresAt)
                      }
                      aria-label={t('apiTokenList.overview.revoke')}
                      onClick={() => {
                        setConfirmationDialogOpen(true);
                        setCurrentToken(row as FullApiTokenFragment);
                      }}
                    >
                      <MdBlock />
                    </IconButton>
                  </IconButtonTooltip>
                </PermissionControl>
              ),
            },
          ]}
        />

        <Pagination
          state={{
            page: activePage,
            limit,
            setPage: setActivePage,
            setLimit: limit => {
              setLimit(limit);
              setActivePage(1);
            },
          }}
          totalCount={data?.apiTokens.totalCount ?? 0}
        />
      </TableWrapper>

      <Outlet />

      <Dialog
        open={isConfirmationDialogOpen}
        onClose={() => setConfirmationDialogOpen(false)}
      >
        <DialogTitle>{t('apiTokenList.panels.revokeToken')}</DialogTitle>

        <DialogContent>
          {t('apiTokenList.panels.revokeTokenText', {
            name: currentToken?.name,
          })}
        </DialogContent>

        <DialogActions>
          <Button
            variant="text"
            onClick={() => setConfirmationDialogOpen(false)}
          >
            {t('apiTokenList.panels.cancel')}
          </Button>

          <Button
            variant="contained"
            color="error"
            disabled={isRevoking}
            onClick={async () => {
              if (!currentToken) {
                return;
              }

              await revokeApiToken({ variables: { id: currentToken.id } });
              setConfirmationDialogOpen(false);
            }}
          >
            {t('apiTokenList.panels.confirm')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

const CheckedPermissionComponent = createCheckedPermissionComponent([
  CanCreateApiToken.id,
  CanGetApiTokens.id,
  CanRevokeApiToken.id,
])(ApiTokenList);

export { CheckedPermissionComponent as ApiTokenList };
