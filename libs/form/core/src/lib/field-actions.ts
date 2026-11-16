import type { FieldValues, UseFormReturn } from 'react-hook-form';
import type { FieldActions } from './override-types';

export function fieldActions(
  form: UseFormReturn<FieldValues>
): FieldActions<FieldValues> {
  return {
    getValues: form.getValues,
    trigger: form.trigger,
    resetField: form.resetField,
    setValue: (name, value, options) => {
      const state = form.getFieldState(name);

      form.setValue(name, value, {
        shouldDirty: true,
        shouldValidate: state.isTouched || state.invalid,
        ...options,
      });
    },
  };
}
