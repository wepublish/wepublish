import {Args, Parent, Query, ResolveField, Resolver} from '@nestjs/graphql'
import {Public} from '@wepublish/authentication/api'
import {TagConnection, TagsArgs} from './tags.query'
import {TagService} from './tag.service'
import {URLAdapter} from '@wepublish/nest-modules'
import {Tag as PTag} from '@prisma/client'
import {Tag} from './tag.model'

@Resolver(() => Tag)
export class TagResolver {
  constructor(private tagService: TagService, private urlAdapter: URLAdapter) {}

  @Public()
  @Query(() => TagConnection, {
    description: 'This query returns a list of tags',
    nullable: true
  })
  async tags(@Args() args: TagsArgs) {
    const {filter, sort, order, cursor, take, skip} = args
    return this.tagService.getTags(filter, sort, order, cursor, skip, take)
  }

  @ResolveField(() => String)
  async url(@Parent() parent: PTag) {
    return this.urlAdapter.getTagURL(parent)
  }
}
