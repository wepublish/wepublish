import { Args, Context, Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { ArticleRevision, ArticleRevisionAuthor } from './article.model';
import {
  ArticleAuthorDataloader,
  ArticleSocialMediaAuthorDataloader,
  Author,
} from '@wepublish/author/api';
import { Image, ImageDataloaderService } from '@wepublish/image/api';
import {
  AuthSession,
  CurrentUser,
  UserSession,
} from '@wepublish/authentication/api';
import { CanGetArticle } from '@wepublish/permissions';
import { hasPermission, permissionsOf } from '@wepublish/permissions/api';
import { BlockTreeLoader, BlockContent } from '@wepublish/block-content/api';
import {
  limitAnswerCache,
  skipAnswerCache,
} from '@wepublish/public-content-cache/api';
import { forwardRef, Inject } from '@nestjs/common';
import { Property } from '@wepublish/property/api';
import { ArticleAccessService, ArticleRequest } from './article-access.service';
import { isRestricted } from './article-access';

@Resolver(() => ArticleRevision)
export class ArticleRevisionResolver {
  constructor(
    @Inject(forwardRef(() => BlockTreeLoader))
    private blockTreeLoader: BlockTreeLoader,
    private authorDataLoader: ArticleAuthorDataloader,
    private socialMediaAuthorDataLoader: ArticleSocialMediaAuthorDataloader,
    private imageDataloaderService: ImageDataloaderService,
    private articleAccess: ArticleAccessService
  ) {}

  @ResolveField(() => [BlockContent], {
    description: `Readers without access only get the preview blocks: the server cuts paywalled and metered articles, the website does not hide them. viewArticle grants access for the article it returns.`,
  })
  async blocks(
    @Parent() parent: ArticleRevision,
    @Args('onlyDisplayed', {
      type: () => Boolean,
      defaultValue: true,
      description:
        'Omits blocks that should be hidden. Only users who can read articles may pass `false`, everyone else gets the displayed blocks.',
    })
    onlyDisplayed: boolean,
    @Context() context: { req: ArticleRequest },
    @CurrentUser() session: AuthSession | undefined
  ) {
    if (!onlyDisplayed) {
      skipAnswerCache(context);
    }

    const changeAt = await this.blockTreeLoader.nextChange(parent.blocks);

    if (changeAt) {
      limitAnswerCache(context, changeAt);
    }

    // Cut after loading: block templates expand into the blocks a reader
    // sees, and hidden blocks do not count towards the preview.
    const blocks = await this.blockTreeLoader.loadBlocks(parent.blocks, {
      onlyDisplayed:
        onlyDisplayed || !hasPermission(CanGetArticle, permissionsOf(session)),
    });
    const access = await this.articleAccess.accessFor(
      context.req,
      session,
      parent.articleId
    );

    return isRestricted(access) ?
        blocks.slice(0, access.previewBlocks)
      : blocks;
  }

  @ResolveField(() => Date, {
    nullable: true,
    description:
      'When the set of displayed blocks changes next, so caches can expire in time. Null while no block is timed.',
  })
  async blocksChangeAt(@Parent() parent: ArticleRevision) {
    return this.blockTreeLoader.nextChange(parent.blocks);
  }

  @ResolveField(() => Boolean, {
    description: `Whether the reader has no access to the article and only gets its preview blocks.`,
  })
  async restricted(
    @Parent() parent: ArticleRevision,
    @Context('req') req: ArticleRequest,
    @CurrentUser() session: AuthSession | undefined
  ) {
    return !(await this.articleAccess.accessFor(req, session, parent.articleId))
      .granted;
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
