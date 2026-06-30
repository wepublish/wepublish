import { Test, TestingModule } from '@nestjs/testing';
import { MailTemplate, PrismaClient } from '@prisma/client';
import {
  MailContext,
  MailProvider,
  MailTemplateStatus,
} from '@wepublish/mail/api';
import { MailTemplatesResolver } from './mail-template.resolver';
import { MailTemplateService } from './mail-template.service';
import { INestApplication, Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { PrismaModule } from '@wepublish/nest-modules';
import { APP_GUARD } from '@nestjs/core';
import { PermissionsGuard } from '@wepublish/permissions/api';
import request from 'supertest';
import {
  registerMailsModule,
  registerPaymentMethodModule,
} from '../testing/module-registrars';
import { PaymentsModule } from '@wepublish/payment/api';

const mailTemplatesQuery = `
  query MailTemplates {
    mailTemplates {
      id
    }
  }
`;
const providerQuery = `
  query Provider {
    provider {
      name
    }
  }
`;
const createTemplateMutation = `
  mutation Mutation($input: MailTemplateInput!) {
    createMailTemplate(input: $input) {
      id
    }
  }
`;

const mockTemplate1: MailTemplate = {
  id: '8056eda4-9013-42eb-b584-55a4f450eaf3',
  name: 'Mock Template 1',
  description: 'Mock Desc 1',
  subject: 'Subject 1',
  htmlContent: '<p>Content 1</p>',
  textContent: null,
  externalMailTemplateId: null,
  createdAt: new Date(),
  modifiedAt: new Date(),
};

const mockTemplate2: MailTemplate = {
  id: '400764ac-babf-4662-bc6b-225260ac7f70',
  name: 'Mock Template 2',
  description: 'Mock Desc 2',
  subject: 'Subject 2',
  htmlContent: '<p>Content 2</p>',
  textContent: null,
  externalMailTemplateId: null,
  createdAt: new Date(),
  modifiedAt: new Date(),
};

const prismaServiceMock = {
  mailTemplate: {
    findMany: jest.fn((): MailTemplate[] => [mockTemplate1, mockTemplate2]),
    create: jest.fn(async () => mockTemplate1),
    update: jest.fn(async () => mockTemplate1),
    delete: jest.fn(async () => mockTemplate1),
  },
};

const mailProviderServiceMock = {
  getName: jest.fn(async () => 'MockProvider'),
};

const mailContextMock = {
  mailProvider: mailProviderServiceMock as unknown as MailProvider,
  getUsedTemplateIdentifiers: jest.fn((): string[] => [mockTemplate2.id]),
};

const mailTemplateServiceMock = {
  deleteMailTemplate: jest.fn(async () => undefined),
  preview: jest.fn(async () => ({ subject: 's', html: 'h', text: undefined })),
  sendTest: jest.fn(async () => undefined),
};

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: true,
      path: '/',
    }),
    PrismaModule,
    registerMailsModule(),
    registerPaymentMethodModule(),
    PaymentsModule,
  ],
  providers: [
    MailTemplatesResolver,
    { provide: MailTemplateService, useValue: mailTemplateServiceMock },
    {
      provide: APP_GUARD,
      useClass: PermissionsGuard,
    },
  ],
})
export class AppModule {}

describe('MailTemplatesResolver', () => {
  let resolver: MailTemplatesResolver;
  let app: INestApplication;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = module.createNestApplication();
    await app.init();
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MailTemplatesResolver,
        { provide: PrismaClient, useValue: prismaServiceMock },
        { provide: MailContext, useValue: mailContextMock },
        { provide: MailTemplateService, useValue: mailTemplateServiceMock },
      ],
    }).compile();

    resolver = module.get<MailTemplatesResolver>(MailTemplatesResolver);
  });

  afterAll(async () => {
    await app.close();
  });

  it('is defined', () => {
    expect(resolver).toBeDefined();
  });

  it('returns all templates', async () => {
    const result = await resolver.mailTemplates();
    expect(result.length).toEqual(2);
    expect(result[0].name).toEqual('Mock Template 1');
    expect(result[1].name).toEqual('Mock Template 2');
  });

  it('resolves the provider', async () => {
    const result = await resolver.provider();
    expect(await (result as any).name).toBe('MockProvider');
  });

  it('creates a mail template', async () => {
    const input = {
      name: 'New',
      subject: 'Hi',
      htmlContent: '<p>Hi</p>',
    };
    await resolver.createMailTemplate(input as any);
    expect(prismaServiceMock.mailTemplate.create).toHaveBeenCalledWith({
      data: input,
    });
  });

  it('updates a mail template', async () => {
    const input = {
      name: 'Changed',
      subject: 'Hi',
      htmlContent: '<p>Hi</p>',
    };
    await resolver.updateMailTemplate(mockTemplate1.id, input as any);
    expect(prismaServiceMock.mailTemplate.update).toHaveBeenCalledWith({
      where: { id: mockTemplate1.id },
      data: input,
    });
  });

  it('deletes a mail template via the service', async () => {
    await resolver.deleteMailTemplate(mockTemplate1.id);
    expect(mailTemplateServiceMock.deleteMailTemplate).toHaveBeenCalledWith(
      mockTemplate1.id
    );
  });

  it('computes the template status', async () => {
    const [template1, template2] = await resolver.mailTemplates();
    expect(await resolver.status(template1 as any)).toEqual(
      MailTemplateStatus.Unused
    );
    expect(await resolver.status(template2 as any)).toEqual(
      MailTemplateStatus.Ok
    );
  });

  /**
   * Test if endpoints are not exposed to public
   */
  it('mailTemplates is not public', () => {
    return request(app.getHttpServer())
      .post('')
      .send({
        query: mailTemplatesQuery,
      })
      .expect(200)
      .expect(({ body }) => {
        expect(
          !!body.errors.find(
            (error: any) => error.message === 'Forbidden resource'
          )
        ).toEqual(true);
        expect(body.data).toBeNull();
      });
  });

  it('provider is not public', () => {
    return request(app.getHttpServer())
      .post('')
      .send({
        query: providerQuery,
      })
      .expect(200)
      .expect(({ body }) => {
        expect(
          !!body.errors.find(
            (error: any) => error.message === 'Forbidden resource'
          )
        ).toEqual(true);
        expect(body.data).toBeNull();
      });
  });

  it('createMailTemplate is not public', () => {
    return request(app.getHttpServer())
      .post('')
      .send({
        query: createTemplateMutation,
        variables: {
          input: { name: 'x', subject: 'y', htmlContent: 'z' },
        },
      })
      .expect(200)
      .expect(({ body }) => {
        expect(
          !!body.errors.find(
            (error: any) => error.message === 'Forbidden resource'
          )
        ).toEqual(true);
        expect(body.data).toBeNull();
      });
  });
});
