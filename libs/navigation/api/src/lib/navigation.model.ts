import {
  Field,
  ObjectType,
  InputType,
  InterfaceType,
  ArgsType,
  OmitType,
  registerEnumType,
  ID,
  createUnionType,
  Directive
} from '@nestjs/graphql'
import {Article} from '@wepublish/article/api'
import {Page} from '@wepublish/page/api'

export enum NavigationLinkType {
  Page = 'page',
  Article = 'article',
  External = 'external'
}

registerEnumType(NavigationLinkType, {
  name: 'NavigationLinkType'
})

@InterfaceType({
  isAbstract: true
})
abstract class BaseNavigationLink {
  @Field()
  label!: string

  @Field(() => String)
  type!: string
}

@ObjectType({implements: [BaseNavigationLink]})
export class ArticleNavigationLink extends BaseNavigationLink {
  articleID!: string

  @Field(() => Article, {nullable: true})
  article!: Article
}

@ObjectType({implements: [BaseNavigationLink]})
export class PageNavigationLink extends BaseNavigationLink {
  pageID!: string

  @Field(() => Page, {nullable: true})
  page!: Page
}

@ObjectType({implements: [BaseNavigationLink]})
export class ExternalNavigationLink extends BaseNavigationLink {
  @Field({nullable: true})
  url?: string
}

@InputType()
export class NavigationLinkInput {
  @Field()
  label!: string

  @Field(() => String)
  type!: string

  @Field({nullable: true})
  url?: string

  @Field(() => String, {nullable: true})
  pageID?: string

  @Field(() => String, {nullable: true})
  articleID?: string
}

@ArgsType()
export class NavigationKeyArgs {
  @Field(() => String)
  key!: string
}

@ArgsType()
export class NavigationIdArgs {
  @Field(() => ID)
  id!: string
}

export const NavigationLink = createUnionType({
  name: 'NavigationLink',
  types: () => [ArticleNavigationLink, PageNavigationLink, ExternalNavigationLink],
  resolveType(value) {
    switch (value.type) {
      case NavigationLinkType.Article:
        return ArticleNavigationLink
      case NavigationLinkType.Page:
        return PageNavigationLink
      case NavigationLinkType.External:
        return ExternalNavigationLink
      default:
        return null
    }
  }
})

@ObjectType()
@Directive('@key(fields: "id")')
export class Navigation {
  @Field(() => ID)
  id!: string

  @Field()
  createdAt!: Date

  @Field()
  modifiedAt!: Date

  @Field()
  key!: string

  @Field(() => [NavigationLink])
  links!: (typeof NavigationLink)[]

  @Field()
  name!: string
}

@InputType()
export class UpdateNavigationInput extends OmitType(
  Navigation,
  ['createdAt', 'modifiedAt', 'links'],
  InputType
) {
  @Field(() => [NavigationLinkInput])
  links!: NavigationLinkInput[]
}

@InputType()
export class CreateNavigationInput extends OmitType(UpdateNavigationInput, ['id'], InputType) {}

@ArgsType()
export class UpdateNavigationArgs {
  @Field(() => UpdateNavigationInput)
  navigation!: UpdateNavigationInput
}

@ArgsType()
export class CreateNavigationArgs {
  @Field(() => CreateNavigationInput)
  navigation!: CreateNavigationInput
}
