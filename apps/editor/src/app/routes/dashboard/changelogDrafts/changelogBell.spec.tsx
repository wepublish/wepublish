import { useMutation, useQuery } from '@apollo/client/react';
import { createTheme, ThemeProvider } from '@mui/material';
import { fireEvent, render, screen, within } from '@testing-library/react';
import {
  type ChangelogEntryFragment,
  ChangelogSeverity,
  NotificationSource,
} from '@wepublish/editor/api';
import { ReactNode } from 'react';
import { MemoryRouter } from 'react-router-dom';
import type { Mock } from 'vitest';

import { ChangelogBell } from './changelogBell';
import { ChangelogRequiredBars } from './changelogRequiredBars';

vi.mock('@apollo/client/react', async importOriginal => ({
  ...(await importOriginal<typeof import('@apollo/client/react')>()),
  useQuery: vi.fn(),
  useMutation: vi.fn(),
}));

const permission = vi.hoisted(() => ({ mayConfirm: true }));

vi.mock('@wepublish/ui/editor', async importOriginal => ({
  ...(await importOriginal<typeof import('@wepublish/ui/editor')>()),
  useHasPermission: () => permission.mayConfirm,
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: { count?: number }) =>
      options?.count !== undefined ? `${key}:${options.count}` : key,
    i18n: { language: 'en' },
  }),
}));

const mockedUseQuery = useQuery as Mock;
const markRead = vi.fn();

const entry = (
  overrides: Partial<ChangelogEntryFragment> = {}
): ChangelogEntryFragment => ({
  __typename: 'ChangelogEntry',
  id: 'entry-1',
  name: '20261101120000_entry',
  releasedAt: '2026-11-01T12:00:00.000Z',
  title: 'An entry',
  lead: 'A lead',
  description: null,
  severity: ChangelogSeverity.Info,
  confirmedAt: null,
  confirmedByUserId: null,
  ...overrides,
});

const mockData = ({
  entries = [],
  readIds = [],
}: {
  entries?: ChangelogEntryFragment[];
  readIds?: string[];
}) => {
  mockedUseQuery.mockImplementation(
    (_document, options?: { variables?: unknown }) => {
      if (!options?.variables) {
        return {
          data: {
            notificationReads: readIds.map(itemId => ({
              id: `read-${itemId}`,
              createdAt: '2026-11-02T00:00:00.000Z',
              source: NotificationSource.Changelog,
              itemId,
            })),
          },
        };
      }

      return {
        data: {
          changelogEntries: {
            nodes: entries,
            totalCount: entries.length,
            pageInfo: { hasNextPage: false },
          },
        },
      };
    }
  );
};

const theme = createTheme({ cssVariables: true });

const renderAt = (ui: ReactNode, path = '/dashboard') =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <ThemeProvider theme={theme}>{ui}</ThemeProvider>
    </MemoryRouter>
  );

beforeEach(() => {
  mockedUseQuery.mockReset();
  markRead.mockReset();
  (useMutation as Mock).mockReturnValue([markRead, { loading: false }]);
  permission.mayConfirm = true;
});

describe('ChangelogBell', () => {
  it('asks only for info entries and counts the unread ones', () => {
    mockData({
      entries: [entry({ id: 'a' }), entry({ id: 'b' }), entry({ id: 'c' })],
      readIds: ['b'],
    });

    renderAt(<ChangelogBell />);

    expect(mockedUseQuery).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        variables: expect.objectContaining({
          filter: { severities: [ChangelogSeverity.Info] },
        }),
      })
    );
    expect(
      screen.getByRole('button', { name: 'changelog.bell.unread:2' })
    ).toBeInTheDocument();
  });

  it('opens a list of headings and marks an entry read when it is opened', () => {
    mockData({ entries: [entry({ id: 'a', title: 'New thing' })] });

    renderAt(<ChangelogBell />);

    fireEvent.click(screen.getByRole('button', { name: /changelog.bell/ }));
    fireEvent.click(screen.getByRole('button', { name: /New thing/ }));

    expect(markRead).toHaveBeenCalledWith({
      variables: { source: NotificationSource.Changelog, itemId: 'a' },
    });
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('marks every unread entry read at once', () => {
    mockData({
      entries: [entry({ id: 'a' }), entry({ id: 'b' })],
      readIds: ['a'],
    });

    renderAt(<ChangelogBell />);

    fireEvent.click(screen.getByRole('button', { name: /changelog.bell/ }));
    fireEvent.click(
      screen.getByRole('button', { name: 'changelog.bell.markAllRead' })
    );

    expect(markRead).toHaveBeenCalledTimes(1);
    expect(markRead).toHaveBeenCalledWith({
      variables: { source: NotificationSource.Changelog, itemId: 'b' },
    });
  });
});

describe('ChangelogRequiredBars', () => {
  it('asks only for open required entries and shows one bar each', () => {
    mockData({
      entries: [
        entry({
          id: 'a',
          title: 'Fix A',
          severity: ChangelogSeverity.Required,
        }),
        entry({
          id: 'b',
          title: 'Fix B',
          severity: ChangelogSeverity.Required,
        }),
      ],
    });

    renderAt(<ChangelogRequiredBars />);

    expect(mockedUseQuery).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        variables: expect.objectContaining({
          filter: {
            severities: [ChangelogSeverity.Required],
            confirmed: false,
          },
        }),
      })
    );

    const bars = screen.getAllByTestId('changelog-required-bar');

    expect(bars).toHaveLength(2);
    expect(within(bars[0]).getByText('Fix A')).toBeInTheDocument();
    expect(
      within(bars[0]).getByRole('button', { name: 'notifications.markAsDone' })
    ).toBeInTheDocument();
  });

  it('leaves out "mark as done" for people who cannot sign it off', () => {
    permission.mayConfirm = false;
    mockData({
      entries: [entry({ severity: ChangelogSeverity.Required })],
    });

    renderAt(<ChangelogRequiredBars />);

    expect(
      screen.queryByRole('button', { name: 'notifications.markAsDone' })
    ).toBeNull();
  });

  it('stays out of the way in the content editors', () => {
    mockData({
      entries: [
        entry({ title: 'Fix A', severity: ChangelogSeverity.Required }),
      ],
    });

    renderAt(<ChangelogRequiredBars />, '/articles/edit/123');

    expect(screen.queryByText('Fix A')).toBeNull();
  });
});
