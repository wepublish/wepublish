import nock from 'nock';
import { MailTemplate, PrismaClient } from '@prisma/client';
import { Test, TestingModule } from '@nestjs/testing';
import { matches } from 'lodash';
import bodyParser from 'body-parser';
import { MailContext } from './mail-context';
import { MailController, mailLogType } from './mail.controller';
import { KvTtlCacheService } from '@wepublish/kv-ttl-cache/api';
import { createKvMock } from '@wepublish/kv-ttl-cache/api';
import { MailchimpMailProvider } from './mail-provider/mailchimp-mail-provider';
import { MailgunMailProvider } from './mail-provider/mailgun-mail-provider';
const kvMock = createKvMock();

describe('MailController', () => {
  let mailContext: MailContext;
  let prismaMock: {
    mailLog: { [method in keyof PrismaClient['mailLog']]?: jest.Mock };
    mailTemplate: {
      [method in keyof PrismaClient['mailTemplate']]?: jest.Mock;
    };
    user: { [method in keyof PrismaClient['user']]?: jest.Mock };
  };

  const mockMailTemplate1: MailTemplate = {
    id: 'template-1',
    name: 'template1',
    description: 'Test Template 1',
    externalMailTemplateId: 'template1',
    remoteMissing: false,
    createdAt: new Date(),
    modifiedAt: new Date(),
  };

  const mockMailTemplate2: MailTemplate = {
    id: 'template-2',
    name: 'template2',
    description: 'Test Template 2',
    externalMailTemplateId: 'template2',
    remoteMissing: false,
    createdAt: new Date(),
    modifiedAt: new Date(),
  };

  const mockUser = {
    id: 'user-1',
    email: 'test-user@wepublish.com',
    emailVerifiedAt: new Date(),
    name: 'User',
    firstName: 'Test',
    password: 'pw',
    active: true,
    lastLogin: new Date(),
    createdAt: new Date(),
    modifiedAt: new Date(),
    roleIDs: [],
    properties: [],
    birthday: null,
    flair: null,
    userImageID: null,
    note: null,
  };

  beforeEach(async () => {
    await nock.disableNetConnect();

    prismaMock = {
      mailLog: {
        create: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
        count: jest.fn(),
      },
      mailTemplate: {
        findUnique: jest.fn(),
      },
      user: {
        findUnique: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: PrismaClient,
          useValue: prismaMock,
        },
        {
          provide: KvTtlCacheService,
          useValue: kvMock,
        },
        {
          provide: MailContext,
          useFactory: async (prisma: PrismaClient, kv: KvTtlCacheService) => {
            await kv.setNs(
              'settings:mailprovider',
              'mailchimp',
              JSON.stringify({
                id: 'mailchimp',
                type: 'mailchimp',
                name: 'Mailchimp',
                fromAddress: 'dev@wepublish.ch',
                replyTpAddress: 'dev@wepublish.ch',
                webhookEndpointSecret: 'secret',
                apiKey: 'key',
                mailchimp_baseURL: '',
              })
            );

            return new MailContext({
              mailProvider: new MailchimpMailProvider({
                id: 'mailchimp',
                incomingRequestHandler: bodyParser.urlencoded({
                  extended: true,
                }),
                kv,
                prisma,
              }),
              kv,
              prisma,
            });
          },
          inject: [PrismaClient, KvTtlCacheService],
        },
      ],
    }).compile();
    mailContext = module.get<MailContext>(MailContext);
  });

  afterEach(async () => {
    await nock.cleanAll();
    await nock.enableNetConnect();
  });

  it('is defined', () => {
    expect(mailContext).toBeDefined();
  });

  it('send mail', async () => {
    const mockMailLog1 = {
      id: 'log-1',
      mailTemplateId: mockMailTemplate1.id,
      state: 'submitted',
      mailProviderID: 'mailchimp',
      createdAt: new Date(),
      modifiedAt: new Date(),
    };

    const mockMailLog2 = {
      id: 'log-2',
      mailTemplateId: mockMailTemplate2.id,
      state: 'submitted',
      mailProviderID: 'mailgun',
      createdAt: new Date(),
      modifiedAt: new Date(),
    };

    // Set up count mock to return 0 for first two calls, then 1 for duplicate detection
    prismaMock.mailLog
      .count!.mockResolvedValueOnce(0) // First Mailchimp call
      .mockResolvedValueOnce(0) // First Mailgun call
      .mockResolvedValueOnce(1); // Second Mailgun call (should detect duplicate)
    prismaMock.mailLog.create!.mockResolvedValueOnce(mockMailLog1 as any);
    prismaMock.mailLog.findFirst!.mockResolvedValueOnce(mockMailLog1 as any);
    prismaMock.mailLog.create!.mockResolvedValueOnce(mockMailLog2 as any);
    prismaMock.mailLog.findFirst!.mockResolvedValueOnce(mockMailLog2 as any);

    const mandrillNockScope = await nock('https://mandrillapp.com:443')
      .post(
        '/api/1.0/messages/send-template',
        matches({
          template_name: 'template1',
          template_content: [],
          message: {
            subject: '',
            from_email: 'dev@wepublish.ch',
            to: [{ email: 'test-user@wepublish.com', type: 'to' }],
            merge_vars: [
              {
                rcpt: 'test-user@wepublish.com',
                vars: [
                  { name: 'user_id' },
                  { name: 'user_email', content: 'test-user@wepublish.com' },
                  { name: 'user_name', content: 'User' },
                  { name: 'user_firstName', content: 'Test' },
                  { name: 'user_password', content: 'hidden' },
                  { name: 'user_active', content: true },
                  { name: 'user_roleIDs_0', content: 'hidden' },
                  { name: 'optional_root1_n1_n2_n3_depth', content: 3 },
                  { name: 'optional_root1_n1_n2_depth', content: 2 },
                  { name: 'optional_root1_n1_depth', content: 1 },
                  { name: 'optional_root1_depth', content: 0 },
                  { name: 'optional_root2', content: 1 },
                  { name: 'optional_root3', content: 'ok' },
                  { name: 'jwt' },
                ],
              },
            ],
          },
          key: 'key',
        })
      )
      .replyWithFile(
        200,
        __dirname +
          '/__fixtures__/mailchimp-messages-send-success-response.json',
        {
          'Content-Type': 'application/json',
        }
      );

    const deeplyNestedObject = {
      root1: {
        n1: {
          n2: {
            n3: {
              depth: 3,
            },
            depth: 2,
          },
          depth: 1,
        },
        depth: 0,
      },
      root2: 1,
      root3: 'ok',
    };

    await new MailController(prismaMock as any, mailContext, {
      daysAwayFromEnding: 1,
      externalMailTemplateId: mockMailTemplate1.externalMailTemplateId,
      recipient: mockUser,
      isRetry: true,
      periodicJobRunDate: new Date(),
      optionalData: deeplyNestedObject,
      mailType: mailLogType.SubscriptionFlow,
    }).sendMail();
    expect(mandrillNockScope.isDone()).toBeTruthy();

    let mailLog = mockMailLog1;
    expect(mailLog).not.toBeUndefined();
    expect(mailLog!.state).toEqual('submitted');
    expect(mailLog!.mailProviderID).toEqual('mailchimp');

    // Overwrite mailProvider with Mailgun

    const mailgunNockScope = await nock('https://api.eu.mailgun.net')
      .post('/v3/test.wepublish.com/messages')
      .replyWithFile(200, __dirname + '/__fixtures__/mailgun_answer.json', {
        'Content-Type': 'application/json',
      });

    await kvMock.setNs(
      'settings:mailprovider',
      'mailgun',
      JSON.stringify({
        id: 'mailgun',
        type: 'mailgun',
        name: 'Mailgun',
        fromAddress: 'dev@wepublish.ch',
        replyToAddress: 'dev@wepublish.ch',
        webhookEndpointSecret: 'webhookEndpointSecret',
        apiKey: 'key',
        mailgun_mailDomain: 'test.wepublish.com',
        mailgun_baseDomain: 'api.eu.mailgun.net',
      })
    );

    mailContext.mailProvider = new MailgunMailProvider({
      id: 'mailgun',
      incomingRequestHandler: bodyParser.json(),
      prisma: prismaMock as any,
      kv: kvMock,
    });

    const periodicJobRunDate = new Date();
    await new MailController(prismaMock as any, mailContext, {
      daysAwayFromEnding: 1,
      externalMailTemplateId: mockMailTemplate2.externalMailTemplateId,
      recipient: mockUser,
      isRetry: true,
      periodicJobRunDate,
      optionalData: deeplyNestedObject,
      mailType: mailLogType.SubscriptionFlow,
    }).sendMail();
    expect(mailgunNockScope.isDone()).toBeTruthy();

    mailLog = mockMailLog2;
    expect(mailLog).not.toBeUndefined();
    expect(mailLog!.state).toEqual('submitted');
    expect(mailLog!.mailProviderID).toEqual('mailgun');

    const mailgunNockScope2 = await nock('https://api.eu.mailgun.net')
      .post('/v3/test.wepublish.com/messages')
      .replyWithFile(200, __dirname + '/__fixtures__/mailgun_answer.json', {
        'Content-Type': 'application/json',
      });

    await new MailController(prismaMock as any, mailContext, {
      daysAwayFromEnding: 1,
      externalMailTemplateId: mockMailTemplate2.externalMailTemplateId,
      recipient: mockUser,
      isRetry: true,
      periodicJobRunDate,
      optionalData: deeplyNestedObject,
      mailType: mailLogType.SubscriptionFlow,
    }).sendMail();
    expect(mailgunNockScope2.isDone()).toBeFalsy();
    nock.cleanAll();
  });
});
