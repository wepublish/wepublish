import { createTheme, ThemeProvider } from '@mui/material';
import { render, screen } from '@testing-library/react';
import { ReactNode } from 'react';

import { RevisionHistory } from './revision-history.component';
import {
  PuckRevisionHistory,
  PuckRevisionHistoryContext,
} from './revision-history.context';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) =>
      opts && 'count' in opts ? `${key}:${opts.count}` : key,
    i18n: { language: 'en' },
  }),
}));

const theme = createTheme({ cssVariables: true });

const renderHistory = (children: ReactNode) =>
  render(<ThemeProvider theme={theme}>{children}</ThemeProvider>);

const history = (
  overrides: Partial<PuckRevisionHistory> = {}
): PuckRevisionHistory => ({
  revisions: [
    {
      id: 'draft',
      createdAt: '2026-10-29T10:00:00.000Z',
      title: 'Working draft',
    },
    {
      id: 'published',
      createdAt: '2026-10-20T10:00:00.000Z',
      publishedAt: '2026-10-21T10:00:00.000Z',
      title: 'Live version',
    },
  ],
  draftId: 'draft',
  publishedId: 'published',
  ...overrides,
});

describe('RevisionHistory', () => {
  it('shows an empty history without a provider', () => {
    renderHistory(<RevisionHistory />);

    expect(screen.getByText('versionHistory.subtitle:0')).toBeInTheDocument();
    expect(screen.getByText('versionHistory.empty')).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'versionHistory.restore' })
    ).not.toBeInTheDocument();
  });

  it('lists the revisions of the provider', () => {
    renderHistory(
      <PuckRevisionHistoryContext.Provider value={history({ totalCount: 7 })}>
        <RevisionHistory />
      </PuckRevisionHistoryContext.Provider>
    );

    expect(screen.getByText('versionHistory.subtitle:7')).toBeInTheDocument();
    expect(screen.getByText('Working draft')).toBeInTheDocument();
    expect(screen.getByText('Live version')).toBeInTheDocument();
  });
});
