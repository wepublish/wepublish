import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { FeaturesService } from '@wepublish/features/api';
import { readIssueNumbering } from './numbering-setting';
import { dbDateToYmd, todayZurich, ymdToDbDate } from './rules/dates';
import { issueLabel } from './rules/issue';

/** An issue as a reader sees it when choosing where the subscription starts. */
export type PublicPrintIssueView = {
  id: string;
  /** as the medium writes it: «6.26», «#117» */
  label: string;
  title: string | null;
  /** the ship day, YYYY-MM-DD */
  issueDate: string;
};

export type PrintIssueStartView = {
  current: PublicPrintIssueView;
  upcoming: PublicPrintIssueView | null;
};

const SELECT = {
  id: true,
  number: true,
  numberTo: true,
  year: true,
  title: true,
  issueDate: true,
} as const;

/**
 * «Abo-Start»: the issues a new subscriber chooses from. Dates decide: the
 * current issue shipped today at the latest, whatever its status; the
 * upcoming one ships later and exists only once staff created it.
 */
@Injectable()
export class PrintIssueStartService {
  constructor(
    private prisma: PrismaClient,
    private features: FeaturesService
  ) {}

  async start(today = todayZurich()): Promise<PrintIssueStartView | null> {
    if (!(await this.features.isEnabled('print-export'))) {
      return null;
    }

    const day = ymdToDbDate(today);
    const [current, upcoming, numbering] = await Promise.all([
      this.prisma.printIssue.findFirst({
        where: { issueDate: { lte: day } },
        orderBy: [{ issueDate: 'desc' }, { number: 'desc' }],
        select: SELECT,
      }),
      this.prisma.printIssue.findFirst({
        where: { issueDate: { gt: day } },
        orderBy: [{ issueDate: 'asc' }, { number: 'asc' }],
        select: SELECT,
      }),
      readIssueNumbering(this.prisma),
    ]);

    if (!current) {
      return null;
    }

    const view = (issue: NonNullable<typeof current>) => ({
      id: issue.id,
      label: issueLabel(issue, numbering),
      title: issue.title ?? null,
      issueDate: dbDateToYmd(issue.issueDate),
    });

    return {
      current: view(current),
      upcoming: upcoming ? view(upcoming) : null,
    };
  }
}
