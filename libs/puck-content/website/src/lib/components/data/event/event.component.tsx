import { BuilderEventBlockProps, EventBlock } from '@wepublish/website/builder';

import { PuckBlockComponent } from '../../../blocks/block.types';

export type EventConfigProps = Omit<
  BuilderEventBlockProps,
  'events' | 'className'
> & {
  count?: number;
};

export const EventRender: PuckBlockComponent<EventConfigProps> = ({
  props,
  data,
  className,
}) => (
  <EventBlock
    {...props}
    events={data.events ?? []}
    className={className}
  />
);
