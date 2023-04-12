import {
  Alert,
  CircularProgress,
  css,
  FormControlLabel,
  Link,
  RadioGroup,
  Slider,
  styled,
  TextField,
  Typography
} from '@mui/material'
import {RadioCard as WepRadioCard} from '@wepublish/ui'
import {
  ApiV1,
  BuilderPayInvoicesProps,
  BuilderSubscribeProps,
  PayInvoicesContainer,
  SubscribeContainer,
  useWebsiteBuilder,
  WebsiteBuilderProvider
} from '@wepublish/website'
import {memo, useEffect, useState} from 'react'
import {Controller, useForm} from 'react-hook-form'

export const formatChf = (value: number) => {
  const formatter = new Intl.NumberFormat('ch-DE', {style: 'currency', currency: 'CHF'})
  const result = formatter.format(value)

  if (result.endsWith('.00')) {
    return result.replace('.00', '.-')
  }

  return result
}

const InputForm = styled('div')`
  display: grid;
  gap: ${({theme}) => theme.spacing(3)};
  grid-template-areas:
    'firstname firstname firstname lastname lastname lastname'
    'address address address address address address'
    'zip zip city city country country'
    'email email email password password password';
  margin-bottom: ${({theme}) => theme.spacing(3)};
`

const FirstName = styled(TextField)`
  grid-area: firstname;
`

const LastName = styled(TextField)`
  grid-area: lastname;
`

const Address = styled(TextField)`
  grid-area: address;
`

const Zip = styled(TextField)`
  grid-area: zip;
`

const City = styled(TextField)`
  grid-area: city;
`

const Country = styled(TextField)`
  grid-area: country;
`

const Email = styled(TextField)`
  grid-area: email;
`

const Password = styled(TextField)`
  grid-area: password;
`

const RadioGrid = styled('div')`
  display: grid;
  grid-template-columns: 1fr;
  align-items: stretch;
  gap: ${({theme}) => theme.spacing(1)};
  margin-bottom: ${({theme}) => theme.spacing(6)};

  ${({theme}) => css`
    ${theme.breakpoints.up('md')} {
      grid-template-columns: repeat(3, 1fr);
    }
  `}
`

const RadioCard = styled(WepRadioCard)`
  grid-template-areas:
    'radio children'
    '. title';
  grid-template-columns: min-content auto;
  grid-auto-rows: min-content;
  border: 0;
  align-items: center;
`

const SliderWrapper = styled('div')`
  display: grid;
  grid-template-columns: auto 200px;
  align-items: center;
  gap: ${({theme}) => theme.spacing(3)};
  margin-bottom: ${({theme}) => theme.spacing(6)};
`

const ChallengeWrapper = styled('div')`
  display: grid;
  grid-template-columns: minmax(max-content, 200px) 200px;
  align-items: center;
  gap: ${({theme}) => theme.spacing(3)};
  justify-content: flex-start;
`

const CustomSubscribe = ({
  challenge,
  memberPlans,
  subscribe,
  onSubmit: submit
}: BuilderSubscribeProps) => {
  const {
    elements: {Button},
    blocks: {RichText}
  } = useWebsiteBuilder()

  const {handleSubmit, control, setValue, watch} = useForm({
    defaultValues: {
      monthlyAmount: 0,
      name: '',
      firstName: '',
      streetAddress: '',
      zipCode: '',
      city: '',
      country: '',
      email: '',
      password: '',
      challengeSolution: ''
    },
    mode: 'onSubmit'
  })

  const donationMemberPlans =
    memberPlans.data?.memberPlans.nodes
      .filter(memberPlan => memberPlan.tags?.includes('donation'))
      .sort((a, b) => a.amountPerMonthMin - b.amountPerMonthMin) ?? []

  const [selectedMemberplan, setSelectedMemberplan] = useState<
    typeof donationMemberPlans[0] | undefined
  >(donationMemberPlans[0])

  const onSubmit = handleSubmit(
    ({challengeSolution, streetAddress, zipCode, country, city, ...data}) => {
      return submit({
        ...data,
        address: {
          streetAddress,
          zipCode,
          country,
          city
        },
        challengeAnswer: {
          challengeID: challenge.data!.challenge.challengeID!,
          challengeSolution
        },
        memberPlanID: selectedMemberplan?.id,
        paymentMethodID: selectedMemberplan?.availablePaymentMethods[0]?.paymentMethods[0]?.id,
        paymentPeriodicity: ApiV1.PaymentPeriodicity.Monthly,
        autoRenew: false,
        successURL: `${location.origin}/payment/success`,
        failureURL: `${location.origin}/payment/fail`
      })
    }
  )

  useEffect(() => {
    setValue('monthlyAmount', selectedMemberplan?.amountPerMonthMin || 5000)
  }, [setValue, selectedMemberplan])

  useEffect(() => {
    setValue('challengeSolution', '')
  }, [setValue, challenge])

  return (
    <div>
      {!!donationMemberPlans.length && (
        <RadioGroup
          value={selectedMemberplan?.id ?? null}
          onChange={({target: {value}}) => {
            setSelectedMemberplan(donationMemberPlans.find(memberPlan => memberPlan.id === value))
          }}>
          <RadioGrid>
            {donationMemberPlans.map(memberPlan => (
              <FormControlLabel
                key={memberPlan.id}
                value={memberPlan.id}
                control={
                  <RadioCard
                    label={memberPlan.name}
                    subLabel={<RichText richText={memberPlan.description ?? []} />}>
                    <Typography variant="h4" component="div">
                      {formatChf(Math.max(memberPlan.amountPerMonthMin / 100, 1))}
                    </Typography>
                  </RadioCard>
                }
                label=""
              />
            ))}
          </RadioGrid>
        </RadioGroup>
      )}

      {!!selectedMemberplan && (
        <>
          <SliderWrapper>
            <Controller
              name={'monthlyAmount'}
              control={control}
              rules={{required: true}}
              render={({field: {onChange, value}, fieldState: {error}}) => (
                <>
                  <Slider
                    valueLabelDisplay="auto"
                    min={selectedMemberplan?.amountPerMonthMin || 100}
                    max={1000000}
                    valueLabelFormat={val => formatChf(val / 100)}
                    step={100}
                    value={value}
                    onChange={onChange}
                  />

                  <TextField
                    type={'number'}
                    onChange={event =>
                      onChange(
                        Math.max(+event.target.value * 100, selectedMemberplan!.amountPerMonthMin)
                      )
                    }
                    value={value / 100}
                    label={'Amount'}
                    error={!!error}
                    helperText={error?.message}
                    disabled={!selectedMemberplan}
                  />
                </>
              )}
            />
          </SliderWrapper>

          <Typography variant="h5" component="h2" marginBottom={3}>
            Deine Personalien
          </Typography>

          <InputForm>
            <Controller
              name={'firstName'}
              control={control}
              rules={{required: true}}
              render={({field: {onChange, value}, fieldState: {error}}) => (
                <FirstName
                  onChange={onChange}
                  value={value}
                  label={'Firstname'}
                  error={!!error}
                  helperText={error?.message}
                />
              )}
            />

            <Controller
              name={'name'}
              control={control}
              rules={{required: true}}
              render={({field: {onChange, value}, fieldState: {error}}) => (
                <LastName
                  onChange={onChange}
                  value={value}
                  label={'Name'}
                  error={!!error}
                  helperText={error?.message}
                />
              )}
            />

            <Controller
              name={'streetAddress'}
              control={control}
              rules={{required: true}}
              render={({field: {onChange, value}, fieldState: {error}}) => (
                <Address
                  fullWidth
                  onChange={onChange}
                  value={value}
                  label={'Address'}
                  error={!!error}
                  helperText={error?.message}
                />
              )}
            />

            <Controller
              name={'zipCode'}
              control={control}
              rules={{required: true}}
              render={({field: {onChange, value}, fieldState: {error}}) => (
                <Zip
                  fullWidth
                  onChange={onChange}
                  value={value}
                  label={'Zip'}
                  error={!!error}
                  helperText={error?.message}
                />
              )}
            />

            <Controller
              name={'city'}
              control={control}
              rules={{required: true}}
              render={({field: {onChange, value}, fieldState: {error}}) => (
                <City
                  fullWidth
                  onChange={onChange}
                  value={value}
                  label={'City'}
                  error={!!error}
                  helperText={error?.message}
                />
              )}
            />

            <Controller
              name={'country'}
              control={control}
              rules={{required: true}}
              render={({field: {onChange, value}, fieldState: {error}}) => (
                <Country
                  fullWidth
                  onChange={onChange}
                  value={value}
                  label={'Country'}
                  error={!!error}
                  helperText={error?.message}
                />
              )}
            />

            <Controller
              name={'email'}
              control={control}
              rules={{required: true}}
              render={({field: {onChange, value}, fieldState: {error}}) => (
                <Email
                  type={'email'}
                  fullWidth
                  onChange={onChange}
                  value={value}
                  label={'Email'}
                  error={!!error}
                  helperText={error?.message}
                />
              )}
            />

            <Controller
              name={'password'}
              control={control}
              rules={{required: true}}
              render={({field: {onChange, value}, fieldState: {error}}) => (
                <Password
                  type={'password'}
                  fullWidth
                  onChange={onChange}
                  value={value}
                  label={'Password'}
                  error={!!error}
                  helperText={error?.message}
                />
              )}
            />
          </InputForm>

          <ChallengeWrapper>
            <div
              dangerouslySetInnerHTML={{
                __html:
                  challenge.data?.challenge.challenge
                    ?.replace('#ffffff', 'transparent')
                    .replace('width="200"', '')
                    .replace('height="200"', '') ?? ''
              }}></div>

            <Controller
              name={'challengeSolution'}
              control={control}
              rules={{required: true}}
              render={({field: {onChange, value}, fieldState: {error}}) => (
                <TextField
                  onChange={onChange}
                  value={value}
                  label={'Challenge Solution'}
                  error={!!error}
                  helperText={error?.message}
                />
              )}
            />
          </ChallengeWrapper>

          <Typography variant="h6" component="p" marginBottom={3}>
            <strong>
              Bezahlen kannst du momentan nur mit Twint. Alternativ kannst du eine Zahlung an
              Megaprint AG, Hohlstrasse 207, 8004, CH5404835055588231000 mit dem Zahlunszweck
              Bezeichnung des Benefits z.B. &quot;Domestik&quot; machen und uns per Mail an{' '}
              <Link href="mailto:redaktion@gruppetto-magazin.ch">
                redaktion@gruppetto-magazin.ch
              </Link>{' '}
              informieren.
            </strong>
          </Typography>

          {subscribe.error?.message && (
            <Alert severity="error" sx={{marginBottom: 1}}>
              {subscribe.error?.message}
            </Alert>
          )}

          <Button onClick={() => !subscribe.loading && onSubmit()}>
            Weiter Mit {formatChf(watch('monthlyAmount') / 100)}
          </Button>
        </>
      )}
    </div>
  )
}

const ProgressWrapper = styled('div')`
  display: flex;
  justify-content: center;
`

const PayInvoicesWrapper = styled('div')`
  display: grid;
  gap: ${({theme}) => theme.spacing(2)};
  text-align: center;
`

const CustomPayInvoices = ({invoices, onSubmit, pay}: BuilderPayInvoicesProps) => {
  const {
    elements: {H3, Button}
  } = useWebsiteBuilder()

  if (!invoices) {
    return (
      <ProgressWrapper>
        <CircularProgress />
      </ProgressWrapper>
    )
  }

  if (!invoices.length) {
    return (
      <PayInvoicesWrapper>
        <H3 component="p">Danke für deine Unterstützung!</H3>
      </PayInvoicesWrapper>
    )
  }

  return (
    <PayInvoicesWrapper>
      {pay.error?.message && <Alert severity="error">{pay.error?.message}</Alert>}

      {invoices.map(({invoice, paymentMethod}) => (
        <Button
          key={invoice.id}
          onClick={() =>
            !pay.loading &&
            onSubmit({
              successURL: `${location.origin}/payment/success`,
              failureURL: `${location.origin}/payment/fail`,
              invoiceID: invoice.id,
              paymentMethodID: paymentMethod.id
            })
          }>
          Rechnung für {formatChf(invoice.total / 100)} bezahlen
        </Button>
      ))}
    </PayInvoicesWrapper>
  )
}

const PayInvoices = memo(CustomPayInvoices)
const Subscribe = memo(CustomSubscribe)

export function Donate() {
  return (
    <WebsiteBuilderProvider Subscribe={Subscribe} PayInvoices={PayInvoices}>
      <PayInvoicesContainer />
      <SubscribeContainer />
    </WebsiteBuilderProvider>
  )
}
