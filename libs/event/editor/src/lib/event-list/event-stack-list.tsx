import styled from '@emotion/styled';
import { EditorEventListItemFragment } from '@wepublish/editor/api';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import { EventNextDate } from './event-next-date';
import { eventEditPath } from './event-paths';
import { EventPublicationChip } from './event-publication-chip';

export const EVENT_STACK_LIMIT = 10;

export const shouldShowEventStack = ({
  canPublish,
  filterCount,
  totalCount,
  loadedCount,
}: {
  canPublish: boolean | undefined;
  filterCount: number;
  totalCount: number;
  loadedCount: number;
}) =>
  canPublish === false &&
  filterCount === 0 &&
  totalCount > 0 &&
  totalCount <= EVENT_STACK_LIMIT &&
  loadedCount === totalCount;

const Stack = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: ${({ theme }) => theme.spacing(1.5)};
  max-width: 720px;
`;

const Item = styled.li`
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: start;
  gap: ${({ theme }) => theme.spacing(0.5, 2)};
  padding: ${({ theme }) => theme.spacing(2)};
  border: 1px solid ${({ theme }) => theme.vars.palette.divider};
  border-radius: ${({ theme }) => `${theme.shape.borderRadius}px`};
  background: ${({ theme }) => theme.vars.palette.background.paper};
`;

const Name = styled.span`
  font-weight: 600;
  font-size: 1rem;
`;

const Meta = styled.span`
  grid-column: 1 / -1;
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: ${({ theme }) => theme.spacing(0.5, 2)};
  color: ${({ theme }) => theme.vars.palette.text.secondary};
`;

export interface EventStackListProps {
  events: EditorEventListItemFragment[];
  now: Date;
}

export function EventStackList({ events, now }: EventStackListProps) {
  const { t } = useTranslation();

  return (
    <Stack>
      {events.map(event => (
        <Item key={event.id}>
          <Name>
            <Link to={eventEditPath(event.id)}>
              {event.name || t('agenda.list.untitled')}
            </Link>
          </Name>
          <EventPublicationChip
            event={event}
            now={now}
          />
          <Meta>
            <EventNextDate
              event={event}
              now={now}
            />
            {event.place && <span>{event.place.name}</span>}
          </Meta>
        </Item>
      ))}
    </Stack>
  );
}
