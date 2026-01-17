import { CustomField } from '@puckeditor/core';
import { MemberPlanField } from './memberplan.component';
import { ComponentProps } from 'react';

export const memberplanField: CustomField<
  ComponentProps<typeof MemberPlanField>['value']
> = {
  type: 'custom',
  render: MemberPlanField,
};
