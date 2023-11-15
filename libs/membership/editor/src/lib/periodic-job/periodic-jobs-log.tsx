import {Alert, AlertColor, AlertTitle} from '@mui/material'
import {useMemo} from 'react'
import {getApiClientV2} from '@wepublish/ui/editor'
import {PeriodicJobModel, usePeriodicJobLogsQuery} from '@wepublish/editor/api-v2'
import {MdOutlineHourglassEmpty} from 'react-icons/md'
import {useTranslation} from 'react-i18next'

export function PeriodicJobsLog() {
  const {t} = useTranslation()
  const client = useMemo(() => getApiClientV2(), [])

  const {data} = usePeriodicJobLogsQuery({
    client,
    variables: {
      take: 5,
      skip: 0
    }
  })

  /**
   * If all jobs were successfully (no finished with error), return only first periodic job log entry.
   * Else return all job logs. This is meant to shorten the list in favor of UX.
   */
  const jobs: PeriodicJobModel[] = useMemo<PeriodicJobModel[]>(() => {
    if (!data?.periodicJobLog?.length) return []
    const hasFailingJobs = !!data.periodicJobLog.find(job => !!job?.finishedWithError)
    return hasFailingJobs ? data.periodicJobLog : [data.periodicJobLog[0]]
  }, [data?.periodicJobLog])

  /**
   * In case the last running job is older than 24 + 4 hour.
   */
  const jobDidNotRun = useMemo<undefined | boolean>(() => {
    const lastPJWithExecutionTime = jobs.find(pj => !!pj.executionTime)
    if (!lastPJWithExecutionTime?.executionTime) return
    const lastJob = new Date(lastPJWithExecutionTime.executionTime)
    const now = new Date()
    const warningThreshold = (24 + 4) * 60 * 60 * 1000
    return now.getTime() - warningThreshold > lastJob.getTime()
  }, [jobs])

  function getSeverity(periodicJob: PeriodicJobModel): AlertColor {
    if (periodicJob.finishedWithError && periodicJob.successfullyFinished) {
      return 'warning'
    }
    if (!periodicJob.successfullyFinished && !periodicJob.finishedWithError) {
      return 'info'
    }
    if (periodicJob.successfullyFinished) {
      return 'success'
    }
    return 'error'
  }

  return (
    <>
      {jobDidNotRun && (
        <Alert severity={'error'} variant={'filled'}>
          <AlertTitle>
            <b>{t('periodicJobsLog.jobFailedTitle')}</b>
          </AlertTitle>
          {t('periodicJobsLog.concerns')}
        </Alert>
      )}

      {!jobs.length && (
        <>
          <Alert severity={'warning'}>
            <AlertTitle>{t('periodicJobsLog.noRun')}</AlertTitle>
          </Alert>
        </>
      )}

      {jobs.map(periodicJob => (
        <>
          <Alert
            sx={{mt: 1}}
            severity={getSeverity(periodicJob)}
            variant={getSeverity(periodicJob) === 'error' ? 'filled' : 'standard'}
            icon={getSeverity(periodicJob) === 'info' ? <MdOutlineHourglassEmpty /> : undefined}>
            <AlertTitle>
              {new Date(periodicJob.date).toLocaleString('de', {dateStyle: 'medium'})}
              {getSeverity(periodicJob) === 'error' && (
                <span>
                  : <b>{t('periodicJobsLog.failedJob')}</b>
                </span>
              )}
              {getSeverity(periodicJob) === 'warning' && (
                <span>: {t('periodicJobsLog.lastRunSuccessful')} </span>
              )}
              {getSeverity(periodicJob) === 'success' && <span>: OK</span>}
              {getSeverity(periodicJob) === 'info' && <span>: Running...</span>}
            </AlertTitle>
            <p>
              {periodicJob?.executionTime && (
                <span>
                  start:{' '}
                  {new Date(periodicJob.executionTime).toLocaleString('de', {
                    dateStyle: 'medium',
                    timeStyle: 'short'
                  })}{' '}
                  |{' '}
                </span>
              )}
              {periodicJob?.successfullyFinished && (
                <span>
                  success:{' '}
                  {new Date(periodicJob.successfullyFinished).toLocaleString('de', {
                    dateStyle: 'medium',
                    timeStyle: 'short'
                  })}{' '}
                  |{' '}
                </span>
              )}
              {periodicJob?.finishedWithError && (
                <span>
                  error:{' '}
                  {new Date(periodicJob.finishedWithError).toLocaleString('de', {
                    dateStyle: 'medium',
                    timeStyle: 'short'
                  })}{' '}
                  |{' '}
                </span>
              )}
              <span>runs: {periodicJob.tries}</span>
            </p>
            {periodicJob.error && (
              <p>
                <i>{periodicJob.error}</i>
              </p>
            )}
          </Alert>
        </>
      ))}
    </>
  )
}
