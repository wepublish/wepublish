import { EventStatus, FullEventFragment } from '@wepublish/website/api';
import { mockImage } from './image';
import { mockTag } from './tag';
import { mockRichText } from './richtext';
import { faker } from './faker';
import { definedOnly } from './overrides';

export const mockEvent = ({
  image = mockImage(),
  tags = [mockTag(), mockTag({ main: true })],
  description = mockRichText(),
  ...overrides
}: Partial<FullEventFragment> = {}): FullEventFragment => ({
  __typename: 'Event',
  id: faker.string.nanoid(),
  name: 'Cool concert',
  lead: 'This is a lead',
  status: EventStatus.Scheduled,
  location: 'Basel',
  startsAt: '2023-01-01T00:00:00.000Z',
  endsAt: '2023-01-02T00:00:00.000Z',
  url: 'https://example.com',
  image,
  tags,
  description,
  ...definedOnly(overrides),
});
