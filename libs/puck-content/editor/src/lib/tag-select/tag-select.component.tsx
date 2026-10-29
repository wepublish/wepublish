import { FieldLabel, FieldProps } from '@puckeditor/core';
import { SelectTags } from '@wepublish/ui/editor';
import { useTranslation } from 'react-i18next';

import { TagSelectField, TagSelectValue } from './tag-select.field';

export type TagSelectFieldRenderProps = FieldProps<
  TagSelectField,
  TagSelectValue | undefined
> & {
  name: string;
};

export const TagSelectFieldRender = ({
  field,
  name,
  value,
  onChange,
  readOnly,
}: TagSelectFieldRenderProps) => {
  const { t } = useTranslation();

  return (
    <FieldLabel
      label={field.label ?? t('', 'Tags')}
      readOnly={readOnly}
      el="div"
    >
      <SelectTags
        name={name}
        disabled={readOnly}
        defaultTags={[]}
        tagType={field.tagType}
        selectedTags={value ?? []}
        setSelectedTags={onChange}
      />
    </FieldLabel>
  );
};
