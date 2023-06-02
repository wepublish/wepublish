import {
  Alert,
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
import {ApiV1, BuilderSubscribeProps, useUser, useWebsiteBuilder} from '@wepublish/website'
import {memo, useEffect, useState} from 'react'
import {Controller, useForm} from 'react-hook-form'
import {formatChf, monthlyValueToYearly} from './format-chf'
import {RegisterMutationVariables, SubscribeMutationVariables} from '@wepublish/website/api'

const SubscribeWrapper = styled('div')`
  display: grid;
  gap: ${({theme}) => theme.spacing(3)};
`

const InputForm = styled('div')`
  display: grid;
  gap: ${({theme}) => theme.spacing(3)};
  grid-template-areas:
    'firstname firstname firstname lastname lastname lastname'
    'address address address address address address'
    'zip zip city city country country'
    'email email email email email email';
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

const RadioGrid = styled('div')`
  display: grid;
  grid-template-columns: 1fr;
  align-items: stretch;
  gap: ${({theme}) => theme.spacing(1)};

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
  register,
  onSubscribeWithRegister,
  onSubscribe
}: BuilderSubscribeProps) => {
  const {
    elements: {Button, H4, H5, Paragraph},
    blocks: {RichText}
  } = useWebsiteBuilder()

  const {hasUser} = useUser()

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
      challengeSolution: ''
    },
    mode: 'onSubmit'
  })

  const activeMemberplans =
    memberPlans.data?.memberPlans.nodes
      .filter(memberPlan => !memberPlan.tags?.length)
      .sort((a, b) => a.amountPerMonthMin - b.amountPerMonthMin) ?? []

  const [selectedMemberplan, setSelectedMemberplan] = useState<
    typeof activeMemberplans[0] | undefined
  >(activeMemberplans[0])

  const onSubmit = handleSubmit(
    ({challengeSolution, streetAddress, zipCode, country, city, monthlyAmount, ...data}) => {
      const subscribeData: SubscribeMutationVariables = {
        monthlyAmount,
        memberPlanID: selectedMemberplan?.id,
        paymentMethodID: selectedMemberplan?.availablePaymentMethods[0]?.paymentMethods[0]?.id,
        paymentPeriodicity: ApiV1.PaymentPeriodicity.Yearly,
        autoRenew: true,
        successURL: `${location.origin}/payment/success`,
        failureURL: `${location.origin}/payment/fail`
      }

      const registerData: RegisterMutationVariables = {
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
        }
      }

      if (hasUser) {
        return onSubscribe?.(subscribeData)
      }

      return onSubscribeWithRegister?.({
        register: registerData,
        subscribe: subscribeData
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
    <SubscribeWrapper>
      <H4 component={'h3'}>Abonnement lösen</H4>

      {!!activeMemberplans.length && (
        <RadioGroup
          value={selectedMemberplan?.id ?? null}
          onChange={({target: {value}}) => {
            setSelectedMemberplan(activeMemberplans.find(memberPlan => memberPlan.id === value))
          }}>
          <RadioGrid>
            {activeMemberplans.map(memberPlan => (
              <FormControlLabel
                key={memberPlan.id}
                value={memberPlan.id}
                control={
                  <RadioCard
                    label={memberPlan.name}
                    subLabel={<RichText richText={memberPlan.description ?? []} />}>
                    <Typography variant="h4" component="div">
                      {formatChf(monthlyValueToYearly(memberPlan.amountPerMonthMin))}
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
                    min={selectedMemberplan?.amountPerMonthMin}
                    max={1000000}
                    valueLabelFormat={val => formatChf(monthlyValueToYearly(val))}
                    step={100}
                    value={value}
                    onChange={onChange}
                  />

                  <TextField
                    type={'number'}
                    onChange={event =>
                      onChange(
                        Math.max(
                          (+event.target.value * 100) / 12,
                          selectedMemberplan!.amountPerMonthMin
                        )
                      )
                    }
                    value={monthlyValueToYearly(value)}
                    label={'Amount'}
                    error={!!error}
                    helperText={error?.message}
                    disabled={!selectedMemberplan}
                  />
                </>
              )}
            />
          </SliderWrapper>

          {!hasUser && (
            <>
              <H5 component="h2">Deine Personalien</H5>

              <Paragraph>
                (Falls du schon einen Account besizt, <Link href="/login">klicke hier.</Link>)
              </Paragraph>

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
            </>
          )}

          <Typography variant="h6" component="p" marginBottom={3}>
            <strong>
              Bezahlen kannst du momentan nur mit Twint. Alternativ kannst du eine Zahlung an
              Megaprint AG, Hohlstrasse 209, 8004, CH5404835055588231000 mit dem Zahlunszweck
              Bezeichnung des Benefits z.B. &quot;Besenwagen&quot; machen, und uns per Mail an{' '}
              <Link href="mailto:redaktion@gruppetto-magazin.ch">
                redaktion@gruppetto-magazin.ch
              </Link>{' '}
              informieren. Du möchtest mit der Kreditkarte bezahlen. Das kannst du unter folgendem{' '}
              <Link href="https://buy.stripe.com/bIY03h8dTe1T5X2eVa">Link bei Stripe</Link>.
              Informiere uns per Mail, welchen Benefit du gerne möchtest.
            </strong>
          </Typography>

          {subscribe.error?.message && (
            <Alert severity="error" sx={{marginBottom: 1}}>
              {subscribe.error?.message}
            </Alert>
          )}

          {register.error?.message && (
            <Alert severity="error" sx={{marginBottom: 1}}>
              {register.error?.message}
            </Alert>
          )}

          <Button
            onClick={() => !subscribe.loading && onSubmit()}
            disabled={register?.loading || subscribe?.loading}>
            Weiter Mit {formatChf(monthlyValueToYearly(watch('monthlyAmount')))} pro Jahr
          </Button>
        </>
      )}
    </SubscribeWrapper>
  )
}

export const Subscribe = memo(CustomSubscribe)
