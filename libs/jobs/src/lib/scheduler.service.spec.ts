import PgBoss, {WorkHandler} from 'pg-boss'
import {Scheduler} from './scheduler.service'

describe('Scheduler', () => {
  let scheduler: Scheduler
  let pgBoss: PgBoss

  beforeEach(() => {
    pgBoss = new PgBoss({})
    scheduler = new Scheduler(pgBoss)
  })

  describe('scheduling jobs', () => {
    it('should schedule job', async () => {
      const cron = '30 10 * * *',
        jobName = 'foo',
        workload: WorkHandler<any> = async () => {}

      const schedule = jest.spyOn(pgBoss, 'schedule').mockImplementation(async () => {})
      const work = jest.spyOn(pgBoss, 'work').mockImplementation(async () => 'job-id')
      await scheduler.scheduleJob(cron, jobName, workload)
      expect(schedule).lastCalledWith(jobName, cron)
      expect(work).lastCalledWith(jobName, workload)
    })

    it('unschedules job', async () => {
      const jobName = 'foo'
      const unschedule = jest.spyOn(pgBoss, 'unschedule').mockImplementation(async () => {})
      await scheduler.unscheduleJob(jobName)
      expect(unschedule).lastCalledWith(jobName)
    })
  })
})
