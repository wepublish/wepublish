import { ComponentConfig } from '@puckeditor/core';
import { BuilderEventBlockProps } from '@wepublish/website/builder';
import { EventBlock } from '@wepublish/block-content/website';
import { eventField } from '../fields/event';
import { FullEventFragment } from '@wepublish/website/api';

export type EventConfigProps = Omit<
  BuilderEventBlockProps,
  'events' | 'filter'
> & {
  events: { event?: FullEventFragment | undefined }[];
};

export const EventConfig: ComponentConfig<EventConfigProps> = {
  fields: {
    events: {
      type: 'array',
      min: 1,
      getItemSummary: item => item.event?.name ?? 'Empty Event',
      arrayFields: {
        event: eventField,
      },
      defaultItemProps: {},
    },
  },
  defaultProps: {
    events: [{}],
  },
  inline: true,
  render: ({ events, ...props }) => (
    <EventBlock
      events={events.flatMap(event => (event.event ? [event.event] : []))}
      filter={{}}
      {...props}
    />
  ),
};
