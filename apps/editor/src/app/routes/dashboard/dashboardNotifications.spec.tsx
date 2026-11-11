import { render, screen } from '@testing-library/react';
import { ChangelogSeverity } from '@wepublish/editor/api';
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
    whatsNew: [] as unknown[],
    mayReadJobLogs: true,
  },
}));

const { draft, calls } = vi.hoisted(() => ({
  draft: { current: 1 },
  calls: {
    action: [] as Record<string, unknown>[],
    news: [] as Record<string, unknown>[],
    whatsNew: [] as Record<string, unknown>[],
  },
}));

const item = (id: string, severity: NotificationSeverity) => (
  <NotificationItem
    key={id}
    severity={severity}
    title={id}
  />
);

// The panel calls Apollo's hooks with generated documents, so the mock sits at
// the Apollo boundary.
vi.mock('@apollo/client/react', async importOriginal => ({
  ...(await importOriginal<typeof import('@apollo/client/react')>()),
  useQuery: () => ({ data: { notificationReads: [] } }),
  useMutation: () => [vi.fn(), { loading: false }],
}));

vi.mock('@wepublish/membership/editor', () => ({
  usePeriodicJobNotifications: () => sources.jobs,
}));

vi.mock('../../oneMessages/oneMessages', () => ({
  useOneMessageNotifications: () => sources.team,
}));

vi.mock('./changelogDashboard', () => ({
  useChangelogActionNotifications: (props: Record<string, unknown>) => {
    calls.action.push(props);

    return { items: sources.actionRequired, overlay: null };
  },
  useChangelogNewsNotifications: (props: Record<string, unknown>) => {
    calls.news.push(props);

    return { items: sources.news, overlay: null };
  },
}));

vi.mock('./changelogDrafts/changelogDraft', () => ({
  useChangelogDraft: () => [draft.current, vi.fn()],
}));

vi.mock('./changelogDrafts/whatsNew', () => ({
  useWhatsNewDashboardItems: (props: Record<string, unknown>) => {
    calls.whatsNew.push(props);

    return { items: sources.whatsNew, overlay: null };
  },
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

  const panel = container.querySelector('.MuiCard-root');

  if (!panel) {
    throw new Error('panel not rendered');
  }

  return panel;
};

/** The titles of the rendered notifications, in the order they appear. */
const renderedOrder = () =>
  Array.from(document.querySelectorAll('[role="alert"]')).map(
    node => node.textContent ?? ''
  );

beforeEach(() => {
  sources.connector = [];
  sources.team = [];
  sources.actionRequired = [];
  sources.jobs = [];
  sources.news = [];
  sources.whatsNew = [];
  sources.mayReadJobLogs = true;
  draft.current = 1;
  calls.action = [];
  calls.news = [];
  calls.whatsNew = [];
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

it('caps the panel and still shows every category that has something', () => {
  sources.jobs = Array.from({ length: 8 }, (_, index) =>
    item(`job-${index}`, 'error')
  );
  sources.team = [item('team-info', 'info')];
  sources.news = [item('news-info', 'info')];

  renderPanel();

  expect(renderedOrder().map(text => text.trim())).toEqual([
    'job-0',
    'job-1',
    'team-info',
    'news-info',
  ]);
  expect(
    screen
      .getByRole('link', { name: 'dashboard.moreNotifications' })
      .getAttribute('href')
  ).toBe('/notifications');
});

it('shows no hint while nothing is hidden', () => {
  sources.jobs = [item('job', 'error')];

  renderPanel();

  expect(
    screen.queryByRole('link', { name: 'dashboard.moreNotifications' })
  ).toBeNull();
});

it('shows the body of the most severe item only', () => {
  sources.jobs = [
    <NotificationItem
      key="job"
      severity="error"
      title="job"
    >
      {'job body'}
    </NotificationItem>,
  ];
  sources.team = [
    <NotificationItem
      key="team"
      severity="info"
      title="team"
    >
      {'team body'}
    </NotificationItem>,
  ];

  renderPanel();

  expect(screen.getByText('job body')).toBeTruthy();
  expect(screen.queryByText('team body')).toBeNull();
});

describe('changelog drafts', () => {
  it('draft 1 renders both changelog sources as compact rows', () => {
    draft.current = 1;

    renderPanel();

    expect(calls.action.at(-1)).toMatchObject({
      variant: 'compact',
      skip: false,
    });
    expect(calls.news.at(-1)).toMatchObject({
      variant: 'compact',
      skip: false,
    });
    expect(calls.whatsNew.at(-1)).toMatchObject({ skip: true });
  });

  it('draft 2 keeps only recommended actions in the panel', () => {
    draft.current = 2;

    renderPanel();

    expect(calls.action.at(-1)).toMatchObject({
      severities: [ChangelogSeverity.Recommended],
      skip: false,
    });
    expect(calls.news.at(-1)).toMatchObject({ skip: true });
  });

  it('draft 3 replaces the changelog items with the "What\'s new" summary', () => {
    draft.current = 3;
    sources.whatsNew = [item('open-steps', 'warning')];

    renderPanel();

    expect(calls.action.at(-1)).toMatchObject({ skip: true });
    expect(calls.news.at(-1)).toMatchObject({ skip: true });
    expect(calls.whatsNew.at(-1)).toMatchObject({ skip: false });
    expect(renderedOrder().map(text => text.trim())).toEqual(['open-steps']);
  });
});
