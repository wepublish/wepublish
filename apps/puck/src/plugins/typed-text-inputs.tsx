import { TextField } from '@wepublish/ui';
import { FieldLabel, Plugin } from '@puckeditor/core';
import { Hash, Type } from 'lucide-react';

export const TypedTextInputsPlugin: Plugin = {
  overrides: {
    fieldTypes: {
      text: ({ name, onChange, value, field }) => (
        <FieldLabel
          label={field.label ?? name}
          icon={field.labelIcon ?? <Type size={16} />}
        >
          <TextField
            type={field.type}
            {...field.metadata}
            value={value}
            name={name}
            onChange={e => onChange(e.currentTarget.value)}
          />
        </FieldLabel>
      ),
      number: ({ name, onChange, value, field }) => (
        <FieldLabel
          label={field.label ?? name}
          icon={field.labelIcon ?? <Hash size={16} />}
        >
          <TextField
            type={field.type}
            {...field.metadata}
            value={value}
            name={name}
            onChange={e => onChange(+e.currentTarget.value)}
          />
        </FieldLabel>
      ),
    },
  },
};
