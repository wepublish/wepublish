import { CustomField } from '@measured/puck';
import { PageField } from './page.component';
import { ComponentProps } from 'react';

export const pageField: CustomField<ComponentProps<typeof PageField>['value']> =
  {
    type: 'custom',
    render: PageField,
  };
