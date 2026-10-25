import { createTheme, ThemeProvider } from '@mui/material';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { CanGetPeriodicJobLog } from '@wepublish/permissions';
import { AuthContext } from '@wepublish/ui/editor';

import { NotificationsPage } from './notificationsPage';

const theme = createTheme({ cssVariables: true });

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' },
  }),
}));

vi.mock('@wepublish/membership/editor', () => ({
  PeriodicJobsLog: () => <div data-testid="job-logs" />,
}));

vi.mock('../../oneMessages/oneMessages', () => ({
  OneMessages: () => <div data-testid="team-messages" />,
}));

vi.mock('../dashboard/changelogDashboard', () => ({
  ChangelogDashboard: () => <div data-testid="changelog" />,
}));

const renderPage = () =>
  render(
    <ThemeProvider theme={theme}>
      <AuthContext.Provider
        value={
          {
            session: {
              sessionRoles: [
                { id: 'role', permissions: [{ id: CanGetPeriodicJobLog.id }] },
              ],
            },
          } as never
        }
      >
        <NotificationsPage />
      </AuthContext.Provider>
    </ThemeProvider>
  );

describe('NotificationsPage', () => {
  it('ties the selected tab to a panel named after it', () => {
    renderPage();

    const tab = screen.getByRole('tab', { name: 'changelog.whatsNew' });
    const panel = screen.getByRole('tabpanel', {
      name: 'changelog.whatsNew',
    });

    expect(tab).toHaveAttribute('aria-controls', panel.id);
    expect(within(panel).getByTestId('changelog')).toBeInTheDocument();
  });

  it('moves the panel along with the selected tab', () => {
    renderPage();

    fireEvent.click(screen.getByRole('tab', { name: 'periodicJobsLog.title' }));

    expect(
      within(
        screen.getByRole('tabpanel', { name: 'periodicJobsLog.title' })
      ).getByTestId('job-logs')
    ).toBeInTheDocument();
  });

  it('scrolls the tab row instead of clipping it on narrow screens', () => {
    renderPage();

    expect(
      screen.getByRole('tablist').closest('.MuiTabs-scroller')
    ).toHaveClass('MuiTabs-scrollableX');
  });
});
