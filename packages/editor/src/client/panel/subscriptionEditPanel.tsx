import FileIcon from '@rsuite/icons/legacy/File'
import React, {useEffect, useState} from 'react'
import {useTranslation} from 'react-i18next'
import {
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
import {UserSearch} from '../atoms/searchAndFilter/userSearch'
import {toggleRequiredLabel} from '../toggleRequiredLabel'
import {ALL_PAYMENT_PERIODICITIES} from '../utility'
import {InvoiceListPanel} from './invoiceListPanel'
import {UserSubscriptionDeactivatePanel} from './userSubscriptionDeactivatePanel'

export interface SubscriptionEditPanelProps {
  id?: string
  onClose?(): void
  onSave?(subscription: FullSubscriptionFragment): void
}

export function SubscriptionEditPanel({id, onClose, onSave}: SubscriptionEditPanelProps) {
  const {t} = useTranslation()

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
    loadError !== undefined ||
    createError !== undefined ||
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
      loadError?.message ??
      loadMemberPlanError?.message ??
      updateError?.message ??
      paymentMethodLoadError?.message
    if (error)
      toaster.push(
        <Message type="error" showIcon closable duration={0}>
          {error}
        </Message>
      )
  }, [loadError, updateError, loadMemberPlanError, paymentMethodLoadError])

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
          <Button
            color="green"
            appearance="primary"
            onClick={() => setIsInvoiceListOpen(true)}
            style={{marginTop: '10px'}}>
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

  return (
    <>
      <Form
        onSubmit={validationPassed => validationPassed && handleSave()}
        model={validationModel}
        fluid
        style={{height: '100%'}}
        formValue={{
          memberPlan: memberPlan?.name,
          user: user?.name,
          paymentMethod: paymentMethod?.name,
          paymentPeriodicity: paymentPeriodicity,
          currency: monthlyAmount
        }}>
        <Drawer.Header>
          <Drawer.Title>
            {id ? t('userSubscriptionEdit.editTitle') : t('userSubscriptionEdit.createTitle')}
          </Drawer.Title>

          <Drawer.Actions>
            <Button appearance="primary" disabled={isDisabled || isDeactivated} type="submit">
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

          <Panel>
            <Form.Group>
              <Form.ControlLabel>
                {toggleRequiredLabel(t('userSubscriptionEdit.selectMemberPlan'))}
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
              <Form.ControlLabel>
                {toggleRequiredLabel(t('userSubscriptionEdit.selectUser'))}
              </Form.ControlLabel>

              <UserSearch
                name="user"
                user={user}
                onUpdateUser={user => {
                  setUser(user)
                }}
              />
            </Form.Group>

            <Form.Group>
              <Form.ControlLabel>
                {toggleRequiredLabel(t('userSubscriptionEdit.monthlyAmount'))}
              </Form.ControlLabel>

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
                {toggleRequiredLabel(t('memberPlanList.paymentPeriodicities'))}
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
              <DatePicker block value={paidUntil ?? undefined} disabled />
            </Form.Group>

            <Form.Group>
              <Form.ControlLabel>
                {toggleRequiredLabel(t('userSubscriptionEdit.paymentMethod'))}
              </Form.ControlLabel>

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
                placement="auto"
              />
            </Form.Group>
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
      </Form>
    </>
  )
}
