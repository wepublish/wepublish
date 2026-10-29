import { forwardRef, Inject, NotFoundException } from '@nestjs/common';
import {
  Args,
  Mutation,
  Parent,
  Query,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';
import { Author, AuthorDataloaderService } from '@wepublish/author/api';
import {
  BlockTemplate,
  BlockTemplateDataloaderService,
} from '@wepublish/block-content/api';
import { Image, ImageDataloaderService } from '@wepublish/image/api';
import {
  CanCreateArticle,
  CanCreateArticleTemplate,
  CanDeleteArticleTemplate,
  CanUpdateArticleTemplate,
} from '@wepublish/permissions';
import { Permissions } from '@wepublish/permissions/api';
import { Tag, TagDataloader } from '@wepublish/tag/api';
import {
  ArticleRevisionAuthor,
  ArticleTemplateMetadata,
  ArticleTemplateMetadataInput,
} from '../article.model';
import {
  ArticleTemplate,
  ArticleTemplateListArgs,
  CreateArticleTemplateInput,
  PaginatedArticleTemplate,
  UpdateArticleTemplateInput,
} from './article-template.model';
import { ArticleTemplateService } from './article-template.service';

@Resolver(() => ArticleTemplate)
export class ArticleTemplateResolver {
  constructor(
    private articleTemplateService: ArticleTemplateService,
    @Inject(forwardRef(() => BlockTemplateDataloaderService))
    private blockTemplateDataloader: BlockTemplateDataloaderService
  ) {}

  @Permissions(CanCreateArticle)
  @Query(returns => PaginatedArticleTemplate, {
    description: `Returns a paginated list of article templates.`,
  })
  public articleTemplates(@Args() args: ArticleTemplateListArgs) {
    return this.articleTemplateService.getArticleTemplates(args);
  }

  @Permissions(CanCreateArticle)
  @Query(returns => ArticleTemplate, {
    description: `Returns a single article template by ID.`,
  })
  public async articleTemplate(@Args('id') id: string) {
    const articleTemplate =
      await this.articleTemplateService.getArticleTemplateById(id);

    if (!articleTemplate) {
      throw new NotFoundException(`Article template with ID ${id} not found`);
    }

    return articleTemplate;
  }

  @Permissions(CanCreateArticleTemplate)
  @Mutation(returns => ArticleTemplate, {
    description: `Creates a new article template.`,
  })
  public createArticleTemplate(@Args() input: CreateArticleTemplateInput) {
    return this.articleTemplateService.createArticleTemplate(input);
  }

  @Permissions(CanUpdateArticleTemplate)
  @Mutation(returns => ArticleTemplate, {
    description: `Updates an existing article template.`,
  })
  public updateArticleTemplate(@Args() input: UpdateArticleTemplateInput) {
    return this.articleTemplateService.updateArticleTemplate(input);
  }

  @Permissions(CanDeleteArticleTemplate)
  @Mutation(returns => ArticleTemplate, {
    description: `Deletes an existing article template.`,
  })
  public deleteArticleTemplate(@Args('id') id: string) {
    return this.articleTemplateService.deleteArticleTemplate(id);
  }

  @ResolveField(() => BlockTemplate)
  public blockTemplate(
    @Parent() { blockTemplate, blockTemplateId }: ArticleTemplate
  ) {
    return blockTemplate ?? this.blockTemplateDataloader.load(blockTemplateId);
  }
}

@Resolver(() => ArticleTemplateMetadata)
export class ArticleTemplateMetadataResolver {
  constructor(
    private authorDataloader: AuthorDataloaderService,
    private tagDataloader: TagDataloader,
    private imageDataloader: ImageDataloaderService
  ) {}

  @ResolveField(() => [Tag])
  public async tags(@Parent() metadata: ArticleTemplateMetadataInput) {
    const tags = await Promise.all(
      (metadata.tagIds ?? []).map(id => this.tagDataloader.load(id))
    );

    return tags.filter(Boolean);
  }

  @ResolveField(() => [ArticleRevisionAuthor])
  public async authors(@Parent() metadata: ArticleTemplateMetadataInput) {
    const authors = await Promise.all(
      (metadata.authors ?? []).map(async ({ authorId, role }) => ({
        author: await this.authorDataloader.load(authorId),
        role,
      }))
    );

    return authors.filter(({ author }) => author);
  }

  @ResolveField(() => [Author])
  public async socialMediaAuthors(
    @Parent() metadata: ArticleTemplateMetadataInput
  ) {
    const authors = await Promise.all(
      (metadata.socialMediaAuthorIds ?? []).map(id =>
        this.authorDataloader.load(id)
      )
    );

    return authors.filter(Boolean);
  }

  @ResolveField(() => Image, { nullable: true })
  public async image(@Parent() { imageID }: ArticleTemplateMetadataInput) {
    return imageID ? this.imageDataloader.load(imageID) : null;
  }

  @ResolveField(() => Image, { nullable: true })
  public async socialMediaImage(
    @Parent() { socialMediaImageID }: ArticleTemplateMetadataInput
  ) {
    return socialMediaImageID ?
        this.imageDataloader.load(socialMediaImageID)
      : null;
  }
}
