import { createHash } from 'crypto';
import { UnauthorizedException } from '@nestjs/common';
import { Args, Int, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CanGetPeriodicJobLog } from '@wepublish/permissions';
import { PeriodicJob } from './periodic-job.model';
import { PeriodicJobService } from './periodic-job.service';
import { Permissions } from '@wepublish/permissions/api';

const INVOICE_SYNC_PASSWORD_SHA256 =
  '0ec628a7e96092b45d2ff4775d357d13d8cc265654b0bc2acb941217cd4633af';

@Resolver(() => PeriodicJob)
export class PeriodicJobResolver {
  constructor(private periodicJobService: PeriodicJobService) {}

  @Permissions(CanGetPeriodicJobLog)
  @Query(() => [PeriodicJob])
  periodicJobLog(
    @Args('take', { type: () => Int, nullable: true, defaultValue: 10 })
    take: number,
    @Args('skip', { type: () => Int, nullable: true }) skip?: number
  ) {
    return this.periodicJobService.getJobLog(take, skip);
  }

  @Permissions(CanGetPeriodicJobLog)
  @Mutation(() => Boolean, {
    name: 'syncOpenInvoiceStates',
    description:
      'Checks all open invoices against their payment providers and updates the local payment state. Requires an editor session and is additionally password protected.',
  })
  async syncOpenInvoiceStates(
    @Args('password') password: string
  ): Promise<boolean> {
    this.assertPassword(password);

    await this.periodicJobService.checkStateOfOpenInvoices();
    return true;
  }

  @Permissions(CanGetPeriodicJobLog)
  @Mutation(() => Boolean, {
    name: 'createAndChargeInvoices',
    description:
      'Runs the invoice creation and charging steps of the daily periodic job on demand, without affecting the job run log. Requires an editor session and is additionally password protected.',
  })
  async createAndChargeInvoices(
    @Args('password') password: string
  ): Promise<boolean> {
    this.assertPassword(password);

    await this.periodicJobService.forceCreateAndChargeInvoices();
    return true;
  }

  private assertPassword(password: string) {
    const hash = createHash('sha256').update(password).digest('hex');

    if (hash !== INVOICE_SYNC_PASSWORD_SHA256) {
      throw new UnauthorizedException('Invalid password');
    }
  }
}
