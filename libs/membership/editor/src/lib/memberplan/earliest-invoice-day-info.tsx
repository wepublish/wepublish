import { useQuery } from '@apollo/client/react';
import styled from '@emotion/styled';
import { Alert, Link, Typography } from '@mui/material';
import {
  EarliestInvoiceDaysDocument,
  SubscriptionFlowsDocument,
} from '@wepublish/editor/api';
import { CanGetSubscriptionFlows } from '@wepublish/permissions';
import { InfoTooltip, useAuthorisation } from '@wepublish/ui/editor';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink } from 'react-router-dom';

import { conditionsSummary, flowPath } from '../subscription-flow/flow-overview';
import {
  invoiceDayConflicts,
  PlanOffer,
  planEarliestInvoiceDay,
} from './earliest-invoice-day';

const Info = styled('div')`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(0.5)};
`;

const Conflicts = styled('div')`
  display: grid;
  gap: ${({ theme }) => theme.spacing(1)};
  margin-bottom: ${({ theme }) => theme.spacing(2)};
`;

const useEarliestInvoiceDays = () =>
  useQuery(EarliestInvoiceDaysDocument).data?.earliestInvoiceDays ?? [];

interface EarliestInvoiceDayInfoProps {
  /** What the plan offers as the form has it, saved or not. */
  offers: PlanOffer[];
}

/**
 * How early the invoices of this plan's subscriptions may be created: it
 * follows from the shortest periodicity the plan offers.
 */
export function EarliestInvoiceDayInfo({
  offers,
}: EarliestInvoiceDayInfoProps) {
  const { t } = useTranslation();
  const earliest = planEarliestInvoiceDay(offers, useEarliestInvoiceDays());

  if (!earliest) {
    return null;
  }

  return (
    <Info>
      <Typography
        variant="body2"
        color="text.secondary"
      >
        {t('memberPlanEdit.earliestInvoiceDay.label', {
          days: earliest.days,
          periodicity: t(
            `memberPlanList.paymentPeriodicity.${earliest.periodicity}`
          ),
        })}
      </Typography>

      <InfoTooltip
        text={t('memberPlanEdit.earliestInvoiceDay.help', {
          days: -earliest.days,
        })}
      />
    </Info>
  );
}

interface InvoiceDayConflictsProps extends EarliestInvoiceDayInfoProps {
  /** None for a plan that is not saved yet: only the default flow applies. */
  memberPlanId?: string;
}

/**
 * The flows this plan's subscriptions run through that create invoices
 * earlier than the plan allows. Saving the plan is not held up by them: the
 * invoices of the shorter subscriptions are created on their earliest day.
 */
export function InvoiceDayConflicts({
  memberPlanId,
  offers,
}: InvoiceDayConflictsProps) {
  const { t } = useTranslation();
  const days = useEarliestInvoiceDays();
  const canGetFlows = useAuthorisation(CanGetSubscriptionFlows.id);
  const { data } = useQuery(SubscriptionFlowsDocument, {
    variables:
      memberPlanId ?
        { defaultFlowOnly: false, memberPlanId }
      : { defaultFlowOnly: true },
    skip: !canGetFlows,
  });
  const conflicts = invoiceDayConflicts(
    offers,
    data?.subscriptionFlows ?? [],
    days
  );

  if (!conflicts.length) {
    return null;
  }

  return (
    <Conflicts>
      {conflicts.map(({ flow, invoiceDay, periodicity, days }) => (
        <Alert
          key={flow.id}
          severity="warning"
        >
          {t('memberPlanEdit.earliestInvoiceDay.conflict', {
            flow:
              flow.default ?
                t('memberPlanEdit.earliestInvoiceDay.defaultFlow')
              : t('memberPlanEdit.earliestInvoiceDay.planFlow', {
                  conditions: conditionsSummary(flow, t),
                }),
            invoiceDay,
            periodicity: t(`memberPlanList.paymentPeriodicity.${periodicity}`),
            days: -days,
          })}{' '}
          <Link
            component={RouterLink}
            to={flowPath(flow)}
          >
            {t('memberPlanEdit.earliestInvoiceDay.openFlow')}
          </Link>
        </Alert>
      ))}
    </Conflicts>
  );
}
