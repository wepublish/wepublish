import {
  FullMemberPlanFragment,
  MemberPlanListDocument,
  MemberPlanListQuery,
  useDeleteMemberPlanMutation,
  useMemberPlanListQuery,
} from '@wepublish/editor/api';
import {
  createCheckedPermissionComponent,
  DescriptionList,
  DescriptionListItem,
  IconButton,
  IconButtonTooltip,
  ListViewActions,
  ListViewContainer,
  ListViewFilterArea,
  ListViewHeader,
  PaddedCell,
  PermissionControl,
  Table,
  TableWrapper,
} from '@wepublish/ui/editor';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdAdd, MdDelete, MdSearch } from 'react-icons/md';
import { Link } from 'react-router-dom';
import {
  Button,
  IconButton as RIconButton,
  Input,
  InputGroup,
  Modal,
  Table as RTable,
} from 'rsuite';
import { RowDataType } from 'rsuite-table';

const { Column, HeaderCell, Cell: RCell } = RTable;

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

  const { data, loading: isLoading } = useMemberPlanListQuery({
    variables: {
      filter: filter ? { name: filter } : undefined,
      take: 50,
    },
    fetchPolicy: 'network-only',
  });

  const [deleteMemberPlan, { loading: isDeleting }] =
    useDeleteMemberPlanMutation();

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
              <RIconButton
                appearance="primary"
                disabled={isLoading}
                icon={<MdAdd />}
              >
                {t('memberPlanList.createNew')}
              </RIconButton>
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
        >
          <Column
            width={40}
            align="left"
          >
            <HeaderCell>{''}</HeaderCell>
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
            width={100}
            align="center"
          >
            <HeaderCell>{t('memberPlanList.action')}</HeaderCell>
            <PaddedCell>
              {(rowData: RowDataType<FullMemberPlanFragment>) => (
                <PermissionControl
                  qualifyingPermissions={['CAN_DELETE_MEMBER_PLAN']}
                >
                  <IconButtonTooltip caption={t('delete')}>
                    <IconButton
                      icon={<MdDelete />}
                      circle
                      size="sm"
                      appearance="ghost"
                      color="red"
                      onClick={() => {
                        setConfirmationDialogOpen(true);
                        setCurrentMemberPlan(rowData as FullMemberPlanFragment);
                      }}
                    />
                  </IconButtonTooltip>
                </PermissionControl>
              )}
            </PaddedCell>
          </Column>
          <Column
            width={400}
            align="center"
            fixed="right"
          >
            <HeaderCell>{t('memberPlanList.editFlowShort')}</HeaderCell>
            <RCell>
              {(rowData: RowDataType<FullMemberPlanFragment>) => (
                <PermissionControl
                  qualifyingPermissions={['CAN_GET_SUBSCRIPTION_FLOWS']}
                >
                  <IconButtonTooltip caption={t('memberPlanList.editFlow')}>
                    <Link to={`/communicationflows/edit/${rowData.id}`}>
                      {t('memberPlanList.editFlow')}
                    </Link>
                  </IconButtonTooltip>
                </PermissionControl>
              )}
            </RCell>
          </Column>
        </Table>
      </TableWrapper>

      <Modal
        open={isConfirmationDialogOpen}
        size="sm"
      >
        <Modal.Header>
          <Modal.Title>{t('memberPlanList.deleteModalTitle')}</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <DescriptionList>
            <DescriptionListItem label={t('memberPlanList.name')}>
              {currentMemberPlan?.name || t('untitled')}
            </DescriptionListItem>
          </DescriptionList>
        </Modal.Body>

        <Modal.Footer>
          <Button
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
            color="red"
          >
            {t('confirm')}
          </Button>
          <Button
            onClick={() => setConfirmationDialogOpen(false)}
            appearance="subtle"
          >
            {t('cancel')}
          </Button>
        </Modal.Footer>
      </Modal>
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
