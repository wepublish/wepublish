import type { Mock } from 'vitest';
import { useQuery } from '@apollo/client/react';
import { render, screen } from '@testing-library/react';
import type { FullPeriodicJobFragment } from '@wepublish/editor/api';
import {
  NotificationConfirmationsDocument,
  PeriodicJobLogsDocument,
} from '@wepublish/editor/api';

import { PeriodicJobsLog } from './periodic-job-logs';

// The component calls Apollo's `useQuery` with a generated document, so the
// mock sits at the Apollo boundary and dispatches on the document it is given.
vi.mock('@apollo/client/react', async importOriginal => ({
  ...(await importOriginal<typeof import('@apollo/client/react')>()),
  useQuery: vi.fn(),
  useMutation: () => [vi.fn(), { loading: false }],
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' },
  }),
}));

const mockedUseQuery = useQuery as Mock;

// Results keyed by the document each query is issued with.
const queryResults = new Map<unknown, unknown>();

const setQueryResult = (document: unknown, result: unknown) => {
  queryResults.set(document, result);
};

const now = new Date().toISOString();

const job = (
  overrides: Partial<FullPeriodicJobFragment> = {}
): FullPeriodicJobFragment => ({
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
  mockedUseQuery.mockReset();
  mockedUseQuery.mockImplementation(
    (document: unknown) => queryResults.get(document) ?? { data: undefined }
  );
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

    expect(screen.queryByRole('button')).toBeNull();
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
