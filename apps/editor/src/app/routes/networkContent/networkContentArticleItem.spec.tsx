import { createTheme, ThemeProvider } from '@mui/material';
import { render, screen } from '@testing-library/react';

import type { PeerArticle } from './networkContent.types';
import { NetworkContentArticleItem } from './networkContentArticleItem';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' },
  }),
}));

const article = {
  source_id: 'article-1',
  source_url: 'https://example.com/article',
  source_title: 'Network story',
  source_lead: 'Lead',
  source_imageUrl: 'https://example.com/image.jpg',
  source_publishedAt: '2026-09-30T10:00:00.000Z',
  client: { name: 'Publisher' },
} as unknown as PeerArticle;

describe('NetworkContentArticleItem', () => {
  it('exposes one named, focusable link per article', () => {
    render(
      <ThemeProvider theme={createTheme({ cssVariables: true })}>
        <NetworkContentArticleItem
          article={article}
          peerMatch={null}
          onImport={vi.fn()}
          onShowPeerInfo={vi.fn()}
        />
      </ThemeProvider>
    );

    const links = screen.getAllByRole('link');

    expect(links).toHaveLength(1);
    expect(links[0].textContent).toContain('Network story');
    expect(getComputedStyle(links[0]).display).not.toBe('contents');
  });

  it('keeps the visible button text as the accessible name and the tooltip as description', () => {
    render(
      <ThemeProvider theme={createTheme({ cssVariables: true })}>
        <NetworkContentArticleItem
          article={article}
          peerMatch={null}
          onImport={vi.fn()}
          onShowPeerInfo={vi.fn()}
        />
      </ThemeProvider>
    );

    const connect = screen.getByRole('button', {
      name: 'networkContentPage.connectBtn',
    });

    expect(connect.getAttribute('title')).toBe(
      'networkContentDashboard.noPeer'
    );
  });

  it('names the import button by its visible text', () => {
    render(
      <ThemeProvider theme={createTheme({ cssVariables: true })}>
        <NetworkContentArticleItem
          article={article}
          peerMatch={{ peerId: 'peer-1', peerName: 'Peer' } as never}
          onImport={vi.fn()}
          onShowPeerInfo={vi.fn()}
        />
      </ThemeProvider>
    );

    expect(
      screen.getByRole('button', { name: 'peerArticles.import.import' })
    ).toBeTruthy();
  });
});
