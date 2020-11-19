import React, {useState, useEffect} from 'react'

import {
  Button,
  ControlLabel,
  Drawer,
  Form,
  FormControl,
  FormGroup,
  Panel,
  Alert,
  Toggle,
  HelpBlock,
  SelectPicker,
  DatePicker
} from 'rsuite'

import {
  useUpdateUserSubscriptionMutation,
  FullUserSubscriptionFragment,
  useMemberPlanListQuery,
  FullMemberPlanFragment,
  FullPaymentMethodFragment,
  usePaymentMethodListQuery
} from '../api'
import {useTranslation} from 'react-i18next'
import {DescriptionList, DescriptionListItem} from '../atoms/descriptionList'

export interface UserSubscriptionEditPanelProps {
  userId: string
  subscription?: FullUserSubscriptionFragment

  onClose?(): void
  onSave?(subscription: FullUserSubscriptionFragment): void
}

export function UserSubscriptionEditPanel({
  userId,
  subscription,
  onClose,
  onSave
}: UserSubscriptionEditPanelProps) {
  const {t} = useTranslation()

  const [memberPlan, setMemberPlan] = useState(subscription?.memberPlan)
  const [memberPlans, setMemberPlans] = useState<FullMemberPlanFragment[]>([])
  const [paymentPeriodicity /* setPaymentPeriodicity */] = useState(
    subscription?.paymentPeriodicity ?? 'monthly'
  ) // TODO: find smart default
  const [monthlyAmount, setMonthlyAmount] = useState(subscription?.monthlyAmount ?? 0)
  const [autoRenew, setAutoRenew] = useState(subscription?.autoRenew ?? false)
  const [startsAt, setStartsAt] = useState<Date>(
    subscription ? new Date(subscription.startsAt) : new Date()
  )

  const [payedUntil /* setPayedUntil */] = useState(
    subscription ? new Date(subscription.payedUntil) : new Date()
  )
  const [paymentMethods, setPaymentMethods] = useState<FullPaymentMethodFragment[]>([])
  const [paymentMethod, setPaymentMethod] = useState(subscription?.paymentMethod ?? 'CC') // TODO: find smart default
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

    const {data} = await updateUserSubscription({
      variables: {
        userId,
        input: {
          memberPlanId: memberPlan.id,
          monthlyAmount,
          paymentPeriodicity,
          autoRenew,
          startsAt: startsAt.toISOString(),
          payedUntil: payedUntil.toISOString(),
          paymentMethod,
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
                    <DescriptionListItem label={t('userSubscriptionEdit.memberPlanMonthlyAmount')}>
                      {memberPlan.pricePerMonthMinimum}{' '}
                      {memberPlan.pricePerMonthMinimum !== memberPlan.pricePerMonthMaximum
                        ? `- ${memberPlan.pricePerMonthMaximum}`
                        : ''}
                    </DescriptionListItem>
                  </DescriptionList>
                </HelpBlock>
              )}
            </FormGroup>
            <FormGroup>
              <ControlLabel>{t('userSubscriptionEdit.monthlyAmount')}</ControlLabel>
              <FormControl
                name={t('userSubscriptionEdit.monthlyAmount')}
                value={monthlyAmount}
                type="number"
                disabled={isDisabled || hasNoMemberPlanSelected}
                onChange={value => {
                  setMonthlyAmount(value)
                }}
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
              <DatePicker block value={payedUntil} disabled={true /* TODO fix this */} />
            </FormGroup>
            <FormGroup>
              <ControlLabel>{t('userSubscriptionEdit.paymentMethod')}</ControlLabel>
              <SelectPicker
                block
                data={paymentMethods.map(pm => ({value: pm.id, label: pm.name}))}
                value={paymentMethod}
                onChange={value => setPaymentMethod(value)}
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
