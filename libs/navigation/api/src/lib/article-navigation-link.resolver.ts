import {Parent, ResolveField, Resolver} from '@nestjs/graphql'
import {ArticleNavigationLink} from './navigation.model'
import {Article} from '@wepublish/article/api'

@Resolver(() => ArticleNavigationLink)
export class ArticleNavigationLinkResolver {
  @ResolveField(() => Article)
  async article(@Parent() parent: ArticleNavigationLink) {
    return {__typename: 'Article', id: parent.articleID}
  }
}
