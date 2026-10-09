import { useMutation, useQuery } from '@apollo/client/react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Tooltip,
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
  createCheckedPermissionComponent,
  DescriptionList,
  DescriptionListItem,
  enqueueSnackbar,
  humanizeError,
  IconButton,
  IconButtonTooltip,
  ListFilters,
  ListViewActions,
  ListViewContainer,
  ListViewHeader,
  mapTableSortTypeToGraphQLSortOrder,
  PaddedCell,
  Pagination,
  PermissionControl,
  ResetUserPasswordForm,
  Table,
  TableWrapper,
  useListViewState,
} from '@wepublish/ui/editor';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdAdd, MdDelete, MdLockReset, MdPassword } from 'react-icons/md';
import { Link } from 'react-router-dom';
import { Table as RTable } from 'rsuite';
import { RowDataType } from 'rsuite-table';

const { Column, HeaderCell, Cell: RCell } = RTable;

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
  const [users, setUsers] = useState<TinyUserFragment[]>([]);

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

  useEffect(() => {
    if (data?.users?.nodes) {
      setUsers(data.users.nodes);
      if (Math.ceil(data.users.totalCount / limit) < page) {
        setPage(1);
      }
    }
  }, [data?.users]);

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
    if (!currentUser) return;

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
    if (!currentUser) return;

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
          <h2>{t('userList.overview.users')}</h2>
        </ListViewHeader>
        <PermissionControl qualifyingPermissions={['CAN_CREATE_USER']}>
          <ListViewActions>
            <Link to="/users/create">
              <Button
                variant="contained"
                startIcon={<MdAdd />}
                disabled={isLoading}
              >
                {t('userList.overview.newUser')}
              </Button>
            </Link>
          </ListViewActions>
        </PermissionControl>
        <ListFilters
          fields={['userRole', 'text']}
          filter={filter}
          isLoading={isLoading}
          onSetFilter={filter => updateFilter(filter)}
        />
      </ListViewContainer>

      <TableWrapper>
        <Table
          fillHeight
          loading={isLoading}
          data={users}
          sortColumn={sortField}
          sortType={sortOrder}
          onSortColumn={(sortColumn, sortType) => {
            setSort(sortColumn, sortType ?? 'asc');
            setPage(1);
          }}
        >
          <Column
            width={200}
            align="left"
            resizable
            sortable
          >
            <HeaderCell>{t('userList.overview.createdAt')}</HeaderCell>
            <RCell dataKey="createdAt">
              {({ createdAt }: RowDataType<TinyUserFragment>) =>
                t('userList.overview.createdAtDate', {
                  createdAtDate: new Date(createdAt),
                })
              }
            </RCell>
          </Column>
          <Column
            width={200}
            align="left"
            resizable
            sortable
          >
            <HeaderCell>{t('userList.overview.modifiedAt')}</HeaderCell>
            <RCell dataKey="modifiedAt">
              {({ modifiedAt }: RowDataType<TinyUserFragment>) =>
                t('userList.overview.modifiedAtDate', {
                  modifiedAtDate: new Date(modifiedAt),
                })
              }
            </RCell>
          </Column>
          <Column
            width={200}
            align="left"
            resizable
            sortable
          >
            <HeaderCell>{t('userList.overview.firstName')}</HeaderCell>
            <RCell dataKey={'firstName'}>
              {(rowData: RowDataType<TinyUserFragment>) => (
                <Link to={`/users/edit/${rowData.id}`}>
                  {rowData.firstName || ''}
                </Link>
              )}
            </RCell>
          </Column>
          <Column
            width={200}
            align="left"
            resizable
            sortable
          >
            <HeaderCell>{t('userList.overview.name')}</HeaderCell>
            <RCell dataKey={'name'}>
              {(rowData: RowDataType<TinyUserFragment>) => (
                <Link to={`/users/edit/${rowData.id}`}>
                  {rowData.name || t('userList.overview.unknown')}
                </Link>
              )}
            </RCell>
          </Column>
          <Column
            width={200}
            align="left"
            resizable
          >
            <HeaderCell>{t('userCreateOrEditView.email')}</HeaderCell>
            <RCell dataKey="email" />
          </Column>
          <Column
            width={200}
            align="left"
            resizable
          >
            <HeaderCell>{t('userCreateOrEditView.userRoles')}</HeaderCell>
            <RCell dataKey="roles">
              {(rowData: RowDataType<TinyUserFragment>) =>
                rowData.roles
                  ?.map((r: FullUserRoleFragment) => r.name)
                  .join(', ')
              }
            </RCell>
          </Column>
          {/* subscription */}
          <Column
            width={200}
            align="left"
            resizable
            sortable
          >
            <HeaderCell>{t('userList.overview.subscriptions')}</HeaderCell>
            <RCell dataKey="subscriptionCount">
              {(rowData: RowDataType<TinyUserFragment>) => {
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
              }}
            </RCell>
          </Column>
          <Column
            width={180}
            align="center"
            fixed="right"
          >
            <HeaderCell align="center">{t('action')}</HeaderCell>
            <PaddedCell>
              {(rowData: RowDataType<TinyUserFragment>) => (
                <>
                  <PermissionControl
                    qualifyingPermissions={['CAN_RESET_USER_PASSWORD']}
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
                    qualifyingPermissions={['CAN_RESET_USER_TOTP']}
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
                  <PermissionControl
                    qualifyingPermissions={['CAN_DELETE_USER']}
                  >
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
              )}
            </PaddedCell>
          </Column>
        </Table>

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
            variant="contained"
            disabled={isDeleting}
            onClick={handleDeleteUser}
          >
            {t('userCreateOrEditView.confirm')}
          </Button>
          <Button
            variant="text"
            onClick={() => setConfirmationDialogOpen(false)}
          >
            {t('userCreateOrEditView.cancel')}
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
          <p>
            {t('userList.overview.resetTotpConfirmation', {
              name: currentUser?.name || '',
            })}
          </p>
        </DialogContent>

        <DialogActions>
          <Button
            variant="contained"
            color="warning"
            disabled={isResettingTotp}
            onClick={handleResetTotp}
          >
            {t('userCreateOrEditView.confirm')}
          </Button>
          <Button
            variant="text"
            onClick={() => setIsResetTotpDialogOpen(false)}
          >
            {t('userCreateOrEditView.cancel')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

const CheckedPermissionComponent = createCheckedPermissionComponent([
  'CAN_GET_USERS',
  'CAN_GET_USER',
  'CAN_CREATE_USER',
  'CAN_DELETE_USER',
  'CAN_RESET_USER_PASSWORD',
])(UserList);
export { CheckedPermissionComponent as UserList };
