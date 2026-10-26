import { Chip } from '@mui/material';
import { EventStatus } from '@wepublish/website/api';

const eventStatusLabels: Record<EventStatus, string | null> = {
  [EventStatus.Confirmed]: null,
  [EventStatus.Cancelled]: 'Abgesagt',
  [EventStatus.Postponed]: 'Verschoben',
  [EventStatus.SoldOut]: 'Ausverkauft',
};

export const eventStatusLabel = (status: EventStatus) =>
  eventStatusLabels[status] ?? null;

export type EventStatusBadgeProps = {
  status: EventStatus;
  className?: string;
};

export const EventStatusBadge = ({
  status,
  className,
}: EventStatusBadgeProps) => {
  const label = eventStatusLabel(status);

  if (!label) {
    return null;
  }

  return (
    <Chip
      className={className}
      data-event-status={status}
      label={label}
      color={status === EventStatus.Cancelled ? 'error' : 'warning'}
      size="small"
    />
  );
};
