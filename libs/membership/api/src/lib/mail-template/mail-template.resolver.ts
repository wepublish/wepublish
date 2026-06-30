import {
  Args,
  Mutation,
  Parent,
  Query,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';
import { MailContext, MailTemplateStatus } from '@wepublish/mail/api';
import {
  CanGetMailTemplates,
  CanUpdateMailTemplates,
} from '@wepublish/permissions';
import {
  MailProviderModel,
  MailTemplateInput,
  MailTemplateModel,
} from './mail-template.model';
import { PrismaClient } from '@prisma/client';
import { Permissions } from '@wepublish/permissions/api';

@Resolver(() => MailTemplateModel)
export class MailTemplatesResolver {
  constructor(
    private prismaService: PrismaClient,
    private mailContext: MailContext
  ) {}

  @Permissions(CanGetMailTemplates)
  @Query(() => [MailTemplateModel], {
    description: `Return all mail templates`,
  })
  async mailTemplates() {
    return this.prismaService.mailTemplate.findMany({
      orderBy: [{ name: 'asc' }],
    });
  }

  @Permissions(CanGetMailTemplates)
  @Query(() => MailProviderModel)
  async provider() {
    const provider = await this.mailContext.mailProvider;
    return { name: provider.getName() };
  }

  @Permissions(CanUpdateMailTemplates)
  @Mutation(() => MailTemplateModel, {
    description: `Create a new mail template`,
  })
  async createMailTemplate(@Args('input') input: MailTemplateInput) {
    return this.prismaService.mailTemplate.create({
      data: input,
    });
  }

  @Permissions(CanUpdateMailTemplates)
  @Mutation(() => MailTemplateModel, {
    description: `Update an existing mail template`,
  })
  async updateMailTemplate(
    @Args('id') id: string,
    @Args('input') input: MailTemplateInput
  ) {
    return this.prismaService.mailTemplate.update({
      where: { id },
      data: input,
    });
  }

  @Permissions(CanUpdateMailTemplates)
  @Mutation(() => Boolean, {
    nullable: true,
    description: `Delete an existing mail template`,
  })
  async deleteMailTemplate(@Args('id') id: string) {
    await this.prismaService.mailTemplate.delete({
      where: { id },
    });
  }

  @ResolveField('status', () => MailTemplateStatus, {
    description: 'Status of the template',
  })
  async status(
    @Parent() template: MailTemplateModel
  ): Promise<MailTemplateStatus> {
    const usedTemplates = await this.mailContext.getUsedTemplateIdentifiers();

    if (!usedTemplates.includes(template.id)) {
      return MailTemplateStatus.Unused;
    }

    return MailTemplateStatus.Ok;
  }
}
