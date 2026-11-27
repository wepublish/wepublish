import { Int, Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { AuthSession, CurrentUser } from '@wepublish/authentication/api';
import { FeaturesService } from '@wepublish/features/api';
import { PublicSubscription } from '@wepublish/membership/api';
import { CanGetPrintIssues } from '@wepublish/permissions';
import { hasPermission, permissionsOf } from '@wepublish/permissions/api';
// extends the staff-only user type, where the editor's user list reads it
// eslint-disable-next-line no-restricted-imports
import { SensitiveDataUser } from '@wepublish/user/api';
import {
  SubscriptionPrintIssueProgressDataloader,
  UserPrintIssueProgressDataloader,
} from './progress.dataloader';
import { PrintIssueProgress } from './progress.model';

/**
 * The fields answer null instead of failing, so the user list and the user
 * view keep working for staff without print issues or media without them.
 */
const allowed = async (
  features: FeaturesService,
  session: AuthSession | undefined
) =>
  hasPermission(CanGetPrintIssues, permissionsOf(session)) &&
  (await features.isEnabled('print-export'));

@Resolver(() => SensitiveDataUser)
export class UserPrintIssueProgressResolver {
  constructor(
    private features: FeaturesService,
    private progress: UserPrintIssueProgressDataloader
  ) {}

  @ResolveField(() => [PrintIssueProgress], {
    nullable: true,
    description:
      "The printed issues each of the user's subscriptions received; null without print issues.",
  })
  async printIssueProgress(
    @Parent() { id }: SensitiveDataUser,
    @CurrentUser() session: AuthSession | undefined
  ) {
    return (await allowed(this.features, session)) ?
        this.progress.load(id)
      : null;
  }

  @ResolveField(() => Int, {
    nullable: true,
    description:
      'Printed issues still to send to the user, over subscriptions running or still owed copies; null without printed issues.',
  })
  async printIssuesOwed(
    @Parent() { id }: SensitiveDataUser,
    @CurrentUser() session: AuthSession | undefined
  ) {
    if (!(await allowed(this.features, session))) {
      return null;
    }

    const views = (await this.progress.load(id)) ?? [];

    return views.length ?
        views
          .filter(view => view.relevant)
          .reduce((sum, view) => sum + view.owed, 0)
      : null;
  }
}

@Resolver(() => PublicSubscription)
export class SubscriptionPrintIssueProgressResolver {
  constructor(
    private features: FeaturesService,
    private progress: SubscriptionPrintIssueProgressDataloader
  ) {}

  @ResolveField(() => PrintIssueProgress, {
    nullable: true,
    description:
      'The printed issues the subscription received in its running (else latest paid) period; null where nothing is promised.',
  })
  async printIssueProgress(
    @Parent() { id }: PublicSubscription,
    @CurrentUser() session: AuthSession | undefined
  ) {
    return (await allowed(this.features, session)) ?
        this.progress.load(id)
      : null;
  }
}
