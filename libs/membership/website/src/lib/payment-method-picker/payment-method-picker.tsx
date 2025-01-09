import {
  FormControl,
  FormControlLabel,
  Radio,
  RadioGroup,
  css,
  styled,
  useRadioGroup
} from '@mui/material'
import {BuilderPaymentMethodPickerProps, useWebsiteBuilder} from '@wepublish/website/builder'
import {ComponentProps, PropsWithChildren, forwardRef, useEffect, useId} from 'react'

export const PaymentMethodPickerWrapper = styled(FormControl)`
  display: grid;
`

const RadioGroupStyled = styled(RadioGroup)`
  gap: ${({theme}) => theme.spacing(2)};
`

const FormControlLabelStyled = styled(FormControlLabel)`
  margin-right: 0;
`

export const PaymentRadioWrapper = styled('div')<{active?: boolean}>`
  display: grid;
  grid-auto-flow: column;
  align-items: center;
  padding: ${({theme}) => theme.spacing(2)};
  border: 1px solid ${({theme}) => theme.palette.divider};
  border-radius: ${({theme}) => theme.shape.borderRadius}px;
  color: ${({theme}) => theme.palette.primary.main};

  ${({active}) =>
    active &&
    css`
      border-color: currentColor;
    `};
`

const icon = css`
  height: 40px;
`

const hiddenRadio = css`
  visibility: hidden;
  width: 0;
  height: 0;
`

export function PaymentRadio({
  children,
  ...props
}: PropsWithChildren<ComponentProps<typeof Radio>>) {
  const radio = useRadioGroup()

  return (
    <>
      <Radio {...props} css={hiddenRadio} />
      <PaymentRadioWrapper active={radio?.value === props.value}>{children}</PaymentRadioWrapper>
    </>
  )
}

export const PaymentMethodPicker = forwardRef<HTMLButtonElement, BuilderPaymentMethodPickerProps>(
  function PaymentMethodPicker({paymentMethods, onChange, value, className, name}, ref) {
    const id = useId()
    const {
      elements: {Image}
    } = useWebsiteBuilder()

    useEffect(() => {
      if (paymentMethods?.length && !paymentMethods.some(({id}) => id === value)) {
        onChange(paymentMethods[0].id)
      }
    }, [paymentMethods, onChange, value])

    return (
      <PaymentMethodPickerWrapper className={className}>
        <RadioGroupStyled
          id={id}
          ref={ref}
          name={name}
          value={value ? value : ''}
          onChange={event => onChange(event.target.value as string)}
          row>
          {paymentMethods?.map(method => (
            <FormControlLabelStyled
              key={method.id}
              value={method.id}
              label=""
              control={
                <PaymentRadio aria-label={`${method.description} ${method.name}`}>
                  {method.image && <Image image={method.image} css={icon} />}
                </PaymentRadio>
              }></FormControlLabelStyled>
          ))}
        </RadioGroupStyled>
      </PaymentMethodPickerWrapper>
    )
  }
)
