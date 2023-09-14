import {Args, Mutation, Query, Resolver} from '@nestjs/graphql'
import {User, UserFlowMail} from '@prisma/client'
import {PrismaService} from '@wepublish/nest-modules'
import {CurrentUser} from '../user.decorator'
import {SystemMailModel, SystemMailTestInput, SystemMailUpdateInput} from './system-mail.model'
import {MailContext, mailLogType} from '@wepublish/mails'

@Resolver(() => SystemMailModel)
export class SystemMailResolver {
  constructor(private prismaService: PrismaService, private readonly mailContext: MailContext) {}

  @Query(() => [SystemMailModel])
  async getSystemMails() {
    return this.getAllMails()
  }

  @Mutation(() => [SystemMailModel])
  async updateSystemMail(@Args('systemMail') systemMail: SystemMailUpdateInput) {
    const userMail = await this.prismaService.userFlowMail.findUnique({
      where: {
        event: systemMail.event
      }
    })

    if (!userMail) {
      throw new Error('There is no userflow present in the database.')
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

  @Mutation(() => [SystemMailModel])
  async testSystemMail(
    @CurrentUser() user: User,
    @Args('systemMail') systemMail: SystemMailTestInput
  ) {
    const externalMailTemplateId = await this.mailContext.getUserTemplateName(systemMail.event)

    await this.mailContext.sendMail({
      mailType: mailLogType.SystemMail,
      recipient: user,
      optionalData: {},
      externalMailTemplateId: externalMailTemplateId || ''
    })

    return this.getAllMails()
  }

  private async getAllMails(): Promise<UserFlowMail[]> {
    return this.prismaService.userFlowMail.findMany({
      include: {
        mailTemplate: true
      },
      orderBy: [{id: 'asc'}]
    })
  }
}
