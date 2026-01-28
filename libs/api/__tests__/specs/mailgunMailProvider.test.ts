import nock from 'nock';
import Mailgun from 'mailgun.js';
import FormData from 'form-data';
import { MailgunMailProvider, MailProviderTemplate } from '@wepublish/mail/api';

const mockSubmit = jest.fn();
const mockAppend = jest.fn();

jest.mock('form-data', () => {
  return jest.fn().mockImplementation(() => {
    return {
      append: mockAppend,
      submit: mockSubmit,
    };
  });
});

let listTemplates: nock.Scope;
let listTemplatesInvalidKey: nock.Scope;

describe('Mailgun Mail Provider', () => {
  beforeAll(() => {
    listTemplates = nock('https://api.mailgun.net')
      .persist()
      .get('/v3/sandbox8a2185cfb29c48d4941d51c261fc3e03.mailgun.org/templates')
      .basicAuth({ user: 'api', pass: 'mg-12345678' })
      .replyWithFile(
        200,
        __dirname +
          '/__fixtures__/mailgun-templates-list-success-response.json',
        {
          'Content-Type': 'application/json',
        }
      );

    listTemplatesInvalidKey = nock('https://api.mailgun.net')
      .persist()
      .get('/v3/sandbox8a2185cfb29c48d4941d51c261fc3e03.mailgun.org/templates')
      .basicAuth({ user: 'api', pass: 'invalid-key' })
      .replyWithFile(
        401,
        __dirname + '/__fixtures__/mailgun-templates-list-error-response.json',
        {
          'Content-Type': 'application/json',
        }
      );
  });

  test('can be created', () => {
    const mailgunClient = new Mailgun(FormData).client({
      username: 'api',
      key: 'fakeAPIkey',
    });
    const mailgunMailProvider = new MailgunMailProvider({
      id: 'mailgun',
      name: 'Mailgun',
      apiKey: 'fakeAPIkey',
      baseDomain: 'https://mailgun.com',
      mailDomain: 'https://mailgun.com',
      webhookEndpointSecret: 'fakeSecret',
      fromAddress: 'dev@wepublish.ch',
      mailgunClient,
    });
    expect(mailgunMailProvider).toBeDefined();
  });

  test('loads templates', async () => {
    const mailgunClient = new Mailgun(FormData).client({
      username: 'api',
      key: 'mg-12345678',
    });
    const mailgunMailProvider = new MailgunMailProvider({
      id: 'mailgun',
      name: 'Mailgun',
      apiKey: 'mg-12345678',
      baseDomain: 'https://mailgun.com',
      mailDomain: 'sandbox8a2185cfb29c48d4941d51c261fc3e03.mailgun.org',
      webhookEndpointSecret: 'fakeSecret',
      fromAddress: 'dev@wepublish.ch',
      mailgunClient,
    });

    const response = await mailgunMailProvider.getTemplates();
    const templates = response as MailProviderTemplate[];
    expect(templates.length).toEqual(2);
    expect(templates.map(t => t.name).sort()).toEqual(
      ['subscription_creation', 'subscription_expiration'].sort()
    );
    expect(listTemplates.isDone()).toEqual(true);
  });

  test('returns error when using invalid key', async () => {
    const mailgunClient = new Mailgun(FormData).client({
      username: 'api',
      key: 'invalid-key',
    });
    const mailgunMailProvider = new MailgunMailProvider({
      id: 'mailgun',
      name: 'Mailgun',
      apiKey: 'invalid-key',
      baseDomain: 'https://mailgun.com',
      mailDomain: 'sandbox8a2185cfb29c48d4941d51c261fc3e03.mailgun.org',
      webhookEndpointSecret: 'fakeSecret',
      fromAddress: 'dev@wepublish.ch',
      mailgunClient,
    });

    await expect(mailgunMailProvider.getTemplates()).rejects.toThrow(
      'Invalid private key'
    );
    expect(listTemplatesInvalidKey.isDone()).toEqual(true);
  });
});
