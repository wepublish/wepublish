import { FullTagFragment, TagType } from '@wepublish/website/api';
import { mockRichText } from './richtext';
import { faker } from '@faker-js/faker';

export const mockTag = ({
  id = faker.string.nanoid(),
  tag = faker.word.noun(),
  main = false,
  description = mockRichText(),
}: Partial<FullTagFragment> = {}): FullTagFragment => ({
  __typename: 'Tag',
  id,
  tag,
  description,
  main,
  url: faker.internet.url(),
  type: TagType.Article,
});
