import React, {useEffect, useState} from 'react'

import {
  toaster,
  Button,
  DatePicker,
  Drawer,
  Form,
  Message,
  Modal,
  Panel,
  SelectPicker,
  Toggle
} from 'rsuite'

import {
  DeactivationFragment,
  FullMemberPlanFragment,
  FullPaymentMethodFragment,
  FullSubscriptionFragment,
  FullUserFragment,
  MetadataPropertyFragment,
  PaymentPeriodicity,
  SubscriptionDeactivationReason,
  useCreateSubscriptionMutation,
  useMemberPlanListQuery,
  usePaymentMethodListQuery,
  useSubscriptionQuery,
  useUpdateSubscriptionMutation,
  useUserListQuery
} from '../api'
import {useTranslation} from 'react-i18next'
import {DescriptionList, DescriptionListItem} from '../atoms/descriptionList'
import {ALL_PAYMENT_PERIODICITIES, isTempUser as checkIsTempUser} from '../utility'
import {UserSubscriptionDeactivatePanel} from './userSubscriptionDeactivatePanel'
import {CurrencyInput} from '../atoms/currencyInput'

export interface SubscriptionEditPanelProps {
  id?: string

  onClose?(): void
  onSave?(subscription: FullSubscriptionFragment): void
}

export function SubscriptionEditPanel({id, onClose, onSave}: SubscriptionEditPanelProps) {
  const {t} = useTranslation()

  const [isDeactivationPanelOpen, setDeactivationPanelOpen] = useState<boolean>(false)

  const [user, setUser] = useState<FullUserFragment | null>()
  const [isTempUser, setIsTempUser] = useState<boolean>()
  const [memberPlan, setMemberPlan] = useState<FullMemberPlanFragment>()
  const [paymentPeriodicity, setPaymentPeriodicity] = useState<PaymentPeriodicity>(
    PaymentPeriodicity.Yearly
  )
  const [monthlyAmount, setMonthlyAmount] = useState<number>(500)
  const [autoRenew, setAutoRenew] = useState<boolean>(false)
  const [startsAt, setStartsAt] = useState<Date>(new Date())
  const [paidUntil, setPaidUntil] = useState<Date | null>()
  const [paymentMethod, setPaymentMethod] = useState<FullPaymentMethodFragment>()
  const [properties, setProperties] = useState<MetadataPropertyFragment[]>([])
  const [deactivation, setDeactivation] = useState<DeactivationFragment | null>()

  const [userSearch, setUserSearch] = useState<string>('')
  const [users, setUsers] = useState<(FullUserFragment | undefined | null)[]>([])
  const [memberPlans, setMemberPlans] = useState<FullMemberPlanFragment[]>([])
  const [paymentMethods, setPaymentMethods] = useState<FullPaymentMethodFragment[]>([])

  const {data, loading: isLoading, error: loadError} = useSubscriptionQuery({
    variables: {id: id!},
    fetchPolicy: 'network-only',
    skip: id === undefined
  })

  useEffect(() => {
    if (data?.subscription) {
      setUser(data.subscription.user)
      setIsTempUser(checkIsTempUser(data.subscription.user?.id))
      setUsers([
        ...users.filter(user => user?.id !== data.subscription?.user?.id),
        data.subscription.user
      ])
      setMemberPlan(data.subscription.memberPlan)
      setPaymentPeriodicity(data.subscription.paymentPeriodicity)
      setMonthlyAmount(data.subscription.monthlyAmount)
      setAutoRenew(data.subscription.autoRenew)
      setStartsAt(new Date(data.subscription.startsAt))
      setPaidUntil(data.subscription.paidUntil ? new Date(data.subscription.paidUntil) : null)
      setPaymentMethod(data.subscription.paymentMethod)
      setProperties(
        data.subscription.properties.map(({key, value, public: isPublic}) => ({
          key,
          value,
          public: isPublic
        }))
      )
      setDeactivation(data.subscription.deactivation)
    }
  }, [data?.subscription])

  const {
    data: userData,
    loading: isUserLoading,
    error: userLoadError,
    refetch: refetchUsers
  } = useUserListQuery({
    variables: {
      first: 100,
      filter: userSearch
    },
    fetchPolicy: 'network-only'
  })

  useEffect(() => {
    if (userData?.users) {
      const userList = [...userData.users.nodes.filter(usr => usr.id !== user?.id)]
      if (user) userList.push(user)
      setUsers(userList)
    }
  }, [userData?.users])

  useEffect(() => {
    if (user) {
      setIsTempUser(checkIsTempUser(user.id))
    }
  }, [user])

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
    updateSubscription,
    {loading: isUpdating, error: updateError}
  ] = useUpdateSubscriptionMutation()

  const [
    createSubscription,
    {loading: isCreating, error: createError}
  ] = useCreateSubscriptionMutation()

  const isDeactivated = deactivation?.date ? new Date(deactivation.date) < new Date() : false

  const isDisabled =
    isLoading ||
    isCreating ||
    isMemberPlanLoading ||
    isUpdating ||
    isPaymentMethodLoading ||
    isUserLoading ||
    loadError !== undefined ||
    createError !== undefined ||
    loadMemberPlanError !== undefined ||
    paymentMethodLoadError !== undefined ||
    userLoadError !== undefined ||
    isTempUser

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
      loadError?.message ??
      loadMemberPlanError?.message ??
      updateError?.message ??
      paymentMethodLoadError?.message ??
      userLoadError?.message
    if (error)
      toaster.push(
        <Message type="error" showIcon closable duration={0}>
          {error}
        </Message>
      )
  }, [loadError, updateError, loadMemberPlanError, paymentMethodLoadError, userLoadError])

  async function handleSave() {
    if (!memberPlan) return
    if (!paymentMethod) return
    if (!user) return
    // TODO: show error

    if (id) {
      const {data} = await updateSubscription({
        variables: {
          id,
          input: {
            userID: user?.id,
            memberPlanID: memberPlan.id,
            monthlyAmount,
            paymentPeriodicity,
            autoRenew,
            startsAt: startsAt.toISOString(),
            paidUntil: paidUntil ? paidUntil.toISOString() : null,
            paymentMethodID: paymentMethod.id,
            properties,
            deactivation
          }
        }
      })

      if (data?.updateSubscription) onSave?.(data.updateSubscription)
    } else {
      const {data} = await createSubscription({
        variables: {
          input: {
            userID: user.id,
            memberPlanID: memberPlan.id,
            monthlyAmount,
            paymentPeriodicity,
            autoRenew,
            startsAt: startsAt.toISOString(),
            paidUntil: paidUntil ? paidUntil.toISOString() : null,
            paymentMethodID: paymentMethod.id,
            properties,
            deactivation
          }
        }
      })

      if (data?.createSubscription) onSave?.(data.createSubscription)
    }
  }
  async function handleDeactivation(date: Date, reason: SubscriptionDeactivationReason) {
    if (!id || !memberPlan || !paymentMethod || !user?.id) return
    const {data} = await updateSubscription({
      variables: {
        id,
        input: {
          userID: user.id,
          memberPlanID: memberPlan.id,
          monthlyAmount,
          paymentPeriodicity,
          autoRenew,
          startsAt: startsAt.toISOString(),
          paidUntil: paidUntil ? paidUntil.toISOString() : null,
          paymentMethodID: paymentMethod.id,
          properties,
          deactivation: {
            reason,
            date: date.toISOString()
          }
        }
      }
    })

    if (data?.updateSubscription) {
      setDeactivation(data.updateSubscription.deactivation)
    }
  }

  async function handleReactivation() {
    if (!id || !memberPlan || !paymentMethod || !user?.id) return
    const {data} = await updateSubscription({
      variables: {
        id,
        input: {
          userID: user.id,
          memberPlanID: memberPlan.id,
          monthlyAmount,
          paymentPeriodicity,
          autoRenew,
          startsAt: startsAt.toISOString(),
          paidUntil: paidUntil ? paidUntil.toISOString() : null,
          paymentMethodID: paymentMethod.id,
          properties,
          deactivation: null
        }
      }
    })

    if (data?.updateSubscription) {
      setDeactivation(data.updateSubscription.deactivation)
    }
  }

  return (
    <>
      <Drawer.Header>
        <Drawer.Title>
          {id ? t('userSubscriptionEdit.editTitle') : t('userSubscriptionEdit.createTitle')}
        </Drawer.Title>

        <Drawer.Actions>
          <Button
            appearance={'primary'}
            disabled={isDisabled || isDeactivated}
            onClick={() => handleSave()}>
            {id ? t('save') : t('create')}
          </Button>
          <Button appearance={'subtle'} onClick={() => onClose?.()}>
            {t('close')}
          </Button>
        </Drawer.Actions>
      </Drawer.Header>

      <Drawer.Body>
        {deactivation && (
          <Message showIcon type="info">
            {t(
              new Date(deactivation.date) < new Date()
                ? 'userSubscriptionEdit.deactivation.isDeactivated'
                : 'userSubscriptionEdit.deactivation.willBeDeactivated',
              {date: new Date(deactivation.date)}
            )}
          </Message>
        )}
        {isTempUser && (
          <Message showIcon type="info">
            <div>
              <p>{t('userSubscriptionEdit.tempUser.disabledInfo')}</p>
              <br />
              <p>
                <b>{t('userSubscriptionEdit.tempUserTitle')}</b>
              </p>
              <p>
                {user?.firstName} {user?.name}
              </p>
              <p>{user?.address?.streetAddress}</p>
              <p>
                {user?.address?.zipCode} {user?.address?.city}
              </p>
              <p>{user?.address?.country}</p>
              <p>{user?.email}</p>
            </div>
          </Message>
        )}

        <Panel>
          <Form fluid={true}>
            <Form.Group>
              <Form.ControlLabel>{t('userSubscriptionEdit.selectMemberPlan')}</Form.ControlLabel>
              <SelectPicker
                block
                virtualized
                disabled={isDisabled || isDeactivated}
                data={memberPlans.map(mp => ({value: mp.id, label: mp.name}))}
                value={memberPlan?.id}
                onChange={value => setMemberPlan(memberPlans.find(mp => mp.id === value))}
              />
              {memberPlan && (
                <Form.HelpText>
                  <DescriptionList>
                    <DescriptionListItem label={t('userSubscriptionEdit.memberPlanMonthlyAmount')}>
                      {(memberPlan.amountPerMonthMin / 100).toFixed(2)}
                    </DescriptionListItem>
                  </DescriptionList>
                </Form.HelpText>
              )}
            </Form.Group>
            <Form.Group>
              <Form.ControlLabel>{t('userSubscriptionEdit.selectUser')}</Form.ControlLabel>
              <SelectPicker
                block
                virtualized
                disabled={isDisabled || isDeactivated}
                data={users.map(usr => ({value: usr?.id, label: usr?.name}))}
                value={user?.id}
                onChange={value => setUser(users.find(usr => usr?.id === value))}
                onSearch={searchString => {
                  setUserSearch(searchString)
                  refetchUsers()
                }}
              />
            </Form.Group>
            <Form.Group>
              <Form.ControlLabel>{t('userSubscriptionEdit.monthlyAmount')}</Form.ControlLabel>
              <CurrencyInput
                currency="CHF"
                centAmount={monthlyAmount}
                onChange={centAmount => {
                  setMonthlyAmount(centAmount)
                }}
                disabled={isDisabled || hasNoMemberPlanSelected || isDeactivated}
              />
            </Form.Group>
            <Form.Group>
              <Form.ControlLabel>{t('memberPlanList.paymentPeriodicities')}</Form.ControlLabel>
              <SelectPicker
                virtualized
                value={paymentPeriodicity}
                data={ALL_PAYMENT_PERIODICITIES.map(pp => ({
                  value: pp,
                  label: t(`memberPlanList.paymentPeriodicity.${pp}`)
                }))}
                disabled={isDisabled || hasNoMemberPlanSelected || isDeactivated}
                onChange={value => setPaymentPeriodicity(value)}
                block
              />
            </Form.Group>
            <Form.Group>
              <Form.ControlLabel>{t('userSubscriptionEdit.autoRenew')}</Form.ControlLabel>
              <Toggle
                checked={autoRenew}
                disabled={isDisabled || hasNoMemberPlanSelected || isDeactivated}
                onChange={value => setAutoRenew(value)}
              />
              <Form.HelpText>{t('userSubscriptionEdit.autoRenewDescription')}</Form.HelpText>
            </Form.Group>
            <Form.Group>
              <Form.ControlLabel>{t('userSubscriptionEdit.startsAt')}</Form.ControlLabel>
              <DatePicker
                block
                value={startsAt}
                disabled={isDisabled || hasNoMemberPlanSelected || isDeactivated}
                onChange={value => setStartsAt(value!)}
              />
            </Form.Group>
            <Form.Group>
              <Form.ControlLabel>{t('userSubscriptionEdit.payedUntil')}</Form.ControlLabel>
              <DatePicker
                block
                value={paidUntil ?? undefined}
                disabled={true /* TODO fix this */}
              />
            </Form.Group>
            <Form.Group>
              <Form.ControlLabel>{t('userSubscriptionEdit.paymentMethod')}</Form.ControlLabel>
              <SelectPicker
                block
                virtualized
                disabled={isDisabled || hasNoMemberPlanSelected || isDeactivated}
                data={paymentMethods.map(pm => ({value: pm.id, label: pm.name}))}
                value={paymentMethod?.id}
                onChange={value => setPaymentMethod(paymentMethods.find(pm => pm.id === value))}
              />
            </Form.Group>
          </Form>
        </Panel>
        {paymentMethod && memberPlan && (
          <Panel>
            <Button
              appearance={'primary'}
              disabled={isDisabled}
              onClick={() => setDeactivationPanelOpen(true)}>
              {t(
                deactivation
                  ? 'userSubscriptionEdit.deactivation.title.deactivated'
                  : 'userSubscriptionEdit.deactivation.title.activated'
              )}
            </Button>
          </Panel>
        )}
      </Drawer.Body>

      {id && user && (
        <Modal
          open={isDeactivationPanelOpen}
          size={'sm'}
          backdrop={'static'}
          keyboard={false}
          onClose={() => setDeactivationPanelOpen(false)}>
          <UserSubscriptionDeactivatePanel
            displayName={user.preferredName || user.name || user.email}
            paidUntil={paidUntil ?? undefined}
            isDeactivated={!!deactivation}
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
