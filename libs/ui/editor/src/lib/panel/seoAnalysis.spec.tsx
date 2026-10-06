import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import {
  SeoFindingCategory,
  SeoFindingSeverity,
  SeoMetadataContentType,
} from '@wepublish/editor/api';

import { SeoAnalysis, sortSeoFindings } from './seoAnalysis';

const { analyze, queryState } = vi.hoisted(() => ({
  analyze: vi.fn(),
  queryState: { loading: false, error: undefined as Error | undefined },
}));

vi.mock('@wepublish/editor/api', async importOriginal => ({
  ...(await importOriginal<typeof import('@wepublish/editor/api')>()),
  getApiClientV2: () => undefined,
  useAnalyzeSeoContentLazyQuery: () => [analyze, queryState],
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'de' },
  }),
}));

const finding = (
  severity: SeoFindingSeverity,
  message: string,
  suggestion?: string
) => ({
  __typename: 'SeoFinding' as const,
  severity,
  category: SeoFindingCategory.Title,
  message,
  suggestion,
});

const stats = {
  wordCount: 120,
  headingCount: 2,
  linkCount: 1,
  imageCount: 3,
  imagesWithoutDescription: 1,
};

const renderAnalysis = (
  context: Parameters<typeof SeoAnalysis>[0]['context'] = {
    title: 'Velokonzept',
    body: 'Der Stadtrat hat ein neues Velokonzept verabschiedet.',
  }
) =>
  render(
    <SeoAnalysis
      type={SeoMetadataContentType.Article}
      context={context}
      metadata={{ seoTitle: 'News', slug: 'velokonzept' }}
      stats={stats}
      hasShareImage={false}
    />
  );

describe('SeoAnalysis', () => {
  beforeEach(() => {
    analyze.mockReset();
    queryState.error = undefined;
    analyze.mockResolvedValue({
      data: {
        analyzeSeoContent: {
          summary: 'Zusammenfassung',
          findings: [
            finding(SeoFindingSeverity.Low, 'Low finding'),
            finding(SeoFindingSeverity.High, 'High finding', 'Do this'),
          ],
        },
      },
    });
  });

  test('shows the counted stats before analyzing', () => {
    renderAnalysis();

    expect(screen.getByText('120')).toBeTruthy();
    expect(screen.getByText('1/3')).toBeTruthy();
    expect(analyze).not.toHaveBeenCalled();
  });

  test('sends content, metadata, stats and the ui language', async () => {
    renderAnalysis();

    fireEvent.click(screen.getByText('seoAnalysis.analyze'));

    await waitFor(() => expect(analyze).toHaveBeenCalled());

    expect(analyze.mock.calls[0][0].variables.input).toMatchObject({
      type: SeoMetadataContentType.Article,
      title: 'Velokonzept',
      seoTitle: 'News',
      slug: 'velokonzept',
      locale: 'de',
      stats: { ...stats, hasShareImage: false },
    });
  });

  test('lists findings with the most severe first', async () => {
    renderAnalysis();

    fireEvent.click(screen.getByText('seoAnalysis.analyze'));

    await waitFor(() =>
      expect(screen.getByText('Zusammenfassung')).toBeTruthy()
    );

    const findings = screen.getAllByTestId('seo-finding');

    expect(findings[0].textContent).toContain('High finding');
    expect(findings[0].textContent).toContain('Do this');
    expect(findings[1].textContent).toContain('Low finding');
  });

  test('shows a success message without findings', async () => {
    analyze.mockResolvedValue({
      data: { analyzeSeoContent: { summary: 'Gut', findings: [] } },
    });

    renderAnalysis();

    fireEvent.click(screen.getByText('seoAnalysis.analyze'));

    await waitFor(() =>
      expect(screen.getByText('seoAnalysis.noFindings')).toBeTruthy()
    );
  });

  test('shows the error when the analysis fails', async () => {
    queryState.error = new Error('Invalid SEO analysis returned by AI');
    analyze.mockResolvedValue({ error: queryState.error });

    renderAnalysis();

    fireEvent.click(screen.getByText('seoAnalysis.analyze'));

    await waitFor(() => expect(analyze).toHaveBeenCalled());

    expect(
      screen.getByText('Invalid SEO analysis returned by AI')
    ).toBeTruthy();
    expect(screen.queryAllByTestId('seo-finding')).toEqual([]);
  });

  test('is disabled without content', () => {
    renderAnalysis({ title: '', body: ' ' });

    expect(
      screen.getByText('seoAnalysis.analyze').closest('button')
    ).toHaveProperty('disabled', true);
  });
});

describe('sortSeoFindings', () => {
  test('orders by severity without mutating the input', () => {
    const findings = [
      finding(SeoFindingSeverity.Medium, 'b'),
      finding(SeoFindingSeverity.Low, 'c'),
      finding(SeoFindingSeverity.High, 'a'),
    ];

    expect(sortSeoFindings(findings).map(f => f.message)).toEqual([
      'a',
      'b',
      'c',
    ]);
    expect(findings[0].message).toBe('b');
  });
});
