import { Args, Context, Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { ArticleRevision, ArticleRevisionAuthor } from './article.model';
import {
  ArticleAuthorDataloader,
  ArticleSocialMediaAuthorDataloader,
  Author,
} from '@wepublish/author/api';
import { Image, ImageDataloaderService } from '@wepublish/image/api';
import { CurrentUser, UserSession } from '@wepublish/authentication/api';
import { CanGetArticle } from '@wepublish/permissions';
import { hasPermission, permissionsOf } from '@wepublish/permissions/api';
import { BlockTreeLoader, BlockContent } from '@wepublish/block-content/api';
import { limitAnswerCache, skipAnswerCache } from '@wepublish/kv-ttl-cache/api';
import { forwardRef, Inject } from '@nestjs/common';
import { Property } from '@wepublish/property/api';

@Resolver(() => ArticleRevision)
export class ArticleRevisionResolver {
  constructor(
    @Inject(forwardRef(() => BlockTreeLoader))
    private blockTreeLoader: BlockTreeLoader,
    private authorDataLoader: ArticleAuthorDataloader,
    private socialMediaAuthorDataLoader: ArticleSocialMediaAuthorDataloader,
    private imageDataloaderService: ImageDataloaderService
  ) {}

  @ResolveField(() => [BlockContent])
  async blocks(
    @Parent() parent: ArticleRevision,
    @Args('onlyDisplayed', {
      type: () => Boolean,
      defaultValue: true,
      description:
        'Omits blocks that should be hidden. Only users who can read articles may pass `false`, everyone else gets the displayed blocks.',
    })
    onlyDisplayed: boolean,
    @Context() context: object,
    @CurrentUser() user: UserSession | undefined
  ) {
    if (!onlyDisplayed) {
      skipAnswerCache(context);
    }

    const changeAt = await this.blockTreeLoader.nextChange(parent.blocks);

    if (changeAt) {
      limitAnswerCache(context, changeAt);
    }

    return this.blockTreeLoader.loadBlocks(parent.blocks, {
      onlyDisplayed:
        onlyDisplayed || !hasPermission(CanGetArticle, permissionsOf(user)),
    });
  }

  @ResolveField(() => Date, {
    nullable: true,
    description:
      'When the set of displayed blocks changes next, so caches can expire in time. Null while no block is timed.',
  })
  async blocksChangeAt(@Parent() parent: ArticleRevision) {
    return this.blockTreeLoader.nextChange(parent.blocks);
  }

  @ResolveField(() => [Property])
  public async properties(
    @Parent() revision: ArticleRevision,
    @CurrentUser() user: UserSession | undefined
  ) {
    const properties = revision.properties;

    return properties?.filter(
      prop => prop.public || hasPermission(CanGetArticle, permissionsOf(user))
    );
  }

  @ResolveField(() => [Author])
  public async socialMediaAuthors(@Parent() revision: ArticleRevision) {
    return this.socialMediaAuthorDataLoader.load(revision.id);
  }

  @ResolveField(() => [ArticleRevisionAuthor])
  public async authors(@Parent() revision: ArticleRevision) {
    return this.authorDataLoader.load(revision.id);
  }

  @ResolveField(() => Image, { nullable: true })
  public async image(@Parent() revision: ArticleRevision) {
    const { imageID } = revision;

    if (!imageID) {
      return null;
    }

    return this.imageDataloaderService.load(imageID);
  }

  @ResolveField(() => Image, { nullable: true })
  public socialMediaImage(@Parent() revision: ArticleRevision) {
    const { socialMediaImageID } = revision;

    if (!socialMediaImageID) {
      return null;
    }

    return this.imageDataloaderService.load(socialMediaImageID);
  }
}
