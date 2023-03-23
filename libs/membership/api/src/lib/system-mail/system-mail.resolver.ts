import {Args, Mutation, Query, Resolver} from '@nestjs/graphql'
import {PrismaService} from '@wepublish/api'
import {SystemMailModel, SystemMailUpdateInput} from './system-mail.model'

@Resolver(() => SystemMailModel)
export class SystemMailResolver {
  constructor(private prismaService: PrismaService) {}

  @Query(() => [SystemMailModel])
  async getSystemMails() {
    return this.allSystemMails()
  }

  @Mutation(() => [SystemMailModel])
  async updateSystemMail(@Args('systemMail') systemMail: SystemMailUpdateInput) {
    return this.allSystemMails()
  }

  private async allSystemMails() {
    return [
      {
        event: 'bla',
        mailTemplate: {
          name: 'x',
          id: 3
        }
      }
    ]
  }
}
