import { FieldLabel, FieldProps } from '@puckeditor/core';

import { FieldInput } from '../field-controls';
import { passwordManagerIgnore } from './password-manager';

export const NameInput = ({
  field,
  id,
  value,
  onChange,
  readOnly,
}: FieldProps<{ type: 'custom'; label?: string }, string | undefined> & {
  id?: string;
}) => (
  <FieldLabel
    label={field.label ?? ''}
    readOnly={readOnly}
    el="div"
  >
    <FieldInput
      id={id}
      type="text"
      aria-label={field.label}
      value={value ?? ''}
      disabled={readOnly}
      onChange={event => onChange(event.currentTarget.value)}
      {...passwordManagerIgnore}
    />
  </FieldLabel>
);
