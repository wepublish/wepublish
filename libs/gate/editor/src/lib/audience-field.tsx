import { FormControlLabel, Radio, RadioGroup } from '@mui/material';
import { LoginStatus } from '@wepublish/editor/api';
import { ReactNode } from 'react';

export type AudienceOption = {
  value: LoginStatus;
  label: ReactNode;
};

type AudienceFieldProps = {
  name: string;
  value: LoginStatus;
  options: AudienceOption[];
  onChange: (audience: LoginStatus) => void;
};

/**
 * Who a gate is for. Each mode offers its own audiences: banners every login
 * status, content gates only logged-out and unsubscribed readers.
 */
export const AudienceField = ({
  name,
  value,
  options,
  onChange,
}: AudienceFieldProps) => (
  <RadioGroup
    name={name}
    value={value}
    onChange={(_event, audience) => onChange(audience as LoginStatus)}
  >
    {options.map(option => (
      <FormControlLabel
        key={option.value}
        value={option.value}
        control={<Radio />}
        label={option.label}
      />
    ))}
  </RadioGroup>
);
