import { BaseField, FieldLabel, FieldProps, Plugin } from '@puckeditor/core';
import { RichtextJSONDocument } from '@wepublish/richtext';
import { RichtextEditor } from '@wepublish/richtext/editor';

import { UserConfig } from '../types';

export type RichtextValue = RichtextJSONDocument;

export type RichtextField = BaseField & {
  type: 'richtext';
};

type RichtextFieldRenderProps = FieldProps<RichtextField, RichtextValue> & {
  name: string;
};

const RichtextFieldRender = ({
  field,
  value,
  onChange,
  readOnly,
  name,
}: RichtextFieldRenderProps) => {
  return (
    <FieldLabel
      label={field.label ?? 'Richtext'}
      readOnly={readOnly}
    >
      <RichtextEditor
        value={value}
        onChange={({ json }) => onChange(json)}
      />
    </FieldLabel>
  );
};

export const richtextPlugin: Plugin<UserConfig> = {
  name: 'richtext',
  overrides: {
    fieldTypes: {
      richtext: RichtextFieldRender,
    },
  },
};
