import { useMutation, useQuery } from '@apollo/client/react';
import styled from '@emotion/styled';
import {
  DeleteSubscriptionDocument,
  ReactivateSubscriptionDocument,
  SubscriptionFilter,
  SubscriptionListDocument,
  SubscriptionSort,
  TinySubscriptionFragment,
} from '@wepublish/editor/api';
import {
  createCheckedPermissionComponent,
  DEFAULT_MAX_TABLE_PAGES,
  DEFAULT_TABLE_PAGE_SIZES,
  DescriptionList,
  DescriptionListItem,
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
import { MdAdd, MdDelete, MdRestartAlt } from 'react-icons/md';
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

import { ReactivateSubscriptionModal } from './reactivateSubscriptionModal';

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
      <RIconButton
        appearance="primary"
        disabled={isLoading || !canCreate}
      >
        <MdAdd />
        {t('subscriptionList.overview.newSubscription')}
      </RIconButton>
    </Link>
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

  const [reactivateSubscription, { loading: isReactivating }] = useMutation(
    ReactivateSubscriptionDocument
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
                    <DeactivationInfo data-testid="deactivationIcon">
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
            width={120}
            align="center"
            fixed="right"
          >
            <HeaderCell align="center">{t('action')}</HeaderCell>
            <PaddedCell>
              {(rowData: RowDataType<TinySubscriptionFragment>) => (
                <>
                  <IconButtonTooltip caption={t('delete')}>
                    <IconButton
                      circle
                      size="sm"
                      appearance="ghost"
                      color="red"
                      data-testid="deleteSubscription"
                      icon={<MdDelete />}
                      aria-label={t('delete')}
                      onClick={e => {
                        e.preventDefault();
                        setCurrentSubscription(
                          rowData as TinySubscriptionFragment
                        );
                        setConfirmationDialogOpen(true);
                      }}
                    />
                  </IconButtonTooltip>

                  {rowData.deactivation && (
                    <IconButtonTooltip
                      caption={t('subscriptionList.overview.reactivate')}
                    >
                      <IconButton
                        circle
                        size="sm"
                        appearance="ghost"
                        color="green"
                        data-testid="reactivateSubscription"
                        icon={<MdRestartAlt />}
                        aria-label={t('subscriptionList.overview.reactivate')}
                        onClick={e => {
                          e.preventDefault();
                          setCurrentSubscription(
                            rowData as TinySubscriptionFragment
                          );
                          setReactivationDialogOpen(true);
                        }}
                      />
                    </IconButtonTooltip>
                  )}
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
          total={data?.subscriptions.totalCount ?? 0}
          activePage={page}
          onChangePage={page => setPage(page)}
          onChangeLimit={limit => {
            setLimit(limit);
            setPage(1);
          }}
        />
      </TableWrapper>

      <Modal
        open={isConfirmationDialogOpen}
        onClose={() => setConfirmationDialogOpen(false)}
      >
        <Modal.Header>
          <Modal.Title>
            {t('subscriptionList.panels.deleteSubscription')}
          </Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <DescriptionList>
            <DescriptionListItem label={t('subscriptionList.panels.name')}>
              {currentSubscription?.user?.name ||
                t('subscriptionList.panels.unknown')}
            </DescriptionListItem>
          </DescriptionList>
        </Modal.Body>

        <Modal.Footer>
          <Button
            disabled={isDeleting}
            appearance="primary"
            onClick={async () => {
              if (!currentSubscription) return;

              await deleteSubscription({
                variables: { id: currentSubscription.id },
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
            }}
          >
            {t('subscriptionList.panels.confirm')}
          </Button>
          <Button
            onClick={() => setConfirmationDialogOpen(false)}
            appearance="subtle"
          >
            {t('subscriptionList.panels.cancel')}
          </Button>
        </Modal.Footer>
      </Modal>

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
          if (!currentSubscription) return;

          await reactivateSubscription({
            variables: { id: currentSubscription.id },
          });
          toaster.push(
            <Message
              type="success"
              showIcon
              closable
              duration={2000}
            >
              {t('toast.updatedSuccess')}
            </Message>
          );
          setReactivationDialogOpen(false);
          refetch();
        }}
      />
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
