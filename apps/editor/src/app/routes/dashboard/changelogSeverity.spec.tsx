import { createTheme, ThemeProvider } from '@mui/material';
import { render, screen } from '@testing-library/react';
import { ChangelogSeverity } from '@wepublish/editor/api';
import { ReactNode } from 'react';

import {
  ChangelogSeverityChip,
  changelogNotificationSeverity,
  isChangelogAction,
  isOpenChangelogAction,
} from './changelogSeverity';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const theme = createTheme({ cssVariables: true });

const renderWithTheme = (ui: ReactNode) =>
  render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);

const entry = (
  severity: ChangelogSeverity,
  confirmedAt: string | null = null
) => ({ severity, confirmedAt });

describe('changelog severity helpers', () => {
  it('treats recommended and required entries as actions, info entries not', () => {
    expect(isChangelogAction(entry(ChangelogSeverity.Info))).toBe(false);
    expect(isChangelogAction(entry(ChangelogSeverity.Recommended))).toBe(true);
    expect(isChangelogAction(entry(ChangelogSeverity.Required))).toBe(true);
  });

  it('counts an action as open until it is confirmed', () => {
    expect(isOpenChangelogAction(entry(ChangelogSeverity.Required))).toBe(true);
    expect(
      isOpenChangelogAction(
        entry(ChangelogSeverity.Required, '2026-11-11T10:00:00.000Z')
      )
    ).toBe(false);
    expect(isOpenChangelogAction(entry(ChangelogSeverity.Info))).toBe(false);
  });

  it.each([
    [ChangelogSeverity.Info, null, 'info'],
    [ChangelogSeverity.Recommended, null, 'warning'],
    [ChangelogSeverity.Required, null, 'error'],
    [ChangelogSeverity.Required, '2026-11-11T10:00:00.000Z', 'success'],
    [ChangelogSeverity.Recommended, '2026-11-11T10:00:00.000Z', 'success'],
  ] as const)(
    'maps %s (confirmed: %s) to the notification severity %s',
    (severity, confirmedAt, expected) => {
      expect(changelogNotificationSeverity(entry(severity, confirmedAt))).toBe(
        expected
      );
    }
  );
});

describe('ChangelogSeverityChip', () => {
  it.each([
    [ChangelogSeverity.Recommended, null, 'changelog.severity.recommended'],
    [ChangelogSeverity.Required, null, 'changelog.severity.required'],
    [ChangelogSeverity.Required, '2026-11-11T10:00:00.000Z', 'changelog.done'],
  ] as const)(
    'labels %s (confirmed: %s) as %s',
    (severity, confirmedAt, label) => {
      renderWithTheme(
        <ChangelogSeverityChip entry={entry(severity, confirmedAt)} />
      );

      expect(screen.getByText(label)).toBeInTheDocument();
    }
  );

  it('renders nothing for info entries unless asked to', () => {
    const { container } = renderWithTheme(
      <ChangelogSeverityChip entry={entry(ChangelogSeverity.Info)} />
    );

    expect(container).toBeEmptyDOMElement();

    renderWithTheme(
      <ChangelogSeverityChip
        entry={entry(ChangelogSeverity.Info)}
        showInfo
      />
    );

    expect(screen.getByText('changelog.severity.info')).toBeInTheDocument();
  });
});
