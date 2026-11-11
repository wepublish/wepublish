import { useQuery } from '@apollo/client/react';
import { createTheme, ThemeProvider } from '@mui/material';
import { fireEvent, render, renderHook, screen } from '@testing-library/react';
import {
  type ChangelogEntryFragment,
  ChangelogSeverity,
  NotificationSource,
} from '@wepublish/editor/api';
import { ReactNode } from 'react';
import { MemoryRouter } from 'react-router-dom';
import type { Mock } from 'vitest';

import {
  useWhatsNewDashboardItems,
  WhatsNewButton,
  WhatsNewProvider,
  WhatsNewRequiredBanner,
} from './whatsNew';

vi.mock('@apollo/client/react', async importOriginal => ({
  ...(await importOriginal<typeof import('@apollo/client/react')>()),
  useQuery: vi.fn(),
  useMutation: () => [markRead, { loading: false }],
}));

const markRead = vi.hoisted(() => vi.fn());

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

/** Answers the reads, the open-actions and the recent-entries queries. */
const mockEntries = ({
  actions = [],
  recent = [],
  readIds = [],
}: {
  actions?: ChangelogEntryFragment[];
  recent?: ChangelogEntryFragment[];
  readIds?: string[];
}) => {
  mockedUseQuery.mockImplementation(
    (
      _document,
      options: { skip?: boolean; variables?: { filter?: object } }
    ) => {
      if (options?.skip) {
        return { data: undefined, loading: false };
      }

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

      const nodes = options.variables.filter ? actions : recent;

      return {
        data: {
          changelogEntries: {
            nodes,
            totalCount: nodes.length,
            pageInfo: { hasNextPage: false },
          },
        },
        loading: false,
      };
    }
  );
};

const theme = createTheme({ cssVariables: true });

const wrapper = ({ children }: { children: ReactNode }) => (
  <MemoryRouter>
    <ThemeProvider theme={theme}>
      <WhatsNewProvider>{children}</WhatsNewProvider>
    </ThemeProvider>
  </MemoryRouter>
);

beforeEach(() => {
  mockedUseQuery.mockReset();
  markRead.mockReset();
  localStorage.clear();
  permission.mayConfirm = true;
});

describe('useWhatsNewDashboardItems', () => {
  it('sums the open actions up in one item for admins, red when one is required', () => {
    mockEntries({
      actions: [
        entry({ id: 'a', severity: ChangelogSeverity.Required }),
        entry({ id: 'b', severity: ChangelogSeverity.Recommended }),
      ],
    });

    const { result } = renderHook(() => useWhatsNewDashboardItems(), {
      wrapper,
    });

    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].props.severity).toBe('error');
  });

  it('shows nothing to people who cannot sign actions off', () => {
    permission.mayConfirm = false;
    mockEntries({
      actions: [entry({ severity: ChangelogSeverity.Required })],
    });

    const { result } = renderHook(() => useWhatsNewDashboardItems(), {
      wrapper,
    });

    expect(result.current.items).toHaveLength(0);
  });
});

describe('WhatsNewButton', () => {
  it('marks unseen entries with a dot until the panel was opened', () => {
    mockEntries({
      recent: [
        entry({ id: 'new', title: 'Brand new', lead: 'What changed' }),
        entry({ id: 'old', title: 'Old news' }),
      ],
      readIds: ['old'],
    });

    render(<WhatsNewButton />, { wrapper });

    expect(screen.getByTestId('whats-new-dot')).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole('button', { name: 'changelog.panel.title' })
    );

    expect(markRead).toHaveBeenCalledWith({
      variables: { source: NotificationSource.Changelog, itemIds: ['new'] },
    });
    expect(screen.queryByTestId('whats-new-dot')).toBeNull();
    expect(screen.getAllByLabelText('changelog.panel.new')).toHaveLength(1);

    fireEvent.click(screen.getByRole('button', { name: /Brand new/ }));

    expect(screen.getByText('What changed')).toBeInTheDocument();
  });

  it('shows no dot and marks nothing when everything was seen', () => {
    mockEntries({ recent: [entry()], readIds: ['entry-1'] });

    render(<WhatsNewButton />, { wrapper });

    expect(screen.queryByTestId('whats-new-dot')).toBeNull();

    fireEvent.click(
      screen.getByRole('button', { name: 'changelog.panel.title' })
    );

    expect(markRead).not.toHaveBeenCalled();
  });
});

describe('WhatsNewRequiredBanner', () => {
  it('shows an open required action to admins until it is snoozed', () => {
    mockEntries({
      actions: [
        entry({
          title: 'Fix the secret',
          severity: ChangelogSeverity.Required,
        }),
        entry({
          id: 'b',
          title: 'Optional step',
          severity: ChangelogSeverity.Recommended,
        }),
      ],
    });

    render(<WhatsNewRequiredBanner />, { wrapper });

    expect(screen.getByText('Fix the secret')).toBeInTheDocument();
    expect(screen.queryByText('Optional step')).toBeNull();

    fireEvent.click(
      screen.getByRole('button', { name: 'changelog.panel.snooze' })
    );

    expect(screen.queryByText('Fix the secret')).toBeNull();
  });

  it('stays hidden for people who cannot act on it', () => {
    permission.mayConfirm = false;
    mockEntries({
      actions: [
        entry({
          title: 'Fix the secret',
          severity: ChangelogSeverity.Required,
        }),
      ],
    });

    render(<WhatsNewRequiredBanner />, { wrapper });

    expect(screen.queryByText('Fix the secret')).toBeNull();
  });
});
