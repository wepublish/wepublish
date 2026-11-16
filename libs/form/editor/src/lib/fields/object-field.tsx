import { useObjectField } from '@wepublish/form/core';

import { FieldGroup, GroupFields, inheritedFlags } from './field-group';

export function ObjectField() {
  const group = useObjectField();
  const child = inheritedFlags(group);

  return (
    <FieldGroup field={group}>
      <GroupFields>
        {group.keys.map(key => group.renderField(key, child))}
      </GroupFields>
    </FieldGroup>
  );
}
