import {Parent, ResolveField, Resolver} from '@nestjs/graphql'
import {HasPage} from './has-page.model'
import {Page} from '../page.model'

@Resolver(() => HasPage)
export class HasPageResolver {
  @ResolveField(() => Page, {nullable: true})
  public page(@Parent() block: HasPage) {
    const {pageID} = block

    if (!pageID) {
      return null
    }

    return {__typename: 'Page', id: pageID}
  }
}
