import { css, FormControlLabel, Radio, RadioGroup } from '@mui/material';
import {
  BuilderPaymentAmountProps,
  useWebsiteBuilder,
} from '@wepublish/website/builder';
import { Currency } from '@wepublish/website/api';
import { forwardRef, PropsWithChildren, useState } from 'react';
import { formatCurrency } from '../../formatters/format-currency';
import { formatNumber } from '../../formatters/format-number';
import {
  CurrencyNumberSpinner,
  CurrencyNumberSpinnerSnap,
  HelperText,
} from './currency-number-spinner';
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

      ${HelperText} {
        color: ${theme.palette.primary.contrastText};
      }
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

export const StyledCurrencyNumberSpinner = styled(CurrencyNumberSpinner)``;

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
  BuilderPaymentAmountProps & {
    pickerItems: number[];
    format?: string;
    step?: number;
    snap?: CurrencyNumberSpinnerSnap;
    noInitialSelection?: boolean;
  }
>(
  (
    {
      className,
      currency,
      amountPerMonthMin,
      amountPerMonthTarget,
      pickerItems,
      format,
      snap,
      noInitialSelection,
      name,
      error,
      value,
      onChange,
    },
    ref
  ) => {
    const {
      elements: { TextField },
      meta: { locale },
    } = useWebsiteBuilder();

    const [hasInteracted, setHasInteracted] = useState(false);
    const showSelection = !noInitialSelection || hasInteracted;
    const isCustomValue =
      snap ?
        !snap.values.some(v => v * 100 === value)
      : !pickerItems.some(p => p === value);

    return (
      <PaymentAmountPickerWrapper
        className={className}
        name={name}
        onChange={event => {
          if (+event.target.value) {
            setHasInteracted(true);
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
                checked={showSelection && itemAmount === value}
              >
                <PaymentAmountPickerItemAmount>
                  {format ?
                    formatNumber(itemAmount / 100, format, locale)
                  : formatCurrency(itemAmount / 100, currency, locale, false)}
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
              checked={showSelection && isCustomValue}
            >
              <StyledCurrencyNumberSpinner
                value={showSelection ? value / 100 : undefined}
                min={0}
                snap={snap}
                helperText={`Min ${formatCurrency(amountPerMonthMin / 100, currency, locale)}`}
                onValueChange={v => {
                  setHasInteracted(true);
                  if (typeof v === 'number' && v >= 0) {
                    onChange(v ? v * 100 : 0);
                  } else {
                    onChange(0);
                  }
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
