import { FullTagFragment, TagType } from '@wepublish/website/api';
import { mockRichText } from './richtext';
import { faker } from './faker';
import { definedOnly } from './overrides';

export const mockTag = ({
  description = mockRichText(),
  ...overrides
}: Partial<FullTagFragment> = {}): FullTagFragment => ({
  __typename: 'Tag',
  id: faker.string.nanoid(),
  tag: faker.word.noun(),
  description,
  main: false,
  color: null,
  url: faker.internet.url(),
  type: TagType.Article,
  ...definedOnly(overrides),
});
