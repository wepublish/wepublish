import { render, screen } from '@testing-library/react';

import { SeoContentType } from './seoPreviewData';
import { SeoTab } from './seoTab';

vi.mock('@wepublish/editor/api', async importOriginal => ({
  ...(await importOriginal<typeof import('@wepublish/editor/api')>()),
  usePeerProfileQuery: () => ({ data: undefined }),
}));

vi.mock('./seoPreviews', () => ({
  GooglePreview: () => <div data-testid="google-preview" />,
  SocialPreviews: () => <div data-testid="social-previews" />,
}));

vi.mock('./seoAnalysis', () => ({
  SeoAnalysis: () => <div data-testid="seo-analysis" />,
}));

vi.mock('./seoDocumentChecklist', () => ({
  SeoDocumentChecklist: () => <div data-testid="seo-document-checklist" />,
}));

describe('SeoTab', () => {
  test('shows the checklist first and the google preview last', () => {
    render(
      <SeoTab
        type={SeoContentType.Article}
        metadata={{ title: 'Title' }}
      />
    );

    const order = [
      'seo-document-checklist',
      'seo-analysis',
      'google-preview',
    ].map(id => screen.getByTestId(id));

    for (let i = 1; i < order.length; i++) {
      expect(
        order[i - 1].compareDocumentPosition(order[i]) &
          Node.DOCUMENT_POSITION_FOLLOWING
      ).toBeTruthy();
    }
  });

  test('leaves the social previews to the social media tab', () => {
    render(
      <SeoTab
        type={SeoContentType.Article}
        metadata={{ title: 'Title' }}
      />
    );

    expect(screen.queryByTestId('social-previews')).toBe(null);
  });
});
