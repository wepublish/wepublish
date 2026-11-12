import { Test } from '@nestjs/testing';
import { PrismaClient } from '@prisma/client';
import { FeaturesService } from '@wepublish/features/api';
import { PaymentsService } from '@wepublish/payment/api';
import { BexioPrintSourceService } from './bexio/bexio-print-source.service';
import { PrintIssueExportService } from './print-issue-export.service';
import { PrintIssueResolver } from './print-issue.resolver';
import { PrintIssueService } from './print-issue.service';

// Pins the constructor wiring: a `type` import of an injected class leaves Nest
// with `Object` as the dependency, which otherwise only the booting API reveals.
describe('print issue providers', () => {
  it('resolve their dependencies', async () => {
    const module = await Test.createTestingModule({
      providers: [
        PrintIssueService,
        PrintIssueExportService,
        BexioPrintSourceService,
        PrintIssueResolver,
        { provide: PrismaClient, useValue: {} },
        { provide: PaymentsService, useValue: { getProviders: () => [] } },
        // the resolver's @Feature gate pulls the guard in
        { provide: FeaturesService, useValue: {} },
      ],
    }).compile();

    expect(module.get(PrintIssueService)).toBeInstanceOf(PrintIssueService);
    expect(module.get(PrintIssueExportService)).toBeInstanceOf(
      PrintIssueExportService
    );
    expect(module.get(BexioPrintSourceService)).toBeInstanceOf(
      BexioPrintSourceService
    );
    expect(module.get(PrintIssueResolver)).toBeInstanceOf(PrintIssueResolver);
  });
});
