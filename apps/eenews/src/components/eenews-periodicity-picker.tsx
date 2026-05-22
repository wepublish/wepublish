import styled from '@emotion/styled';
import { Typography } from '@mui/material';
import { PaymentPeriodicity } from '@wepublish/website/api';
import { BuilderPeriodicityPickerProps } from '@wepublish/website/builder';

import { eenewsColors } from '../theme';

const Toggle = styled('div')`
  display: inline-flex;
  border: 2px solid ${eenewsColors.accent};
  border-radius: 999px;
  overflow: hidden;
  padding: 3px;
`;

const Pill = styled('button', {
  shouldForwardProp: p => p !== 'active',
})<{ active: boolean }>`
  appearance: none;
  background: ${({ active }) => (active ? eenewsColors.accent : 'transparent')};
  color: ${({ active }) => (active ? eenewsColors.white : eenewsColors.accent)};
  border: 0;
  padding: 8px 18px;
  border-radius: 999px;
  cursor: pointer;
`;

const LABEL: Record<PaymentPeriodicity, string> = {
  monthly: 'Monatlich',
  quarterly: 'Quartal',
  biannual: 'Halbjährlich',
  yearly: 'Jährlich',
  biennial: '2 Jahre',
  lifetime: 'Lebenslang',
} as Record<PaymentPeriodicity, string>;

export const EenewsPeriodicityPicker = ({
  className,
  periodicities,
  onChange,
  value,
}: BuilderPeriodicityPickerProps) => {
  if (!periodicities?.length) {
    return null;
  }
  return (
    <Toggle className={className}>
      {periodicities.map(p => (
        <Pill
          key={p}
          type="button"
          active={value === p}
          onClick={() => onChange(p)}
        >
          <Typography variant="btnDefault">{LABEL[p] ?? p}</Typography>
        </Pill>
      ))}
    </Toggle>
  );
};
