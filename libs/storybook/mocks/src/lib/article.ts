import {
  FullArticleFragment,
  FullArticleRevisionFragment,
} from '@wepublish/website/api';
import { mockTag } from './tag';
import nanoid from 'nanoid';
import { mockBlockContent } from './block-content';
import { mockAuthor } from './author';
import { mockImage } from './image';
import { faker } from '@faker-js/faker';

export const mockArticleRevision = ({
  title = 'This is an article title',
  preTitle = 'This is an article pretitle',
  lead = 'This is an article lead',
  socialMediaTitle = 'This is an article social media title',
  socialMediaDescription = 'This is an article social media description',
  socialMediaImage = mockImage(),
  image = mockImage(),
  authors = [mockAuthor(), mockAuthor()],
  blocks = mockBlockContent(),
  canonicalUrl = 'https://example.com',
  breaking = false,
}: Partial<FullArticleRevisionFragment> = {}): FullArticleRevisionFragment => ({
  __typename: 'ArticleRevision',
  id: nanoid(),
  publishedAt: new Date('2023-01-01').toISOString(),
  createdAt: new Date('2023-01-01').toISOString(),
  blocks,
  authors,
  properties: [],
  image,
  lead,
  title,
  preTitle,
  socialMediaDescription,
  socialMediaImage,
  socialMediaTitle,
  canonicalUrl,
  breaking,
});

export const mockArticle = ({
  id = faker.string.nanoid(),
  disableComments = false,
  likes = 5,
  trackingPixels = [],
  tags = [mockTag({ main: true }), mockTag()],
  latest = mockArticleRevision(),
  peerId = null,
  peerArticleId = null,
  peer = null,
}: Partial<FullArticleFragment> = {}): FullArticleFragment => ({
  __typename: 'Article',
  id,
  slug: 'slug',
  disableComments,
  likes,
  modifiedAt: new Date('2023-01-01').toISOString(),
  publishedAt: new Date('2023-01-01').toISOString(),
  trackingPixels,
  tags,
  latest,
  url: 'https://example.com',
  peerId,
  peerArticleId,
  peer,
  paywall: null,
});
