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
import {
  limitAnswerCache,
  skipAnswerCache,
} from '@wepublish/public-content-cache/api';
import {
  ApiBlock,
  PuckBlock,
  PuckRegistry,
  readStoredPuckBlocks,
  readStoredPuckRegistry,
} from '@wepublish/puck-content/api';
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
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { BlockContent } from '../block-content.model';
import { BlockTreeLoader } from '../block-tree/block-tree-loader';
import { PuckBlockDataLoader } from '../puck/puck-block-data.loader';
import {
  displayedPuckBlocks,
  nextPuckBlocksTimingChange,
} from '../timing/puck-timing';

const SEES_HIDDEN_BLOCKS = [
  CanCreateBlockTemplate,
  CanUpdateBlockTemplate,
  CanGetArticle,
  CanGetPage,
];

const seesHiddenBlocks = (user: UserSession | undefined) => {
  const permissions = permissionsOf(user);

  return SEES_HIDDEN_BLOCKS.some(permission =>
    hasPermission(permission, permissions)
  );
};

@Resolver(() => BlockTemplate)
export class BlockTemplateResolver {
  private readonly logger = new Logger(BlockTemplateResolver.name);

  constructor(
    private blockTemplateService: BlockTemplateService,
    private blockTemplateDataLoader: BlockTemplateDataloaderService,
    @Inject(forwardRef(() => BlockTreeLoader))
    private blockTreeLoader: BlockTreeLoader,
    @Inject(forwardRef(() => PuckBlockDataLoader))
    private puckBlockData: PuckBlockDataLoader
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

    return this.blockTreeLoader.loadTemplateBlocks(template, {
      onlyDisplayed: onlyDisplayed || !seesHiddenBlocks(user),
    });
  }

  @ResolveField(() => [String], {
    description:
      'The ids of every block template this template links, directly or through other linked templates. A template must not be linked into any of them.',
  })
  public linkedTemplateIds(@Parent() template: BlockTemplate) {
    return this.blockTemplateService.linkedTemplateIds(template);
  }

  @ResolveField(() => [PuckBlock], { nullable: true })
  public puckBlocks(
    @Parent() template: BlockTemplate,
    @Args('onlyDisplayed', {
      type: () => Boolean,
      defaultValue: true,
      description:
        'Omits blocks that are hidden or outside their timing, together with their children. Pass `false` to edit the template, which only users who can edit block templates, articles or pages may do.',
    })
    onlyDisplayed: boolean,
    @Context() context: object,
    @CurrentUser() user: UserSession | undefined
  ) {
    if (!onlyDisplayed) {
      skipAnswerCache(context);
    }

    const puckBlocks = this.readPuckBlocks(template);

    if (!puckBlocks) {
      return null;
    }

    const { now } = this.blockTreeLoader;
    const changeAt = nextPuckBlocksTimingChange(puckBlocks, now);

    if (changeAt) {
      limitAnswerCache(context, changeAt);
    }

    const pruned = onlyDisplayed || !seesHiddenBlocks(user);

    return this.puckBlockData.flatten(
      pruned ? displayedPuckBlocks(puckBlocks, now) : puckBlocks,
      { pruned, now, preview: false }
    );
  }

  @ResolveField(() => PuckRegistry, { nullable: true })
  public puckRegistry(@Parent() { id, puckRegistry }: BlockTemplate) {
    if (puckRegistry == null) {
      return null;
    }

    const stored = readStoredPuckRegistry(puckRegistry);

    if (!stored) {
      this.logger.warn(
        `Block template ${id} has a Puck registry that does not parse, reading it as null.`
      );
    }

    return stored;
  }

  private readPuckBlocks({ id, puckBlocks }: BlockTemplate): ApiBlock[] | null {
    if (puckBlocks == null) {
      return null;
    }

    const stored = readStoredPuckBlocks(puckBlocks);

    if (!stored) {
      this.logger.warn(
        `Block template ${id} has Puck blocks that do not parse, reading them as null.`
      );
    }

    return stored;
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
