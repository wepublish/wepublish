import { css, FormControlLabel, Radio, RadioGroup } from '@mui/material';
import {
  BuilderPaymentAmountProps,
  useWebsiteBuilder,
} from '@wepublish/website/builder';
import {
  Currency,
  SubscribeBlockAmountTileLayout,
} from '@wepublish/website/api';
import { forwardRef, PropsWithChildren, useMemo } from 'react';
import { formatCurrency } from '../../formatters/format-currency';
import styled from '@emotion/styled';
import { CurrencyNumberSpinner, HelperText } from './currency-number-spinner';

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

const TileSpinner = styled(CurrencyNumberSpinner)`
  margin-top: 0;
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
  BuilderPaymentAmountProps
>(
  (
    {
      className,
      currency,
      amountPerMonthMin,
      amountPerMonthTarget,
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

    const pickerItems = useMemo(
      () => (presetAmounts?.length ? presetAmounts : [1000, 1500, 2000]),
      [presetAmounts]
    );

    const isWide = tileLayout === SubscribeBlockAmountTileLayout.Wide;

    return (
      <PaymentAmountPickerWrapper
        className={className}
        name={name}
        tileLayout={tileLayout}
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
                tileLayout={tileLayout}
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
              tileLayout={tileLayout}
              checked={!pickerItems.includes(value)}
            >
              <TileSpinner
                arrows={isWide ? 'split' : 'stacked'}
                min={amountPerMonthMin / 100}
                step={1}
                value={value / 100}
                onValueChange={spinnerValue => {
                  if (spinnerValue != null) {
                    onChange(Math.round(spinnerValue * 100));
                  }
                }}
                helperText={`Min ${formatCurrency(amountPerMonthMin / 100, currency, locale)}`}
              />
            </PaymentAmountPickerItem>
          }
          label={'Manuell'}
        />
      </PaymentAmountPickerWrapper>
    );
  }
);
