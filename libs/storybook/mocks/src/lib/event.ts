import { EventStatus, FullEventFragment } from '@wepublish/website/api';
import { mockImage } from './image';
import nanoid from 'nanoid';
import { mockTag } from './tag';
import { mockRichText } from './richtext';

export const mockEvent = ({
  image = mockImage(),
  tags = [mockTag(), mockTag({ main: true })],
  description = mockRichText(),
  lead = 'This is a lead',
}: Partial<FullEventFragment> = {}): FullEventFragment => ({
  __typename: 'Event',
  id: nanoid(),
  createdAt: new Date('2023-01-01').toISOString(),
  modifiedAt: new Date('2023-01-01').toISOString(),
  name: 'Cool concert',
  status: EventStatus.Scheduled,
  location: 'Basel',
  startsAt: new Date('2023-01-01').toISOString(),
  endsAt: new Date('2023-01-02').toISOString(),
  url: 'https://example.com',
  image,
  tags,
  description,
  lead,
});
