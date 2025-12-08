import { CustomField } from '@measured/puck';
import { ComponentProps } from 'react';
import { RichTextField } from './richtext.component';

export const richTextField: CustomField<
  ComponentProps<typeof RichTextField>['value']
> = {
  type: 'custom',
  render: RichTextField,
};
