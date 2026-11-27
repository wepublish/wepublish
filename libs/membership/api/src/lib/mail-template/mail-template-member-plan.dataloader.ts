import { Injectable, Scope } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { DataLoaderService } from '@wepublish/utils/api';

export type MailTemplateMemberPlan = { id: string; name: string };

/**
 * The member plans whose communication flow sends a template, for the
 * template table. Asked once per row, so it is one query for the whole list.
 * The default flow and the flows for all plans belong to no plan and add
 * nothing here.
 */
@Injectable({
  scope: Scope.REQUEST,
})
export class MailTemplateMemberPlanDataloader extends DataLoaderService<
  MailTemplateMemberPlan[]
> {
  constructor(private prisma: PrismaClient) {
    super();
  }

  protected async loadByKeys(templateIds: string[]) {
    const intervals = await this.prisma.subscriptionInterval.findMany({
      where: { mailTemplateId: { in: templateIds } },
      select: {
        mailTemplateId: true,
        subscriptionFlow: {
          select: { memberPlan: { select: { id: true, name: true } } },
        },
      },
    });

    const plans = new Map<string, Map<string, MailTemplateMemberPlan>>();

    for (const { mailTemplateId, subscriptionFlow } of intervals) {
      const plan = subscriptionFlow.memberPlan;

      if (!mailTemplateId || !plan) {
        continue;
      }

      const ofTemplate = plans.get(mailTemplateId) ?? new Map();
      ofTemplate.set(plan.id, plan);
      plans.set(mailTemplateId, ofTemplate);
    }

    return templateIds.map(id =>
      [...(plans.get(id)?.values() ?? [])].sort((a, b) =>
        a.name.localeCompare(b.name)
      )
    );
  }
}
