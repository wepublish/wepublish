import { BadRequestException, Injectable } from '@nestjs/common';
import { MailTemplate, PrismaClient } from '@prisma/client';
import { MailContext } from '@wepublish/mail/api';
import {
  MailTemplateCreateInput,
  MailTemplateUpdateInput,
} from './mail-template.model';

@Injectable()
export class MailTemplateService {
  constructor(
    private prismaService: PrismaClient,
    private mailContext: MailContext
  ) {}

  async create(input: MailTemplateCreateInput): Promise<MailTemplate> {
    const provider = await this.mailContext.mailProvider;

    const remoteTemplate = await provider.createTemplate({
      name: input.name,
      description: input.description,
      html: input.html,
      subject: input.subject,
    });

    return this.prismaService.mailTemplate.create({
      data: {
        name: input.name,
        description: input.description,
        externalMailTemplateId: remoteTemplate.uniqueIdentifier,
        remoteMissing: false,
      },
    });
  }

  async update(
    id: string,
    input: MailTemplateUpdateInput
  ): Promise<MailTemplate> {
    const template = await this.prismaService.mailTemplate.findUnique({
      where: { id },
    });

    if (!template) {
      throw new BadRequestException(`Mail template ${id} not found`);
    }

    const provider = await this.mailContext.mailProvider;

    await provider.updateTemplate(
      { externalMailTemplateId: template.externalMailTemplateId },
      {
        name: input.name,
        description: input.description,
        html: input.html,
        subject: input.subject,
      }
    );

    return this.prismaService.mailTemplate.update({
      where: { id },
      data: {
        name: input.name,
        description: input.description,
        remoteMissing: false,
      },
    });
  }

  async delete(id: string): Promise<MailTemplate> {
    const template = await this.prismaService.mailTemplate.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            subscriptionIntervals: true,
            userFlowMails: true,
            mailLog: true,
          },
        },
      },
    });

    if (!template) {
      throw new BadRequestException(`Mail template ${id} not found`);
    }

    if (
      template._count.subscriptionIntervals > 0 ||
      template._count.userFlowMails > 0
    ) {
      throw new BadRequestException(
        'This template is still assigned to a subscription flow or system mail. Please unassign it before deleting.'
      );
    }

    if (template._count.mailLog > 0) {
      throw new BadRequestException(
        'This template has already been used to send mails and cannot be deleted.'
      );
    }

    const provider = await this.mailContext.mailProvider;

    if (!template.remoteMissing) {
      await provider.deleteTemplate({
        externalMailTemplateId: template.externalMailTemplateId,
      });
    }

    return this.prismaService.mailTemplate.delete({
      where: { id },
    });
  }

  async getContent(template: { externalMailTemplateId: string }) {
    if (!template.externalMailTemplateId) {
      return { html: '' };
    }

    const provider = await this.mailContext.mailProvider;
    return provider.getTemplateContent({
      externalMailTemplateId: template.externalMailTemplateId,
    });
  }
}
