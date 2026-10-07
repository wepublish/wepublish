import { useQuery } from '@apollo/client/react';
import { EventDocument } from '@wepublish/website/api';
import {
  BuilderContainerProps,
  useWebsiteBuilder,
} from '@wepublish/website/builder';

export type EventContainerProps = {
  id: string;
} & BuilderContainerProps;

export function EventContainer({ id, className }: EventContainerProps) {
  const { Event } = useWebsiteBuilder();
  const { data, loading, error } = useQuery(EventDocument, {
    variables: {
      id,
    },
  });

  return (
    <Event
      data={data}
      loading={loading}
      error={error}
      className={className}
    />
  );
}
