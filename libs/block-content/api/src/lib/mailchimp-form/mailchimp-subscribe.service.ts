import { Injectable } from '@nestjs/common';
import mailchimp from '@mailchimp/mailchimp_marketing';
import { createHash } from 'crypto';
import {
  SecretCrypto,
  SyncProviderSettingsService,
} from '@wepublish/settings/api';
import { MailchimpContactInput } from './mailchimp-subscribe.model';

@Injectable()
export class MailchimpSubscribeService {
  private readonly crypto = new SecretCrypto();

  constructor(
    private syncProviderSettingsService: SyncProviderSettingsService
  ) {}

  async addContact(input: MailchimpContactInput): Promise<void> {
    const setting = await this.syncProviderSettingsService.syncProviderSetting(
      input.syncProviderId
    );

    if (!setting.mailchimp_apiKey) {
      throw new Error('Missing Mailchimp API key');
    }

    const apiKey = this.crypto.decrypt(setting.mailchimp_apiKey);
    const server = apiKey.split('-')[1];

    if (!server) {
      throw new Error('Invalid Mailchimp API key format (expected key-server)');
    }

    mailchimp.setConfig({ apiKey, server });

    const subscriberHash = createHash('md5')
      .update(input.email.toLowerCase())
      .digest('hex');

    await mailchimp.lists.setListMember(input.listId, subscriberHash, {
      email_address: input.email,
      status_if_new: input.status,
      status: input.status,
      merge_fields: input.mergeFields ?? {},
      interests: input.interests ?? {},
    });
  }
}
