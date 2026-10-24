import {
  EventScheduleType,
  EventStatus,
  FullEventDetailFragment,
  FullEventFragment,
} from '@wepublish/website/api';
import { mockImage } from './image';
import nanoid from 'nanoid';
import { mockTag } from './tag';
import { mockRichText } from './richtext';
import { mockRichTextBlock } from './block-content';

export const mockEvent = ({
  image = mockImage(),
  tags = [mockTag(), mockTag({ main: true })],
  description = mockRichText(),
  slug = 'cool-concert',
  name = 'Cool concert',
  status = EventStatus.Confirmed,
  scheduleType = EventScheduleType.Continuous,
  location = 'Basel',
  startsAt = new Date('2023-01-01').toISOString(),
  endsAt = new Date('2023-01-02').toISOString(),
  url = 'https://example.com/event/cool-concert',
}: Partial<FullEventFragment> = {}): FullEventFragment => ({
  __typename: 'Event',
  id: nanoid(),
  slug,
  name,
  status,
  scheduleType,
  location,
  startsAt,
  endsAt,
  url,
  image,
  tags,
  description,
});

export const mockEventDetail = ({
  latest = {
    __typename: 'EventRevision',
    id: nanoid(),
    blocks: [mockRichTextBlock()],
  },
  ...event
}: Partial<FullEventDetailFragment> = {}): FullEventDetailFragment => ({
  ...mockEvent(event),
  latest,
});
