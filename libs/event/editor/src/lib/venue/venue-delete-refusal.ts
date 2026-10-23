import { humanizeError } from '@wepublish/ui/editor';

type Translate = (key: string, options?: Record<string, unknown>) => string;

const UPCOMING = /still has (\d+) upcoming events?/;

export const venueDeleteRefusal = (t: Translate, error: unknown) => {
  const message = humanizeError(error as Error);
  const upcoming = UPCOMING.exec(message);

  return upcoming ?
      t('agenda.venues.delete.upcoming', { count: Number(upcoming[1]) })
    : message;
};
