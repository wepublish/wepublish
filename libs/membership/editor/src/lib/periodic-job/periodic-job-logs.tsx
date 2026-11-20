import { useMutation, useQuery } from '@apollo/client/react';
import styled from '@emotion/styled';
import {
  FullPeriodicJobFragment,
  PeriodicJobLogsDocument,
  PeriodicJobStepStatus,
  RetryPeriodicJobDocument,
} from '@wepublish/editor/api';
import { CanRetryPeriodicJob } from '@wepublish/permissions';
import {
  NotificationItem,
  NotificationSeverity,
  useHasPermission,
} from '@wepublish/ui/editor';
import { ReactElement, useEffect, useMemo } from 'react';
import { Button, Tooltip } from '@mui/material';
import { useTranslation } from 'react-i18next';

import { showErrors } from '../common';

const RETRY_PERMISSION = [CanRetryPeriodicJob.id];

const POLL_WHILE_RUNNING_MS = 10_000;

type JobStep = FullPeriodicJobFragment['steps'][number];

const PROBLEMS: PeriodicJobStepStatus[] = [
  PeriodicJobStepStatus.Warning,
  PeriodicJobStepStatus.Error,
];

const stepProblems = (periodicJob: FullPeriodicJobFragment) =>
  (periodicJob.steps ?? []).filter(step => PROBLEMS.includes(step.status));

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
    // The job did its part; a sync after it may still have failed.
    return stepProblems(periodicJob).length ? 'warning' : 'success';
  }

  return 'error';
}

function getStatusText(
  periodicJob: FullPeriodicJobFragment,
  severity: NotificationSeverity,
  t: (key: string) => string
) {
  switch (severity) {
    case 'error':
      return t('periodicJobsLog.failedJob');
    case 'warning':
      return periodicJob.finishedWithError ?
          t('periodicJobsLog.lastRunSuccessful')
        : t('periodicJobsLog.stepProblems');
    case 'success':
      return 'OK';
    default:
      return t('periodicJobsLog.running');
  }
}

const STEP_SEVERITY: Record<PeriodicJobStepStatus, string> = {
  [PeriodicJobStepStatus.Ok]: '✓',
  [PeriodicJobStepStatus.Skipped]: '–',
  [PeriodicJobStepStatus.Warning]: '⚠',
  [PeriodicJobStepStatus.Error]: '✕',
};

const StepList = styled.ul`
  margin: 4px 0 0;
  padding: 0;
  list-style: none;
  display: grid;
  gap: 2px;
`;

const StepMark = styled.span`
  display: inline-block;
  width: 1.25em;
`;

function JobSteps({ steps }: { steps: JobStep[] }) {
  const { t } = useTranslation();

  if (!steps.length) {
    return null;
  }

  return (
    <StepList aria-label={t('periodicJobsLog.stepsLabel')}>
      {steps.map(step => {
        const counts = step.counts
          .map(({ name, value }) =>
            t(`periodicJobsLog.counts.${name}`, { count: value })
          )
          .join(' · ');

        return (
          <li key={step.key}>
            <StepMark aria-hidden>{STEP_SEVERITY[step.status]}</StepMark>
            {`${t(`periodicJobsLog.steps.${step.key}`)}: ${t(
              `periodicJobsLog.stepStatus.${step.status}`
            )}${counts ? ` (${counts})` : ''}`}
            {step.error && (
              <>
                {' — '}
                <i>{step.error}</i>
              </>
            )}
          </li>
        );
      })}
    </StepList>
  );
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
  const log = data?.periodicJobLog;
  const jobs = useMemo<FullPeriodicJobFragment[]>(() => {
    if (!log?.length) {
      return [];
    }

    const hasFailingJobs = !!log.find(job => !!job?.finishedWithError);

    return hasFailingJobs ? log : [log[0]];
  }, [log]);

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
  // A sync that failed after the job counts too, but only for the newest
  // night: a later clean night settles it.
  const visibleJobs =
    onlyProblems ?
      jobs.filter(
        job =>
          job.running ||
          getSeverity(job) === 'error' ||
          (job === jobs[0] && stepProblems(job).length > 0)
      )
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
      })}: ${getStatusText(periodicJob, severity, t)}`;

      return (
        <NotificationItem
          key={periodicJob.id}
          severity={severity}
          sourceTag={sourceTag}
          title={title}
          actions={
            mayRetry && severity === 'error' && periodicJob === jobs[0] ?
              <Tooltip
                placement="top"
                describeChild
                title={t('periodicJobsLog.retryHint')}
              >
                <Button
                  variant="contained"
                  size="small"
                  loading={retrying}
                  onClick={() => retryPeriodicJob()}
                >
                  {t('periodicJobsLog.retry')}
                </Button>
              </Tooltip>
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

            <JobSteps
              steps={
                onlyProblems ?
                  stepProblems(periodicJob)
                : (periodicJob.steps ?? [])
              }
            />
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
