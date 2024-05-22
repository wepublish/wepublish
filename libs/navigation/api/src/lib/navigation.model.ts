import {
  Field,
  ObjectType,
  InputType,
  InterfaceType,
  ArgsType,
  OmitType,
  registerEnumType,
  ID
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
export class NavigationKeyArgs {
  @Field(() => String)
  key!: string
}

@ArgsType()
export class NavigationIdArgs {
  @Field(() => ID)
  id!: string
}

@InputType()
class BaseNavigationLinkInput extends NavigationLinkInput {}

@InputType()
export class UpdateNavigationInput extends OmitType(
  Navigation,
  ['createdAt', 'modifiedAt', 'links'],
  InputType
) {
  @Field(() => [BaseNavigationLinkInput])
  links!: BaseNavigationLinkInput[]
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
