import styled from '@emotion/styled';
import {
  DateFilterComparison,
  FullMemberPlanFragment,
  FullPaymentMethodFragment,
  FullUserFragment,
  SubscriptionDeactivationReason,
  SubscriptionFilter,
  useMemberPlanListQuery,
  usePaymentMethodListQuery,
} from '@wepublish/editor/api';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdClose } from 'react-icons/md';
import { Button, DateRangePicker, Form as RForm, SelectPicker } from 'rsuite';

import { ALL_PAYMENT_PERIODICITIES } from '../../utility';
import { UserSearch } from './userSearch';

const { Group } = RForm;

const Form = styled(RForm)`
  display: flex;
  flex-wrap: wrap;
  margin-top: 15px;
`;

const CloseIcon = styled(MdClose)`
  margin-right: 5px;
`;

const FormGroup = styled(Group)`
  margin-right: 15px;
  margin-top: 15px;
`;

export interface SubscriptionListFilterProps {
  filter: SubscriptionFilter;
  isLoading: boolean;
  onSetFilter(filter: SubscriptionFilter): void;
}

export function SubscriptionListFilter({
  filter,
  isLoading,
  onSetFilter,
}: SubscriptionListFilterProps) {
  const { t } = useTranslation();
  const [resetFilterKey, setResetFilterkey] = useState<string>(
    new Date().getTime().toString()
  );
  const [paymentMethods, setPaymentMethods] = useState<
    FullPaymentMethodFragment[]
  >([]);
  const [memberPlans, setMemberPlans] = useState<FullMemberPlanFragment[]>([]);
  const [user, setUser] = useState<FullUserFragment | undefined | null>(
    undefined
  );

  const {
    data: paymentMethodData,
    loading: isPaymentMethodLoading,
    error: paymentMethodLoadError,
  } = usePaymentMethodListQuery({});

  const formInputStyle = {
    marginRight: '15px',
    marginTop: '0',
    marginBottom: '10px',
  };

  const {
    data: memberPlanData,
    loading: isMemberPlanLoading,
    error: loadMemberPlanError,
  } = useMemberPlanListQuery({
    variables: {
      take: 200,
    },
  });

  const isDisabled =
    isLoading ||
    isMemberPlanLoading ||
    isPaymentMethodLoading ||
    loadMemberPlanError !== undefined ||
    paymentMethodLoadError !== undefined;

  /**
   * watchers
   */
  useEffect(() => {
    if (paymentMethodData?.paymentMethods) {
      setPaymentMethods(paymentMethodData.paymentMethods);
    }
  }, [paymentMethodData?.paymentMethods]);

  useEffect(() => {
    if (memberPlanData?.memberPlans?.nodes) {
      setMemberPlans(memberPlanData.memberPlans.nodes);
    }
  }, [memberPlanData?.memberPlans]);

  /**
   * helper functions to manage filter
   */
  function isAnyFilterSet(): boolean {
    for (const [filterKey, filterValue] of Object.entries(filter)) {
      if (filterKey && filterValue !== undefined) return true;
    }
    return false;
  }

  function resetFilter(): void {
    onSetFilter({});
    setResetFilterkey(new Date().getTime().toString());
  }

  const updateFilter = (value: SubscriptionFilter) => {
    const newFilter = {
      ...filter,
      ...value,
    };
    onSetFilter(newFilter);
  };

  /**
   * UI helper functions
   */
  function resetFilterView(): JSX.Element {
    if (!isAnyFilterSet()) {
      // eslint-disable-next-line react/jsx-no-useless-fragment
      return <></>;
    }
    return (
      <FormGroup>
        <Button
          onClick={() => resetFilter()}
          color="red"
          appearance="ghost"
        >
          <CloseIcon />
          {t('subscriptionList.filter.reset')}
        </Button>
      </FormGroup>
    );
  }

  return (
    <>
      <Form>
        <Group style={formInputStyle}>
          <UserSearch
            name="user"
            resetFilterKey={resetFilterKey}
            user={user}
            onUpdateUser={user => {
              setUser(user);
              updateFilter({
                userID: user?.id,
              });
            }}
            placeholder={t('subscriptionList.filter.searchPlaceholder')}
          />
        </Group>
        <Group style={formInputStyle}>
          <SelectPicker
            key={`member-plan-${resetFilterKey}`}
            placeholder={t('userSubscriptionEdit.selectMemberPlan')}
            block
            disabled={isDisabled}
            data={memberPlans.map(mp => ({ value: mp.id, label: mp.name }))}
            onChange={value =>
              updateFilter({
                memberPlanID: memberPlans.find(mp => mp.id === value)?.id,
              })
            }
          />
        </Group>
        <Group style={formInputStyle}>
          <SelectPicker
            key={`payment-periodicity-${resetFilterKey}`}
            placeholder={t('memberPlanList.paymentPeriodicities')}
            block
            disabled={isDisabled}
            data={ALL_PAYMENT_PERIODICITIES.map(pp => ({
              value: pp,
              label: t(`memberPlanList.paymentPeriodicity.${pp}`),
            }))}
            onChange={value =>
              updateFilter({ paymentPeriodicity: value || undefined })
            }
          />
        </Group>
        <Group style={formInputStyle}>
          <SelectPicker
            key={`payment-method-${resetFilterKey}`}
            placeholder={t('userSubscriptionEdit.paymentMethod')}
            block
            disabled={isDisabled}
            data={paymentMethods.map(pm => ({ value: pm.id, label: pm.name }))}
            onChange={value =>
              updateFilter({
                paymentMethodID: paymentMethods.find(pm => pm.id === value)?.id,
              })
            }
          />
        </Group>
        <Group style={formInputStyle}>
          <DateRangePicker
            key={`starts-at-${resetFilterKey}`}
            placeholder={t('userSubscriptionEdit.startsAt')}
            block
            onChange={value => {
              if (value && value[0] && value[1]) {
                updateFilter({
                  startsAtFrom: {
                    date: value[0]?.toISOString(),
                    comparison: DateFilterComparison.GreaterThan,
                  },
                  startsAtTo: {
                    date: value[1]?.toISOString(),
                    comparison: DateFilterComparison.LowerThan,
                  },
                });
              }
            }}
            onClean={() =>
              updateFilter({ startsAtFrom: undefined, startsAtTo: undefined })
            }
            placement="auto"
          />
        </Group>
        <Group style={formInputStyle}>
          <SelectPicker
            key={`auto-renew-${resetFilterKey}`}
            placeholder={t('userSubscriptionEdit.autoRenew')}
            searchable={false}
            data={[
              {
                value: 'true',
                label: t('yes'),
              },
              {
                value: 'false',
                label: t('no'),
              },
            ]}
            block
            placement="auto"
            onChange={value => updateFilter({ autoRenew: value === 'true' })}
          />
        </Group>
        <Group style={formInputStyle}>
          <SelectPicker
            key={`deactivation-reason-${resetFilterKey}`}
            placeholder={t('subscriptionList.filter.deactivationReason')}
            searchable={false}
            data={[
              {
                value: SubscriptionDeactivationReason.None,
                label: t('subscriptionList.filter.reasonNone'),
              },
              {
                value: SubscriptionDeactivationReason.UserSelfDeactivated,
                label: t('subscriptionList.filter.reasonUserSelfDeactivated'),
              },
              {
                value: SubscriptionDeactivationReason.InvoiceNotPaid,
                label: t('subscriptionList.filter.reasonInvoiceNotPaid'),
              },
              {
                value: SubscriptionDeactivationReason.UserReplacedSubscription,
                label: t(
                  'subscriptionList.filter.reasonUserReplacedSubscription'
                ),
              },
            ]}
            block
            placement="auto"
            onChange={value => updateFilter({ deactivationReason: value })}
          />
        </Group>
        <Group style={formInputStyle}>
          <DateRangePicker
            key={`deactivation-date-${resetFilterKey}`}
            placeholder={t('userSubscriptionEdit.deactivation.date')}
            block
            placement="auto"
            onChange={value => {
              if (value && value[0] && value[1]) {
                updateFilter({
                  deactivationDateFrom: {
                    date: value[0]?.toISOString(),
                    comparison: DateFilterComparison.GreaterThan,
                  },
                  deactivationDateTo: {
                    date: value[1]?.toISOString(),
                    comparison: DateFilterComparison.LowerThan,
                  },
                });
              }
            }}
            onClean={() =>
              updateFilter({
                deactivationDateFrom: undefined,
                deactivationDateTo: undefined,
              })
            }
          />
        </Group>
        <Group style={formInputStyle}>
          <DateRangePicker
            key={`cancellation-date-${resetFilterKey}`}
            placeholder={t('userSubscriptionEdit.deactivation.cancellation')}
            block
            placement="auto"
            onChange={value => {
              if (value && value[0] && value[1]) {
                updateFilter({
                  cancellationDateFrom: {
                    date: value[0]?.toISOString(),
                    comparison: DateFilterComparison.GreaterThan,
                  },
                  cancellationDateTo: {
                    date: value[1]?.toISOString(),
                    comparison: DateFilterComparison.LowerThan,
                  },
                });
              }
            }}
            onClean={() =>
              updateFilter({
                cancellationDateFrom: undefined,
                cancellationDateTo: undefined,
              })
            }
          />
        </Group>
        <Group style={formInputStyle}>
          <DateRangePicker
            key={`paid-until-${resetFilterKey}`}
            placeholder={t('userSubscriptionEdit.paidUntil')}
            block
            placement="auto"
            onChange={value => {
              if (value && value[0] && value[1]) {
                updateFilter({
                  paidUntilFrom: {
                    date: value[0]?.toISOString(),
                    comparison: DateFilterComparison.GreaterThan,
                  },
                  paidUntilTo: {
                    date: value[1]?.toISOString(),
                    comparison: DateFilterComparison.LowerThan,
                  },
                });
              }
            }}
            onClean={() =>
              updateFilter({ paidUntilFrom: undefined, paidUntilTo: undefined })
            }
          />
        </Group>
        <Group style={formInputStyle}>
          <SelectPicker
            key={`extendable-${resetFilterKey}`}
            placeholder={t('subscriptionListFilter.extendable')}
            label={t('subscriptionListFilter.extendable')}
            searchable={false}
            data={[
              {
                value: 'true',
                label: t('yes'),
              },
              {
                value: 'false',
                label: t('no'),
              },
            ]}
            block
            placement="auto"
            onChange={value =>
              updateFilter({
                extendable: value === null ? null : value === 'true',
              })
            }
          />
        </Group>
      </Form>
      {resetFilterView()}
    </>
  );
}
