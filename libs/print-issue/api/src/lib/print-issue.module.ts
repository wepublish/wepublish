import { Module } from '@nestjs/common';
import { PrismaModule } from '@wepublish/nest-modules';
import { PaymentsModule } from '@wepublish/payment/api';
import { BexioPrintSourceService } from './bexio/bexio-print-source.service';
import { PrintIssueExportService } from './print-issue-export.service';
import { PrintIssueStartResolver } from './print-issue-start.resolver';
import { PrintIssueStartService } from './print-issue-start.service';
import { PrintIssueResolver } from './print-issue.resolver';
import {
  SubscriptionPrintIssueProgressDataloader,
  UserPrintIssueProgressDataloader,
} from './progress/progress.dataloader';
import {
  SubscriptionPrintIssueProgressResolver,
  UserPrintIssueProgressResolver,
} from './progress/progress.resolver';
import { PrintIssueProgressService } from './progress/progress.service';
import { PrintIssueUserListOrderModule } from './progress/user-list-order';
import { PrintIssueService } from './print-issue.service';

@Module({
  imports: [PrismaModule, PaymentsModule, PrintIssueUserListOrderModule],
  providers: [
    BexioPrintSourceService,
    PrintIssueExportService,
    PrintIssueService,
    PrintIssueResolver,
    PrintIssueProgressService,
    UserPrintIssueProgressDataloader,
    SubscriptionPrintIssueProgressDataloader,
    UserPrintIssueProgressResolver,
    SubscriptionPrintIssueProgressResolver,
    PrintIssueStartService,
    PrintIssueStartResolver,
  ],
  exports: [PrintIssueService, PrintIssueProgressService],
})
export class PrintIssueModule {}
