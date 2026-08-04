import { css, FormControlLabel, Radio, RadioGroup } from '@mui/material';
import {
  BuilderPaymentAmountProps,
  useWebsiteBuilder,
} from '@wepublish/website/builder';
import { Currency, PaymentPeriodicity } from '@wepublish/website/api';
import { forwardRef, PropsWithChildren, useState } from 'react';
import { formatCurrency } from '../../formatters/format-currency';
import {
  calculatePeriodAmount,
  monthlyAmountFromPeriodAmount,
} from '../../formatters/format-payment-period';
import {
  CurrencyNumberSpinner,
  CurrencyNumberSpinnerSnap,
  HelperText,
} from './currency-number-spinner';
import styled from '@emotion/styled';

const formatNumber = (value: number, format: string, locale = 'de-CH') => {
  const [intPart = '', fracPart = ''] = format.split('.');
  const useGrouping = intPart.includes(',');

  const minimumIntegerDigits = Math.max(1, (intPart.match(/0/g) || []).length);
  const minimumFractionDigits = (fracPart.match(/0/g) || []).length;
  const maximumFractionDigits = Math.max(
    minimumFractionDigits,
    (fracPart.match(/[0#]/g) || []).length
  );

  return new Intl.NumberFormat(locale, {
    style: 'decimal',
    minimumIntegerDigits,
    minimumFractionDigits,
    maximumFractionDigits,
    useGrouping,
  }).format(value);
};

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
    arrows?: 'split' | 'stacked';
    noInitialSelection?: boolean;
  }
>(
  (
    {
      className,
      currency,
      amountPerMonthMin,
      amountPerMonthTarget,
      paymentPeriodicity = PaymentPeriodicity.Monthly,
      pickerItems,
      format,
      snap,
      arrows,
      noInitialSelection,
      name,
      error,
      value,
      onChange,
    },
    ref
  ) => {
    const {
      meta: { locale },
    } = useWebsiteBuilder();

    const periodValue = calculatePeriodAmount(value, paymentPeriodicity);
    const periodMin = calculatePeriodAmount(
      amountPerMonthMin,
      paymentPeriodicity
    );
    const handlePeriodAmountChange = (periodAmount: number) =>
      onChange(
        monthlyAmountFromPeriodAmount(
          Math.round(periodAmount),
          paymentPeriodicity
        )
      );

    const [hasInteracted, setHasInteracted] = useState(false);
    const showSelection = !noInitialSelection || hasInteracted;
    const isCustomValue =
      snap ?
        !snap.values.some(v => v * 100 === periodValue)
      : !pickerItems.some(p => p === periodValue);

    return (
      <PaymentAmountPickerWrapper
        className={className}
        name={name}
        onChange={event => {
          if (+event.target.value) {
            setHasInteracted(true);
            handlePeriodAmountChange(+event.target.value);
          }
        }}
        value={periodValue}
      >
        {pickerItems.map(itemAmount => (
          <FormControlLabel
            key={itemAmount}
            value={itemAmount}
            control={
              <PaymentAmountPickerItem
                currency={currency}
                checked={showSelection && itemAmount === periodValue}
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
                value={
                  showSelection ? Math.round(periodValue) / 100 : undefined
                }
                min={periodMin / 100}
                snap={snap}
                arrows={arrows}
                helperText={`Min ${formatCurrency(periodMin / 100, currency, locale)}`}
                onValueChange={v => {
                  setHasInteracted(true);
                  if (typeof v === 'number' && v >= 0) {
                    handlePeriodAmountChange(v ? v * 100 : 0);
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
