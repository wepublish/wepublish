import type { Mock } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { ChangelogEntryFragment } from '@wepublish/editor/api';
import { useChangelogEntriesQuery } from '@wepublish/editor/api';

import {
  ChangelogActionRequired,
  ChangelogDashboard,
} from './changelogDashboard';

// Partial mock: the UI library imports enums from the same module.
vi.mock('@wepublish/editor/api', async importOriginal => ({
  ...(await importOriginal<typeof import('@wepublish/editor/api')>()),
  useChangelogEntriesQuery: vi.fn(),
  useConfirmChangelogEntryMutation: () => [vi.fn(), { loading: false }],
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' },
  }),
}));

const mockedUseChangelogEntriesQuery = useChangelogEntriesQuery as Mock;

const entry = (
  overrides: Partial<ChangelogEntryFragment> = {}
): ChangelogEntryFragment => ({
  id: 'entry-1',
  name: '20260825120000_entry',
  releasedAt: '2026-08-25T12:00:00.000Z',
  title: 'An entry',
  lead: 'A lead',
  description: null,
  actionRequired: false,
  confirmedAt: null,
  confirmedByUserId: null,
  ...overrides,
});

const mockQuery = (
  nodes: ChangelogEntryFragment[] | undefined,
  loading = false
) => {
  mockedUseChangelogEntriesQuery.mockReturnValue({
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

beforeEach(() => {
  mockedUseChangelogEntriesQuery.mockReset();
});

describe('ChangelogDashboard', () => {
  it('shows a loader and reports nothing visible while loading', () => {
    mockQuery(undefined, true);
    const onVisibilityChange = vi.fn();

    const { container } = render(
      <ChangelogDashboard onVisibilityChange={onVisibilityChange} />
    );

    expect(container.querySelector('.rs-loader')).toBeTruthy();
    expect(onVisibilityChange).toHaveBeenLastCalledWith(false);
  });

  it('renders entries and reports them as visible', () => {
    mockQuery([
      entry({ id: 'entry-1', title: 'First' }),
      entry({ id: 'entry-2', title: 'Second' }),
    ]);
    const onVisibilityChange = vi.fn();

    render(<ChangelogDashboard onVisibilityChange={onVisibilityChange} />);

    expect(screen.getByText('First')).toBeTruthy();
    expect(screen.getByText('Second')).toBeTruthy();
    expect(onVisibilityChange).toHaveBeenLastCalledWith(true);
  });

  it('shows the placeholder and reports nothing visible when every entry was read', () => {
    mockQuery([entry({ id: 'entry-1', title: 'Read' })]);
    const onVisibilityChange = vi.fn();

    render(
      <ChangelogDashboard
        readEntryIds={new Set(['entry-1'])}
        onVisibilityChange={onVisibilityChange}
      />
    );

    expect(screen.queryByText('Read')).toBeNull();
    expect(screen.getByText('changelog.allCaughtUp')).toBeTruthy();
    expect(onVisibilityChange).toHaveBeenLastCalledWith(false);
  });

  it('shows the no-entries placeholder when the database has no entries', () => {
    mockQuery([]);

    render(<ChangelogDashboard />);

    expect(screen.getByText('changelog.noEntries')).toBeTruthy();
  });

  it('renders nothing instead of the placeholder when hideEmptyState is set', () => {
    mockQuery([]);

    const { container } = render(<ChangelogDashboard hideEmptyState />);

    expect(container.firstChild).toBeNull();
  });

  it('excludes unconfirmed action-required entries when asked to', () => {
    mockQuery([
      entry({ id: 'entry-1', title: 'Pending', actionRequired: true }),
      entry({
        id: 'entry-2',
        title: 'Done',
        actionRequired: true,
        confirmedAt: '2026-08-26T12:00:00.000Z',
      }),
    ]);
    const onVisibilityChange = vi.fn();

    render(
      <ChangelogDashboard
        hideUnconfirmedActionRequired
        onVisibilityChange={onVisibilityChange}
      />
    );

    expect(screen.queryByText('Pending')).toBeNull();
    expect(screen.getByText('Done')).toBeTruthy();
    expect(onVisibilityChange).toHaveBeenLastCalledWith(true);
  });

  it('reports nothing visible when only excluded entries remain', () => {
    mockQuery([
      entry({ id: 'entry-1', title: 'Pending', actionRequired: true }),
    ]);
    const onVisibilityChange = vi.fn();

    const { container } = render(
      <ChangelogDashboard
        hideUnconfirmedActionRequired
        hideEmptyState
        onVisibilityChange={onVisibilityChange}
      />
    );

    expect(container.firstChild).toBeNull();
    expect(onVisibilityChange).toHaveBeenLastCalledWith(false);
  });
});

describe('ChangelogActionRequired', () => {
  it('renders unconfirmed entries and reports them as visible', () => {
    mockQuery([entry({ title: 'Do this', actionRequired: true })]);
    const onVisibilityChange = vi.fn();

    render(<ChangelogActionRequired onVisibilityChange={onVisibilityChange} />);

    expect(screen.getByText('Do this')).toBeTruthy();
    expect(
      screen.getByRole('button', { name: 'notifications.markAsDone' })
    ).toBeTruthy();
    expect(onVisibilityChange).toHaveBeenLastCalledWith(true);
  });

  it('renders nothing and reports nothing visible without entries', () => {
    mockQuery([]);
    const onVisibilityChange = vi.fn();

    const { container } = render(
      <ChangelogActionRequired onVisibilityChange={onVisibilityChange} />
    );

    expect(container.firstChild).toBeNull();
    expect(onVisibilityChange).toHaveBeenLastCalledWith(false);
  });
});
