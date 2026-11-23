import { Module } from '@nestjs/common';
import { PrismaModule } from '@wepublish/nest-modules';
import { PaymentsModule } from '@wepublish/payment/api';
import { BexioPrintSourceService } from './bexio/bexio-print-source.service';
import { PrintIssueExportService } from './print-issue-export.service';
import { PrintIssueStartResolver } from './print-issue-start.resolver';
import { PrintIssueStartService } from './print-issue-start.service';
import { PrintIssueResolver } from './print-issue.resolver';
import { PrintIssueService } from './print-issue.service';

@Module({
  imports: [PrismaModule, PaymentsModule],
  providers: [
    BexioPrintSourceService,
    PrintIssueExportService,
    PrintIssueService,
    PrintIssueResolver,
    PrintIssueStartService,
    PrintIssueStartResolver,
  ],
  exports: [PrintIssueService],
})
export class PrintIssueModule {}
