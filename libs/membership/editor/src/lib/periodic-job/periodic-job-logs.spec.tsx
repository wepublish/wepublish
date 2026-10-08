import type { Mock } from 'vitest';
import { useMutation, useQuery } from '@apollo/client/react';
import { fireEvent, render, screen } from '@testing-library/react';
import type { FullPeriodicJobFragment } from '@wepublish/editor/api';
import {
  NotificationConfirmationsDocument,
  PeriodicJobLogsDocument,
} from '@wepublish/editor/api';
import { useHasPermission } from '@wepublish/ui/editor';

import { PeriodicJobsLog } from './periodic-job-logs';

// The component calls Apollo's `useQuery` with a generated document, so the
// mock sits at the Apollo boundary and dispatches on the document it is given.
vi.mock('@apollo/client/react', async importOriginal => ({
  ...(await importOriginal<typeof import('@apollo/client/react')>()),
  useQuery: vi.fn(),
  useMutation: vi.fn(),
}));

vi.mock('@wepublish/ui/editor', async importOriginal => ({
  ...(await importOriginal<typeof import('@wepublish/ui/editor')>()),
  useHasPermission: vi.fn(),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' },
  }),
}));

const mockedUseQuery = useQuery as unknown as Mock;
const mockedUseMutation = useMutation as Mock;
const mockedUseHasPermission = useHasPermission as unknown as Mock;
const retryPeriodicJob = vi.fn();
const startPolling = vi.fn();
const stopPolling = vi.fn();

// Results keyed by the document each query is issued with.
const queryResults = new Map<unknown, unknown>();

const setQueryResult = (document: unknown, result: unknown) => {
  queryResults.set(document, result);
};

const now = new Date().toISOString();

const job = (
  overrides: Partial<FullPeriodicJobFragment> = {}
): FullPeriodicJobFragment => ({
  __typename: 'PeriodicJob',
  id: 'job-1',
  createdAt: now,
  modifiedAt: now,
  date: now,
  executionTime: now,
  successfullyFinished: now,
  finishedWithError: null,
  running: false,
  tries: 1,
  error: null,
  ...overrides,
});

const failedJob = (overrides: Partial<FullPeriodicJobFragment> = {}) =>
  job({
    successfullyFinished: null,
    finishedWithError: now,
    error: 'Something broke',
    ...overrides,
  });

const mockJobs = (
  jobs: FullPeriodicJobFragment[] | undefined,
  loading = false
) => {
  setQueryResult(PeriodicJobLogsDocument, {
    data: jobs ? { periodicJobLog: jobs } : undefined,
    loading,
    startPolling,
    stopPolling,
  });
};

const mockConfirmations = (itemIds: string[]) => {
  setQueryResult(NotificationConfirmationsDocument, {
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
  queryResults.clear();
  vi.clearAllMocks();
  mockedUseQuery.mockImplementation(
    (document: unknown) => queryResults.get(document) ?? { data: undefined }
  );
  mockedUseMutation.mockReturnValue([retryPeriodicJob, { loading: false }]);
  mockedUseHasPermission.mockReturnValue(true);
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

  it('offers no way to mark a failed run as done', () => {
    mockJobs([failedJob({ id: 'job-7' })]);

    render(<PeriodicJobsLog onlyProblems />);

    expect(
      screen.getAllByRole('button').map(button => button.textContent)
    ).toEqual(['periodicJobsLog.retry']);
  });

  it('shows a run that is going on, so a retry in progress stays visible', () => {
    mockJobs([failedJob({ running: true })]);
    const onVisibilityChange = vi.fn();

    render(
      <PeriodicJobsLog
        onlyProblems
        onVisibilityChange={onVisibilityChange}
      />
    );

    expect(screen.getByText(/periodicJobsLog.running$/)).toBeTruthy();
    expect(onVisibilityChange).toHaveBeenLastCalledWith(true);
  });

  it('keeps showing a failed run even when a confirmation exists for it', () => {
    mockJobs([failedJob({ id: 'job-7' })]);
    mockConfirmations(['job-7']);
    const onVisibilityChange = vi.fn();

    render(
      <PeriodicJobsLog
        onlyProblems
        onVisibilityChange={onVisibilityChange}
      />
    );

    expect(screen.getByText(/periodicJobsLog.failedJob/)).toBeTruthy();
    expect(onVisibilityChange).toHaveBeenLastCalledWith(true);
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

describe('retrying a failed run', () => {
  it('offers to retry the failed run and starts the retry', () => {
    mockJobs([failedJob()]);

    render(<PeriodicJobsLog />);
    fireEvent.click(
      screen.getByRole('button', { name: 'periodicJobsLog.retry' })
    );

    expect(retryPeriodicJob).toHaveBeenCalledTimes(1);
  });

  it('shows a run that was cut off as failed, so it can be retried', () => {
    mockJobs([job({ successfullyFinished: null, running: false })]);

    render(<PeriodicJobsLog onlyProblems />);

    expect(screen.getByText(/periodicJobsLog.failedJob/)).toBeTruthy();
    expect(
      screen.getByRole('button', { name: 'periodicJobsLog.retry' })
    ).toBeTruthy();
  });

  it('offers no retry to someone who may not retry', () => {
    mockedUseHasPermission.mockReturnValue(false);
    mockJobs([failedJob()]);

    render(<PeriodicJobsLog />);

    expect(screen.queryByRole('button')).toBeNull();
  });

  it('offers no retry for a run that succeeded in the end', () => {
    mockJobs([failedJob({ successfullyFinished: now, tries: 2 })]);

    render(<PeriodicJobsLog />);

    expect(screen.queryByRole('button')).toBeNull();
  });

  it('offers no retry while a run is going on and says why', () => {
    mockJobs([failedJob({ running: true })]);

    render(<PeriodicJobsLog />);

    expect(screen.queryByRole('button')).toBeNull();
    expect(screen.getByText('periodicJobsLog.runningHint')).toBeTruthy();
  });

  it('keeps checking the log while a run is going on', () => {
    mockJobs([job({ successfullyFinished: null, running: true })]);

    render(<PeriodicJobsLog />);

    expect(startPolling).toHaveBeenCalled();
  });

  it('stops checking the log once no run is going on', () => {
    mockJobs([failedJob()]);

    render(<PeriodicJobsLog />);

    expect(startPolling).not.toHaveBeenCalled();
    expect(stopPolling).toHaveBeenCalled();
  });

  it('labels when the failed run failed, not as a success', () => {
    mockJobs([failedJob()]);

    render(<PeriodicJobsLog />);

    expect(screen.getByText('periodicJobsLog.errorTime')).toBeTruthy();
    expect(screen.queryByText('periodicJobsLog.successTime')).toBeNull();
  });
});
