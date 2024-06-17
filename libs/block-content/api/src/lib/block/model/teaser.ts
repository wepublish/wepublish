import {createUnionType, Field, ID, InputType, ObjectType, registerEnumType} from '@nestjs/graphql'
import {Image} from '@wepublish/image/api'

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

// Objects

@ObjectType()
export class ArticleTeaser {
  @Field(() => TeaserStyle)
  style!: TeaserStyle

  @Field(() => Image, {nullable: true})
  image?: Image

  @Field(() => String, {nullable: true})
  preTitle?: string

  @Field(() => String, {nullable: true})
  title?: string

  @Field(() => String, {nullable: true})
  lead?: string

  // @Field(() => Article)
  // article!: Article;
}

@ObjectType()
export class PeerArticleTeaser {
  @Field(() => TeaserStyle)
  style!: TeaserStyle

  @Field(() => Image, {nullable: true})
  image?: Image

  @Field(() => String, {nullable: true})
  preTitle?: string

  @Field(() => String, {nullable: true})
  title?: string

  @Field(() => String, {nullable: true})
  lead?: string

  // @Field(() => Peer)
  // peer!: Peer;

  @Field(() => ID)
  articleID!: string

  // @Field(() => Article)
  // article!: Article;
}

@ObjectType()
export class PageTeaser {
  @Field(() => TeaserStyle)
  style!: TeaserStyle

  @Field(() => Image, {nullable: true})
  image?: Image

  @Field(() => String, {nullable: true})
  preTitle?: string

  @Field(() => String, {nullable: true})
  title?: string

  @Field(() => String, {nullable: true})
  lead?: string

  // @Field(() => Page)
  // page!: Page;
}

@ObjectType()
export class EventTeaser {
  @Field(() => TeaserStyle)
  style!: TeaserStyle

  @Field(() => Image, {nullable: true})
  image?: Image

  @Field(() => String, {nullable: true})
  preTitle?: string

  @Field(() => String, {nullable: true})
  title?: string

  @Field(() => String, {nullable: true})
  lead?: string

  @Field(() => Event)
  event!: Event
}

@ObjectType()
export class CustomTeaser {
  @Field(() => TeaserStyle)
  style!: TeaserStyle

  @Field(() => Image, {nullable: true})
  image?: Image

  @Field(() => String, {nullable: true})
  preTitle?: string

  @Field(() => String, {nullable: true})
  title?: string

  @Field(() => String, {nullable: true})
  lead?: string

  @Field(() => String, {nullable: true})
  contentUrl?: string

  // @Field(() => [Property])
  // properties!: Property[];
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
export class ArticleTeaserInput {
  @Field(() => TeaserStyle, {nullable: true})
  style?: TeaserStyle

  @Field(() => ID, {nullable: true})
  imageID?: string

  @Field(() => String, {nullable: true})
  preTitle?: string

  @Field(() => String, {nullable: true})
  title?: string

  @Field(() => String, {nullable: true})
  lead?: string

  @Field(() => ID)
  articleID!: string
}

@InputType()
export class PeerArticleTeaserInput {
  @Field(() => TeaserStyle, {nullable: true})
  style?: TeaserStyle

  @Field(() => ID, {nullable: true})
  imageID?: string

  @Field(() => String, {nullable: true})
  preTitle?: string

  @Field(() => String, {nullable: true})
  title?: string

  @Field(() => String, {nullable: true})
  lead?: string

  @Field(() => ID)
  peerID!: string

  @Field(() => ID)
  articleID!: string
}

@InputType()
export class PageTeaserInput {
  @Field(() => TeaserStyle, {nullable: true})
  style?: TeaserStyle

  @Field(() => ID, {nullable: true})
  imageID?: string

  @Field(() => String, {nullable: true})
  preTitle?: string

  @Field(() => String, {nullable: true})
  title?: string

  @Field(() => String, {nullable: true})
  lead?: string

  @Field(() => ID)
  pageID!: string
}

@InputType()
export class EventTeaserInput {
  @Field(() => TeaserStyle, {nullable: true})
  style?: TeaserStyle

  @Field(() => ID, {nullable: true})
  imageID?: string

  @Field(() => String, {nullable: true})
  preTitle?: string

  @Field(() => String, {nullable: true})
  title?: string

  @Field(() => String, {nullable: true})
  lead?: string

  @Field(() => ID)
  eventID!: string
}

@InputType()
export class CustomTeaserInput {
  @Field(() => TeaserStyle, {nullable: true})
  style?: TeaserStyle

  @Field(() => ID, {nullable: true})
  imageID?: string

  @Field(() => String, {nullable: true})
  preTitle?: string

  @Field(() => String, {nullable: true})
  title?: string

  @Field(() => String, {nullable: true})
  lead?: string

  @Field(() => String, {nullable: true})
  contentUrl?: string

  // @Field(() => [Property])
  // properties!: Property[];
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
