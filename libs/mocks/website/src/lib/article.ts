import {
  FullArticleFragment,
  FullArticleRevisionFragment,
} from '@wepublish/website/api';
import { mockTag } from './tag';
import { mockBlockContent } from './block-content';
import { mockAuthor } from './author';
import { mockImage } from './image';
import { faker, MOCK_REFERENCE_DATE } from './faker';
import { definedOnly } from './overrides';

type ArticleRevisionAuthor = FullArticleRevisionFragment['authors'][number];

export const mockArticleRevisionAuthor = ({
  author = mockAuthor(),
  ...overrides
}: Partial<ArticleRevisionAuthor> = {}): ArticleRevisionAuthor => ({
  __typename: 'ArticleRevisionAuthor',
  author,
  role: null,
  ...definedOnly(overrides),
});

export const mockArticleRevision = ({
  title = 'This is an article title',
  lead = 'This is an article lead',
  socialMediaImage = mockImage(),
  image = mockImage(),
  authors = [
    mockArticleRevisionAuthor({ role: 'Text' }),
    mockArticleRevisionAuthor({ role: 'Bilder' }),
  ],
  blocks = mockBlockContent(),
  ...overrides
}: Partial<FullArticleRevisionFragment> = {}): FullArticleRevisionFragment => ({
  __typename: 'ArticleRevision',
  id: faker.string.nanoid(),
  publishedAt: MOCK_REFERENCE_DATE,
  preTitle: 'This is an article pretitle',
  title,
  lead,
  seoTitle: title,
  seoDescription: lead,
  socialMediaTitle: 'This is an article social media title',
  socialMediaDescription: 'This is an article social media description',
  socialMediaImage,
  image,
  authors,
  blocks,
  properties: [],
  canonicalUrl: 'https://example.com',
  breaking: false,
  hideAuthor: false,
  ...definedOnly(overrides),
});

export const mockArticle = ({
  tags = [mockTag({ main: true }), mockTag()],
  latest = mockArticleRevision(),
  ...overrides
}: Partial<FullArticleFragment> = {}): FullArticleFragment => ({
  __typename: 'Article',
  id: faker.string.nanoid(),
  slug: 'slug',
  url: 'https://example.com',
  publishedAt: MOCK_REFERENCE_DATE,
  disableComments: false,
  hidden: false,
  likes: 5,
  trackingPixels: [],
  tags,
  latest,
  peerId: null,
  peer: null,
  paywall: null,
  ...definedOnly(overrides),
});
