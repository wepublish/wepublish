import {Field, ID, InterfaceType} from '@nestjs/graphql'
import {Article} from '../article.model'

@InterfaceType()
export abstract class HasArticle {
  @Field(() => ID, {nullable: true})
  articleID?: string

  @Field(() => Article, {nullable: true})
  article?: Article
}
