import { Args, Parent, ResolveField, Resolver } from '@nestjs/graphql';
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
import { SlotTeasersLoader, BlockContent } from '@wepublish/block-content/api';
import { forwardRef, Inject } from '@nestjs/common';
import { Property } from '@wepublish/property/api';
import { ContentGateAccessService } from '@wepublish/content-gate/api';
import { ArticleDataloaderService } from './article-dataloader.service';

@Resolver(() => ArticleRevision)
export class ArticleRevisionResolver {
  constructor(
    @Inject(forwardRef(() => SlotTeasersLoader))
    private slotTeasersLoader: SlotTeasersLoader,
    private authorDataLoader: ArticleAuthorDataloader,
    private socialMediaAuthorDataLoader: ArticleSocialMediaAuthorDataloader,
    private imageDataloaderService: ImageDataloaderService,
    private articleDataloader: ArticleDataloaderService,
    private contentGateAccess: ContentGateAccessService
  ) {}

  @ResolveField(() => [BlockContent])
  async blocks(
    @Parent() parent: ArticleRevision,
    @Args('unlockContentGate', {
      defaultValue: false,
      description: `Content gates only send the preview blocks of an article.
The website asks for the rest once the reader's meter allows it.`,
    })
    unlockContentGate: boolean,
    @CurrentUser() session: UserSession | undefined
  ) {
    const blocks =
      unlockContentGate ?
        parent.blocks
      : (await this.contentGatePreview(parent, session)).blocks;

    return await this.slotTeasersLoader.loadSlotTeasersIntoBlocks(blocks);
  }

  @ResolveField(() => Boolean, {
    description: `Whether blocks were left out because of a content gate.`,
  })
  async contentGated(
    @Parent() parent: ArticleRevision,
    @CurrentUser() session: UserSession | undefined
  ) {
    return (await this.contentGatePreview(parent, session)).gated;
  }

  private async contentGatePreview(
    parent: ArticleRevision,
    session: UserSession | undefined
  ) {
    const article = await this.articleDataloader.load(parent.articleId);

    if (!article) {
      return { blocks: parent.blocks, gated: false };
    }

    return this.contentGateAccess.previewBlocks(
      parent.blocks,
      article,
      session
    );
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
