import {css, FormControlLabel, Radio, RadioGroup, styled, useRadioGroup} from '@mui/material'
import {BuilderPaymentMethodPickerProps, PaymentMethodPickerWrapper} from '@wepublish/website'
import {ComponentProps, forwardRef, PropsWithChildren, useEffect, useId} from 'react'

import {ReactComponent as Invoice} from './invoice.svg'
import {ReactComponent as Mastercard} from './mastercard.svg'
import {ReactComponent as PayPal} from './paypal.svg'
import {ReactComponent as PostFinance} from './post-finance.svg'
import {ReactComponent as Twint} from './twint.svg'
import {ReactComponent as Visa} from './visa.svg'

const PaymentRadioWrapper = styled('div')<{active?: boolean}>`
  display: grid;
  grid-auto-flow: column;
  gap: ${({theme}) => theme.spacing(1)};
  align-items: center;
  padding: ${({theme}) => theme.spacing(2)};
  border: 1px solid ${({theme}) => theme.palette.divider};
  border-radius: ${({theme}) => theme.shape.borderRadius}px;

  ${({theme, active}) =>
    active &&
    css`
      border-color: ${theme.palette.accent.main};
    `}
`

const icon = css`
  height: 40px;
`

const hiddenRadio = css`
  visibility: hidden;
  width: 0;
  height: 0;
`

function PaymentRadio({children, ...props}: PropsWithChildren<ComponentProps<typeof Radio>>) {
  const radio = useRadioGroup()

  return (
    <>
      <Radio {...props} css={hiddenRadio} />
      <PaymentRadioWrapper active={radio?.value === props.value}>{children}</PaymentRadioWrapper>
    </>
  )
}

export const BajourPaymentMethodPicker = forwardRef<
  HTMLButtonElement,
  BuilderPaymentMethodPickerProps
>(function PaymentMethodPicker({paymentMethods, onChange, value, className, name}, ref) {
  const id = useId()

  useEffect(() => {
    if (paymentMethods?.length && !paymentMethods.some(({id}) => id === value)) {
      onChange(paymentMethods[0].id)
    }
  }, [paymentMethods, onChange, value])

  return (
    <PaymentMethodPickerWrapper className={className}>
      <RadioGroup
        id={id}
        ref={ref}
        name={name}
        value={value ? value : ''}
        onChange={event => onChange(event.target.value)}
        row>
        {paymentMethods?.map(method => (
          <FormControlLabel
            key={method.id}
            value={method.id}
            label=""
            control={
              <PaymentRadio>
                {method.paymentProviderID === 'payrexx' && (
                  <>
                    <Twint css={icon} />
                    <PostFinance css={icon} />
                    <Mastercard css={icon} />
                    <Visa css={icon} />
                  </>
                )}

                {method.paymentProviderID === 'paypal' && (
                  <>
                    <PayPal css={icon} />
                  </>
                )}

                {method.paymentProviderID === 'stripe' && (
                  <>
                    <Mastercard css={icon} />
                    <Visa css={icon} />
                  </>
                )}

                {method.paymentProviderID === 'bexio' && (
                  <>
                    <Invoice css={icon} />
                  </>
                )}
              </PaymentRadio>
            }></FormControlLabel>
        ))}
      </RadioGroup>
    </PaymentMethodPickerWrapper>
  )
})
