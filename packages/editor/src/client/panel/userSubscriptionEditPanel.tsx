import React, {useEffect, useState} from 'react'

import {
  Alert,
  Button,
  ControlLabel,
  DatePicker,
  Drawer,
  Form,
  FormGroup,
  HelpBlock,
  Panel,
  SelectPicker,
  Toggle,
  Modal,
  Message
} from 'rsuite'

import {
  FullMemberPlanFragment,
  FullPaymentMethodFragment,
  FullUserFragment,
  FullUserSubscriptionFragment,
  PaymentPeriodicity,
  SubscriptionDeactivationReason,
  useMemberPlanListQuery,
  usePaymentMethodListQuery,
  useUpdateUserSubscriptionMutation
} from '../api'
import {useTranslation} from 'react-i18next'
import {DescriptionList, DescriptionListItem} from '../atoms/descriptionList'
import {ALL_PAYMENT_PERIODICITIES} from '../utility'
import {UserSubscriptionDeactivatePanel} from './userSubscriptionDeactivatePanel'
import {CurrencyInput} from '../atoms/currencyInput'

export interface UserSubscriptionEditPanelProps {
  user: FullUserFragment

  onClose?(): void
  onSave?(subscription: FullUserSubscriptionFragment): void
}

export function UserSubscriptionEditPanel({user, onClose, onSave}: UserSubscriptionEditPanelProps) {
  const {t} = useTranslation()

  const [isDeactivationPanelOpen, setDeactivationPanelOpen] = useState<boolean>(false)

  const [subscription, setSubscription] = useState<null | FullUserSubscriptionFragment>(
    user.subscription ?? null
  )

  const [memberPlan, setMemberPlan] = useState(subscription?.memberPlan)
  const [memberPlans, setMemberPlans] = useState<FullMemberPlanFragment[]>([])
  const [paymentPeriodicity, setPaymentPeriodicity] = useState<PaymentPeriodicity>(
    subscription?.paymentPeriodicity ?? PaymentPeriodicity.Yearly
  )
  const [monthlyAmount, setMonthlyAmount] = useState<number>(subscription?.monthlyAmount ?? 0)
  const [autoRenew, setAutoRenew] = useState(subscription?.autoRenew ?? false)
  const [startsAt, setStartsAt] = useState<Date>(
    subscription ? new Date(subscription.startsAt) : new Date()
  )

  const [paidUntil /* setPaidUntil */] = useState(
    subscription?.paidUntil ? new Date(subscription.paidUntil) : null
  )
  const [paymentMethods, setPaymentMethods] = useState<FullPaymentMethodFragment[]>([])
  const [paymentMethod, setPaymentMethod] = useState(subscription?.paymentMethod)

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

  const isDeactivated = subscription?.deactivation?.date
    ? new Date(subscription.deactivation.date) < new Date()
    : false

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
        userID: user.id,
        input: {
          memberPlanID: memberPlan.id,
          monthlyAmount,
          paymentPeriodicity,
          autoRenew,
          startsAt: startsAt.toISOString(),
          paidUntil: paidUntil ? paidUntil.toISOString() : null,
          paymentMethodID: paymentMethod.id,
          deactivation: subscription?.deactivation
            ? {
                date: subscription.deactivation.date,
                reason: subscription.deactivation.reason
              }
            : null
        }
      }
    })

    if (data?.updateUserSubscription) onSave?.(data.updateUserSubscription)
  }
  async function handleDeactivation(date: Date, reason: SubscriptionDeactivationReason) {
    if (!memberPlan || !paymentMethod) return
    const {data} = await updateUserSubscription({
      variables: {
        userID: user.id,
        input: {
          memberPlanID: memberPlan.id,
          monthlyAmount,
          paymentPeriodicity,
          autoRenew,
          startsAt: startsAt.toISOString(),
          paidUntil: paidUntil ? paidUntil.toISOString() : null,
          paymentMethodID: paymentMethod.id,
          deactivation: {
            reason,
            date: date.toISOString()
          }
        }
      }
    })

    if (data?.updateUserSubscription) {
      setSubscription(data.updateUserSubscription)
    }
  }

  async function handleReactivation() {
    if (!memberPlan || !paymentMethod) return
    const {data} = await updateUserSubscription({
      variables: {
        userID: user.id,
        input: {
          memberPlanID: memberPlan.id,
          monthlyAmount,
          paymentPeriodicity,
          autoRenew,
          startsAt: startsAt.toISOString(),
          paidUntil: paidUntil ? paidUntil.toISOString() : null,
          paymentMethodID: paymentMethod.id,
          deactivation: null
        }
      }
    })

    if (data?.updateUserSubscription) {
      setSubscription(data.updateUserSubscription)
    }
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
        {subscription?.deactivation && (
          <Message
            showIcon
            type="info"
            description={t(
              new Date(subscription.deactivation.date) < new Date()
                ? 'userSubscriptionEdit.deactivation.isDeactivated'
                : 'userSubscriptionEdit.deactivation.willBeDeactivated',
              {date: new Date(subscription.deactivation.date)}
            )}
          />
        )}
        <Panel>
          <Form fluid={true}>
            <FormGroup>
              <ControlLabel>{t('userSubscriptionEdit.selectMemberPlan')}</ControlLabel>
              <SelectPicker
                block
                disabled={isDisabled || isDeactivated}
                data={memberPlans.map(mp => ({value: mp.id, label: mp.name}))}
                value={subscription?.memberPlan.id}
                onChange={value => setMemberPlan(memberPlans.find(mp => mp.id === value))}
              />
              {memberPlan && (
                <HelpBlock>
                  <DescriptionList>
                    <DescriptionListItem label={t('userSubscriptionEdit.memberPlanMonthlyAmount')}>
                      {(memberPlan.amountPerMonthMin / 100).toFixed(2)}
                    </DescriptionListItem>
                  </DescriptionList>
                </HelpBlock>
              )}
            </FormGroup>
            <FormGroup>
              <ControlLabel>{t('userSubscriptionEdit.monthlyAmount')}</ControlLabel>
              <CurrencyInput
                currency="CHF"
                centAmount={monthlyAmount}
                step={0.05}
                onChange={centAmount => {
                  setMonthlyAmount(centAmount)
                }}
                disabled={isDisabled || hasNoMemberPlanSelected || isDeactivated}
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
                disabled={isDisabled || hasNoMemberPlanSelected || isDeactivated}
                onChange={value => setPaymentPeriodicity(value)}
                block
              />
            </FormGroup>
            <FormGroup>
              <ControlLabel>{t('userSubscriptionEdit.autoRenew')}</ControlLabel>
              <Toggle
                checked={autoRenew}
                disabled={isDisabled || hasNoMemberPlanSelected || isDeactivated}
                onChange={value => setAutoRenew(value)}
              />
              <HelpBlock>{t('userSubscriptionEdit.autoRenewDescription')}</HelpBlock>
            </FormGroup>
            <FormGroup>
              <ControlLabel>{t('userSubscriptionEdit.startsAt')}</ControlLabel>
              <DatePicker
                block
                value={startsAt}
                disabled={isDisabled || hasNoMemberPlanSelected || isDeactivated}
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
                disabled={isDisabled || hasNoMemberPlanSelected || isDeactivated}
                data={paymentMethods.map(pm => ({value: pm.id, label: pm.name}))}
                value={subscription?.paymentMethod.id}
                onChange={value => setPaymentMethod(paymentMethods.find(pm => pm.id === value))}
              />
            </FormGroup>
          </Form>
        </Panel>
        {subscription && subscription.paymentMethod && subscription.memberPlan && (
          <Panel>
            <Button
              appearance={'primary'}
              disabled={isDisabled}
              onClick={() => setDeactivationPanelOpen(true)}>
              {t(
                subscription.deactivation
                  ? 'userSubscriptionEdit.deactivation.title.deactivated'
                  : 'userSubscriptionEdit.deactivation.title.activated'
              )}
            </Button>
          </Panel>
        )}
      </Drawer.Body>

      <Drawer.Footer>
        <Button
          appearance={'primary'}
          disabled={isDisabled || isDeactivated}
          onClick={() => handleSave()}>
          {subscription ? t('save') : t('create')}
        </Button>
        <Button appearance={'subtle'} onClick={() => onClose?.()}>
          {t('close')}
        </Button>
      </Drawer.Footer>

      {subscription && (
        <Modal
          show={isDeactivationPanelOpen}
          size={'sm'}
          backdrop={'static'}
          keyboard={false}
          onHide={() => setDeactivationPanelOpen(false)}>
          <UserSubscriptionDeactivatePanel
            user={user}
            isDeactivated={!!subscription.deactivation}
            onDeactivate={async data => {
              await handleDeactivation(data.date, data.reason)
              setDeactivationPanelOpen(false)
            }}
            onReactivate={async () => {
              await handleReactivation()
              setDeactivationPanelOpen(false)
            }}
            onClose={() => setDeactivationPanelOpen(false)}
          />
        </Modal>
      )}
    </>
  )
}
