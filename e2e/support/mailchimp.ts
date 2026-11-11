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

/**
 * The real Mailchimp test audience `@mailchimp` scenarios write to (there is
 * no fake). Only what cleanup needs: members the website added are deleted.
 */
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

  /**
   * Deletes the member for good: the website adds readers as `pending`, which
   * Mailchimp refuses to archive (405). The address cannot be re-added, which
   * is fine, as every scenario's reader has a new one. Addresses that never
   * made it into the list are fine.
   */
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
