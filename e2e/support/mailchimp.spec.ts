import { APIRequestContext } from '@playwright/test';
import { describe, expect, it } from 'vitest';
import { MailchimpTestAudience, subscriberHash } from './mailchimp';

type Call = { url: string; auth?: string };

const fakeRequest = (status: number, calls: Call[] = []) =>
  ({
    delete: async (
      url: string,
      options?: { headers?: Record<string, string> }
    ) => {
      calls.push({ url, auth: options?.headers?.Authorization });

      return {
        ok: () => status < 300,
        status: () => status,
        text: async () => 'body',
      };
    },
  }) as unknown as APIRequestContext;

const config = {
  apiKey: 'secret-us7',
  listId: 'list1',
  interestId: 'interest1',
  emailDomain: 'example.test',
};

describe('subscriberHash', () => {
  it('is the md5 of the lowercased address, as Mailchimp expects', () => {
    expect(subscriberHash(' Mia@Example.com ')).toBe(
      subscriberHash('mia@example.com')
    );
    expect(subscriberHash('mia@example.com')).toMatch(/^[0-9a-f]{32}$/);
  });
});

describe('MailchimpTestAudience', () => {
  it("archives the member in the key's data center", async () => {
    const calls: Call[] = [];
    await new MailchimpTestAudience(fakeRequest(204, calls), config).archive(
      'mia@example.com'
    );

    expect(calls).toEqual([
      {
        url: `https://us7.api.mailchimp.com/3.0/lists/list1/members/${subscriberHash('mia@example.com')}`,
        auth: `Basic ${Buffer.from('e2e:secret-us7').toString('base64')}`,
      },
    ]);
  });

  it('accepts readers who never made it into the list', async () => {
    await expect(
      new MailchimpTestAudience(fakeRequest(404), config).archive('a@b.ch')
    ).resolves.toBeUndefined();
  });

  it('fails on any other error', async () => {
    await expect(
      new MailchimpTestAudience(fakeRequest(401), config).archive('a@b.ch')
    ).rejects.toThrow(/HTTP 401/);
  });
});
