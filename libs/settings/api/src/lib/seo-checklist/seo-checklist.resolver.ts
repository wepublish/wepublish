import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CurrentUser, UserSession } from '@wepublish/authentication/api';
import { Permissions } from '@wepublish/permissions/api';
import { CanGetSettings, CanUpdateSettings } from '@wepublish/permissions';
import {
  SeoChecklist,
  SeoChecklistItem,
  UpdateSeoChecklistItemArgs,
} from './seo-checklist.model';
import { SeoChecklistService } from './seo-checklist.service';

@Resolver(() => SeoChecklist)
export class SeoChecklistResolver {
  constructor(private seoChecklistService: SeoChecklistService) {}

  @Permissions(CanGetSettings)
  @Query(() => SeoChecklist, {
    description: `Returns a checklist of the SEO setup of the website.`,
  })
  public seoChecklist() {
    return this.seoChecklistService.getChecklist();
  }

  @Permissions(CanUpdateSettings)
  @Mutation(() => [SeoChecklistItem], {
    description: `Marks an SEO checklist item as done or not done and returns all completed items.`,
  })
  public updateSeoChecklistItem(
    @Args() { itemId, completed }: UpdateSeoChecklistItemArgs,
    @CurrentUser() session: UserSession | undefined
  ) {
    return this.seoChecklistService.updateItem(
      itemId,
      completed,
      session?.user?.id
    );
  }
}
