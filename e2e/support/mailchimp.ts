import { APIRequestContext } from '@playwright/test';
import { createHash } from 'crypto';

export type MailchimpConfig = {
  apiKey: string;
  listId: string;
  interestId: string;
  /** Domain of the readers' addresses; Mailchimp refuses ones that look fake. */
  emailDomain: string;
};

/** Mailchimp's id of a list member: the MD5 of the lowercased address. */
export const subscriberHash = (email: string) =>
  createHash('md5').update(email.trim().toLowerCase()).digest('hex');

/** The real Mailchimp test audience of `@mailchimp` scenarios, for cleanup. */
export class MailchimpTestAudience {
  constructor(
    private readonly request: APIRequestContext,
    private readonly config: MailchimpConfig
  ) {}

  private get baseUrl() {
    const server = this.config.apiKey.split('-')[1];

    if (!server) {
      throw new Error('E2E_MAILCHIMP_API_KEY has no data center (key-us1).');
    }

    return `https://${server}.api.mailchimp.com/3.0`;
  }

  private get headers() {
    return {
      Authorization: `Basic ${Buffer.from(`e2e:${this.config.apiKey}`).toString('base64')}`,
    };
  }

  /** Deletes for good: Mailchimp refuses to archive `pending` members (405). */
  async remove(email: string) {
    const response = await this.request.post(
      `${this.baseUrl}/lists/${this.config.listId}/members/${subscriberHash(email)}/actions/delete-permanent`,
      { headers: this.headers }
    );

    if (!response.ok() && response.status() !== 404) {
      throw new Error(
        `Mailchimp: deleting ${email} failed: HTTP ${response.status()} ${await response.text()}`
      );
    }
  }
}
