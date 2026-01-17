import { CustomFieldRender, FieldLabel } from '@puckeditor/core';
import { Descendant } from 'slate';
import { RichTextBlock } from '@wepublish/ui/editor';

export const RichTextField: CustomFieldRender<Descendant[]> = ({
  name,
  field,
  onChange,
  value,
}) => {
  return (
    <FieldLabel label={field.label ?? name}>
      <RichTextBlock
        onChange={vl => onChange(vl)}
        value={value}
      ></RichTextBlock>
    </FieldLabel>
  );
};
