import { FullTagFragment, TagType } from '@wepublish/website/api';
import { mockRichText } from './richtext';
import { faker } from '@faker-js/faker';

export const mockTag = ({
  id = faker.string.nanoid(),
  tag = 'technologie',
  main = false,
  description = mockRichText(),
}: Partial<FullTagFragment> = {}): FullTagFragment => ({
  __typename: 'Tag',
  id,
  tag,
  description,
  main,
  url: 'https://example.com',
  type: TagType.Article,
});
