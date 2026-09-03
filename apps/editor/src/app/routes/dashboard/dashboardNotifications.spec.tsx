import { act, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import { DashboardNotifications } from './dashboardNotifications';

type VisibilityReporter = (visible: boolean) => void;
type VisibilityProps = { onVisibilityChange?: VisibilityReporter };

// The child components report whether they render anything through
// onVisibilityChange. The mocks capture those callbacks so the tests can
// drive the panel from the outside.
const { reporters } = vi.hoisted(() => ({
  reporters: {} as Record<string, VisibilityReporter | undefined>,
}));

// Partial mock: the UI library imports enums from the same module.
vi.mock('@wepublish/editor/api', async importOriginal => ({
  ...(await importOriginal<typeof import('@wepublish/editor/api')>()),
  useNotificationReadsQuery: () => ({ data: { notificationReads: [] } }),
  useMarkNotificationReadMutation: () => [vi.fn()],
}));

vi.mock('@wepublish/membership/editor', () => ({
  PeriodicJobsLog: ({ onVisibilityChange }: VisibilityProps) => {
    reporters.jobLogs = onVisibilityChange;
    return null;
  },
}));

vi.mock('../../oneMessages/oneMessages', () => ({
  OneMessages: ({ onVisibilityChange }: VisibilityProps) => {
    reporters.team = onVisibilityChange;
    return null;
  },
}));

vi.mock('./changelogDashboard', () => ({
  ChangelogActionRequired: ({ onVisibilityChange }: VisibilityProps) => {
    reporters.actionRequired = onVisibilityChange;
    return null;
  },
  ChangelogDashboard: ({ onVisibilityChange }: VisibilityProps) => {
    reporters.recent = onVisibilityChange;
    return null;
  },
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

const report = (source: string, visible: boolean) =>
  act(() => {
    reporters[source]?.(visible);
  });

beforeEach(() => {
  for (const key of Object.keys(reporters)) {
    delete reporters[key];
  }
});

it('hides the panel while no source has anything to show', () => {
  const panel = renderPanel();

  expect(panel.hasAttribute('hidden')).toBe(true);
  expect(Object.keys(reporters).sort()).toEqual([
    'actionRequired',
    'jobLogs',
    'recent',
    'team',
  ]);
});

it('keeps the panel hidden when every source reports nothing to show', () => {
  const panel = renderPanel();

  report('team', false);
  report('actionRequired', false);
  report('jobLogs', false);
  report('recent', false);

  expect(panel.hasAttribute('hidden')).toBe(true);
});

it.each(['team', 'actionRequired', 'jobLogs', 'recent'])(
  'shows the panel with its header as soon as the %s source has something to show',
  source => {
    const panel = renderPanel();

    report(source, true);

    expect(panel.hasAttribute('hidden')).toBe(false);
    expect(screen.getByText('dashboard.notifications')).toBeTruthy();
    expect(
      screen.getByRole('link', { name: 'dashboard.showAllNotifications' })
    ).toBeTruthy();
  }
);

it('stays visible while at least one source still has something to show', () => {
  const panel = renderPanel();

  report('team', true);
  report('jobLogs', true);
  report('team', false);

  expect(panel.hasAttribute('hidden')).toBe(false);
});

it('hides the panel again once the last source runs empty', () => {
  const panel = renderPanel();

  report('recent', true);
  expect(panel.hasAttribute('hidden')).toBe(false);

  report('recent', false);
  expect(panel.hasAttribute('hidden')).toBe(true);
});
