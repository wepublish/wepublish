import {
  createUnionType,
  Field,
  InputType,
  InterfaceType,
  ObjectType,
  OmitType,
  registerEnumType
} from '@nestjs/graphql'
import {Article, HasOptionalArticle} from '@wepublish/article/api'
import {HasOptionalPage, Page} from '@wepublish/page/api'
import {HasImage} from '@wepublish/image/api'
import {Event, HasOptionalEvent} from '@wepublish/event/api'
import {Property, PropertyInput} from '@wepublish/utils/api'

export enum TeaserType {
  Article = 'article',
  Page = 'page',
  Event = 'event',
  Custom = 'custom'
}

registerEnumType(TeaserType, {
  name: 'TeaserType'
})

export enum TeaserStyle {
  Default = 'default',
  Light = 'light',
  Text = 'text'
}

registerEnumType(TeaserStyle, {
  name: 'TeaserStyle'
})

@InterfaceType({
  implements: [HasImage]
})
export abstract class BaseTeaser<Type extends TeaserType> extends HasImage {
  @Field(() => String)
  type!: Type

  @Field(() => TeaserStyle)
  style?: TeaserStyle

  @Field({nullable: true})
  preTitle?: string
  @Field({nullable: true})
  title?: string
  @Field({nullable: true})
  lead?: string
}

@ObjectType({
  implements: () => [BaseTeaser, HasOptionalArticle]
})
export class ArticleTeaser extends BaseTeaser<TeaserType.Article> implements HasOptionalArticle {
  articleID?: string
  article?: Article
}

@InputType()
export class ArticleTeaserInput extends OmitType(
  ArticleTeaser,
  ['article', 'image', 'type'] as const,
  InputType
) {}

@ObjectType({
  implements: () => [BaseTeaser, HasOptionalPage]
})
export class PageTeaser extends BaseTeaser<TeaserType.Page> implements HasOptionalPage {
  pageID?: string
  page?: Page
}

@InputType()
export class PageTeaserInput extends OmitType(
  PageTeaser,
  ['page', 'image', 'type'] as const,
  InputType
) {}

@ObjectType({
  implements: () => [BaseTeaser, HasOptionalEvent]
})
export class EventTeaser extends BaseTeaser<TeaserType.Event> implements HasOptionalEvent {
  eventID?: string
  event?: Event
}

@InputType()
export class EventTeaserInput extends OmitType(
  EventTeaser,
  ['event', 'image', 'type'] as const,
  InputType
) {}

@ObjectType({
  implements: () => [BaseTeaser]
})
export class CustomTeaser extends BaseTeaser<TeaserType.Custom> {
  @Field({nullable: true})
  contentUrl?: string

  @Field(() => [Property], {defaultValue: []})
  properties!: Property[]
}

@InputType()
export class CustomTeaserInput extends OmitType(
  CustomTeaser,
  ['image', 'properties', 'type'] as const,
  InputType
) {
  @Field(() => [PropertyInput], {defaultValue: []})
  properties!: PropertyInput[]
}

export const Teaser = createUnionType({
  name: 'Teaser',
  types: () => [ArticleTeaser, PageTeaser, EventTeaser, CustomTeaser] as const,
  resolveType: (value: BaseTeaser<any>) => {
    switch (value.type) {
      case TeaserType.Article:
        return ArticleTeaser.name
      case TeaserType.Page:
        return PageTeaser.name
      case TeaserType.Event:
        return EventTeaser.name
      case TeaserType.Custom:
        return CustomTeaser.name
    }

    console.warn(`Teaser ${value.type} not implemented!`)

    return CustomTeaser.name
  }
})

@InputType()
export class TeaserInput {
  @Field(() => ArticleTeaserInput, {nullable: true})
  [TeaserType.Article]?: ArticleTeaserInput;
  @Field(() => PageTeaserInput, {nullable: true})
  [TeaserType.Page]?: PageTeaserInput;
  @Field(() => EventTeaserInput, {nullable: true})
  [TeaserType.Event]?: EventTeaserInput;
  @Field(() => CustomTeaserInput, {nullable: true})
  [TeaserType.Custom]?: CustomTeaserInput
}
