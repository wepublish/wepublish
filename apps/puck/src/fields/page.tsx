import { CustomField } from '@puckeditor/core';
import { PageField } from './page.component';
import { ComponentProps } from 'react';

export const pageField: CustomField<ComponentProps<typeof PageField>['value']> =
  {
    type: 'custom',
    render: PageField,
  };
