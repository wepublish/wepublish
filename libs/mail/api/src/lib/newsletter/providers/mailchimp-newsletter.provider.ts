import mailchimp from '@mailchimp/mailchimp_marketing';
import { createHash } from 'crypto';
import {
  NewsletterProvider,
  NewsletterProviderError,
  NewsletterSubscribeProps,
} from '../newsletter-provider.interface';

export class MailchimpNewsletterProvider extends NewsletterProvider {
  async subscribe({
    email,
    firstName,
    lastName,
    source,
  }: NewsletterSubscribeProps): Promise<void> {
    const { decryptedApiKey, mailchimp_listId: listId } = this.config;

    if (!decryptedApiKey || !listId) {
      throw new NewsletterProviderError(
        `Newsletter '${this.config.id}' is missing a Mailchimp api key or list id`
      );
    }

    const server = decryptedApiKey.split('-')[1];

    if (!server) {
      throw new NewsletterProviderError(
        'Invalid Mailchimp API key format (expected key-server)'
      );
    }

    mailchimp.setConfig({ apiKey: decryptedApiKey, server });

    const normalizedEmail = email.trim().toLowerCase();
    const mergeFields: Record<string, string> = {};

    if (firstName) {
      mergeFields['FNAME'] = firstName;
    }

    if (lastName) {
      mergeFields['LNAME'] = lastName;
    }

    if (source) {
      mergeFields['SOURCE'] = source;
    }

    const defaultInterestGroupIds = (this.config
      .mailchimp_defaultInterestGroupIds ?? []) as unknown as string[];

    const interests = Object.fromEntries(
      defaultInterestGroupIds.map(groupId => [groupId, true])
    );

    try {
      await mailchimp.lists.setListMember(
        listId,
        createHash('md5').update(normalizedEmail).digest('hex'),
        {
          email_address: normalizedEmail,
          // Only applies to contacts that are not on the list yet, so Mailchimp
          // sends its confirmation mail instead of subscribing without consent.
          status_if_new: 'pending',
          ...(Object.keys(mergeFields).length ?
            { merge_fields: mergeFields }
          : {}),
          ...(Object.keys(interests).length ? { interests } : {}),
        }
      );
    } catch (error) {
      throw new NewsletterProviderError(getErrorMessage(error));
    }
  }
}

function getErrorMessage(error: unknown): string {
  const response = (
    error as { response?: { body?: { detail?: string; title?: string } } }
  )?.response;
  const detail = response?.body?.detail;
  const title = response?.body?.title;

  if (title && detail) {
    return `${title}: ${detail}`;
  }

  return detail ?? (error as Error)?.message ?? String(error);
}
