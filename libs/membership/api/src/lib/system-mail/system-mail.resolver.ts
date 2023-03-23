import {Args, Mutation, Query, Resolver} from '@nestjs/graphql'
import {PrismaService} from '@wepublish/api'
import {SystemMailModel, SystemMailUpdateInput} from './system-mail.model'

@Resolver(() => SystemMailModel)
export class SystemMailResolver {
  constructor(private prismaService: PrismaService) {}

  @Query(() => [SystemMailModel])
  async getSystemMails() {
    return this.prismaService.userFlowMail.findMany({
      include: {
        mailTemplate: true
      },
      orderBy: [{id: 'asc'}]
    })
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

    return this.prismaService.userFlowMail.findMany({
      include: {
        mailTemplate: true
      },
      orderBy: [{id: 'asc'}]
    })
  }
}
