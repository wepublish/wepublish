import { CustomField } from '@measured/puck';
import { PollField } from './poll.component';
import { ComponentProps } from 'react';

export const pollField: CustomField<ComponentProps<typeof PollField>['value']> =
  {
    type: 'custom',
    label: 'Poll',
    render: PollField,
  };
