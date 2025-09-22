import styled from '@emotion/styled'
import {FormControlLabel, InputAdornment, OutlinedInput, RadioGroup} from '@mui/material'
import {BuilderPaymentAmountProps, useWebsiteBuilder} from '@wepublish/website/builder'
import {forwardRef} from 'react'

export const PaymentAmountPickerWrapper = styled(RadioGroup)`
  display: grid;
  justify-content: center;
  gap: ${({theme}) => theme.spacing(2)};
  align-items: start;

  label {
    margin: 0;
    display: grid;
    align-items: stretch;

    & > span {
      display: none;
    }
  }
`

const PaymentAmountInput = styled(OutlinedInput)`
  background: #fff;
  // Chrome, Safari, Edge

  & input::-webkit-outer-spin-button, & input::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }

,
  // Firefox
& input [ type = number ] {
  -moz-appearance: textfield;
},

`

export const OnlineReportsPaymentAmount = forwardRef<HTMLInputElement, BuilderPaymentAmountProps>(
  (
    {
      className,
      slug,
      currency,
      amountPerMonthMin,
      amountPerMonthTarget,
      name,
      error,
      value,
      onChange
    },
    ref
  ) => {
    const {
      elements: {TextField},
      meta: {locale, siteTitle}
    } = useWebsiteBuilder()

    return (
      <PaymentAmountPickerWrapper
        className={className}
        name={name}
        onChange={event => {
          if (+event.target.value) {
            onChange(+event.target.value)
          }
        }}
        value={value}>
        <FormControlLabel
          sx={{width: '180px'}}
          value={''}
          control={
            <PaymentAmountInput
              type={'number'}
              inputMode="numeric"
              startAdornment={<InputAdornment position="start">CHF</InputAdornment>}
              value={value ? value / 100 : ''}
              onChange={event => onChange(+event.target.value * 100)}
              inputProps={{
                'aria-label': 'weight',
                inputMode: 'numeric',
                step: 'any'
              }}
            />
          }
          label={'Manuell'}
        />
      </PaymentAmountPickerWrapper>
    )
  }
)

OnlineReportsPaymentAmount.displayName = 'OnlineReportsPaymentAmount'
