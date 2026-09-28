import { Query, Resolver } from '@nestjs/graphql';
import { Permissions } from '@wepublish/permissions/api';
import { CanGetSettings } from '@wepublish/permissions';
import { SeoChecklist } from './seo-checklist.model';
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
}
