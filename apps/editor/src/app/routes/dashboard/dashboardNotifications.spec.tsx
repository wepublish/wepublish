import { render, screen } from '@testing-library/react';
import { NotificationItem, NotificationSeverity } from '@wepublish/ui/editor';
import { MemoryRouter } from 'react-router-dom';

import { DashboardNotifications } from './dashboardNotifications';

// Each source is reduced to the notifications it contributes, so these tests
// are about how the panel merges and orders them — not about how any single
// source decides what to show.
const { sources } = vi.hoisted(() => ({
  sources: {
    connector: [] as unknown[],
    team: [] as unknown[],
    actionRequired: [] as unknown[],
    jobs: [] as unknown[],
    news: [] as unknown[],
    mayReadJobLogs: true,
  },
}));

const item = (id: string, severity: NotificationSeverity) => (
  <NotificationItem
    key={id}
    severity={severity}
    title={id}
  />
);

vi.mock('@wepublish/editor/api', async importOriginal => ({
  ...(await importOriginal<typeof import('@wepublish/editor/api')>()),
  useNotificationReadsQuery: () => ({ data: { notificationReads: [] } }),
  useMarkNotificationReadMutation: () => [vi.fn()],
}));

vi.mock('@wepublish/membership/editor', () => ({
  usePeriodicJobNotifications: () => sources.jobs,
}));

vi.mock('../../oneMessages/oneMessages', () => ({
  useOneMessageNotifications: () => sources.team,
}));

vi.mock('./changelogDashboard', () => ({
  useChangelogActionNotifications: () => ({
    items: sources.actionRequired,
    overlay: null,
  }),
  useChangelogNewsNotifications: () => ({
    items: sources.news,
    overlay: null,
  }),
}));

vi.mock('./oneChannelAlert', () => ({
  useOneChannelNotifications: () => sources.connector,
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' },
  }),
}));

const renderPanel = () => {
  const { container } = render(
    <MemoryRouter>
      <DashboardNotifications />
    </MemoryRouter>
  );

  const panel = container.querySelector('.rs-panel');

  if (!panel) {
    throw new Error('panel not rendered');
  }

  return panel;
};

/** The titles of the rendered notifications, in the order they appear. */
const renderedOrder = () =>
  Array.from(document.querySelectorAll('.rs-message')).map(
    node => node.textContent ?? ''
  );

beforeEach(() => {
  sources.connector = [];
  sources.team = [];
  sources.actionRequired = [];
  sources.jobs = [];
  sources.news = [];
  sources.mayReadJobLogs = true;
});

it('hides the panel while no source has anything to show', () => {
  const panel = renderPanel();

  expect(panel.hasAttribute('hidden')).toBe(true);
});

it.each([
  ['connector'],
  ['team'],
  ['actionRequired'],
  ['jobs'],
  ['news'],
] as const)(
  'shows the panel with its header as soon as the %s source has something',
  source => {
    sources[source] = [item(`${source}-1`, 'info')];

    const panel = renderPanel();

    expect(panel.hasAttribute('hidden')).toBe(false);
    expect(screen.getByText('dashboard.notifications')).toBeTruthy();
    expect(
      screen.getByRole('link', { name: 'dashboard.showAllNotifications' })
    ).toBeTruthy();
  }
);

it('orders notifications by severity across all sources', () => {
  sources.news = [item('news-info', 'info')];
  sources.actionRequired = [item('action-warning', 'warning')];
  sources.jobs = [item('job-error', 'error')];
  sources.team = [item('team-success', 'success')];

  renderPanel();

  expect(renderedOrder().map(text => text.trim())).toEqual([
    'job-error',
    'action-warning',
    'news-info',
    'team-success',
  ]);
});

it('puts a failing job above a changelog task, whatever the source order', () => {
  sources.actionRequired = [item('changelog-task', 'warning')];
  sources.jobs = [item('failing-job', 'error')];

  renderPanel();

  expect(renderedOrder()[0]?.trim()).toBe('failing-job');
});

it('keeps the order sources were asked in when severities match', () => {
  sources.connector = [item('connector-error', 'error')];
  sources.jobs = [item('job-error', 'error')];

  renderPanel();

  expect(renderedOrder().map(text => text.trim())).toEqual([
    'connector-error',
    'job-error',
  ]);
});
