import styled from '@emotion/styled';
import { FormLabel } from '@mui/material';
import { InfoTooltip } from '@wepublish/ui/editor';
import { ReactNode } from 'react';

const LabelRow = styled('div')`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(0.5)};
`;

interface FieldLabelProps {
  id: string;
  label: ReactNode;
  help?: ReactNode;
  htmlFor?: string;
  required?: boolean;
}

export function FieldLabel({
  id,
  label,
  help,
  htmlFor,
  required,
}: FieldLabelProps) {
  return (
    <LabelRow>
      <FormLabel
        id={id}
        htmlFor={htmlFor}
        required={required}
      >
        {label}
      </FormLabel>

      {help && <InfoTooltip text={help} />}
    </LabelRow>
  );
}
