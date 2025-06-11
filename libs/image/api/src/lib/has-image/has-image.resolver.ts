import {Parent, ResolveField, Resolver} from '@nestjs/graphql'
import {HasImage, HasImageLc} from './has-image.model'
import {Image} from '../image.model'

@Resolver(() => HasImage)
export class HasImageResolver {
  @ResolveField(() => Image, {nullable: true})
  public image(@Parent() block: HasImage) {
    const {imageID} = block

    if (!imageID) {
      return null
    }

    return {__typename: 'Image', id: imageID}
  }
}

@Resolver(() => HasImageLc)
export class HasImageLcResolver {
  @ResolveField(() => Image, {nullable: true})
  public image(@Parent() block: HasImageLc) {
    const {imageId} = block

    if (!imageId) {
      return null
    }

    return {__typename: 'Image', id: imageId}
  }
}
