import { useQuery } from '@apollo/client/react';
import { createTheme, ThemeProvider } from '@mui/material';
import { fireEvent, render, renderHook, screen } from '@testing-library/react';
import {
  type ChangelogEntryFragment,
  ChangelogSeverity,
} from '@wepublish/editor/api';
import { ReactNode } from 'react';
import { MemoryRouter } from 'react-router-dom';
import type { Mock } from 'vitest';

import {
  CHANGELOG_SEEN_STORAGE_KEY,
  useWhatsNewDashboardItems,
  WhatsNewButton,
  WhatsNewProvider,
  WhatsNewRequiredBanner,
} from './whatsNew';

vi.mock('@apollo/client/react', async importOriginal => ({
  ...(await importOriginal<typeof import('@apollo/client/react')>()),
  useQuery: vi.fn(),
  useMutation: () => [vi.fn(), { loading: false }],
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

/** Answers the open-actions query and the recent-entries query separately. */
const mockEntries = ({
  actions = [],
  recent = [],
}: {
  actions?: ChangelogEntryFragment[];
  recent?: ChangelogEntryFragment[];
}) => {
  mockedUseQuery.mockImplementation(
    (
      _document,
      options: { skip?: boolean; variables?: { filter?: object } }
    ) => {
      if (options?.skip) {
        return { data: undefined, loading: false };
      }

      const nodes = options?.variables?.filter ? actions : recent;

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

    const { result } = renderHook(
      () => useWhatsNewDashboardItems({ skip: false }),
      { wrapper }
    );

    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].props.severity).toBe('error');
  });

  it('shows nothing to people who cannot sign actions off', () => {
    permission.mayConfirm = false;
    mockEntries({
      actions: [entry({ severity: ChangelogSeverity.Required })],
    });

    const { result } = renderHook(
      () => useWhatsNewDashboardItems({ skip: false }),
      { wrapper }
    );

    expect(result.current.items).toHaveLength(0);
  });

  it('shows nothing while skipped', () => {
    mockEntries({
      actions: [entry({ severity: ChangelogSeverity.Required })],
    });

    const { result } = renderHook(
      () => useWhatsNewDashboardItems({ skip: true }),
      { wrapper }
    );

    expect(result.current.items).toHaveLength(0);
  });
});

describe('WhatsNewButton', () => {
  it('marks unseen entries with a dot until the panel was opened', () => {
    localStorage.setItem(
      CHANGELOG_SEEN_STORAGE_KEY,
      '2026-10-01T00:00:00.000Z'
    );
    mockEntries({
      recent: [entry({ title: 'Brand new', lead: 'What changed' })],
    });

    render(<WhatsNewButton />, { wrapper });

    expect(screen.getByTestId('whats-new-dot')).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole('button', { name: 'changelog.panel.title' })
    );

    expect(screen.queryByTestId('whats-new-dot')).toBeNull();
    expect(localStorage.getItem(CHANGELOG_SEEN_STORAGE_KEY)).toBe(
      '2026-11-01T12:00:00.000Z'
    );

    fireEvent.click(screen.getByRole('button', { name: /Brand new/ }));

    expect(screen.getByText('What changed')).toBeInTheDocument();
  });

  it('shows no dot when everything was seen', () => {
    localStorage.setItem(
      CHANGELOG_SEEN_STORAGE_KEY,
      '2026-11-05T00:00:00.000Z'
    );
    mockEntries({ recent: [entry()] });

    render(<WhatsNewButton />, { wrapper });

    expect(screen.queryByTestId('whats-new-dot')).toBeNull();
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
