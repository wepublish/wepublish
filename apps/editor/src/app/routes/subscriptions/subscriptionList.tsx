import { useMutation, useQuery } from '@apollo/client/react';
import styled from '@emotion/styled';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from '@mui/material';
import {
  DeleteSubscriptionDocument,
  SubscriptionFilter,
  SubscriptionListDocument,
  SubscriptionSort,
  TinySubscriptionFragment,
} from '@wepublish/editor/api';
import {
  createCheckedPermissionComponent,
  DescriptionList,
  DescriptionListItem,
  enqueueSnackbar,
  ExportSubscriptions,
  IconButton,
  IconButtonTooltip,
  InfoTooltip,
  ListViewActions,
  ListViewContainer,
  ListViewFilterArea,
  ListViewHeader,
  mapTableSortTypeToGraphQLSortOrder,
  PaddedCell,
  Pagination,
  PermissionControl,
  SortType,
  SubscriptionListFilter,
  Table,
  TableWrapper,
  useAuthorisation,
  useListViewState,
} from '@wepublish/ui/editor';
import { ReactNode, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdAdd, MdDelete } from 'react-icons/md';
import { Link } from 'react-router-dom';
import { Table as RTable } from 'rsuite';
import { RowDataType } from 'rsuite-table';

const { Column, HeaderCell, Cell: RCell } = RTable;

const Actions = styled(ListViewActions)`
  grid-column: 3;
`;

const DeactivationInfo = styled.span`
  display: inline-flex;
  margin-left: 4px;
  vertical-align: middle;
`;

function mapColumFieldToGraphQLField(
  columnField: string
): SubscriptionSort | null {
  switch (columnField) {
    case 'createdAt':
      return SubscriptionSort.CreatedAt;
    case 'modifiedAt':
      return SubscriptionSort.ModifiedAt;
    default:
      return null;
  }
}

export const NewSubscriptionButton = ({
  isLoading,
  userId,
}: {
  isLoading?: boolean;
  userId?: string;
}) => {
  const { t } = useTranslation();

  const canCreate = useAuthorisation('CAN_CREATE_SUBSCRIPTION');
  const urlToRedirect = `/subscriptions/create${userId ? `${`?userId=${userId}`}` : ''}`;

  return (
    <Link to={urlToRedirect}>
      <Button
        variant="contained"
        disabled={isLoading || !canCreate}
        startIcon={<MdAdd />}
      >
        {t('subscriptionList.overview.newSubscription')}
      </Button>
    </Link>
  );
};

function SubscriptionList() {
  const { filter, setFilter, sortField, sortOrder, setSort, limit, setLimit } =
    useListViewState<SubscriptionFilter>('subscriptions', {
      defaultSortField: 'createdAt',
    });
  const [isConfirmationDialogOpen, setConfirmationDialogOpen] = useState(false);
  const [currentSubscription, setCurrentSubscription] =
    useState<TinySubscriptionFragment>();

  const [page, setPage] = useState(1);
  const [subscriptions, setSubscriptions] = useState<
    TinySubscriptionFragment[]
  >([]);

  // double check
  Object.keys(filter).forEach(el => {
    if (filter[el as keyof SubscriptionFilter] === null) {
      delete filter[el as keyof SubscriptionFilter];
    }
  });

  const {
    data,
    refetch,
    loading: isLoading,
  } = useQuery(SubscriptionListDocument, {
    variables: {
      filter,
      take: limit,
      skip: (page - 1) * limit,
      sort: mapColumFieldToGraphQLField(sortField),
      order: mapTableSortTypeToGraphQLSortOrder(sortOrder),
    },
  });

  useEffect(() => {
    refetch({
      filter,
      take: limit,
      skip: (page - 1) * limit,
      sort: mapColumFieldToGraphQLField(sortField),
      order: mapTableSortTypeToGraphQLSortOrder(sortOrder),
    });
  }, [filter, page, limit, sortOrder, sortField]);

  const [deleteSubscription, { loading: isDeleting }] = useMutation(
    DeleteSubscriptionDocument
  );

  const { t } = useTranslation();

  useEffect(() => {
    if (data?.subscriptions?.nodes) {
      setSubscriptions(data.subscriptions.nodes);
      if (Math.ceil(data.subscriptions.totalCount / limit) < page) {
        setPage(1);
      }
    }
  }, [data?.subscriptions]);

  /**
   * UI helper
   */
  function userNameView(fullUser: TinySubscriptionFragment): ReactNode {
    const user = fullUser.user;
    // user deleted
    if (!user) {
      return t('subscriptionList.overview.deleted');
    }

    return [user.firstName, user.name].join(' ');
  }

  return (
    <>
      <ListViewContainer>
        <ListViewHeader>
          <h2>{t('subscriptionList.overview.subscription')}</h2>
        </ListViewHeader>

        <PermissionControl qualifyingPermissions={['CAN_CREATE_SUBSCRIPTION']}>
          <Actions>
            <ExportSubscriptions filter={filter} />
            <NewSubscriptionButton isLoading={isLoading} />
          </Actions>
        </PermissionControl>

        <ListViewFilterArea>
          <SubscriptionListFilter
            filter={filter}
            isLoading={isLoading}
            onSetFilter={filter => {
              setFilter(filter);
              setPage(1);
            }}
          />
        </ListViewFilterArea>
      </ListViewContainer>

      <TableWrapper>
        <Table
          fillHeight
          loading={isLoading}
          data={subscriptions}
          sortColumn={sortField}
          sortType={sortOrder}
          onSortColumn={(sortColumn: string, sortType?: SortType) => {
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
            <HeaderCell>{t('subscriptionList.overview.createdAt')}</HeaderCell>
            <RCell dataKey="createdAt">
              {({ createdAt }: RowDataType<TinySubscriptionFragment>) =>
                t('subscriptionList.overview.createdAtDate', {
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
              {({ modifiedAt }: RowDataType<TinySubscriptionFragment>) =>
                t('subscriptionList.overview.modifiedAtDate', {
                  modifiedAtDate: new Date(modifiedAt),
                })
              }
            </RCell>
          </Column>
          {/* subscription */}
          <Column width={200}>
            <HeaderCell>{t('subscriptionList.overview.memberPlan')}</HeaderCell>
            <RCell dataKey={'subscription'}>
              {(rowData: RowDataType<TinySubscriptionFragment>) => (
                <>
                  <Link to={`/subscriptions/edit/${rowData.id}`}>
                    {rowData.memberPlan.name}
                  </Link>

                  {rowData.deactivation && (
                    <DeactivationInfo>
                      <InfoTooltip text={t('deactivated')} />
                    </DeactivationInfo>
                  )}
                </>
              )}
            </RCell>
          </Column>
          {/* name */}
          <Column
            width={300}
            align="left"
            resizable
            sortable
          >
            <HeaderCell>{t('subscriptionList.overview.name')}</HeaderCell>
            <RCell dataKey={'name'}>
              {(rowData: RowDataType<TinySubscriptionFragment>) =>
                userNameView(rowData as TinySubscriptionFragment)
              }
            </RCell>
          </Column>
          {/* action */}
          <Column
            width={100}
            align="center"
            fixed="right"
          >
            <HeaderCell align="center">{t('action')}</HeaderCell>
            <PaddedCell>
              {(rowData: RowDataType<TinySubscriptionFragment>) => (
                <IconButtonTooltip caption={t('delete')}>
                  <IconButton
                    size="small"
                    color="error"
                    aria-label={t('delete')}
                    onClick={e => {
                      e.preventDefault();
                      setCurrentSubscription(
                        rowData as TinySubscriptionFragment
                      );
                      setConfirmationDialogOpen(true);
                    }}
                  >
                    <MdDelete />
                  </IconButton>
                </IconButtonTooltip>
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
          totalCount={data?.subscriptions.totalCount ?? 0}
        />
      </TableWrapper>

      <Dialog
        open={isConfirmationDialogOpen}
        onClose={() => setConfirmationDialogOpen(false)}
      >
        <DialogTitle>
          {t('subscriptionList.panels.deleteSubscription')}
        </DialogTitle>

        <DialogContent>
          <DescriptionList>
            <DescriptionListItem label={t('subscriptionList.panels.name')}>
              {currentSubscription?.user?.name ||
                t('subscriptionList.panels.unknown')}
            </DescriptionListItem>
          </DescriptionList>
        </DialogContent>

        <DialogActions>
          <Button
            variant="contained"
            disabled={isDeleting}
            onClick={async () => {
              if (!currentSubscription) return;

              await deleteSubscription({
                variables: { id: currentSubscription.id },
              });
              enqueueSnackbar(t('toast.deletedSuccess'), {
                variant: 'success',
                autoHideDuration: 2000,
              });
              setConfirmationDialogOpen(false);
              refetch();
            }}
          >
            {t('subscriptionList.panels.confirm')}
          </Button>
          <Button
            variant="text"
            onClick={() => setConfirmationDialogOpen(false)}
          >
            {t('subscriptionList.panels.cancel')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
const CheckedPermissionComponent = createCheckedPermissionComponent([
  'CAN_GET_SUBSCRIPTIONS',
  'CAN_GET_SUBSCRIPTION',
  'CAN_CREATE_SUBSCRIPTION',
  'CAN_DELETE_SUBSCRIPTION',
])(SubscriptionList);
export { CheckedPermissionComponent as SubscriptionList };
