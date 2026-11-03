import { Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { Image, ImageDataloaderService } from '@wepublish/image/api';
import { PuckBlockStyling } from '@wepublish/puck-content/api';

@Resolver(() => PuckBlockStyling)
export class PuckBlockStylingResolver {
  constructor(private images: ImageDataloaderService) {}

  @ResolveField(() => Image, {
    nullable: true,
    description: 'The image `backgroundImage` points at.',
  })
  async backgroundImageObject(@Parent() { backgroundImage }: PuckBlockStyling) {
    return backgroundImage ? this.images.load(backgroundImage) : null;
  }
}
