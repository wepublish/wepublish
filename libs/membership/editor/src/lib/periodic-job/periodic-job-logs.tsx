import { useMutation, useQuery } from '@apollo/client/react';
import styled from '@emotion/styled';
import {
  FullPeriodicJobFragment,
  PeriodicJobLogsDocument,
  RetryPeriodicJobDocument,
} from '@wepublish/editor/api';
import {
  NotificationItem,
  NotificationSeverity,
  useHasPermission,
} from '@wepublish/ui/editor';
import { ReactElement, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Tooltip, Whisper } from 'rsuite';

import { showErrors } from '../common';

const RETRY_PERMISSION = ['CAN_RETRY_PERIODIC_JOB'];

const POLL_WHILE_RUNNING_MS = 10_000;

function getSeverity(
  periodicJob: FullPeriodicJobFragment
): NotificationSeverity {
  if (periodicJob.running) {
    return 'info';
  }

  if (periodicJob.finishedWithError && periodicJob.successfullyFinished) {
    return 'warning';
  }

  if (periodicJob.successfullyFinished) {
    return 'success';
  }

  return 'error';
}

function getStatusText(
  severity: NotificationSeverity,
  t: (key: string) => string
) {
  switch (severity) {
    case 'error':
      return t('periodicJobsLog.failedJob');
    case 'warning':
      return t('periodicJobsLog.lastRunSuccessful');
    case 'success':
      return 'OK';
    default:
      return t('periodicJobsLog.running');
  }
}

const Stack = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const Information = styled.div`
  display: grid;
`;

export interface PeriodicJobsLogProps {
  take?: number;
  onlyProblems?: boolean;
  sourceTag?: string;
  /** Skips the query entirely, for a user who may not read the logs */
  skip?: boolean;
  /** Reports whether at least one log item or notice is currently rendered */
  onVisibilityChange?: (visible: boolean) => void;
}

/**
 * The log as a list of items, so a panel mixing several sources can sort
 * everything by severity rather than rendering one source after another.
 */
export function usePeriodicJobNotifications({
  take = 5,
  onlyProblems = false,
  sourceTag,
  skip = false,
  onVisibilityChange,
}: PeriodicJobsLogProps): ReactElement[] {
  const { t } = useTranslation();

  const { data, loading, startPolling, stopPolling } = useQuery(
    PeriodicJobLogsDocument,
    {
      skip,
      variables: {
        take,
      },
    }
  );

  const mayRetry = useHasPermission(RETRY_PERMISSION);
  const [retryPeriodicJob, { loading: retrying }] = useMutation(
    RetryPeriodicJobDocument,
    {
      onError: showErrors,
    }
  );

  const isRunning = !!data?.periodicJobLog?.some(job => job.running);

  useEffect(() => {
    if (isRunning) {
      startPolling?.(POLL_WHILE_RUNNING_MS);
    } else {
      stopPolling?.();
    }
  }, [isRunning, startPolling, stopPolling]);

  /**
   * If all jobs were successfully (no finished with error), return only first periodic job log entry.
   * Else return all job logs. This is meant to shorten the list in favor of UX.
   */
  const jobs = useMemo<FullPeriodicJobFragment[]>(() => {
    if (!data?.periodicJobLog?.length) {
      return [];
    }

    const hasFailingJobs = !!data.periodicJobLog.find(
      job => !!job?.finishedWithError
    );

    return hasFailingJobs ? data.periodicJobLog : [data.periodicJobLog[0]];
  }, [data?.periodicJobLog]);

  /**
   * In case the last running job is older than 24 + 4 hour.
   */
  const jobDidNotRun = useMemo<boolean>(() => {
    const lastPJWithExecutionTime = jobs.find(pj => !!pj.executionTime);

    if (!lastPJWithExecutionTime?.executionTime) {
      return false;
    }

    const lastJob = new Date(lastPJWithExecutionTime.executionTime);
    const now = new Date();
    const warningThreshold = (24 + 4) * 60 * 60 * 1000;

    return now.getTime() - warningThreshold > lastJob.getTime();
  }, [jobs]);

  const showDidNotRun = jobDidNotRun;
  const showNeverRan = !jobs.length;

  // Runs that were successful in the end (including "successful after
  // retries") only matter in the archive, not as a dashboard notification.
  const visibleJobs =
    onlyProblems ?
      jobs.filter(job => job.running || getSeverity(job) === 'error')
    : jobs;

  const hasVisibleProblems =
    showDidNotRun || showNeverRan || visibleJobs.length > 0;

  // While the problems-only variant is still loading, nothing is shown yet.
  const hasVisibleItems = hasVisibleProblems && !(onlyProblems && loading);

  useEffect(() => {
    onVisibilityChange?.(hasVisibleItems);
  }, [onVisibilityChange, hasVisibleItems]);

  if (onlyProblems && !hasVisibleItems) {
    return [];
  }

  return [
    ...(showDidNotRun ?
      [
        <NotificationItem
          key="did-not-run"
          severity="error"
          title={t('periodicJobsLog.jobFailedTitle')}
          sourceTag={sourceTag}
        >
          {t('periodicJobsLog.concerns')}
        </NotificationItem>,
      ]
    : []),
    ...(showNeverRan ?
      [
        <NotificationItem
          key="never-ran"
          severity="warning"
          title={t('periodicJobsLog.noRun')}
          sourceTag={sourceTag}
        />,
      ]
    : []),
    ...visibleJobs.map(periodicJob => {
      const severity = getSeverity(periodicJob);
      const title = `${new Date(periodicJob.date).toLocaleString('de', {
        dateStyle: 'medium',
      })}: ${getStatusText(severity, t)}`;

      return (
        <NotificationItem
          key={periodicJob.id}
          severity={severity}
          sourceTag={sourceTag}
          title={title}
          actions={
            mayRetry && severity === 'error' && periodicJob === jobs[0] ?
              <Whisper
                trigger={['hover', 'focus']}
                placement="top"
                speaker={<Tooltip>{t('periodicJobsLog.retryHint')}</Tooltip>}
              >
                <Button
                  size="sm"
                  appearance="primary"
                  loading={retrying}
                  onClick={() => retryPeriodicJob()}
                >
                  {t('periodicJobsLog.retry')}
                </Button>
              </Whisper>
            : undefined
          }
        >
          <Information>
            {periodicJob?.executionTime && (
              <span>
                {t('periodicJobsLog.startTime', {
                  date: new Date(periodicJob.executionTime),
                })}
              </span>
            )}

            {periodicJob?.successfullyFinished && (
              <span>
                {t('periodicJobsLog.successTime', {
                  date: new Date(periodicJob.successfullyFinished),
                })}
              </span>
            )}

            {periodicJob?.finishedWithError && (
              <span>
                {t('periodicJobsLog.errorTime', {
                  date: new Date(periodicJob.finishedWithError),
                })}
              </span>
            )}

            <span>
              {t('periodicJobsLog.tries', {
                tries: periodicJob.tries,
              })}
            </span>

            {periodicJob.error && (
              <span>
                <i>{periodicJob.error}</i>
              </span>
            )}

            {periodicJob.running && (
              <span>{t('periodicJobsLog.runningHint')}</span>
            )}
          </Information>
        </NotificationItem>
      );
    }),
  ];
}

export function PeriodicJobsLog(props: PeriodicJobsLogProps) {
  const items = usePeriodicJobNotifications(props);

  return items.length ? <Stack>{items}</Stack> : null;
}
