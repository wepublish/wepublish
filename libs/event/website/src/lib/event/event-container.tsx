import { useQuery } from '@apollo/client/react';
import { EventDocument } from '@wepublish/website/api';
import {
  BuilderContainerProps,
  useWebsiteBuilder,
} from '@wepublish/website/builder';

export type EventContainerProps = (
  { id: string; slug?: never } | { slug: string; id?: never }
) &
  BuilderContainerProps;

export function EventContainer({ id, slug, className }: EventContainerProps) {
  const { Event } = useWebsiteBuilder();
  const { data, loading, error } = useQuery(EventDocument, {
    variables: id ? { id } : { slug },
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
