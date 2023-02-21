import {FormControlLabel, RadioGroup, Slider, styled, TextField, Typography} from '@mui/material'
import {SubscribeContainer} from '@wepublish/membership/website'
import {RadioCard} from '@wepublish/ui'
import {
  BuilderSubscribeProps,
  useWebsiteBuilder,
  WebsiteBuilderProvider
} from '@wepublish/website-builder'
import {PaymentPeriodicity} from '@wepublish/website/api'
import {useEffect, useState} from 'react'
import {Controller, useForm} from 'react-hook-form'

const chfFormatter = new Intl.NumberFormat('ch-DE', {style: 'currency', currency: 'CHF'})

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
  grid-template-columns: repeat(4, 1fr);
  align-items: stretch;
  gap: ${({theme}) => theme.spacing(1)};
  margin-bottom: ${({theme}) => theme.spacing(6)};
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
  grid-template-columns: auto 200px;
  align-items: center;
  gap: ${({theme}) => theme.spacing(3)};
  justify-content: flex-start;
`

const CustomSubscribe = ({challenge, memberPlans, onSubmit: submit}: BuilderSubscribeProps) => {
  const {Button} = useWebsiteBuilder()

  const {
    handleSubmit,
    control,
    formState: {errors},
    setValue
  } = useForm({
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
        paymentPeriodicity: PaymentPeriodicity.Monthly,
        challengeAnswer: {
          challengeID: challenge.data!.challenge.challengeID!,
          challengeSolution
        },
        memberPlanID: selectedMemberplan?.id,
        paymentMethodID: selectedMemberplan?.availablePaymentMethods[0]?.paymentMethods[0]?.id
      })
    }
  )

  useEffect(() => {
    setValue('monthlyAmount', selectedMemberplan?.amountPerMonthMin || 100)
  }, [setValue, selectedMemberplan])

  return (
    <div style={{marginTop: 50}}>
      {donationMemberPlans.length && (
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
                  <RadioCard label={memberPlan.name} subLabel={'Telefon'}>
                    <Typography variant="h6" component="div">
                      {chfFormatter.format(memberPlan.amountPerMonthMin / 100)}
                    </Typography>
                  </RadioCard>
                }
                label=""
              />
            ))}
          </RadioGrid>
        </RadioGroup>
      )}

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
                valueLabelFormat={val => chfFormatter.format(val / 100)}
                step={100}
                value={value}
                onChange={onChange}
                disabled={!selectedMemberplan}
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
        <div dangerouslySetInnerHTML={{__html: challenge.data?.challenge.challenge ?? ''}}></div>

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

      <Button onClick={onSubmit}>Submit</Button>
    </div>
  )
}

export function Donate() {
  return (
    <WebsiteBuilderProvider Subscribe={CustomSubscribe}>
      <SubscribeContainer />
    </WebsiteBuilderProvider>
  )
}

export default Donate
