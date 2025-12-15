import {
  Args,
  Mutation,
  Parent,
  Query,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';
import { Public } from '@wepublish/authentication/api';
import { TagService } from './tag.service';
import { URLAdapter } from '@wepublish/nest-modules';
import { Tag as PTag } from '@prisma/client';
import {
  CreateTagInput,
  Tag,
  PaginatedTags,
  TagListArgs,
  UpdateTagInput,
} from './tag.model';
import {
  CanCreateTag,
  CanDeleteTag,
  CanUpdateTag,
} from '@wepublish/permissions';
import { Permissions } from '@wepublish/permissions/api';
import { TagDataloader } from './tag.dataloader';

@Resolver(() => Tag)
export class TagResolver {
  constructor(
    private tagService: TagService,
    private dataloader: TagDataloader,
    private urlAdapter: URLAdapter
  ) {}

  @Public()
  @Query(() => Tag, {
    description: 'Returns a tag by id',
  })
  async tag(@Args('id') id: string) {
    return this.dataloader.load(id);
  }

  @Public()
  @Query(() => PaginatedTags, {
    description: 'This query returns a list of tags',
  })
  async tags(@Args() args: TagListArgs) {
    return this.tagService.getTags(args);
  }

  @Permissions(CanCreateTag)
  @Mutation(returns => Tag, { description: `Creates a new tag.` })
  public createTag(@Args() tag: CreateTagInput) {
    return this.tagService.createTag(tag);
  }

  @Permissions(CanUpdateTag)
  @Mutation(returns => Tag, { description: `Updates an existing tag.` })
  public updateTag(@Args() tag: UpdateTagInput) {
    return this.tagService.updateTag(tag);
  }

  @Permissions(CanDeleteTag)
  @Mutation(returns => Tag, { description: `Deletes an existing tag.` })
  public deleteTag(@Args('id') id: string) {
    return this.tagService.deleteTag(id);
  }

  @ResolveField(() => String)
  async url(@Parent() parent: PTag) {
    return this.urlAdapter.getTagURL(parent);
  }
}
