import nock from 'nock'
import {MailTemplate, PrismaClient} from '@prisma/client'
import {
  initialize,
  defineMailTemplateFactory,
  defineUserFactory,
  clearFullDatabase,
  clearDatabase
} from '@wepublish/testing'
import {Test, TestingModule} from '@nestjs/testing'
import {forwardRef} from '@nestjs/common'
import {PrismaModule} from '@wepublish/nest-modules'
import {matches} from 'lodash'
import bodyParser from 'body-parser'
import Mailgun from 'mailgun.js'
import FormData from 'form-data'
import {MailContext} from './mail-context'
import {MailchimpMailProvider, MailgunMailProvider} from './mail-provider'
import {MailController, mailLogType} from './mail.controller'

describe('MailController', () => {
  let mailContext: MailContext
  const prismaClient = new PrismaClient()
  initialize({prisma: prismaClient})

  const UserFactory = defineUserFactory()
  const MailTemplateFactory = defineMailTemplateFactory()

  let mailTemplate1: MailTemplate
  let mailTemplate2: MailTemplate

  beforeEach(async () => {
    await clearDatabase(prismaClient, ['mail_templates', 'mail.log'])
    await nock.disableNetConnect()

    mailTemplate1 = await MailTemplateFactory.create({
      name: 'template1',
      externalMailTemplateId: 'template1'
    })
    mailTemplate2 = await MailTemplateFactory.create({
      name: 'template2',
      externalMailTemplateId: 'template2'
    })

    const module: TestingModule = await Test.createTestingModule({
      imports: [forwardRef(() => PrismaModule.forTest(prismaClient))],
      providers: [
        PrismaClient,
        {
          provide: MailContext,
          useFactory: (prisma: PrismaClient) => {
            return new MailContext({
              prisma,
              mailProvider: new MailchimpMailProvider({
                id: 'mailchimp',
                name: 'Mailchimp',
                fromAddress: 'dev@wepublish.ch',
                webhookEndpointSecret: 'secret',
                apiKey: 'key',
                baseURL: '',
                incomingRequestHandler: bodyParser.urlencoded({extended: true})
              }),
              defaultFromAddress: 'defaultFromAddress@example.com',
              defaultReplyToAddress: 'defaultReplyToAddress@example.com'
            })
          },
          inject: [PrismaClient]
        }
      ]
    }).compile()
    mailContext = module.get<MailContext>(MailContext)
  })

  afterEach(async () => {
    await nock.cleanAll()
    await nock.enableNetConnect()
    await prismaClient.$disconnect()
  })

  beforeAll(async () => {
    await clearFullDatabase(prismaClient)
  })

  it('is defined', () => {
    expect(mailContext).toBeDefined()
  })

  it('send mail', async () => {
    const user = await UserFactory.create({
      email: 'test-user@wepublish.com',
      emailVerifiedAt: new Date(),
      name: 'User',
      firstName: 'Test',
      password: 'pw',
      active: true,
      lastLogin: new Date(),
      paymentProviderCustomers: {
        create: {
          paymentProviderID: 'paymentProviderID',
          customerID: 'customerID'
        }
      }
    })

    const mandrillNockScope = await nock('https://mandrillapp.com:443')
      .post(
        '/api/1.0/messages/send-template',
        matches({
          template_name: 'template1',
          template_content: [],
          message: {
            subject: '',
            from_email: 'dev@wepublish.ch',
            to: [{email: 'test-user@wepublish.com', type: 'to'}],
            merge_vars: [
              {
                rcpt: 'test-user@wepublish.com',
                vars: [
                  {name: 'user_id'},
                  {name: 'user_email', content: 'test-user@wepublish.com'},
                  {name: 'user_name', content: 'User'},
                  {name: 'user_firstName', content: 'Test'},
                  {name: 'user_password', content: 'hidden'},
                  {name: 'user_active', content: true},
                  {name: 'user_roleIDs_0', content: 'hidden'},
                  {name: 'optional_root1_n1_n2_n3_depth', content: 3},
                  {name: 'optional_root1_n1_n2_depth', content: 2},
                  {name: 'optional_root1_n1_depth', content: 1},
                  {name: 'optional_root1_depth', content: 0},
                  {name: 'optional_root2', content: 1},
                  {name: 'optional_root3', content: 'ok'},
                  {name: 'jwt'}
                ]
              }
            ]
          },
          key: 'key'
        })
      )
      .replyWithFile(
        200,
        __dirname + '/__fixtures__/mailchimp-messages-send-success-response.json',
        {
          'Content-Type': 'application/json'
        }
      )

    const deeplyNestedObject = {
      root1: {
        n1: {
          n2: {
            n3: {
              depth: 3
            },
            depth: 2
          },
          depth: 1
        },
        depth: 0
      },
      root2: 1,
      root3: 'ok'
    }

    await new MailController(prismaClient, mailContext, {
      daysAwayFromEnding: 1,
      externalMailTemplateId: mailTemplate1.externalMailTemplateId,
      recipient: user,
      isRetry: true,
      periodicJobRunDate: new Date(),
      optionalData: deeplyNestedObject,
      mailType: mailLogType.SubscriptionFlow
    }).sendMail()
    expect(mandrillNockScope.isDone()).toBeTruthy()
    let mailLog = await prismaClient.mailLog.findFirst({
      where: {
        mailTemplateId: mailTemplate1.id
      }
    })
    expect(mailLog).not.toBeUndefined()
    expect(mailLog!.state).toEqual('submitted')
    expect(mailLog!.mailProviderID).toEqual('mailchimp')

    // Overwrite mailProvider with Mailgun

    const mailgunNockScope = await nock('https://api.eu.mailgun.net')
      .post('/v3/test.wepublish.com/messages')
      .replyWithFile(200, __dirname + '/__fixtures__/mailgun_answer.json', {
        'Content-Type': 'application/json'
      })

    const mailgunClient = new Mailgun(FormData).client({username: 'api', key: 'fake-key'})
    mailContext.mailProvider = new MailgunMailProvider({
      id: 'mailgun',
      name: 'Mailgun',
      fromAddress: 'dev@wepublish.ch',
      webhookEndpointSecret: 'webhookEndpointSecret',
      baseDomain: 'api.eu.mailgun.net',
      mailDomain: 'test.wepublish.com',
      apiKey: 'key',
      incomingRequestHandler: bodyParser.json(),
      mailgunClient
    })

    const periodicJobRunDate = new Date()
    await new MailController(prismaClient, mailContext, {
      daysAwayFromEnding: 1,
      externalMailTemplateId: mailTemplate2.externalMailTemplateId,
      recipient: user,
      isRetry: true,
      periodicJobRunDate,
      optionalData: deeplyNestedObject,
      mailType: mailLogType.SubscriptionFlow
    }).sendMail()
    expect(mailgunNockScope.isDone()).toBeTruthy()
    mailLog = await prismaClient.mailLog.findFirst({
      where: {
        mailTemplateId: mailTemplate2.id
      }
    })
    expect(mailLog).not.toBeUndefined()
    expect(mailLog!.state).toEqual('submitted')
    expect(mailLog!.mailProviderID).toEqual('mailgun')

    const mailgunNockScope2 = await nock('https://api.eu.mailgun.net')
      .post('/v3/test.wepublish.com/messages')
      .replyWithFile(200, __dirname + '/__fixtures__/mailgun_answer.json', {
        'Content-Type': 'application/json'
      })

    await new MailController(prismaClient, mailContext, {
      daysAwayFromEnding: 1,
      externalMailTemplateId: mailTemplate2.externalMailTemplateId,
      recipient: user,
      isRetry: true,
      periodicJobRunDate,
      optionalData: deeplyNestedObject,
      mailType: mailLogType.SubscriptionFlow
    }).sendMail()
    expect(mailgunNockScope2.isDone()).toBeFalsy()
    nock.cleanAll()
  })
})
