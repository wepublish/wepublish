import { useMutation, useQuery } from '@apollo/client/react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  DeleteUserDocument,
  FullUserRoleFragment,
  ResetUserTotpDocument,
  TinyUserFragment,
  TinyUserListDocument,
  UserFilter,
  UserSort,
} from '@wepublish/editor/api';
import {
  CanCreateUser,
  CanDeleteUser,
  CanGetUser,
  CanGetUsers,
  CanResetUserPassword,
  CanResetUserTotp,
} from '@wepublish/permissions';
import {
  clearFilters,
  countActiveFilters,
  createCheckedPermissionComponent,
  DataTable,
  DescriptionList,
  DescriptionListItem,
  enqueueSnackbar,
  humanizeError,
  IconButton,
  IconButtonTooltip,
  Link,
  ListFilters,
  ListViewActions,
  ListViewContainer,
  ListViewHeader,
  mapTableSortTypeToGraphQLSortOrder,
  Pagination,
  PermissionControl,
  ResetUserPasswordForm,
  TableWrapper,
  useListViewState,
  useTableExportQuery,
  PageTitle,
} from '@wepublish/ui/editor';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdAdd, MdDelete, MdLockReset, MdPassword } from 'react-icons/md';
import { Link as RouterLink } from 'react-router-dom';

const USER_FILTER_FIELDS = ['userRole', 'text'] as const;

function mapColumFieldToGraphQLField(columnField: string): UserSort | null {
  switch (columnField) {
    case 'createdAt':
      return UserSort.CreatedAt;
    case 'modifiedAt':
      return UserSort.ModifiedAt;
    case 'name':
      return UserSort.Name;
    case 'firstName':
      return UserSort.FirstName;
    case 'subscriptionCount':
      return UserSort.SubscriptionCount;
    default:
      return null;
  }
}

function UserList() {
  const { filter, setFilter, sortField, sortOrder, setSort, limit, setLimit } =
    useListViewState<UserFilter>('users', { defaultSortField: 'createdAt' });

  const [isResetUserPasswordOpen, setIsResetUserPasswordOpen] = useState(false);
  const [isConfirmationDialogOpen, setConfirmationDialogOpen] = useState(false);
  const [isResetTotpDialogOpen, setIsResetTotpDialogOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<TinyUserFragment>();

  const [page, setPage] = useState(1);

  const {
    data,
    refetch,
    loading: isLoading,
    error: userListQueryError,
  } = useQuery(TinyUserListDocument, {
    variables: {
      filter: filter || undefined,
      take: limit,
      skip: (page - 1) * limit,
      sort: mapColumFieldToGraphQLField(sortField),
      order: mapTableSortTypeToGraphQLSortOrder(sortOrder),
    },
  });

  const users = data?.users?.nodes ?? [];

  const exportUsers = useTableExportQuery(
    TinyUserListDocument,
    {
      filter: filter || undefined,
      sort: mapColumFieldToGraphQLField(sortField),
      order: mapTableSortTypeToGraphQLSortOrder(sortOrder),
    },
    data => data.users
  );

  const updateFilter = (filter: UserFilter) => {
    setFilter(filter);
    setPage(1);
    refetch();
  };

  useEffect(() => {
    refetch({
      filter: filter || undefined,
      take: limit,
      skip: (page - 1) * limit,
      sort: mapColumFieldToGraphQLField(sortField),
      order: mapTableSortTypeToGraphQLSortOrder(sortOrder),
    });
  }, [filter, page, limit, sortOrder, sortField, refetch]);

  const [deleteUser, { loading: isDeleting }] = useMutation(
    DeleteUserDocument,
    {}
  );
  const [resetUserTotp, { loading: isResettingTotp }] = useMutation(
    ResetUserTotpDocument
  );

  const { t } = useTranslation();

  const totalPages = Math.ceil((data?.users?.totalCount ?? 0) / limit);

  if (totalPages > 0 && page > totalPages) {
    setPage(1);
  }

  if (userListQueryError) {
    return <div>{humanizeError(userListQueryError)}</div>;
  }

  /**
   * UI helpers
   */
  function getSubscriptionCellView(user: TinyUserFragment) {
    if (user.subscriptionCount === 1) {
      return <>{t('userList.overview.oneSubscription')}</>;
    }

    // multiple subscriptions
    if (user.subscriptionCount) {
      return (
        <>
          {t('userList.overview.amountOfSubscriptions', {
            amount: user.subscriptionCount,
          })}
        </>
      );
    }

    // no subscription
    return <>{t('userList.overview.noSubscriptions')}</>;
  }

  function getSubscriptionTooltip(user: TinyUserFragment) {
    return (
      <>
        {user.subscriptionOverview.map(({ id, memberPlanName, status }) => (
          <div key={id}>
            {t('userList.overview.subscriptionWithStatus', {
              name: memberPlanName,
              status: t(`userList.overview.subscriptionStatus.${status}`),
            })}
          </div>
        ))}
      </>
    );
  }

  const handleDeleteUser = async () => {
    if (!currentUser) {
      return;
    }

    try {
      await deleteUser({
        variables: { id: currentUser.id },
      });
      enqueueSnackbar(t('toast.deletedSuccess'), {
        variant: 'success',
        autoHideDuration: 2000,
      });
      setConfirmationDialogOpen(false);
      refetch();
    } catch (e) {
      if (e instanceof Error) {
        if (e.message.includes('Foreign key constraint')) {
          enqueueSnackbar(t('userCreateOrEditView.foreignKeySubscription'), {
            variant: 'error',
            autoHideDuration: 8000,
          });
          setConfirmationDialogOpen(false);
        } else {
          enqueueSnackbar(
            t('userCreateOrEditView.errorOnUpdate', { error: e }),
            { variant: 'error', autoHideDuration: 8000 }
          );
        }
      }
    }
  };

  const handleResetTotp = async () => {
    if (!currentUser) {
      return;
    }

    try {
      await resetUserTotp({
        variables: { userId: currentUser.id },
      });
      enqueueSnackbar(t('userList.overview.totpResetSuccess'), {
        variant: 'success',
        autoHideDuration: 2000,
      });
      setIsResetTotpDialogOpen(false);
      refetch();
    } catch (e) {
      enqueueSnackbar(t('userList.overview.totpResetError'), {
        variant: 'error',
        autoHideDuration: 8000,
      });
    }
  };

  return (
    <>
      <ListViewContainer>
        <ListViewHeader>
          <PageTitle>{t('userList.overview.users')}</PageTitle>
        </ListViewHeader>

        <PermissionControl qualifyingPermissions={[CanCreateUser.id]}>
          <ListViewActions>
            <Button
              component={RouterLink}
              to="/users/create"
              variant="contained"
              startIcon={<MdAdd />}
              disabled={isLoading}
            >
              {t('userList.overview.newUser')}
            </Button>
          </ListViewActions>
        </PermissionControl>
      </ListViewContainer>

      <TableWrapper>
        <DataTable
          filters={
            <ListFilters
              fields={USER_FILTER_FIELDS}
              filter={filter}
              isLoading={isLoading}
              onSetFilter={filter => updateFilter(filter)}
            />
          }
          filterCount={countActiveFilters(USER_FILTER_FIELDS, filter)}
          onResetFilters={() =>
            updateFilter(clearFilters(USER_FILTER_FIELDS, filter))
          }
          storageKey="users"
          exportRows={exportUsers}
          exportTotalCount={data?.users.totalCount ?? 0}
          data={users}
          loading={isLoading}
          sortColumn={sortField}
          sortOrder={sortOrder}
          onSort={(sortColumn, sortType) => {
            setSort(sortColumn, sortType);
            setPage(1);
          }}
          sortable={[
            'createdAt',
            'modifiedAt',
            'firstname',
            'name',
            'subscriptionCount',
          ]}
          columns={[
            {
              id: 'createdat',
              label: t('userList.overview.createdAt'),
              width: 200,
              align: 'left',
              sortKey: 'createdAt',
              render: ({ createdAt }: TinyUserFragment) =>
                t('userList.overview.createdAtDate', {
                  createdAtDate: new Date(createdAt),
                }),
              exportValue: ({ createdAt }) => new Date(createdAt),
            },
            {
              id: 'modifiedat',
              label: t('userList.overview.modifiedAt'),
              width: 200,
              align: 'left',
              sortKey: 'modifiedAt',
              render: ({ modifiedAt }: TinyUserFragment) =>
                t('userList.overview.modifiedAtDate', {
                  modifiedAtDate: new Date(modifiedAt),
                }),
              exportValue: ({ modifiedAt }) => new Date(modifiedAt),
            },
            {
              id: 'firstname',
              label: t('userList.overview.firstName'),
              width: 200,
              align: 'left',
              render: (rowData: TinyUserFragment) =>
                rowData.firstName ?
                  <Link to={`/users/edit/${rowData.id}`}>
                    {rowData.firstName}
                  </Link>
                : null,
              exportValue: rowData => rowData.firstName,
            },
            {
              id: 'name',
              alwaysVisible: true,
              label: t('userList.overview.name'),
              width: 200,
              align: 'left',
              render: (rowData: TinyUserFragment) => (
                <Link to={`/users/edit/${rowData.id}`}>
                  {rowData.name || t('userList.overview.unknown')}
                </Link>
              ),
              exportValue: rowData => rowData.name,
            },
            {
              id: 'email',
              label: t('userCreateOrEditView.email'),
              width: 200,
              align: 'left',
              sortKey: 'email',
              render: row => row.email,
            },
            {
              id: 'userroles',
              label: t('userCreateOrEditView.userRoles'),
              width: 200,
              align: 'left',
              sortKey: 'roles',
              render: (rowData: TinyUserFragment) =>
                rowData.roles
                  ?.map((r: FullUserRoleFragment) => r.name)
                  .join(', '),
            },
            {
              id: 'subscriptions',
              label: t('userList.overview.subscriptions'),
              width: 200,
              align: 'left',
              sortKey: 'subscriptionCount',
              exportValue: rowData => rowData.subscriptionCount,
              render: (rowData: TinyUserFragment) => {
                const user = rowData as TinyUserFragment;
                const cell = <div>{getSubscriptionCellView(user)}</div>;

                if (!user.subscriptionOverview.length) {
                  return cell;
                }

                return (
                  <Tooltip
                    placement="top"
                    title={getSubscriptionTooltip(user)}
                  >
                    {cell}
                  </Tooltip>
                );
              },
            },
            {
              id: 'action',
              label: t('action'),
              width: 180,
              align: 'center',
              fixed: true,
              render: (rowData: TinyUserFragment) => (
                <>
                  <PermissionControl
                    qualifyingPermissions={[CanResetUserPassword.id]}
                  >
                    <IconButtonTooltip
                      caption={t('userList.overview.resetPassword')}
                    >
                      <IconButton
                        size="small"
                        aria-label={t('userList.overview.resetPassword')}
                        onClick={e => {
                          setCurrentUser(rowData as TinyUserFragment);
                          setIsResetUserPasswordOpen(true);
                        }}
                      >
                        <MdPassword />
                      </IconButton>
                    </IconButtonTooltip>
                  </PermissionControl>
                  <PermissionControl
                    qualifyingPermissions={[CanResetUserTotp.id]}
                  >
                    <IconButtonTooltip
                      caption={t('userList.overview.resetTotp')}
                    >
                      <IconButton
                        size="small"
                        aria-label={t('userList.overview.resetTotp')}
                        disabled={!(rowData as TinyUserFragment).totpEnabled}
                        onClick={() => {
                          setCurrentUser(rowData as TinyUserFragment);
                          setIsResetTotpDialogOpen(true);
                        }}
                      >
                        <MdLockReset />
                      </IconButton>
                    </IconButtonTooltip>
                  </PermissionControl>
                  <PermissionControl qualifyingPermissions={[CanDeleteUser.id]}>
                    <IconButtonTooltip caption={t('delete')}>
                      <IconButton
                        size="small"
                        color="error"
                        aria-label={t('delete')}
                        onClick={() => {
                          setConfirmationDialogOpen(true);
                          setCurrentUser(rowData as TinyUserFragment);
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

        <Pagination
          state={{
            page,
            limit,
            setPage,
            setLimit: limit => {
              setLimit(limit);
              setPage(1);
            },
          }}
          totalCount={data?.users.totalCount ?? 0}
        />
      </TableWrapper>

      {/* reset user password */}
      {currentUser?.id && (
        <Dialog
          open={isResetUserPasswordOpen}
          onClose={() => setIsResetUserPasswordOpen(false)}
        >
          <DialogTitle>{t('userCreateOrEditView.resetPassword')}</DialogTitle>

          <DialogContent>
            <ResetUserPasswordForm
              userID={currentUser?.id}
              userName={currentUser?.name}
              onClose={() => setIsResetUserPasswordOpen(false)}
            />
          </DialogContent>

          <DialogActions>
            <Button
              variant="text"
              onClick={() => setIsResetUserPasswordOpen(false)}
            >
              {t('userCreateOrEditView.cancel')}
            </Button>
          </DialogActions>
        </Dialog>
      )}

      {/* delete user modal */}
      <Dialog
        open={isConfirmationDialogOpen}
        onClose={() => setConfirmationDialogOpen(false)}
      >
        <DialogTitle>{t('userCreateOrEditView.deleteUser')}</DialogTitle>

        <DialogContent>
          <DescriptionList>
            <DescriptionListItem label={t('userCreateOrEditView.name')}>
              {currentUser?.name || t('userCreateOrEditView.Unknown')}
            </DescriptionListItem>
          </DescriptionList>
        </DialogContent>

        <DialogActions>
          <Button
            variant="text"
            onClick={() => setConfirmationDialogOpen(false)}
          >
            {t('userCreateOrEditView.cancel')}
          </Button>

          <Button
            variant="contained"
            color="error"
            disabled={isDeleting}
            onClick={handleDeleteUser}
          >
            {t('userCreateOrEditView.confirm')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* reset totp modal */}
      <Dialog
        open={isResetTotpDialogOpen}
        onClose={() => setIsResetTotpDialogOpen(false)}
      >
        <DialogTitle>{t('userList.overview.resetTotpTitle')}</DialogTitle>

        <DialogContent>
          <Typography>
            {t('userList.overview.resetTotpConfirmation', {
              name: currentUser?.name || '',
            })}
          </Typography>
        </DialogContent>

        <DialogActions>
          <Button
            variant="text"
            onClick={() => setIsResetTotpDialogOpen(false)}
          >
            {t('userCreateOrEditView.cancel')}
          </Button>

          <Button
            variant="contained"
            color="warning"
            disabled={isResettingTotp}
            onClick={handleResetTotp}
          >
            {t('userCreateOrEditView.confirm')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

const CheckedPermissionComponent = createCheckedPermissionComponent([
  CanGetUsers.id,
  CanGetUser.id,
  CanCreateUser.id,
  CanDeleteUser.id,
  CanResetUserPassword.id,
])(UserList);
export { CheckedPermissionComponent as UserList };
