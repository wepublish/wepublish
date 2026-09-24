import styled from '@emotion/styled';
import {
  FullSubscriptionFragment,
  PaymentPeriodicity,
  SubscriptionDeactivationReason,
  UserSubscriptionFragment,
} from '@wepublish/editor/api';
import { TFunction } from 'i18next';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LiaFileInvoiceSolid } from 'react-icons/lia';
import {
  MdAccessTime,
  MdAdd,
  MdContentCopy,
  MdDisabledByDefault,
  MdDone,
  MdEdit,
  MdOutlineCheckBox,
  MdOutlineCheckBoxOutlineBlank,
  MdRefresh,
  MdSubdirectoryArrowRight,
} from 'react-icons/md';
import { Link } from 'react-router-dom';
import {
  IconButton,
  Notification,
  Table as RTable,
  Tag,
  toaster,
  Tooltip,
  Whisper,
} from 'rsuite';
import { RowDataType } from 'rsuite/esm/Table';

// import {NewSubscriptionButton} from '../../routes/subscriptionList'
import {
  createCheckedPermissionComponent,
  useAuthorisation,
} from '../permissionControl';

const { Column, HeaderCell, Cell: RCell } = RTable;

const NewSubscriptionButtonWrapper = styled.div`
  margin-top: 20px;
`;

const PeriodRange = styled('span')`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding-left: 18px;

  svg {
    color: var(--rs-text-secondary, #8e8e93);
    font-size: 16px;
  }
`;

const AmountCell = styled('span')`
  display: inline-flex;
  align-items: baseline;
  justify-content: flex-end;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
`;

// px (not em): header and body cells render at different font sizes,
// so em-based widths would misalign the header with the digits
const AMOUNT_UNIT_WIDTH = '68px';
const AMOUNT_UNIT_GAP = '5px';

const AmountUnit = styled('span')`
  display: inline-block;
  min-width: ${AMOUNT_UNIT_WIDTH};
  margin-left: ${AMOUNT_UNIT_GAP};
  text-align: left;
`;

const AmountHeader = styled('span')`
  display: inline-block;
  padding-right: calc(${AMOUNT_UNIT_WIDTH} + ${AMOUNT_UNIT_GAP});
`;

const IconText = styled('span')`
  display: inline-flex;
  align-items: center;
  gap: 5px;

  svg {
    color: var(--rs-text-secondary, #8e8e93);
  }
`;

const ConfirmedIcon = styled('span')<{ isConfirmed: boolean }>`
  display: inline-flex;
  align-items: center;
  font-size: 18px;
  color: ${({ isConfirmed }) =>
    isConfirmed ? '#22c55e' : 'var(--rs-text-secondary, #8e8e93)'};
`;

const InvoiceIconWrapper = styled('span')`
  position: relative;
  display: inline-flex;
  vertical-align: middle;
`;

const InvoiceIcon = styled(LiaFileInvoiceSolid)`
  color: grey;
  font-size: 26px;
`;

const StatusPill = styled('span')<{ pillColor: string }>`
  position: absolute;
  right: -5px;
  top: 55%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background-color: ${({ pillColor }) => pillColor};
  color: white;
  font-size: 10px;
  box-shadow: 0 0 0 2px white;
`;

const IdButton = styled('button')`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  border: none;
  background: transparent;
  padding: 0;
  cursor: pointer;
  font: inherit;
`;

const Table = styled(RTable)`
  .rs-table-row.subscription-row-expandable {
    cursor: pointer;
  }

  /* no hover effect on 2nd-level (period) rows */
  && .rs-table-row.period-row:hover,
  && .rs-table-row.period-row:hover .rs-table-cell-group,
  && .rs-table-row.period-row:hover .rs-table-cell {
    background-color: var(--rs-bg-card);
  }
`;

/* keep the circle compact so the 18px icon dominates it;
   &&& beats rsuite's size-based padding rules */
const EditIconButton = styled(IconButton)`
  &&& {
    padding: 4px;
  }
`;

const SubscriptionName = styled('span')`
  font-weight: 600;
`;

const formatDate = (date: string | Date) =>
  new Date(date).toLocaleDateString('de-CH', {
    timeZone: 'europe/zurich',
  });

type SubscriptionStatus = {
  label: string;
  color: 'red' | 'blue' | 'green' | 'orange' | 'yellow';
};

/**
 * Truthful subscription status: "active" means started AND paid up — not
 * merely "not deactivated" (imported subscriptions often expire without a
 * deactivation record).
 */
function getSubscriptionStatus(
  subscription: UserSubscriptionFragment
): SubscriptionStatus {
  const now = new Date();

  if (subscription.deactivation) {
    return { label: 'userSubscriptionList.table.deactivated', color: 'red' };
  }

  if (new Date(subscription.startsAt) > now) {
    return { label: 'userSubscriptionList.table.planned', color: 'blue' };
  }

  if (!subscription.paidUntil) {
    return { label: 'userSubscriptionList.table.unpaid', color: 'yellow' };
  }

  if (new Date(subscription.paidUntil) < now) {
    return { label: 'userSubscriptionList.table.expired', color: 'orange' };
  }

  return { label: 'userSubscriptionList.table.active', color: 'green' };
}

type SubscriptionPeriod = UserSubscriptionFragment['periods'][0];

type PeriodRow = {
  rowType: 'period';
  id: string;
  currency: string;
  period: SubscriptionPeriod;
};

type SubscriptionRow = {
  rowType: 'subscription';
  id: string;
  subscription: UserSubscriptionFragment;
  /** marker consumed by the action column's dataKey: rows without it get
   *  merged under the tree column's colSpan (period rows) */
  actionMarker: true;
  children?: PeriodRow[];
};

type TableRow = SubscriptionRow | PeriodRow;

interface UserSubscriptionsProps {
  subscriptions?: UserSubscriptionFragment[] | null;
  userId?: string;
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

function UserSubscriptionsList({
  subscriptions,
  userId,
}: UserSubscriptionsProps) {
  const { t } = useTranslation();

  function paymentPeriodicity(subscription: FullSubscriptionFragment) {
    switch (subscription.paymentPeriodicity) {
      case PaymentPeriodicity.Monthly:
        return t('memberPlanList.paymentPeriodicity.monthly');
      case PaymentPeriodicity.Quarterly:
        return t('memberPlanList.paymentPeriodicity.quarterly');
      case PaymentPeriodicity.Biannual:
        return t('memberPlanList.paymentPeriodicity.biannual');
      case PaymentPeriodicity.Yearly:
        return t('memberPlanList.paymentPeriodicity.yearly');
      case PaymentPeriodicity.Biennial:
        return t('memberPlanList.paymentPeriodicity.biennial');
      case PaymentPeriodicity.Lifetime:
        return t('memberPlanList.paymentPeriodicity.lifetime');
      default:
        return 'Unknown Error';
    }
  }

  function getDeactivationReasonHumanReadable(
    deactivationReason: SubscriptionDeactivationReason
  ) {
    switch (deactivationReason) {
      case SubscriptionDeactivationReason.None:
        return t('userSubscriptionList.deactivationReason.None');
      case SubscriptionDeactivationReason.InvoiceNotPaid:
        return t('userSubscriptionList.deactivationReason.InvoiceNotPaid');
      case SubscriptionDeactivationReason.UserSelfDeactivated:
        return t('userSubscriptionList.deactivationReason.UserSelfDeactivated');
      case SubscriptionDeactivationReason.UserReplacedSubscription:
        return t(
          'userSubscriptionList.deactivationReason.UserReplacedSubscription'
        );
      case SubscriptionDeactivationReason.Chargeback:
        return t('userSubscriptionList.deactivationReason.Chargeback');
      default:
        return deactivationReason;
    }
  }

  /**
   * Deactivation details (date + reason) for the status tooltip of
   * deactivated subscriptions.
   */
  function deactivationTitle(
    deactivation: NonNullable<UserSubscriptionFragment['deactivation']>
  ) {
    return t('userSubscriptionList.deactivationString', {
      date: new Intl.DateTimeFormat('de-CH').format(
        new Date(deactivation.date)
      ),
      reason: getDeactivationReasonHumanReadable(deactivation.reason),
    });
  }

  const rows = useMemo<SubscriptionRow[]>(() => {
    const isActive = (subscription: UserSubscriptionFragment) =>
      getSubscriptionStatus(subscription).label ===
      'userSubscriptionList.table.active';
    const paidUntilTime = (subscription: UserSubscriptionFragment) =>
      subscription.paidUntil ? new Date(subscription.paidUntil).getTime() : 0;

    return [...(subscriptions ?? [])]
      .sort(
        (a, b) =>
          // active subscriptions first, then by furthest paidUntil
          Number(isActive(b)) - Number(isActive(a)) ||
          paidUntilTime(b) - paidUntilTime(a) ||
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
      .map(subscription => {
        const periods: PeriodRow[] = [...subscription.periods]
          .sort(
            (a, b) =>
              new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime()
          )
          .map(period => ({
            rowType: 'period',
            id: period.id,
            currency: subscription.currency,
            period,
          }));

        return {
          rowType: 'subscription',
          id: subscription.id,
          subscription,
          actionMarker: true as const,
          ...(periods.length ? { children: periods } : {}),
        };
      });
  }, [subscriptions]);

  const [expandedRowKeys, setExpandedRowKeys] = useState<string[]>([]);

  const toggleExpanded = (id: string) =>
    setExpandedRowKeys(keys =>
      keys.includes(id) ? keys.filter(key => key !== id) : [...keys, id]
    );

  return (
    <>
      <Table
        autoHeight
        wordWrap="break-word"
        isTree
        rowKey="id"
        expandedRowKeys={expandedRowKeys}
        onExpandChange={(_expanded, rowData) =>
          toggleExpanded((rowData as TableRow).id)
        }
        rowClassName={rowData => {
          const row = rowData as TableRow | undefined;

          if (row?.rowType === 'period') {
            return 'period-row';
          }

          return (
              row?.rowType === 'subscription' && (row.children?.length ?? 0) > 0
            ) ?
              'subscription-row-expandable'
            : '';
        }}
        onRowClick={(rowData, event) => {
          const row = rowData as TableRow;

          // links, buttons and the expand caret keep their own behavior
          // (the caret already toggles via onExpandChange - handling it here
          // too would toggle twice and cancel out)
          if (
            (event.target as HTMLElement).closest(
              'a, button, .rs-table-cell-expand-wrapper, .rs-table-cell-expand-icon'
            )
          ) {
            return;
          }

          if (row.rowType === 'subscription' && row.children?.length) {
            toggleExpanded(row.id);
          }
        }}
        data={rows as RowDataType<TableRow>[]}
      >
        {/* subscription / period range (tree column); spans the action
            column on period rows (their actionMarker is undefined) */}
        <Column
          width={320}
          colSpan={2}
        >
          <HeaderCell>
            {`${t('userSubscriptionList.table.subscription')} / ${t(
              'userSubscriptionList.periodRange'
            )}`}
          </HeaderCell>
          <RCell>
            {(rowData: RowDataType<TableRow>) =>
              rowData.rowType === 'subscription' ?
                <SubscriptionName>
                  {rowData.subscription.memberPlan.name}
                </SubscriptionName>
              : <PeriodRange>
                  <MdSubdirectoryArrowRight />
                  {`${formatDate(rowData.period.startsAt)} – ${formatDate(
                    rowData.period.endsAt
                  )}`}
                </PeriodRange>
            }
          </RCell>
        </Column>

        {/* actions */}
        <Column width={80}>
          <HeaderCell>{t('invoice.table.action')}</HeaderCell>
          <RCell dataKey="actionMarker">
            {(rowData: RowDataType<TableRow>) =>
              rowData.rowType === 'subscription' ?
                <Link
                  to={`/subscriptions/edit/${rowData.subscription.id}?userId=${userId}`}
                >
                  <Whisper
                    placement="top"
                    trigger="hover"
                    speaker={
                      <Tooltip>
                        {t('userSubscriptionList.editSubscription')}
                      </Tooltip>
                    }
                  >
                    <EditIconButton
                      icon={<MdEdit size={16} />}
                      circle
                      size="xs"
                      appearance="ghost"
                      aria-label={t('userSubscriptionList.editSubscription')}
                    />
                  </Whisper>
                </Link>
              : null
            }
          </RCell>
        </Column>

        {/* status: subscription tag / period invoice-paid pill */}
        <Column width={110}>
          <HeaderCell>{t('invoice.table.status')}</HeaderCell>
          <RCell>
            {(rowData: RowDataType<TableRow>) => {
              if (rowData.rowType === 'subscription') {
                const subscriptionStatus = getSubscriptionStatus(
                  rowData.subscription
                );
                const statusTag = (
                  <Tag color={subscriptionStatus.color}>
                    {t(subscriptionStatus.label)}
                  </Tag>
                );

                return rowData.subscription.deactivation ?
                    <Whisper
                      placement="top"
                      trigger="hover"
                      speaker={
                        <Tooltip>
                          {deactivationTitle(rowData.subscription.deactivation)}
                        </Tooltip>
                      }
                    >
                      {statusTag}
                    </Whisper>
                  : statusTag;
              }

              const status =
                rowData.period.isPaid ?
                  {
                    title: t('userSubscriptionList.invoicePaid'),
                    color: '#22c55e',
                    icon: <MdDone />,
                  }
                : {
                    title: t('userSubscriptionList.invoiceUnpaid'),
                    color: '#eab308',
                    icon: <MdAccessTime />,
                  };

              return (
                <Whisper
                  placement="top"
                  trigger="hover"
                  speaker={<Tooltip>{status.title}</Tooltip>}
                >
                  <InvoiceIconWrapper>
                    <InvoiceIcon />

                    <StatusPill pillColor={status.color}>
                      {status.icon}
                    </StatusPill>
                  </InvoiceIconWrapper>
                </Whisper>
              );
            }}
          </RCell>
        </Column>

        {/* subscription created at */}
        <Column width={100}>
          <HeaderCell>{t('userSubscriptionList.table.created')}</HeaderCell>
          <RCell>
            {(rowData: RowDataType<TableRow>) =>
              rowData.rowType === 'subscription' ?
                formatDate(rowData.subscription.createdAt)
              : null
            }
          </RCell>
        </Column>

        {/* subscription start */}
        <Column width={100}>
          <HeaderCell>{t('userSubscriptionList.table.start')}</HeaderCell>
          <RCell>
            {(rowData: RowDataType<TableRow>) =>
              rowData.rowType === 'subscription' ?
                formatDate(rowData.subscription.startsAt)
              : null
            }
          </RCell>
        </Column>

        {/* payment periodicity */}
        <Column width={140}>
          <HeaderCell>{t('userSubscriptionList.table.periodicity')}</HeaderCell>
          <RCell>
            {(rowData: RowDataType<TableRow>) =>
              rowData.rowType === 'subscription' ?
                paymentPeriodicity(rowData.subscription)
              : null
            }
          </RCell>
        </Column>

        {/* amount: monthly for subscriptions, period total for periods */}
        <Column
          width={165}
          align="right"
        >
          <HeaderCell>
            <AmountHeader>{t('invoice.total')}</AmountHeader>
          </HeaderCell>
          <RCell>
            {(rowData: RowDataType<TableRow>) =>
              rowData.rowType === 'subscription' ?
                <AmountCell>
                  {(rowData.subscription.monthlyAmount / 100).toFixed(2)}
                  <AmountUnit>
                    {`${rowData.subscription.currency}${t(
                      'userSubscriptionList.table.perMonthSuffix'
                    )}`}
                  </AmountUnit>
                </AmountCell>
              : <AmountCell>
                  {(rowData.period.amount / 100).toFixed(2)}
                  <AmountUnit>{rowData.currency}</AmountUnit>
                </AmountCell>
            }
          </RCell>
        </Column>

        {/* paid until */}
        <Column width={110}>
          <HeaderCell>{t('userSubscriptionList.table.paidUntil')}</HeaderCell>
          <RCell>
            {(rowData: RowDataType<TableRow>) =>
              rowData.rowType === 'subscription' ?
                rowData.subscription.paidUntil ?
                  formatDate(rowData.subscription.paidUntil)
                : t('userSubscriptionList.invoiceUnpaid')
              : null
            }
          </RCell>
        </Column>

        {/* auto renewal */}
        <Column width={150}>
          <HeaderCell>{t('userSubscriptionList.table.renewal')}</HeaderCell>
          <RCell>
            {(rowData: RowDataType<TableRow>) =>
              rowData.rowType === 'subscription' ?
                <IconText>
                  {(
                    rowData.subscription.autoRenew &&
                    !rowData.subscription.deactivation
                  ) ?
                    <>
                      <MdRefresh />
                      {t('userSubscriptionList.table.renewsAutomatically')}
                    </>
                  : <>
                      <MdDisabledByDefault />
                      {t('userSubscriptionList.table.expires')}
                    </>
                  }
                </IconText>
              : null
            }
          </RCell>
        </Column>

        {/* confirmed */}
        <Column width={90}>
          <HeaderCell>{t('userSubscriptionList.table.confirmed')}</HeaderCell>
          <RCell>
            {(rowData: RowDataType<TableRow>) =>
              rowData.rowType === 'subscription' ?
                <ConfirmedIcon
                  isConfirmed={rowData.subscription.confirmed}
                  aria-label={
                    rowData.subscription.confirmed ?
                      t('userSubscriptionList.confirmed')
                    : t('userSubscriptionList.unconfirmed')
                  }
                >
                  {rowData.subscription.confirmed ?
                    <MdOutlineCheckBox />
                  : <MdOutlineCheckBoxOutlineBlank />}
                </ConfirmedIcon>
              : null
            }
          </RCell>
        </Column>

        {/* invoice number (periods only) */}
        <Column
          flexGrow={1}
          minWidth={110}
        >
          <HeaderCell>{t('invoice.invoiceNo')}</HeaderCell>
          <RCell>
            {(rowData: RowDataType<TableRow>) =>
              rowData.rowType === 'period' ?
                <Whisper
                  placement="top"
                  trigger="hover"
                  speaker={<Tooltip>{rowData.period.invoiceID}</Tooltip>}
                >
                  <IdButton
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(rowData.period.invoiceID);
                      toaster.push(
                        <Notification
                          type="success"
                          header={t('invoice.table.idCopied')}
                          duration={2000}
                        />,
                        { placement: 'topEnd' }
                      );
                    }}
                  >
                    {rowData.period.invoiceID.slice(0, 4)}…
                    <MdContentCopy />
                  </IdButton>
                </Whisper>
              : null
            }
          </RCell>
        </Column>
      </Table>

      <NewSubscriptionButtonWrapper>
        {NewSubscriptionButton({ t, userId })}
      </NewSubscriptionButtonWrapper>
    </>
  );
}
const CheckedPermissionComponent = createCheckedPermissionComponent([
  'CAN_GET_SUBSCRIPTION',
  'CAN_GET_SUBSCRIPTIONS',
  'CAN_DELETE_SUBSCRIPTION',
  'CAN_CREATE_SUBSCRIPTION',
])(UserSubscriptionsList);
export { CheckedPermissionComponent as UserSubscriptionsList };
