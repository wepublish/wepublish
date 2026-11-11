import { useField } from '@wepublish/form/core';
import { SelectPaywall } from '@wepublish/ui/editor';

import { pickerInput } from './picker-input';

export function PaywallField() {
  const { ref, ...field } = useField<string | null | undefined>();

  return (
    <SelectPaywall
      id={field.id}
      name={field.name}
      selectedPaywall={field.value || null}
      setSelectedPaywall={field.onChange}
      disabled={field.disabled}
      readOnly={field.readOnly}
      placeholder={field.placeholder}
      renderInput={pickerInput(field, ref)}
    />
  );
}
