import {
  Field,
  ObjectType,
  InputType,
  InterfaceType,
  OmitType,
  registerEnumType,
  ArgsType,
} from '@nestjs/graphql';
import { Article, HasArticle } from '@wepublish/article/api';
import { HasPage, Page } from '@wepublish/page/api';

export enum NavigationLinkType {
  Page = 'page',
  Article = 'article',
  External = 'external',
}

registerEnumType(NavigationLinkType, {
  name: 'NavigationLinkType',
});

@ObjectType()
export class Navigation {
  @Field()
  id!: string;

  @Field()
  createdAt!: Date;

  @Field()
  modifiedAt!: Date;

  @Field()
  key!: string;

  @Field(() => [BaseNavigationLink])
  links!: BaseNavigationLink[];

  @Field()
  name!: string;
}

@InterfaceType({
  isAbstract: true,
  resolveType(value: BaseNavigationLink) {
    switch (value.type.toLowerCase()) {
      case NavigationLinkType.Article:
        return ArticleNavigationLink;
      case NavigationLinkType.Page:
        return PageNavigationLink;
      case NavigationLinkType.External:
        return ExternalNavigationLink;
      default:
        return null;
    }
  },
})
export abstract class BaseNavigationLink {
  @Field()
  id!: string;

  @Field()
  createdAt!: Date;

  @Field()
  modifiedAt!: Date;

  @Field()
  label!: string;

  @Field(() => NavigationLinkType)
  type!: NavigationLinkType;
}

@ObjectType({ implements: () => [BaseNavigationLink, HasArticle] })
export class ArticleNavigationLink
  extends BaseNavigationLink
  implements HasArticle
{
  articleID!: string;
  article!: Article;
}

@ObjectType({ implements: () => [BaseNavigationLink, HasPage] })
export class PageNavigationLink extends BaseNavigationLink implements HasPage {
  pageID!: string;
  page!: Page;
}

@ObjectType({ implements: () => BaseNavigationLink })
export class ExternalNavigationLink extends BaseNavigationLink {
  @Field({ nullable: true })
  url?: string;
}

@InputType()
export class NavigationLinkInput {
  @Field()
  label!: string;

  @Field()
  type!: string;

  @Field({ nullable: true })
  url?: string;

  @Field({ nullable: true })
  pageID?: string;

  @Field({ nullable: true })
  articleID?: string;
}

@ArgsType()
export class UpdateNavigationInput extends OmitType(
  Navigation,
  ['createdAt', 'modifiedAt', 'links'],
  ArgsType
) {
  @Field(() => [NavigationLinkInput])
  links!: NavigationLinkInput[];
}

@ArgsType()
export class CreateNavigationInput extends OmitType(
  UpdateNavigationInput,
  ['id'],
  ArgsType
) {}
