import {
  createUnionType,
  Field,
  ID,
  InterfaceType,
  ObjectType,
  registerEnumType
} from '@nestjs/graphql'
// Intended
// eslint-disable-next-line @nx/enforce-module-boundaries
import {Article, HasArticle, Property} from '@wepublish/article/api'
import {HasPage, Page} from '@wepublish/page/api'
import {HasPeer, Peer} from '@wepublish/peering/api'
import {HasImage} from '@wepublish/image/api'
import {Event, HasEvent} from '@wepublish/event/api'

export enum TeaserType {
  Article = 'article',
  PeerArticle = 'peerArticle',
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
  implements: () => [BaseTeaser, HasArticle]
})
export class ArticleTeaser extends BaseTeaser<TeaserType.Article> implements HasArticle {
  articleID?: string
  article?: Article
}

@ObjectType({
  implements: () => [BaseTeaser, HasPeer]
})
export class PeerArticleTeaser extends BaseTeaser<TeaserType.PeerArticle> implements HasPeer {
  peerID?: string
  peer?: Peer

  @Field(() => ID, {nullable: true})
  articleID?: string
  @Field(() => Article, {nullable: true})
  article?: Article
}

@ObjectType({
  implements: () => [BaseTeaser, HasPage]
})
export class PageTeaser extends BaseTeaser<TeaserType.Page> implements HasPage {
  pageID?: string
  page?: Page
}

@ObjectType({
  implements: () => [BaseTeaser, HasEvent]
})
export class EventTeaser extends BaseTeaser<TeaserType.Event> implements HasEvent {
  eventID?: string
  event?: Event
}

@ObjectType({
  implements: () => [BaseTeaser]
})
export class CustomTeaser extends BaseTeaser<TeaserType.Custom> {
  @Field({nullable: true})
  contentUrl?: string

  @Field(() => [Property], {defaultValue: []})
  properties!: Property[]
}

export const Teaser = createUnionType({
  name: 'Teaser',
  types: () => [ArticleTeaser, PeerArticleTeaser, PageTeaser, EventTeaser, CustomTeaser] as const,
  resolveType: (value: BaseTeaser<any>) => {
    switch (value.type) {
      case TeaserType.Article:
        return ArticleTeaser.name
      case TeaserType.PeerArticle:
        return PeerArticleTeaser.name
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
