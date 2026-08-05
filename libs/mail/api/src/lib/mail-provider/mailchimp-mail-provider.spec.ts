import bodyParser from 'body-parser';
import nock from 'nock';
import { MailLogState } from '@prisma/client';
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
    ).resolves.toBeDefined();
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

  it('keeps the mandrill message id so the state can be polled later', async () => {
    nock(MANDRILL)
      .post('/api/1.0/messages/send')
      .reply(200, [
        { email: sendProps.recipient, status: 'sent', _id: 'msg-123' },
      ]);

    await expect((await makeProvider()).sendMail(sendProps)).resolves.toEqual({
      providerMessageID: 'msg-123',
    });
  });

  describe('getMessageStates', () => {
    const infoReply = (state: string) => ({
      _id: 'msg-1',
      state,
      email: 'user@example.com',
    });

    // Mandrill's `sent` is what its dashboard shows as "Delivered".
    it.each([
      ['sent', MailLogState.delivered],
      ['spam', MailLogState.delivered],
      ['unsub', MailLogState.delivered],
      ['queued', MailLogState.submitted],
      ['scheduled', MailLogState.submitted],
      ['deferred', MailLogState.deferred],
      ['bounced', MailLogState.bounced],
      ['soft-bounced', MailLogState.bounced],
      ['rejected', MailLogState.rejected],
      ['invalid', MailLogState.rejected],
    ])('maps mandrill state %s onto %s', async (mandrillState, expected) => {
      nock(MANDRILL)
        .post('/api/1.0/messages/info')
        .reply(200, infoReply(mandrillState));

      const states = await (await makeProvider()).getMessageStates(['msg-1']);

      expect(states).toEqual([
        {
          providerMessageID: 'msg-1',
          state: expected,
          mailData: JSON.stringify(infoReply(mandrillState)),
        },
      ]);
    });

    it('skips a state it does not know instead of guessing', async () => {
      nock(MANDRILL)
        .post('/api/1.0/messages/info')
        .reply(200, infoReply('something-new'));

      await expect(
        (await makeProvider()).getMessageStates(['msg-1'])
      ).resolves.toEqual([]);
    });

    it('skips ids the provider no longer knows and keeps going', async () => {
      nock(MANDRILL)
        .post('/api/1.0/messages/info')
        .reply(500, { message: 'Unknown_Message' })
        .post('/api/1.0/messages/info')
        .reply(200, { _id: 'msg-2', state: 'sent' });

      const states = await (
        await makeProvider()
      ).getMessageStates(['msg-1', 'msg-2']);

      expect(states).toHaveLength(1);
      expect(states[0]).toMatchObject({
        providerMessageID: 'msg-2',
        state: MailLogState.delivered,
      });
    });
  });

  describe('listTemplates', () => {
    it('lists the remote templates with content, preferring the published version', async () => {
      nock(MANDRILL)
        .post('/api/1.0/templates/list')
        .reply(200, [
          {
            slug: 'welcome',
            name: 'Welcome',
            code: '<p>draft</p>',
            publish_code: '<p>published</p>',
            subject: 'draft subject',
            publish_subject: 'published subject',
          },
        ]);

      const templates = await (await makeProvider()).listTemplates();

      expect(templates).toEqual([
        {
          externalId: 'welcome',
          name: 'Welcome',
          html: '<p>published</p>',
          subject: 'published subject',
        },
      ]);
    });

    it('falls back to the draft version for an unpublished template', async () => {
      nock(MANDRILL)
        .post('/api/1.0/templates/list')
        .reply(200, [
          {
            slug: 'draft-only',
            name: 'Draft only',
            code: '<p>draft</p>',
            publish_code: null,
            subject: 'draft subject',
            publish_subject: null,
          },
        ]);

      const templates = await (await makeProvider()).listTemplates();

      expect(templates[0].html).toBe('<p>draft</p>');
      expect(templates[0].subject).toBe('draft subject');
    });

    it('names a template after its slug when the name is empty', async () => {
      nock(MANDRILL)
        .post('/api/1.0/templates/list')
        .reply(200, [{ slug: 'no-name', name: '', code: '<p>x</p>' }]);

      const templates = await (await makeProvider()).listTemplates();

      expect(templates[0].name).toBe('no-name');
      expect(templates[0].subject).toBeUndefined();
    });

    it('fails loudly when the provider rejects the request', async () => {
      nock(MANDRILL)
        .post('/api/1.0/templates/list')
        .reply(500, { message: 'Invalid API key' });

      await expect((await makeProvider()).listTemplates()).rejects.toThrow(
        MailProviderError
      );
    });
  });
});
