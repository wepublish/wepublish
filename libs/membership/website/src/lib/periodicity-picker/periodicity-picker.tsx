import {
  FormControl,
  InputLabel,
  Select,
  ToggleButton,
  ToggleButtonGroup,
  lighten,
} from '@mui/material';
import styled from '@emotion/styled';
import { PaymentPeriodicity } from '@wepublish/website/api';
import { BuilderPeriodicityPickerProps } from '@wepublish/website/builder';
import { forwardRef, useEffect, useId } from 'react';
import { formatRenewalPeriod } from '../formatters/format-renewal-period';
import { useTranslation } from 'react-i18next';

export const PeriodicityPickerWrapper = styled(FormControl)`
  display: grid;
`;

export const PeriodicityToggleGroup = styled(ToggleButtonGroup)`
  justify-self: center;

  .MuiToggleButton-root.Mui-selected {
    color: inherit;
    border-color: ${({ theme }) => theme.palette.primary.main};
    background-color: ${({ theme }) =>
      lighten(theme.palette.primary.main, 0.85)};

    &:hover {
      background-color: ${({ theme }) =>
        lighten(theme.palette.primary.main, 0.75)};
    }
  }
`;

export const PeriodicityPicker = forwardRef<
  HTMLButtonElement,
  BuilderPeriodicityPickerProps
>(function PeriodicityPicker(
  { periodicities, onChange, value, className, name, variant = 'select' },
  ref
) {
  const { t } = useTranslation();
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

  if (variant === 'toggle') {
    return (
      <PeriodicityToggleGroup
        className={className}
        exclusive
        value={value ?? ''}
        onChange={(_event, periodicity) => {
          if (periodicity) {
            onChange(periodicity as PaymentPeriodicity);
          }
        }}
      >
        {periodicities.map(period => (
          <ToggleButton
            key={period}
            value={period}
          >
            {formatRenewalPeriod(period)}
          </ToggleButton>
        ))}
      </PeriodicityToggleGroup>
    );
  }

  return (
    <PeriodicityPickerWrapper className={className}>
      <>
        <InputLabel htmlFor={id}>{t('subscribe.periodicity')}</InputLabel>

        <Select
          native
          label={t('subscribe.periodicity')}
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
