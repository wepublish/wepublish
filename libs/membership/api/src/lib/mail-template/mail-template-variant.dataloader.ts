import { Injectable, Scope } from '@nestjs/common';
import { MailChannel, MailTemplateVariant, PrismaClient } from '@prisma/client';
import { DataLoaderService } from '@wepublish/utils/api';
import { groupBy } from 'ramda';

/** The email first: it is the version every template had before letters. */
const CHANNEL_ORDER = Object.values(MailChannel);

const byChannel = <T extends { channel: MailChannel }>(variants: T[] = []) =>
  [...variants].sort(
    (a, b) =>
      CHANNEL_ORDER.indexOf(a.channel) - CHANNEL_ORDER.indexOf(b.channel)
  );

export type MailTemplateVariantSummary = Pick<
  MailTemplateVariant,
  'templateId' | 'channel' | 'subject'
>;

/**
 * Which channels each template is written for, and under which subject. Lists
 * and pickers ask this once per row, so it is batched and leaves the bodies —
 * whole emails — in the database.
 */
@Injectable({
  scope: Scope.REQUEST,
})
export class MailTemplateVariantSummaryDataloader extends DataLoaderService<
  MailTemplateVariantSummary[]
> {
  constructor(private prisma: PrismaClient) {
    super();
  }

  protected async loadByKeys(templateIds: string[]) {
    const variants = groupBy(
      variant => variant.templateId,
      await this.prisma.mailTemplateVariant.findMany({
        where: { templateId: { in: templateIds } },
        select: { templateId: true, channel: true, subject: true },
      })
    );

    return templateIds.map(id => byChannel(variants[id]));
  }
}

/** Every version of a template in full, for the view that edits them. */
@Injectable({
  scope: Scope.REQUEST,
})
export class MailTemplateVariantDataloader extends DataLoaderService<
  MailTemplateVariant[]
> {
  constructor(private prisma: PrismaClient) {
    super();
  }

  protected async loadByKeys(templateIds: string[]) {
    const variants = groupBy(
      variant => variant.templateId,
      await this.prisma.mailTemplateVariant.findMany({
        where: { templateId: { in: templateIds } },
      })
    );

    return templateIds.map(id => byChannel(variants[id]));
  }
}
