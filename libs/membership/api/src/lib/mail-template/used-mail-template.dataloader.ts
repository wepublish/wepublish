import { Injectable, Scope } from '@nestjs/common';
import { MailContext } from '@wepublish/mail/api';
import { DataLoaderService } from '@wepublish/utils/api';

/**
 * Answers "is this template referenced by a subscription interval or a user
 * flow mail?" for many templates at once.
 *
 * `MailTemplateModel.status` is a per-template field resolver, so one
 * `mailTemplates` query resolves it once per template. Batching keeps the
 * underlying lookup at a single call per request instead of one per template.
 */
@Injectable({
  scope: Scope.REQUEST,
})
export class UsedMailTemplateDataloader extends DataLoaderService<boolean> {
  constructor(private mailContext: MailContext) {
    super();
  }

  protected async loadByKeys(mailTemplateIds: string[]) {
    const usedMailTemplateIds = new Set(
      await this.mailContext.getUsedTemplateIdentifiers()
    );

    return mailTemplateIds.map(id => usedMailTemplateIds.has(id));
  }
}
