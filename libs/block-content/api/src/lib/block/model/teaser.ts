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
import {PublicProperties} from '@wepublish/property/api'
import {Page} from '@wepublish/page/api'
import {Article} from '@wepublish/article/api'
import {Peer} from '@wepublish/peer/api'

export enum TeaserType {
  Article = 'article',
  PeerArticle = 'peerArticle',
  Page = 'page',
  Event = 'event',
  Custom = 'custom'
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
  articleID!: string

  @Field(() => Article)
  article!: Article
}

@ObjectType()
export class PeerArticleTeaser extends AbstractTeaser {
  peerID!: string

  @Field(() => Peer)
  peer!: Peer

  articleID!: string

  @Field(() => Article)
  article!: Article
}

@ObjectType()
export class PageTeaser extends AbstractTeaser {
  pageID!: string

  @Field(() => Page)
  page!: Page
}

@ObjectType()
export class EventTeaser extends AbstractTeaser {
  @Field(() => Event)
  event!: Event
}

@ObjectType()
export class CustomTeaser extends AbstractTeaser {
  @Field(() => String, {nullable: true})
  contentUrl?: string

  @Field(() => [PublicProperties])
  properties!: PublicProperties[]
}

export const Teaser = createUnionType({
  name: 'Teaser',
  types: () => [ArticleTeaser, PeerArticleTeaser, PageTeaser, CustomTeaser, EventTeaser],
  resolveType: value => {
    if (value.peer) {
      return PeerArticleTeaser.name
    }
    if (value.article) {
      return ArticleTeaser.name
    }
    if (value.page) {
      return PageTeaser.name
    }
    if (value.event) {
      return EventTeaser.name
    }
    return CustomTeaser.name
  }
})

// Inputs

@InputType()
export class ArticleTeaserInput extends OmitType(ArticleTeaser, ['image']) {}

@InputType()
export class PeerArticleTeaserInput extends OmitType(PeerArticleTeaser, ['image']) {}

@InputType()
export class PageTeaserInput extends OmitType(PageTeaser, ['image']) {}

@InputType()
export class EventTeaserInput extends OmitType(EventTeaser, ['image', 'event']) {}

@InputType()
export class CustomTeaserInput extends OmitType(CustomTeaser, ['image']) {}

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
