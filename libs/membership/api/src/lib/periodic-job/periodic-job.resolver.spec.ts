import { ConflictException, INestApplication, Module } from '@nestjs/common';
import request from 'supertest';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriverConfig } from '@nestjs/apollo';
import { NodeAdapter } from '@nestjs/platform-node';
import { NodeApolloDriver } from '@wepublish/utils/api';
import { PrismaModule } from '@wepublish/nest-modules';
import { Test, TestingModule } from '@nestjs/testing';
import { PeriodicJobResolver } from './periodic-job.resolver';
import { PeriodicJobService } from './periodic-job.service';
import { PeriodicJob } from './periodic-job.model';
import type { PeriodicJob as StoredPeriodicJob } from '@prisma/client';

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: NodeApolloDriver,
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
        getSteps: vi.fn(),
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

const stepsQuery = `
    query PeriodicJobLogs {
        periodicJobLog {
            id
            steps {
                key
                status
                counts {
                    name
                    value
                }
                error
                startedAt
                finishedAt
            }
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
    app = module.createNestApplication(new NodeAdapter());
    await app.listen(0, '127.0.0.1');
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

  describe('what a night did', () => {
    const step = {
      id: 'step-1',
      createdAt: new Date('2026-11-07T04:00:00Z'),
      periodicJobId: '1234',
      key: 'bexioContactSync',
      status: 'warning' as const,
      counts: { readers: 1821, pushed: 1814, failed: 7 },
      error: '422 mail is invalid',
      startedAt: new Date('2026-11-07T04:00:00Z'),
      finishedAt: new Date('2026-11-07T04:02:00Z'),
    };

    it('lists the steps with their counts', async () => {
      vi.spyOn(service, 'getJobLog').mockResolvedValue([
        { ...storedJob(), steps: [step] },
      ] as any);

      await request(app.getHttpServer())
        .post('')
        .send({ query: stepsQuery })
        .expect(res => {
          expect(res.body.data.periodicJobLog[0].steps).toEqual([
            {
              key: 'bexioContactSync',
              status: 'warning',
              counts: [
                { name: 'readers', value: 1821 },
                { name: 'pushed', value: 1814 },
                { name: 'failed', value: 7 },
              ],
              error: '422 mail is invalid',
              startedAt: '2026-11-07T04:00:00.000Z',
              finishedAt: '2026-11-07T04:02:00.000Z',
            },
          ]);
        })
        .expect(200);
    });

    it('loads the steps of a job that came without them', async () => {
      vi.spyOn(service, 'getJobLog').mockResolvedValue([storedJob()]);
      const getSteps = vi
        .spyOn(service, 'getSteps')
        .mockResolvedValue([
          { ...step, status: 'ok', counts: null, error: null },
        ]);

      await request(app.getHttpServer())
        .post('')
        .send({ query: stepsQuery })
        .expect(res => {
          expect(res.body.data.periodicJobLog[0].steps).toEqual([
            expect.objectContaining({ status: 'ok', counts: [], error: null }),
          ]);
          expect(getSteps).toHaveBeenCalledWith('1234');
        })
        .expect(200);
    });
  });
});
