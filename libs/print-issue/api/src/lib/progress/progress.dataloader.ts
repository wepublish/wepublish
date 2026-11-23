import { Injectable, Scope } from '@nestjs/common';
import { DataLoaderService } from '@wepublish/utils/api';
import type { PrintIssueProgressView } from './progress';
import { PrintIssueProgressService } from './progress.service';

/** Per user, the subscriptions with printed issues to count: one read per page of users. */
@Injectable({ scope: Scope.REQUEST })
export class UserPrintIssueProgressDataloader extends DataLoaderService<
  PrintIssueProgressView[]
> {
  constructor(private progress: PrintIssueProgressService) {
    super();
  }

  protected async loadByKeys(userIds: string[]) {
    const byUser = await this.progress.forUsers(userIds);

    return userIds.map(userId => byUser.get(userId) ?? []);
  }
}

/** Per subscription; null where nothing is promised. */
@Injectable({ scope: Scope.REQUEST })
export class SubscriptionPrintIssueProgressDataloader extends DataLoaderService<PrintIssueProgressView | null> {
  constructor(private progress: PrintIssueProgressService) {
    super();
  }

  protected async loadByKeys(subscriptionIds: string[]) {
    const bySubscription = await this.progress.forSubscriptions(subscriptionIds);

    return subscriptionIds.map(id => bySubscription.get(id) ?? null);
  }
}
