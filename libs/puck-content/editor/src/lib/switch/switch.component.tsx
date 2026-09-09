import styled from '@emotion/styled';
import { Switch } from '@mui/material';
import { FieldProps } from '@puckeditor/core';

import { SwitchField, SwitchValue } from './switch.field';

const Row = styled.label<{ readOnly: boolean }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  font-size: var(--puck-font-size-xxs);
  font-weight: 600;
  color: var(--puck-color-grey-04);
  cursor: ${({ readOnly }) => (readOnly ? 'default' : 'pointer')};
`;

export type SwitchFieldRenderProps = FieldProps<
  SwitchField,
  SwitchValue | undefined
>;

export const SwitchFieldRender = ({
  field,
  value,
  onChange,
  readOnly,
}: SwitchFieldRenderProps) => (
  <Row readOnly={!!readOnly}>
    <span>{field.label}</span>

    <Switch
      size="small"
      checked={!!value}
      disabled={readOnly}
      onChange={(_event, checked) => onChange(checked)}
      inputProps={{ 'aria-label': field.label }}
    />
  </Row>
);
