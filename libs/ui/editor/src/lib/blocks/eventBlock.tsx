import styled from '@emotion/styled';
import { Drawer, Typography } from '@mui/material';
import { FullEventFragment } from '@wepublish/editor/api';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdEvent } from 'react-icons/md';

import { BlockProps } from '../atoms/blockList';
import { BlockPreviewCard } from '../atoms/blockPreviewCard';
import { DRAWER_WIDTHS } from '../drawer';
import { SelectEventPanel } from '../panel/selectEventsPanel';
import { EventBlockValue } from './types';

export function EventStartsAtView({ startsAt }: { startsAt: string }) {
  const startsAtDate = new Date(startsAt);
  const { t } = useTranslation();

  return <>{t('event.list.startsAt', { startsAt: startsAtDate })}</>;
}

export function EventEndsAtView({
  endsAt,
}: {
  endsAt: string | null | undefined;
}) {
  const endsAtDate = endsAt ? new Date(endsAt) : undefined;
  const { t } = useTranslation();

  if (endsAt) {
    return <>{t('event.list.endsAt', { endsAt: endsAtDate })}</>;
  }
  return <>{t('event.list.endsAtNone')}</>;
}

const EventList = styled('ul')`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 260px), 1fr));
  gap: ${({ theme }) => theme.spacing(1.5)};
  margin: 0;
  padding: 0;
  list-style: none;
`;

const EventItem = styled('li')`
  display: grid;
  grid-template-columns: 72px minmax(0, 1fr);
  gap: ${({ theme }) => theme.spacing(1.5)};
  align-items: center;
  padding: ${({ theme }) => theme.spacing(1)};
  border: 1px solid ${({ theme }) => theme.vars.palette.divider};
  border-radius: ${({ theme }) => theme.shape.borderRadius}px;
  background-color: ${({ theme }) => theme.vars.palette.background.default};
`;

const EventImage = styled('img')`
  width: 72px;
  height: 54px;
  object-fit: cover;
  border-radius: ${({ theme }) => `calc(${theme.shape.borderRadius}px / 2)`};
  background-color: ${({ theme }) => theme.vars.palette.background.default};
`;

const EventImagePlaceholder = styled('div')`
  display: grid;
  place-items: center;
  width: 72px;
  height: 54px;
  border-radius: ${({ theme }) => `calc(${theme.shape.borderRadius}px / 2)`};
  background-color: ${({ theme }) => theme.vars.palette.background.paper};
  color: ${({ theme }) => theme.vars.palette.text.disabled};
  font-size: 24px;
`;

const EventText = styled('div')`
  display: grid;
  min-width: 0;
`;

const EventPreview = ({ event }: { event: FullEventFragment }) => (
  <EventItem>
    {event.image?.previewURL ?
      <EventImage
        src={event.image.previewURL}
        alt={event.image.description ?? ''}
      />
    : <EventImagePlaceholder aria-hidden>
        <MdEvent />
      </EventImagePlaceholder>
    }

    <EventText>
      <Typography
        variant="subtitle2"
        noWrap
      >
        {event.name}
      </Typography>

      {event.startsAt && (
        <>
          <Typography
            variant="caption"
            color="text.secondary"
          >
            <EventStartsAtView startsAt={event.startsAt} />
          </Typography>

          <Typography
            variant="caption"
            color="text.secondary"
          >
            <EventEndsAtView endsAt={event.endsAt} />
          </Typography>
        </>
      )}
    </EventText>
  </EventItem>
);

export const EventBlock = ({
  value: { filter, events },
  onChange,
  autofocus,
  disabled,
}: BlockProps<EventBlockValue>) => {
  const { t } = useTranslation();

  const isEmpty = !events.length;
  const eventsToDisplay = events.slice(0, 4);
  const [isDialogOpen, setIsDialogOpen] = useState(
    () => Boolean(autofocus) && isEmpty
  );

  return (
    <>
      <BlockPreviewCard
        isEmpty={isEmpty}
        emptyLabel={t('blocks.event.chooseEvents')}
        editLabel={t('blocks.event.edit')}
        onEdit={() => setIsDialogOpen(true)}
        title={t('blocks.event.events', {
          count: events.length || (filter.events?.length ?? 0),
        })}
        disabled={disabled}
      >
        <EventList>
          {eventsToDisplay.map(event => (
            <EventPreview
              key={event.id}
              event={event}
            />
          ))}
        </EventList>
      </BlockPreviewCard>

      <Drawer
        anchor="right"
        slotProps={{
          paper: {
            sx: {
              width: DRAWER_WIDTHS.lg,
              maxWidth: '100vw',
            },
          },
        }}
        open={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
      >
        <SelectEventPanel
          selectedFilter={filter}
          onClose={() => setIsDialogOpen(false)}
          onSelect={(newFilter, newEvents) => {
            setIsDialogOpen(false);
            onChange({ filter: newFilter, events: newEvents });
          }}
        />
      </Drawer>
    </>
  );
};
