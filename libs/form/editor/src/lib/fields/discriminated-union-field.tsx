import {
  bindComponent,
  useObjectField,
  useUnionField,
} from '@wepublish/form/core';
import { useFormContext } from 'react-hook-form';

import {
  DiscriminatorField,
  type DiscriminatorControl,
} from './discriminator-field';
import { FieldGroup, GroupFields, inheritedFlags } from './field-group';

export type DiscriminatedUnionFieldProps = {
  control?: DiscriminatorControl;
};

export function DiscriminatedUnionField({
  control,
}: DiscriminatedUnionFieldProps) {
  const union = useUnionField();
  const group = useObjectField();
  const { setValue, clearErrors } = useFormContext();
  const onClear = () => {
    setValue(group.name, null, { shouldDirty: true });
    clearErrors(group.name);
  };

  return (
    <FieldGroup field={group}>
      <GroupFields>
        {group.renderField(union.discriminator, {
          ...inheritedFlags(group),
          component: bindComponent(DiscriminatorField, { control, onClear }),
        })}
        {union.renderBranch()}
      </GroupFields>
    </FieldGroup>
  );
}
