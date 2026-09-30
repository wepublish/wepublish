import { render, screen } from '@testing-library/react';
import { SeoMetadataContentType } from '@wepublish/editor/api';

import { SeoTab } from './seoTab';

vi.mock('@wepublish/editor/api', async importOriginal => ({
  ...(await importOriginal<typeof import('@wepublish/editor/api')>()),
  usePeerProfileQuery: () => ({ data: undefined }),
}));

vi.mock('./seoPreviews', () => ({
  SeoPreviews: () => <div data-testid="seo-previews" />,
}));

vi.mock('./seoSuggestions', () => ({
  SeoSuggestions: () => <div data-testid="seo-suggestions" />,
}));

vi.mock('./seoAnalysis', () => ({
  SeoAnalysis: () => <div data-testid="seo-analysis" />,
}));

vi.mock('./seoDocumentChecklist', () => ({
  SeoDocumentChecklist: () => <div data-testid="seo-document-checklist" />,
}));

describe('SeoTab', () => {
  test('shows the checklist first and the previews last', () => {
    render(
      <SeoTab
        type={SeoMetadataContentType.Article}
        metadata={{ title: 'Title' }}
        onApply={vi.fn()}
      />
    );

    const order = [
      'seo-document-checklist',
      'seo-suggestions',
      'seo-analysis',
      'seo-previews',
    ].map(id => screen.getByTestId(id));

    for (let i = 1; i < order.length; i++) {
      expect(
        order[i - 1].compareDocumentPosition(order[i]) &
          Node.DOCUMENT_POSITION_FOLLOWING
      ).toBeTruthy();
    }
  });
});
