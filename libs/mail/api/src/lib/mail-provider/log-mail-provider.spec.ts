import { createKvMock } from '@wepublish/kv-ttl-cache/api';
import {
  extractLinks,
  LOG_MAIL_BODY_MAX_LENGTH,
  LogMailProvider,
  readableBody,
} from './log-mail-provider';

const makeProvider = async () => {
  const kv = createKvMock();

  await kv.setNs(
    'settings:mailprovider',
    'log',
    JSON.stringify({
      id: 'log',
      type: 'log',
      name: 'Log',
      fromAddress: 'dev@wepublish.ch',
    })
  );

  return new LogMailProvider({ id: 'log', kv, prisma: {} as never });
};

const sendProps = {
  mailLogID: 'log-1',
  recipient: 'user@example.com',
  replyToAddress: 'dev@wepublish.ch',
  subject: 'Your login link',
  message: 'Open https://example.com/articles/1',
  messageHtml: '<p>Open https://example.com/articles/1</p>',
};

describe('LogMailProvider', () => {
  it('writes the mail to the log instead of sending it', async () => {
    const provider = await makeProvider();
    const info = jest.spyOn(provider['log'], 'info').mockImplementation();

    await provider.sendMail(sendProps);

    const [payload, message] = info.mock.calls[0];

    expect(message).toBe('Mail to user@example.com: Your login link');
    expect(payload).toMatchObject({
      mailLogID: 'log-1',
      from: 'dev@wepublish.ch',
      to: 'user@example.com',
      replyTo: 'dev@wepublish.ch',
      subject: 'Your login link',
      body: 'Open https://example.com/articles/1',
      links: ['https://example.com/articles/1'],
    });
  });

  it('falls back to the html body when there is no plain text', async () => {
    const provider = await makeProvider();
    const info = jest.spyOn(provider['log'], 'info').mockImplementation();

    await provider.sendMail({ ...sendProps, message: undefined });

    expect(info.mock.calls[0][0]).toMatchObject({
      body: 'Open https://example.com/articles/1',
    });
  });

  it('reports no message id, so nothing is polled for a delivery state', async () => {
    const provider = await makeProvider();
    jest.spyOn(provider['log'], 'info').mockImplementation();

    await expect(provider.sendMail(sendProps)).resolves.toEqual({});
  });

  it('has no webhook and no remote templates', async () => {
    const provider = await makeProvider();

    await expect(
      provider.webhookForSendMail({ req: {} as never })
    ).resolves.toEqual([]);
    await expect(provider.getTemplateContent()).resolves.toEqual({
      html: '',
      subject: '',
    });
  });

  it('blanks the login token in the logged body and links', async () => {
    const provider = await makeProvider();
    const info = jest.spyOn(provider['log'], 'info').mockImplementation();

    await provider.sendMail({
      ...sendProps,
      message: `Log in: https://example.com/login?jwt=${jwt}&next=/abo`,
      messageHtml: undefined,
    });

    const [payload] = info.mock.calls[0];

    expect(JSON.stringify(payload)).not.toContain(jwt);
    expect(payload).toMatchObject({
      body: 'Log in: https://example.com/login?jwt=[redacted]&next=/abo',
      links: ['https://example.com/login?jwt=[redacted]&next=/abo'],
    });
  });

  it('takes its name from the configuration', async () => {
    const provider = await makeProvider();

    await expect(provider.getName()).resolves.toBe('Log');
  });
});

const jwt = 'eyJhbGciOiJFZERTQSJ9.eyJzdWIiOiJ1c2VyLTEifQ.c2lnbmF0dXJlLWJ5dGVz';

describe('readableBody', () => {
  it('blanks a token that is not part of a link', () => {
    expect(readableBody({ message: `Your code is ${jwt}.` })).toBe(
      'Your code is [redacted].'
    );
  });

  it('keeps plain text as it is', () => {
    expect(readableBody({ message: 'Hello there' })).toBe('Hello there');
  });

  it('reduces an html mail to its words', () => {
    const messageHtml =
      '<html><head><style>p{margin:10px 0;padding:0}</style></head>' +
      '<body><p>Hello&nbsp;there</p>\r\n<a href="https://example.com">Log in</a></body></html>';

    // A mail template is mostly markup; logging it verbatim buries every other
    // line in the log.
    expect(readableBody({ messageHtml })).toBe('Hello there Log in');
  });

  it('truncates a long body', () => {
    const body = readableBody({ message: 'x'.repeat(5000) });

    expect(body).toHaveLength(LOG_MAIL_BODY_MAX_LENGTH + 1);
    expect(body.endsWith('…')).toBe(true);
  });
});

describe('extractLinks', () => {
  it('collects the links, which is what the log is read for', () => {
    const messageHtml =
      '<html xmlns="http://www.w3.org/1999/xhtml">' +
      '<a href="https://example.com/login">Log in</a>' +
      '<img src="https://example.com/logo.png"></html>';

    // The namespace and the logo are links too, and they would crowd out the
    // one link the log is opened for.
    expect(extractLinks({ messageHtml })).toEqual([
      'https://example.com/login',
    ]);
  });

  it('still finds a bare url in a plain text mail', () => {
    expect(extractLinks({ message: 'Open https://example.com/x now' })).toEqual(
      ['https://example.com/x']
    );
  });

  it('blanks the value of a token parameter', () => {
    const messageHtml =
      '<a href="https://example.com/reset?token=abc123&lang=de">Reset</a>';

    expect(extractLinks({ messageHtml })).toEqual([
      'https://example.com/reset?token=[redacted]&lang=de',
    ]);
  });

  it('reports each link once', () => {
    const messageHtml =
      '<a href="https://example.com/a">one</a><a href="https://example.com/a">again</a>';

    expect(extractLinks({ messageHtml })).toEqual(['https://example.com/a']);
  });
});
