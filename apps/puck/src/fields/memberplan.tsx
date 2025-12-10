import { CustomField } from '@measured/puck';
import { MemberPlanField } from './memberplan.component';
import { ComponentProps } from 'react';

export const memberplanField: CustomField<
  ComponentProps<typeof MemberPlanField>['value']
> = {
  type: 'custom',
  render: MemberPlanField,
};
