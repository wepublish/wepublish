import {
  Field,
  ObjectType,
  InputType,
  InterfaceType,
  ArgsType,
  OmitType,
  registerEnumType
} from '@nestjs/graphql'

export enum NavigationLinkType {
  Page = 'page',
  Article = 'article',
  External = 'external'
}

registerEnumType(NavigationLinkType, {
  name: 'NavigationLinkType'
})

@ObjectType()
export class Navigation {
  @Field(() => String)
  id!: string

  @Field()
  createdAt!: Date

  @Field()
  modifiedAt!: Date

  @Field()
  key!: string

  @Field(() => [BaseNavigationLink])
  links!: BaseNavigationLink[]

  @Field()
  name!: string
}

@InterfaceType({
  isAbstract: true,
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
abstract class BaseNavigationLink {
  @Field(() => String)
  id!: string

  @Field()
  createdAt!: Date

  @Field()
  modifiedAt!: Date

  @Field()
  label!: string
  @Field(() => String)
  type!: string
}

@ObjectType({implements: BaseNavigationLink})
export class ArticleNavigationLink extends BaseNavigationLink {
  @Field(() => String)
  articleID!: string
}

@ObjectType({implements: BaseNavigationLink})
export class PageNavigationLink extends BaseNavigationLink {
  @Field(() => String)
  pageID!: string
}

@ObjectType({implements: BaseNavigationLink})
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
export class NavigationArgs {
  @Field(() => String, {nullable: true})
  id?: string

  @Field(() => String, {nullable: true})
  key?: string
}

@ArgsType()
export class NavigationIdArgs {
  @Field(() => String)
  id!: string
}

@InputType()
class BaseNavigationLinkInput extends OmitType(NavigationLinkInput, [], InputType) {}

@ArgsType()
export class UpdateNavigationArgs extends OmitType(
  Navigation,
  ['createdAt', 'modifiedAt', 'links'],
  ArgsType
) {
  @Field(() => [BaseNavigationLinkInput])
  links!: BaseNavigationLinkInput[]
}

@ArgsType()
export class CreateNavigationInput extends OmitType(UpdateNavigationArgs, ['id'], ArgsType) {}
