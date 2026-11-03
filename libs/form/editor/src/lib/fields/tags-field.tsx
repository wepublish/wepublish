import type { TagType } from '@wepublish/editor/api';
import { useField } from '@wepublish/form/core';
import { SelectTags } from '@wepublish/ui/editor';

import { pickerInput } from './picker-input';

export type TagsKindParams = { tagType: TagType };

const noTags: [] = [];

const hasTagType = (params: unknown): params is TagsKindParams =>
  typeof params === 'object' &&
  params !== null &&
  'tagType' in params &&
  params.tagType !== undefined;

export function TagsField() {
  const { ref, ...field } = useField<string[] | null | undefined>();

  if (!hasTagType(field.kindParams)) {
    throw new Error(
      'kind "tags" needs a tagType; use formFields.tags(tagType)'
    );
  }

  const { tagType } = field.kindParams;

  return (
    <SelectTags
      id={field.id}
      name={field.name}
      tagType={tagType}
      defaultTags={noTags}
      selectedTags={field.value ?? noTags}
      setSelectedTags={field.onChange}
      disabled={field.disabled}
      readOnly={field.readOnly}
      placeholder={field.placeholder}
      renderInput={pickerInput(field, ref)}
    />
  );
}
