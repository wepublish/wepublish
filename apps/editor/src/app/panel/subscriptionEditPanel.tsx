import styled from '@emotion/styled'
import {useEffect, useState} from 'react'
import {useTranslation} from 'react-i18next'
import {MdRequestQuote} from 'react-icons/md'
import {
  Button as RButton,
  DatePicker,
  Drawer,
  FlexboxGrid,
  Form as RForm,
  Message,
  Modal,
  Panel,
  Schema,
  SelectPicker,
  toaster,
  Toggle
} from 'rsuite'
import FormControlLabel from 'rsuite/FormControlLabel'

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
  useUpdateSubscriptionMutation
} from '../api'
import {CurrencyInput} from '../atoms/currencyInput'
import {DescriptionList, DescriptionListItem} from '../atoms/descriptionList'
import {
  createCheckedPermissionComponent,
  PermissionControl,
  useAuthorisation
} from '../atoms/permissionControl'
import {UserSearch} from '../atoms/searchAndFilter/userSearch'
import {toggleRequiredLabel} from '../toggleRequiredLabel'
import {ALL_PAYMENT_PERIODICITIES} from '../utility'
import {InvoiceListPanel} from './invoiceListPanel'
import {UserSubscriptionDeactivatePanel} from './userSubscriptionDeactivatePanel'

const {Group, ControlLabel, Control, HelpText} = RForm

const Form = styled(RForm)`
  height: 100%;
`

const QuoteIcon = styled(MdRequestQuote)`
  margin-right: 10px;
`

const Button = styled(RButton)`
  margin-top: 10px;
`

const GridItem = styled(FlexboxGrid.Item)`
  padding-right: 10px;
`

export interface SubscriptionEditPanelProps {
  id?: string
  onClose?(): void
  onSave?(subscription: FullSubscriptionFragment): void
}

function SubscriptionEditPanel({id, onClose, onSave}: SubscriptionEditPanelProps) {
  const {t} = useTranslation()

  const isAuthorized = useAuthorisation('CAN_CREATE_SUBSCRIPTION')

  const [isDeactivationPanelOpen, setDeactivationPanelOpen] = useState<boolean>(false)
  const [user, setUser] = useState<FullUserFragment | null>()
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

  const {
    data: invoicesData,
    loading: isLoadingInvoices,
    error: loadErrorInvoices,
    refetch: reloadInvoices
  } = useInvoicesQuery({
    variables: {
      take: 100,
      filter: {
        subscriptionID: id
      }
    }
  })

  /**
   * Loading the invoices of the current subscription
   */

  useEffect(() => {
    const tmpInvoices = invoicesData?.invoices?.nodes
    if (tmpInvoices) {
      setInvoices(tmpInvoices)
      // count unpaid invoices
      const unpaidInvoices = tmpInvoices.filter(
        tmpInvoice => !tmpInvoice.paidAt && !tmpInvoice.canceledAt
      )
      setUnpaidInvoices(unpaidInvoices.length)
    }
  }, [invoicesData?.invoices?.nodes])

  useEffect(() => {
    if (data?.subscription) {
      setUser(data.subscription.user)
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
    data: memberPlanData,
    loading: isMemberPlanLoading,
    error: loadMemberPlanError
  } = useMemberPlanListQuery({
    fetchPolicy: 'network-only',
    variables: {
      take: 100 // TODO: Pagination
    }
  })

  const {
    data: paymentMethodData,
    loading: isPaymentMethodLoading,
    error: paymentMethodLoadError
  } = usePaymentMethodListQuery({
    fetchPolicy: 'network-only'
  })

  const [updateSubscription, {loading: isUpdating, error: updateError}] =
    useUpdateSubscriptionMutation()

  const [createSubscription, {loading: isCreating, error: createError}] =
    useCreateSubscriptionMutation()

  const isDeactivated = deactivation?.date ? new Date(deactivation.date) < new Date() : false

  const isDisabled =
    isLoading ||
    isLoadingInvoices ||
    isCreating ||
    isMemberPlanLoading ||
    isUpdating ||
    isPaymentMethodLoading ||
    loadError !== undefined ||
    loadErrorInvoices !== undefined ||
    createError !== undefined ||
    loadMemberPlanError !== undefined ||
    paymentMethodLoadError !== undefined ||
    !isAuthorized

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
      loadErrorInvoices?.message
    if (error)
      toaster.push(
        <Message type="error" showIcon closable duration={0}>
          {error}
        </Message>
      )
  }, [loadError, updateError, loadMemberPlanError, paymentMethodLoadError, loadErrorInvoices])

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
    await reloadInvoices()
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
    await reloadInvoices()
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
      <Group>
        <FormControlLabel>
          {t('userSubscriptionEdit.paidUntil')}

          <RButton appearance="link" onClick={() => setIsInvoiceListOpen(true)}>
            ({t('invoice.seeInvoiceHistory')})
          </RButton>
        </FormControlLabel>

        <DatePicker block value={paidUntil ?? undefined} disabled />
      </Group>
    )
  }

  function subscriptionActionsView() {
    if (!showInvoiceHistory()) {
      return <></>
    }
    return (
      <FlexboxGrid>
        <GridItem>
          <Button color="green" appearance="primary" onClick={() => setIsInvoiceListOpen(true)}>
            <QuoteIcon />
            {t('invoice.panel.invoiceHistory')} ({unpaidInvoices} {t('invoice.unpaid')})
          </Button>
        </GridItem>

        <FlexboxGrid.Item>
          <Button
            appearance="ghost"
            disabled={isDisabled}
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
  return (
    <Form
      onSubmit={validationPassed => validationPassed && handleSave()}
      model={validationModel}
      fluid
      formValue={{
        memberPlan: memberPlan?.name,
        user: user?.name,
        paymentMethod: paymentMethod?.name,
        paymentPeriodicity,
        currency: monthlyAmount
      }}>
      <Drawer.Header>
        <Drawer.Title>
          {id ? t('userSubscriptionEdit.editTitle') : t('userSubscriptionEdit.createTitle')}
        </Drawer.Title>

        <Drawer.Actions>
          <PermissionControl qualifyingPermissions={['CAN_CREATE_SUBSCRIPTION']}>
            <RButton appearance="primary" disabled={isDisabled || isDeactivated} type="submit">
              {id ? t('save') : t('create')}
            </RButton>
          </PermissionControl>
          <RButton appearance={'subtle'} onClick={() => onClose?.()}>
            {t('close')}
          </RButton>
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

        <Panel>
          <Group controlId="memberPlan">
            <ControlLabel>
              {toggleRequiredLabel(t('userSubscriptionEdit.selectMemberPlan'))}
            </ControlLabel>

            <Control
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
              <HelpText>
                <DescriptionList>
                  <DescriptionListItem label={t('userSubscriptionEdit.memberPlanMonthlyAmount')}>
                    {(memberPlan.amountPerMonthMin / 100).toFixed(2)}
                  </DescriptionListItem>
                </DescriptionList>
              </HelpText>
            )}
          </Group>

          <Group controlId="user">
            <ControlLabel>{toggleRequiredLabel(t('userSubscriptionEdit.selectUser'))}</ControlLabel>

            <UserSearch
              name="user"
              user={user}
              onUpdateUser={user => {
                setUser(user)
              }}
            />
          </Group>

          <Group controlId="monthlyAmount">
            <ControlLabel>
              {toggleRequiredLabel(t('userSubscriptionEdit.monthlyAmount'))}
            </ControlLabel>

            <CurrencyInput
              name="currency"
              currency="CHF"
              centAmount={monthlyAmount}
              onChange={centAmount => {
                setMonthlyAmount(centAmount)
              }}
              disabled={isDisabled || hasNoMemberPlanSelected || isDeactivated}
            />
          </Group>

          <Group controlId="paymentPeriodicities">
            <ControlLabel>
              {toggleRequiredLabel(t('memberPlanList.paymentPeriodicities'))}
            </ControlLabel>

            <Control
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
          </Group>

          <Group controlId="autoRenew">
            <ControlLabel>{t('userSubscriptionEdit.autoRenew')}</ControlLabel>

            <Toggle
              checked={autoRenew}
              disabled={isDisabled || hasNoMemberPlanSelected || isDeactivated}
              onChange={value => setAutoRenew(value)}
            />

            <HelpText>{t('userSubscriptionEdit.autoRenewDescription')}</HelpText>
          </Group>

          <Group controlId="startsAt">
            <ControlLabel>{t('userSubscriptionEdit.startsAt')}</ControlLabel>
            <DatePicker
              block
              cleanable={false}
              value={startsAt}
              disabled={isDisabled || hasNoMemberPlanSelected || isDeactivated}
              onChange={value => setStartsAt(value!)}
            />
          </Group>

          {subscriptionActionsViewLink()}

          <Group>
            <FormControlLabel>{t('userSubscriptionEdit.paymentMethod')}</FormControlLabel>
          </Group>

          <Group controlId="paidUntil">
            <ControlLabel>{t('userSubscriptionEdit.paidUntil')}</ControlLabel>
            <DatePicker block value={paidUntil ?? undefined} disabled />
          </Group>

          <Group controlId="paymentMethod">
            <ControlLabel>
              {toggleRequiredLabel(t('userSubscriptionEdit.paymentMethod'))}
            </ControlLabel>

            <Control
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
              placement="auto"
            />
          </Group>
        </Panel>
        <Panel>{subscriptionActionsView()}</Panel>
      </Drawer.Body>

      <Drawer.Footer>
        <PermissionControl qualifyingPermissions={['CAN_CREATE_SUBSCRIPTION']}>
          <RButton
            appearance={'primary'}
            disabled={isDisabled || isDeactivated}
            onClick={() => handleSave()}>
            {id ? t('save') : t('create')}
          </RButton>
        </PermissionControl>
        <RButton appearance={'subtle'} onClick={() => onClose?.()}>
          {t('close')}
        </RButton>
      </Drawer.Footer>

      <Drawer open={isInvoiceListOpen} size="sm" onClose={() => setIsInvoiceListOpen(false)}>
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
          size="sm"
          backdrop={'static'}
          keyboard={false}
          onClose={() => setDeactivationPanelOpen(false)}>
          <UserSubscriptionDeactivatePanel
            displayName={user.preferredName || user.name || user.email}
            userEmail={user.email}
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
    </Form>
  )
}
const CheckedPermissionComponent = createCheckedPermissionComponent([
  'CAN_GET_SUBSCRIPTION',
  'CAN_GET_SUBSCRIPTIONS',
  'CAN_CREATE_SUBSCRIPTION',
  'CAN_DELETE_SUBSCRIPTION'
])(SubscriptionEditPanel)
export {CheckedPermissionComponent as SubscriptionEditPanel}
