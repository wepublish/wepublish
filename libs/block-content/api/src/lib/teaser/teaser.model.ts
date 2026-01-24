import {
  createUnionType,
  Field,
  InputType,
  InterfaceType,
  ObjectType,
  OmitType,
  registerEnumType,
} from '@nestjs/graphql';
import { Article, HasOptionalArticle } from '@wepublish/article/api';
import { HasOptionalPage, Page } from '@wepublish/page/api';
import { HasImage } from '@wepublish/image/api';
import { Event, HasOptionalEvent } from '@wepublish/event/api';
import { Property, PropertyInput } from '@wepublish/property/api';

export enum TeaserType {
  Article = 'article',
  Page = 'page',
  Event = 'event',
  Custom = 'custom',
}

registerEnumType(TeaserType, {
  name: 'TeaserType',
});

@InterfaceType({
  implements: () => [HasImage],
})
export abstract class BaseTeaser<Type extends TeaserType> extends HasImage {
  @Field(() => String)
  type!: Type;

  @Field({ nullable: true })
  preTitle?: string;
  @Field({ nullable: true })
  title?: string;
  @Field({ nullable: true })
  lead?: string;
}

@ObjectType({
  implements: () => [BaseTeaser, HasOptionalArticle],
})
export class ArticleTeaser
  extends BaseTeaser<TeaserType.Article>
  implements HasOptionalArticle
{
  articleID?: string;
  article?: Article;
}

@InputType()
export class ArticleTeaserInput extends OmitType(
  ArticleTeaser,
  ['article', 'image', 'type'] as const,
  InputType
) {
  @Field({ nullable: true })
  override articleID?: string;
}

@ObjectType({
  implements: () => [BaseTeaser, HasOptionalPage],
})
export class PageTeaser
  extends BaseTeaser<TeaserType.Page>
  implements HasOptionalPage
{
  pageID?: string;
  page?: Page;
}

@InputType()
export class PageTeaserInput extends OmitType(
  PageTeaser,
  ['page', 'image', 'type'] as const,
  InputType
) {
  @Field({ nullable: true })
  override pageID?: string;
}

@ObjectType({
  implements: () => [BaseTeaser, HasOptionalEvent],
})
export class EventTeaser
  extends BaseTeaser<TeaserType.Event>
  implements HasOptionalEvent
{
  eventID?: string;
  event?: Event;
}

@InputType()
export class EventTeaserInput extends OmitType(
  EventTeaser,
  ['event', 'image', 'type'] as const,
  InputType
) {
  @Field({ nullable: true })
  override eventID?: string;
}

@ObjectType()
export class NonDbProperty extends OmitType(
  Property,
  ['id'] as const,
  ObjectType
) {}

@ObjectType({
  implements: () => [BaseTeaser],
})
export class CustomTeaser extends BaseTeaser<TeaserType.Custom> {
  @Field({ nullable: true })
  contentUrl?: string;

  @Field({ nullable: true })
  openInNewTab?: boolean;

  @Field(() => [NonDbProperty], { defaultValue: [], nullable: true })
  properties!: NonDbProperty[];
}

@InputType()
export class CustomTeaserInput extends OmitType(
  CustomTeaser,
  ['image', 'properties', 'type'] as const,
  InputType
) {
  @Field(() => [PropertyInput], { defaultValue: [], nullable: true })
  properties!: PropertyInput[];
}

export const Teaser = createUnionType({
  name: 'Teaser',
  types: () => [ArticleTeaser, PageTeaser, EventTeaser, CustomTeaser] as const,
  resolveType: (value: BaseTeaser<any>) => {
    switch (value.type) {
      case TeaserType.Article:
        return ArticleTeaser.name;
      case TeaserType.Page:
        return PageTeaser.name;
      case TeaserType.Event:
        return EventTeaser.name;
      case TeaserType.Custom:
        return CustomTeaser.name;
    }

    console.warn(`Teaser ${value.type} not implemented!`);
    return CustomTeaser.name;
  },
});

@InputType()
export class TeaserInput {
  @Field(() => ArticleTeaserInput, { nullable: true })
  [TeaserType.Article]?: ArticleTeaserInput;
  @Field(() => PageTeaserInput, { nullable: true })
  [TeaserType.Page]?: PageTeaserInput;
  @Field(() => EventTeaserInput, { nullable: true })
  [TeaserType.Event]?: EventTeaserInput;
  @Field(() => CustomTeaserInput, { nullable: true })
  [TeaserType.Custom]?: CustomTeaserInput;
}

export function mapTeaserUnionMap(
  value: TeaserInput | null | undefined
): typeof Teaser | null {
  if (!value) {
    return null;
  }

  const valueKeys = Object.keys(value) as TeaserType[];

  if (valueKeys.length === 0) {
    throw new Error(`Received no teaser types.`);
  }

  if (valueKeys.length > 1) {
    throw new Error(
      `Received multiple teaser types (${JSON.stringify(
        valueKeys
      )}), they're mutually exclusive.`
    );
  }

  const type = valueKeys[0];
  const teaserValue = value[type];

  return { type, ...teaserValue } as typeof Teaser;
}
