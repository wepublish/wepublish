import { FormControl, InputLabel, Select } from '@mui/material';
import styled from '@emotion/styled';
import { PaymentPeriodicity } from '@wepublish/website/api';
import {
  BuilderPeriodicityPickerProps,
  useWebsiteBuilder,
} from '@wepublish/website/builder';
import { forwardRef, useEffect, useId } from 'react';
import { formatCurrency } from '../formatters/format-currency';
import {
  getPeriodicityLabel,
  getPeriodPriceRange,
} from '../formatters/format-payment-period';
import { formatRenewalPeriod } from '../formatters/format-renewal-period';

export const PeriodicityPickerWrapper = styled(FormControl)`
  display: grid;
`;

export const PeriodicityPicker = forwardRef<
  HTMLButtonElement,
  BuilderPeriodicityPickerProps
>(function PeriodicityPicker(
  { periodicities, memberPlan, onChange, value, className, name },
  ref
) {
  const {
    meta: { locale },
  } = useWebsiteBuilder();
  const id = useId();
  const show = periodicities && periodicities.length > 1;

  useEffect(() => {
    if (periodicities?.length && !value) {
      onChange(periodicities[0]);
    }
  }, [periodicities, onChange, value]);

  if (!show) {
    return null;
  }

  const formatOption = (period: PaymentPeriodicity): string => {
    const base = formatRenewalPeriod(period);

    if (!memberPlan) {
      return base;
    }

    const priceRange = getPeriodPriceRange(memberPlan, period);
    const isFixed =
      priceRange.amountMax != null &&
      priceRange.amountMax === priceRange.amountMin;
    const price = `${isFixed ? '' : 'ab '}${formatCurrency(
      priceRange.amountMin / 100,
      memberPlan.currency,
      locale
    )}`;
    const label = getPeriodicityLabel(memberPlan, period);

    return `${base} – ${price}${label ? ` (${label})` : ''}`;
  };

  return (
    <PeriodicityPickerWrapper className={className}>
      <>
        <InputLabel htmlFor={id}>Zahlungsintervall</InputLabel>

        <Select
          native
          label={'Zahlungsintervall'}
          ref={ref}
          name={name}
          onChange={event => onChange(event.target.value as PaymentPeriodicity)}
          value={value ? value : ''}
          id={id}
        >
          {periodicities.map(period => (
            <option
              key={period}
              value={period}
            >
              {formatOption(period)}
            </option>
          ))}
        </Select>
      </>
    </PeriodicityPickerWrapper>
  );
});
