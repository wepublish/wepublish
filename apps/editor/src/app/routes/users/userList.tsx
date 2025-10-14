import { ApolloError } from '@apollo/client';
import {
  FullUserFragment,
  useDeleteUserMutation,
  UserFilter,
  UserRole,
  UserSort,
  useUserListQuery,
} from '@wepublish/editor/api';
import {
  createCheckedPermissionComponent,
  DEFAULT_MAX_TABLE_PAGES,
  DEFAULT_TABLE_PAGE_SIZES,
  DescriptionList,
  DescriptionListItem,
  IconButton,
  IconButtonTooltip,
  ListFilters,
  ListViewActions,
  ListViewContainer,
  ListViewHeader,
  mapTableSortTypeToGraphQLSortOrder,
  PaddedCell,
  PermissionControl,
  ResetUserPasswordForm,
  Table,
  TableWrapper,
} from '@wepublish/ui/editor';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdAdd, MdDelete, MdPassword } from 'react-icons/md';
import { Link } from 'react-router-dom';
import {
  Button,
  IconButton as RIconButton,
  Message,
  Modal,
  Pagination,
  Table as RTable,
  toaster,
} from 'rsuite';
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
    default:
      return null;
  }
}

function UserList() {
  const [filter, setFilter] = useState<UserFilter>({});

  const [isResetUserPasswordOpen, setIsResetUserPasswordOpen] = useState(false);
  const [isConfirmationDialogOpen, setConfirmationDialogOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<FullUserFragment>();

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [sortField, setSortField] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [users, setUsers] = useState<FullUserFragment[]>([]);

  const {
    data,
    refetch,
    loading: isLoading,
    error: userListQueryError,
  } = useUserListQuery({
    variables: {
      filter: filter || undefined,
      take: limit,
      skip: (page - 1) * limit,
      sort: mapColumFieldToGraphQLField(sortField),
      order: mapTableSortTypeToGraphQLSortOrder(sortOrder),
    },
    fetchPolicy: 'network-only',
  });

  const updateFilter = (filter: UserFilter) => {
    setFilter(filter);
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

  const [deleteUser, { loading: isDeleting }] = useDeleteUserMutation();

  const { t } = useTranslation();

  useEffect(() => {
    if (data?.users?.nodes) {
      setUsers(data.users.nodes);
      if (data.users.totalCount + 9 < page * limit) {
        setPage(1);
      }
    }
  }, [data?.users]);

  if (userListQueryError) {
    return <div>{userListQueryError.message}</div>;
  }

  /**
   * UI helpers
   */
  function getSubscriptionCellView(user: FullUserFragment) {
    const subscriptions = user.subscriptions;
    const totalSubscriptions = subscriptions?.length;
    // one subscription
    if (subscriptions?.length === 1) {
      return <>{t('userList.overview.oneSubscription')}</>;
    }
    // multiple subscriptions
    if (subscriptions?.length) {
      return (
        <>
          {t('userList.overview.amountOfSubscriptions', {
            amount: totalSubscriptions,
          })}
        </>
      );
    }
    // no subscription
    return <>{t('userList.overview.noSubscriptions')}</>;
  }

  const handleDeleteUser = async () => {
    if (!currentUser) return;

    try {
      await deleteUser({
        variables: { id: currentUser.id },
      });
      toaster.push(
        <Message
          type="success"
          showIcon
          closable
          duration={2000}
        >
          {t('toast.deletedSuccess')}
        </Message>
      );
      setConfirmationDialogOpen(false);
      refetch();
    } catch (e) {
      if (e instanceof ApolloError) {
        if (e.message.includes('Foreign key constraint')) {
          toaster.push(
            <Message
              type="error"
              showIcon
              closable
              duration={2000}
            >
              {t('userCreateOrEditView.foreignKeySubscription')}
            </Message>
          );
          setConfirmationDialogOpen(false);
        } else {
          toaster.push(
            <Message
              type="error"
              showIcon
              closable
              duration={2000}
            >
              {t('userCreateOrEditView.errorOnUpdate', { error: e })}
            </Message>
          );
        }
      }
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
              <RIconButton
                appearance="primary"
                disabled={isLoading}
                icon={<MdAdd />}
              >
                {t('userList.overview.newUser')}
              </RIconButton>
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
            setSortOrder(sortType!);
            setSortField(sortColumn);
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
              {({ createdAt }: RowDataType<FullUserFragment>) =>
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
              {({ modifiedAt }: RowDataType<FullUserFragment>) =>
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
              {(rowData: RowDataType<FullUserFragment>) => (
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
              {(rowData: RowDataType<FullUserFragment>) => (
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
              {(rowData: RowDataType<FullUserFragment>) =>
                rowData.roles?.map((r: UserRole) => r.name).join(', ')
              }
            </RCell>
          </Column>
          {/* subscription */}
          <Column
            width={200}
            align="left"
            resizable
          >
            <HeaderCell>{t('userList.overview.subscriptions')}</HeaderCell>
            <RCell>
              {(rowData: RowDataType<FullUserFragment>) => (
                <div>
                  {getSubscriptionCellView(rowData as FullUserFragment)}
                </div>
              )}
            </RCell>
          </Column>
          <Column
            width={100}
            align="center"
            fixed="right"
          >
            <HeaderCell>{t('userList.overview.action')}</HeaderCell>
            <PaddedCell>
              {(rowData: RowDataType<FullUserFragment>) => (
                <>
                  <PermissionControl
                    qualifyingPermissions={['CAN_RESET_USER_PASSWORD']}
                  >
                    <IconButtonTooltip
                      caption={t('userList.overview.resetPassword')}
                    >
                      <IconButton
                        circle
                        size="sm"
                        icon={<MdPassword />}
                        onClick={e => {
                          setCurrentUser(rowData as FullUserFragment);
                          setIsResetUserPasswordOpen(true);
                        }}
                      />
                    </IconButtonTooltip>
                  </PermissionControl>
                  <PermissionControl
                    qualifyingPermissions={['CAN_DELETE_USER']}
                  >
                    <IconButtonTooltip caption={t('delete')}>
                      <IconButton
                        circle
                        size="sm"
                        appearance="ghost"
                        color="red"
                        icon={<MdDelete />}
                        onClick={() => {
                          setConfirmationDialogOpen(true);
                          setCurrentUser(rowData as FullUserFragment);
                        }}
                      />
                    </IconButtonTooltip>
                  </PermissionControl>
                </>
              )}
            </PaddedCell>
          </Column>
        </Table>

        <Pagination
          limit={limit}
          limitOptions={DEFAULT_TABLE_PAGE_SIZES}
          maxButtons={DEFAULT_MAX_TABLE_PAGES}
          first
          last
          prev
          next
          ellipsis
          boundaryLinks
          layout={['total', '-', 'limit', '|', 'pager', 'skip']}
          total={data?.users.totalCount ?? 0}
          activePage={page}
          onChangePage={page => setPage(page)}
          onChangeLimit={limit => setLimit(limit)}
        />
      </TableWrapper>

      {/* reset user password */}
      {currentUser?.id && (
        <Modal
          open={isResetUserPasswordOpen}
          onClose={() => setIsResetUserPasswordOpen(false)}
        >
          <Modal.Header>
            <Modal.Title>{t('userCreateOrEditView.resetPassword')}</Modal.Title>
          </Modal.Header>

          <Modal.Body>
            <ResetUserPasswordForm
              userID={currentUser?.id}
              userName={currentUser?.name}
              onClose={() => setIsResetUserPasswordOpen(false)}
            />
          </Modal.Body>

          <Modal.Footer>
            <Button
              onClick={() => setIsResetUserPasswordOpen(false)}
              appearance="subtle"
            >
              {t('userCreateOrEditView.cancel')}
            </Button>
          </Modal.Footer>
        </Modal>
      )}

      {/* delete user modal */}
      <Modal
        open={isConfirmationDialogOpen}
        onClose={() => setConfirmationDialogOpen(false)}
      >
        <Modal.Header>
          <Modal.Title>{t('userCreateOrEditView.deleteUser')}</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <DescriptionList>
            <DescriptionListItem label={t('userCreateOrEditView.name')}>
              {currentUser?.name || t('userCreateOrEditView.Unknown')}
            </DescriptionListItem>
          </DescriptionList>
        </Modal.Body>

        <Modal.Footer>
          <Button
            appearance="primary"
            disabled={isDeleting}
            onClick={handleDeleteUser}
          >
            {t('userCreateOrEditView.confirm')}
          </Button>
          <Button
            onClick={() => setConfirmationDialogOpen(false)}
            appearance="subtle"
          >
            {t('userCreateOrEditView.cancel')}
          </Button>
        </Modal.Footer>
      </Modal>
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
