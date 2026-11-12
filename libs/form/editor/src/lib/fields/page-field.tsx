import { useField } from '@wepublish/form/core';
import { SelectPage, SelectPages } from '@wepublish/ui/editor';

import { pickerInput } from './picker-input';

const noPages: [] = [];

export function PageField() {
  const { ref, ...field } = useField<string | null | undefined>();

  return (
    <SelectPage
      id={field.id}
      name={field.name}
      selectedPage={field.value || null}
      setSelectedPage={field.onChange}
      disabled={field.disabled}
      readOnly={field.readOnly}
      renderInput={pickerInput(field, ref)}
    />
  );
}

export function PagesField() {
  const { ref, ...field } = useField<string[] | null | undefined>();

  return (
    <SelectPages
      id={field.id}
      name={field.name}
      selectedPages={field.value ?? noPages}
      setSelectedPages={field.onChange}
      disabled={field.disabled}
      readOnly={field.readOnly}
      placeholder={field.placeholder}
      renderInput={pickerInput(field, ref)}
    />
  );
}
