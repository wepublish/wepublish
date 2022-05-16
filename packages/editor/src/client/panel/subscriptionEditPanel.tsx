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
    if (error) Alert.error(error, 0)
  }, [loadError, updateError, loadMemberPlanError, paymentMethodLoadError, userLoadError])

  const inputBase = {
    monthlyAmount,
    paymentPeriodicity,
    autoRenew,
    startsAt: startsAt.toISOString(),
    paidUntil: paidUntil ? paidUntil.toISOString() : null,
    properties,
    deactivation
  }

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
            ...inputBase,
            userID: user?.id,
            paymentMethodID: paymentMethod.id,
            memberPlanID: memberPlan.id
          }
        }
      })

      if (data?.updateSubscription) onSave?.(data.updateSubscription)
    } else {
      const {data} = await createSubscription({
        variables: {
          input: {
            ...inputBase,
            userID: user.id,
            paymentMethodID: paymentMethod.id,
            memberPlanID: memberPlan.id
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
          ...inputBase,
          userID: user.id,
          deactivation: {
            reason,
            date: date.toISOString()
          },
          paymentMethodID: paymentMethod.id,
          memberPlanID: memberPlan.id
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
          ...inputBase,
          userID: user.id,
          memberPlanID: memberPlan.id,
          paymentMethodID: paymentMethod.id,
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
      </Drawer.Header>

      <Drawer.Body>
        {deactivation && (
          <Message
            showIcon
            type="info"
            description={t(
              new Date(deactivation.date) < new Date()
                ? 'userSubscriptionEdit.deactivation.isDeactivated'
                : 'userSubscriptionEdit.deactivation.willBeDeactivated',
              {date: new Date(deactivation.date)}
            )}
          />
        )}
        {isTempUser && (
          <Message
            showIcon
            type="info"
            description={
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
            }
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
                value={memberPlan?.id}
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
              <ControlLabel>{t('userSubscriptionEdit.selectUser')}</ControlLabel>
              <SelectPicker
                block
                disabled={isDisabled || isDeactivated}
                data={users.map(usr => ({value: usr?.id, label: usr?.name}))}
                value={user?.id}
                onChange={value => setUser(users.find(usr => usr?.id === value))}
                onSearch={searchString => {
                  setUserSearch(searchString)
                  refetchUsers()
                }}
              />
            </FormGroup>
            <FormGroup>
              <ControlLabel>{t('userSubscriptionEdit.monthlyAmount')}</ControlLabel>
              <CurrencyInput
                currency="CHF"
                centAmount={monthlyAmount}
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
                cleanable={false}
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
                value={paymentMethod?.id}
                onChange={value => setPaymentMethod(paymentMethods.find(pm => pm.id === value))}
              />
            </FormGroup>
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

      <Drawer.Footer>
        <Button
          appearance={'primary'}
          disabled={isDisabled || isDeactivated}
          onClick={() => handleSave()}>
          {id ? t('save') : t('create')}
        </Button>
        <Button appearance={'subtle'} onClick={() => onClose?.()}>
          {t('close')}
        </Button>
      </Drawer.Footer>

      {id && user && (
        <Modal
          show={isDeactivationPanelOpen}
          size={'sm'}
          backdrop={'static'}
          keyboard={false}
          onHide={() => setDeactivationPanelOpen(false)}>
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
