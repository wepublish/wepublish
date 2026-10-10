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

vi.mock('@wepublish/ui/editor', async importOriginal => ({
  ...(await importOriginal<typeof import('@wepublish/ui/editor')>()),
  ActivityFeed: () => <div data-testid="activity-content" />,
}));

const renderDashboard = () =>
  render(
    <MemoryRouter>
      <Dashboard />
    </MemoryRouter>
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
