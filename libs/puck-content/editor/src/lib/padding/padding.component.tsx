import { FieldProps } from '@puckeditor/core';
import { useTranslation } from 'react-i18next';

import { ToggleableField } from '../field-controls.component';
import { SidesInput } from '../sides/sides.component';
import { PaddingField, PaddingValue } from './padding.field';

export type PaddingFieldRenderProps = FieldProps<
  PaddingField,
  PaddingValue | undefined
> & {
  name: string;
};

export const PaddingFieldRender = ({
  field,
  name,
  value,
  onChange,
  readOnly,
}: PaddingFieldRenderProps) => {
  const { t } = useTranslation();

  return (
    <ToggleableField
      label={field.label ?? t('', 'Padding')}
      value={value}
      readOnly={readOnly}
      onChange={onChange}
    >
      <SidesInput
        name={name}
        value={value}
        readOnly={readOnly}
        onChange={onChange}
      />
    </ToggleableField>
  );
};
