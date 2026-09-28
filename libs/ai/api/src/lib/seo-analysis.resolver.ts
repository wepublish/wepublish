import { Args, Query, Resolver } from '@nestjs/graphql';
import { Permissions } from '@wepublish/permissions/api';
import { CanCreateArticle, CanCreatePage } from '@wepublish/permissions';
import {
  AnalyzeSeoContentInput,
  SeoContentAnalysis,
} from './seo-analysis.model';
import { SeoAnalysisService } from './seo-analysis.service';

@Resolver(() => SeoContentAnalysis)
export class SeoAnalysisResolver {
  constructor(private seoAnalysisService: SeoAnalysisService) {}

  @Permissions(CanCreateArticle, CanCreatePage)
  @Query(() => SeoContentAnalysis, {
    description: `Analyzes an article or page for SEO optimization potential using AI.`,
  })
  analyzeSeoContent(@Args('input') input: AnalyzeSeoContentInput) {
    return this.seoAnalysisService.analyze(input);
  }
}
