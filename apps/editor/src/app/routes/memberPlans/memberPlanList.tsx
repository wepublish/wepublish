import { useMutation, useQuery } from '@apollo/client/react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from '@mui/material';
import {
  DeleteMemberPlanDocument,
  FullMemberPlanFragment,
  MemberPlanListDocument,
  MemberPlanListQuery,
  MemberPlanSort,
} from '@wepublish/editor/api';
import {
  createCheckedPermissionComponent,
  DescriptionList,
  DescriptionListItem,
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
  Table,
  TableWrapper,
  useListViewState,
} from '@wepublish/ui/editor';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdAdd, MdDelete, MdSearch } from 'react-icons/md';
import { Link } from 'react-router-dom';
import { Input, InputGroup, Table as RTable } from 'rsuite';
import { RowDataType } from 'rsuite-table';

const { Column, HeaderCell, Cell: RCell } = RTable;

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
  const [memberPlans, setMemberPlans] = useState<FullMemberPlanFragment[]>([]);
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

  const [deleteMemberPlan, { loading: isDeleting }] = useMutation(
    DeleteMemberPlanDocument
  );

  useEffect(() => {
    if (data?.memberPlans?.nodes) {
      setMemberPlans(data.memberPlans.nodes);
    }
  }, [data?.memberPlans]);

  return (
    <>
      <ListViewContainer>
        <ListViewHeader>
          <h2>{t('memberPlanList.title')}</h2>
        </ListViewHeader>

        <PermissionControl qualifyingPermissions={['CAN_CREATE_MEMBER_PLAN']}>
          <ListViewActions>
            <Link to="/memberplans/create">
              <Button
                variant="contained"
                startIcon={<MdAdd />}
                disabled={isLoading}
              >
                {t('memberPlanList.createNew')}
              </Button>
            </Link>
          </ListViewActions>
        </PermissionControl>

        <ListViewFilterArea>
          <InputGroup>
            <Input
              value={filter}
              onChange={value => setFilter(value)}
            />
            <InputGroup.Addon>
              <MdSearch />
            </InputGroup.Addon>
          </InputGroup>
        </ListViewFilterArea>
      </ListViewContainer>

      <TableWrapper>
        <Table
          fillHeight
          loading={isLoading}
          data={memberPlans}
          sortColumn={sortField}
          sortType={sortOrder}
          onSortColumn={(sortColumn, sortType) =>
            setSort(sortColumn, sortType ?? 'asc')
          }
        >
          <Column
            width={40}
            align="left"
          >
            <HeaderCell>
              <InfoTooltip
                text={t('memberPlanList.paymentProviderStatusInfo')}
              />
            </HeaderCell>
            <RCell>
              {(rowData: RowDataType<FullMemberPlanFragment>) =>
                hasBrokenPaymentProvider(rowData as FullMemberPlanFragment) ?
                  `✅`
                : `❌`
              }
            </RCell>
          </Column>

          <Column
            width={200}
            align="left"
            resizable
          >
            <HeaderCell>{t('memberPlanList.name')}</HeaderCell>
            <RCell>
              {(rowData: RowDataType<FullMemberPlanFragment>) => (
                <Link to={`/memberplans/edit/${rowData.id}`}>
                  {rowData.name || t('untitled')}
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
            <HeaderCell>{t('memberPlanList.created')}</HeaderCell>
            <RCell dataKey="createdAt">
              {(rowData: RowDataType<FullMemberPlanFragment>) =>
                t('memberPlanList.createdAt', {
                  createdAt: new Date(rowData.createdAt),
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
            <HeaderCell>{t('memberPlanList.modified')}</HeaderCell>
            <RCell dataKey="modifiedAt">
              {(rowData: RowDataType<FullMemberPlanFragment>) =>
                t('memberPlanList.modifiedAt', {
                  modifiedAt: new Date(rowData.modifiedAt),
                })
              }
            </RCell>
          </Column>

          <Column
            width={250}
            align="left"
            resizable
          >
            <HeaderCell>{t('memberPlanList.editFlowShort')}</HeaderCell>
            <RCell>
              {(rowData: RowDataType<FullMemberPlanFragment>) => (
                <PermissionControl
                  qualifyingPermissions={['CAN_GET_SUBSCRIPTION_FLOWS']}
                >
                  <Link to={`/communicationflows/edit/${rowData.id}`}>
                    {t('memberPlanList.editFlow')}
                  </Link>
                </PermissionControl>
              )}
            </RCell>
          </Column>

          <Column
            width={100}
            align="center"
            fixed="right"
          >
            <HeaderCell align="center">{t('action')}</HeaderCell>
            <PaddedCell>
              {(rowData: RowDataType<FullMemberPlanFragment>) => (
                <PermissionControl
                  qualifyingPermissions={['CAN_DELETE_MEMBER_PLAN']}
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
              )}
            </PaddedCell>
          </Column>
        </Table>
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
            variant="outlined"
            disabled={isDeleting}
            onClick={async () => {
              if (!currentMemberPlan) return;

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

                  if (!query) return;

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
          <Button
            variant="text"
            onClick={() => setConfirmationDialogOpen(false)}
          >
            {t('cancel')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

const CheckedPermissionComponent = createCheckedPermissionComponent([
  'CAN_GET_MEMBER_PLANS',
  'CAN_GET_MEMBER_PLAN',
  'CAN_CREATE_MEMBER_PLAN',
  'CAN_DELETE_MEMBER_PLAN',
])(MemberPlanList);
export { CheckedPermissionComponent as MemberPlanList };
