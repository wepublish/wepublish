import {Field, ID, InterfaceType} from '@nestjs/graphql'
import {Image} from '../image.model'

@InterfaceType()
export abstract class HasImage {
  @Field(() => ID, {nullable: true})
  imageID?: string

  @Field(() => Image, {nullable: true})
  image?: Image
}
