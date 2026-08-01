import { css, FormControlLabel, Radio, RadioGroup } from '@mui/material';
import {
  BuilderPaymentAmountProps,
  useWebsiteBuilder,
} from '@wepublish/website/builder';
import {
  Currency,
  SubscribeBlockAmountTileLayout,
} from '@wepublish/website/api';
import { forwardRef, PropsWithChildren, useMemo, useState } from 'react';
import { formatCurrency } from '../../formatters/format-currency';
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

export const PaymentAmountPickerWrapper = styled(RadioGroup, {
  shouldForwardProp: prop => prop !== 'tileLayout',
})<{ tileLayout?: SubscribeBlockAmountTileLayout }>`
  display: grid;
  grid-template-columns: ${({ tileLayout }) =>
    tileLayout === SubscribeBlockAmountTileLayout.Wide ?
      '1fr'
    : 'repeat(2, 1fr)'};
  align-items: top;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing(2)};
  align-items: start;

  ${({ theme }) => theme.breakpoints.up('sm')} {
    grid-template-columns: ${({ tileLayout }) =>
      tileLayout === SubscribeBlockAmountTileLayout.Wide ?
        'repeat(auto-fit, 200px)'
      : 'repeat(auto-fit, 125px)'};
  }

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
  tileLayout?: SubscribeBlockAmountTileLayout;
}>;

export const PaymentAmountPickerItemWrapper = styled('div')<
  Pick<PaymentAmountPickerItemProps, 'checked' | 'tileLayout'>
>`
  position: relative;
  padding: ${({ theme }) => theme.spacing(2)};
  aspect-ratio: 1;
  border: 1px solid ${({ theme }) => theme.palette.divider};
  border-radius: ${({ theme }) => theme.shape.borderRadius}px;
  display: flex;
  align-items: center;
  justify-content: center;

  ${({ tileLayout, theme }) =>
    tileLayout === SubscribeBlockAmountTileLayout.Wide &&
    css`
      aspect-ratio: auto;
      min-height: 96px;
      padding: ${theme.spacing(3)};
      font-size: 1.25em;
    `}

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

export const StyledCurrencyNumberSpinner = styled(CurrencyNumberSpinner, {
  shouldForwardProp: prop => prop !== 'tileLayout',
})<{ tileLayout?: SubscribeBlockAmountTileLayout }>`
  ${({ tileLayout }) =>
    tileLayout === SubscribeBlockAmountTileLayout.Wide &&
    css`
      margin-top: 0;
    `}
`;

export const PaymentAmountPickerItem = forwardRef<
  HTMLButtonElement,
  PaymentAmountPickerItemProps
>(({ children, checked, currency, tileLayout, ...props }, ref) => (
  <PaymentAmountPickerItemWrapper
    checked={checked}
    tileLayout={tileLayout}
  >
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
    pickerItems?: number[];
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
      pickerItems,
      format,
      step,
      snap,
      arrows,
      noInitialSelection,
      name,
      error,
      value,
      onChange,
      presetAmounts,
      tileLayout,
    },
    ref
  ) => {
    const {
      meta: { locale },
    } = useWebsiteBuilder();

    const amounts = useMemo(
      () =>
        pickerItems?.length ? pickerItems
        : presetAmounts?.length ? presetAmounts
        : [1000, 1500, 2000],
      [pickerItems, presetAmounts]
    );

    const isWide = tileLayout === SubscribeBlockAmountTileLayout.Wide;

    const [hasInteracted, setHasInteracted] = useState(false);
    const showSelection = !noInitialSelection || hasInteracted;
    const isCustomValue =
      snap ?
        !snap.values.some(v => v * 100 === value)
      : !amounts.some(p => p === value);

    return (
      <PaymentAmountPickerWrapper
        className={className}
        name={name}
        tileLayout={tileLayout}
        onChange={event => {
          if (+event.target.value) {
            setHasInteracted(true);
            onChange(+event.target.value);
          }
        }}
        value={value}
      >
        {amounts.map(itemAmount => (
          <FormControlLabel
            key={itemAmount}
            value={itemAmount}
            control={
              <PaymentAmountPickerItem
                currency={currency}
                tileLayout={tileLayout}
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
              tileLayout={tileLayout}
              checked={showSelection && isCustomValue}
            >
              <StyledCurrencyNumberSpinner
                tileLayout={tileLayout}
                value={showSelection ? value / 100 : undefined}
                min={amountPerMonthMin / 100}
                step={step}
                snap={snap}
                arrows={arrows ?? (isWide ? 'split' : 'stacked')}
                helperText={`Min ${formatCurrency(amountPerMonthMin / 100, currency, locale)}`}
                onValueChange={v => {
                  setHasInteracted(true);

                  if (typeof v === 'number' && v >= 0) {
                    onChange(v ? Math.round(v * 100) : 0);
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
