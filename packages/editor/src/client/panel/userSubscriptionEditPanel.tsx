import React, {useEffect, useState} from 'react'

import {
  Alert,
  Button,
  ControlLabel,
  DatePicker,
  Drawer,
  Form,
  FormControl,
  FormGroup,
  HelpBlock,
  Panel,
  SelectPicker,
  Toggle
} from 'rsuite'

import {
  FullMemberPlanFragment,
  FullPaymentMethodFragment,
  FullUserSubscriptionFragment,
  PaymentPeriodicity,
  useMemberPlanListQuery,
  usePaymentMethodListQuery,
  useUpdateUserSubscriptionMutation
} from '../api'
import {useTranslation} from 'react-i18next'
import {DescriptionList, DescriptionListItem} from '../atoms/descriptionList'
import {ALL_PAYMENT_PERIODICITIES} from '../utility'

export interface UserSubscriptionEditPanelProps {
  userID: string
  subscription?: FullUserSubscriptionFragment

  onClose?(): void
  onSave?(subscription: FullUserSubscriptionFragment): void
}

export function UserSubscriptionEditPanel({
  userID,
  subscription,
  onClose,
  onSave
}: UserSubscriptionEditPanelProps) {
  const {t} = useTranslation()

  const [memberPlan, setMemberPlan] = useState(subscription?.memberPlan)
  const [memberPlans, setMemberPlans] = useState<FullMemberPlanFragment[]>([])
  const [paymentPeriodicity, setPaymentPeriodicity] = useState<PaymentPeriodicity>(
    subscription?.paymentPeriodicity ?? PaymentPeriodicity.Yearly
  )
  const [amount, setAmount] = useState<number>(subscription?.amount ?? 0)
  const [autoRenew, setAutoRenew] = useState(subscription?.autoRenew ?? false)
  const [startsAt, setStartsAt] = useState<Date>(
    subscription ? new Date(subscription.startsAt) : new Date()
  )

  const [paidUntil /* setPaidUntil */] = useState(
    subscription?.paidUntil ? new Date(subscription.paidUntil) : null
  )
  const [paymentMethods, setPaymentMethods] = useState<FullPaymentMethodFragment[]>([])
  const [paymentMethod, setPaymentMethod] = useState(subscription?.paymentMethod)
  const [deactivatedAt, setDeactivatedAt] = useState(
    subscription?.deactivatedAt ? new Date(subscription.deactivatedAt) : null
  )

  const {
    data: memberPlanData,
    loading: isMemberPlanLoading,
    error: loadMemberPlanError
  } = useMemberPlanListQuery({
    fetchPolicy: 'network-only',
    variables: {
      first: 200 // TODO: Pagination
    }
  })

  const {
    data: paymentMethodData,
    loading: isPaymentMethodLoading,
    error: paymentMethodLoadError
  } = usePaymentMethodListQuery({
    fetchPolicy: 'network-only'
  })

  const [
    updateUserSubscription,
    {loading: isUpdating, error: updateError}
  ] = useUpdateUserSubscriptionMutation()

  const isDisabled =
    isMemberPlanLoading ||
    isUpdating ||
    isPaymentMethodLoading ||
    loadMemberPlanError !== undefined ||
    paymentMethodLoadError !== undefined

  const hasNoMemberPlanSelected = memberPlan === undefined

  useEffect(() => {
    if (memberPlanData?.memberPlans?.nodes) {
      setMemberPlans(memberPlanData.memberPlans.nodes)
    }
  }, [memberPlanData?.memberPlans])

  useEffect(() => {
    if (paymentMethodData?.paymentMethods) {
      setPaymentMethods(paymentMethodData.paymentMethods)
    }
  }, [paymentMethodData?.paymentMethods])

  useEffect(() => {
    const error =
      loadMemberPlanError?.message ?? updateError?.message ?? paymentMethodLoadError?.message
    if (error) Alert.error(error, 0)
  }, [updateError, loadMemberPlanError, paymentMethodLoadError])

  async function handleSave() {
    if (!memberPlan) return
    if (!paymentMethod) return
    // TODO: show error

    const {data} = await updateUserSubscription({
      variables: {
        userID,
        input: {
          memberPlanID: memberPlan.id,
          amount,
          paymentPeriodicity,
          autoRenew,
          startsAt: startsAt.toISOString(),
          paidUntil: paidUntil ? paidUntil.toISOString() : null,
          paymentMethodID: paymentMethod.id,
          deactivatedAt: deactivatedAt ? deactivatedAt.toISOString() : null
        }
      }
    })

    if (data?.updateUserSubscription) onSave?.(data.updateUserSubscription)
  }

  return (
    <>
      <Drawer.Header>
        <Drawer.Title>
          {subscription
            ? t('userSubscriptionEdit.editTitle')
            : t('userSubscriptionEdit.createTitle')}
        </Drawer.Title>
      </Drawer.Header>

      <Drawer.Body>
        <Panel>
          <Form fluid={true}>
            <FormGroup>
              <ControlLabel>{t('userSubscriptionEdit.selectMemberPlan')}</ControlLabel>
              <SelectPicker
                block
                disabled={isDisabled}
                data={memberPlans.map(mp => ({value: mp.id, label: mp.name}))}
                value={subscription?.memberPlan.id}
                onChange={value => setMemberPlan(memberPlans.find(mp => mp.id === value))}
              />
              {memberPlan && (
                <HelpBlock>
                  <DescriptionList>
                    <DescriptionListItem label={t('userSubscriptionEdit.memberPlanamount')}>
                      {memberPlan.minAmount}
                    </DescriptionListItem>
                  </DescriptionList>
                </HelpBlock>
              )}
            </FormGroup>
            <FormGroup>
              <ControlLabel>{t('userSubscriptionEdit.amount')}</ControlLabel>
              <FormControl
                name={t('userSubscriptionEdit.amount')}
                value={amount}
                type="number"
                disabled={isDisabled || hasNoMemberPlanSelected}
                onChange={value => {
                  setAmount(parseInt(`${value}`)) // TODO: fix this
                }}
              />
            </FormGroup>
            <FormGroup>
              <ControlLabel>{t('memberPlanList.paymentPeriodicities')}</ControlLabel>
              <SelectPicker
                value={paymentPeriodicity}
                data={ALL_PAYMENT_PERIODICITIES.map(pp => ({
                  value: pp,
                  label: t(`memberPlanList.paymentPeriodicity.${pp}`)
                }))}
                onChange={value => setPaymentPeriodicity(value)}
                block
              />
            </FormGroup>
            <FormGroup>
              <ControlLabel>{t('userSubscriptionEdit.autoRenew')}</ControlLabel>
              <Toggle
                checked={autoRenew}
                disabled={isDisabled || hasNoMemberPlanSelected}
                onChange={value => setAutoRenew(value)}
              />
              <HelpBlock>{t('userSubscriptionEdit.autoRenewDescription')}</HelpBlock>
            </FormGroup>
            <FormGroup>
              <ControlLabel>{t('userSubscriptionEdit.startsAt')}</ControlLabel>
              <DatePicker
                block
                value={startsAt}
                disabled={isDisabled || hasNoMemberPlanSelected}
                onChange={value => setStartsAt(value)}
              />
            </FormGroup>
            <FormGroup>
              <ControlLabel>{t('userSubscriptionEdit.payedUntil')}</ControlLabel>
              <DatePicker
                block
                value={paidUntil ?? undefined}
                disabled={true /* TODO fix this */}
              />
            </FormGroup>
            <FormGroup>
              <ControlLabel>{t('userSubscriptionEdit.paymentMethod')}</ControlLabel>
              <SelectPicker
                block
                disabled={isDisabled || hasNoMemberPlanSelected}
                data={paymentMethods.map(pm => ({value: pm.id, label: pm.name}))}
                value={subscription?.paymentMethod.id}
                onChange={value => setPaymentMethod(paymentMethods.find(pm => pm.id === value))}
              />
            </FormGroup>
            {/* TODO Payment Method */}

            <FormGroup>
              <ControlLabel>{t('userSubscriptionEdit.deactivatedAt')}</ControlLabel>
              <DatePicker
                block
                value={deactivatedAt ?? undefined}
                disabled={isDisabled || hasNoMemberPlanSelected}
                onChange={value => setDeactivatedAt(value)}
              />
            </FormGroup>
          </Form>
          {/* TODO: implement end subscription */}
        </Panel>
      </Drawer.Body>

      <Drawer.Footer>
        <Button appearance={'primary'} disabled={isDisabled} onClick={() => handleSave()}>
          {subscription ? t('save') : t('create')}
        </Button>
        <Button appearance={'subtle'} onClick={() => onClose?.()}>
          {t('close')}
        </Button>
      </Drawer.Footer>
    </>
  )
}
