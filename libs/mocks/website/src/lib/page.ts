import {
  FullPageFragment,
  FullPageRevisionFragment,
} from '@wepublish/website/api';
import { mockTag } from './tag';
import { mockBlockContent } from './block-content';
import { mockImage } from './image';
import { faker, MOCK_REFERENCE_DATE } from './faker';
import { definedOnly } from './overrides';

export const mockPageRevision = ({
  socialMediaImage = mockImage(),
  image = mockImage(),
  blocks = mockBlockContent(),
  ...overrides
}: Partial<FullPageRevisionFragment> = {}): FullPageRevisionFragment => ({
  __typename: 'PageRevision',
  id: faker.string.nanoid(),
  publishedAt: MOCK_REFERENCE_DATE,
  title: 'This is a page title',
  description: 'This is a page description',
  socialMediaTitle: 'This is a page social media title',
  socialMediaDescription: 'This is a page social media description',
  socialMediaImage,
  image,
  blocks,
  properties: [],
  ...definedOnly(overrides),
});

export const mockPage = ({
  tags = [mockTag({ main: true }), mockTag()],
  latest = mockPageRevision(),
  ...overrides
}: Partial<FullPageFragment> = {}): FullPageFragment => ({
  __typename: 'Page',
  id: faker.string.nanoid(),
  slug: 'slug',
  url: 'https://example.com',
  publishedAt: MOCK_REFERENCE_DATE,
  modifiedAt: MOCK_REFERENCE_DATE,
  hidden: false,
  hideHeader: false,
  hideFooter: false,
  tags,
  latest,
  ...definedOnly(overrides),
});
