import styled from '@emotion/styled'
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
  useCancelSubscriptionMutation,
  useCreateSubscriptionMutation,
  useInvoicesQuery,
  useMemberPlanListQuery,
  usePaymentMethodListQuery,
  useSubscriptionQuery,
  useUpdateSubscriptionMutation,
  useUserQuery
} from '@wepublish/editor/api'
import {
  ALL_PAYMENT_PERIODICITIES,
  createCheckedPermissionComponent,
  CurrencyInput,
  DescriptionList,
  DescriptionListItem,
  InvoiceListPanel,
  ListViewActions,
  ListViewContainer,
  ListViewHeader,
  PermissionControl,
  TableWrapper,
  toggleRequiredLabel,
  useAuthorisation,
  UserSearch,
  UserSubscriptionDeactivatePanel
} from '@wepublish/ui/editor'
import {useEffect, useState} from 'react'
import {useTranslation} from 'react-i18next'
import {MdChevronLeft, MdUnpublished} from 'react-icons/md'
import {Link, useLocation, useNavigate, useParams} from 'react-router-dom'
import {
  Button as RButton,
  Col,
  DatePicker,
  Form as RForm,
  Grid as RGrid,
  IconButton,
  Message,
  Modal,
  Panel as RPanel,
  Row,
  Schema,
  SelectPicker,
  toaster,
  Toggle
} from 'rsuite'

const {Group, ControlLabel, Control, HelpText} = RForm

const Form = styled(RForm)`
  height: 100%;
`

const Button = styled(RButton)`
  margin-top: 10px;
`

const Grid = styled(RGrid)`
  padding-right: 0px;
`

const RowPaddingTop = styled(Row)`
  padding-top: 12px;
`

const UserFormGrid = styled(RGrid)`
  width: 100%;
  padding-left: 0px;
  height: calc(100vh - 160px);
  overflow-y: auto;
  margin-top: 2rem;
`

const ButtonMarginRight = styled(Button)`
  margin-right: 10px;
`

const IconButtonMarginRight = styled(IconButton)`
  margin-right: 10px;
  margin-top: 10px;
`

const Actions = styled(ListViewActions)`
  grid-column: 3;
`

export interface SubscriptionEditViewProps {
  onClose?(): void
  onSave?(subscription: FullSubscriptionFragment): void
}

function SubscriptionEditView({onClose, onSave}: SubscriptionEditViewProps) {
  const {t} = useTranslation()
  const navigate = useNavigate()
  const params = useParams()
  const location = useLocation()

  const editedUserId = location.search.split('=')[1]

  const {id} = params

  const isAuthorized = useAuthorisation('CAN_CREATE_SUBSCRIPTION')

  const [isDeactivationPanelOpen, setDeactivationPanelOpen] = useState<boolean>(false)
  const [closeAfterSave, setCloseAfterSave] = useState<boolean>(false)
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
    setSubscriptionProperties(data?.subscription)
  }, [data?.subscription])

  function setSubscriptionProperties(subscription?: FullSubscriptionFragment | null) {
    if (!subscription) {
      return
    }
    setUser(subscription.user)
    setMemberPlan(subscription.memberPlan)
    setPaymentPeriodicity(subscription.paymentPeriodicity)
    setMonthlyAmount(subscription.monthlyAmount)
    setAutoRenew(subscription.autoRenew)
    setStartsAt(new Date(subscription.startsAt))
    setPaidUntil(subscription.paidUntil ? new Date(subscription.paidUntil) : null)
    setPaymentMethod(subscription.paymentMethod)
    setProperties(
      subscription.properties.map(({key, value, public: isPublic}) => ({
        key,
        value,
        public: isPublic
      }))
    )
    setDeactivation(subscription.deactivation)
  }

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
  const [cancelSubscription, {loading: isCancel, error: cancelError}] =
    useCancelSubscriptionMutation()

  const [createSubscription, {loading: isCreating, error: createError}] =
    useCreateSubscriptionMutation()

  /**
   * fetch edited user from api
   */
  const {data: editedUserData} = useUserQuery({
    variables: {id: editedUserId!},
    fetchPolicy: 'network-only',
    skip: editedUserId === undefined
  })

  useEffect(() => {
    if (editedUserData) {
      setUser(editedUserData.user)
    }
  }, [editedUserData])

  const isDeactivated = deactivation?.date ? new Date(deactivation.date) < new Date() : false

  const isDisabled =
    isLoading ||
    isLoadingInvoices ||
    isCreating ||
    isMemberPlanLoading ||
    isUpdating ||
    isCancel ||
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
      loadErrorInvoices?.message ??
      cancelError?.message
    if (error)
      toaster.push(
        <Message type="error" showIcon closable duration={0}>
          {error}
        </Message>
      )
  }, [
    loadError,
    updateError,
    loadMemberPlanError,
    paymentMethodLoadError,
    loadErrorInvoices,
    cancelError
  ])

  const inputBase = {
    monthlyAmount,
    paymentPeriodicity,
    autoRenew,
    startsAt: startsAt.toISOString(),
    properties
  }

  const goBackLink = editedUserId ? `/users/edit/${editedUserId}` : '/subscriptions'

  async function handleSave() {
    if (!memberPlan) return
    if (!paymentMethod) return
    if (!user) return

    try {
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

        const newSubscription = data?.createSubscription
        if (!newSubscription) {
          throw new Error('Subscription id not created')
        }

        if (!closeAfterSave) {
          navigate(`/subscriptions/edit/${newSubscription.id}`)
        }

        if (data?.createSubscription) onSave?.(data.createSubscription)
      }

      toaster.push(
        <Message type="success" showIcon closable duration={2000}>
          {id ? `${t('toast.updatedSuccess')}` : `${t('toast.createdSuccess')}`}
        </Message>
      )

      // go back to subscription list or user edit, depending on where we came from
      if (closeAfterSave) {
        navigate(goBackLink)
      }
    } catch (e) {
      toaster.push(
        <Message type="error" showIcon closable duration={2000}>
          {t('toast.updateError', {error: e})}
        </Message>
      )
    }
  }

  async function handleDeactivation(date: Date, reason: SubscriptionDeactivationReason) {
    if (!id || !memberPlan || !paymentMethod || !user?.id) return
    const {data} = await cancelSubscription({
      variables: {
        reason,
        cancelSubscriptionId: id
      }
    })
    if (data?.cancelSubscription) onSave?.(data.cancelSubscription)
    await reloadInvoices()
  }

  // Schema used for form validation --- reference custom field for validation
  const {StringType, NumberType} = Schema.Types
  const validationModel = Schema.Model({
    memberPlan: StringType().isRequired(t('errorMessages.noMemberPlanErrorMessage')),
    user: StringType().isRequired(t('errorMessages.noUserErrorMessage')),
    currency: NumberType()
      .isRequired(t('errorMessages.noAmountErrorMessage'))
      .min(
        memberPlan?.amountPerMonthMin || 0,
        t(`errorMessages.minimalAmountPerMonth`, {
          amount: (memberPlan?.amountPerMonthMin || 0) / 100
        })
      ),
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

  return (
    <TableWrapper>
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
        <ListViewContainer>
          <ListViewHeader>
            <h2>
              <Link to={goBackLink}>
                <MdChevronLeft />
              </Link>
              {id ? t('userSubscriptionEdit.editTitle') : t('userSubscriptionEdit.createTitle')}
            </h2>
          </ListViewHeader>
          <Actions>
            <PermissionControl qualifyingPermissions={['CAN_CREATE_SUBSCRIPTION']}>
              {showInvoiceHistory() && (
                <IconButtonMarginRight
                  appearance="ghost"
                  disabled={isDisabled || isDeactivated}
                  onClick={() => setDeactivationPanelOpen(true)}>
                  <MdUnpublished />
                  {t('userSubscriptionEdit.deactivation.title.activated')}
                </IconButtonMarginRight>
              )}
              <ButtonMarginRight
                appearance="primary"
                disabled={isDisabled || isDeactivated}
                type="submit">
                {id ? t('save') : t('create')}
              </ButtonMarginRight>
              <Button
                disabled={isDisabled || isDeactivated}
                appearance="primary"
                loading={isDisabled}
                type="submit"
                data-testid="saveAndCloseButton"
                onClick={() => setCloseAfterSave(true)}>
                {user ? t('saveAndClose') : t('createAndClose')}
              </Button>
            </PermissionControl>
          </Actions>
        </ListViewContainer>
        <UserFormGrid>
          <Row gutter={10}>
            <Col xs={12}>
              <RGrid fluid>
                {deactivation && (
                  <Message showIcon type="error" style={{marginBottom: '12px'}}>
                    {t(
                      new Date(deactivation.date) < new Date()
                        ? 'userSubscriptionEdit.deactivation.isDeactivated'
                        : 'userSubscriptionEdit.deactivation.willBeDeactivated',
                      {date: new Date(deactivation.date)}
                    )}
                  </Message>
                )}

                <RPanel
                  bordered
                  header={
                    id ? t('userSubscriptionEdit.editTitle') : t('userSubscriptionEdit.createTitle')
                  }>
                  <Group controlId="memberPlan">
                    <Grid fluid>
                      <Row gutter={24}>
                        {/* user */}
                        <Col xs={12}>
                          <ControlLabel>
                            {toggleRequiredLabel(t('userSubscriptionEdit.selectUser'))}
                          </ControlLabel>

                          <UserSearch
                            name="user"
                            user={user}
                            onUpdateUser={user => {
                              setUser(user)
                            }}
                          />
                        </Col>
                        {/* member plan */}
                        <Col xs={12}>
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
                            onChange={(value: any) =>
                              setMemberPlan(memberPlans.find(mp => mp.id === value))
                            }
                            accepter={SelectPicker}
                          />

                          {memberPlan && (
                            <HelpText>
                              <DescriptionList>
                                <DescriptionListItem
                                  label={t('userSubscriptionEdit.memberPlanMonthlyAmount')}>
                                  {(memberPlan.amountPerMonthMin / 100).toFixed(2)}
                                </DescriptionListItem>
                              </DescriptionList>
                            </HelpText>
                          )}
                        </Col>
                      </Row>
                      <RowPaddingTop>
                        {/* payment periodicity */}
                        <Col xs={12}>
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
                        </Col>
                        {/* monthly amount */}
                        <Col xs={12}>
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
                        </Col>
                      </RowPaddingTop>
                      <RowPaddingTop>
                        {/* auto renew */}
                        <Col xs={12}>
                          <ControlLabel>{t('userSubscriptionEdit.autoRenew')}</ControlLabel>
                          <Toggle
                            checked={autoRenew}
                            disabled={isDisabled || hasNoMemberPlanSelected || isDeactivated}
                            onChange={value => setAutoRenew(value)}
                          />
                          <HelpText>{t('userSubscriptionEdit.autoRenewDescription')}</HelpText>
                        </Col>
                        {/* payment method */}
                        <Col xs={12}>
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
                        </Col>
                      </RowPaddingTop>
                      <RowPaddingTop>
                        {/* subscription start */}
                        <Col xs={12}>
                          <ControlLabel>{t('userSubscriptionEdit.startsAt')}</ControlLabel>
                          <DatePicker
                            block
                            cleanable={false}
                            value={startsAt}
                            disabled={isDisabled || hasNoMemberPlanSelected || isDeactivated}
                            onChange={value => setStartsAt(value!)}
                          />
                        </Col>
                        {/* subscription paid until */}
                        <Col xs={12}>
                          <ControlLabel>{t('userSubscriptionEdit.paidUntil')}</ControlLabel>
                          <DatePicker block value={paidUntil ?? undefined} disabled />
                        </Col>
                      </RowPaddingTop>

                      <RowPaddingTop>
                        {/* unique subscription */}
                        <Col xs={12}>
                          <ControlLabel>
                            {t('userSubscriptionEdit.uniqueSubscription')}
                          </ControlLabel>
                          <Toggle disabled />
                          <HelpText>
                            {t('userSubscriptionEdit.uniqueSubscriptionHelpText')}
                          </HelpText>
                        </Col>
                      </RowPaddingTop>
                    </Grid>
                  </Group>
                </RPanel>
              </RGrid>
            </Col>

            <Col xs={12}>
              <Grid fluid>
                <RPanel bordered header={t('invoice.panel.invoiceHistory')}>
                  {id && (
                    <InvoiceListPanel
                      subscriptionId={id}
                      invoices={invoices}
                      disabled={!!deactivation}
                      onInvoicePaid={() => reloadSubscription()}
                    />
                  )}
                </RPanel>
              </Grid>
            </Col>
          </Row>
        </UserFormGrid>

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
              onDeactivate={async data => {
                await handleDeactivation(data.date, data.reason)
                setDeactivationPanelOpen(false)
              }}
              onClose={() => setDeactivationPanelOpen(false)}
            />
          </Modal>
        )}
      </Form>
    </TableWrapper>
  )
}
const CheckedPermissionComponent = createCheckedPermissionComponent([
  'CAN_GET_SUBSCRIPTION',
  'CAN_GET_SUBSCRIPTIONS',
  'CAN_CREATE_SUBSCRIPTION',
  'CAN_DELETE_SUBSCRIPTION'
])(SubscriptionEditView)
export {CheckedPermissionComponent as SubscriptionEditView}
