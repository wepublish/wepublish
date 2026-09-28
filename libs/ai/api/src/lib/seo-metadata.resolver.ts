import { Args, Query, Resolver } from '@nestjs/graphql';
import { Permissions } from '@wepublish/permissions/api';
import { CanCreateArticle, CanCreatePage } from '@wepublish/permissions';
import {
  GenerateSeoMetadataInput,
  SeoMetadataSuggestion,
} from './seo-metadata.model';
import { SeoMetadataService } from './seo-metadata.service';

@Resolver(() => SeoMetadataSuggestion)
export class SeoMetadataResolver {
  constructor(private seoMetadataService: SeoMetadataService) {}

  @Permissions(CanCreateArticle, CanCreatePage)
  @Query(() => SeoMetadataSuggestion, {
    description: `Generates SEO metadata suggestions for an article or page using AI.`,
  })
  generateSeoMetadata(@Args('input') input: GenerateSeoMetadataInput) {
    return this.seoMetadataService.generate(input);
  }
}
