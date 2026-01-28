import { useEventListQuery } from '@wepublish/website/api';
import {
  BuilderContainerProps,
  BuilderEventListProps,
  useWebsiteBuilder,
} from '@wepublish/website/builder';

export type EventListContainerProps = BuilderContainerProps &
  Pick<BuilderEventListProps, 'variables' | 'onVariablesChange'>;

export function EventListContainer({
  className,
  variables,
  onVariablesChange,
}: EventListContainerProps) {
  const { EventList } = useWebsiteBuilder();
  const { data, loading, error } = useEventListQuery({
    variables,
  });

  return (
    <EventList
      data={data}
      loading={loading}
      error={error}
      className={className}
      variables={variables}
      onVariablesChange={onVariablesChange}
    />
  );
}
