import {
  MailchimpMailProvider,
  MailProviderTemplate,
} from '@wepublish/mail/api';
import nock from 'nock';
import { PrismaClient } from '@prisma/client';
import { createKvMock } from '@wepublish/kv-ttl-cache/api';
import { KvTtlCacheService } from '@wepublish/kv-ttl-cache/api';

let mailChimpMailProvider: MailchimpMailProvider;

let listTemplates: nock.Scope;
let listTemplatesInvalidKey: nock.Scope;
let sendMail: nock.Scope;
let sendTemplate: nock.Scope;
const prisma: PrismaClient = new PrismaClient();
const kv: KvTtlCacheService = createKvMock();

describe('Mailchimp Mail Provider', () => {
  beforeAll(() => {
    listTemplates = nock('https://mandrillapp.com')
      .persist()
      .post('/api/1.0/templates/list', { key: 'md-12345678' })
      .replyWithFile(
        200,
        __dirname +
          '/__fixtures__/mailchimp-templates-list-success-response.json',
        {
          'Content-Type': 'application/json',
        }
      );

    listTemplatesInvalidKey = nock('https://mandrillapp.com')
      .persist()
      .post('/api/1.0/templates/list', { key: 'invalid-key' })
      .replyWithFile(
        500,
        __dirname +
          '/__fixtures__/mailchimp-templates-list-error-response.json',
        {
          'Content-Type': 'application/json',
        }
      );

    sendMail = nock('https://mandrillapp.com')
      .persist()
      .post('/api/1.0/messages/send')
      .replyWithFile(
        200,
        __dirname +
          '/__fixtures__/mailchimp-messages-send-success-response.json',
        {
          'Content-Type': 'application/json',
        }
      );

    sendTemplate = nock('https://mandrillapp.com')
      .persist()
      .post('/api/1.0/messages/send-template')
      .replyWithFile(
        200,
        __dirname +
          '/__fixtures__/mailchimp-messages-send-success-response.json',
        {
          'Content-Type': 'application/json',
        }
      );
  });

  test('should be able to be created', async () => {
    await kv.setNs(
      'settings:mailprovider',
      'mailchimp',
      JSON.stringify({
        id: 'mailchimp',
        type: 'mailchimp',
        name: 'Mailchimp',
        fromAddress: 'dev@wepublish.ch',
        replyTpAddress: 'dev@wepublish.ch',
        webhookEndpointSecret: 'fakeSecret',
        apiKey: 'fakeAPIkey',
        mailchimp_baseURL: 'https://mailchimp.com',
      })
    );

    mailChimpMailProvider = new MailchimpMailProvider({
      id: 'mailchimp',
      prisma,
      kv,
    });

    expect(mailChimpMailProvider).toBeDefined();
  });

  test('sendMail should call mandrill send', async () => {
    await mailChimpMailProvider.sendMail({
      message: 'hello Test',
      subject: 'test subject',
      recipient: 'test@wepublish.ch',
      replyToAddress: 'dev@wepublish.ch',
      mailLogID: 'fakeMailLogID',
    });

    expect(sendMail.isDone()).toEqual(true);
  });

  test('sendMail with template should call mandrill sendTemplate', async () => {
    await mailChimpMailProvider.sendMail({
      subject: 'test subject',
      recipient: 'test@wepublish.ch',
      replyToAddress: 'dev@wepublish.ch',
      mailLogID: 'fakeMailLogID',
      template: 'test-mail',
      templateData: { message: 'hello Test' },
    });

    expect(sendTemplate.isDone()).toEqual(true);
  });

  test('loads templates', async () => {
    await kv.setNs(
      'settings:mailprovider',
      'mailchimp',
      JSON.stringify({
        id: 'mailchimp',
        type: 'mailchimp',
        name: 'Mailchimp',
        fromAddress: 'dev@wepublish.ch',
        replyTpAddress: 'dev@wepublish.ch',
        webhookEndpointSecret: 'fakeSecret',
        apiKey: 'md-12345678',
        mailchimp_baseURL: 'https://mailchimp.com',
      })
    );

    mailChimpMailProvider = new MailchimpMailProvider({
      id: 'mailchimp',
      prisma,
      kv,
    });

    const response = await mailChimpMailProvider.getTemplates();
    const templates = response as MailProviderTemplate[];
    expect(templates.length).toEqual(2);
    expect(templates.map(t => t.name).sort()).toEqual(
      ['Subscription Creation', 'Subscription Expiration'].sort()
    );
    expect(listTemplates.isDone()).toEqual(true);
  });

  test('returns error when using invalid key', async () => {
    await kv.setNs(
      'settings:mailprovider',
      'mailchimp',
      JSON.stringify({
        id: 'mailchimp',
        type: 'mailchimp',
        name: 'Mailchimp',
        fromAddress: 'dev@wepublish.ch',
        replyTpAddress: 'dev@wepublish.ch',
        webhookEndpointSecret: 'fakeSecret',
        apiKey: 'invalid-key',
        mailchimp_baseURL: 'https://mailchimp.com',
      })
    );
    mailChimpMailProvider = new MailchimpMailProvider({
      id: 'mailchimp',
      kv,
      prisma,
    });

    await expect(mailChimpMailProvider.getTemplates()).rejects.toThrow(
      'Invalid API key'
    );
    expect(listTemplatesInvalidKey.isDone()).toEqual(true);
  });
});
