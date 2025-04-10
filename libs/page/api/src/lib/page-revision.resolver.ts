import {Parent, ResolveField, Resolver} from '@nestjs/graphql'
import {PageRevision} from './page.model'
import {Image} from '@wepublish/image/api'
import {PageRevisionService} from './page-revision.service'
import {Property} from '@wepublish/utils/api'
import {CurrentUser, UserSession} from '@wepublish/authentication/api'
import {CanGetPage} from '@wepublish/permissions'
import {hasPermission} from '@wepublish/permissions/api'
import {BlockContent, isTeaserSlotsBlock, SlotTeasersLoader} from '@wepublish/block-content/api'
import {forwardRef, Inject, Logger} from '@nestjs/common'

@Resolver(() => PageRevision)
export class PageRevisionResolver {
  constructor(
    private revisionService: PageRevisionService,
    @Inject(forwardRef(() => SlotTeasersLoader))
    private slotTeasersLoader: SlotTeasersLoader
  ) {}

  @ResolveField(() => [Property])
  public async properties(
    @Parent() revision: PageRevision,
    @CurrentUser() user: UserSession | undefined
  ) {
    return this.revisionService.getProperties(
      revision.id,
      hasPermission(CanGetPage, user?.roles ?? [])
    )
  }

  @ResolveField(() => Image, {nullable: true})
  public async image(@Parent() revision: PageRevision) {
    const {imageID} = revision

    if (!imageID) {
      return null
    }

    return {__typename: 'Image', id: imageID}
  }

  @ResolveField(() => Image, {nullable: true})
  public socialMediaImage(@Parent() revision: PageRevision) {
    const {socialMediaImageID} = revision

    if (!socialMediaImageID) {
      return null
    }

    return {__typename: 'Image', id: socialMediaImageID}
  }

  @ResolveField(() => [BlockContent])
  async blocks(@Parent() revision: PageRevision): Promise<(typeof BlockContent)[]> {
    new Logger('Page revision').log(JSON.stringify(revision.blocks))

    if (revision.blocks.some(isTeaserSlotsBlock)) {
      new Logger('Page revision inside').log(JSON.stringify(revision.blocks))
      return this.slotTeasersLoader.loadSlotTeasersIntoBlocks(revision.blocks)
    }
    return revision.blocks
  }
}
