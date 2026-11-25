import {
  createNamespacedCacheTesting,
  type NamespacedCacheTesting,
} from '@wepublish/kv-ttl-cache/api/testing';
import { SlackMailProvider } from './slack-mail-provider';

const { fetchMock } = vi.hoisted(() => ({ fetchMock: vi.fn() }));

vi.mock('cross-fetch', () => ({ default: fetchMock }));

const harnesses: NamespacedCacheTesting[] = [];

afterEach(async () => {
  fetchMock.mockReset();
  await Promise.all(harnesses.splice(0).map(testing => testing.close()));
});

const makeProvider = async () => {
  const testing = await createNamespacedCacheTesting();
  harnesses.push(testing);

  await testing.cache.setNs(
    'settings:mailprovider',
    'slack',
    {
      id: 'slack',
      type: 'slack',
      name: 'Slack',
      slack_webhookURL: 'https://hooks.slack.test/abc',
    },
    60
  );

  return new SlackMailProvider({
    id: 'slack',
    kv: testing.cache,
    prisma: {} as never,
  });
};

describe('SlackMailProvider', () => {
  it('names the attachments a mail would have carried', async () => {
    fetchMock.mockResolvedValue(new Response('ok'));

    await (
      await makeProvider()
    ).sendMail({
      mailLogID: 'log-1',
      recipient: 'user@example.com',
      replyToAddress: 'dev@wepublish.ch',
      subject: 'Ihr Vertrag',
      messageHtml: '<p>Hallo</p>',
      attachments: [
        {
          filename: 'Vertrag.pdf',
          contentType: 'application/pdf',
          content: Buffer.from('%PDF-1.7'),
        },
      ],
    });

    const body = JSON.parse(fetchMock.mock.calls[0][1].body);

    expect(body.blocks[0].text.text).toContain('*Attachments*: Vertrag.pdf');
  });
});
