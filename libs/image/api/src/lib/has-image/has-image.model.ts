import { Field, InterfaceType } from '@nestjs/graphql';
import { Image } from '../image.model';

@InterfaceType()
export abstract class HasImage {
  @Field({ nullable: true })
  imageID?: string;

  @Field(() => Image, { nullable: true })
  image?: Image;
}

@InterfaceType()
export abstract class HasImageLc {
  @Field({ nullable: true })
  imageId?: string;

  @Field(() => Image, { nullable: true })
  image?: Image;
}
