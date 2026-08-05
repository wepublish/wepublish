import bodyParser from 'body-parser';
import nock from 'nock';
import { createKvMock } from '@wepublish/kv-ttl-cache/api';
import { MailchimpMailProvider } from './mailchimp-mail-provider';
import { MailProviderError } from './mail-provider.interface';

const MANDRILL = 'https://mandrillapp.com:443';

const makeProvider = async () => {
  const kv = createKvMock();

  await kv.setNs(
    'settings:mailprovider',
    'mailchimp',
    JSON.stringify({
      id: 'mailchimp',
      type: 'mailchimp',
      name: 'Mailchimp',
      fromAddress: 'dev@wepublish.ch',
      apiKey: 'key',
    })
  );

  return new MailchimpMailProvider({
    id: 'mailchimp',
    incomingRequestHandler: bodyParser.urlencoded({ extended: true }),
    kv,
    prisma: {} as any,
  });
};

const sendProps = {
  mailLogID: 'log-1',
  recipient: 'user@example.com',
  replyToAddress: 'dev@wepublish.ch',
  subject: 'Hello',
  message: 'Hi',
  messageHtml: '<p>Hi</p>',
};

describe('MailchimpMailProvider', () => {
  afterEach(async () => {
    await nock.cleanAll();
  });

  it('sends the mail log id along, so delivery events can be mapped back', async () => {
    let sentBody: any;

    const scope = nock(MANDRILL)
      .post('/api/1.0/messages/send', body => {
        sentBody = body;

        return true;
      })
      .reply(200, [{ email: sendProps.recipient, status: 'sent', _id: 'x' }]);

    await (await makeProvider()).sendMail(sendProps);

    expect(scope.isDone()).toBeTruthy();
    expect(sentBody.message.metadata).toEqual({ mail_log_id: 'log-1' });
  });

  it('accepts a message the provider queued', async () => {
    nock(MANDRILL)
      .post('/api/1.0/messages/send')
      .reply(200, [{ email: sendProps.recipient, status: 'queued', _id: 'x' }]);

    await expect(
      (await makeProvider()).sendMail(sendProps)
    ).resolves.toBeUndefined();
  });

  it('fails with the reject reason when the provider refuses the recipient', async () => {
    // Mandrill answers a refusal with HTTP 200 — only the per-recipient status
    // says the mail was never accepted.
    nock(MANDRILL)
      .post('/api/1.0/messages/send')
      .reply(200, [
        {
          email: sendProps.recipient,
          status: 'rejected',
          reject_reason: 'hard-bounce',
          _id: 'x',
        },
      ]);

    await expect((await makeProvider()).sendMail(sendProps)).rejects.toThrow(
      new MailProviderError('Mandrill rejected user@example.com: hard-bounce')
    );
  });

  it('fails on an invalid recipient', async () => {
    nock(MANDRILL)
      .post('/api/1.0/messages/send')
      .reply(200, [
        { email: sendProps.recipient, status: 'invalid', _id: 'x' },
      ]);

    await expect((await makeProvider()).sendMail(sendProps)).rejects.toThrow(
      MailProviderError
    );
  });
});
