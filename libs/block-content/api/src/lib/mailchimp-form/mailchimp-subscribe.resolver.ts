import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { Logger } from '@nestjs/common';
import { Public } from '@wepublish/authentication/api';
import {
  MailchimpContactInput,
  MailchimpSubscribeResult,
} from './mailchimp-subscribe.model';
import { MailchimpSubscribeService } from './mailchimp-subscribe.service';

@Resolver()
export class MailchimpSubscribeResolver {
  private readonly logger = new Logger(MailchimpSubscribeResolver.name);

  constructor(private mailchimpSubscribeService: MailchimpSubscribeService) {}

  @Public()
  @Mutation(() => MailchimpSubscribeResult, {
    description: 'Subscribes a contact to a Mailchimp list.',
  })
  async addMailchimpContact(
    @Args('input') input: MailchimpContactInput
  ): Promise<MailchimpSubscribeResult> {
    try {
      await this.mailchimpSubscribeService.addContact(input);

      return { success: true };
    } catch (error) {
      const message =
        (error as { response?: { body?: { detail?: string } } })?.response?.body
          ?.detail ??
        (error as Error)?.message ??
        'Unknown error';

      this.logger.error(`Mailchimp subscribe failed: ${message}`);

      return { success: false, error: message };
    }
  }
}
