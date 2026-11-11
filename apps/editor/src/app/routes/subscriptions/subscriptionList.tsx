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
  ReactivateSubscriptionDocument,
  SubscriptionFilter,
  SubscriptionListDocument,
  SubscriptionSort,
  TinySubscriptionFragment,
} from '@wepublish/editor/api';
import {
  CanCancelSubscription,
  CanCreateSubscription,
  CanGetSubscription,
  CanGetSubscriptions,
} from '@wepublish/permissions';
import {
  createCheckedPermissionComponent,
  DataTable,
  DescriptionList,
  DescriptionListItem,
  enqueueSnackbar,
  ExportSubscriptions,
  IconButton,
  IconButtonTooltip,
  InfoTooltip,
  Link,
  ListViewActions,
  ListViewContainer,
  ListViewHeader,
  mapTableSortTypeToGraphQLSortOrder,
  Pagination,
  PermissionControl,
  SubscriptionListFilter,
  TableWrapper,
  useAuthorisation,
  useListViewState,
  PageTitle,
} from '@wepublish/ui/editor';
import { ReactNode, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdAdd, MdDelete, MdRestartAlt } from 'react-icons/md';
import { Link as RouterLink } from 'react-router-dom';

import { ReactivateSubscriptionModal } from './reactivateSubscriptionModal';

const Actions = styled(ListViewActions)`
  grid-column: 3;
`;

const ActionCell = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  align-items: center;
  justify-items: center;
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

  const canCreate = useAuthorisation(CanCreateSubscription.id);
  const urlToRedirect = `/subscriptions/create${userId ? `${`?userId=${userId}`}` : ''}`;

  return (
    <Button
      component={RouterLink}
      to={urlToRedirect}
      variant="contained"
      disabled={isLoading || !canCreate}
      startIcon={<MdAdd />}
    >
      {t('subscriptionList.overview.newSubscription')}
    </Button>
  );
};

function SubscriptionList() {
  const { filter, setFilter, sortField, sortOrder, setSort, limit, setLimit } =
    useListViewState<SubscriptionFilter>('subscriptions', {
      defaultSortField: 'createdAt',
    });
  const [isConfirmationDialogOpen, setConfirmationDialogOpen] = useState(false);
  const [isReactivationDialogOpen, setReactivationDialogOpen] = useState(false);
  const [currentSubscription, setCurrentSubscription] =
    useState<TinySubscriptionFragment>();

  const [page, setPage] = useState(1);

  const activeFilter = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(filter).filter(([, value]) => value !== null)
      ) as SubscriptionFilter,
    [filter]
  );

  const {
    data,
    refetch,
    loading: isLoading,
  } = useQuery(SubscriptionListDocument, {
    variables: {
      filter: activeFilter,
      take: limit,
      skip: (page - 1) * limit,
      sort: mapColumFieldToGraphQLField(sortField),
      order: mapTableSortTypeToGraphQLSortOrder(sortOrder),
    },
  });

  const subscriptions = data?.subscriptions?.nodes ?? [];

  useEffect(() => {
    refetch({
      filter: activeFilter,
      take: limit,
      skip: (page - 1) * limit,
      sort: mapColumFieldToGraphQLField(sortField),
      order: mapTableSortTypeToGraphQLSortOrder(sortOrder),
    });
  }, [activeFilter, page, limit, sortOrder, sortField]);

  const [deleteSubscription, { loading: isDeleting }] = useMutation(
    DeleteSubscriptionDocument
  );

  const [reactivateSubscription, { loading: isReactivating }] = useMutation(
    ReactivateSubscriptionDocument
  );

  const { t } = useTranslation();

  const totalPages = Math.ceil((data?.subscriptions?.totalCount ?? 0) / limit);

  if (totalPages > 0 && page > totalPages) {
    setPage(1);
  }

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
          <PageTitle>{t('subscriptionList.overview.subscription')}</PageTitle>
        </ListViewHeader>

        <PermissionControl qualifyingPermissions={[CanCreateSubscription.id]}>
          <Actions>
            <ExportSubscriptions filter={filter} />
            <NewSubscriptionButton isLoading={isLoading} />
          </Actions>
        </PermissionControl>
      </ListViewContainer>

      <TableWrapper>
        <DataTable
          storageKey="subscriptions"
          filters={
            <SubscriptionListFilter
              filter={filter}
              isLoading={isLoading}
              onSetFilter={filter => {
                setFilter(filter);
                setPage(1);
              }}
            />
          }
          filterCount={
            Object.values(filter).filter(value => value !== undefined).length
          }
          onResetFilters={() => {
            setFilter({});
            setPage(1);
          }}
          data={subscriptions}
          loading={isLoading}
          sortColumn={sortField}
          sortOrder={sortOrder}
          onSort={(sortColumn, sortOrder) => {
            setSort(sortColumn, sortOrder);
            setPage(1);
          }}
          sortable={['createdAt', 'modifiedAt', 'name']}
          columns={[
            {
              id: 'createdat',
              label: t('subscriptionList.overview.createdAt'),
              width: 200,
              align: 'left',
              sortKey: 'createdAt',
              render: ({ createdAt }: TinySubscriptionFragment) =>
                t('subscriptionList.overview.createdAtDate', {
                  createdAtDate: new Date(createdAt),
                }),
            },
            {
              id: 'modifiedat',
              label: t('userList.overview.modifiedAt'),
              width: 200,
              align: 'left',
              sortKey: 'modifiedAt',
              render: ({ modifiedAt }: TinySubscriptionFragment) =>
                t('subscriptionList.overview.modifiedAtDate', {
                  modifiedAtDate: new Date(modifiedAt),
                }),
            },
            {
              id: 'memberplan',
              label: t('subscriptionList.overview.memberPlan'),
              width: 200,
              render: (rowData: TinySubscriptionFragment) => (
                <>
                  <Link to={`/subscriptions/edit/${rowData.id}`}>
                    {rowData.memberPlan.name}
                  </Link>

                  {rowData.deactivation && (
                    <DeactivationInfo data-testid="deactivationIcon">
                      <InfoTooltip text={t('deactivated')} />
                    </DeactivationInfo>
                  )}
                </>
              ),
            },
            {
              id: 'name',
              alwaysVisible: true,
              label: t('subscriptionList.overview.name'),
              width: 300,
              align: 'left',
              render: (rowData: TinySubscriptionFragment) =>
                userNameView(rowData as TinySubscriptionFragment),
            },
            {
              id: 'action',
              label: t('action'),
              width: 120,
              align: 'center',
              fixed: true,
              render: (rowData: TinySubscriptionFragment) => (
                <ActionCell data-testid="subscriptionActions">
                  <IconButtonTooltip caption={t('delete')}>
                    <IconButton
                      size="small"
                      color="error"
                      data-testid="deleteSubscription"
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

                  {rowData.deactivation && (
                    <IconButtonTooltip
                      caption={t('subscriptionList.overview.reactivate')}
                    >
                      <IconButton
                        size="small"
                        color="success"
                        data-testid="reactivateSubscription"
                        aria-label={t('subscriptionList.overview.reactivate')}
                        onClick={e => {
                          e.preventDefault();
                          setCurrentSubscription(
                            rowData as TinySubscriptionFragment
                          );
                          setReactivationDialogOpen(true);
                        }}
                      >
                        <MdRestartAlt />
                      </IconButton>
                    </IconButtonTooltip>
                  )}
                </ActionCell>
              ),
            },
          ]}
        />

        <Pagination
          state={{
            page,
            limit,
            setPage,
            setLimit,
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
            variant="text"
            onClick={() => setConfirmationDialogOpen(false)}
          >
            {t('subscriptionList.panels.cancel')}
          </Button>

          <Button
            variant="contained"
            color="error"
            disabled={isDeleting}
            onClick={async () => {
              if (!currentSubscription) {
                return;
              }

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
        </DialogActions>
      </Dialog>

      <ReactivateSubscriptionModal
        open={isReactivationDialogOpen}
        loading={isReactivating}
        userName={currentSubscription?.user?.name}
        memberPlanName={currentSubscription?.memberPlan.name}
        monthlyAmount={currentSubscription?.monthlyAmount}
        paymentPeriodicity={currentSubscription?.paymentPeriodicity}
        currency={currentSubscription?.currency}
        paidUntil={
          currentSubscription?.paidUntil ?
            new Date(currentSubscription.paidUntil)
          : null
        }
        deactivation={currentSubscription?.deactivation}
        onClose={() => setReactivationDialogOpen(false)}
        onConfirm={async () => {
          if (!currentSubscription) {
            return;
          }

          await reactivateSubscription({
            variables: { id: currentSubscription.id },
          });
          enqueueSnackbar(t('toast.updatedSuccess'), {
            variant: 'success',
            autoHideDuration: 2000,
          });
          setReactivationDialogOpen(false);
          refetch();
        }}
      />
    </>
  );
}
const CheckedPermissionComponent = createCheckedPermissionComponent([
  CanGetSubscriptions.id,
  CanGetSubscription.id,
  CanCreateSubscription.id,
  CanCancelSubscription.id,
])(SubscriptionList);
export { CheckedPermissionComponent as SubscriptionList };
