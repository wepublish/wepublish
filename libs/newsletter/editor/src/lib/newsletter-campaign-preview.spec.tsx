import { MockedProvider } from '@apollo/client/testing/react';
import { render, screen } from '@testing-library/react';
import { NewsletterCampaignPreviewDocument } from '@wepublish/editor/api';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { NewsletterCampaignPreview } from './newsletter-campaign-preview';

const renderAt = (result: object) =>
  render(
    <MockedProvider
      mocks={[
        {
          request: {
            query: NewsletterCampaignPreviewDocument,
            variables: { id: 'campaign-1' },
          },
          result,
        },
      ]}
    >
      <MemoryRouter initialEntries={['/newsletter/preview/campaign-1']}>
        <Routes>
          <Route
            path="newsletter/preview/:id"
            element={<NewsletterCampaignPreview />}
          />
        </Routes>
      </MemoryRouter>
    </MockedProvider>
  );

describe('NewsletterCampaignPreview', () => {
  it('shows the stored issue in a frame that may not run scripts', async () => {
    renderAt({
      data: { newsletterCampaignPreview: '<html><body>Ausgabe</body></html>' },
    });

    const frame = await screen.findByTitle('newsletter.editor.preview');

    expect(frame.getAttribute('srcdoc')).toBe(
      '<html><body>Ausgabe</body></html>'
    );
    expect(frame.getAttribute('sandbox')).not.toContain('allow-scripts');
    expect(frame.getAttribute('sandbox')).not.toContain('allow-same-origin');
  });

  it('says why the issue could not be rendered', async () => {
    renderAt({
      errors: [{ message: 'Dieser Newsletter existiert nicht (mehr).' }],
    });

    expect(
      await screen.findByText('Dieser Newsletter existiert nicht (mehr).')
    ).toBeTruthy();
  });
});
