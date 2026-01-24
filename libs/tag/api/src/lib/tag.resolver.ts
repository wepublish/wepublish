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
import { Tag as PTag, TagType } from '@prisma/client';
import {
  CreateTagInput,
  Tag,
  TagConnection,
  TagsArgs,
  UpdateTagInput,
} from './tag.model';
import {
  CanCreateTag,
  CanDeleteTag,
  CanUpdateTag,
} from '@wepublish/permissions';
import { Permissions } from '@wepublish/permissions/api';
import { TagDataloader } from './tag.dataloader';
import { BadRequestException, NotFoundException } from '@nestjs/common';

@Resolver(() => Tag)
export class TagResolver {
  constructor(
    private tagService: TagService,
    private dataloader: TagDataloader,
    private urlAdapter: URLAdapter
  ) {}

  @Public()
  @Query(() => Tag, { description: `Returns an tag by id or tag.` })
  public async tag(
    @Args('id', { nullable: true }) id?: string,
    @Args('tag', { nullable: true }) name?: string,
    @Args('type', { nullable: true }) tagType?: TagType
  ) {
    if (id != null) {
      const tag = await this.dataloader.load(id);

      if (!tag) {
        throw new NotFoundException(`Tag with id ${id} was not found.`);
      }

      return tag;
    }

    if (name != null) {
      if (tagType == null) {
        throw new BadRequestException(
          'Type required when loading tag by name.'
        );
      }

      const tag = await this.tagService.getTagByName(name, tagType);

      if (!tag) {
        throw new NotFoundException(`Tag ${tag} was not found.`);
      }

      return tag;
    }

    throw new BadRequestException('Tag id or tag required.');
  }

  @Public()
  @Query(() => TagConnection, {
    description: 'This query returns a list of tags',
  })
  async tags(@Args() args: TagsArgs) {
    const { filter, sort, order, cursor, take, skip } = args;
    return this.tagService.getTags(filter, sort, order, cursor, skip, take);
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
