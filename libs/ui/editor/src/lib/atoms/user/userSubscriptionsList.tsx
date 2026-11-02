import styled from '@emotion/styled';
import {
  Button,
  Chip,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
} from '@mui/material';
import {
  FullSubscriptionFragment,
  PaymentPeriodicity,
  SubscriptionDeactivationReason,
  UserSubscriptionFragment,
} from '@wepublish/editor/api';
import {
  CanCreateSubscription,
  CanDeleteSubscription,
  CanGetSubscription,
  CanGetSubscriptions,
} from '@wepublish/permissions';
import {
  compareSubscriptions,
  getSubscriptionState,
  InvoiceStatusIcon,
  SUBSCRIPTION_STATE_CHIP,
  SubscriptionState,
} from '@wepublish/ui';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  MdAdd,
  MdContentCopy,
  MdDisabledByDefault,
  MdEdit,
  MdKeyboardArrowDown,
  MdKeyboardArrowRight,
  MdOutlineCheckBox,
  MdOutlineCheckBoxOutlineBlank,
  MdRefresh,
  MdSubdirectoryArrowRight,
} from 'react-icons/md';
import { Link as RouterLink } from 'react-router-dom';

import { enqueueSnackbar } from '../../snackbar/snackbar';
import {
  createCheckedPermissionComponent,
  useAuthorisation,
} from '../permissionControl';
import { SingleLineTooltip } from '../singleLineTooltip';

const NewSubscriptionButtonWrapper = styled.div`
  margin-top: ${({ theme }) => theme.spacing(2.5)};
`;

const PeriodRange = styled('span')`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(0.75)};
  padding-left: ${({ theme }) => theme.spacing(2.25)};

  svg {
    color: ${({ theme }) => theme.vars.palette.text.secondary};
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
  gap: ${({ theme }) => theme.spacing(0.625)};

  svg {
    color: ${({ theme }) => theme.vars.palette.text.secondary};
  }
`;

const ConfirmedIcon = styled('span')<{ isConfirmed: boolean }>`
  display: inline-flex;
  align-items: center;
  font-size: 18px;
  color: ${({ theme, isConfirmed }) =>
    isConfirmed ?
      theme.vars.palette.success.main
    : theme.vars.palette.text.secondary};
`;

const IdButton = styled('button')`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(0.5)};
  border: none;
  background: transparent;
  padding: 0;
  cursor: pointer;
  color: inherit;
  font: inherit;
`;

const SubscriptionRow = styled(TableRow)<{ expandable: boolean }>`
  cursor: ${({ expandable }) => (expandable ? 'pointer' : 'default')};
`;

const PeriodTableRow = styled(TableRow)`
  &:hover {
    background-color: transparent;
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
  state: SubscriptionState;
};

export function getSubscriptionStatus(
  subscription: UserSubscriptionFragment,
  now = new Date()
): SubscriptionStatus {
  const state = getSubscriptionState(subscription, now);

  return { label: `userSubscriptionList.table.${state}`, state };
}

type SubscriptionPeriod = UserSubscriptionFragment['periods'][0];

type Row = {
  subscription: UserSubscriptionFragment;
  periods: SubscriptionPeriod[];
};

interface UserSubscriptionsProps {
  subscriptions?: UserSubscriptionFragment[] | null;
  userId?: string;
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
      variant="text"
      startIcon={<MdAdd />}
      disabled={isLoading || !canCreate}
    >
      {t('subscriptionList.overview.newSubscription')}
    </Button>
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
        return t('subscriptionList.panels.unknown');
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

  const rows = useMemo<Row[]>(() => {
    const now = new Date();

    return [...(subscriptions ?? [])]
      .sort((a, b) => compareSubscriptions(a, b, now))
      .map(subscription => ({
        subscription,
        periods: [...subscription.periods].sort(
          (a, b) =>
            new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime()
        ),
      }));
  }, [subscriptions]);

  const [expanded, setExpanded] = useState<string[]>([]);

  const toggleExpanded = (id: string) =>
    setExpanded(keys =>
      keys.includes(id) ? keys.filter(key => key !== id) : [...keys, id]
    );

  const copyInvoiceId = (invoiceID: string) => {
    navigator.clipboard.writeText(invoiceID);
    enqueueSnackbar(t('invoice.table.idCopied'), {
      variant: 'success',
      autoHideDuration: 2000,
    });
  };

  return (
    <>
      <TableContainer sx={{ overflowX: 'auto' }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>
                {`${t('userSubscriptionList.table.subscription')} / ${t(
                  'userSubscriptionList.periodRange'
                )}`}
              </TableCell>
              <TableCell>{t('invoice.table.action')}</TableCell>
              <TableCell>{t('invoice.table.status')}</TableCell>
              <TableCell>{t('userSubscriptionList.table.created')}</TableCell>
              <TableCell>{t('userSubscriptionList.table.start')}</TableCell>
              <TableCell>
                {t('userSubscriptionList.table.periodicity')}
              </TableCell>
              <TableCell align="right">
                <AmountHeader>{t('invoice.total')}</AmountHeader>
              </TableCell>
              <TableCell>{t('userSubscriptionList.table.paidUntil')}</TableCell>
              <TableCell>{t('userSubscriptionList.table.renewal')}</TableCell>
              <TableCell>{t('userSubscriptionList.table.confirmed')}</TableCell>
              <TableCell>{t('invoice.invoiceNo')}</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {rows.map(({ subscription, periods }) => {
              const status = getSubscriptionStatus(subscription);
              const isExpandable = periods.length > 0;
              const isExpanded = expanded.includes(subscription.id);

              const statusChip = (
                <Chip
                  size="small"
                  label={t(status.label)}
                  color={SUBSCRIPTION_STATE_CHIP[status.state].color}
                  variant={SUBSCRIPTION_STATE_CHIP[status.state].variant}
                />
              );

              return [
                <SubscriptionRow
                  key={subscription.id}
                  hover
                  expandable={isExpandable}
                  onClick={event => {
                    if ((event.target as HTMLElement).closest('a, button')) {
                      return;
                    }

                    if (isExpandable) {
                      toggleExpanded(subscription.id);
                    }
                  }}
                >
                  <TableCell>
                    {isExpandable && (
                      <IconButton
                        size="small"
                        aria-label={t('userSubscriptionList.periodRange')}
                        aria-expanded={isExpanded}
                        onClick={() => toggleExpanded(subscription.id)}
                      >
                        {isExpanded ?
                          <MdKeyboardArrowDown />
                        : <MdKeyboardArrowRight />}
                      </IconButton>
                    )}

                    <SubscriptionName>
                      {subscription.memberPlan.name}
                    </SubscriptionName>
                  </TableCell>

                  <TableCell>
                    <Tooltip title={t('userSubscriptionList.editSubscription')}>
                      <IconButton
                        component={RouterLink}
                        to={`/subscriptions/edit/${subscription.id}?userId=${userId}`}
                        size="small"
                        aria-label={t('userSubscriptionList.editSubscription')}
                      >
                        <MdEdit size={16} />
                      </IconButton>
                    </Tooltip>
                  </TableCell>

                  <TableCell>
                    {subscription.deactivation ?
                      <Tooltip
                        title={deactivationTitle(subscription.deactivation)}
                      >
                        {statusChip}
                      </Tooltip>
                    : statusChip}
                  </TableCell>

                  <TableCell>{formatDate(subscription.createdAt)}</TableCell>
                  <TableCell>{formatDate(subscription.startsAt)}</TableCell>
                  <TableCell>{paymentPeriodicity(subscription)}</TableCell>

                  <TableCell align="right">
                    <AmountCell>
                      {(subscription.monthlyAmount / 100).toFixed(2)}
                      <AmountUnit>
                        {`${subscription.currency}${t(
                          'userSubscriptionList.table.perMonthSuffix'
                        )}`}
                      </AmountUnit>
                    </AmountCell>
                  </TableCell>

                  <TableCell>
                    {subscription.paidUntil ?
                      formatDate(subscription.paidUntil)
                    : t('userSubscriptionList.invoiceUnpaid')}
                  </TableCell>

                  <TableCell>
                    <IconText>
                      {subscription.autoRenew && !subscription.deactivation ?
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
                  </TableCell>

                  <TableCell>
                    <ConfirmedIcon
                      isConfirmed={subscription.confirmed}
                      aria-label={
                        subscription.confirmed ?
                          t('userSubscriptionList.confirmed')
                        : t('userSubscriptionList.unconfirmed')
                      }
                    >
                      {subscription.confirmed ?
                        <MdOutlineCheckBox />
                      : <MdOutlineCheckBoxOutlineBlank />}
                    </ConfirmedIcon>
                  </TableCell>

                  <TableCell />
                </SubscriptionRow>,

                ...(isExpanded ?
                  periods.map(period => {
                    const invoiceStatus =
                      period.isPaid ?
                        {
                          status: 'paid' as const,
                          title: t('userSubscriptionList.invoicePaid'),
                        }
                      : {
                          status: 'unpaid' as const,
                          title: t('userSubscriptionList.invoiceUnpaid'),
                        };

                    return (
                      <PeriodTableRow key={period.id}>
                        <TableCell colSpan={2}>
                          <PeriodRange>
                            <MdSubdirectoryArrowRight />
                            {`${formatDate(period.startsAt)} – ${formatDate(
                              period.endsAt
                            )}`}
                          </PeriodRange>
                        </TableCell>

                        <TableCell>
                          <InvoiceStatusIcon
                            status={invoiceStatus.status}
                            title={invoiceStatus.title}
                          />
                        </TableCell>

                        <TableCell colSpan={3} />

                        <TableCell align="right">
                          <AmountCell>
                            {(period.amount / 100).toFixed(2)}
                            <AmountUnit>{subscription.currency}</AmountUnit>
                          </AmountCell>
                        </TableCell>

                        <TableCell colSpan={3} />

                        <TableCell>
                          <SingleLineTooltip title={period.invoiceID}>
                            <IdButton
                              type="button"
                              onClick={() => copyInvoiceId(period.invoiceID)}
                            >
                              {period.invoiceID.slice(0, 4)}…
                              <MdContentCopy />
                            </IdButton>
                          </SingleLineTooltip>
                        </TableCell>
                      </PeriodTableRow>
                    );
                  })
                : []),
              ];
            })}
          </TableBody>
        </Table>
      </TableContainer>

      <NewSubscriptionButtonWrapper>
        <NewSubscriptionButton userId={userId} />
      </NewSubscriptionButtonWrapper>
    </>
  );
}

const CheckedPermissionComponent = createCheckedPermissionComponent([
  CanGetSubscription.id,
  CanGetSubscriptions.id,
  CanDeleteSubscription.id,
  CanCreateSubscription.id,
])(UserSubscriptionsList);

export { CheckedPermissionComponent as UserSubscriptionsList };
