import {
  Args,
  Context,
  Mutation,
  Parent,
  Query,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';
import {
  CanCreateBlockTemplate,
  CanDeleteBlockTemplate,
  CanGetArticle,
  CanGetPage,
  CanUpdateBlockTemplate,
} from '@wepublish/permissions';
import {
  hasPermission,
  permissionsOf,
  Permissions,
} from '@wepublish/permissions/api';
import {
  CurrentUser,
  Public,
  UserSession,
} from '@wepublish/authentication/api';
import { skipAnswerCache } from '@wepublish/kv-ttl-cache/api';
import { BlockTemplateDataloaderService } from './block-template-dataloader.service';
import {
  BlockTemplate,
  BlockTemplateBlock,
  BlockTemplateListArgs,
  CreateBlockTemplateInput,
  PaginatedBlockTemplate,
  UpdateBlockTemplateInput,
} from './block-template.model';
import { BlockTemplateService } from './block-template.service';
import {
  BadRequestException,
  forwardRef,
  Inject,
  NotFoundException,
} from '@nestjs/common';
import { BlockContent } from '../block-content.model';
import { BlockTreeLoader } from '../block-tree/block-tree-loader';

const SEES_HIDDEN_BLOCKS = [
  CanCreateBlockTemplate,
  CanUpdateBlockTemplate,
  CanGetArticle,
  CanGetPage,
];

@Resolver(() => BlockTemplate)
export class BlockTemplateResolver {
  constructor(
    private blockTemplateService: BlockTemplateService,
    private blockTemplateDataLoader: BlockTemplateDataloaderService,
    @Inject(forwardRef(() => BlockTreeLoader))
    private blockTreeLoader: BlockTreeLoader
  ) {}

  @Public()
  @Query(returns => PaginatedBlockTemplate, {
    description: `Returns a paginated list of block templates.`,
  })
  public blockTemplates(@Args() args: BlockTemplateListArgs) {
    return this.blockTemplateService.getBlockTemplates(args);
  }

  @Public()
  @Query(returns => BlockTemplate, {
    description: `Returns a single block template by ID.`,
  })
  public async blockTemplate(@Args('id') id?: string) {
    if (id == null) {
      throw new BadRequestException(`Block template ID required`);
    }
    const template = await this.blockTemplateDataLoader.load(id);

    if (!template) {
      throw new NotFoundException(`Block template with ID ${id} not found`);
    }
    return template;
  }

  @Permissions(CanCreateBlockTemplate)
  @Mutation(returns => BlockTemplate, {
    description: `Creates a new block template.`,
  })
  public createBlockTemplate(@Args() blockTemplate: CreateBlockTemplateInput) {
    return this.blockTemplateService.createBlockTemplate(blockTemplate);
  }

  @Permissions(CanUpdateBlockTemplate)
  @Mutation(returns => BlockTemplate, {
    description: `Updates an existing block template.`,
  })
  public updateBlockTemplate(@Args() blockTemplate: UpdateBlockTemplateInput) {
    return this.blockTemplateService.updateBlockTemplate(blockTemplate);
  }

  @Permissions(CanDeleteBlockTemplate)
  @Mutation(returns => BlockTemplate, {
    description: `Deletes an existing block template.`,
  })
  public deleteBlockTemplate(@Args('id') id: string) {
    return this.blockTemplateService.deleteBlockTemplate(id);
  }

  @ResolveField(() => [BlockContent])
  public async blocks(
    @Parent() template: BlockTemplate,
    @Args('onlyDisplayed', {
      type: () => Boolean,
      defaultValue: true,
      description:
        'Omits blocks that are hidden or outside their timing. Pass `false` to edit the template, which only users who can edit block templates, articles or pages may do.',
    })
    onlyDisplayed: boolean,
    @Context() context: object,
    @CurrentUser() user: UserSession | undefined
  ) {
    if (!onlyDisplayed) {
      skipAnswerCache(context);
    }

    const permissions = permissionsOf(user);

    return this.blockTreeLoader.loadTemplateBlocks(template, {
      onlyDisplayed:
        onlyDisplayed ||
        !SEES_HIDDEN_BLOCKS.some(permission =>
          hasPermission(permission, permissions)
        ),
    });
  }
}

@Resolver(() => BlockTemplateBlock)
export class BlockTemplateBlockResolver {
  constructor(private blockTemplates: BlockTemplateDataloaderService) {}

  @ResolveField(() => BlockTemplate, { nullable: true })
  public template(@Parent() block: BlockTemplateBlock) {
    if (block.template !== undefined) {
      return block.template;
    }

    return this.blockTemplates.load(block.templateId);
  }
}
