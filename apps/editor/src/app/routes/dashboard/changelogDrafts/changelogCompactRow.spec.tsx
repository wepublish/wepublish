import { createTheme, ThemeProvider } from '@mui/material';
import { fireEvent, render, screen } from '@testing-library/react';
import {
  type ChangelogEntryFragment,
  ChangelogSeverity,
} from '@wepublish/editor/api';
import { ReactNode } from 'react';

import { ChangelogCompactRow } from './changelogCompactRow';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' },
  }),
}));

const theme = createTheme({ cssVariables: true });

const renderWithTheme = (ui: ReactNode) =>
  render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);

const entry = (
  overrides: Partial<ChangelogEntryFragment> = {}
): ChangelogEntryFragment => ({
  __typename: 'ChangelogEntry',
  id: 'entry-1',
  name: '20260825120000_entry',
  releasedAt: '2026-08-25T12:00:00.000Z',
  title: 'An entry',
  lead: 'A lead that explains the change',
  description: 'More details',
  severity: ChangelogSeverity.Info,
  confirmedAt: null,
  confirmedByUserId: null,
  ...overrides,
});

describe('ChangelogCompactRow', () => {
  it('shows only the heading of an info entry and opens the details on "read more"', () => {
    const onOpen = vi.fn();

    renderWithTheme(
      <ChangelogCompactRow
        severity="info"
        entry={entry()}
        onOpen={onOpen}
      />
    );

    expect(screen.getByText('An entry')).toBeInTheDocument();
    expect(screen.queryByText('A lead that explains the change')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'changelog.readMore' }));

    expect(onOpen).toHaveBeenCalledTimes(1);
  });

  it('keeps the lead of an open action and offers to mark it as done', () => {
    const onConfirm = vi.fn();

    renderWithTheme(
      <ChangelogCompactRow
        severity="error"
        entry={entry({ severity: ChangelogSeverity.Required })}
        onOpen={vi.fn()}
        onConfirm={onConfirm}
      />
    );

    expect(
      screen.getByText('A lead that explains the change')
    ).toBeInTheDocument();
    expect(screen.getByText('changelog.severity.required')).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole('button', { name: 'notifications.markAsDone' })
    );

    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('lets an info entry be marked as read', () => {
    const onMarkRead = vi.fn();

    renderWithTheme(
      <ChangelogCompactRow
        severity="info"
        entry={entry()}
        onOpen={vi.fn()}
        onMarkRead={onMarkRead}
      />
    );

    fireEvent.click(
      screen.getByRole('button', { name: 'notifications.markAsRead' })
    );

    expect(onMarkRead).toHaveBeenCalledTimes(1);
  });
});
