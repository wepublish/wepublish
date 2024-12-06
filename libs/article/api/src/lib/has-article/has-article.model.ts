import {Field, ID, InterfaceType} from '@nestjs/graphql'
import {Article} from '../article.model'

@InterfaceType()
export abstract class HasOptionalArticle {
  @Field(() => ID, {nullable: true})
  articleID?: string

  @Field(() => Article, {nullable: true})
  article?: Article
}

@InterfaceType()
export abstract class HasArticle {
  @Field(() => ID)
  articleID!: string

  @Field(() => Article)
  article!: Article
}

// New Style

@InterfaceType()
export abstract class HasArticleLc {
  @Field(() => ID)
  articleId!: string

  @Field(() => Article)
  article!: Article
}

@InterfaceType()
export abstract class HasOptionalArticleLc {
  @Field(() => ID, {nullable: true})
  articleId?: string

  @Field(() => Article, {nullable: true})
  article?: Article
}
