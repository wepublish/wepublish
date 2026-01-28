import { INestApplication, Module } from '@nestjs/common';
import request from 'supertest';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriverConfig, ApolloDriver } from '@nestjs/apollo';
import { PrismaModule } from '@wepublish/nest-modules';
import { Test, TestingModule } from '@nestjs/testing';
import { PeriodicJobResolver } from './periodic-job.resolver';
import { PeriodicJobService } from './periodic-job.service';
import { PeriodicJob } from './periodic-job.model';

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
    { provide: PeriodicJobService, useValue: { getJobLog: jest.fn() } },
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
    const spy = jest
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
});
