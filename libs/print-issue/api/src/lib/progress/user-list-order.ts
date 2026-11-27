import { Global, Module } from '@nestjs/common';
import { FeaturesService } from '@wepublish/features/api';
import { PrismaModule } from '@wepublish/nest-modules';
import {
  USER_LIST_ORDER,
  UserSort,
  type UserListOrder,
} from '@wepublish/user/api';
import { PrintIssueProgressService } from './progress.service';

/**
 * Sorts the user list by print issues still owed (UserSort.PrintIssuesOwed).
 * Global, because UserService resolves USER_LIST_ORDER from UserModule's scope;
 * the user library imports nothing from print-issue.
 */
@Global()
@Module({
  imports: [PrismaModule],
  providers: [
    PrintIssueProgressService,
    {
      provide: USER_LIST_ORDER,
      inject: [PrintIssueProgressService, FeaturesService],
      useFactory: (
        progress: PrintIssueProgressService,
        features: FeaturesService
      ): UserListOrder[] => [
        {
          sort: UserSort.PrintIssuesOwed,
          orderedIds: async (where, order) =>
            (await features.isEnabled('print-export')) ?
              progress.usersByOwed(where, order)
            : null,
        },
      ],
    },
  ],
  exports: [USER_LIST_ORDER],
})
export class PrintIssueUserListOrderModule {}
