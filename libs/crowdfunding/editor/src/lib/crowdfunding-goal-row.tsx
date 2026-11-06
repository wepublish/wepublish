import { editorForm, FormRow } from '@wepublish/form/editor';
import { FormFields } from '@wepublish/ui/editor';

import { crowdfundingSchema } from './crowdfunding.schema';

const Goal = editorForm.fieldsFor(crowdfundingSchema, 'goals.*');

export function CrowdfundingGoalRow() {
  return (
    <FormFields>
      <FormRow>
        <Goal.Field name="title" />
        <Goal.Field name="amount" />
      </FormRow>
      <Goal.Field name="description" />
    </FormFields>
  );
}
