import { useApolloClient, useMutation, useQuery } from '@apollo/client/react';
import styled from '@emotion/styled';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Alert,
  Button as RButton,
  Card,
  CardActions,
  CardContent,
  CardHeader,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  FormHelperText,
  FormLabel,
  MenuItem,
  TextField,
  Typography,
} from '@mui/material';
import {
  CancelSubscriptionDocument,
  CreateSubscriptionDocument,
  Currency,
  DeactivationFragment,
  FullMemberPlanFragment,
  FullPaymentMethodFragment,
  FullSubscriptionFragment,
  FullUserFragment,
  InvoicesDocument,
  MemberPlanListDocument,
  PaymentMethodListDocument,
  PaymentPeriodicity,
  PropertyInput,
  ReactivateSubscriptionDocument,
  RenewSubscriptionDocument,
  RevertSubscriptionUpgradeDocument,
  SubscriptionCancellationMailDocument,
  SubscriptionCreationMailDocument,
  SubscriptionDeactivationReason,
  SubscriptionDocument,
  UpdateSubscriptionDocument,
  UserDocument,
} from '@wepublish/editor/api';
import {
  CanCancelSubscription,
  CanCreateSubscription,
  CanGetSubscription,
  CanGetSubscriptions,
} from '@wepublish/permissions';
import {
  ALL_PAYMENT_PERIODICITIES,
  createCheckedPermissionComponent,
  CurrencyInput,
  DatePicker,
  enqueueSnackbar,
  FormFields,
  getMonthlyEquivalentRange,
  InfoTooltip,
  InvoiceListPanel,
  Link,
  PAYMENT_PERIODICITY_MONTHS,
  PermissionControl,
  SingleViewTitle,
  skipMailFor,
  TableWrapper,
  toggleRequiredLabel,
  useActionMailQuestion,
  useAuthorisation,
  UserSearch,
  UserSubscriptionDeactivatePanel,
} from '@wepublish/ui/editor';
import { useCallback, useEffect, useId, useMemo, useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import {
  MdAutoFixHigh,
  MdCheck,
  MdOpenInNew,
  MdRestartAlt,
  MdUndo,
  MdUnpublished,
} from 'react-icons/md';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { z } from 'zod';

import { ReactivateSubscriptionModal } from './reactivateSubscriptionModal';

const Button = styled(RButton)`
  margin-top: 8px;
`;

const Body = styled('div')`
  display: grid;
  gap: ${({ theme }) => theme.spacing(2)};
  align-content: start;
  width: 100%;
  padding-bottom: ${({ theme }) => theme.spacing(4)};
`;

const Columns = styled('div')`
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: ${({ theme }) => theme.spacing(2)};
  align-items: start;

  ${({ theme }) => theme.breakpoints.down('lg')} {
    grid-template-columns: minmax(0, 1fr);
  }
`;

const CardFooter = styled(CardActions)`
  padding: ${({ theme }) => theme.spacing(0, 2, 2)};
`;

const ExternalLinkIcon = styled(MdOpenInNew)`
  margin-left: ${({ theme }) => theme.spacing(0.5)};
`;

const TwoUp = styled('div')`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: ${({ theme }) => theme.spacing(3)};
  align-items: start;
`;

export interface SubscriptionEditViewProps {
  onClose?(): void;
  onSave?(subscription: FullSubscriptionFragment): void;
}

const EMPTY_SUBSCRIPTION = {
  user: null as FullUserFragment | null,
  memberPlan: undefined as FullMemberPlanFragment | undefined,
  paymentMethod: undefined as FullPaymentMethodFragment | undefined,
  paymentPeriodicity: PaymentPeriodicity.Yearly,
  monthlyAmount: 500,
  autoRenew: false,
  startsAt: new Date(),
  paidUntil: null as Date | null,
  properties: [] as PropertyInput[],
  deactivation: null as DeactivationFragment | null,
  extendable: false,
  currency: Currency.Chf,
};

const periodMinAmountOf = (
  memberPlan: FullMemberPlanFragment | null | undefined,
  paymentPeriodicity: PaymentPeriodicity
): number => {
  if (!memberPlan) {
    return 0;
  }

  const months = PAYMENT_PERIODICITY_MONTHS[paymentPeriodicity];
  const override = memberPlan.periodicityPricing?.find(
    price => price.periodicity === paymentPeriodicity && price.amountMin != null
  );

  return (
    override?.amountMin ??
    Math.round(
      getMonthlyEquivalentRange(memberPlan.periodicityPricing)
        .amountPerMonthMin * months
    )
  );
};

function SubscriptionEditView({ onClose, onSave }: SubscriptionEditViewProps) {
  const { t } = useTranslation();
  const formId = useId();
  const labelId = (field: string) => `${formId}-${field}-label`;
  const navigate = useNavigate();
  const params = useParams();
  const location = useLocation();

  const editedUserId = location.search.split('=')[1];

  const { id } = params;

  const isAuthorized = useAuthorisation(CanCreateSubscription.id);

  const [isDeactivationPanelOpen, setDeactivationPanelOpen] =
    useState<boolean>(false);
  const [isReactivationModalOpen, setReactivationModalOpen] =
    useState<boolean>(false);
  const [isRevertUpgradeModalOpen, setRevertUpgradeModalOpen] =
    useState<boolean>(false);
  const [closeAfterSave, setCloseAfterSave] = useState<boolean>(false);
  const client = useApolloClient();
  const { askMail, actionMailDialog } = useActionMailQuestion();
  const [extendModal, setExtendModal] = useState<boolean>(false);
  const [loadError, setLoadError] = useState<Error>();

  const schema = z
    .object({
      user: z.custom<FullUserFragment>().nullish(),
      memberPlan: z.custom<FullMemberPlanFragment>().nullish(),
      paymentMethod: z.custom<FullPaymentMethodFragment>().nullish(),
      paymentPeriodicity: z.nativeEnum(PaymentPeriodicity),
      monthlyAmount: z.number(),
      autoRenew: z.boolean(),
      startsAt: z.date(),
      paidUntil: z.date().nullish(),
      properties: z.array(z.custom<PropertyInput>()),
      deactivation: z.custom<DeactivationFragment>().nullish(),
      extendable: z.boolean(),
      currency: z.nativeEnum(Currency),
    })
    .superRefine((subscription, ctx) => {
      if (!subscription.user) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['user'],
          message: t('errorMessages.noUserErrorMessage'),
        });
      }

      if (!subscription.memberPlan) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['memberPlan'],
          message: t('errorMessages.noMemberPlanErrorMessage'),
        });

        return;
      }

      if (!subscription.paymentMethod) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['paymentMethod'],
          message: t('errorMessages.noPaymentMethodErrorMessage'),
        });
      }

      const months =
        PAYMENT_PERIODICITY_MONTHS[subscription.paymentPeriodicity];

      if (
        Math.round(subscription.monthlyAmount * months) <
        periodMinAmountOf(
          subscription.memberPlan,
          subscription.paymentPeriodicity
        )
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['monthlyAmount'],
          message: t('errorMessages.amountTooLowErrorMessage'),
        });
      }
    });

  const [canRevertUpgrade, setCanRevertUpgrade] = useState(false);

  const loadSubscription = useCallback(async () => {
    try {
      if (id) {
        const { data } = await client.query({
          query: SubscriptionDocument,
          variables: { id },
        });
        const subscription = data?.subscription;

        setCanRevertUpgrade(!!subscription?.canRevertUpgrade);

        if (subscription) {
          return {
            ...EMPTY_SUBSCRIPTION,
            user: subscription.user as unknown as FullUserFragment,
            memberPlan: subscription.memberPlan,
            paymentPeriodicity: subscription.paymentPeriodicity,
            monthlyAmount: subscription.monthlyAmount,
            autoRenew: subscription.autoRenew,
            startsAt: new Date(subscription.startsAt),
            paidUntil:
              subscription.paidUntil ? new Date(subscription.paidUntil) : null,
            paymentMethod: subscription.paymentMethod,
            properties: subscription.properties.map(
              ({ key, value, public: isPublic }) => ({
                key,
                value,
                public: isPublic,
              })
            ),
            deactivation: subscription.deactivation,
            extendable: subscription.extendable,
            currency: subscription.currency,
          };
        }
      }

      if (editedUserId) {
        const { data } = await client.query({
          query: UserDocument,
          variables: { id: editedUserId },
        });

        return { ...EMPTY_SUBSCRIPTION, user: data?.user ?? null };
      }

      return EMPTY_SUBSCRIPTION;
    } catch (error) {
      setLoadError(error as Error);

      return EMPTY_SUBSCRIPTION;
    }
  }, [client, id, editedUserId]);

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { isLoading },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: loadSubscription,
  });

  const user = useWatch({ control, name: 'user' });
  const memberPlan = useWatch({ control, name: 'memberPlan' });
  const paymentMethod = useWatch({ control, name: 'paymentMethod' });
  const paymentPeriodicity = useWatch({ control, name: 'paymentPeriodicity' });
  const monthlyAmount = useWatch({ control, name: 'monthlyAmount' });
  const autoRenew = useWatch({ control, name: 'autoRenew' });
  const extendable = useWatch({ control, name: 'extendable' });
  const deactivation = useWatch({ control, name: 'deactivation' });
  const currency = useWatch({ control, name: 'currency' });
  const paidUntil = useWatch({ control, name: 'paidUntil' });

  const periodicityMonths = PAYMENT_PERIODICITY_MONTHS[paymentPeriodicity];
  const periodAmount = Math.round(monthlyAmount * periodicityMonths);

  const {
    data: invoicesData,
    loading: isLoadingInvoices,
    error: loadErrorInvoices,
    refetch: reloadInvoices,
  } = useQuery(InvoicesDocument, {
    variables: {
      take: 100,
      filter: {
        subscriptionID: id,
      },
    },
  });

  const invoices = invoicesData?.invoices?.nodes;

  const {
    data: memberPlanData,
    loading: isMemberPlanLoading,
    error: loadMemberPlanError,
  } = useQuery(MemberPlanListDocument, {
    variables: {
      take: 100, // TODO: Pagination
    },
  });

  const {
    data: paymentMethodData,
    loading: isPaymentMethodLoading,
    error: paymentMethodLoadError,
  } = useQuery(PaymentMethodListDocument, {});

  const [updateSubscription, { loading: isUpdating }] = useMutation(
    UpdateSubscriptionDocument
  );
  const [cancelSubscription, { loading: isCancel, error: cancelError }] =
    useMutation(CancelSubscriptionDocument);

  const [createSubscription, { loading: isCreating }] = useMutation(
    CreateSubscriptionDocument
  );
  const [renewSubscription, { error: renewalError }] = useMutation(
    RenewSubscriptionDocument
  );
  const [
    reactivateSubscription,
    { loading: isReactivating, error: reactivationError },
  ] = useMutation(ReactivateSubscriptionDocument);
  const [
    revertSubscriptionUpgrade,
    { loading: isRevertingUpgrade, error: revertUpgradeError },
  ] = useMutation(RevertSubscriptionUpgradeDocument);

  const memberPlans = memberPlanData?.memberPlans?.nodes ?? [];
  const paymentMethods = paymentMethodData?.paymentMethods ?? [];

  useEffect(() => {
    const error =
      loadError?.message ??
      loadMemberPlanError?.message ??
      paymentMethodLoadError?.message ??
      loadErrorInvoices?.message ??
      cancelError?.message ??
      renewalError?.message ??
      reactivationError?.message ??
      revertUpgradeError?.message;
    if (error) {
      enqueueSnackbar(error, { variant: 'error' });
    }
  }, [
    loadError,
    loadMemberPlanError,
    paymentMethodLoadError,
    loadErrorInvoices,
    cancelError,
    renewalError,
    reactivationError,
    revertUpgradeError,
  ]);

  /**
   * MEMOS
   */
  const [openedAt] = useState(() => Date.now());
  const isDeactivated =
    deactivation?.date ?
      new Date(deactivation.date).getTime() < openedAt
    : false;

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

  /**
   * Function to check either extendable or autoRenew flag to be compatible.
   * Database would rise an error if extendable is false and autoRenew is true at the same time.
   * We want to catch that already in front-end with meaningful explanation.
   * @param checkExtendable
   * @param checkAutoRenew
   */
  async function handleSave(subscription: z.infer<typeof schema>) {
    const { memberPlan, paymentMethod, user } = subscription;

    if (!memberPlan || !paymentMethod || !user) {
      return;
    }

    const inputBase = {
      monthlyAmount: subscription.monthlyAmount,
      paymentPeriodicity: subscription.paymentPeriodicity,
      autoRenew: subscription.autoRenew,
      startsAt: subscription.startsAt.toISOString(),
      properties: subscription.properties,
      extendable: subscription.extendable,
    };

    try {
      if (id) {
        const { data } = await updateSubscription({
          variables: {
            id,
            ...inputBase,
            userID: user?.id,
            paymentMethodID: paymentMethod.id,
            memberPlanID: memberPlan.id,
          },
        });

        if (data?.updateSubscription) {
          onSave?.(data.updateSubscription);
        }
      } else {
        const { data: mailData } = await client.query({
          query: SubscriptionCreationMailDocument,
          variables: {
            userID: user.id,
            memberPlanID: memberPlan.id,
            paymentMethodID: paymentMethod.id,
            paymentPeriodicity: subscription.paymentPeriodicity,
            autoRenew: subscription.autoRenew,
          },
          fetchPolicy: 'network-only',
        });
        const mail = mailData?.subscriptionCreationMail;

        if (!mail) {
          throw new Error('Could not look up the mail of this action');
        }

        // asked every time: whether the mail goes out, or that none will
        const decision = await askMail({
          ...mail,
          // the address the mail goes to, from the API; the view's user may lack it
          recipient: mail.recipientEmail ?? user.email,
        });

        if (decision === 'cancel') {
          return;
        }

        const { data } = await createSubscription({
          variables: {
            ...inputBase,
            userID: user.id,
            paymentMethodID: paymentMethod.id,
            memberPlanID: memberPlan.id,
            skipMail: skipMailFor(decision),
          },
        });

        const newSubscription = data?.createSubscription;
        if (!newSubscription) {
          throw new Error('Subscription id not created');
        }

        if (!closeAfterSave) {
          navigate(`/subscriptions/edit/${newSubscription.id}`);
        }

        if (data?.createSubscription) {
          onSave?.(data.createSubscription);
        }
      }

      enqueueSnackbar(
        id ? `${t('toast.updatedSuccess')}` : `${t('toast.createdSuccess')}`,
        { variant: 'success' }
      );

      // go back to subscription list or user edit, depending on where we came from
      if (closeAfterSave) {
        navigate(goBackLink);
      }
    } catch (e) {
      enqueueSnackbar(
        t('toast.updateError', { error: (e as Error)?.message }),
        { variant: 'error', autoHideDuration: 6000 }
      );
    }
  }

  /** @returns false when the admin cancelled, so the dialog stays open */
  async function handleDeactivation(
    date: Date,
    reason: SubscriptionDeactivationReason
  ): Promise<boolean> {
    if (!id || !memberPlan || !paymentMethod || !user?.id) {
      return true;
    }

    const { data: mailData } = await client.query({
      query: SubscriptionCancellationMailDocument,
      variables: { id, reason },
      fetchPolicy: 'network-only',
    });
    const mail = mailData?.subscriptionCancellationMail;

    if (!mail) {
      throw new Error('Could not look up the mail of this action');
    }

    // asked every time: whether the mail goes out, or that none will
    const decision = await askMail({
      ...mail,
      // the address the mail goes to, from the API; the view's user may lack it
      recipient: mail.recipientEmail ?? user.email,
    });

    if (decision === 'cancel') {
      return false;
    }

    const { data } = await cancelSubscription({
      variables: {
        reason,
        cancelSubscriptionId: id,
        skipMail: skipMailFor(decision),
      },
    });
    if (data?.cancelSubscription) {
      onSave?.(data.cancelSubscription);
    }
    await reloadInvoices();

    return true;
  }

  async function handleReactivation() {
    if (!id) {
      return;
    }

    setReactivationModalOpen(false);

    try {
      const { data } = await reactivateSubscription({
        variables: { id },
      });

      if (data?.reactivateSubscription) {
        onSave?.(data.reactivateSubscription);
      }
    } catch (e) {
      /* error is handled in the mutation definition */
    }

    // reactivating may create a new invoice and period
    await Promise.all([reloadSubscription(), reloadInvoices()]);
  }

  async function handleRevertUpgrade() {
    if (!id) {
      return;
    }

    setRevertUpgradeModalOpen(false);

    try {
      const { data } = await revertSubscriptionUpgrade({
        variables: { id },
      });

      if (data?.revertSubscriptionUpgrade) {
        onSave?.(data.revertSubscriptionUpgrade);
      }
    } catch (e) {
      /* error is handled in the mutation definition */
    }

    // the replacement subscription and its invoice are gone now
    await Promise.all([reloadSubscription(), reloadInvoices()]);
  }

  async function reloadSubscription() {
    reset(await loadSubscription());
  }

  async function handleRenewal() {
    if (!id) {
      return;
    }

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

  /**
   * UI helper functions
   */
  function showInvoiceHistory(): boolean {
    return !!(id && paymentMethod && memberPlan);
  }

  function capitalizeFirstLetter(text: string): string {
    return text.charAt(0).toUpperCase() + text.slice(1);
  }

  if (isLoading) {
    return null;
  }

  return (
    <TableWrapper>
      <form
        noValidate
        onSubmit={handleSubmit(handleSave)}
      >
        <SingleViewTitle
          loading={isCreating || isUpdating}
          disabled={isDisabled || isDeactivated}
          title={
            id ?
              t('userSubscriptionEdit.editTitle')
            : t('userSubscriptionEdit.createTitle')
          }
          saveBtnTitle={id ? t('save') : t('create')}
          saveAndCloseBtnTitle={user ? t('saveAndClose') : t('createAndClose')}
          closePath={goBackLink}
          setCloseFn={setCloseAfterSave}
        >
          <PermissionControl qualifyingPermissions={[CanCreateSubscription.id]}>
            {showInvoiceHistory() && !deactivation && (
              <RButton
                variant="outlined"
                disabled={isDisabled || isDeactivated}
                onClick={() => setDeactivationPanelOpen(true)}
                startIcon={<MdUnpublished />}
              >
                {t('userSubscriptionEdit.deactivation.title.activated')}
              </RButton>
            )}

            {showInvoiceHistory() && canRevertUpgrade && (
              <RButton
                variant="outlined"
                data-testid="revertSubscriptionUpgrade"
                disabled={isDisabled || isRevertingUpgrade}
                onClick={() => setRevertUpgradeModalOpen(true)}
                startIcon={<MdUndo />}
              >
                {t('userSubscriptionEdit.revertUpgrade.title')}
              </RButton>
            )}

            {showInvoiceHistory() && deactivation && !canRevertUpgrade && (
              <RButton
                variant="outlined"
                color="success"
                data-testid="reactivateSubscription"
                disabled={isDisabled || isReactivating}
                onClick={() => setReactivationModalOpen(true)}
                startIcon={<MdRestartAlt />}
              >
                {t('userSubscriptionEdit.reactivation.title')}
              </RButton>
            )}
          </PermissionControl>
        </SingleViewTitle>

        <Body>
          {deactivation && (
            <Alert severity="error">
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
            </Alert>
          )}

          <Columns>
            <Card>
              <CardHeader title={t('subscriptionEditView.detailsTitle')} />

              <CardContent>
                <FormFields>
                  <TwoUp>
                    <div>
                      <FormLabel id={labelId('user')}>
                        {user?.id ?
                          <Link
                            to={`/users/edit/${user.id}`}
                            target="_blank"
                          >
                            {toggleRequiredLabel(
                              t('userSubscriptionEdit.selectUser')
                            )}{' '}
                            <ExternalLinkIcon />
                          </Link>
                        : <Typography>
                            {toggleRequiredLabel(
                              t('userSubscriptionEdit.selectUser')
                            )}
                          </Typography>
                        }
                      </FormLabel>

                      <Controller
                        control={control}
                        name="user"
                        render={({ field, fieldState: { error } }) => (
                          <>
                            <UserSearch
                              aria-labelledby={labelId('user')}
                              name={field.name}
                              user={field.value}
                              disableClearable
                              onUpdateUser={field.onChange}
                            />

                            {error?.message && (
                              <FormHelperText error>
                                {error.message}
                              </FormHelperText>
                            )}
                          </>
                        )}
                      />
                    </div>

                    <div>
                      <FormLabel
                        id={labelId('memberPlan')}
                        required
                      >
                        {memberPlan?.id ?
                          <Link
                            to={`/memberplans/edit/${memberPlan?.id}`}
                            target="_blank"
                          >
                            {t('userSubscriptionEdit.selectMemberPlan')}
                            <ExternalLinkIcon />
                          </Link>
                        : <Typography component="span">
                            {t('userSubscriptionEdit.selectMemberPlan')}
                          </Typography>
                        }
                      </FormLabel>
                      <Controller
                        control={control}
                        name="memberPlan"
                        render={({ field, fieldState: { error } }) => (
                          <TextField
                            select
                            disabled={isDisabled || isDeactivated}
                            value={field.value?.id ?? ''}
                            onChange={event => {
                              const chosen = memberPlans.find(
                                mp => mp.id === event.target.value
                              );

                              if (!chosen) {
                                return;
                              }

                              const planPeriodMin =
                                chosen.periodicityPricing?.find(
                                  price =>
                                    price.periodicity === paymentPeriodicity
                                )?.amountMin;

                              field.onChange(chosen);
                              setValue(
                                'monthlyAmount',
                                planPeriodMin != null ?
                                  planPeriodMin / periodicityMonths
                                : getMonthlyEquivalentRange(
                                    chosen.periodicityPricing
                                  ).amountPerMonthMin
                              );
                              setValue('currency', chosen.currency);

                              if (chosen.extendable !== extendable) {
                                setValue('extendable', chosen.extendable);
                                enqueueSnackbar(
                                  t(
                                    'subscriptionEditView.extendableWasChanged'
                                  ),
                                  { autoHideDuration: 6000 }
                                );
                              }
                            }}
                            error={Boolean(error)}
                            helperText={error?.message}
                            fullWidth
                            required
                            slotProps={{
                              select: { labelId: labelId('memberPlan') },
                            }}
                          >
                            {memberPlans.map(mp => (
                              <MenuItem
                                key={mp.id}
                                value={mp.id}
                              >
                                {mp.name}
                              </MenuItem>
                            ))}
                          </TextField>
                        )}
                      />

                      {memberPlan && (
                        <FormHelperText>
                          {t('userSubscriptionEdit.memberPlanMonthlyAmount', {
                            currency: memberPlan.currency,
                          })}
                          {': '}
                          {(
                            getMonthlyEquivalentRange(
                              memberPlan.periodicityPricing
                            ).amountPerMonthMin / 100
                          ).toFixed(2)}
                        </FormHelperText>
                      )}
                    </div>
                  </TwoUp>

                  <TwoUp>
                    <div>
                      <FormLabel
                        id={labelId('paymentPeriodicity')}
                        required
                      >
                        {t('memberPlanList.paymentPeriodicities')}
                      </FormLabel>

                      <Controller
                        control={control}
                        name="paymentPeriodicity"
                        render={({ field, fieldState: { error } }) => (
                          <TextField
                            {...field}
                            select
                            value={field.value ?? ''}
                            disabled={
                              isDisabled ||
                              hasNoMemberPlanSelected ||
                              isDeactivated
                            }
                            error={Boolean(error)}
                            helperText={error?.message}
                            fullWidth
                            required
                            slotProps={{
                              select: {
                                labelId: labelId('paymentPeriodicity'),
                              },
                            }}
                          >
                            {ALL_PAYMENT_PERIODICITIES.map(pp => (
                              <MenuItem
                                key={pp}
                                value={pp}
                              >
                                {t(`memberPlanList.paymentPeriodicity.${pp}`)}
                              </MenuItem>
                            ))}
                          </TextField>
                        )}
                      />
                    </div>

                    <div>
                      <FormLabel id={labelId('monthlyAmount')}>
                        {toggleRequiredLabel(
                          t('userSubscriptionEdit.periodAmount')
                        )}
                      </FormLabel>

                      <Controller
                        control={control}
                        name="monthlyAmount"
                        render={({ field, fieldState: { error } }) => (
                          <>
                            <CurrencyInput
                              aria-labelledby={labelId('monthlyAmount')}
                              name={field.name}
                              currency={currency}
                              centAmount={periodAmount}
                              onChange={centAmount =>
                                field.onChange(
                                  Math.round(centAmount || 0) /
                                    periodicityMonths
                                )
                              }
                              disabled={
                                isDisabled ||
                                hasNoMemberPlanSelected ||
                                isDeactivated
                              }
                            />

                            {error?.message && (
                              <FormHelperText error>
                                {error.message}
                              </FormHelperText>
                            )}
                          </>
                        )}
                      />
                      {paymentPeriodicity !== PaymentPeriodicity.Monthly && (
                        <FormHelperText>
                          {t('userSubscriptionEdit.monthlyAmountEquivalent', {
                            currency,
                            amount: (monthlyAmount / 100).toFixed(2),
                          })}
                        </FormHelperText>
                      )}
                    </div>
                  </TwoUp>

                  <div>
                    <FormLabel
                      id={labelId('paymentMethod')}
                      required
                    >
                      {t('userSubscriptionEdit.paymentMethod')}
                    </FormLabel>

                    <Controller
                      control={control}
                      name="paymentMethod"
                      render={({ field, fieldState: { error } }) => (
                        <TextField
                          select
                          disabled={
                            isDisabled ||
                            hasNoMemberPlanSelected ||
                            isDeactivated
                          }
                          value={field.value?.id ?? ''}
                          onChange={event =>
                            field.onChange(
                              paymentMethods.find(
                                pm => pm.id === event.target.value
                              )
                            )
                          }
                          error={Boolean(error)}
                          helperText={error?.message}
                          fullWidth
                          required
                          slotProps={{
                            select: { labelId: labelId('paymentMethod') },
                          }}
                        >
                          {paymentMethods.map(pm => (
                            <MenuItem
                              key={pm.id}
                              value={pm.id}
                            >
                              {pm.name}
                            </MenuItem>
                          ))}
                        </TextField>
                      )}
                    />
                  </div>
                </FormFields>
              </CardContent>
            </Card>

            <Card>
              <CardHeader title={t('subscriptionEditView.renewalTitle')} />

              <CardContent>
                <FormFields>
                  <TwoUp>
                    <div>
                      <FormLabel id={labelId('startsAt')}>
                        {t('userSubscriptionEdit.startsAt')}
                      </FormLabel>

                      <Controller
                        control={control}
                        name="startsAt"
                        render={({ field, fieldState: { error } }) => (
                          <DatePicker
                            aria-labelledby={labelId('startsAt')}
                            value={field.value ?? null}
                            disabled={
                              isDisabled ||
                              hasNoMemberPlanSelected ||
                              isDeactivated
                            }
                            onChange={value => field.onChange(value!)}
                            fullWidth
                            error={Boolean(error)}
                            helperText={error?.message}
                          />
                        )}
                      />
                    </div>

                    <div>
                      <FormLabel>
                        <span id={labelId('paidUntil')}>
                          {t('userSubscriptionEdit.paidUntil')}
                        </span>{' '}
                        <InfoTooltip
                          text={t('userSubscriptionEdit.paidUntilInfo')}
                        />
                      </FormLabel>

                      <DatePicker
                        aria-labelledby={labelId('paidUntil')}
                        value={paidUntil ?? null}
                        disabled
                        onChange={() => undefined}
                        fullWidth
                      />
                    </div>
                  </TwoUp>

                  {isTrialMemberPlan && isTrialSubscription && (
                    <Alert
                      icon={<MdCheck />}
                      severity="success"
                    >
                      {t('subscriptionEditView.trialSubscriptionConfigured')}
                    </Alert>
                  )}

                  {isTrialMemberPlan && !isTrialSubscription && (
                    <div>
                      <Button
                        variant="outlined"
                        startIcon={<MdAutoFixHigh />}
                        disabled={isTrialSubscription}
                        onClick={() => {
                          setValue('autoRenew', false);
                          setValue('extendable', false);
                        }}
                        color="success"
                      >
                        {t('subscriptionEditView.configureAsTrialSubscription')}
                      </Button>
                    </div>
                  )}

                  {!isTrialMemberPlan && !isLoading && (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                    >
                      {t('subscriptionEditView.subscriptionTrialNotPossible')}
                    </Typography>
                  )}

                  <div>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={extendable}
                          onChange={(_event, updatedExtendable) => {
                            setValue('extendable', updatedExtendable);

                            if (!updatedExtendable) {
                              setValue('autoRenew', false);
                            }
                          }}
                        />
                      }
                      label={t('memberplanForm.extendableToggle')}
                    />
                    <FormHelperText>
                      {t('memberplanForm.extendableHelpText')}
                    </FormHelperText>
                  </div>

                  {extendable && (
                    <div>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={autoRenew}
                            disabled={
                              isDisabled ||
                              hasNoMemberPlanSelected ||
                              isDeactivated
                            }
                            onChange={(_event, value) =>
                              setValue('autoRenew', value)
                            }
                          />
                        }
                        label={t('userSubscriptionEdit.autoRenew')}
                      />

                      <FormHelperText>
                        {t('userSubscriptionEdit.autoRenewDescription')}
                      </FormHelperText>
                    </div>
                  )}
                </FormFields>
              </CardContent>

              {extendable && (
                <CardFooter>
                  <Button
                    variant="outlined"
                    loading={isDisabled}
                    onClick={() => setExtendModal(true)}
                  >
                    {t('userSubscriptionEdit.renewNow')}
                  </Button>
                </CardFooter>
              )}
            </Card>
          </Columns>

          {id && (
            <InvoiceListPanel
              subscriptionId={id}
              invoices={invoices}
              disabled={!!deactivation}
              onInvoicePaid={async () => reset(await loadSubscription())}
            />
          )}
        </Body>

        {id && user && (
          <Dialog
            fullWidth
            open={isDeactivationPanelOpen}
            maxWidth="sm"
            onClose={() => setDeactivationPanelOpen(false)}
          >
            <UserSubscriptionDeactivatePanel
              displayName={user.name || user.email}
              userEmail={user.email}
              paidUntil={paidUntil ?? undefined}
              onDeactivate={async data => {
                if (await handleDeactivation(data.date, data.reason)) {
                  setDeactivationPanelOpen(false);
                }
              }}
              onClose={() => setDeactivationPanelOpen(false)}
            />
          </Dialog>
        )}

        {actionMailDialog}

        {/* ask user to really reactivate the subscription */}
        <ReactivateSubscriptionModal
          open={isReactivationModalOpen}
          loading={isReactivating}
          userName={user?.name || user?.email}
          memberPlanName={memberPlan?.name}
          monthlyAmount={monthlyAmount}
          paymentPeriodicity={paymentPeriodicity}
          currency={currency}
          paidUntil={paidUntil}
          deactivation={deactivation}
          onClose={() => setReactivationModalOpen(false)}
          onConfirm={() => handleReactivation()}
        />

        {/* ask user to really revert the upgrade */}
        <Dialog
          fullWidth
          open={isRevertUpgradeModalOpen}
          maxWidth="sm"
          onClose={() => setRevertUpgradeModalOpen(false)}
        >
          <DialogTitle>
            {t('userSubscriptionEdit.revertUpgrade.modalTitle')}
          </DialogTitle>

          <DialogContent>
            {t('userSubscriptionEdit.revertUpgrade.modalMessage')}
          </DialogContent>

          <DialogActions>
            <Button
              variant="text"
              onClick={() => setRevertUpgradeModalOpen(false)}
            >
              {t('cancel')}
            </Button>

            <Button
              variant="contained"
              disabled={isRevertingUpgrade}
              onClick={() => handleRevertUpgrade()}
            >
              {t('userSubscriptionEdit.revertUpgrade.confirm')}
            </Button>
          </DialogActions>
        </Dialog>

        {/* ask user to really extend the subscripion */}
        <Dialog
          fullWidth
          open={extendModal}
          maxWidth="sm"
          onClose={() => setExtendModal(false)}
        >
          <DialogTitle>
            {t('subscriptionEditView.extendModalTitle')}
          </DialogTitle>
          <DialogContent>
            {t('subscriptionEditView.extendModalBody')}
          </DialogContent>
          <DialogActions>
            <Button
              variant="text"
              onClick={() => setExtendModal(false)}
            >
              {t('cancel')}
            </Button>

            <Button
              variant="contained"
              onClick={() => handleRenewal()}
            >
              {t('userSubscriptionEdit.renewNow')}
            </Button>
          </DialogActions>
        </Dialog>
      </form>
    </TableWrapper>
  );
}
const CheckedPermissionComponent = createCheckedPermissionComponent([
  CanGetSubscription.id,
  CanGetSubscriptions.id,
  CanCreateSubscription.id,
  CanCancelSubscription.id,
])(SubscriptionEditView);
export { CheckedPermissionComponent as SubscriptionEditView };
