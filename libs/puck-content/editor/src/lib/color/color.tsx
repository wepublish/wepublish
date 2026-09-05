import { BaseField, FieldLabel, FieldProps, Plugin } from '@puckeditor/core';
import { FieldAiParams } from '@puckeditor/plugin-ai';

import { UserFieldsConfig } from '../fields';

import { ColorPicker } from './color-picker';

export type ColorValue = string;

export type ColorField = BaseField & {
  type: 'color';
};

export const colorFieldAi: FieldAiParams = {
  instructions:
    'A CSS colour as a hex string, e.g. #1a1a1a or #1a1a1a80 with alpha. Leave unset to keep the theme default. Make sure foreground and background colours keep enough contrast to stay readable.',
  schema: {
    type: 'string',
    pattern: '^#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$',
  },
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

export const colorPlugin: Plugin<UserFieldsConfig> = {
  name: 'color',
  overrides: {
    fieldTypes: {
      color: ColorFieldRender,
    },
  },
};
