import { createTheme, ThemeProvider } from '@mui/material';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import { Dashboard } from './dashboard';
import { DASHBOARD_LAYOUT_STORAGE_KEY } from './useDashboardLayout';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' },
  }),
}));

vi.mock('../audience/audience-dashboard', () => ({
  AudienceDashboard: () => <div data-testid="audience-content" />,
}));

vi.mock('../networkContent/networkContentDashboard', () => ({
  default: () => <div data-testid="network-content" />,
}));

vi.mock('./dashboardNotifications', () => ({
  DashboardNotifications: () => <section data-testid="notifications-content" />,
}));

vi.mock('./externalAppsDashboard', () => ({
  ExternalAppsDashboard: () => <div data-testid="external-apps-content" />,
}));

const reviewQueueAccess = vi.hoisted(() => ({
  current: undefined as boolean | undefined,
}));

vi.mock('@wepublish/event/editor', () => ({
  ReviewQueueCard: () => <div data-testid="review-queue-content" />,
  useReviewQueueAccess: () => reviewQueueAccess.current,
}));

vi.mock('@wepublish/ui/editor', async importOriginal => ({
  ...(await importOriginal<typeof import('@wepublish/ui/editor')>()),
  ActivityFeed: () => <div data-testid="activity-content" />,
}));

const theme = createTheme({ cssVariables: true });

const renderDashboard = () =>
  render(
    <ThemeProvider theme={theme}>
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    </ThemeProvider>
  );

const shownCards = (container: HTMLElement) =>
  [...container.querySelectorAll('[data-dashboard-card]')].map(card =>
    card.getAttribute('data-dashboard-card')
  );

const storedLayout = () =>
  JSON.parse(localStorage.getItem(DASHBOARD_LAYOUT_STORAGE_KEY) ?? 'null');

describe('Dashboard', () => {
  afterEach(() => {
    localStorage.clear();
    reviewQueueAccess.current = undefined;
  });

  it('shows the review queue to whoever may work through it', () => {
    reviewQueueAccess.current = true;

    const { container } = renderDashboard();

    expect(shownCards(container)).toContain('reviewQueue');
    expect(screen.getByTestId('review-queue-content')).toBeDefined();
  });

  it.each([false, undefined])(
    'leaves the review queue out of the grid and the settings when access is %s',
    access => {
      reviewQueueAccess.current = access;

      const { container } = renderDashboard();

      expect(shownCards(container)).not.toContain('reviewQueue');

      fireEvent.click(
        screen.getByRole('button', { name: 'dashboard.configure' })
      );

      expect(
        within(screen.getByRole('dialog')).queryByRole('checkbox', {
          name: 'dashboard.reviewQueue',
        })
      ).toBeNull();
    }
  );

  it('moves a card past a card the user cannot see', () => {
    localStorage.setItem(
      DASHBOARD_LAYOUT_STORAGE_KEY,
      JSON.stringify({
        version: 1,
        cards: [
          { id: 'activity', visible: true },
          { id: 'reviewQueue', visible: true },
          { id: 'audience', visible: true },
          { id: 'externalApps', visible: true },
        ],
      })
    );

    const { container } = renderDashboard();

    fireEvent.click(
      screen.getByRole('button', { name: 'dashboard.configure' })
    );
    const audienceRow = within(screen.getByRole('dialog'))
      .getByRole('checkbox', { name: 'dashboard.audience' })
      .closest('[data-dashboard-config-card]') as HTMLElement;
    fireEvent.click(
      within(audienceRow).getByRole('button', { name: 'dashboard.moveUp' })
    );

    expect(shownCards(container).slice(2)).toEqual([
      'audience',
      'activity',
      'externalApps',
    ]);
  });

  it('shows the activity feed right below the sticky cards by default', () => {
    const { container } = renderDashboard();

    expect(shownCards(container)).toEqual([
      'notifications',
      'network',
      'activity',
      'audience',
      'externalApps',
    ]);
    expect(screen.getByTestId('activity-content')).toBeDefined();
  });

  it('follows the layout stored in this browser', () => {
    localStorage.setItem(
      DASHBOARD_LAYOUT_STORAGE_KEY,
      JSON.stringify({
        version: 1,
        cards: [
          { id: 'audience', visible: true },
          { id: 'activity', visible: false },
          { id: 'externalApps', visible: true },
        ],
      })
    );

    const { container } = renderDashboard();

    expect(shownCards(container)).toEqual([
      'notifications',
      'network',
      'audience',
      'externalApps',
    ]);
  });

  it('hides a card from the configuration dialog and remembers it', () => {
    const { container } = renderDashboard();

    fireEvent.click(
      screen.getByRole('button', { name: 'dashboard.configure' })
    );
    const dialog = screen.getByRole('dialog');
    fireEvent.click(
      within(dialog).getByRole('checkbox', { name: 'dashboard.activity' })
    );

    expect(shownCards(container)).not.toContain('activity');
    expect(storedLayout().cards).toContainEqual({
      id: 'activity',
      visible: false,
    });
  });

  it('moves a card up from the configuration dialog and remembers it', () => {
    const { container } = renderDashboard();

    fireEvent.click(
      screen.getByRole('button', { name: 'dashboard.configure' })
    );
    const dialog = screen.getByRole('dialog');
    const audienceRow = within(dialog)
      .getByRole('checkbox', { name: 'dashboard.audience' })
      .closest('[data-dashboard-config-card]') as HTMLElement;
    fireEvent.click(
      within(audienceRow).getByRole('button', { name: 'dashboard.moveUp' })
    );

    expect(shownCards(container).slice(2)).toEqual([
      'audience',
      'activity',
      'externalApps',
    ]);
    expect(storedLayout().cards.map(({ id }: { id: string }) => id)).toEqual([
      'audience',
      'activity',
      'externalApps',
      'reviewQueue',
    ]);
  });

  it('lets the activity feed span both columns, set in the configuration dialog', () => {
    const { container } = renderDashboard();

    fireEvent.click(
      screen.getByRole('button', { name: 'dashboard.configure' })
    );
    const dialog = screen.getByRole('dialog');

    expect(
      within(dialog).getAllByRole('button', { name: 'dashboard.fullWidth' })
    ).toHaveLength(1);

    const activityRow = within(dialog)
      .getByRole('checkbox', { name: 'dashboard.activity' })
      .closest('[data-dashboard-config-card]') as HTMLElement;
    const fullWidth = within(activityRow).getByRole('button', {
      name: 'dashboard.fullWidth',
    });
    expect(fullWidth.getAttribute('aria-pressed')).toBe('false');

    fireEvent.click(fullWidth);

    expect(fullWidth.getAttribute('aria-pressed')).toBe('true');

    expect(
      container
        .querySelector("[data-dashboard-card='activity']")
        ?.getAttribute('data-full-width')
    ).toBe('true');
    expect(storedLayout().cards).toContainEqual({
      id: 'activity',
      visible: true,
      fullWidth: true,
    });
  });

  it('keeps working when the stored layout is unreadable', () => {
    localStorage.setItem(DASHBOARD_LAYOUT_STORAGE_KEY, '{not json');

    const { container } = renderDashboard();

    expect(shownCards(container)).toContain('activity');
  });
});
