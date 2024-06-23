import {ResolveField, Resolver} from '@nestjs/graphql'
import {PageTeaser} from '../model/teaser'
import {Page, PageDataloader} from '@wepublish/page/api'

@Resolver(() => PageTeaser)
export class PageTeaserResolver {
  constructor(private pages: PageDataloader) {}

  @ResolveField(() => Page)
  async page(teaser: PageTeaser) {
    const {pageID} = teaser
    return this.pages.load(pageID)
  }
}
