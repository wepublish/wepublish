import styled from '@emotion/styled';
import { truncateFirstParagraph } from '@wepublish/richtext';
import {
  BuilderEventListProps,
  useWebsiteBuilder,
} from '@wepublish/website/builder';
import { useMemo } from 'react';

const MAX_LENGTH = 225;

export const EventListWrapper = styled('article')`
  display: grid;
  gap: ${({ theme }) => theme.spacing(4)};
  justify-items: center;
`;

export const EventList = ({
  data,
  className,
  style,
  descriptionMaxLength = MAX_LENGTH,
}: BuilderEventListProps) => {
  const { EventListItem } = useWebsiteBuilder();

  const truncate = useMemo(
    () => truncateFirstParagraph(descriptionMaxLength),
    [descriptionMaxLength]
  );

  return (
    <EventListWrapper
      className={className}
      style={style}
    >
      {data?.events?.nodes.map(event => (
        <EventListItem
          key={event.id}
          {...event}
          description={{
            type: 'doc',
            attrs: undefined,
            content: [truncate(event.description?.content ?? []) ?? []].flat(),
          }}
        />
      ))}
    </EventListWrapper>
  );
};
