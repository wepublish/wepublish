import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, Module } from '@nestjs/common';
import request from 'supertest';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriverConfig, ApolloDriver } from '@nestjs/apollo';
import { PrismaModule } from '@wepublish/nest-modules';
import { SettingsResolver } from './settings.resolver';
import { SettingsService } from './settings.service';
import { GraphQLSettingValueType } from './settings.model';
import { SettingDataloaderService } from './setting-dataloader.service';

const settingsListQuery = `
  query settings($filter: SettingFilter) {
    settings(filter: $filter) {
      id
      name
      value
      settingRestriction {
        maxValue
        minValue
        inputLength
        allowedValues {
          stringChoice
          boolChoice
        }
      }
    }
  }
`;

const settingQuery = `
  query setting($id: String!) {
    settingById(id: $id) {
      id
      name
      value
      settingRestriction {
        maxValue
        minValue
        inputLength
        allowedValues {
          stringChoice
          boolChoice
        }
      }
    }
  }
`;

const updateSettingMutation = `
  mutation updateSetting($name: SettingName!, $value: GraphQLSettingValueType!) {
    updateSetting(name: $name, value: $value) {
      name
      value
    }
  }
`;

const mockSettingFindMany = jest.fn().mockResolvedValue([
  {
    id: '123',
    name: 'allowCommentEditing',
    value: true,
    settingRestriction: {
      maxValue: 100,
      minValue: 10,
      inputLength: 10,
      allowedValues: {
        stringChoice: 'some-string',
        boolChoice: true,
      },
    },
  },
  {
    id: '123',
    name: 'allowGuestCommenting',
    value: true,
    settingRestriction: {
      maxValue: 100,
      minValue: 10,
      inputLength: 10,
      allowedValues: {
        stringChoice: 'some-string',
        boolChoice: true,
      },
    },
  },
]);

const mockSettingFindUnique = jest.fn().mockResolvedValue({
  id: '123',
  name: 'allowCommentEditing',
  value: true,
  settingRestriction: {
    maxValue: 100,
    minValue: 10,
    inputLength: 10,
    allowedValues: {
      stringChoice: 'some-string',
      boolChoice: true,
    },
  },
});

const mockSettingUpdate = jest.fn().mockResolvedValue({
  id: '123',
  name: 'allowCommentEditing',
  value: true,
  settingRestriction: {
    maxValue: 100,
    minValue: 10,
    inputLength: 10,
    allowedValues: {
      stringChoice: 'some-string',
      boolChoice: true,
    },
  },
});

jest.mock('@prisma/client', () => {
  return {
    PrismaClient: jest.fn().mockImplementation(() => {
      return {
        setting: {
          findMany: mockSettingFindMany,
          findUnique: mockSettingFindUnique,
          update: mockSettingUpdate,
        },
      };
    }),
  };
});

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
    SettingsResolver,
    SettingsService,
    GraphQLSettingValueType,
    {
      provide: SettingDataloaderService,
      useValue: {
        load: () => mockSettingFindUnique,
        prime: jest.fn(),
      },
    },
  ],
})
export class AppModule {}

describe('SettingsResolver', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = module.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  test('settings query', async () => {
    await request(app.getHttpServer())
      .post('')
      .send({
        query: settingsListQuery,
        variables: { filter: {} },
      })
      .expect(200)
      .expect(res => {
        expect(res.body.data.settings).toHaveLength(2);
      });
  });

  test('setting query', async () => {
    const idToGet = '123';

    await request(app.getHttpServer())
      .post('/')
      .send({
        query: settingQuery,
        variables: {
          id: idToGet,
        },
      })
      .expect(200)
      .expect(res => {
        expect(res.body.data.settingById).toMatchObject({
          id: expect.any(String),
          name: 'ALLOW_COMMENT_EDITING',
          value: true,
        });
      });
  });

  test('updateSettings mutation', async () => {
    const newValue = true;

    await request(app.getHttpServer())
      .post('')
      .send({
        query: updateSettingMutation,
        variables: {
          name: 'ALLOW_COMMENT_EDITING',
          value: newValue,
        },
      })
      .expect(200)
      .expect(res => {
        expect(res.body.data.updateSetting.value).toBe(newValue);
      });
  });
});
