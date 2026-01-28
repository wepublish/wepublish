import { FormControl, InputLabel, Select } from '@mui/material';
import styled from '@emotion/styled';
import { PaymentPeriodicity } from '@wepublish/website/api';
import { BuilderPeriodicityPickerProps } from '@wepublish/website/builder';
import { forwardRef, useEffect, useId } from 'react';
import { formatRenewalPeriod } from '../formatters/format-renewal-period';

export const PeriodicityPickerWrapper = styled(FormControl)`
  display: grid;
`;

export const PeriodicityPicker = forwardRef<
  HTMLButtonElement,
  BuilderPeriodicityPickerProps
>(function PeriodicityPicker(
  { periodicities, onChange, value, className, name },
  ref
) {
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
              {formatRenewalPeriod(period)}
            </option>
          ))}
        </Select>
      </>
    </PeriodicityPickerWrapper>
  );
});
