import React, {useEffect, useRef, useState} from 'react'

import {
  toaster,
  Button,
  DatePicker,
  Drawer,
  FlexboxGrid,
  Form,
  Message,
  Modal,
  Panel,
  Schema,
  SelectPicker,
  Toggle
} from 'rsuite'

import {
  DeactivationFragment,
  FullMemberPlanFragment,
  FullPaymentMethodFragment,
  FullSubscriptionFragment,
  FullUserFragment,
  InvoiceFragment,
  MetadataPropertyFragment,
  PaymentPeriodicity,
  SubscriptionDeactivationReason,
  useCreateSubscriptionMutation,
  useInvoicesQuery,
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
import {FormInstance} from 'rsuite/esm/Form'
import {InvoiceListPanel} from './invoiceListPanel'
import FormControlLabel from 'rsuite/FormControlLabel'
import FileIcon from '@rsuite/icons/legacy/File'

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

  const [isInvoiceListOpen, setIsInvoiceListOpen] = useState<boolean>(false)
  const [invoices, setInvoices] = useState<InvoiceFragment[] | undefined>(undefined)
  const [unpaidInvoices, setUnpaidInvoices] = useState<number | undefined>(undefined)

  /**
   * Loading the subscription
   */
  const {
    data,
    loading: isLoading,
    error: loadError,
    refetch: reloadSubscription
  } = useSubscriptionQuery({
    variables: {id: id!},
    fetchPolicy: 'network-only',
    skip: id === undefined
  })

  /**
   * Loading the invoices of the current subscription
   */
  const {data: invoicesData} = useInvoicesQuery({
    variables: {
      first: 100,
      filter: {
        subscriptionID: id
      }
    }
  })

  useEffect(() => {
    const tmpInvoices = invoicesData?.invoices?.nodes
    if (tmpInvoices) {
      setInvoices(tmpInvoices)
      // count unpaid invoices
      const unpaidInvoices = tmpInvoices.filter(tmpInvoice => !tmpInvoice.paidAt)
      setUnpaidInvoices(unpaidInvoices.length)
    }
  }, [invoicesData?.invoices?.nodes])

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
      first: 100
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

  const form = useRef<FormInstance>(null)
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
    if (!form.current?.check?.()) {
      return
    }
    if (!memberPlan) return
    if (!paymentMethod) return
    if (!user) return

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

  // Schema used for form validation --- reference custom field for validation
  const {StringType, NumberType} = Schema.Types
  const validationModel = Schema.Model({
    memberPlan: StringType().isRequired(t('errorMessages.noMemberPlanErrorMessage')),
    user: StringType().isRequired(t('errorMessages.noUserErrorMessage')),
    currency: NumberType().isRequired(t('errorMessages.noAmountErrorMessage')),
    paymentPeriodicity: StringType().isRequired(
      t('errorMessages.noPaymentPeriodicityErrorMessage')
    ),
    paymentMethod: StringType().isRequired(t('errorMessages.noPaymentMethodErrorMessage'))
  })
  /**
   * UI helper functions
   */
  function showInvoiceHistory(): boolean {
    return !!(id && paymentMethod && memberPlan)
  }

  function subscriptionActionsViewLink() {
    if (!showInvoiceHistory()) {
      return <></>
    }
    return (
      <Form.Group>
        <FormControlLabel>
          {t('userSubscriptionEdit.payedUntil')}
          <Button appearance="link" onClick={() => setIsInvoiceListOpen(true)}>
            ({t('invoice.seeInvoiceHistory')})
          </Button>
        </FormControlLabel>
        <DatePicker block value={paidUntil ?? undefined} disabled />
      </Form.Group>
    )
  }

  function subscriptionActionsView() {
    if (!showInvoiceHistory()) {
      return <></>
    }
    return (
      <FlexboxGrid>
        <FlexboxGrid.Item style={{paddingRight: '10px'}}>
          <Button color="green" appearance="primary" onClick={() => setIsInvoiceListOpen(true)}>
            <FileIcon style={{marginRight: '10px'}} />
            {t('invoice.panel.invoiceHistory')} ({unpaidInvoices} {t('invoice.unpaid')})
          </Button>
        </FlexboxGrid.Item>
        <FlexboxGrid.Item>
          <Button
            appearance="ghost"
            disabled={isDisabled}
            style={{marginTop: '10px'}}
            onClick={() => setDeactivationPanelOpen(true)}>
            {t(
              deactivation
                ? 'userSubscriptionEdit.deactivation.title.deactivated'
                : 'userSubscriptionEdit.deactivation.title.activated'
            )}
          </Button>
        </FlexboxGrid.Item>
      </FlexboxGrid>
    )
  }

  /**
   * UI helper to provide a meaningful user labeling.
   * @param user
   */
  function getUserLabel(user: FullUserFragment | null | undefined): string {
    if (!user) return ''
    let userLabel = ''
    if (user.firstName) userLabel += `${user.firstName} `
    if (user.name) userLabel += `${user.name} `
    if (user.preferredName) userLabel += `(${user.preferredName}) `
    if (user.email) userLabel += `| ${user.email} `
    if (user.address?.streetAddress) userLabel += `| ${user.address.streetAddress} `
    if (user.address?.zipCode) userLabel += `| ${user.address.zipCode} `
    if (user.address?.city) userLabel += `| ${user.address.city} `
    return userLabel
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
          <Form
            ref={form}
            model={validationModel}
            fluid
            formValue={{
              memberPlan: memberPlan?.name,
              user: user?.name,
              paymentMethod: paymentMethod?.name,
              paymentPeriodicity: paymentPeriodicity,
              currency: monthlyAmount
            }}>
            <Form.Group>
              <Form.ControlLabel>
                {t('userSubscriptionEdit.selectMemberPlan') + '*'}
              </Form.ControlLabel>
              <Form.Control
                block
                name="memberPlan"
                virtualized
                disabled={isDisabled || isDeactivated}
                data={memberPlans.map(mp => ({value: mp.id, label: mp.name}))}
                value={memberPlan?.id}
                onChange={(value: any) => setMemberPlan(memberPlans.find(mp => mp.id === value))}
                accepter={SelectPicker}
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
              <Form.ControlLabel>{t('userSubscriptionEdit.selectUser') + '*'}</Form.ControlLabel>
              <Form.Control
                block
                name="user"
                virtualized
                disabled={isDisabled || isDeactivated}
                data={users.map(usr => ({value: usr?.id, label: getUserLabel(usr)}))}
                value={user?.id}
                onChange={(value: any) => setUser(users.find(usr => usr?.id === value))}
                onSearch={(searchString: React.SetStateAction<string>) => {
                  setUserSearch(searchString)
                  refetchUsers()
                }}
                accepter={SelectPicker}
              />
            </Form.Group>
            <Form.Group>
              <Form.ControlLabel>{t('userSubscriptionEdit.monthlyAmount') + '*'}</Form.ControlLabel>
              <CurrencyInput
                name="currency"
                currency="CHF"
                centAmount={monthlyAmount}
                onChange={centAmount => {
                  setMonthlyAmount(centAmount)
                }}
                disabled={isDisabled || hasNoMemberPlanSelected || isDeactivated}
              />
            </Form.Group>
            <Form.Group>
              <Form.ControlLabel>
                {t('memberPlanList.paymentPeriodicities') + '*'}
              </Form.ControlLabel>
              <Form.Control
                virtualized
                value={paymentPeriodicity}
                name="paymentPeriodicity"
                data={ALL_PAYMENT_PERIODICITIES.map(pp => ({
                  value: pp,
                  label: t(`memberPlanList.paymentPeriodicity.${pp}`)
                }))}
                disabled={isDisabled || hasNoMemberPlanSelected || isDeactivated}
                onChange={(value: any) => setPaymentPeriodicity(value)}
                block
                accepter={SelectPicker}
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
                cleanable={false}
                value={startsAt}
                disabled={isDisabled || hasNoMemberPlanSelected || isDeactivated}
                onChange={value => setStartsAt(value!)}
              />
            </Form.Group>
            {subscriptionActionsViewLink()}
            <Form.Group>
              <FormControlLabel>{t('userSubscriptionEdit.paymentMethod')}</FormControlLabel>
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
              <Form.Control
                name="paymentMethod"
                block
                virtualized
                disabled={isDisabled || hasNoMemberPlanSelected || isDeactivated}
                data={paymentMethods.map(pm => ({value: pm.id, label: pm.name}))}
                value={paymentMethod?.id}
                onChange={(value: any) =>
                  setPaymentMethod(paymentMethods.find(pm => pm.id === value))
                }
                accepter={SelectPicker}
              />
            </Form.Group>
          </Form>
        </Panel>
        <Panel>{subscriptionActionsView()}</Panel>
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

      <Drawer open={isInvoiceListOpen} size={'sm'} onClose={() => setIsInvoiceListOpen(false)}>
        <InvoiceListPanel
          subscriptionId={id}
          invoices={invoices}
          disabled={!!deactivation}
          onClose={() => setIsInvoiceListOpen(false)}
          onInvoicePaid={() => reloadSubscription()}
        />
      </Drawer>

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
