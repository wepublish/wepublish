import type { Mock } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { PeriodicJob } from '@wepublish/editor/api';
import {
  useNotificationConfirmationsQuery,
  usePeriodicJobLogsQuery,
} from '@wepublish/editor/api';

import { PeriodicJobsLog } from './periodic-job-logs';

// Partial mock: the UI library imports enums from the same module.
vi.mock('@wepublish/editor/api', async importOriginal => ({
  ...(await importOriginal<typeof import('@wepublish/editor/api')>()),
  usePeriodicJobLogsQuery: vi.fn(),
  useNotificationConfirmationsQuery: vi.fn(),
  useConfirmNotificationMutation: () => [vi.fn(), { loading: false }],
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' },
  }),
}));

const mockedUsePeriodicJobLogsQuery = usePeriodicJobLogsQuery as Mock;
const mockedUseNotificationConfirmationsQuery =
  useNotificationConfirmationsQuery as Mock;

const now = new Date().toISOString();

const job = (overrides: Partial<PeriodicJob> = {}): PeriodicJob => ({
  id: 'job-1',
  createdAt: now,
  modifiedAt: now,
  date: now,
  executionTime: now,
  successfullyFinished: now,
  finishedWithError: null,
  tries: 1,
  error: null,
  ...overrides,
});

const failedJob = (overrides: Partial<PeriodicJob> = {}) =>
  job({
    successfullyFinished: null,
    finishedWithError: now,
    error: 'Something broke',
    ...overrides,
  });

const mockJobs = (jobs: PeriodicJob[] | undefined, loading = false) => {
  mockedUsePeriodicJobLogsQuery.mockReturnValue({
    data: jobs ? { periodicJobLog: jobs } : undefined,
    loading,
  });
};

const mockConfirmations = (itemIds: string[]) => {
  mockedUseNotificationConfirmationsQuery.mockReturnValue({
    data: {
      notificationConfirmations: itemIds.map(itemId => ({
        id: `confirmation-${itemId}`,
        source: 'PERIODIC_JOB',
        itemId,
      })),
    },
  });
};

beforeEach(() => {
  mockedUsePeriodicJobLogsQuery.mockReset();
  mockedUseNotificationConfirmationsQuery.mockReset();
  mockConfirmations([]);
});

describe('PeriodicJobsLog in problems-only mode', () => {
  it('renders nothing and reports nothing visible while loading', () => {
    mockJobs(undefined, true);
    const onVisibilityChange = vi.fn();

    const { container } = render(
      <PeriodicJobsLog
        onlyProblems
        onVisibilityChange={onVisibilityChange}
      />
    );

    expect(container.firstChild).toBeNull();
    expect(onVisibilityChange).toHaveBeenLastCalledWith(false);
  });

  it('renders nothing and reports nothing visible when the runs succeeded', () => {
    mockJobs([job()]);
    const onVisibilityChange = vi.fn();

    const { container } = render(
      <PeriodicJobsLog
        onlyProblems
        onVisibilityChange={onVisibilityChange}
      />
    );

    expect(container.firstChild).toBeNull();
    expect(onVisibilityChange).toHaveBeenLastCalledWith(false);
  });

  it('renders failed runs and reports them as visible', () => {
    mockJobs([failedJob()]);
    const onVisibilityChange = vi.fn();

    render(
      <PeriodicJobsLog
        onlyProblems
        onVisibilityChange={onVisibilityChange}
      />
    );

    expect(screen.getByText(/periodicJobsLog.failedJob/)).toBeTruthy();
    expect(screen.getByText('Something broke')).toBeTruthy();
    expect(onVisibilityChange).toHaveBeenLastCalledWith(true);
  });

  it('hides runs that succeeded after a retry', () => {
    mockJobs([failedJob({ successfullyFinished: now, tries: 2 })]);
    const onVisibilityChange = vi.fn();

    const { container } = render(
      <PeriodicJobsLog
        onlyProblems
        onVisibilityChange={onVisibilityChange}
      />
    );

    expect(container.firstChild).toBeNull();
    expect(onVisibilityChange).toHaveBeenLastCalledWith(false);
  });

  it('hides failed runs the team already marked as done', () => {
    mockJobs([failedJob({ id: 'job-7' })]);
    mockConfirmations(['job-7']);
    const onVisibilityChange = vi.fn();

    const { container } = render(
      <PeriodicJobsLog
        onlyProblems
        teamConfirm
        onVisibilityChange={onVisibilityChange}
      />
    );

    expect(container.firstChild).toBeNull();
    expect(onVisibilityChange).toHaveBeenLastCalledWith(false);
  });

  it('offers the team-wide mark-as-done action when enabled', () => {
    mockJobs([failedJob()]);

    render(
      <PeriodicJobsLog
        onlyProblems
        teamConfirm
      />
    );

    expect(
      screen.getByRole('button', { name: 'notifications.markAsDone' })
    ).toBeTruthy();
  });
});

describe('PeriodicJobsLog in archive mode', () => {
  it('renders successful runs as well and reports them as visible', () => {
    mockJobs([job()]);
    const onVisibilityChange = vi.fn();

    render(<PeriodicJobsLog onVisibilityChange={onVisibilityChange} />);

    expect(screen.getByText(/: OK$/)).toBeTruthy();
    expect(onVisibilityChange).toHaveBeenLastCalledWith(true);
  });
});
