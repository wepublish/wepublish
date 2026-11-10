import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CurrentUser, UserSession } from '@wepublish/authentication/api';
import { Feature } from '@wepublish/features/api';
import {
  CanCreatePrintIssue,
  CanDeletePrintIssue,
  CanFinalizePrintIssue,
  CanGetPrintIssues,
  CanGetSubscriptions,
  CanGetUsers,
} from '@wepublish/permissions';
import { Permissions } from '@wepublish/permissions/api';
import { BexioPrintSourceService } from './bexio/bexio-print-source.service';
import {
  PrintExportContext,
  PrintIssueFileModel,
  PrintIssueInputModel,
  PrintIssueModel,
  PrintIssueRun,
  toFileModel,
  toPrintIssueModel,
  toRunModel,
} from './print-issue.model';
import { PrintIssueService } from './print-issue.service';

/**
 * The print export is Neue Wege's for now: the whole resolver ships dark.
 * Everything that returns addresses needs what the subscription export needs.
 */
@Feature('print-export')
@Resolver(() => PrintIssueModel)
export class PrintIssueResolver {
  constructor(
    private issues: PrintIssueService,
    private bexioSource: BexioPrintSourceService
  ) {}

  @Permissions(CanGetPrintIssues)
  @Query(() => [PrintIssueModel], {
    description: 'All print issues, the newest first.',
  })
  async printIssues() {
    return (await this.issues.list()).map(toPrintIssueModel);
  }

  @Permissions(CanGetPrintIssues)
  @Query(() => PrintIssueModel, {
    description: 'One print issue with its deliveries.',
  })
  async printIssue(@Args('id') id: string) {
    return toPrintIssueModel(await this.issues.findById(id));
  }

  @Permissions(CanGetPrintIssues, CanGetSubscriptions, CanGetUsers)
  @Query(() => PrintExportContext, {
    description:
      "What the options can do here, and the medium's defaults for a new issue.",
  })
  async printExportContext() {
    const [bexioConfigured, defaults, kinds] = await Promise.all([
      this.bexioSource.configured(),
      this.issues.defaults(),
      this.issues.bexioKinds(),
    ]);

    return {
      bexioConfigured,
      defaults,
      bexioKinds: kinds.map(({ id, label, refersTo }) => ({
        id,
        label,
        refersTo,
      })),
    };
  }

  @Permissions(CanGetPrintIssues, CanGetSubscriptions, CanGetUsers)
  @Mutation(() => PrintIssueRun, {
    description:
      'Compute the list and store it for checking. What exporting it does follows from the state: the first delivery, the delivery not handed over yet written anew, or the next Nachlieferung. Replaces a stored list.',
  })
  async computePrintIssueRun(
    @Args('id') id: string,
    @CurrentUser() session: UserSession
  ) {
    return toRunModel(await this.issues.computeRun(id, session.user.id));
  }

  @Permissions(CanGetPrintIssues, CanGetSubscriptions, CanGetUsers)
  @Query(() => PrintIssueRun, {
    nullable: true,
    description: 'The computed list waiting to be checked, if any.',
  })
  async printIssueRun(@Args('id') id: string) {
    const run = await this.issues.storedRun(id);

    return run ? toRunModel(run) : null;
  }

  @Permissions(CanGetPrintIssues, CanGetSubscriptions, CanGetUsers)
  @Query(() => PrintIssueFileModel, {
    description:
      'The CSV for the printshop: one delivery, or every delivery of the issue merged in export order.',
  })
  async printIssueCsv(
    @Args('id') id: string,
    @Args('deliveryId', { type: () => String, nullable: true })
    deliveryId?: string | null
  ) {
    return toFileModel(await this.issues.csv(id, deliveryId));
  }

  @Permissions(CanCreatePrintIssue)
  @Mutation(() => PrintIssueModel, { description: 'Create a print issue.' })
  async createPrintIssue(@Args('input') input: PrintIssueInputModel) {
    return toPrintIssueModel(await this.issues.create(input));
  }

  @Permissions(CanCreatePrintIssue)
  @Mutation(() => PrintIssueModel, {
    description:
      'Update a print issue. The status never changes; a stored list is dropped when the ship day or the options change.',
  })
  async updatePrintIssue(
    @Args('id') id: string,
    @Args('input') input: PrintIssueInputModel
  ) {
    return toPrintIssueModel(await this.issues.update(id, input));
  }

  @Permissions(CanCreatePrintIssue)
  @Mutation(() => PrintIssueModel, {
    description:
      'Create the next issue of the same year with the same options. It keeps the ship day of the original until it is edited.',
  })
  async duplicatePrintIssue(@Args('id') id: string) {
    return toPrintIssueModel(await this.issues.duplicate(id));
  }

  @Permissions(CanDeletePrintIssue)
  @Mutation(() => PrintIssueModel, {
    description:
      'Delete a print issue none of whose lists was handed to the printshop.',
  })
  async deletePrintIssue(@Args('id') id: string) {
    return toPrintIssueModel(await this.issues.delete(id));
  }

  @Permissions(CanCreatePrintIssue, CanGetSubscriptions, CanGetUsers)
  @Mutation(() => PrintIssueModel, {
    description:
      'Write exactly the checked list (computedAt) as a delivery. Refuses a list computed again in between, one older than 24 hours, and one whose mode the state no longer allows.',
  })
  async exportPrintIssueRun(
    @Args('id') id: string,
    @Args('computedAt') computedAt: Date,
    @CurrentUser() session: UserSession
  ) {
    return toPrintIssueModel(
      await this.issues.exportRun(id, session.user.id, computedAt)
    );
  }

  @Permissions(CanFinalizePrintIssue)
  @Mutation(() => PrintIssueModel, {
    description:
      "«Übergeben»: the file went to the printshop. The delivery is immutable from then on and its copies count for the readers' quota. Irreversible.",
  })
  async deliverPrintIssueDelivery(
    @Args('id') id: string,
    @CurrentUser() session: UserSession
  ) {
    return toPrintIssueModel(await this.issues.deliver(id, session.user.id));
  }

  @Permissions(CanDeletePrintIssue)
  @Mutation(() => PrintIssueModel, {
    description: 'Delete a delivery that was not handed to the printshop yet.',
  })
  async deletePrintIssueDelivery(@Args('id') id: string) {
    return toPrintIssueModel(await this.issues.deleteDelivery(id));
  }

  @Permissions(CanFinalizePrintIssue)
  @Mutation(() => PrintIssueModel, {
    description:
      'Close the issue: no more Nachlieferungen expected. Every delivery must be handed over. Reversible.',
  })
  async closePrintIssue(
    @Args('id') id: string,
    @CurrentUser() session: UserSession
  ) {
    return toPrintIssueModel(await this.issues.close(id, session.user.id));
  }

  @Permissions(CanFinalizePrintIssue)
  @Mutation(() => PrintIssueModel, {
    description:
      'Reopen a closed issue so that more Nachlieferungen can follow.',
  })
  async reopenPrintIssue(@Args('id') id: string) {
    return toPrintIssueModel(await this.issues.reopen(id));
  }
}
