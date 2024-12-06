import {Field, ID, InterfaceType} from '@nestjs/graphql'
import {Author} from '../author.model'

@InterfaceType()
export abstract class HasOptionalAuthor {
  @Field(() => ID, {nullable: true})
  authorId?: string

  @Field(() => Author, {nullable: true})
  author?: Author
}

@InterfaceType()
export abstract class HasAuthor {
  @Field(() => ID)
  authorId!: string

  @Field(() => Author)
  author!: Author
}
