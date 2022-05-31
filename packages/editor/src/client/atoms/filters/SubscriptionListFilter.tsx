import React, {useEffect, useState} from 'react'
import {Button, DateRangePicker, FormGroup, Icon, SelectPicker} from 'rsuite'
import {ALL_PAYMENT_PERIODICITIES} from '../../utility'
import {
  DateFilterComparison,
  FullMemberPlanFragment,
  FullPaymentMethodFragment,
  SubscriptionDeactivationReason,
  SubscriptionFilter,
  useMemberPlanListQuery,
  usePaymentMethodListQuery
} from '../../api'
import {useTranslation} from 'react-i18next'

export interface SubscriptionListFilterProps {
  filter: SubscriptionFilter
  isLoading: boolean
  onSetFilter(filter: SubscriptionFilter): void
}

export function SubscriptionListFilter({
  filter,
  isLoading,
  onSetFilter
}: SubscriptionListFilterProps) {
  const {t} = useTranslation()
  const [resetFilterKey, setResetFilterkey] = useState<string>(new Date().getTime().toString())
  const [paymentMethods, setPaymentMethods] = useState<FullPaymentMethodFragment[]>([])
  const [memberPlans, setMemberPlans] = useState<FullMemberPlanFragment[]>([])

  /**
   * fetch payment methods
   */
  const {
    data: paymentMethodData,
    loading: isPaymentMethodLoading,
    error: paymentMethodLoadError
  } = usePaymentMethodListQuery({
    fetchPolicy: 'network-only'
  })

  /**
   * fetch member plans
   */
  const {
    data: memberPlanData,
    loading: isMemberPlanLoading,
    error: loadMemberPlanError
  } = useMemberPlanListQuery({
    fetchPolicy: 'network-only',
    variables: {
      first: 200
    }
  })

  const isDisabled =
    isLoading ||
    isMemberPlanLoading ||
    isPaymentMethodLoading ||
    loadMemberPlanError !== undefined ||
    paymentMethodLoadError !== undefined

  /**
   * watchers
   */
  useEffect(() => {
    if (paymentMethodData?.paymentMethods) {
      setPaymentMethods(paymentMethodData.paymentMethods)
    }
  }, [paymentMethodData?.paymentMethods])

  useEffect(() => {
    if (memberPlanData?.memberPlans?.nodes) {
      setMemberPlans(memberPlanData.memberPlans.nodes)
    }
  }, [memberPlanData?.memberPlans])

  /**
   * helper functions to manage filter
   */
  function isAnyFilterSet(): boolean {
    for (const [filterKey, filterValue] of Object.entries(filter)) {
      if (filterKey && filterValue !== undefined) return true
    }
    return false
  }

  function resetFilter(): void {
    onSetFilter({})
    setResetFilterkey(new Date().getTime().toString())
  }

  const updateFilter = (value: SubscriptionFilter) => {
    const newFilter = {
      ...filter,
      ...value
    }
    onSetFilter(newFilter)
  }

  /**
   * UI helper functions
   */
  function resetFilterView() {
    if (!isAnyFilterSet()) {
      return <></>
    }
    return (
      <>
        <FormGroup style={{marginRight: '15px', marginTop: '15px'}}>
          <Button onClick={() => resetFilter()} color="red" appearance="ghost">
            <Icon icon="close" style={{marginRight: '5px'}} />
            {t('subscriptionList.filter.reset')}
          </Button>
        </FormGroup>
      </>
    )
  }

  return (
    <>
      <FormGroup style={{marginRight: '15px', marginTop: '15px'}}>
        <SelectPicker
          key={`member-plan-${resetFilterKey}`}
          placeholder={t('userSubscriptionEdit.selectMemberPlan')}
          block
          disabled={isDisabled}
          data={memberPlans.map(mp => ({value: mp.id, label: mp.name}))}
          onChange={value =>
            updateFilter({memberPlanID: memberPlans.find(mp => mp.id === value)?.id})
          }
        />
      </FormGroup>
      <FormGroup style={{marginRight: '15px', marginTop: '15px'}}>
        <SelectPicker
          key={`payment-periodicity-${resetFilterKey}`}
          placeholder={t('memberPlanList.paymentPeriodicities')}
          value={filter.paymentPeriodicity}
          data={ALL_PAYMENT_PERIODICITIES.map(pp => ({
            value: pp,
            label: t(`memberPlanList.paymentPeriodicity.${pp}`)
          }))}
          disabled={isDisabled}
          onChange={value => updateFilter({paymentPeriodicity: value || undefined})}
          block
        />
      </FormGroup>
      <FormGroup style={{marginRight: '15px', marginTop: '15px'}}>
        <SelectPicker
          key={`payment-method-${resetFilterKey}`}
          placeholder={t('userSubscriptionEdit.paymentMethod')}
          block
          disabled={isDisabled}
          data={paymentMethods.map(pm => ({value: pm.id, label: pm.name}))}
          value={filter.paymentMethodID}
          onChange={value =>
            updateFilter({paymentMethodID: paymentMethods.find(pm => pm.id === value)?.id})
          }
        />
      </FormGroup>
      <FormGroup style={{marginRight: '15px', marginTop: '15px'}}>
        <DateRangePicker
          key={`starts-at-${resetFilterKey}`}
          placeholder={t('userSubscriptionEdit.startsAt')}
          block
          onChange={value => {
            if (value[0] && value[1]) {
              updateFilter({
                startsAtFrom: {
                  date: value[0]?.toISOString(),
                  comparison: DateFilterComparison.Greater
                },
                startsAtTo: {
                  date: value[1]?.toISOString(),
                  comparison: DateFilterComparison.Lower
                }
              })
            }
          }}
          onClean={() => updateFilter({startsAtFrom: undefined, startsAtTo: undefined})}
          placement="auto"
        />
      </FormGroup>
      <FormGroup style={{marginRight: '15px', marginTop: '15px'}}>
        <SelectPicker
          key={`auto-renew-${resetFilterKey}`}
          placeholder={t('userSubscriptionEdit.autoRenew')}
          searchable={false}
          data={[
            {
              value: true,
              label: t('yes')
            },
            {
              value: false,
              label: t('no')
            }
          ]}
          block
          placement="auto"
          onChange={value => updateFilter({autoRenew: value})}
        />
      </FormGroup>
      <FormGroup style={{marginRight: '15px', marginTop: '15px'}}>
        <SelectPicker
          key={`deactivation-reason-${resetFilterKey}`}
          placeholder={t('subscriptionList.filter.deactivationReason')}
          searchable={false}
          data={[
            {
              value: SubscriptionDeactivationReason.None,
              label: t('subscriptionList.filter.reasonNone')
            },
            {
              value: SubscriptionDeactivationReason.UserSelfDeactivated,
              label: t('subscriptionList.filter.reasonUserSelfDeactivated')
            },
            {
              value: SubscriptionDeactivationReason.InvoiceNotPaid,
              label: t('subscriptionList.filter.reasonInvoiceNotPaid')
            }
          ]}
          value={filter.deactivationReason}
          block
          placement="auto"
          onChange={value => updateFilter({deactivationReason: value})}
        />
      </FormGroup>
      <FormGroup style={{marginRight: '15px', marginTop: '15px'}}>
        <DateRangePicker
          key={`deactivation-date-${resetFilterKey}`}
          placeholder={t('userSubscriptionEdit.deactivation.date')}
          block
          placement="auto"
          onChange={value => {
            if (value[0] && value[1]) {
              updateFilter({
                deactivationDateFrom: {
                  date: value[0]?.toISOString(),
                  comparison: DateFilterComparison.Greater
                },
                deactivationDateTo: {
                  date: value[1]?.toISOString(),
                  comparison: DateFilterComparison.Lower
                }
              })
            }
          }}
          onClean={() =>
            updateFilter({deactivationDateFrom: undefined, deactivationDateTo: undefined})
          }
        />
      </FormGroup>
      <FormGroup style={{marginRight: '15px', marginTop: '15px'}}>
        <DateRangePicker
          key={`payed-until-${resetFilterKey}`}
          placeholder={t('userSubscriptionEdit.payedUntil')}
          block
          placement="auto"
          onChange={value => {
            if (value[0] && value[1]) {
              updateFilter({
                paidUntilFrom: {
                  date: value[0]?.toISOString(),
                  comparison: DateFilterComparison.Greater
                },
                paidUntilTo: {
                  date: value[1]?.toISOString(),
                  comparison: DateFilterComparison.Lower
                }
              })
            }
          }}
          onClean={() => updateFilter({paidUntilFrom: undefined, paidUntilTo: undefined})}
        />
      </FormGroup>
      {resetFilterView()}
    </>
  )
}
