import { useField } from '@wepublish/form/core';
import { UserSearch, type UserSearchValue } from '@wepublish/ui/editor';

import { pickerInput } from './picker-input';

export function UserField() {
  const { ref, ...field } = useField<UserSearchValue | null | undefined>();

  return (
    <UserSearch<UserSearchValue>
      id={field.id}
      name={field.name}
      user={field.value ?? null}
      onUpdateUser={user => field.onChange(user ?? null)}
      disabled={field.disabled}
      readOnly={field.readOnly}
      placeholder={field.placeholder}
      renderInput={pickerInput(field, ref)}
    />
  );
}
