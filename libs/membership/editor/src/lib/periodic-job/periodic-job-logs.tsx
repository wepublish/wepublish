import styled from '@emotion/styled';
import { PeriodicJob, usePeriodicJobLogsQuery } from '@wepublish/editor/api';
import { NotificationItem, NotificationSeverity } from '@wepublish/ui/editor';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

function getSeverity(periodicJob: PeriodicJob): NotificationSeverity {
  if (periodicJob.finishedWithError && periodicJob.successfullyFinished) {
    return 'warning';
  }

  if (!periodicJob.successfullyFinished && !periodicJob.finishedWithError) {
    return 'info';
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
      return 'Running...';
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
  /** Log items whose id is in here are hidden (already read by the user) */
  readItemIds?: ReadonlySet<string>;
  /** Enables marking log items as read for the current user */
  onMarkRead?: (itemId: string) => void;
}

const NEVER_RAN_ITEM_ID = 'never-ran';

export function PeriodicJobsLog({
  take = 5,
  onlyProblems = false,
  sourceTag,
  readItemIds,
  onMarkRead,
}: PeriodicJobsLogProps) {
  const { t } = useTranslation();

  const { data, loading } = usePeriodicJobLogsQuery({
    variables: {
      take,
    },
  });

  /**
   * If all jobs were successfully (no finished with error), return only first periodic job log entry.
   * Else return all job logs. This is meant to shorten the list in favor of UX.
   */
  const jobs = useMemo<PeriodicJob[]>(() => {
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

  const isRead = (itemId: string) => readItemIds?.has(itemId) ?? false;

  // The "did not run" notice is keyed by the stale execution time, so marking
  // it as read only hides this occurrence — a new stale run shows up again.
  const didNotRunItemId = `did-not-run:${
    jobs.find(pj => !!pj.executionTime)?.executionTime ?? 'unknown'
  }`;

  const showDidNotRun = jobDidNotRun && !isRead(didNotRunItemId);
  const showNeverRan = !jobs.length && !isRead(NEVER_RAN_ITEM_ID);
  const visibleJobs = jobs.filter(job => !isRead(job.id));

  const hasVisibleProblems =
    showDidNotRun ||
    showNeverRan ||
    visibleJobs.some(job => ['error', 'warning'].includes(getSeverity(job)));

  if (onlyProblems && (loading || !hasVisibleProblems)) {
    return null;
  }

  return (
    <Stack>
      {showDidNotRun && (
        <NotificationItem
          severity="error"
          title={t('periodicJobsLog.jobFailedTitle')}
          sourceTag={sourceTag}
          closable={!!onMarkRead}
          onClose={() => onMarkRead?.(didNotRunItemId)}
        >
          {t('periodicJobsLog.concerns')}
        </NotificationItem>
      )}

      {showNeverRan && (
        <NotificationItem
          severity="warning"
          title={t('periodicJobsLog.noRun')}
          sourceTag={sourceTag}
          closable={!!onMarkRead}
          onClose={() => onMarkRead?.(NEVER_RAN_ITEM_ID)}
        />
      )}

      {visibleJobs.map(periodicJob => {
        const severity = getSeverity(periodicJob);

        return (
          <NotificationItem
            key={periodicJob.id}
            severity={severity}
            sourceTag={sourceTag}
            closable={!!onMarkRead}
            onClose={() => onMarkRead?.(periodicJob.id)}
            title={`${new Date(periodicJob.date).toLocaleString('de', {
              dateStyle: 'medium',
            })}: ${getStatusText(severity, t)}`}
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
                  {t('periodicJobsLog.successTime', {
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
            </Information>
          </NotificationItem>
        );
      })}
    </Stack>
  );
}
