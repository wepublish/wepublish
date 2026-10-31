import { FullArticleFragment, FullPageFragment } from '@wepublish/editor/api';
import type { TFunction } from 'i18next';

import {
  articlePublishDialog,
  hasUnpublishedChanges,
  pagePublishDialog,
  puckDocumentStatus,
  puckDocumentStatusLabel,
} from './puck-document-status';

const publishedAt = '2026-10-01T08:00:00.000Z';
const firstPublishedAt = '2026-09-01T08:00:00.000Z';
const pendingAt = '2026-12-01T08:00:00.000Z';

const draft = { __typename: 'ArticleRevision', id: 'draft' } as const;
const published = {
  __typename: 'ArticleRevision',
  id: 'published',
  publishedAt,
} as const;
const pending = {
  __typename: 'ArticleRevision',
  id: 'pending',
  publishedAt: pendingAt,
} as const;

const revisions = (
  state: Partial<Record<'draft' | 'pending' | 'published', boolean>>
) => ({
  draft: state.draft ? draft : null,
  pending: state.pending ? pending : null,
  published: state.published ? published : null,
});

const t = vi.fn((key: string) => key);
const translate = t as unknown as TFunction;

const author = (id: string, name: string) => ({
  __typename: 'Author',
  id,
  name,
});

const article = {
  __typename: 'Article',
  id: 'article-1',
  url: 'https://example.com/a/old-slug',
  publishedAt: firstPublishedAt,
  tags: [{ __typename: 'Tag', id: 'tag-1', tag: 'News' }],
  latest: {
    __typename: 'ArticleRevision',
    publishedAt,
    title: 'Old title',
    authors: [
      {
        __typename: 'ArticleRevisionAuthor',
        role: 'Text',
        author: author('author-1', 'Ada'),
      },
    ],
    socialMediaAuthors: [author('author-2', 'Grace')],
    image: { __typename: 'Image', id: 'image-1', filename: 'hero.jpg' },
    socialMediaImage: null,
  },
} as unknown as FullArticleFragment;

const page = {
  __typename: 'Page',
  id: 'page-1',
  url: 'https://example.com/about',
  tags: [{ __typename: 'Tag', id: 'tag-2', tag: 'Team' }],
  latest: {
    __typename: 'PageRevision',
    publishedAt: null,
    image: null,
    socialMediaImage: {
      __typename: 'Image',
      id: 'image-2',
      filename: 'social.jpg',
    },
  },
} as unknown as FullPageFragment;

const checkOf = (checks: { label: string; value?: unknown }[], label: string) =>
  checks.find(check => check.label === label);

beforeEach(() => {
  t.mockClear();
});

describe('puckDocumentStatus', () => {
  it('treats a document that is not created yet as an unpublished draft', () => {
    expect(puckDocumentStatus(undefined)).toBe('draft');
  });

  it('prefers a pending publication over everything else', () => {
    expect(
      puckDocumentStatus(
        revisions({ pending: true, published: true, draft: true })
      )
    ).toBe('pending');
  });

  it('is published when nothing is waiting on top of the published version', () => {
    expect(puckDocumentStatus(revisions({ published: true }))).toBe(
      'published'
    );
  });

  it('is a draft when a draft sits on top of the published version', () => {
    expect(
      puckDocumentStatus(revisions({ published: true, draft: true }))
    ).toBe('draft');
  });

  it('is a draft when the document was never published', () => {
    expect(puckDocumentStatus(revisions({ draft: true }))).toBe('draft');
  });
});

describe('hasUnpublishedChanges', () => {
  it('is true while the document has a draft', () => {
    expect(
      hasUnpublishedChanges(revisions({ draft: true, published: true }))
    ).toBe(true);
  });

  it('is false when the published version is the latest one', () => {
    expect(hasUnpublishedChanges(revisions({ published: true }))).toBe(false);
    expect(hasUnpublishedChanges(undefined)).toBe(false);
  });
});

describe('puckDocumentStatusLabel', () => {
  it('names the date of a pending publication', () => {
    expect(
      puckDocumentStatusLabel(
        translate,
        'article',
        revisions({ pending: true })
      )
    ).toBe('articleEditor.overview.pending');
    expect(t).toHaveBeenCalledWith('articleEditor.overview.pending', {
      date: new Date(pendingAt),
    });
  });

  it('names the date of the published version', () => {
    expect(
      puckDocumentStatusLabel(translate, 'page', revisions({ published: true }))
    ).toBe('pageEditor.overview.published');
    expect(t).toHaveBeenCalledWith('pageEditor.overview.published', {
      date: new Date(publishedAt),
    });
  });

  it('calls a draft on top of the published version a draft', () => {
    expect(
      puckDocumentStatusLabel(
        translate,
        'article',
        revisions({ published: true, draft: true })
      )
    ).toBe('versionHistory.state.draft');
  });

  it('calls a document that was never published unpublished', () => {
    expect(
      puckDocumentStatusLabel(translate, 'page', revisions({ draft: true }))
    ).toBe('pageEditor.overview.unpublished');
    expect(puckDocumentStatusLabel(translate, 'article', undefined)).toBe(
      'articleEditor.overview.unpublished'
    );
  });
});

describe('articlePublishDialog', () => {
  it('checks the same things as the article editor, in the same order', () => {
    expect(
      articlePublishDialog(translate, article, {}).checks.map(
        ({ label }) => label
      )
    ).toEqual([
      'articleEditor.panels.slug',
      'articleEditor.panels.preTitle',
      'articleEditor.panels.title',
      'articleEditor.panels.lead',
      'articleEditor.panels.authors',
      'articleEditor.panels.tags',
      'articleEditor.panels.image',
      'articleEditor.panels.seoTitle',
      'articleEditor.panels.seoDescription',
      'articleEditor.panels.socialMediaTitle',
      'articleEditor.panels.socialMediaDescription',
      'articleEditor.panels.socialMediaAuthors',
      'articleEditor.panels.socialMediaImage',
    ]);
  });

  it('requires a slug', () => {
    const { checks } = articlePublishDialog(translate, article, {});

    expect(checkOf(checks, 'articleEditor.panels.slug')).toEqual({
      label: 'articleEditor.panels.slug',
      value: undefined,
      missing: 'articleEditor.panels.addSlug',
      required: true,
    });
  });

  it('checks the root props being edited, not the saved article', () => {
    const { checks } = articlePublishDialog(translate, article, {
      slug: 'new-slug',
      title: 'New title',
    });

    expect(checkOf(checks, 'articleEditor.panels.slug')?.value).toBe(
      'new-slug'
    );
    expect(checkOf(checks, 'articleEditor.panels.title')?.value).toBe(
      'New title'
    );
  });

  it('names the authors, tags and images the article knows and shows the id of new ones', () => {
    const { checks } = articlePublishDialog(translate, article, {
      authorIds: ['author-1', 'author-9'],
      socialMediaAuthorIds: ['author-2'],
      tags: ['tag-1'],
      imageId: 'image-1',
      socialMediaImageId: 'image-9',
    });

    expect(checkOf(checks, 'articleEditor.panels.authors')?.value).toBe(
      'Ada, author-9'
    );
    expect(
      checkOf(checks, 'articleEditor.panels.socialMediaAuthors')?.value
    ).toBe('Grace');
    expect(checkOf(checks, 'articleEditor.panels.tags')?.value).toBe('News');
    expect(checkOf(checks, 'articleEditor.panels.image')?.value).toBe(
      'hero.jpg'
    );
    expect(
      checkOf(checks, 'articleEditor.panels.socialMediaImage')?.value
    ).toBe('image-9');
  });

  it('leaves empty lists unchecked', () => {
    const { checks } = articlePublishDialog(translate, article, {
      authorIds: [],
      tags: [],
    });

    expect(checkOf(checks, 'articleEditor.panels.authors')?.value).toBe(
      undefined
    );
    expect(checkOf(checks, 'articleEditor.panels.tags')?.value).toBe(undefined);
  });

  it('lists the options the root props switched on', () => {
    expect(
      articlePublishDialog(translate, article, {
        breaking: true,
        shared: false,
        hideAuthor: true,
      }).options
    ).toEqual([
      'articleEditor.panels.breakingNews',
      'articleEditor.panels.hideAuthors',
    ]);
  });

  it('starts at the date of the latest version and mentions the first publication', () => {
    const dialog = articlePublishDialog(translate, article, {});

    expect(dialog).toEqual(
      expect.objectContaining({
        title: 'articleEditor.panels.publishArticle',
        url: 'https://example.com/a/old-slug',
        publishedAt: new Date(publishedAt),
        dateLabel: 'articleEditor.panels.publishDate',
        dateHelperText: 'articleEditor.panels.firstPublishedAtDate',
      })
    );
    expect(t).toHaveBeenCalledWith(
      'articleEditor.panels.firstPublishedAtDate',
      {
        firstPublishedAtDate: new Date(firstPublishedAt),
      }
    );
  });

  it('says that a new article was not published yet', () => {
    expect(articlePublishDialog(translate, undefined, {})).toEqual(
      expect.objectContaining({
        url: undefined,
        publishedAt: undefined,
        dateHelperText: 'articleEditor.panels.notPublishedYet',
      })
    );
  });

  it('warns that publishing again overrides a pending publication', () => {
    const date = new Date(pendingAt);

    articlePublishDialog(translate, article, {}).pendingMessage?.(date);

    expect(t).toHaveBeenCalledWith('articleEditor.panels.articlePending', {
      pendingPublishDate: date,
    });
  });
});

describe('pagePublishDialog', () => {
  it('checks the same things as the page editor, in the same order', () => {
    expect(
      pagePublishDialog(translate, page, {}).checks.map(({ label }) => label)
    ).toEqual([
      'pageEditor.panels.title',
      'pageEditor.panels.description',
      'pageEditor.panels.seoTitle',
      'pageEditor.panels.seoDescription',
      'pageEditor.panels.slug',
      'pageEditor.panels.tags',
      'pageEditor.panels.image',
      'pageEditor.panels.socialMediaTitle',
      'pageEditor.panels.socialMediaDescription',
      'pageEditor.panels.socialMediaImage',
    ]);
  });

  it('checks the lead as the description and does not require a slug', () => {
    const { checks } = pagePublishDialog(translate, page, {
      lead: 'About the team',
      tags: ['tag-2'],
      socialMediaImageId: 'image-2',
    });

    expect(checkOf(checks, 'pageEditor.panels.description')).toEqual({
      label: 'pageEditor.panels.description',
      value: 'About the team',
      missing: 'pageEditor.panels.enterDescription',
    });
    expect(checkOf(checks, 'pageEditor.panels.slug')).toEqual({
      label: 'pageEditor.panels.slug',
      value: undefined,
    });
    expect(checkOf(checks, 'pageEditor.panels.tags')?.value).toBe('Team');
    expect(checkOf(checks, 'pageEditor.panels.socialMediaImage')?.value).toBe(
      'social.jpg'
    );
  });

  it('describes the page publication', () => {
    expect(pagePublishDialog(translate, page, {})).toEqual(
      expect.objectContaining({
        title: 'pageEditor.panels.publishPage',
        url: 'https://example.com/about',
        publishedAt: undefined,
        dateLabel: 'pageEditor.panels.publishDate',
      })
    );
  });
});
