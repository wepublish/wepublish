import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { PrismaClient } from '@prisma/client';
import { LetterContext } from '@wepublish/letter/api';
import {
  CanCreateMailTemplates,
  CanDeleteMailTemplates,
  CanGetMailTemplates,
  CanUpdateMailTemplates,
} from '@wepublish/permissions';
import { Permissions } from '@wepublish/permissions/api';
import {
  LetterProviderModel,
  LetterTemplateInput,
  LetterTemplateModel,
  LetterTemplatePreviewInput,
  LetterTemplatePreviewModel,
} from './letter-template.model';
import { LetterTemplateService } from './letter-template.service';

@Resolver(() => LetterTemplateModel)
export class LetterTemplatesResolver {
  constructor(
    private prismaService: PrismaClient,
    private letterContext: LetterContext,
    private letterTemplateService: LetterTemplateService
  ) {}

  @Permissions(CanGetMailTemplates)
  @Query(() => [LetterTemplateModel], {
    description: `Return all letter templates`,
  })
  async letterTemplates() {
    return this.prismaService.letterTemplate.findMany({
      orderBy: [{ name: 'asc' }],
    });
  }

  @Permissions(CanGetMailTemplates)
  @Query(() => LetterTemplateModel, {
    nullable: true,
    description: `Return a single letter template, including its html body.`,
  })
  async letterTemplate(@Args('id') id: string) {
    return this.prismaService.letterTemplate.findUnique({ where: { id } });
  }

  @Permissions(CanGetMailTemplates)
  @Query(() => LetterProviderModel)
  async letterProvider() {
    return { name: await this.letterContext.letterProvider.getName() };
  }

  @Permissions(CanGetMailTemplates)
  @Query(() => LetterTemplatePreviewModel, {
    description: `Render a letter as it would be printed, without sending it.`,
  })
  async previewLetter(
    @Args('input') input: LetterTemplatePreviewInput
  ): Promise<LetterTemplatePreviewModel> {
    return this.letterTemplateService.preview(input);
  }

  @Permissions(CanCreateMailTemplates)
  @Mutation(() => LetterTemplateModel)
  async createLetterTemplate(@Args('input') input: LetterTemplateInput) {
    return this.letterTemplateService.create(input);
  }

  @Permissions(CanUpdateMailTemplates)
  @Mutation(() => LetterTemplateModel)
  async updateLetterTemplate(
    @Args('id') id: string,
    @Args('input') input: LetterTemplateInput
  ) {
    return this.letterTemplateService.update(id, input);
  }

  @Permissions(CanDeleteMailTemplates)
  @Mutation(() => LetterTemplateModel)
  async deleteLetterTemplate(@Args('id') id: string) {
    return this.letterTemplateService.delete(id);
  }
}
