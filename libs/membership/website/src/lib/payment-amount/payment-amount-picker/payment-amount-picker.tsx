import { css, FormControlLabel, Radio, RadioGroup } from '@mui/material';
import {
  BuilderPaymentAmountProps,
  useWebsiteBuilder,
} from '@wepublish/website/builder';
import { Currency } from '@wepublish/website/api';
import { forwardRef, PropsWithChildren, useMemo } from 'react';
import { formatCurrency } from '../../formatters/format-currency';
import styled from '@emotion/styled';

export const PaymentAmountPickerWrapper = styled(RadioGroup)`
  display: grid;
  grid-template-columns: repeat(auto-fit, 125px);
  align-items: top;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing(2)};
  align-items: start;

  // hide unwanted label
  label {
    margin: 0;
    display: grid;
    align-items: stretch;

    & > span {
      display: none;
    }
  }
`;

type PaymentAmountPickerItemProps = PropsWithChildren<{
  name?: string;
  currency: Currency;
  checked: boolean;
}>;

export const PaymentAmountPickerItemWrapper = styled('div')<
  Pick<PaymentAmountPickerItemProps, 'checked'>
>`
  position: relative;
  padding: ${({ theme }) => theme.spacing(2)};
  aspect-ratio: 1;
  border: 1px solid ${({ theme }) => theme.palette.divider};
  border-radius: ${({ theme }) => theme.shape.borderRadius}px;
  display: flex;
  align-items: center;
  justify-content: center;

  ${({ checked, theme }) =>
    checked &&
    css`
      color: ${theme.palette.primary.contrastText};
      background: ${theme.palette.primary.light};
    `}
`;

export const PaymentAmountPickerItemCurrency = styled('div')<
  Pick<PaymentAmountPickerItemProps, 'checked'>
>`
  color: ${({ theme }) => theme.palette.grey[500]};
  position: absolute;
  top: 0;
  left: ${({ theme }) => theme.spacing(0.5)};

  ${({ checked, theme }) =>
    checked &&
    css`
      color: ${theme.palette.primary.contrastText};
    `}
`;

export const PaymentAmountPickerItemAmount = styled('div')`
  font-size: ${({ theme }) => theme.typography.h4.fontSize};
  font-weight: 600;
`;

export const PaymentAmountPickerItem = forwardRef<
  HTMLButtonElement,
  PaymentAmountPickerItemProps
>(({ children, checked, currency, ...props }, ref) => (
  <PaymentAmountPickerItemWrapper checked={checked}>
    <PaymentAmountPickerItemCurrency checked={checked}>
      {currency}
    </PaymentAmountPickerItemCurrency>

    <Radio
      ref={ref}
      disableRipple={true}
      sx={{ display: 'none' }}
      {...props}
    />

    {children}
  </PaymentAmountPickerItemWrapper>
));

export const PaymentAmountPicker = forwardRef<
  HTMLInputElement,
  BuilderPaymentAmountProps
>(
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
      onChange,
    },
    ref
  ) => {
    const {
      elements: { TextField },
      meta: { locale, siteTitle },
    } = useWebsiteBuilder();

    const pickerItems = useMemo(() => {
      switch (siteTitle) {
        case 'WNTI':
          return slug?.includes('donate') ?
              [10000, 15000, 20000]
            : [1000, 1500, 2000];
        default:
          return [1000, 1500, 2000];
      }
    }, [siteTitle, slug]);

    return (
      <PaymentAmountPickerWrapper
        className={className}
        name={name}
        onChange={event => {
          if (+event.target.value) {
            onChange(+event.target.value);
          }
        }}
        value={value}
      >
        {pickerItems.map(itemAmount => (
          <FormControlLabel
            key={itemAmount}
            value={itemAmount}
            control={
              <PaymentAmountPickerItem
                currency={currency}
                checked={itemAmount === value}
              >
                <PaymentAmountPickerItemAmount>
                  {formatCurrency(itemAmount / 100, currency, locale, false)}
                </PaymentAmountPickerItemAmount>
              </PaymentAmountPickerItem>
            }
            label={itemAmount}
          />
        ))}

        <FormControlLabel
          value={0}
          control={
            <PaymentAmountPickerItem
              currency={currency}
              checked={false}
            >
              <TextField
                ref={ref}
                name={name}
                value={value / 100}
                onChange={event => onChange(+event.target.value * 100)}
                type={'number'}
                fullWidth
                error={!!error}
                helperText={`Min ${formatCurrency(amountPerMonthMin / 100, currency, locale)}`}
                inputProps={{
                  step: 'any',
                  min: amountPerMonthMin / 100,
                }}
              />
            </PaymentAmountPickerItem>
          }
          label={'Manuell'}
        />
      </PaymentAmountPickerWrapper>
    );
  }
);
