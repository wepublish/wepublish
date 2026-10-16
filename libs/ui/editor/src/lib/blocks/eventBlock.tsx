import { Button, Card, CardContent, Drawer, Typography } from '@mui/material';
import { FullEventFragment } from '@wepublish/editor/api';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdEdit } from 'react-icons/md';

import { BlockProps } from '../atoms/blockList';
import { PlaceholderInput } from '../atoms/placeholderInput';
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

const EventPreview = ({ event }: { event: FullEventFragment }) => (
  <Card
    variant="outlined"
    key={event.id}
    sx={{
      bgcolor: 'background.paper',
      display: 'grid',
      alignItems: 'center',
    }}
  >
    <CardContent>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 2fr',
          gap: '12px',
          alignItems: 'center',
        }}
      >
        <img
          src={event.image?.previewURL ?? '/static/placeholder-240x240.png'}
          alt={event.image?.description ?? ''}
          height={event.image?.height}
          width={event.image?.width}
          style={{
            width: '100%',
            height: 'auto',
            borderRadius: 0.75,
          }}
        />

        <div style={{ display: 'grid' }}>
          {event.name}

          <small>
            <EventStartsAtView startsAt={event.startsAt} />
          </small>

          <small>
            <EventEndsAtView endsAt={event.endsAt} />
          </small>
        </div>
      </div>
    </CardContent>
  </Card>
);

export const EventBlock = ({
  value: { filter, events },
  onChange,
  autofocus,
}: BlockProps<EventBlockValue>) => {
  const { t } = useTranslation();

  const isEmpty = !events.length;
  const eventsToDisplay = events.slice(0, 4);
  const [isDialogOpen, setIsDialogOpen] = useState(
    () => Boolean(autofocus) && isEmpty
  );

  return (
    <>
      <Card
        variant="outlined"
        style={{
          minHeight: 150,
          overflow: 'hidden',
          backgroundColor: 'background.default',
          display: 'grid',
        }}
      >
        <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
          <PlaceholderInput
            onAddClick={() => setIsDialogOpen(true)}
            addLabel={t('blocks.event.chooseEvents')}
          >
            {!isEmpty && (
              <div
                style={{
                  position: 'relative',
                  width: '100%',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    zIndex: 100,
                    height: '100%',
                    right: 0,
                  }}
                >
                  <Button
                    variant="outlined"
                    startIcon={<MdEdit />}
                    size="large"
                    onClick={() => setIsDialogOpen(true)}
                  >
                    {t('blocks.event.edit')}
                  </Button>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '12px',
                    padding: '24px',
                  }}
                >
                  {eventsToDisplay.map(event => (
                    <EventPreview
                      key={event.id}
                      event={event}
                    />
                  ))}
                </div>

                <Typography
                  style={{ marginBottom: '12px', textAlign: 'center' }}
                >
                  {t('blocks.event.events', {
                    count:
                      events.length ?
                        events.length
                      : (filter.events?.length ?? 0),
                  })}
                </Typography>
              </div>
            )}
          </PlaceholderInput>
        </CardContent>
      </Card>

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
