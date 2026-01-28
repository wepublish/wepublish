import {
  FullPageFragment,
  FullPageRevisionFragment,
} from '@wepublish/website/api';
import { mockTag } from './tag';
import nanoid from 'nanoid';
import { mockBlockContent } from './block-content';
import { mockImage } from './image';
import { faker } from '@faker-js/faker';

export const mockPageRevision = ({
  title = 'This is a page title',
  description = 'This is a page description',
  socialMediaTitle = 'This is a page social media title',
  socialMediaDescription = 'This is a page social media description',
  socialMediaImage = mockImage(),
  image = mockImage(),
  blocks = mockBlockContent(),
}: Partial<FullPageRevisionFragment> = {}): FullPageRevisionFragment => ({
  __typename: 'PageRevision',
  id: nanoid(),
  publishedAt: new Date('2023-01-01').toISOString(),
  createdAt: new Date('2023-01-01').toISOString(),
  blocks,
  properties: [],
  image,
  description,
  title,
  socialMediaDescription,
  socialMediaImage,
  socialMediaTitle,
});

export const mockPage = ({
  id = faker.string.nanoid(),
  tags = [mockTag({ main: true }), mockTag()],
  latest = mockPageRevision(),
}: Partial<FullPageFragment> = {}): FullPageFragment => ({
  __typename: 'Page',
  id,
  slug: 'slug',
  modifiedAt: new Date('2023-01-01').toISOString(),
  publishedAt: new Date('2023-01-01').toISOString(),
  tags,
  latest,
  url: 'https://example.com',
});
