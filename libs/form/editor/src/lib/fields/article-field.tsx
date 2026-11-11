import { useField } from '@wepublish/form/core';
import { SelectArticle } from '@wepublish/ui/editor';

import { pickerInput } from './picker-input';

export function ArticleField() {
  const { ref, ...field } = useField<string | null | undefined>();

  return (
    <SelectArticle
      id={field.id}
      name={field.name}
      selectedArticle={field.value || null}
      setSelectedArticle={field.onChange}
      disabled={field.disabled}
      readOnly={field.readOnly}
      renderInput={pickerInput(field, ref)}
    />
  );
}
