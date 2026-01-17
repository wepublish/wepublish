import { CustomField } from '@puckeditor/core';
import { EventField } from './event.component';
import { ComponentProps } from 'react';

export const eventField: CustomField<
  ComponentProps<typeof EventField>['value']
> = {
  type: 'custom',
  label: 'Event',
  render: EventField,
};
