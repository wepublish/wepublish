import { ConflictException, INestApplication, Module } from '@nestjs/common';
import request from 'supertest';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriverConfig, ApolloDriver } from '@nestjs/apollo';
import { PrismaModule } from '@wepublish/nest-modules';
import { Test, TestingModule } from '@nestjs/testing';
import { PeriodicJobResolver } from './periodic-job.resolver';
import { PeriodicJobService } from './periodic-job.service';
import { PeriodicJob } from './periodic-job.model';
import type { PeriodicJob as StoredPeriodicJob } from '@prisma/client';

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: true,
      path: '/',
      cache: 'bounded',
    }),
    PrismaModule,
  ],
  providers: [
    PeriodicJobResolver,
    {
      provide: PeriodicJobService,
      useValue: {
        getJobLog: vi.fn(),
        retryAndCatchUp: vi.fn(),
        isRunning: vi.fn(),
      },
    },
  ],
})
export class AppModule {}

const periodicJobsQuery = `
    query PeriodicJobLogs($skip: Int, $take: Int) {
        periodicJobLog(skip: $skip, take: $take) {
            id
            tries
            executionTime
            finishedWithError
            successfullyFinished
        }
    }
`;

const retryPeriodicJobMutation = `
    mutation RetryPeriodicJob {
        retryPeriodicJob {
            id
            running
        }
    }
`;

const runningJobQuery = `
    query PeriodicJobLogs {
        periodicJobLog {
            id
            running
        }
    }
`;

const storedJob = (
  overrides: Partial<StoredPeriodicJob> = {}
): StoredPeriodicJob => ({
  id: '1234',
  createdAt: new Date('2023-01-01'),
  modifiedAt: new Date('2023-01-01'),
  date: new Date('2023-01-01'),
  tries: 1,
  executionTime: new Date('2023-01-01'),
  finishedWithError: null,
  successfullyFinished: new Date('2023-01-01'),
  error: null,
  ...overrides,
});

export const mockLogs: PeriodicJob[] = [
  {
    id: '1234',
    createdAt: new Date('2023-01-01'),
    modifiedAt: new Date('2023-01-01'),
    date: new Date('2023-01-01'),
    tries: 1,
    executionTime: new Date('2023-01-01'),
    finishedWithError: new Date('2023-01-01'),
    successfullyFinished: new Date('2023-01-01'),
  },
];

describe('ConsentResolver', () => {
  let app: INestApplication;
  let service: PeriodicJobService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    service = module.get<PeriodicJobService>(PeriodicJobService);
    app = module.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('periodic jobs query', async () => {
    const spy = vi
      .spyOn(service, 'getJobLog')
      .mockReturnValue(Promise.resolve(mockLogs) as any);

    await request(app.getHttpServer())
      .post('')
      .send({
        query: periodicJobsQuery,
        variables: {
          take: 1,
        },
      })
      .expect(res => {
        expect(res.body.data.periodicJobLog).toMatchSnapshot();
        expect(spy).toHaveBeenCalledWith(1, undefined);
      })
      .expect(200);
  });

  it('tells which run is still going on', async () => {
    vi.spyOn(service, 'getJobLog').mockResolvedValue([
      storedJob({ id: 'running' }),
      storedJob(),
    ]);
    vi.spyOn(service, 'isRunning')
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(false);

    await request(app.getHttpServer())
      .post('')
      .send({ query: runningJobQuery })
      .expect(res => {
        expect(res.body.data.periodicJobLog).toEqual([
          { id: 'running', running: true },
          { id: '1234', running: false },
        ]);
      })
      .expect(200);
  });

  it('starts the retry and answers with the run it took over', async () => {
    const spy = vi
      .spyOn(service, 'retryAndCatchUp')
      .mockResolvedValue(storedJob());
    vi.spyOn(service, 'isRunning').mockResolvedValue(true);

    await request(app.getHttpServer())
      .post('')
      .send({ query: retryPeriodicJobMutation })
      .expect(res => {
        expect(res.body.data.retryPeriodicJob).toEqual({
          id: '1234',
          running: true,
        });
        expect(spy).toHaveBeenCalledTimes(1);
      })
      .expect(200);
  });

  it('reports why a retry is refused', async () => {
    vi.spyOn(service, 'retryAndCatchUp').mockRejectedValue(
      new ConflictException('A periodic job is already running.')
    );

    await request(app.getHttpServer())
      .post('')
      .send({ query: retryPeriodicJobMutation })
      .expect(res => {
        expect(res.body.errors[0].message).toBe(
          'A periodic job is already running.'
        );
      });
  });
});
