import { CustomField } from '@puckeditor/core';
import { PollField } from './poll.component';
import { ComponentProps } from 'react';

export const pollField: CustomField<ComponentProps<typeof PollField>['value']> =
  {
    type: 'custom',
    label: 'Poll',
    render: PollField,
  };
