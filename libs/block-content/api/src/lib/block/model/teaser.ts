import {
  createUnionType,
  Field,
  ID,
  InputType,
  ObjectType,
  OmitType,
  registerEnumType
} from '@nestjs/graphql'
import {Image} from '@wepublish/image/api'
import {Event} from '@wepublish/event/api'
import {Property, PropertyInput} from '@wepublish/property/api'

export enum TeaserType {
  Article = 'article',
  PeerArticle = 'peerArticle',
  Page = 'page',
  Event = 'event',
  Custom = 'custom'
}

class Foo {
  @Field(() => Bar)
  bar!: Bar
}

class Bar {
  @Field(() => Foo)
  foo!: Foo
}

registerEnumType(TeaserType, {name: 'TeaserType'})

export enum TeaserStyle {
  Default,
  Light,
  Text
}

registerEnumType(TeaserStyle, {name: 'TeaserStyle'})

export abstract class AbstractTeaser {
  @Field(() => TeaserStyle)
  style!: TeaserStyle

  @Field(() => ID, {nullable: true})
  imageID?: string

  @Field(() => Image, {nullable: true})
  image?: Image

  @Field(() => String, {nullable: true})
  preTitle?: string

  @Field(() => String, {nullable: true})
  title?: string

  @Field(() => String, {nullable: true})
  lead?: string
}

// Objects

@ObjectType()
export class ArticleTeaser extends AbstractTeaser {
  @Field(() => ID)
  articleID!: string

  // @Field(() => Article)
  // article!: Article;
}

@ObjectType()
export class PeerArticleTeaser extends AbstractTeaser {
  @Field(() => ID)
  peerID!: string

  // @Field(() => Peer)
  // peer!: Peer;

  @Field(() => ID)
  articleID!: string

  // @Field(() => Article)
  // article!: Article;
}

@ObjectType()
export class PageTeaser extends AbstractTeaser {
  @Field(() => ID)
  pageID!: string

  // @Field(() => Page)
  // page!: Page;
}

@ObjectType()
export class EventTeaser extends AbstractTeaser {
  @Field(() => ID)
  eventID!: string

  @Field(() => Event)
  event!: Event
}

@ObjectType()
export class CustomTeaser extends AbstractTeaser {
  @Field(() => String, {nullable: true})
  contentUrl?: string

  @Field(() => [Property])
  properties!: Property[]
}

export const TeaserUnion = createUnionType({
  name: 'Teaser',
  types: () => [ArticleTeaser, PeerArticleTeaser, PageTeaser, CustomTeaser, EventTeaser],
  resolveType: value => {
    switch (value.type) {
      case TeaserType.PeerArticle:
        return PeerArticleTeaser.name
      case TeaserType.Article:
        return ArticleTeaser.name
      case TeaserType.Page:
        return PageTeaser.name
      case TeaserType.Event:
        return EventTeaser.name
      case TeaserType.Custom:
        return CustomTeaser.name
    }
    throw new Error('Invalid type for teaser')
  }
})
export type Teaser = typeof TeaserUnion

// Inputs

@InputType()
export class ArticleTeaserInput extends OmitType(ArticleTeaser, ['image'], InputType) {}

@InputType()
export class PeerArticleTeaserInput extends OmitType(PeerArticleTeaser, ['image'], InputType) {}

@InputType()
export class PageTeaserInput extends OmitType(PageTeaser, ['image'], InputType) {}

@InputType()
export class EventTeaserInput extends OmitType(EventTeaser, ['image', 'event'], InputType) {}

@InputType()
export class CustomTeaserInput extends OmitType(CustomTeaser, ['image', 'properties'], InputType) {
  @Field(() => [PropertyInput])
  properties!: PropertyInput[]
}

@InputType()
export class TeaserInput {
  @Field(() => ArticleTeaserInput, {nullable: true})
  [TeaserType.Article]?: ArticleTeaserInput;

  @Field(() => PeerArticleTeaserInput, {nullable: true})
  [TeaserType.PeerArticle]?: PeerArticleTeaserInput;

  @Field(() => PageTeaserInput, {nullable: true})
  [TeaserType.Page]?: PageTeaserInput;

  @Field(() => EventTeaserInput, {nullable: true})
  [TeaserType.Event]?: EventTeaserInput;

  @Field(() => CustomTeaserInput, {nullable: true})
  [TeaserType.Custom]?: CustomTeaserInput
}
