import { forwardRef, Inject, NotFoundException } from '@nestjs/common';
import {
  Args,
  Mutation,
  Parent,
  Query,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';
import {
  BlockTemplate,
  BlockTemplateDataloaderService,
} from '@wepublish/block-content/api';
import { Image, ImageDataloaderService } from '@wepublish/image/api';
import {
  CanCreatePage,
  CanCreatePageTemplate,
  CanDeletePageTemplate,
  CanUpdatePageTemplate,
} from '@wepublish/permissions';
import { Permissions } from '@wepublish/permissions/api';
import { Tag, TagDataloader } from '@wepublish/tag/api';
import { PageTemplateMetadata, PageTemplateMetadataInput } from '../page.model';
import {
  PageTemplate,
  PageTemplateListArgs,
  CreatePageTemplateInput,
  PaginatedPageTemplate,
  UpdatePageTemplateInput,
} from './page-template.model';
import { PageTemplateService } from './page-template.service';

@Resolver(() => PageTemplate)
export class PageTemplateResolver {
  constructor(
    private pageTemplateService: PageTemplateService,
    @Inject(forwardRef(() => BlockTemplateDataloaderService))
    private blockTemplateDataloader: BlockTemplateDataloaderService
  ) {}

  @Permissions(CanCreatePage)
  @Query(returns => PaginatedPageTemplate, {
    description: `Returns a paginated list of page templates.`,
  })
  public pageTemplates(@Args() args: PageTemplateListArgs) {
    return this.pageTemplateService.getPageTemplates(args);
  }

  @Permissions(CanCreatePage)
  @Query(returns => PageTemplate, {
    description: `Returns a single page template by ID.`,
  })
  public async pageTemplate(@Args('id') id: string) {
    const pageTemplate = await this.pageTemplateService.getPageTemplateById(id);

    if (!pageTemplate) {
      throw new NotFoundException(`Page template with ID ${id} not found`);
    }

    return pageTemplate;
  }

  @Permissions(CanCreatePageTemplate)
  @Mutation(returns => PageTemplate, {
    description: `Creates a new page template.`,
  })
  public createPageTemplate(@Args() input: CreatePageTemplateInput) {
    return this.pageTemplateService.createPageTemplate(input);
  }

  @Permissions(CanUpdatePageTemplate)
  @Mutation(returns => PageTemplate, {
    description: `Updates an existing page template.`,
  })
  public updatePageTemplate(@Args() input: UpdatePageTemplateInput) {
    return this.pageTemplateService.updatePageTemplate(input);
  }

  @Permissions(CanDeletePageTemplate)
  @Mutation(returns => PageTemplate, {
    description: `Deletes an existing page template.`,
  })
  public deletePageTemplate(@Args('id') id: string) {
    return this.pageTemplateService.deletePageTemplate(id);
  }

  @ResolveField(() => BlockTemplate)
  public blockTemplate(
    @Parent() { blockTemplate, blockTemplateId }: PageTemplate
  ) {
    return blockTemplate ?? this.blockTemplateDataloader.load(blockTemplateId);
  }
}

@Resolver(() => PageTemplateMetadata)
export class PageTemplateMetadataResolver {
  constructor(
    private tagDataloader: TagDataloader,
    private imageDataloader: ImageDataloaderService
  ) {}

  @ResolveField(() => [Tag])
  public async tags(@Parent() metadata: PageTemplateMetadataInput) {
    const tags = await Promise.all(
      (metadata.tagIds ?? []).map(id => this.tagDataloader.load(id))
    );

    return tags.filter(Boolean);
  }

  @ResolveField(() => Boolean)
  public hideHeader(@Parent() { hideHeader }: PageTemplateMetadataInput) {
    return hideHeader ?? false;
  }

  @ResolveField(() => Boolean)
  public hideFooter(@Parent() { hideFooter }: PageTemplateMetadataInput) {
    return hideFooter ?? false;
  }

  @ResolveField(() => Image, { nullable: true })
  public async image(@Parent() { imageID }: PageTemplateMetadataInput) {
    return imageID ? this.imageDataloader.load(imageID) : null;
  }

  @ResolveField(() => Image, { nullable: true })
  public async socialMediaImage(
    @Parent() { socialMediaImageID }: PageTemplateMetadataInput
  ) {
    return socialMediaImageID ?
        this.imageDataloader.load(socialMediaImageID)
      : null;
  }
}
