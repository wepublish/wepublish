import styled from '@emotion/styled';
import { Alert, AlertColor, AlertTitle } from '@mui/material';
import {
  getApiClientV2,
  PeriodicJob,
  usePeriodicJobLogsQuery,
} from '@wepublish/editor/api-v2';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { MdOutlineHourglassEmpty } from 'react-icons/md';

function getSeverity(periodicJob: PeriodicJob): AlertColor {
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

const Information = styled.div`
  display: grid;
`;

export function PeriodicJobsLog() {
  const { t } = useTranslation();
  const client = useMemo(() => getApiClientV2(), []);

  const { data } = usePeriodicJobLogsQuery({
    client,
    variables: {
      take: 5,
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

  return (
    <>
      {jobDidNotRun && (
        <Alert
          severity={'error'}
          variant={'filled'}
        >
          <AlertTitle>
            <strong>{t('periodicJobsLog.jobFailedTitle')}</strong>
          </AlertTitle>

          {t('periodicJobsLog.concerns')}
        </Alert>
      )}

      {!jobs.length && (
        <Alert severity={'warning'}>
          <AlertTitle>{t('periodicJobsLog.noRun')}</AlertTitle>
        </Alert>
      )}

      {jobs.map(periodicJob => (
        <Alert
          key={periodicJob.id}
          sx={{ mt: 1 }}
          severity={getSeverity(periodicJob)}
          variant={getSeverity(periodicJob) === 'error' ? 'filled' : 'standard'}
          icon={
            getSeverity(periodicJob) === 'info' ?
              <MdOutlineHourglassEmpty />
            : undefined
          }
        >
          <AlertTitle>
            {new Date(periodicJob.date).toLocaleString('de', {
              dateStyle: 'medium',
            })}

            {getSeverity(periodicJob) === 'error' && (
              <span>
                : <strong>{t('periodicJobsLog.failedJob')}</strong>
              </span>
            )}

            {getSeverity(periodicJob) === 'warning' && (
              <span>: {t('periodicJobsLog.lastRunSuccessful')} </span>
            )}

            {getSeverity(periodicJob) === 'success' && <span>: OK</span>}

            {getSeverity(periodicJob) === 'info' && <span>: Running...</span>}
          </AlertTitle>

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
          </Information>

          {periodicJob.error && (
            <p>
              <i>{periodicJob.error}</i>
            </p>
          )}
        </Alert>
      ))}
    </>
  );
}
