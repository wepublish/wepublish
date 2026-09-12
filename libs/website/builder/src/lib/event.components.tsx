import {
  BuilderEventListItemProps,
  BuilderEventListProps,
  BuilderEventProps,
  BuilderEventSEOProps,
} from './event.interface';
import { useWebsiteBuilder } from './website-builder.context';

export const Event = (props: BuilderEventProps) => {
  const { Event } = useWebsiteBuilder();

  return <Event {...props} />;
};

export const EventSEO = (props: BuilderEventSEOProps) => {
  const { EventSEO } = useWebsiteBuilder();

  return <EventSEO {...props} />;
};

export const EventList = (props: BuilderEventListProps) => {
  const { EventList } = useWebsiteBuilder();

  return <EventList {...props} />;
};

export const EventListItem = (props: BuilderEventListItemProps) => {
  const { EventListItem } = useWebsiteBuilder();

  return <EventListItem {...props} />;
};
