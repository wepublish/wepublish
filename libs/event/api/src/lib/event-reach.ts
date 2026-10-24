import { Event, Place } from '@prisma/client';
import { AuthSession } from '@wepublish/authentication/api';
import { canReachEvent } from './event-scope';

type PlaceLoader = {
  load(id: string): Promise<Pick<Place, 'organizationId'> | null | undefined>;
};

export const canReachLoadedEvent = async (
  session: AuthSession | null | undefined,
  event: Pick<Event, 'organizationId' | 'ownerId' | 'placeId'>,
  places: PlaceLoader
) => {
  if (canReachEvent(session, { ...event, place: null })) {
    return true;
  }

  if (!event.placeId) {
    return false;
  }

  const place = (await places.load(event.placeId)) ?? null;

  return canReachEvent(session, { ...event, place });
};
