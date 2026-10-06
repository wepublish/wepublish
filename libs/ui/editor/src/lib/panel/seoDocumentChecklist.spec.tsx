import { render, screen, within } from '@testing-library/react';
import { FullImageFragment, SeoCheckStatus } from '@wepublish/editor/api';

import {
  getSeoDocumentChecks,
  SeoDocumentChecklist,
} from './seoDocumentChecklist';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) =>
      options && 'done' in options ?
        `${key}:${options['done']}/${options['total']}`
      : key,
    i18n: { language: 'en' },
  }),
}));

const stats = {
  wordCount: 600,
  headingCount: 2,
  linkCount: 3,
  imageCount: 2,
  imagesWithoutDescription: 0,
};

const shareImage = { width: 1600 } as FullImageFragment;

const complete = {
  metadata: {
    seoTitle: 'Stadtrat beschliesst Velokonzept',
    seoDescription: 'Der Stadtrat hat ein neues Velokonzept verabschiedet.',
    socialMediaTitle: 'Neues Velokonzept',
    socialMediaDescription: undefined,
    slug: 'velokonzept',
  },
  stats,
  shareImage,
};

const statusOf = (
  checks: ReturnType<typeof getSeoDocumentChecks>,
  id: string
) => checks.find(check => check.id === id);

describe('getSeoDocumentChecks', () => {
  test('passes a well prepared document', () => {
    const checks = getSeoDocumentChecks(complete);

    expect(
      checks
        .filter(check => check.id !== 'preview-before-publishing')
        .every(check => check.status === SeoCheckStatus.Ok)
    ).toBe(true);
    expect(statusOf(checks, 'preview-before-publishing')?.status).toBe(
      SeoCheckStatus.Info
    );
  });

  test('warns about missing and too long texts', () => {
    const checks = getSeoDocumentChecks({
      ...complete,
      metadata: {
        seoTitle: 'x'.repeat(61),
        seoDescription: '',
        slug: '',
      },
    });

    expect(statusOf(checks, 'seo-titles')).toMatchObject({
      status: SeoCheckStatus.Warning,
      reason: 'tooLong',
    });
    expect(statusOf(checks, 'meta-descriptions')).toMatchObject({
      status: SeoCheckStatus.Warning,
      reason: 'missing',
    });
    expect(statusOf(checks, 'stable-slugs')).toMatchObject({
      status: SeoCheckStatus.Warning,
      reason: 'missing',
    });
    expect(statusOf(checks, 'social-texts')?.status).toBe(SeoCheckStatus.Info);
  });

  test('checks the content structure, links and images', () => {
    const checks = getSeoDocumentChecks({
      ...complete,
      stats: {
        ...stats,
        headingCount: 0,
        linkCount: 0,
        imagesWithoutDescription: 1,
      },
    });

    expect(statusOf(checks, 'structure')?.status).toBe(SeoCheckStatus.Warning);
    expect(statusOf(checks, 'internal-links')?.status).toBe(
      SeoCheckStatus.Warning
    );
    expect(statusOf(checks, 'image-descriptions')).toMatchObject({
      status: SeoCheckStatus.Warning,
      count: 1,
    });
  });

  test('does not require headings in short texts or descriptions without images', () => {
    const checks = getSeoDocumentChecks({
      ...complete,
      stats: { ...stats, wordCount: 120, headingCount: 0, imageCount: 0 },
    });

    expect(statusOf(checks, 'structure')?.status).toBe(SeoCheckStatus.Info);
    expect(statusOf(checks, 'image-descriptions')?.status).toBe(
      SeoCheckStatus.Info
    );
  });

  test('warns about missing or small share images', () => {
    expect(
      statusOf(
        getSeoDocumentChecks({ ...complete, shareImage: undefined }),
        'share-images'
      )
    ).toMatchObject({ status: SeoCheckStatus.Warning, reason: 'missing' });
    expect(
      statusOf(
        getSeoDocumentChecks({
          ...complete,
          shareImage: { width: 800 } as FullImageFragment,
        }),
        'share-images'
      )
    ).toMatchObject({ status: SeoCheckStatus.Warning, reason: 'tooSmall' });
  });
});

describe('SeoDocumentChecklist', () => {
  test('renders every check with its status', () => {
    render(
      <SeoDocumentChecklist
        {...complete}
        metadata={{ ...complete.metadata, seoDescription: '' }}
      />
    );

    const description = within(
      screen.getByTestId('seo-document-check-meta-descriptions')
    );

    expect(
      description.getByText('seoChecklist.items.meta-descriptions.title')
    ).toBeTruthy();
    expect(
      description.getByLabelText('seoChecklist.status.Warning')
    ).toBeTruthy();
    expect(
      description.getByText(
        'seoDocumentChecklist.reasons.meta-descriptions.missing'
      )
    ).toBeTruthy();
    expect(screen.getByText('seoChecklist.progress:8/9')).toBeTruthy();
  });
});
