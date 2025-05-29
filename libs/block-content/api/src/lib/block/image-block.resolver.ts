import {Parent, ResolveField, Resolver} from '@nestjs/graphql'
import {ImageBlock} from './model/image'
import {Image} from '@wepublish/image/api'

@Resolver(() => ImageBlock)
export class ImageBlockResolver {
  @ResolveField(() => Image)
  async image(@Parent() parent: ImageBlock) {
    return {__typename: 'Image', id: parent.imageID}
  }
}
