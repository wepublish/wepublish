import { BaseField, FieldLabel, FieldProps, Plugin } from '@puckeditor/core';

import { UserConfig } from '../../types';
import { ColorPicker } from './color-picker';

export type ColorValue = string;

export type ColorField = BaseField & {
  type: 'color';
};

type ColorFieldRenderProps = FieldProps<ColorField, ColorValue> & {
  name: string;
};

const ColorFieldRender = ({
  field,
  value,
  onChange,
  readOnly,
  name,
}: ColorFieldRenderProps) => {
  return (
    <FieldLabel
      label={field.label ?? 'Color'}
      readOnly={readOnly}
    >
      <ColorPicker
        name={name}
        value={value}
        onChange={val => onChange(val.target.value)}
      />
    </FieldLabel>
  );
};

export const colorPlugin: Plugin<UserConfig> = {
  name: 'color',
  overrides: {
    fieldTypes: {
      color: ColorFieldRender,
    },
  },
};
