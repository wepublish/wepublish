import {Injectable} from '@nestjs/common'
import {PrismaClient} from '@prisma/client'
import {ok} from 'assert'
import {PeriodicJobModel} from './periodic-job.model'

@Injectable()
export class PeriodicJobService {
  constructor(private prisma: PrismaClient) {}

  async PeriodicJobLog(skip: number, take: number): Promise<PeriodicJobModel[]> {
    return await this.prisma.periodicJob.findMany({
      skip,
      take,
      orderBy: {
        date: 'desc'
      }
    })
  }
}
