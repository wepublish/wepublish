import styled from '@emotion/styled';
import {
  NotificationSource,
  PeriodicJob,
  useConfirmNotificationMutation,
  useNotificationConfirmationsQuery,
  usePeriodicJobLogsQuery,
} from '@wepublish/editor/api';
import {
  ConfirmActionModal,
  NotificationItem,
  NotificationSeverity,
} from '@wepublish/ui/editor';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Message, toaster } from 'rsuite';

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
  /**
   * Enables the instance-wide "mark as done" flow: confirmed problems are
   * hidden for the whole team, mirroring action-required changelog entries.
   */
  teamConfirm?: boolean;
}

const NEVER_RAN_ITEM_ID = 'never-ran';

type JobLogToConfirm = {
  itemId: string;
  title: string;
};

export function PeriodicJobsLog({
  take = 5,
  onlyProblems = false,
  sourceTag,
  teamConfirm = false,
}: PeriodicJobsLogProps) {
  const { t } = useTranslation();
  const [toConfirm, setToConfirm] = useState<JobLogToConfirm | null>(null);

  const { data, loading } = usePeriodicJobLogsQuery({
    variables: {
      take,
    },
  });

  const { data: confirmationsData } = useNotificationConfirmationsQuery({
    fetchPolicy: 'cache-and-network',
    skip: !teamConfirm,
  });

  const [confirmNotification, { loading: confirming }] =
    useConfirmNotificationMutation({
      refetchQueries: ['NotificationConfirmations'],
      onCompleted() {
        toaster.push(
          <Message
            type="success"
            showIcon
            closable
          >
            {t('notifications.confirmSuccess')}
          </Message>
        );
        setToConfirm(null);
      },
      onError(error) {
        toaster.push(
          <Message
            type="error"
            showIcon
            closable
          >
            {error.message}
          </Message>
        );
      },
    });

  const confirmedItemIds = useMemo(
    () =>
      new Set(
        (confirmationsData?.notificationConfirmations ?? [])
          .filter(({ source }) => source === NotificationSource.PeriodicJob)
          .map(({ itemId }) => itemId)
      ),
    [confirmationsData?.notificationConfirmations]
  );

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

  const isDone = (itemId: string) =>
    teamConfirm && confirmedItemIds.has(itemId);

  const markAsDoneButton = (itemId: string, title: string) =>
    teamConfirm ?
      <Button
        size="sm"
        appearance="primary"
        onClick={() => setToConfirm({ itemId, title })}
      >
        {t('notifications.markAsDone')}
      </Button>
    : undefined;

  // The "did not run" notice is keyed by the stale execution time, so marking
  // it as done only hides this occurrence — a new stale run shows up again.
  const didNotRunItemId = `did-not-run:${
    jobs.find(pj => !!pj.executionTime)?.executionTime ?? 'unknown'
  }`;

  const showDidNotRun = jobDidNotRun && !isDone(didNotRunItemId);
  const showNeverRan = !jobs.length && !isDone(NEVER_RAN_ITEM_ID);
  const unconfirmedJobs = jobs.filter(job => !isDone(job.id));

  // Runs that were successful in the end (including "successful after
  // retries") only matter in the archive, not as a dashboard notification.
  const visibleJobs =
    onlyProblems ?
      unconfirmedJobs.filter(job => getSeverity(job) === 'error')
    : unconfirmedJobs;

  const hasVisibleProblems =
    showDidNotRun || showNeverRan || visibleJobs.length > 0;

  if (onlyProblems && (loading || !hasVisibleProblems)) {
    return null;
  }

  return (
    <>
      <Stack>
        {showDidNotRun && (
          <NotificationItem
            severity="error"
            title={t('periodicJobsLog.jobFailedTitle')}
            sourceTag={sourceTag}
            actions={markAsDoneButton(
              didNotRunItemId,
              t('periodicJobsLog.jobFailedTitle')
            )}
          >
            {t('periodicJobsLog.concerns')}
          </NotificationItem>
        )}

        {showNeverRan && (
          <NotificationItem
            severity="warning"
            title={t('periodicJobsLog.noRun')}
            sourceTag={sourceTag}
            actions={markAsDoneButton(
              NEVER_RAN_ITEM_ID,
              t('periodicJobsLog.noRun')
            )}
          />
        )}

        {visibleJobs.map(periodicJob => {
          const severity = getSeverity(periodicJob);
          const title = `${new Date(periodicJob.date).toLocaleString('de', {
            dateStyle: 'medium',
          })}: ${getStatusText(severity, t)}`;

          return (
            <NotificationItem
              key={periodicJob.id}
              severity={severity}
              sourceTag={sourceTag}
              actions={markAsDoneButton(periodicJob.id, title)}
              title={title}
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

      {toConfirm && (
        <ConfirmActionModal
          title={t('notifications.confirmTitle')}
          message={t('notifications.confirmMessage', {
            title: toConfirm.title,
          })}
          loading={confirming}
          onConfirm={() =>
            confirmNotification({
              variables: {
                source: NotificationSource.PeriodicJob,
                itemId: toConfirm.itemId,
              },
            })
          }
          onClose={() => setToConfirm(null)}
        />
      )}
    </>
  );
}
