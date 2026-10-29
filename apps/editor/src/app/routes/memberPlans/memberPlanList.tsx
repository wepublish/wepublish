import { useMutation, useQuery } from '@apollo/client/react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  InputAdornment,
  TextField,
} from '@mui/material';
import {
  DeleteMemberPlanDocument,
  FullMemberPlanFragment,
  MemberPlanListDocument,
  MemberPlanListQuery,
  MemberPlanSort,
} from '@wepublish/editor/api';
import {
  CanCreateMemberPlan,
  CanDeleteMemberPlan,
  CanGetMemberPlan,
  CanGetMemberPlans,
  CanGetSubscriptionFlows,
} from '@wepublish/permissions';
import {
  createCheckedPermissionComponent,
  DataTable,
  DescriptionList,
  DescriptionListItem,
  IconButton,
  IconButtonTooltip,
  InfoTooltip,
  Link,
  ListViewActions,
  ListViewContainer,
  ListViewHeader,
  mapTableSortTypeToGraphQLSortOrder,
  PermissionControl,
  TableWrapper,
  useListViewState,
  PageTitle,
} from '@wepublish/ui/editor';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdAdd, MdDelete, MdSearch } from 'react-icons/md';
import { Link as RouterLink } from 'react-router-dom';

function mapColumnFieldToGraphQLField(
  columnField: string
): MemberPlanSort | null {
  switch (columnField) {
    case 'createdAt':
      return MemberPlanSort.CreatedAt;
    case 'modifiedAt':
      return MemberPlanSort.ModifiedAt;
    default:
      return null;
  }
}

const hasBrokenPaymentProvider = (memberPlan: FullMemberPlanFragment) =>
  memberPlan.availablePaymentMethods.every(({ paymentMethods }) =>
    paymentMethods.every(({ paymentProvider }) => Boolean(paymentProvider))
  );

function MemberPlanList() {
  const { t } = useTranslation();
  const [filter, setFilter] = useState('');
  const [isConfirmationDialogOpen, setConfirmationDialogOpen] = useState(false);
  const [currentMemberPlan, setCurrentMemberPlan] =
    useState<FullMemberPlanFragment>();

  const { sortField, sortOrder, setSort } = useListViewState('memberPlans', {
    defaultSortField: 'modifiedAt',
    defaultSortOrder: 'desc',
  });

  const variables = useMemo(
    () => ({
      filter: filter ? { name: filter } : undefined,
      take: 50,
      sort: mapColumnFieldToGraphQLField(sortField),
      order: mapTableSortTypeToGraphQLSortOrder(sortOrder),
    }),
    [filter, sortField, sortOrder]
  );

  const { data, loading: isLoading } = useQuery(MemberPlanListDocument, {
    variables,
  });

  const memberPlans = data?.memberPlans.nodes ?? [];

  const [deleteMemberPlan, { loading: isDeleting }] = useMutation(
    DeleteMemberPlanDocument
  );

  return (
    <>
      <ListViewContainer>
        <ListViewHeader>
          <PageTitle>{t('memberPlanList.title')}</PageTitle>
        </ListViewHeader>

        <PermissionControl qualifyingPermissions={[CanCreateMemberPlan.id]}>
          <ListViewActions>
            <Button
              component={RouterLink}
              to="/memberplans/create"
              variant="contained"
              startIcon={<MdAdd />}
              disabled={isLoading}
            >
              {t('memberPlanList.createNew')}
            </Button>
          </ListViewActions>
        </PermissionControl>
      </ListViewContainer>

      <TableWrapper>
        <DataTable
          filters={
            <TextField
              label={t('search')}
              value={filter}
              onChange={event => setFilter(event.target.value)}
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <MdSearch />
                    </InputAdornment>
                  ),
                },
              }}
            />
          }
          filterCount={filter ? 1 : 0}
          onResetFilters={() => {
            setFilter('');
          }}
          storageKey="member-plans"
          data={memberPlans}
          loading={isLoading}
          sortColumn={sortField}
          sortOrder={sortOrder}
          onSort={(sortColumn, sortType) => setSort(sortColumn, sortType)}
          sortable={['createdAt', 'modifiedAt']}
          columns={[
            {
              id: 'paymentproviderstatusinfo',
              label: (
                <InfoTooltip
                  text={t('memberPlanList.paymentProviderStatusInfo')}
                />
              ),
              width: 40,
              align: 'left',
              render: rowData =>
                hasBrokenPaymentProvider(rowData as FullMemberPlanFragment) ?
                  `✅`
                : `❌`,
            },
            {
              id: 'name',
              alwaysVisible: true,
              label: t('memberPlanList.name'),
              width: 200,
              align: 'left',
              render: rowData => (
                <Link to={`/memberplans/edit/${rowData.id}`}>
                  {rowData.name || t('untitled')}
                </Link>
              ),
            },
            {
              id: 'created',
              label: t('memberPlanList.created'),
              width: 200,
              align: 'left',
              sortKey: 'createdAt',
              render: rowData =>
                t('memberPlanList.createdAt', {
                  createdAt: new Date(rowData.createdAt),
                }),
            },
            {
              id: 'modified',
              label: t('memberPlanList.modified'),
              width: 200,
              align: 'left',
              sortKey: 'modifiedAt',
              render: rowData =>
                t('memberPlanList.modifiedAt', {
                  modifiedAt: new Date(rowData.modifiedAt),
                }),
            },
            {
              id: 'editflowshort',
              label: t('memberPlanList.editFlowShort'),
              width: 250,
              align: 'left',
              render: rowData => (
                <PermissionControl
                  qualifyingPermissions={[CanGetSubscriptionFlows.id]}
                >
                  <Link to={`/communicationflows/edit/${rowData.id}`}>
                    {t('memberPlanList.editFlow')}
                  </Link>
                </PermissionControl>
              ),
            },
            {
              id: 'action',
              label: t('action'),
              width: 100,
              align: 'center',
              fixed: true,
              render: rowData => (
                <PermissionControl
                  qualifyingPermissions={[CanDeleteMemberPlan.id]}
                >
                  <IconButtonTooltip caption={t('delete')}>
                    <IconButton
                      size="small"
                      color="error"
                      aria-label={t('delete')}
                      onClick={() => {
                        setConfirmationDialogOpen(true);
                        setCurrentMemberPlan(rowData as FullMemberPlanFragment);
                      }}
                    >
                      <MdDelete />
                    </IconButton>
                  </IconButtonTooltip>
                </PermissionControl>
              ),
            },
          ]}
        />
      </TableWrapper>

      <Dialog
        fullWidth
        open={isConfirmationDialogOpen}
        maxWidth="sm"
      >
        <DialogTitle>{t('memberPlanList.deleteModalTitle')}</DialogTitle>

        <DialogContent>
          <DescriptionList>
            <DescriptionListItem label={t('memberPlanList.name')}>
              {currentMemberPlan?.name || t('untitled')}
            </DescriptionListItem>
          </DescriptionList>
        </DialogContent>

        <DialogActions>
          <Button
            variant="text"
            onClick={() => setConfirmationDialogOpen(false)}
          >
            {t('cancel')}
          </Button>

          <Button
            variant="contained"
            disabled={isDeleting}
            onClick={async () => {
              if (!currentMemberPlan) {
                return;
              }

              await deleteMemberPlan({
                variables: { id: currentMemberPlan.id },
                update: cache => {
                  const query = cache.readQuery<MemberPlanListQuery>({
                    query: MemberPlanListDocument,
                    variables: {
                      filter: filter ? { name: filter } : undefined,
                      take: 50,
                    },
                  });

                  if (!query) {
                    return;
                  }

                  cache.writeQuery<MemberPlanListQuery>({
                    query: MemberPlanListDocument,
                    data: {
                      __typename: 'Query',
                      memberPlans: {
                        ...query.memberPlans,
                        nodes: query.memberPlans.nodes.filter(
                          memberPlan => memberPlan.id !== currentMemberPlan.id
                        ),
                      },
                    },
                  });
                },
              });

              setConfirmationDialogOpen(false);
            }}
            color="error"
          >
            {t('confirm')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

const CheckedPermissionComponent = createCheckedPermissionComponent([
  CanGetMemberPlans.id,
  CanGetMemberPlan.id,
  CanCreateMemberPlan.id,
  CanDeleteMemberPlan.id,
])(MemberPlanList);
export { CheckedPermissionComponent as MemberPlanList };
