import { Args, Context, Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { PageRevision } from './page.model';
import { Image, ImageDataloaderService } from '@wepublish/image/api';
import { Property } from '@wepublish/property/api';
import { CurrentUser, UserSession } from '@wepublish/authentication/api';
import { hasPermission, permissionsOf } from '@wepublish/permissions/api';
import { BlockContent, BlockTreeLoader } from '@wepublish/block-content/api';
import { limitAnswerCache, skipAnswerCache } from '@wepublish/kv-ttl-cache/api';
import { forwardRef, Inject } from '@nestjs/common';
import { CanGetPage } from '@wepublish/permissions';

@Resolver(() => PageRevision)
export class PageRevisionResolver {
  constructor(
    @Inject(forwardRef(() => BlockTreeLoader))
    private blockTreeLoader: BlockTreeLoader,
    private imageDataloaderService: ImageDataloaderService
  ) {}

  @ResolveField(() => [Property])
  public async properties(
    @Parent() revision: PageRevision,
    @CurrentUser() user: UserSession | undefined
  ) {
    const properties = revision.properties;

    return properties?.filter(
      prop => prop.public || hasPermission(CanGetPage, permissionsOf(user))
    );
  }

  @ResolveField(() => Image, { nullable: true })
  public async image(@Parent() revision: PageRevision) {
    const { imageID } = revision;

    if (!imageID) {
      return null;
    }

    return this.imageDataloaderService.load(imageID);
  }

  @ResolveField(() => Image, { nullable: true })
  public socialMediaImage(@Parent() revision: PageRevision) {
    const { socialMediaImageID } = revision;

    if (!socialMediaImageID) {
      return null;
    }

    return this.imageDataloaderService.load(socialMediaImageID);
  }

  @ResolveField(() => [BlockContent])
  async blocks(
    @Parent() parent: PageRevision,
    @Args('onlyDisplayed', {
      type: () => Boolean,
      defaultValue: true,
      description:
        'Omits blocks that should be hidden. Only users who can read pages may pass `false`, everyone else gets the displayed blocks.',
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
        onlyDisplayed || !hasPermission(CanGetPage, permissionsOf(user)),
    });
  }

  @ResolveField(() => Date, {
    nullable: true,
    description:
      'When the set of displayed blocks changes next, so caches can expire in time. Null while no block is timed.',
  })
  async blocksChangeAt(@Parent() parent: PageRevision) {
    return this.blockTreeLoader.nextChange(parent.blocks);
  }
}
