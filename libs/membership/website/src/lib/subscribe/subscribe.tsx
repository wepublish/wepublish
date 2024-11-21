import {zodResolver} from '@hookform/resolvers/zod'
import {Checkbox, FormControlLabel, InputAdornment, Slider, styled} from '@mui/material'
import {
  Challenge,
  UserForm,
  defaultRegisterSchema,
  requiredRegisterSchema,
  useUser,
  zodAlwaysRefine
} from '@wepublish/authentication/website'
import {
  Currency,
  MemberPlan,
  PaymentPeriodicity,
  RegisterMutationVariables,
  SubscribeMutationVariables,
  UserAddressInput
} from '@wepublish/website/api'
import {
  BuilderSubscribeProps,
  BuilderUserFormFields,
  useAsyncAction,
  useWebsiteBuilder
} from '@wepublish/website/builder'
import {useEffect, useMemo, useState} from 'react'
import {Controller, useForm} from 'react-hook-form'
import {z} from 'zod'
import {formatCurrency} from '../formatters/format-currency'
import {formatPaymentPeriod, getPaymentPeriodicyMonths} from '../formatters/format-payment-period'
import {formatRenewalPeriod} from '../formatters/format-renewal-period'
import {css} from '@emotion/react'
import {replace, sortBy, toLower} from 'ramda'
import {MembershipModal} from '../membership-modal/membership-modal'
import {ApolloError} from '@apollo/client'
import {ApiAlert} from '@wepublish/errors/website'

const subscribeSchema = z.object({
  memberPlanId: z.string().min(1),
  paymentMethodId: z.string().min(1),
  monthlyAmount: z.coerce.number().gte(0),
  autoRenew: z.boolean(),
  paymentPeriodicity: z.enum([
    PaymentPeriodicity.Monthly,
    PaymentPeriodicity.Quarterly,
    PaymentPeriodicity.Biannual,
    PaymentPeriodicity.Yearly
  ])
})

export const SubscribeWrapper = styled('form')`
  display: grid;
  gap: ${({theme}) => theme.spacing(5)};
  align-content: start;
`

export const SubscribeSection = styled('div')`
  display: grid;
  gap: ${({theme}) => theme.spacing(3)};
  align-content: start;

  &:empty {
    display: none;
  }
`

export const SubscribePayment = styled('div')`
  display: flex;
  flex-flow: row wrap;
  align-items: center;
  flex-grow: 1;
  column-gap: ${({theme}) => theme.spacing(3)};
  row-gap: ${({theme}) => theme.spacing(2)};

  &:empty {
    display: none;
  }
`

const buttonStyles = css`
  justify-self: center;
`

export const SubscribeAmount = styled('div')`
  display: grid;
  gap: ${({theme}) => theme.spacing(1)};
  grid-template-columns: 1fr;
  align-items: center;
  padding: ${({theme}) => theme.spacing(3)};
  border: 1px solid ${({theme}) => theme.palette.divider};
  border-radius: ${({theme}) => theme.shape.borderRadius}px;
`

export const SubscribeAmountSlider = styled('div')`
  display: grid;
  grid-template-columns: 1fr;
  gap: ${({theme}) => theme.spacing(3)};
  align-items: center;

  ${({theme}) => theme.breakpoints.up('md')} {
    grid-auto-flow: column;
    grid-auto-columns: 300px;
  }
`

export const SubscribeAmountText = styled('p')`
  text-align: center;
`

export const SubscribeCancelable = styled('div')`
  text-align: center;
  color: ${({theme}) => theme.palette.grey[500]};
`

export const SubscribeNarrowSection = styled(SubscribeSection)`
  gap: ${({theme}) => theme.spacing(1)};
`

export const getPaymentText = (
  autoRenew: boolean,
  extendable: boolean,
  paymentPeriodicity: PaymentPeriodicity,
  monthlyAmount: number,
  currency: Currency,
  locale: string
) =>
  autoRenew && extendable
    ? `${formatRenewalPeriod(paymentPeriodicity)} für ${formatCurrency(
        (monthlyAmount / 100) * getPaymentPeriodicyMonths(paymentPeriodicity),
        currency,
        locale
      )}`
    : extendable
    ? `${formatPaymentPeriod(paymentPeriodicity)} für ${formatCurrency(
        (monthlyAmount / 100) * getPaymentPeriodicyMonths(paymentPeriodicity),
        currency,
        locale
      )}`
    : `Für ${formatCurrency(
        (monthlyAmount / 100) * getPaymentPeriodicyMonths(paymentPeriodicity),
        currency,
        locale
      )}`

const extraMoneyOffsetDefault = () => 0

export const Subscribe = <T extends Exclude<BuilderUserFormFields, 'flair'>>({
  defaults,
  extraMoneyOffset = extraMoneyOffsetDefault,
  memberPlans,
  challenge,
  userSubscriptions,
  userInvoices,
  fields = ['firstName', 'password', 'passwordRepeated', 'address'] as T[],
  schema = defaultRegisterSchema,
  className,
  onSubscribe,
  onSubscribeWithRegister,
  deactivateSubscriptionId,
  termsOfServiceUrl,
  donate
}: BuilderSubscribeProps<T>) => {
  const {
    meta: {locale, siteTitle},
    elements: {Alert, Button, TextField, H5, Link, Paragraph},
    MemberPlanPicker,
    PaymentMethodPicker,
    PeriodicityPicker
  } = useWebsiteBuilder()
  const {hasUser} = useUser()
  const [openConfirm, setOpenConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error>()
  const callAction = useAsyncAction(setLoading, setError)

  const fieldsToDisplay = useMemo(
    () =>
      fields.reduce(
        (obj, field) => ({...obj, [field]: true}),
        {} as Record<Exclude<BuilderUserFormFields, 'flair'>, true>
      ),
    [fields]
  )

  /**
   * Done like this to avoid type errors due to z.ZodObject vs z.ZodEffect<z.ZodObject>.
   * [Fixed with Zod 4](https://github.com/colinhacks/zod/issues/2474)
   */
  const loggedOutSchema = useMemo(() => {
    const result = requiredRegisterSchema.merge(schema.pick(fieldsToDisplay).merge(subscribeSchema))

    if (fieldsToDisplay.passwordRepeated) {
      return zodAlwaysRefine(result).refine(data => data.password === data.passwordRepeated, {
        message: 'Passwörter stimmen nicht überein.',
        path: ['passwordRepeated']
      })
    }

    return result
  }, [fieldsToDisplay, schema])

  const loggedInSchema = subscribeSchema

  const {control, handleSubmit, watch, setValue, resetField} = useForm<
    z.infer<typeof loggedInSchema> | z.infer<typeof loggedOutSchema>
  >({
    resolver: zodResolver(hasUser ? loggedInSchema : loggedOutSchema),
    defaultValues: {
      ...defaults,
      monthlyAmount: 0,
      autoRenew: true,
      memberPlanId: defaults?.memberPlanSlug
        ? memberPlans.data?.memberPlans.nodes.find(
            memberPlan => memberPlan.slug === defaults?.memberPlanSlug
          )?.id
        : memberPlans.data?.memberPlans.nodes[0]?.id,
      paymentMethodId:
        memberPlans.data?.memberPlans.nodes[0]?.availablePaymentMethods[0]?.paymentMethods[0]?.id,
      paymentPeriodicity:
        memberPlans.data?.memberPlans.nodes[0]?.availablePaymentMethods[0]?.paymentPeriodicities[0]
    },
    mode: 'onTouched',
    reValidateMode: 'onChange'
  })

  const selectedPaymentMethodId = watch<'paymentMethodId'>('paymentMethodId')
  const selectedPaymentPeriodicity = watch<'paymentPeriodicity'>('paymentPeriodicity')
  const selectedMemberPlanId = watch<'memberPlanId'>('memberPlanId')
  const monthlyAmount = watch<'monthlyAmount'>('monthlyAmount')
  const autoRenew = watch<'autoRenew'>('autoRenew')

  const sortedMemberPlans = useMemo(
    () =>
      sortBy(
        (memberPlan: MemberPlan) => memberPlan.amountPerMonthMin,
        memberPlans.data?.memberPlans.nodes ?? []
      ),
    [memberPlans.data?.memberPlans.nodes]
  )

  const selectedMemberPlan = useMemo(
    () =>
      memberPlans.data?.memberPlans.nodes.find(
        memberPlan => memberPlan.id === selectedMemberPlanId
      ),
    [memberPlans.data?.memberPlans.nodes, selectedMemberPlanId]
  )

  const selectedAvailablePaymentMethod = useMemo(
    () =>
      selectedMemberPlan?.availablePaymentMethods.find(memberPlan =>
        memberPlan.paymentMethods.find(({id}) => id === selectedPaymentMethodId)
      ),
    [selectedMemberPlan?.availablePaymentMethods, selectedPaymentMethodId]
  )

  const allPaymentMethods = useMemo(
    () =>
      selectedMemberPlan?.availablePaymentMethods?.flatMap(({paymentMethods}) => paymentMethods),
    [selectedMemberPlan?.availablePaymentMethods]
  )

  const paymentText = getPaymentText(
    autoRenew,
    selectedMemberPlan?.extendable ?? true,
    selectedPaymentPeriodicity,
    monthlyAmount,
    selectedMemberPlan?.currency ?? Currency.Chf,
    locale
  )

  const monthlyPaymentText = getPaymentText(
    true,
    selectedMemberPlan?.extendable ?? true,
    PaymentPeriodicity.Monthly,
    monthlyAmount,
    selectedMemberPlan?.currency ?? Currency.Chf,
    locale
  )

  const onSubmit = handleSubmit(data => {
    const subscribeData: SubscribeMutationVariables = {
      monthlyAmount,
      memberPlanId: data.memberPlanId,
      paymentMethodId: data.paymentMethodId,
      paymentPeriodicity: data.paymentPeriodicity,
      autoRenew: data.autoRenew
    }

    if (hasUser) {
      return callAction(onSubscribe)(subscribeData)
    }

    const {address, challengeAnswer, email, birthday, password, name, firstName} = data as z.infer<
      typeof loggedOutSchema
    >

    const registerData = {
      birthday,
      email,
      password,
      name,
      firstName,
      address: address as UserAddressInput,
      challengeAnswer
    } as RegisterMutationVariables

    return callAction(onSubscribeWithRegister)({
      register: registerData,
      subscribe: subscribeData
    })
  })

  useEffect(() => {
    if (selectedMemberPlan) {
      setValue<'monthlyAmount'>(
        'monthlyAmount',
        selectedMemberPlan.amountPerMonthMin + extraMoneyOffset(selectedMemberPlan)
      )
    }
  }, [selectedMemberPlan, extraMoneyOffset, setValue])

  useEffect(() => {
    if (challenge.data?.challenge.challengeID) {
      setValue<'challengeAnswer.challengeID'>(
        'challengeAnswer.challengeID',
        challenge.data.challenge.challengeID
      )
    }
  }, [challenge, setValue])

  useEffect(() => {
    if (selectedAvailablePaymentMethod?.forceAutoRenewal) {
      setValue<'autoRenew'>('autoRenew', true)
    }

    if (!selectedMemberPlan?.extendable) {
      setValue<'autoRenew'>('autoRenew', false)
    }
  }, [selectedAvailablePaymentMethod?.forceAutoRenewal, selectedMemberPlan?.extendable, setValue])

  useEffect(() => {
    if (
      selectedPaymentMethodId &&
      !allPaymentMethods?.find(({id}) => id === selectedPaymentMethodId)
    ) {
      resetField('paymentMethodId')
    }
  }, [resetField, allPaymentMethods, selectedPaymentMethodId])

  useEffect(() => {
    if (
      !selectedAvailablePaymentMethod?.paymentPeriodicities.includes(selectedPaymentPeriodicity)
    ) {
      resetField('paymentPeriodicity')
    }
  }, [selectedAvailablePaymentMethod, resetField, selectedPaymentPeriodicity])

  const alreadyHasSubscription = useMemo(() => {
    if (deactivateSubscriptionId) {
      return
    }

    return (
      userSubscriptions.data?.subscriptions.some(
        ({memberPlan, deactivation}) => memberPlan.id === selectedMemberPlanId && !deactivation
      ) ?? false
    )
  }, [deactivateSubscriptionId, userSubscriptions.data?.subscriptions, selectedMemberPlanId])

  const hasOpenInvoices = useMemo(() => {
    if (deactivateSubscriptionId) {
      return
    }

    return (
      userInvoices.data?.invoices.some(invoice => !invoice.canceledAt && !invoice.paidAt) ?? false
    )
  }, [deactivateSubscriptionId, userInvoices.data?.invoices])

  const amountPerMonthMin = selectedMemberPlan?.amountPerMonthMin || 500

  return (
    <SubscribeWrapper className={className} onSubmit={onSubmit} noValidate>
      <SubscribeSection>
        {(memberPlans.data?.memberPlans.nodes.length ?? 0) > 1 && (
          <H5 component="h2">Abo wählen</H5>
        )}

        {hasOpenInvoices && (
          <Alert severity="warning">
            Du hast bereits schon ein Abo mit offenen Rechnungen. Du kannst deine offenen Rechnungen
            in deinem <Link href="/profile">Profil</Link> anschauen.
          </Alert>
        )}

        {alreadyHasSubscription && (
          <Alert severity="warning">
            Du hast dieses Abo schon, bist du dir sicher? Du kannst deine Abos in deinem{' '}
            <Link href="/profile">Profil</Link> anschauen.
          </Alert>
        )}

        <Controller
          name={'memberPlanId'}
          control={control}
          render={({field}) => (
            <MemberPlanPicker
              {...field}
              onChange={memberPlanId => field.onChange(memberPlanId)}
              memberPlans={sortedMemberPlans}
            />
          )}
        />

        {memberPlans.error && <ApiAlert error={memberPlans.error} severity="error" />}
      </SubscribeSection>

      <SubscribeSection>
        <Controller
          name={'monthlyAmount'}
          control={control}
          render={({field, fieldState: {error}}) => (
            <SubscribeAmount>
              <Paragraph component={SubscribeAmountText} gutterBottom={false}>
                Ich unterstütze {siteTitle} {replace(/^./, toLower)(monthlyPaymentText)}
              </Paragraph>

              <SubscribeAmountSlider>
                <Slider
                  {...field}
                  min={amountPerMonthMin}
                  max={amountPerMonthMin * 5}
                  valueLabelFormat={val =>
                    formatCurrency(val / 100, selectedMemberPlan?.currency ?? Currency.Chf, locale)
                  }
                  step={100}
                  color="secondary"
                />

                {donate?.(selectedMemberPlan) && (
                  <TextField
                    {...field}
                    value={field.value / 100}
                    onChange={event => field.onChange(+event.target.value * 100)}
                    type={'number'}
                    fullWidth
                    inputProps={{
                      step: 'any',
                      min: amountPerMonthMin / 100
                    }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          {selectedMemberPlan?.currency ?? Currency.Chf}
                        </InputAdornment>
                      )
                    }}
                  />
                )}
              </SubscribeAmountSlider>
            </SubscribeAmount>
          )}
        />

        {!hasUser && <UserForm control={control} fields={fields} />}
      </SubscribeSection>

      <SubscribeSection>
        {allPaymentMethods && allPaymentMethods.length > 1 && (
          <H5 component="h2">Zahlungsmethode wählen</H5>
        )}

        <SubscribePayment>
          <Controller
            name={'paymentMethodId'}
            control={control}
            render={({field}) => (
              <PaymentMethodPicker
                {...field}
                onChange={paymentMethodId => field.onChange(paymentMethodId)}
                paymentMethods={allPaymentMethods}
              />
            )}
          />

          <Controller
            name={'paymentPeriodicity'}
            control={control}
            render={({field}) => (
              <PeriodicityPicker
                {...field}
                onChange={periodicity => field.onChange(periodicity)}
                periodicities={selectedAvailablePaymentMethod?.paymentPeriodicities}
              />
            )}
          />

          {!selectedAvailablePaymentMethod?.forceAutoRenewal && selectedMemberPlan?.extendable && (
            <Controller
              name={'autoRenew'}
              control={control}
              render={({field}) => (
                <FormControlLabel
                  {...field}
                  control={
                    <Checkbox
                      checked={field.value}
                      disabled={selectedAvailablePaymentMethod?.forceAutoRenewal}
                    />
                  }
                  label="Automatisch erneuern"
                />
              )}
            />
          )}
        </SubscribePayment>
      </SubscribeSection>

      {!hasUser && (
        <SubscribeSection>
          <H5 component="h2">Spam-Schutz</H5>

          {challenge.data?.challenge && (
            <Controller
              name={'challengeAnswer.challengeSolution'}
              control={control}
              render={({field, fieldState: {error}}) => (
                <Challenge
                  {...field}
                  onChange={field.onChange}
                  challenge={challenge.data!.challenge}
                  label={'Captcha'}
                  error={!!error}
                  helperText={error?.message}
                />
              )}
            />
          )}

          {challenge.error && <ApiAlert error={challenge.error} severity="error" />}
        </SubscribeSection>
      )}
      {error && <ApiAlert error={error as ApolloError} severity="error" />}

      <SubscribeNarrowSection>
        <Button
          size={'large'}
          disabled={
            challenge.loading || userInvoices.loading || userSubscriptions.loading || loading
          }
          type="submit"
          css={buttonStyles}
          onClick={e => {
            if (hasOpenInvoices || alreadyHasSubscription) {
              e.preventDefault()
              setOpenConfirm(true)
            }
          }}>
          {paymentText} {donate?.(selectedMemberPlan) ? 'spenden' : 'abonnieren'}
        </Button>

        {autoRenew && termsOfServiceUrl ? (
          <Link underline={'hover'} href={termsOfServiceUrl}>
            <SubscribeCancelable>Jederzeit kündbar</SubscribeCancelable>
          </Link>
        ) : (
          autoRenew && <SubscribeCancelable>Jederzeit kündbar</SubscribeCancelable>
        )}
      </SubscribeNarrowSection>

      <MembershipModal
        open={openConfirm}
        onSubmit={() => {
          onSubmit()
          setOpenConfirm(false)
        }}
        onCancel={() => setOpenConfirm(false)}
        submitText={`${paymentText} Abonnieren`}>
        <H5 id="modal-modal-title" component="h1">
          Bist du dir sicher?
        </H5>

        {hasOpenInvoices && (
          <Paragraph gutterBottom={false}>
            Du hast bereits schon ein Abo mit offenen Rechnungen. Du kannst deine offenen Rechnungen
            in deinem <Link href="/profile">Profil</Link> anschauen.
          </Paragraph>
        )}

        {alreadyHasSubscription && (
          <Paragraph gutterBottom={false}>
            Du hast dieses Abo schon. Du kannst deine Abos in deinem{' '}
            <Link href="/profile">Profil</Link> anschauen.
          </Paragraph>
        )}
      </MembershipModal>
    </SubscribeWrapper>
  )
}
