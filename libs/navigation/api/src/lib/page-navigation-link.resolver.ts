import {Parent, ResolveField, Resolver} from '@nestjs/graphql'
import {PageNavigationLink} from './navigation.model'
import {Page} from '@wepublish/page/api'

@Resolver(() => PageNavigationLink)
export class PageNavigationLinkResolver {
  @ResolveField(() => Page)
  async page(@Parent() parent: PageNavigationLink) {
    return {__typename: 'Page', id: parent.pageID}
  }
}
