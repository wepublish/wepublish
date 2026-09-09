import { FieldLabel, FieldProps } from '@puckeditor/core';
import { RichtextEditor } from '@wepublish/richtext/editor';

import { RichtextField, RichtextValue } from './richtext.field';

export type RichtextFieldRenderProps = FieldProps<
  RichtextField,
  RichtextValue
> & {
  name: string;
};

export const RichtextFieldRender = ({
  field,
  value,
  onChange,
  readOnly,
}: RichtextFieldRenderProps) => {
  return (
    <FieldLabel
      label={field.label ?? 'Richtext'}
      readOnly={readOnly}
      el="div"
    >
      <RichtextEditor
        autofocus={false}
        value={value}
        onChange={({ json }) => onChange(json)}
      />
    </FieldLabel>
  );
};
