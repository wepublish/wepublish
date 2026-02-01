import { ApolloError } from '@apollo/client';
import styled from '@emotion/styled';
import { Alert } from '@mui/material';
import {
  Currency,
  DeactivationFragment,
  FullMemberPlanFragment,
  FullSubscriptionFragment,
  InvoiceFragment,
  MetadataPropertyFragment,
  PaymentPeriodicity,
  SubscriptionDeactivationReason,
  useCancelSubscriptionMutation,
  useCreateSubscriptionMutation,
  useInvoicesQuery,
  useRenewSubscriptionMutation,
  useSubscriptionQuery,
  useUpdateSubscriptionMutation,
} from '@wepublish/editor/api';
import {
  FullPaymentMethodFragment,
  FullUserFragment,
  getApiClientV2,
  useMemberPlanListQuery,
  usePaymentMethodListQuery,
  useUserQuery,
} from '@wepublish/editor/api-v2';
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
  UserSubscriptionDeactivatePanel,
} from '@wepublish/ui/editor';
import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  MdAutoFixHigh,
  MdCheck,
  MdChevronLeft,
  MdOpenInNew,
  MdUnpublished,
} from 'react-icons/md';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
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
  Toggle,
} from 'rsuite';

const { Group, ControlLabel, Control, HelpText } = RForm;

const Form = styled(RForm)`
  height: 100%;
`;

const FormControlLabelMarginLeft = styled(ControlLabel)`
  margin-left: 10px;
`;

const Button = styled(RButton)`
  margin-top: 10px;
`;

const Grid = styled(RGrid)`
  padding-right: 0px;
`;

const RowPaddingTop = styled(Row)`
  padding-top: 12px;
`;

const UserFormGrid = styled(RGrid)`
  width: 100%;
  padding-left: 0px;
  height: calc(100vh - 160px);
  overflow-y: auto;
  margin-top: 2rem;
`;

const ButtonMarginRight = styled(Button)`
  margin-right: 10px;
`;

const IconButtonMarginRight = styled(IconButton)`
  margin-right: 10px;
  margin-top: 10px;
`;

const Actions = styled(ListViewActions)`
  grid-column: 3;
`;

export interface SubscriptionEditViewProps {
  onClose?(): void;
  onSave?(subscription: FullSubscriptionFragment): void;
}

function SubscriptionEditView({ onClose, onSave }: SubscriptionEditViewProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const params = useParams();
  const location = useLocation();

  const editedUserId = location.search.split('=')[1];

  const { id } = params;

  const isAuthorized = useAuthorisation('CAN_CREATE_SUBSCRIPTION');

  const [isDeactivationPanelOpen, setDeactivationPanelOpen] =
    useState<boolean>(false);
  const [closeAfterSave, setCloseAfterSave] = useState<boolean>(false);
  const [user, setUser] = useState<FullUserFragment | null>();
  const [memberPlan, setMemberPlan] = useState<FullMemberPlanFragment>();
  const [paymentPeriodicity, setPaymentPeriodicity] =
    useState<PaymentPeriodicity>(PaymentPeriodicity.Yearly);
  const [monthlyAmount, setMonthlyAmount] = useState<number>(500);
  const [autoRenew, setAutoRenew] = useState<boolean>(false);
  const [startsAt, setStartsAt] = useState<Date>(new Date());
  const [paidUntil, setPaidUntil] = useState<Date | null>();
  const [paymentMethod, setPaymentMethod] =
    useState<FullPaymentMethodFragment>();
  const [properties, setProperties] = useState<MetadataPropertyFragment[]>([]);
  const [deactivation, setDeactivation] =
    useState<DeactivationFragment | null>();
  const [extendable, setExtendable] = useState<boolean>(false);

  const [memberPlans, setMemberPlans] = useState<FullMemberPlanFragment[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<
    FullPaymentMethodFragment[]
  >([]);

  const [invoices, setInvoices] = useState<InvoiceFragment[] | undefined>(
    undefined
  );
  const [currency, setCurrency] = useState<Currency>(Currency.Chf);

  const [extendModal, setExtendModal] = useState<boolean>(false);

  /**
   * Loading the subscription
   */
  const {
    data,
    loading: isLoading,
    error: loadError,
    refetch: reloadSubscription,
  } = useSubscriptionQuery({
    variables: { id: id! },
    fetchPolicy: 'network-only',
    skip: id === undefined,
  });

  const {
    data: invoicesData,
    loading: isLoadingInvoices,
    error: loadErrorInvoices,
    refetch: reloadInvoices,
  } = useInvoicesQuery({
    variables: {
      take: 100,
      filter: {
        subscriptionID: id,
      },
    },
  });

  /**
   * Loading the invoices for the current subscription
   */
  useEffect(() => {
    const tmpInvoices = invoicesData?.invoices?.nodes;
    if (tmpInvoices) {
      setInvoices(tmpInvoices);
    }
  }, [invoicesData?.invoices?.nodes]);

  useEffect(() => {
    setSubscriptionProperties(data?.subscription);
  }, [data?.subscription]);

  useEffect(() => {
    if (!memberPlan) {
      return;
    }
    if (memberPlan.extendable === extendable) {
      return;
    }
    setExtendable(memberPlan.extendable);
    toaster.push(
      <Message
        type="info"
        showIcon
        closable
      >
        {t('subscriptionEditView.extendableWasChanged')}
      </Message>,
      { duration: 6000 }
    );
  }, [memberPlan?.id]);

  function setSubscriptionProperties(
    subscription?: FullSubscriptionFragment | null
  ) {
    if (!subscription) {
      return;
    }
    // @ts-expect-error Wrong type for now
    setUser(subscription.user);
    setMemberPlan(subscription.memberPlan);
    setPaymentPeriodicity(subscription.paymentPeriodicity);
    setMonthlyAmount(subscription.monthlyAmount);
    setAutoRenew(subscription.autoRenew);
    setStartsAt(new Date(subscription.startsAt));
    setPaidUntil(
      subscription.paidUntil ? new Date(subscription.paidUntil) : null
    );
    // @ts-expect-error wrong image type for now. Will be fixed with subscription PR
    setPaymentMethod(subscription.paymentMethod);
    setProperties(
      subscription.properties.map(({ key, value, public: isPublic }) => ({
        key,
        value,
        public: isPublic,
      }))
    );
    setDeactivation(subscription.deactivation);
    setExtendable(subscription.extendable);
    setCurrency(subscription.currency);
  }

  const client = getApiClientV2();
  const {
    data: memberPlanData,
    loading: isMemberPlanLoading,
    error: loadMemberPlanError,
  } = useMemberPlanListQuery({
    client,
    fetchPolicy: 'network-only',
    variables: {
      take: 100, // TODO: Pagination
    },
  });

  const {
    data: paymentMethodData,
    loading: isPaymentMethodLoading,
    error: paymentMethodLoadError,
  } = usePaymentMethodListQuery({
    client,
    fetchPolicy: 'network-only',
  });

  const [updateSubscription, { loading: isUpdating }] =
    useUpdateSubscriptionMutation();
  const [cancelSubscription, { loading: isCancel, error: cancelError }] =
    useCancelSubscriptionMutation();

  const [createSubscription, { loading: isCreating }] =
    useCreateSubscriptionMutation();
  const [renewSubscription, { loading: isRenewing, error: renewalError }] =
    useRenewSubscriptionMutation();

  /**
   * fetch edited user from api
   */
  const { data: editedUserData } = useUserQuery({
    client,
    variables: { id: editedUserId! },
    fetchPolicy: 'network-only',
    skip: editedUserId === undefined,
  });

  /**
   * USE EFFECT HOOKS
   */
  useEffect(() => {
    if (editedUserData) {
      setUser(editedUserData.user);
    }
  }, [editedUserData]);

  useEffect(() => {
    if (memberPlanData?.memberPlans?.nodes) {
      setMemberPlans(memberPlanData.memberPlans.nodes);
    }
  }, [memberPlanData?.memberPlans]);

  useEffect(() => {
    if (paymentMethodData?.paymentMethods) {
      setPaymentMethods(paymentMethodData.paymentMethods);
    }
  }, [paymentMethodData?.paymentMethods]);

  useEffect(() => {
    const error =
      loadError?.message ??
      loadMemberPlanError?.message ??
      paymentMethodLoadError?.message ??
      loadErrorInvoices?.message ??
      cancelError?.message ??
      renewalError?.message;
    if (error)
      toaster.push(
        <Message
          type="error"
          showIcon
          closable
        >
          {error}
        </Message>
      );
  }, [
    loadError,
    loadMemberPlanError,
    paymentMethodLoadError,
    loadErrorInvoices,
    cancelError,
    renewalError,
  ]);

  /**
   * MEMOS
   */
  const isDeactivated = useMemo<boolean>(() => {
    return deactivation?.date ?
        new Date(deactivation.date) < new Date()
      : false;
  }, [deactivation?.date]);

  const isDisabled: boolean = useMemo<boolean>(() => {
    return (
      isLoading ||
      isLoadingInvoices ||
      isCreating ||
      isMemberPlanLoading ||
      isUpdating ||
      isCancel ||
      isPaymentMethodLoading ||
      loadError !== undefined ||
      loadErrorInvoices !== undefined ||
      loadMemberPlanError !== undefined ||
      paymentMethodLoadError !== undefined ||
      !isAuthorized
    );
  }, [
    isLoading,
    isLoadingInvoices,
    isCreating,
    isMemberPlanLoading,
    isUpdating,
    isCancel,
    isPaymentMethodLoading,
    loadError,
    loadErrorInvoices,
    loadMemberPlanError,
    paymentMethodLoadError,
    isAuthorized,
  ]);

  const hasNoMemberPlanSelected: boolean = useMemo<boolean>(
    () => memberPlan === undefined,
    [memberPlan]
  );

  const goBackLink: string = useMemo<string>(
    () => (editedUserId ? `/users/edit/${editedUserId}` : '/subscriptions'),
    [editedUserId]
  );

  const isTrialMemberPlan: boolean = useMemo<boolean>(
    () => !!memberPlan?.maxCount,
    [memberPlan?.extendable, memberPlan?.maxCount]
  );

  const isTrialSubscription: boolean = useMemo<boolean>(
    () => !autoRenew && !extendable,
    [autoRenew, extendable]
  );

  const inputBase = {
    monthlyAmount,
    paymentPeriodicity,
    autoRenew,
    startsAt: startsAt.toISOString(),
    properties,
    extendable,
  };

  /**
   * Function to check either extendable or autoRenew flag to be compatible.
   * Database would rise an error if extendable is false and autoRenew is true at the same time.
   * We want to catch that already in front-end with meaningful explanation.
   * @param checkExtendable
   * @param checkAutoRenew
   */
  function checkTrialSubscription(
    checkExtendable: boolean = extendable,
    checkAutoRenew: boolean = autoRenew
  ): boolean {
    if (!checkExtendable && checkAutoRenew) {
      toaster.push(
        <Message
          type="error"
          showIcon
          closable
        >
          {t('subscriptionEditView.nonExtendableNotCompatibleWithAutoRenew')}
        </Message>,
        { duration: 6000 }
      );
      return false;
    }
    return true;
  }

  async function handleSave() {
    if (!memberPlan) return;
    if (!paymentMethod) return;
    if (!user) return;

    try {
      if (id) {
        const { data } = await updateSubscription({
          variables: {
            id,
            input: {
              ...inputBase,
              userID: user?.id,
              paymentMethodID: paymentMethod.id,
              memberPlanID: memberPlan.id,
            },
          },
        });

        if (data?.updateSubscription) onSave?.(data.updateSubscription);
      } else {
        const { data } = await createSubscription({
          variables: {
            input: {
              ...inputBase,
              userID: user.id,
              paymentMethodID: paymentMethod.id,
              memberPlanID: memberPlan.id,
            },
          },
        });

        const newSubscription = data?.createSubscription;
        if (!newSubscription) {
          throw new Error('Subscription id not created');
        }

        if (!closeAfterSave) {
          navigate(`/subscriptions/edit/${newSubscription.id}`);
        }

        if (data?.createSubscription) onSave?.(data.createSubscription);
      }

      toaster.push(
        <Message
          type="success"
          showIcon
          closable
        >
          {id ? `${t('toast.updatedSuccess')}` : `${t('toast.createdSuccess')}`}
        </Message>
      );

      // go back to subscription list or user edit, depending on where we came from
      if (closeAfterSave) {
        navigate(goBackLink);
      }
    } catch (e) {
      toaster.push(
        <Message
          type="error"
          showIcon
          closable
        >
          {t('toast.updateError', { error: (e as ApolloError)?.message })}
        </Message>,
        { duration: 6000 }
      );
    }
  }

  async function handleDeactivation(
    date: Date,
    reason: SubscriptionDeactivationReason
  ) {
    if (!id || !memberPlan || !paymentMethod || !user?.id) return;
    const { data } = await cancelSubscription({
      variables: {
        reason,
        cancelSubscriptionId: id,
      },
    });
    if (data?.cancelSubscription) onSave?.(data.cancelSubscription);
    await reloadInvoices();
  }

  async function handleRenewal() {
    if (!id) return;

    // close modal
    setExtendModal(false);

    try {
      await renewSubscription({
        variables: {
          id,
        },
      });
    } catch (e) {
      /* error is handled in the mutation definition */
    }
    await reloadInvoices();
  }

  // Schema used for form validation --- reference custom field for validation
  const { StringType, NumberType } = Schema.Types;
  const validationModel = Schema.Model({
    memberPlan: StringType().isRequired(
      t('errorMessages.noMemberPlanErrorMessage')
    ),
    user: StringType().isRequired(t('errorMessages.noUserErrorMessage')),
    monthlyAmount: NumberType()
      .isRequired(t('errorMessages.noAmountErrorMessage'))
      .min(
        (memberPlan?.amountPerMonthMin || 0) / 100,
        t(`errorMessages.minimalAmountPerMonth`, {
          amount: (memberPlan?.amountPerMonthMin || 0) / 100,
          currency: memberPlan?.currency,
        })
      ),
    paymentPeriodicity: StringType().isRequired(
      t('errorMessages.noPaymentPeriodicityErrorMessage')
    ),
    paymentMethod: StringType().isRequired(
      t('errorMessages.noPaymentMethodErrorMessage')
    ),
  });
  /**
   * UI helper functions
   */
  function showInvoiceHistory(): boolean {
    return !!(id && paymentMethod && memberPlan);
  }

  function capitalizeFirstLetter(text: string): string {
    return text.charAt(0).toUpperCase() + text.slice(1);
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
          monthlyAmount,
        }}
      >
        <ListViewContainer>
          <ListViewHeader>
            <h2>
              <Link to={goBackLink}>
                <MdChevronLeft />
              </Link>
              {id ?
                t('userSubscriptionEdit.editTitle')
              : t('userSubscriptionEdit.createTitle')}
            </h2>
          </ListViewHeader>
          <Actions>
            <PermissionControl
              qualifyingPermissions={['CAN_CREATE_SUBSCRIPTION']}
            >
              {showInvoiceHistory() && (
                <IconButtonMarginRight
                  appearance="ghost"
                  disabled={isDisabled || isDeactivated}
                  onClick={() => setDeactivationPanelOpen(true)}
                >
                  <MdUnpublished />
                  {t('userSubscriptionEdit.deactivation.title.activated')}
                </IconButtonMarginRight>
              )}
              <ButtonMarginRight
                appearance="primary"
                disabled={isDisabled || isDeactivated}
                type="submit"
              >
                {id ? t('save') : t('create')}
              </ButtonMarginRight>
              <Button
                disabled={isDisabled || isDeactivated}
                appearance="primary"
                loading={isDisabled}
                type="submit"
                data-testid="saveAndCloseButton"
                onClick={() => setCloseAfterSave(true)}
              >
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
                  <Message
                    showIcon
                    type="error"
                    style={{ marginBottom: '12px' }}
                  >
                    {t(
                      new Date(deactivation.date) < new Date() ?
                        'userSubscriptionEdit.deactivation.isDeactivated'
                      : 'userSubscriptionEdit.deactivation.willBeDeactivated',
                      {
                        date: new Date(deactivation.date),
                        reason: t(
                          `userSubscriptionEdit.deactivation.reason${capitalizeFirstLetter(
                            deactivation.reason
                          )}`
                        ),
                      }
                    )}
                  </Message>
                )}

                <RPanel
                  bordered
                  header={
                    id ?
                      t('userSubscriptionEdit.editTitle')
                    : t('userSubscriptionEdit.createTitle')
                  }
                >
                  <Group controlId="memberPlan">
                    <Grid fluid>
                      <Row gutter={24}>
                        {/* user */}
                        <Col xs={12}>
                          <ControlLabel>
                            {user?.id ?
                              <Link
                                to={`/users/edit/${user.id}`}
                                target="_blank"
                              >
                                {toggleRequiredLabel(
                                  t('userSubscriptionEdit.selectUser')
                                )}{' '}
                                <MdOpenInNew style={{ marginLeft: '4px' }} />
                              </Link>
                            : <p>
                                {toggleRequiredLabel(
                                  t('userSubscriptionEdit.selectUser')
                                )}
                              </p>
                            }
                          </ControlLabel>

                          <UserSearch
                            name="user"
                            user={user}
                            onUpdateUser={user => {
                              setUser(user);
                            }}
                          />
                        </Col>
                        {/* member plan */}
                        <Col xs={12}>
                          <ControlLabel>
                            {memberPlan?.id ?
                              <Link
                                to={`/memberplans/edit/${memberPlan?.id}`}
                                target="_blank"
                              >
                                {toggleRequiredLabel(
                                  t('userSubscriptionEdit.selectMemberPlan')
                                )}
                                <MdOpenInNew style={{ marginLeft: '4px' }} />
                              </Link>
                            : <p>
                                {toggleRequiredLabel(
                                  t('userSubscriptionEdit.selectMemberPlan')
                                )}
                              </p>
                            }
                          </ControlLabel>
                          <Control
                            block
                            name="memberPlan"
                            virtualized
                            disabled={isDisabled || isDeactivated}
                            data={memberPlans.map(mp => ({
                              value: mp.id,
                              label: mp.name,
                            }))}
                            value={memberPlan?.id}
                            onChange={(value: any) =>
                              setMemberPlan(() => {
                                const foundMemberPlan = memberPlans.find(
                                  mp => mp.id === value
                                );
                                if (!foundMemberPlan) return;
                                setMonthlyAmount(
                                  foundMemberPlan.amountPerMonthMin
                                );
                                setCurrency(foundMemberPlan.currency);
                                return foundMemberPlan;
                              })
                            }
                            accepter={SelectPicker}
                          />

                          {memberPlan && (
                            <HelpText>
                              <DescriptionList>
                                <DescriptionListItem
                                  label={t(
                                    'userSubscriptionEdit.memberPlanMonthlyAmount',
                                    {
                                      currency: memberPlan?.currency,
                                    }
                                  )}
                                >
                                  {(memberPlan.amountPerMonthMin / 100).toFixed(
                                    2
                                  )}
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
                            {toggleRequiredLabel(
                              t('memberPlanList.paymentPeriodicities')
                            )}
                          </ControlLabel>

                          <Control
                            virtualized
                            value={paymentPeriodicity}
                            name="paymentPeriodicity"
                            data={ALL_PAYMENT_PERIODICITIES.map(pp => ({
                              value: pp,
                              label: t(
                                `memberPlanList.paymentPeriodicity.${pp}`
                              ),
                            }))}
                            disabled={
                              isDisabled ||
                              hasNoMemberPlanSelected ||
                              isDeactivated
                            }
                            onChange={(value: any) =>
                              setPaymentPeriodicity(value)
                            }
                            block
                            accepter={SelectPicker}
                          />
                        </Col>
                        {/* monthly amount */}
                        <Col xs={12}>
                          <ControlLabel>
                            {toggleRequiredLabel(
                              t('userSubscriptionEdit.monthlyAmount')
                            )}
                          </ControlLabel>

                          <CurrencyInput
                            name="monthlyAmount"
                            currency={currency}
                            centAmount={monthlyAmount}
                            onChange={centAmount => {
                              setMonthlyAmount(Math.round(centAmount || 0));
                            }}
                            disabled={
                              isDisabled ||
                              hasNoMemberPlanSelected ||
                              isDeactivated
                            }
                          />
                        </Col>
                      </RowPaddingTop>
                      <RowPaddingTop>
                        {/* payment method */}
                        <Col xs={12}>
                          <ControlLabel>
                            {toggleRequiredLabel(
                              t('userSubscriptionEdit.paymentMethod')
                            )}
                          </ControlLabel>

                          <Control
                            name="paymentMethod"
                            block
                            virtualized
                            disabled={
                              isDisabled ||
                              hasNoMemberPlanSelected ||
                              isDeactivated
                            }
                            data={paymentMethods.map(pm => ({
                              value: pm.id,
                              label: pm.name,
                            }))}
                            value={paymentMethod?.id}
                            onChange={(value: any) =>
                              setPaymentMethod(
                                paymentMethods.find(pm => pm.id === value)
                              )
                            }
                            accepter={SelectPicker}
                            placement="auto"
                          />
                        </Col>
                        {/* auto renew */}
                        <Col xs={12}>
                          <ControlLabel>
                            {t('userSubscriptionEdit.autoRenew')}
                          </ControlLabel>
                          <Toggle
                            checked={autoRenew}
                            disabled={
                              isDisabled ||
                              hasNoMemberPlanSelected ||
                              isDeactivated
                            }
                            onChange={value =>
                              setAutoRenew(() =>
                                checkTrialSubscription(extendable, value) ?
                                  value
                                : autoRenew
                              )
                            }
                          />
                          <HelpText>
                            {t('userSubscriptionEdit.autoRenewDescription')}
                          </HelpText>
                        </Col>
                      </RowPaddingTop>
                      <RowPaddingTop>
                        <Col xs={12}></Col>
                        <Col xs={12}>
                          <Button
                            appearance="ghost"
                            color="red"
                            loading={isDisabled}
                            onClick={() => setExtendModal(true)}
                          >
                            {t('userSubscriptionEdit.renewNow')}
                          </Button>
                        </Col>
                      </RowPaddingTop>
                      <RowPaddingTop>
                        {/* subscription start */}
                        <Col xs={12}>
                          <ControlLabel>
                            {t('userSubscriptionEdit.startsAt')}
                          </ControlLabel>
                          <DatePicker
                            block
                            cleanable={false}
                            value={startsAt}
                            disabled={
                              isDisabled ||
                              hasNoMemberPlanSelected ||
                              isDeactivated
                            }
                            onChange={value => setStartsAt(value!)}
                          />
                        </Col>
                        {/* subscription paid until */}
                        <Col xs={12}>
                          <ControlLabel>
                            {t('userSubscriptionEdit.paidUntil')}
                          </ControlLabel>
                          <DatePicker
                            block
                            value={paidUntil ?? undefined}
                            disabled
                          />
                        </Col>
                      </RowPaddingTop>
                    </Grid>
                  </Group>
                </RPanel>
              </RGrid>
            </Col>

            <Col xs={12}>
              <Grid fluid>
                <RPanel
                  bordered
                  header={t('subscriptionEditView.additionalSettingsTitle')}
                >
                  <Grid fluid>
                    <Row>
                      <Col xs={24}>
                        {/* trial member plan & trial subscription */}
                        {isTrialMemberPlan && isTrialSubscription && (
                          <Alert
                            icon={<MdCheck />}
                            severity="success"
                          >
                            {t(
                              'subscriptionEditView.trialSubscriptionConfigured'
                            )}
                          </Alert>
                        )}
                        {/* trial member plan but not a trial subscription */}
                        {isTrialMemberPlan && !isTrialSubscription && (
                          <Button
                            startIcon={<MdAutoFixHigh />}
                            disabled={isTrialSubscription}
                            onClick={() => {
                              setAutoRenew(false);
                              setExtendable(false);
                            }}
                            color={'green'}
                          >
                            {t(
                              'subscriptionEditView.configureAsTrialSubscription'
                            )}
                          </Button>
                        )}
                        {/* not a trial member plan. Trial subscription not possible */}
                        {!isTrialMemberPlan && !isLoading && (
                          <Alert severity="info">
                            {t(
                              'subscriptionEditView.subscriptionTrialNotPossible'
                            )}
                          </Alert>
                        )}
                      </Col>
                    </Row>
                    <RowPaddingTop>
                      {/* extendable */}
                      <Col xs={12}>
                        <Toggle
                          checked={extendable}
                          onChange={updatedExtendable =>
                            setExtendable(() =>
                              checkTrialSubscription(updatedExtendable) ?
                                updatedExtendable
                              : extendable
                            )
                          }
                        />
                        <FormControlLabelMarginLeft>
                          {t('memberplanForm.extendableToggle')}
                        </FormControlLabelMarginLeft>
                        <HelpText>
                          {t('memberplanForm.extendableHelpText')}
                        </HelpText>
                      </Col>
                    </RowPaddingTop>
                  </Grid>
                </RPanel>
              </Grid>
            </Col>

            <Col xs={12}>
              <Grid fluid>
                <RPanel
                  bordered
                  header={t('invoice.panel.invoiceHistory')}
                >
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
            onClose={() => setDeactivationPanelOpen(false)}
          >
            <UserSubscriptionDeactivatePanel
              displayName={user.name || user.email}
              userEmail={user.email}
              paidUntil={paidUntil ?? undefined}
              onDeactivate={async data => {
                await handleDeactivation(data.date, data.reason);
                setDeactivationPanelOpen(false);
              }}
              onClose={() => setDeactivationPanelOpen(false)}
            />
          </Modal>
        )}

        {/* ask user to really extend the subscripion */}
        <Modal
          open={extendModal}
          size="sm"
          backdrop="static"
          onClose={() => setExtendModal(false)}
        >
          <Modal.Header>
            <Modal.Title>
              {t('subscriptionEditView.extendModalTitle')}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>{t('subscriptionEditView.extendModalBody')}</Modal.Body>
          <Modal.Footer>
            <Button
              onClick={() => handleRenewal()}
              appearance="primary"
            >
              {t('userSubscriptionEdit.renewNow')}
            </Button>
            <Button
              onClick={() => setExtendModal(false)}
              appearance="subtle"
            >
              {t('cancel')}
            </Button>
          </Modal.Footer>
        </Modal>
      </Form>
    </TableWrapper>
  );
}
const CheckedPermissionComponent = createCheckedPermissionComponent([
  'CAN_GET_SUBSCRIPTION',
  'CAN_GET_SUBSCRIPTIONS',
  'CAN_CREATE_SUBSCRIPTION',
  'CAN_DELETE_SUBSCRIPTION',
])(SubscriptionEditView);
export { CheckedPermissionComponent as SubscriptionEditView };
