import { FieldLabel, Plugin } from '@puckeditor/core';
import { Hash } from 'lucide-react';
import { RichtextEditor } from '@wepublish/richtext/editor';

export const WepublishRichtextPlugin: Plugin = {
  overrides: {
    fieldTypes: {
      richtext: ({ value, onChange, readOnly, field, name }) => (
        <FieldLabel
          label={field.label ?? name}
          icon={field.labelIcon ?? <Hash size={16} />}
        >
          <RichtextEditor
            defaultValue={value}
            onChange={({ json }) => onChange(json)}
            disabled={readOnly}
          />
        </FieldLabel>
      ),
    },
  },
};
