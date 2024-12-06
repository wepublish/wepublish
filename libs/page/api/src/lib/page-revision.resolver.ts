import {Parent, ResolveField, Resolver} from '@nestjs/graphql'
import {PageRevision} from './page.model'
import {Image} from '@wepublish/image/api'
import {PageRevisionService} from './page-revision.service'
import {Property} from '@wepublish/utils/api'

@Resolver(() => PageRevision)
export class PageRevisionResolver {
  constructor(private revisionService: PageRevisionService) {}

  @ResolveField(() => [Property])
  public async properties(@Parent() revision: PageRevision) {
    return this.revisionService.getProperties(revision.id)
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
}
