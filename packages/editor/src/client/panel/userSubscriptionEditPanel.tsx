import React, {useState, useEffect} from 'react'

import {
  Panel,
  PanelHeader,
  NavigationButton,
  PanelSection,
  TextInput,
  Box,
  Spacing,
  Toast,
  Typography,
  Select,
  Toggle,
  PanelSectionHeader,
  DescriptionList,
  DescriptionListItem
} from '@karma.run/ui'

import 'react-datepicker/dist/react-datepicker.css'
import DatePicker from 'react-datepicker'

import {MaterialIconClose, MaterialIconSaveOutlined} from '@karma.run/icons'

import {
  useUpdateUserSubscriptionMutation,
  FullUserSubscriptionFragment,
  useMemberPlanListQuery,
  FullMemberPlanFragment
} from '../api'

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
  const [memberPlan, setMemberPlan] = useState(subscription?.memberPlan)
  const [memberPlans, setMemberPlans] = useState<FullMemberPlanFragment[]>([])
  const [paymentPeriodicity, setPaymentPeriodicity] = useState(
    subscription?.paymentPeriodicity ?? 'monthly'
  ) //TODO: find smart default
  const [monthlyAmount, setMonthlyAmount] = useState(subscription?.monthlyAmount ?? 0)
  const [autoRenew, setAutoRenew] = useState(subscription?.autoRenew ?? false)
  const [startsAt, setStartsAt] = useState<Date>(
    subscription ? new Date(subscription.startsAt) : new Date()
  )
  const [payedUntil, setPayedUntil] = useState(
    subscription ? new Date(subscription.payedUntil) : new Date()
  )
  const [paymentMethod, setPaymentMethod] = useState(subscription?.paymentMethod ?? 'CC') //TODO: find smart default
  const [deactivatedAt, setDeactivatedAt] = useState(
    subscription?.deactivatedAt ? new Date(subscription.deactivatedAt) : null
  )

  const [isErrorToastOpen, setErrorToastOpen] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string>()

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

  const [
    updateUserSubscription,
    {loading: isUpdating, error: updateError}
  ] = useUpdateUserSubscriptionMutation()

  const isDisabled = isMemberPlanLoading || isUpdating || loadMemberPlanError != undefined

  const hasNoMemberPlanSelected = memberPlan === undefined

  useEffect(() => {
    if (memberPlanData?.memberPlans?.nodes) {
      setMemberPlans(memberPlanData.memberPlans.nodes)
    }
  }, [memberPlanData?.memberPlans])

  useEffect(() => {
    if (updateError) {
      setErrorToastOpen(true)
      setErrorMessage(updateError.message)
    } else if (loadMemberPlanError) {
      setErrorToastOpen(true)
      setErrorMessage(loadMemberPlanError.message)
    }
  }, [updateError, loadMemberPlanError])

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
      <Panel>
        <PanelHeader
          title={subscription ? 'Edit Subscription' : 'Create Subscription'}
          leftChildren={
            <NavigationButton icon={MaterialIconClose} label="Close" onClick={() => onClose?.()} />
          }
          rightChildren={
            <NavigationButton
              icon={MaterialIconSaveOutlined}
              label={subscription ? 'Save' : 'Create'}
              disabled={isDisabled}
              onClick={handleSave}
            />
          }
        />

        <PanelSectionHeader title="Member Plan" />
        <PanelSection>
          <Box>
            <Select
              options={memberPlans}
              description={'Choose a Member Plan'}
              disabled={isDisabled}
              value={memberPlans.find(mPlan => mPlan.id === memberPlan?.id)}
              renderListItem={value => value.label}
              onChange={value => setMemberPlan(value)}
            />
          </Box>
          {memberPlan && (
            <Box marginTop={Spacing.ExtraSmall}>
              <DescriptionList>
                <DescriptionListItem label="Monthly Amount (CHF)">
                  {memberPlan.pricePerMonthMinimum}{' '}
                  {memberPlan.pricePerMonthMinimum !== memberPlan.pricePerMonthMaximum
                    ? `- ${memberPlan.pricePerMonthMaximum}`
                    : ''}
                </DescriptionListItem>
                <DescriptionListItem label="Force Auto Renewal">
                  {memberPlan.forceAutoRenewal ? 'Yes' : 'No'}
                </DescriptionListItem>
              </DescriptionList>
            </Box>
          )}
        </PanelSection>
        <PanelSectionHeader title="Subscription" />
        {memberPlan?.availablePaymentPeriodicity && (
          <PanelSection>
            <Box marginBottom={Spacing.ExtraSmall}>
              <Select
                label="Payment Periodicity"
                options={memberPlan.availablePaymentPeriodicity}
                value={memberPlan.availablePaymentPeriodicity.find(
                  app => app.id === paymentPeriodicity
                )}
                renderListItem={value =>
                  `${value?.id} ${value?.checked ? '- (Enabled in MemberPlan)' : ''}`
                }
                onChange={value => (value ? setPaymentPeriodicity(value.id) : paymentPeriodicity)}
                marginBottom={Spacing.Small}
              />
            </Box>
            <Box marginBottom={Spacing.ExtraSmall}>
              <TextInput
                label="Monthly amount"
                type="number"
                value={monthlyAmount}
                disabled={isDisabled || hasNoMemberPlanSelected}
                onChange={e => {
                  setMonthlyAmount(parseInt(e.target.value))
                }}
              />
            </Box>
            <Box marginBottom={Spacing.ExtraSmall}>
              <Toggle
                label="Auto Renew"
                description="Renew the subscription automatically"
                checked={autoRenew}
                disabled={isDisabled || hasNoMemberPlanSelected}
                onChange={event => setAutoRenew(event.target.checked)}
              />
            </Box>
            <Box marginBottom={Spacing.ExtraSmall}>
              <Typography variant="body1">Subscription Start</Typography>
              <DatePicker
                selected={startsAt}
                disabled={isDisabled || hasNoMemberPlanSelected}
                onChange={date => setStartsAt(date as Date)}
              />
            </Box>
            <Box marginBottom={Spacing.ExtraSmall}>
              <Typography variant="body1">Payed Until</Typography>
              <DatePicker
                selected={payedUntil}
                disabled={isDisabled || hasNoMemberPlanSelected}
                onChange={date => setPayedUntil(date as Date)}
              />
            </Box>
            <Box marginBottom={Spacing.ExtraSmall}>
              <TextInput
                label="Payment Method"
                value={paymentMethod}
                disabled={isDisabled || hasNoMemberPlanSelected}
                onChange={e => {
                  setPaymentMethod(e.target.value)
                }}
              />
            </Box>
            <Box marginBottom={Spacing.ExtraSmall}>
              <Typography variant="body1">Deactivated</Typography>
              <DatePicker
                selected={deactivatedAt}
                disabled={isDisabled || hasNoMemberPlanSelected}
                onChange={date => setDeactivatedAt(date as Date)}
              />
            </Box>
          </PanelSection>
        )}
      </Panel>
      <Toast
        type="error"
        open={isErrorToastOpen}
        autoHideDuration={5000}
        onClose={() => setErrorToastOpen(false)}>
        {errorMessage}
      </Toast>
    </>
  )
}
