import { Injectable, Scope } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { DataLoaderService } from '@wepublish/utils/api';

/**
 * The names of the documents attached to a template, in their order, for the
 * template table. Asked once per row, so it is one query for the whole list.
 */
@Injectable({
  scope: Scope.REQUEST,
})
export class MailTemplateAttachmentNameDataloader extends DataLoaderService<
  string[]
> {
  constructor(private prisma: PrismaClient) {
    super();
  }

  protected async loadByKeys(templateIds: string[]) {
    const attachments = await this.prisma.mailTemplateAttachment.findMany({
      where: { mailTemplateId: { in: templateIds } },
      orderBy: { position: 'asc' },
      select: {
        mailTemplateId: true,
        document: { select: { title: true, filename: true } },
      },
    });

    return templateIds.map(id =>
      attachments
        .filter(attachment => attachment.mailTemplateId === id)
        .map(({ document }) => document.title || document.filename || '')
    );
  }
}
