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
        workload: WorkHandler<any> = async () => {},
        preparedWorkload: WorkHandler<any> = async () => {}

      const prepareWorkload = jest
        .spyOn(scheduler, 'prepareWorkload')
        .mockImplementation(() => preparedWorkload)
      const schedule = jest.spyOn(pgBoss, 'schedule')
      const work = jest.spyOn(pgBoss, 'work')
      await scheduler.scheduleJob(cron, jobName, workload)
      expect(prepareWorkload).lastCalledWith(workload)
      expect(schedule).lastCalledWith(jobName, cron)
      expect(work).lastCalledWith(jobName, preparedWorkload)
    })

    it('unschedules job', async () => {
      const jobName = 'foo'
      const unschedule = jest.spyOn(pgBoss, 'unschedule')
      await scheduler.unscheduleJob(jobName)
      expect(unschedule).lastCalledWith(jobName)
    })

    it('prepared workflow runs workflow', () => {
      const workload = jest.fn(),
        job = {
          id: 'job-id',
          name: 'job-name',
          data: {data: 'data'}
        }
      const preparedWorkload = scheduler.prepareWorkload(workload)
      preparedWorkload(job)
      expect(workload).lastCalledWith(job)
    })
  })
})
