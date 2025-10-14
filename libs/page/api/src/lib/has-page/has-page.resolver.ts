import { Parent, ResolveField, Resolver } from '@nestjs/graphql';
import {
  HasPage,
  HasPageLc,
  HasOptionalPage,
  HasOptionalPageLc,
} from './has-page.model';
import { Page } from '../page.model';
import { PageDataloaderService } from '../page-dataloader.service';

@Resolver(() => HasPage)
export class HasPageResolver {
  constructor(private dataloader: PageDataloaderService) {}

  @ResolveField(() => Page, { nullable: true })
  public page(
    @Parent() block: HasOptionalPage | HasPage | HasOptionalPageLc | HasPageLc
  ) {
    const id =
      'pageId' in block ? block.pageId
      : 'pageID' in block ? block.pageID
      : null;

    if (!id) {
      return null;
    }

    return this.dataloader.load(id);
  }
}

@Resolver(() => HasPageLc)
export class HasPageLcResolver extends HasPageResolver {}

@Resolver(() => HasOptionalPage)
export class HasOptionalPageResolver extends HasPageResolver {}

@Resolver(() => HasOptionalPageLc)
export class HasOptionalPageLcResolver extends HasPageResolver {}
