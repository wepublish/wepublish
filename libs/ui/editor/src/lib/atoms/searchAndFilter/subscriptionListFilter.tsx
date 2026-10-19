import { useQuery } from '@apollo/client/react';
import styled from '@emotion/styled';
import { MenuItem, TextField } from '@mui/material';
import {
  DateFilterComparison,
  FullUserFragment,
  MemberPlanListDocument,
  PaymentMethodListDocument,
  PaymentPeriodicity,
  SubscriptionDeactivationReason,
  SubscriptionFilter,
} from '@wepublish/editor/api';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { ALL_PAYMENT_PERIODICITIES } from '../../utility';
import { DatePicker } from '../datePicker';
import { DateRangeFilter } from '../dateRangeFilter';
import { UserSearch } from './userSearch';

const Filters = styled.div`
  width: 100%;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  align-items: start;
  gap: 12px;

  > * {
    min-width: 0;
  }
`;

const WideFilter = styled.div`
  grid-column: span 2;

  @media (max-width: 640px) {
    grid-column: span 1;
  }
`;

export interface SubscriptionListFilterProps {
  filter: SubscriptionFilter;
  isLoading: boolean;
  onSetFilter(filter: SubscriptionFilter): void;
}

const toDate = (iso: string | null | undefined) => (iso ? new Date(iso) : null);

export function SubscriptionListFilter({
  filter,
  isLoading,
  onSetFilter,
}: SubscriptionListFilterProps) {
  const { t } = useTranslation();
  const [user, setUser] = useState<FullUserFragment | undefined | null>(
    undefined
  );

  const {
    data: paymentMethodData,
    loading: isPaymentMethodLoading,
    error: paymentMethodLoadError,
  } = useQuery(PaymentMethodListDocument, {});

  const paymentMethods = paymentMethodData?.paymentMethods ?? [];

  const {
    data: memberPlanData,
    loading: isMemberPlanLoading,
    error: loadMemberPlanError,
  } = useQuery(MemberPlanListDocument, {
    variables: {
      take: 200,
    },
  });

  const memberPlans = memberPlanData?.memberPlans?.nodes ?? [];

  const isDisabled =
    isLoading ||
    isMemberPlanLoading ||
    isPaymentMethodLoading ||
    loadMemberPlanError !== undefined ||
    paymentMethodLoadError !== undefined;

  /**
   * helper functions to manage filter
   */
  const updateFilter = (value: SubscriptionFilter) => {
    const newFilter = {
      ...filter,
      ...value,
    };
    onSetFilter(newFilter);
  };

  return (
    <Filters>
      <div>
        <UserSearch
          name="user"
          user={filter.userID ? user : undefined}
          onUpdateUser={user => {
            setUser(user);
            updateFilter({
              userID: user?.id,
            });
          }}
          placeholder={t('subscriptionList.filter.searchPlaceholder')}
        />
      </div>

      <div>
        <TextField
          select
          label={t('userSubscriptionEdit.selectMemberPlan')}
          disabled={isDisabled}
          value={filter.memberPlanID ?? ''}
          onChange={event =>
            updateFilter({ memberPlanID: event.target.value || undefined })
          }
          fullWidth
        >
          {memberPlans.map(plan => (
            <MenuItem
              key={plan.id}
              value={plan.id}
            >
              {plan.name}
            </MenuItem>
          ))}
        </TextField>
      </div>

      <div>
        <TextField
          select
          label={t('memberPlanList.paymentPeriodicities')}
          disabled={isDisabled}
          value={filter.paymentPeriodicity ?? ''}
          onChange={event =>
            updateFilter({
              paymentPeriodicity:
                (event.target.value as PaymentPeriodicity) || undefined,
            })
          }
          fullWidth
        >
          {ALL_PAYMENT_PERIODICITIES.map(periodicity => (
            <MenuItem
              key={periodicity}
              value={periodicity}
            >
              {t(`memberPlanList.paymentPeriodicity.${periodicity}`)}
            </MenuItem>
          ))}
        </TextField>
      </div>

      <div>
        <TextField
          select
          label={t('userSubscriptionEdit.paymentMethod')}
          disabled={isDisabled}
          value={filter.paymentMethodID ?? ''}
          onChange={event =>
            updateFilter({ paymentMethodID: event.target.value || undefined })
          }
          fullWidth
        >
          {paymentMethods.map(method => (
            <MenuItem
              key={method.id}
              value={method.id}
            >
              {method.name}
            </MenuItem>
          ))}
        </TextField>
      </div>

      <WideFilter>
        <DateRangeFilter
          label={t('userSubscriptionEdit.startsAt')}
          disabled={isDisabled}
          value={{
            from: toDate(filter.startsAtFrom?.date),
            to: toDate(filter.startsAtTo?.date),
          }}
          onChange={range =>
            updateFilter({
              startsAtFrom:
                range.from ?
                  {
                    date: range.from.toISOString(),
                    comparison: DateFilterComparison.GreaterThan,
                  }
                : undefined,
              startsAtTo:
                range.to ?
                  {
                    date: range.to.toISOString(),
                    comparison: DateFilterComparison.LowerThan,
                  }
                : undefined,
            })
          }
        />
      </WideFilter>

      <div>
        <TextField
          select
          label={t('userSubscriptionEdit.autoRenew')}
          value={filter.autoRenew === undefined ? '' : String(filter.autoRenew)}
          onChange={event =>
            updateFilter({
              autoRenew:
                event.target.value === '' ?
                  undefined
                : event.target.value === 'true',
            })
          }
          fullWidth
        >
          <MenuItem value="true">{t('yes')}</MenuItem>
          <MenuItem value="false">{t('no')}</MenuItem>
        </TextField>
      </div>

      <div>
        <TextField
          select
          label={t('subscriptionList.filter.deactivationReason')}
          value={filter.deactivationReason ?? ''}
          onChange={event =>
            updateFilter({
              deactivationReason:
                (event.target.value as SubscriptionDeactivationReason) ||
                undefined,
            })
          }
          fullWidth
        >
          {[
            SubscriptionDeactivationReason.None,
            SubscriptionDeactivationReason.UserSelfDeactivated,
            SubscriptionDeactivationReason.InvoiceNotPaid,
            SubscriptionDeactivationReason.UserReplacedSubscription,
            SubscriptionDeactivationReason.Chargeback,
          ].map(reason => (
            <MenuItem
              key={reason}
              value={reason}
            >
              {t(`subscriptionList.filter.reason${reason}`)}
            </MenuItem>
          ))}
        </TextField>
      </div>

      <WideFilter>
        <DateRangeFilter
          label={t('userSubscriptionEdit.deactivation.date')}
          disabled={isDisabled}
          value={{
            from: toDate(filter.deactivationDateFrom?.date),
            to: toDate(filter.deactivationDateTo?.date),
          }}
          onChange={range =>
            updateFilter({
              deactivationDateFrom:
                range.from ?
                  {
                    date: range.from.toISOString(),
                    comparison: DateFilterComparison.GreaterThan,
                  }
                : undefined,
              deactivationDateTo:
                range.to ?
                  {
                    date: range.to.toISOString(),
                    comparison: DateFilterComparison.LowerThan,
                  }
                : undefined,
            })
          }
        />
      </WideFilter>

      <WideFilter>
        <DateRangeFilter
          label={t('userSubscriptionEdit.deactivation.cancellation')}
          disabled={isDisabled}
          value={{
            from: toDate(filter.cancellationDateFrom?.date),
            to: toDate(filter.cancellationDateTo?.date),
          }}
          onChange={range =>
            updateFilter({
              cancellationDateFrom:
                range.from ?
                  {
                    date: range.from.toISOString(),
                    comparison: DateFilterComparison.GreaterThan,
                  }
                : undefined,
              cancellationDateTo:
                range.to ?
                  {
                    date: range.to.toISOString(),
                    comparison: DateFilterComparison.LowerThan,
                  }
                : undefined,
            })
          }
        />
      </WideFilter>

      <WideFilter>
        <DateRangeFilter
          label={t('userSubscriptionEdit.paidUntil')}
          disabled={isDisabled}
          value={{
            from: toDate(filter.paidUntilFrom?.date),
            to: toDate(filter.paidUntilTo?.date),
          }}
          onChange={range =>
            updateFilter({
              paidUntilFrom:
                range.from ?
                  {
                    date: range.from.toISOString(),
                    comparison: DateFilterComparison.GreaterThan,
                  }
                : undefined,
              paidUntilTo:
                range.to ?
                  {
                    date: range.to.toISOString(),
                    comparison: DateFilterComparison.LowerThan,
                  }
                : undefined,
            })
          }
        />
      </WideFilter>

      <div>
        <DatePicker
          label={t('subscriptionList.filter.activeAt')}
          disabled={isDisabled}
          value={toDate(filter.activeAt)}
          onChange={value =>
            updateFilter({ activeAt: value?.toISOString() ?? undefined })
          }
          fullWidth
          clearable
        />
      </div>

      <div>
        <TextField
          select
          label={t('subscriptionListFilter.extendable')}
          value={
            filter.extendable === undefined ? '' : String(filter.extendable)
          }
          onChange={event =>
            updateFilter({
              extendable:
                event.target.value === '' ?
                  undefined
                : event.target.value === 'true',
            })
          }
          fullWidth
        >
          <MenuItem value="true">{t('yes')}</MenuItem>
          <MenuItem value="false">{t('no')}</MenuItem>
        </TextField>
      </div>
    </Filters>
  );
}
