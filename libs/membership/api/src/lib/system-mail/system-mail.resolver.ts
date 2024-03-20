import {Args, Mutation, Query, Resolver} from '@nestjs/graphql'
import {PrismaClient, User, UserEvent, UserFlowMail} from '@prisma/client'
import {CurrentUser} from '../user.decorator'
import {SystemMailModel, SystemMailUpdateInput} from './system-mail.model'
import {MailContext, mailLogType} from '@wepublish/mail/api'
import {NotFoundException} from '@nestjs/common'

@Resolver(() => SystemMailModel)
export class SystemMailResolver {
  constructor(private prismaService: PrismaClient, private readonly mailContext: MailContext) {}

  @Query(() => [SystemMailModel], {description: `Returns all mail flows`})
  async systemMails() {
    return this.getAllMails()
  }

  @Mutation(() => [SystemMailModel], {description: `Updates an existing mail flow`})
  async updateSystemMail(@Args() systemMail: SystemMailUpdateInput) {
    const userMail = await this.prismaService.userFlowMail.findUnique({
      where: {
        event: systemMail.event
      }
    })

    if (!userMail) {
      throw new NotFoundException('There is no userflow present in the database.')
    }

    await this.prismaService.userFlowMail.update({
      where: {
        id: userMail.id
      },
      data: {
        mailTemplate: {connect: {id: systemMail.mailTemplateId}}
      }
    })

    return this.getAllMails()
  }

  @Mutation(() => Boolean, {
    description: `Sends a test email for the given event`
  })
  async testSystemMail(
    @CurrentUser() user: User,
    @Args('event', {type: () => UserEvent}) event: UserEvent
  ) {
    const externalMailTemplateId = await this.mailContext.getUserTemplateName(event)

    await this.mailContext.sendMail({
      mailType: mailLogType.SystemMail,
      recipient: user,
      optionalData: {},
      externalMailTemplateId: externalMailTemplateId || ''
    })

    return true
  }

  private async getAllMails(): Promise<UserFlowMail[]> {
    return this.prismaService.userFlowMail.findMany({
      include: {
        mailTemplate: true
      }
    })
  }
}
