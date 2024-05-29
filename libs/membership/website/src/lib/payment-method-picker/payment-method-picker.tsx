import {FormControl, InputLabel, Select, styled} from '@mui/material'
import {PaymentPeriodicity} from '@wepublish/website/api'
import {BuilderPaymentMethodPickerProps} from '@wepublish/website/builder'
import {forwardRef, useEffect, useId} from 'react'

export const PaymentMethodPickerWrapper = styled(FormControl)`
  display: grid;
`

export const PaymentMethodPicker = forwardRef<HTMLButtonElement, BuilderPaymentMethodPickerProps>(
  function PaymentMethodPicker({paymentMethods, onChange, value, className, name}, ref) {
    const id = useId()
    const show = paymentMethods && paymentMethods.length > 1

    useEffect(() => {
      if (paymentMethods?.length && !paymentMethods.some(({id}) => id === value)) {
        onChange(paymentMethods[0].id)
      }
    }, [paymentMethods, onChange, value])

    if (!show) {
      return null
    }

    return (
      <PaymentMethodPickerWrapper className={className}>
        <>
          <InputLabel htmlFor={id}>Zahlungsmethode</InputLabel>

          <Select
            native
            label={'Zahlungsmethode'}
            ref={ref}
            name={name}
            onChange={event => onChange(event.target.value as PaymentPeriodicity)}
            value={value ? value : ''}
            id={id}>
            {paymentMethods.map(method => (
              <option key={method.id} value={method.id}>
                {method.description}
              </option>
            ))}
          </Select>
        </>
      </PaymentMethodPickerWrapper>
    )
  }
)
