import {zodResolver} from '@hookform/resolvers/zod'
import {Checkbox, FormControlLabel, InputAdornment, Slider, styled} from '@mui/material'
import {
  RegistrationChallenge,
  RegistrationChallengeWrapper,
  UserForm,
  defaultRegisterSchema,
  requiredRegisterSchema,
  useUser
} from '@wepublish/authentication/website'
import {
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
import {formatChf} from '../formatters/format-currency'
import {formatPaymentPeriod, getPaymentPeriodicyMonths} from '../formatters/format-payment-period'
import {formatRenewalPeriod} from '../formatters/format-renewal-period'
import {css} from '@emotion/react'
import {sortBy} from 'ramda'
import {MembershipModal} from '../membership-modal/membership-modal'

const subscribeSchema = z.object({
  memberPlanId: z.string().nonempty(),
  paymentMethodId: z.string().nonempty(),
  extraMoney: z.coerce.number().gte(0).optional(),
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

export const SubscribeExtraMoney = styled('div')`
  display: grid;
  gap: ${({theme}) => theme.spacing(3)};
  grid-template-columns: 1fr;
  align-items: center;
  padding: ${({theme}) => theme.spacing(3)};
  border: 1px solid ${({theme}) => theme.palette.divider};
  border-radius: ${({theme}) => theme.shape.borderRadius}px;

  ${({theme}) => theme.breakpoints.up('sm')} {
    grid-template-columns: 3fr minmax(300px, 1fr);
  }
`

export const Subscribe = <T extends BuilderUserFormFields>({
  defaults,
  memberPlans,
  challenge,
  userSubscriptions,
  userInvoices,
  fields = ['firstName', 'password', 'address'] as T[],
  schema = defaultRegisterSchema,
  className,
  onSubscribe,
  onSubscribeWithRegister
}: BuilderSubscribeProps<T>) => {
  const {
    meta: {locale},
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
        {} as Record<BuilderUserFormFields, true>
      ),
    [fields]
  )

  const loggedOutSchema = useMemo(
    () => requiredRegisterSchema.merge(schema.pick(fieldsToDisplay).merge(subscribeSchema)),
    [fieldsToDisplay, schema]
  )

  const loggedInSchema = subscribeSchema

  const {control, handleSubmit, watch, setValue, resetField} = useForm<
    z.infer<typeof loggedInSchema> | z.infer<typeof loggedOutSchema>
  >({
    resolver: zodResolver(hasUser ? subscribeSchema : loggedOutSchema),
    defaultValues: {
      ...defaults,
      extraMoney: 0,
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
  const extraMoney = watch<'extraMoney'>('extraMoney')
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

  const monthlyAmount = useMemo(
    () => (selectedMemberPlan?.amountPerMonthMin ?? 0) + Math.max(0, extraMoney ?? 0) * 100,
    [selectedMemberPlan?.amountPerMonthMin, extraMoney]
  )

  const paymentText = autoRenew
    ? `${formatRenewalPeriod(selectedPaymentPeriodicity)} für ${formatChf(
        (monthlyAmount / 100) * getPaymentPeriodicyMonths(selectedPaymentPeriodicity),
        locale
      )}`
    : `${formatPaymentPeriod(selectedPaymentPeriodicity)} für ${formatChf(
        (monthlyAmount / 100) * getPaymentPeriodicyMonths(selectedPaymentPeriodicity),
        locale
      )}`

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

    const {address, challengeAnswer, email, password, name, firstName, preferredName} =
      data as z.infer<typeof loggedOutSchema>

    const registerData = {
      email,
      password,
      name,
      firstName,
      preferredName,
      address: address as UserAddressInput,
      challengeAnswer
    } as RegisterMutationVariables

    return callAction(onSubscribeWithRegister)({
      register: registerData,
      subscribe: subscribeData
    })
  })

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
  }, [selectedAvailablePaymentMethod?.forceAutoRenewal, setValue])

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
    return (
      userSubscriptions.data?.subscriptions.some(
        ({memberPlan, deactivation}) => memberPlan.id === selectedMemberPlanId && !deactivation
      ) ?? false
    )
  }, [userSubscriptions.data?.subscriptions, selectedMemberPlanId])

  const hasOpenInvoices = useMemo(
    () =>
      userInvoices.data?.invoices.some(invoice => !invoice.canceledAt && !invoice.paidAt) ?? false,
    [userInvoices.data?.invoices]
  )

  return (
    <SubscribeWrapper className={className} onSubmit={onSubmit} noValidate>
      <SubscribeSection>
        {(memberPlans.data?.memberPlans.nodes.length ?? 0) > 1 && (
          <H5 component="h2">Abo wählen</H5>
        )}

        {hasOpenInvoices && (
          <Alert severity="warning">
            Du hast bereits schon ein Abo mit offenen Rechnungen. Du kannst deine offenen Rechnungen
            in deinem <Link href="/profile/subscription">Abo-Dashboard</Link> anschauen.
          </Alert>
        )}

        {alreadyHasSubscription && (
          <Alert severity="warning">
            Du hast dieses Abo schon, bist du dir sicher? Du kannst deine Abos in deinem{' '}
            <Link href="/profile/subscription">Abo-Dashboard</Link> anschauen.
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

        {memberPlans.error && <Alert severity="error">{memberPlans.error.message}</Alert>}
      </SubscribeSection>

      <SubscribeSection>
        <H5 component="h2">Bonus Unterstützung</H5>

        <Controller
          name={'extraMoney'}
          control={control}
          render={({field, fieldState: {error}}) => (
            <SubscribeExtraMoney>
              <Slider
                {...field}
                min={0}
                max={100}
                valueLabelFormat={val => formatChf(val, locale)}
                step={0.5}
                color="secondary"
              />

              <TextField
                {...field}
                type={'number'}
                fullWidth
                label={'Monatliche Bonus-Unterstützung (optional)'}
                error={!!error}
                helperText={error?.message}
                inputProps={{
                  step: 'any',
                  min: 0
                }}
                InputProps={{
                  startAdornment: <InputAdornment position="start">CHF</InputAdornment>
                }}
              />
            </SubscribeExtraMoney>
          )}
        />
      </SubscribeSection>

      {!hasUser && (
        <SubscribeSection>
          <UserForm control={control} fields={fields} />
        </SubscribeSection>
      )}

      <SubscribeSection>
        <H5 component="h2">Zahlungsmethode wählen</H5>

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
        </SubscribePayment>
      </SubscribeSection>

      {!hasUser && (
        <SubscribeSection>
          <H5 component="h2">Spam-Schutz</H5>

          {challenge.data && (
            <RegistrationChallengeWrapper>
              <RegistrationChallenge
                dangerouslySetInnerHTML={{
                  __html:
                    challenge.data.challenge.challenge
                      ?.replace('#ffffff', 'transparent')
                      .replace('width="200"', '')
                      .replace('height="200"', '') ?? ''
                }}
              />

              <Controller
                name={'challengeAnswer.challengeSolution'}
                control={control}
                render={({field, fieldState: {error}}) => (
                  <TextField
                    {...field}
                    value={field.value ?? ''}
                    label={'Captcha'}
                    error={!!error}
                    helperText={error?.message}
                  />
                )}
              />
            </RegistrationChallengeWrapper>
          )}

          {challenge.error && <Alert severity="error">{challenge.error.message}</Alert>}
        </SubscribeSection>
      )}

      {error && <Alert severity="error">{error.message}</Alert>}

      <Button
        disabled={challenge.loading || userInvoices.loading || userSubscriptions.loading || loading}
        type="submit"
        css={buttonStyles}
        onClick={e => {
          if (hasOpenInvoices || alreadyHasSubscription) {
            e.preventDefault()
            setOpenConfirm(true)
          }
        }}>
        {paymentText} Abonnieren
      </Button>

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
            in deinem <Link href="/profile/subscription">Abo-Dashboard</Link> anschauen.
          </Paragraph>
        )}

        {alreadyHasSubscription && (
          <Paragraph gutterBottom={false}>
            Du hast dieses Abo schon. Du kannst deine Abos in deinem{' '}
            <Link href="/profile/subscription">Abo-Dashboard</Link> anschauen.
          </Paragraph>
        )}
      </MembershipModal>
    </SubscribeWrapper>
  )
}
