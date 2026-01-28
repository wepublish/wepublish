import { FullAuthorFragment } from '@wepublish/website/api';
import { mockImage } from './image';
import { mockRichText } from './richtext';
import nanoid from 'nanoid';

export const mockAuthor = ({
  jobTitle = 'Editor',
  image = mockImage(),
  tags = [],
  bio = mockRichText(),
  hideOnArticle = false,
  hideOnTeam = false,
  hideOnTeaser = false,
}: Partial<FullAuthorFragment> = {}) =>
  ({
    __typename: 'Author',
    id: nanoid(),
    createdAt: new Date('2023-01-01').toISOString(),
    modifiedAt: new Date('2023-01-01').toISOString(),
    slug: 'slug',
    name: 'Foobar',
    jobTitle,
    url: 'https://example.com',
    links: [
      {
        title: 'Twitter',
        url: 'https://twitter.com',
        __typename: 'AuthorLink',
      },
      {
        title: 'Facebook',
        url: 'https://facebook.com',
        __typename: 'AuthorLink',
      },
      {
        title: 'Instagram',
        url: 'https://instagram.com',
        __typename: 'AuthorLink',
      },
    ],
    image,
    tags,
    bio,
    hideOnArticle,
    hideOnTeam,
    hideOnTeaser,
  }) as FullAuthorFragment;
