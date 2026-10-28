import { FullAuthorFragment } from '@wepublish/website/api';
import { mockImage } from './image';
import { mockRichText } from './richtext';
import { faker } from './faker';
import { definedOnly } from './overrides';

type AuthorLink = FullAuthorFragment['links'][number];

export const mockAuthorLink = (
  overrides: Partial<AuthorLink> = {}
): AuthorLink => ({
  __typename: 'AuthorLink',
  title: 'Twitter',
  url: 'https://twitter.com',
  ...definedOnly(overrides),
});

export const mockAuthor = ({
  image = mockImage(),
  bio = mockRichText(),
  tags = [],
  links = [
    mockAuthorLink({ title: 'Twitter', url: 'https://twitter.com' }),
    mockAuthorLink({ title: 'Facebook', url: 'https://facebook.com' }),
    mockAuthorLink({ title: 'Instagram', url: 'https://instagram.com' }),
  ],
  ...overrides
}: Partial<FullAuthorFragment> = {}): FullAuthorFragment => ({
  __typename: 'Author',
  id: faker.string.nanoid(),
  slug: 'slug',
  name: 'Foobar',
  jobTitle: 'Editor',
  url: 'https://example.com',
  hideOnArticle: false,
  hideOnTeam: false,
  hideOnTeaser: false,
  links,
  image,
  tags,
  bio,
  ...definedOnly(overrides),
});
