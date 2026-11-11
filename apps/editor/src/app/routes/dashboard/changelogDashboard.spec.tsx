import { useQuery } from '@apollo/client/react';
import { createTheme, ThemeProvider } from '@mui/material';
import { fireEvent, render, screen } from '@testing-library/react';
import {
  type ChangelogEntryFragment,
  ChangelogSeverity,
} from '@wepublish/editor/api';
import { ReactNode } from 'react';
import type { Mock } from 'vitest';

import { ChangelogDashboard } from './changelogDashboard';

// The components call Apollo's hooks with generated documents, so the mock
// sits at the Apollo boundary.
vi.mock('@apollo/client/react', async importOriginal => ({
  ...(await importOriginal<typeof import('@apollo/client/react')>()),
  useQuery: vi.fn(),
  useMutation: () => [vi.fn(), { loading: false }],
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' },
  }),
}));

const mockedUseQuery = useQuery as Mock;

const entry = (
  overrides: Partial<ChangelogEntryFragment> = {}
): ChangelogEntryFragment => ({
  id: 'entry-1',
  name: '20260825120000_entry',
  releasedAt: '2026-08-25T12:00:00.000Z',
  title: 'An entry',
  lead: 'A lead',
  description: null,
  severity: ChangelogSeverity.Info,
  confirmedAt: null,
  confirmedByUserId: null,
  ...overrides,
});

const mockQuery = (
  nodes: ChangelogEntryFragment[] | undefined,
  loading = false
) => {
  mockedUseQuery.mockReturnValue({
    data:
      nodes ?
        {
          changelogEntries: {
            nodes,
            totalCount: nodes.length,
            pageInfo: { hasNextPage: false, hasPreviousPage: false },
          },
        }
      : undefined,
    loading,
    error: undefined,
  });
};

const theme = createTheme({ cssVariables: true });

const renderWithTheme = (ui: ReactNode) =>
  render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);

beforeEach(() => {
  mockedUseQuery.mockReset();
});

describe('ChangelogDashboard', () => {
  it('shows a loader while loading', () => {
    mockQuery(undefined, true);

    renderWithTheme(<ChangelogDashboard />);

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('lists every entry, actions and info alike', () => {
    mockQuery([
      entry({ id: 'entry-1', title: 'First' }),
      entry({
        id: 'entry-2',
        title: 'Urgent',
        severity: ChangelogSeverity.Required,
      }),
    ]);

    renderWithTheme(<ChangelogDashboard />);

    expect(screen.getByText('First')).toBeTruthy();
    expect(screen.getByText('Urgent')).toBeTruthy();
    expect(screen.getByText('changelog.severity.required')).toBeTruthy();
  });

  it('shows the no-entries placeholder when there are no entries', () => {
    mockQuery([]);

    renderWithTheme(<ChangelogDashboard />);

    expect(screen.getByText('changelog.noEntries')).toBeTruthy();
  });

  it('opens the details of an entry', () => {
    mockQuery([entry({ title: 'First', description: 'All the details' })]);

    renderWithTheme(<ChangelogDashboard />);

    fireEvent.click(screen.getByRole('button', { name: 'First' }));

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('All the details')).toBeInTheDocument();
  });
});
