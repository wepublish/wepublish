import { useField } from '@wepublish/form/core';
import { SelectMemberPlan, SelectMemberPlans } from '@wepublish/ui/editor';

import { pickerInput } from './picker-input';

const noMemberPlans: [] = [];

export function MemberPlanField() {
  const { ref, ...field } = useField<string | null | undefined>();

  return (
    <SelectMemberPlan
      id={field.id}
      name={field.name}
      selectedMemberPlan={field.value || null}
      setSelectedMemberPlan={field.onChange}
      disabled={field.disabled}
      readOnly={field.readOnly}
      renderInput={pickerInput(field, ref)}
    />
  );
}

export function MemberPlansField() {
  const { ref, ...field } = useField<string[] | null | undefined>();

  return (
    <SelectMemberPlans
      id={field.id}
      name={field.name}
      defaultMemberPlans={noMemberPlans}
      selectedMemberPlans={field.value ?? noMemberPlans}
      setSelectedMemberPlans={field.onChange}
      disabled={field.disabled}
      readOnly={field.readOnly}
      renderInput={pickerInput(field, ref)}
    />
  );
}
