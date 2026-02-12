import styled from '@emotion/styled';
import {
  FullSubscriptionFragment,
  getApiClientV2,
  SubscriptionFilter,
  SubscriptionSort,
  useDeleteSubscriptionMutation,
  useSubscriptionListQuery,
} from '@wepublish/editor/api-v2';
import {
  createCheckedPermissionComponent,
  DEFAULT_MAX_TABLE_PAGES,
  DEFAULT_TABLE_PAGE_SIZES,
  DescriptionList,
  DescriptionListItem,
  ExportSubscriptionsAsCsv,
  IconButtonTooltip,
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
} from '@wepublish/ui/editor';
import { TFunction } from 'i18next';
import { ReactNode, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdAdd, MdDelete, MdInfo } from 'react-icons/md';
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

const IconButtonSmallMargin = styled(RIconButton)`
  margin-left: 5px;
`;

const IconButton = styled(RIconButton)`
  margin-left: 20px;
`;

const Info = styled.div`
  position: relative;
`;

const Actions = styled(ListViewActions)`
  grid-column: 3;
`;

const DeactivationIcon = styled(MdInfo)<{ deactivated: boolean }>`
  margin-left: 10px;
  font-size: 16px;
  visibility: ${({ deactivated }) => (deactivated ? 'visible' : 'hidden')};
  color: #3498ff;
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
  t,
  userId,
}: {
  isLoading?: boolean;
  t: TFunction<'translation'>;
  userId?: string;
}) => {
  const canCreate = useAuthorisation('CAN_CREATE_SUBSCRIPTION');
  const urlToRedirect = `/subscriptions/create${userId ? `${`?userId=${userId}`}` : ''}`;
  return (
    <Link to={urlToRedirect}>
      <IconButton
        appearance="primary"
        disabled={isLoading || !canCreate}
      >
        <MdAdd />
        {t('subscriptionList.overview.newSubscription')}
      </IconButton>
    </Link>
  );
};

function SubscriptionList() {
  const [filter, setFilter] = useState({} as SubscriptionFilter);
  const [isConfirmationDialogOpen, setConfirmationDialogOpen] = useState(false);
  const [currentSubscription, setCurrentSubscription] =
    useState<FullSubscriptionFragment>();

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [sortField, setSortField] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [subscriptions, setSubscriptions] = useState<
    FullSubscriptionFragment[]
  >([]);

  // double check
  Object.keys(filter).forEach(el => {
    if (filter[el as keyof SubscriptionFilter] === null) {
      delete filter[el as keyof SubscriptionFilter];
    }
  });

  const client = getApiClientV2();
  const {
    data,
    refetch,
    loading: isLoading,
  } = useSubscriptionListQuery({
    client,
    variables: {
      filter,
      take: limit,
      skip: (page - 1) * limit,
      sort: mapColumFieldToGraphQLField(sortField),
      order: mapTableSortTypeToGraphQLSortOrder(sortOrder),
    },
    fetchPolicy: 'network-only',
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

  const [deleteSubscription, { loading: isDeleting }] =
    useDeleteSubscriptionMutation({ client });

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
  function userNameView(fullUser: FullSubscriptionFragment): ReactNode {
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
            <ExportSubscriptionsAsCsv filter={filter} />
            {NewSubscriptionButton({ isLoading, t })}
          </Actions>
        </PermissionControl>
        <ListViewFilterArea>
          <SubscriptionListFilter
            filter={filter}
            isLoading={isLoading}
            onSetFilter={filter => setFilter(filter)}
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
            setSortOrder(sortType ?? 'asc');
            setSortField(sortColumn);
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
              {({ createdAt }: RowDataType<FullSubscriptionFragment>) =>
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
              {({ modifiedAt }: RowDataType<FullSubscriptionFragment>) =>
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
              {(rowData: RowDataType<FullSubscriptionFragment>) => (
                <Link to={`/subscriptions/edit/${rowData.id}`}>
                  {rowData.memberPlan.name}
                </Link>
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
              {(rowData: RowDataType<FullSubscriptionFragment>) =>
                userNameView(rowData as FullSubscriptionFragment)
              }
            </RCell>
          </Column>
          {/* action */}
          <Column
            width={100}
            align="center"
            fixed="right"
          >
            <HeaderCell>{t('action')}</HeaderCell>
            <PaddedCell>
              {(rowData: RowDataType<FullSubscriptionFragment>) => (
                <>
                  <IconButtonTooltip caption={t('delete')}>
                    <IconButtonSmallMargin
                      circle
                      size="sm"
                      appearance="ghost"
                      color="red"
                      icon={<MdDelete />}
                      onClick={e => {
                        e.preventDefault();
                        setCurrentSubscription(
                          rowData as FullSubscriptionFragment
                        );
                        setConfirmationDialogOpen(true);
                      }}
                    />
                  </IconButtonTooltip>

                  <IconButtonTooltip caption={t('deactivated')}>
                    <Info>
                      <DeactivationIcon deactivated={rowData.deactivation} />
                    </Info>
                  </IconButtonTooltip>
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
          onChangeLimit={limit => setLimit(limit)}
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
