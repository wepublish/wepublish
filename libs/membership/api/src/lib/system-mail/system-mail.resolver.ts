import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import {
  MailChannel,
  PrismaClient,
  UserEvent,
  UserFlowMail,
} from '@prisma/client';
import { SystemMailModel, SystemMailUpdateInput } from './system-mail.model';
import {
  findTemplateVariant,
  MailContext,
  mailLogType,
} from '@wepublish/mail/api';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import {
  AuthSession,
  CurrentUser,
  requireSessionUser,
} from '@wepublish/authentication/api';
import {
  CanGetSystemMails,
  CanTestSystemMails,
  CanUpdateSystemMails,
} from '@wepublish/permissions';
import { Permissions } from '@wepublish/permissions/api';

@Resolver(() => SystemMailModel)
export class SystemMailResolver {
  constructor(
    private prismaService: PrismaClient,
    private mailContext: MailContext
  ) {}

  @Permissions(CanGetSystemMails)
  @Query(() => [SystemMailModel], { description: `Returns all mail flows` })
  async systemMails() {
    return this.getAllMails();
  }

  @Permissions(CanUpdateSystemMails)
  @Mutation(() => [SystemMailModel], {
    description: `Updates an existing mail flow`,
  })
  async updateSystemMail(@Args() systemMail: SystemMailUpdateInput) {
    const userMail = await this.prismaService.userFlowMail.findUnique({
      where: {
        event: systemMail.event,
      },
    });

    if (!userMail) {
      throw new NotFoundException(
        'There is no userflow present in the database.'
      );
    }

    // A login link or a password reset only ever goes out as an email.
    if (
      systemMail.mailTemplateId &&
      !(await findTemplateVariant(
        this.prismaService,
        systemMail.mailTemplateId,
        MailChannel.mail
      ))
    ) {
      throw new BadRequestException(
        'This template has no email version. A system mail is always an email.'
      );
    }

    // System mails go out while someone waits for them (a login link, a
    // password reset), so they never carry attachments; see MailController.
    if (
      systemMail.mailTemplateId &&
      (await this.prismaService.mailTemplateAttachment.count({
        where: { mailTemplateId: systemMail.mailTemplateId },
      }))
    ) {
      throw new BadRequestException(
        'This template has attachments, which a system mail cannot carry. Remove them from the template or choose another one.'
      );
    }

    await this.prismaService.userFlowMail.update({
      where: {
        id: userMail.id,
      },
      data: {
        mailTemplate:
          systemMail.mailTemplateId ?
            { connect: { id: systemMail.mailTemplateId } }
          : { disconnect: true },
      },
    });

    return this.getAllMails();
  }

  @Permissions(CanTestSystemMails)
  @Mutation(() => Boolean, {
    description: `Sends a test email for the given event`,
  })
  async testSystemMail(
    @CurrentUser() session: AuthSession,
    @Args('event', { type: () => UserEvent }) event: UserEvent
  ) {
    const recipient = requireSessionUser(session);
    const mailTemplateId = await this.mailContext.getUserTemplateId(event);

    await this.mailContext.sendMail({
      mailType: mailLogType.SystemMail,
      recipient,
      optionalData: {},
      mailTemplateId: mailTemplateId || '',
    });

    return true;
  }

  private async getAllMails(): Promise<UserFlowMail[]> {
    return this.prismaService.userFlowMail.findMany({
      include: {
        mailTemplate: true,
      },
    });
  }
}
