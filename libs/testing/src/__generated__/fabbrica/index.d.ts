import type { MetadataProperty } from "@prisma/client";
import type { ArticleRevision } from "@prisma/client";
import type { ArticleRevisionAuthor } from "@prisma/client";
import type { ArticleRevisionSocialMediaAuthor } from "@prisma/client";
import type { Article } from "@prisma/client";
import type { TaggedArticles } from "@prisma/client";
import type { AuthorsLinks } from "@prisma/client";
import type { Author } from "@prisma/client";
import type { TaggedAuthors } from "@prisma/client";
import type { FocalPoint } from "@prisma/client";
import type { Image } from "@prisma/client";
import type { CommentsRevisions } from "@prisma/client";
import type { Comment } from "@prisma/client";
import type { TaggedComments } from "@prisma/client";
import type { CommentRatingSystem } from "@prisma/client";
import type { CommentRatingSystemAnswer } from "@prisma/client";
import type { CommentRating } from "@prisma/client";
import type { CommentRatingOverride } from "@prisma/client";
import type { InvoiceItem } from "@prisma/client";
import type { Invoice } from "@prisma/client";
import type { MailLog } from "@prisma/client";
import type { AvailablePaymentMethod } from "@prisma/client";
import type { MemberPlan } from "@prisma/client";
import type { NavigationLink } from "@prisma/client";
import type { Navigation } from "@prisma/client";
import type { PageRevision } from "@prisma/client";
import type { Page } from "@prisma/client";
import type { TaggedPages } from "@prisma/client";
import type { PaymentMethod } from "@prisma/client";
import type { Payment } from "@prisma/client";
import type { PeerProfile } from "@prisma/client";
import type { Peer } from "@prisma/client";
import type { Token } from "@prisma/client";
import type { Session } from "@prisma/client";
import type { SubscriptionPeriod } from "@prisma/client";
import type { SubscriptionDeactivation } from "@prisma/client";
import type { Subscription } from "@prisma/client";
import type { UserAddress } from "@prisma/client";
import type { UserOAuth2Account } from "@prisma/client";
import type { PaymentProviderCustomer } from "@prisma/client";
import type { User } from "@prisma/client";
import type { UserRole } from "@prisma/client";
import type { Setting } from "@prisma/client";
import type { Tag } from "@prisma/client";
import type { Poll } from "@prisma/client";
import type { PollAnswer } from "@prisma/client";
import type { PollVote } from "@prisma/client";
import type { PollExternalVoteSource } from "@prisma/client";
import type { PollExternalVote } from "@prisma/client";
import type { Event } from "@prisma/client";
import type { TaggedEvents } from "@prisma/client";
import type { Consent } from "@prisma/client";
import type { UserConsent } from "@prisma/client";
import type { UserFlowMail } from "@prisma/client";
import type { SubscriptionFlow } from "@prisma/client";
import type { SubscriptionInterval } from "@prisma/client";
import type { MailTemplate } from "@prisma/client";
import type { PeriodicJob } from "@prisma/client";
import type { BlockStyle } from "@prisma/client";
import type { CommentItemType } from "@prisma/client";
import type { CommentRejectionReason } from "@prisma/client";
import type { CommentState } from "@prisma/client";
import type { CommentAuthorType } from "@prisma/client";
import type { RatingSystemType } from "@prisma/client";
import type { MailLogState } from "@prisma/client";
import type { PaymentPeriodicity } from "@prisma/client";
import type { PaymentState } from "@prisma/client";
import type { SubscriptionDeactivationReason } from "@prisma/client";
import type { TagType } from "@prisma/client";
import type { EventStatus } from "@prisma/client";
import type { UserEvent } from "@prisma/client";
import type { SubscriptionEvent } from "@prisma/client";
import type { BlockType } from "@prisma/client";
import { Prisma } from "@prisma/client";
import { Resolver } from "@quramy/prisma-fabbrica/lib/internal";
export { initialize, resetSequence, registerScalarFieldValueGenerator, resetScalarFieldValueGenerator } from "@quramy/prisma-fabbrica/lib/internal";
type BuildDataOptions = {
    readonly seq: number;
};
type MetadataPropertyArticleRevisionFactory = {
    _factoryFor: "ArticleRevision";
    build: () => PromiseLike<Prisma.ArticleRevisionCreateNestedOneWithoutPropertiesInput["create"]>;
};
type MetadataPropertyPageRevisionFactory = {
    _factoryFor: "PageRevision";
    build: () => PromiseLike<Prisma.PageRevisionCreateNestedOneWithoutPropertiesInput["create"]>;
};
type MetadataPropertySubscriptionFactory = {
    _factoryFor: "Subscription";
    build: () => PromiseLike<Prisma.SubscriptionCreateNestedOneWithoutPropertiesInput["create"]>;
};
type MetadataPropertyUserFactory = {
    _factoryFor: "User";
    build: () => PromiseLike<Prisma.UserCreateNestedOneWithoutPropertiesInput["create"]>;
};
type MetadataPropertyFactoryDefineInput = {
    id?: string;
    createdAt?: Date;
    modifiedAt?: Date;
    key?: string;
    value?: string;
    public?: boolean;
    ArticleRevision?: MetadataPropertyArticleRevisionFactory | Prisma.ArticleRevisionCreateNestedOneWithoutPropertiesInput;
    PageRevision?: MetadataPropertyPageRevisionFactory | Prisma.PageRevisionCreateNestedOneWithoutPropertiesInput;
    Subscription?: MetadataPropertySubscriptionFactory | Prisma.SubscriptionCreateNestedOneWithoutPropertiesInput;
    User?: MetadataPropertyUserFactory | Prisma.UserCreateNestedOneWithoutPropertiesInput;
};
type MetadataPropertyFactoryDefineOptions = {
    defaultData?: Resolver<MetadataPropertyFactoryDefineInput, BuildDataOptions>;
    traits?: {
        [traitName: string | symbol]: {
            data: Resolver<Partial<MetadataPropertyFactoryDefineInput>, BuildDataOptions>;
        };
    };
};
type MetadataPropertyTraitKeys<TOptions extends MetadataPropertyFactoryDefineOptions> = keyof TOptions["traits"];
export interface MetadataPropertyFactoryInterfaceWithoutTraits {
    readonly _factoryFor: "MetadataProperty";
    build(inputData?: Partial<Prisma.MetadataPropertyCreateInput>): PromiseLike<Prisma.MetadataPropertyCreateInput>;
    buildCreateInput(inputData?: Partial<Prisma.MetadataPropertyCreateInput>): PromiseLike<Prisma.MetadataPropertyCreateInput>;
    buildList(inputData: number | readonly Partial<Prisma.MetadataPropertyCreateInput>[]): PromiseLike<Prisma.MetadataPropertyCreateInput[]>;
    pickForConnect(inputData: MetadataProperty): Pick<MetadataProperty, "id">;
    create(inputData?: Partial<Prisma.MetadataPropertyCreateInput>): PromiseLike<MetadataProperty>;
    createList(inputData: number | readonly Partial<Prisma.MetadataPropertyCreateInput>[]): PromiseLike<MetadataProperty[]>;
    createForConnect(inputData?: Partial<Prisma.MetadataPropertyCreateInput>): PromiseLike<Pick<MetadataProperty, "id">>;
}
export interface MetadataPropertyFactoryInterface<TOptions extends MetadataPropertyFactoryDefineOptions = MetadataPropertyFactoryDefineOptions> extends MetadataPropertyFactoryInterfaceWithoutTraits {
    use(name: MetadataPropertyTraitKeys<TOptions>, ...names: readonly MetadataPropertyTraitKeys<TOptions>[]): MetadataPropertyFactoryInterfaceWithoutTraits;
}
/**
 * Define factory for {@link MetadataProperty} model.
 *
 * @param options
 * @returns factory {@link MetadataPropertyFactoryInterface}
 */
export declare function defineMetadataPropertyFactory<TOptions extends MetadataPropertyFactoryDefineOptions>(options?: TOptions): MetadataPropertyFactoryInterface<TOptions>;
type ArticleRevisionimageFactory = {
    _factoryFor: "Image";
    build: () => PromiseLike<Prisma.ImageCreateNestedOneWithoutArticleRevisionImagesInput["create"]>;
};
type ArticleRevisionsocialMediaImageFactory = {
    _factoryFor: "Image";
    build: () => PromiseLike<Prisma.ImageCreateNestedOneWithoutArticleRevisionSocialMediaImagesInput["create"]>;
};
type ArticleRevisionFactoryDefineInput = {
    id?: string;
    preTitle?: string | null;
    title?: string | null;
    lead?: string | null;
    seoTitle?: string | null;
    slug?: string | null;
    tags?: Prisma.ArticleRevisionCreatetagsInput | Prisma.Enumerable<string>;
    canonicalUrl?: string | null;
    breaking?: boolean;
    blocks?: Prisma.JsonNullValueInput | Prisma.InputJsonValue;
    hideAuthor?: boolean;
    socialMediaTitle?: string | null;
    socialMediaDescription?: string | null;
    revision?: number;
    createdAt?: Date;
    modifiedAt?: Date | null;
    updatedAt?: Date | null;
    publishAt?: Date | null;
    publishedAt?: Date | null;
    properties?: Prisma.MetadataPropertyCreateNestedManyWithoutArticleRevisionInput;
    image?: ArticleRevisionimageFactory | Prisma.ImageCreateNestedOneWithoutArticleRevisionImagesInput;
    authors?: Prisma.ArticleRevisionAuthorCreateNestedManyWithoutRevisionInput;
    socialMediaAuthors?: Prisma.ArticleRevisionSocialMediaAuthorCreateNestedManyWithoutRevisionInput;
    socialMediaImage?: ArticleRevisionsocialMediaImageFactory | Prisma.ImageCreateNestedOneWithoutArticleRevisionSocialMediaImagesInput;
    PublishedArticle?: Prisma.ArticleCreateNestedManyWithoutPublishedInput;
    PendingArticle?: Prisma.ArticleCreateNestedManyWithoutPendingInput;
    DraftArticle?: Prisma.ArticleCreateNestedManyWithoutDraftInput;
};
type ArticleRevisionFactoryDefineOptions = {
    defaultData?: Resolver<ArticleRevisionFactoryDefineInput, BuildDataOptions>;
    traits?: {
        [traitName: string | symbol]: {
            data: Resolver<Partial<ArticleRevisionFactoryDefineInput>, BuildDataOptions>;
        };
    };
};
type ArticleRevisionTraitKeys<TOptions extends ArticleRevisionFactoryDefineOptions> = keyof TOptions["traits"];
export interface ArticleRevisionFactoryInterfaceWithoutTraits {
    readonly _factoryFor: "ArticleRevision";
    build(inputData?: Partial<Prisma.ArticleRevisionCreateInput>): PromiseLike<Prisma.ArticleRevisionCreateInput>;
    buildCreateInput(inputData?: Partial<Prisma.ArticleRevisionCreateInput>): PromiseLike<Prisma.ArticleRevisionCreateInput>;
    buildList(inputData: number | readonly Partial<Prisma.ArticleRevisionCreateInput>[]): PromiseLike<Prisma.ArticleRevisionCreateInput[]>;
    pickForConnect(inputData: ArticleRevision): Pick<ArticleRevision, "id">;
    create(inputData?: Partial<Prisma.ArticleRevisionCreateInput>): PromiseLike<ArticleRevision>;
    createList(inputData: number | readonly Partial<Prisma.ArticleRevisionCreateInput>[]): PromiseLike<ArticleRevision[]>;
    createForConnect(inputData?: Partial<Prisma.ArticleRevisionCreateInput>): PromiseLike<Pick<ArticleRevision, "id">>;
}
export interface ArticleRevisionFactoryInterface<TOptions extends ArticleRevisionFactoryDefineOptions = ArticleRevisionFactoryDefineOptions> extends ArticleRevisionFactoryInterfaceWithoutTraits {
    use(name: ArticleRevisionTraitKeys<TOptions>, ...names: readonly ArticleRevisionTraitKeys<TOptions>[]): ArticleRevisionFactoryInterfaceWithoutTraits;
}
/**
 * Define factory for {@link ArticleRevision} model.
 *
 * @param options
 * @returns factory {@link ArticleRevisionFactoryInterface}
 */
export declare function defineArticleRevisionFactory<TOptions extends ArticleRevisionFactoryDefineOptions>(options?: TOptions): ArticleRevisionFactoryInterface<TOptions>;
type ArticleRevisionAuthorrevisionFactory = {
    _factoryFor: "ArticleRevision";
    build: () => PromiseLike<Prisma.ArticleRevisionCreateNestedOneWithoutAuthorsInput["create"]>;
};
type ArticleRevisionAuthorauthorFactory = {
    _factoryFor: "Author";
    build: () => PromiseLike<Prisma.AuthorCreateNestedOneWithoutArticlesAsAuthorInput["create"]>;
};
type ArticleRevisionAuthorFactoryDefineInput = {
    revision: ArticleRevisionAuthorrevisionFactory | Prisma.ArticleRevisionCreateNestedOneWithoutAuthorsInput;
    author: ArticleRevisionAuthorauthorFactory | Prisma.AuthorCreateNestedOneWithoutArticlesAsAuthorInput;
};
type ArticleRevisionAuthorFactoryDefineOptions = {
    defaultData: Resolver<ArticleRevisionAuthorFactoryDefineInput, BuildDataOptions>;
    traits?: {
        [traitName: string | symbol]: {
            data: Resolver<Partial<ArticleRevisionAuthorFactoryDefineInput>, BuildDataOptions>;
        };
    };
};
type ArticleRevisionAuthorTraitKeys<TOptions extends ArticleRevisionAuthorFactoryDefineOptions> = keyof TOptions["traits"];
export interface ArticleRevisionAuthorFactoryInterfaceWithoutTraits {
    readonly _factoryFor: "ArticleRevisionAuthor";
    build(inputData?: Partial<Prisma.ArticleRevisionAuthorCreateInput>): PromiseLike<Prisma.ArticleRevisionAuthorCreateInput>;
    buildCreateInput(inputData?: Partial<Prisma.ArticleRevisionAuthorCreateInput>): PromiseLike<Prisma.ArticleRevisionAuthorCreateInput>;
    buildList(inputData: number | readonly Partial<Prisma.ArticleRevisionAuthorCreateInput>[]): PromiseLike<Prisma.ArticleRevisionAuthorCreateInput[]>;
    pickForConnect(inputData: ArticleRevisionAuthor): Pick<ArticleRevisionAuthor, "revisionId" | "authorId">;
    create(inputData?: Partial<Prisma.ArticleRevisionAuthorCreateInput>): PromiseLike<ArticleRevisionAuthor>;
    createList(inputData: number | readonly Partial<Prisma.ArticleRevisionAuthorCreateInput>[]): PromiseLike<ArticleRevisionAuthor[]>;
    createForConnect(inputData?: Partial<Prisma.ArticleRevisionAuthorCreateInput>): PromiseLike<Pick<ArticleRevisionAuthor, "revisionId" | "authorId">>;
}
export interface ArticleRevisionAuthorFactoryInterface<TOptions extends ArticleRevisionAuthorFactoryDefineOptions = ArticleRevisionAuthorFactoryDefineOptions> extends ArticleRevisionAuthorFactoryInterfaceWithoutTraits {
    use(name: ArticleRevisionAuthorTraitKeys<TOptions>, ...names: readonly ArticleRevisionAuthorTraitKeys<TOptions>[]): ArticleRevisionAuthorFactoryInterfaceWithoutTraits;
}
/**
 * Define factory for {@link ArticleRevisionAuthor} model.
 *
 * @param options
 * @returns factory {@link ArticleRevisionAuthorFactoryInterface}
 */
export declare function defineArticleRevisionAuthorFactory<TOptions extends ArticleRevisionAuthorFactoryDefineOptions>(options: TOptions): ArticleRevisionAuthorFactoryInterface<TOptions>;
type ArticleRevisionSocialMediaAuthorrevisionFactory = {
    _factoryFor: "ArticleRevision";
    build: () => PromiseLike<Prisma.ArticleRevisionCreateNestedOneWithoutSocialMediaAuthorsInput["create"]>;
};
type ArticleRevisionSocialMediaAuthorauthorFactory = {
    _factoryFor: "Author";
    build: () => PromiseLike<Prisma.AuthorCreateNestedOneWithoutArticlesAsSocialMediaAuthorInput["create"]>;
};
type ArticleRevisionSocialMediaAuthorFactoryDefineInput = {
    revision: ArticleRevisionSocialMediaAuthorrevisionFactory | Prisma.ArticleRevisionCreateNestedOneWithoutSocialMediaAuthorsInput;
    author: ArticleRevisionSocialMediaAuthorauthorFactory | Prisma.AuthorCreateNestedOneWithoutArticlesAsSocialMediaAuthorInput;
};
type ArticleRevisionSocialMediaAuthorFactoryDefineOptions = {
    defaultData: Resolver<ArticleRevisionSocialMediaAuthorFactoryDefineInput, BuildDataOptions>;
    traits?: {
        [traitName: string | symbol]: {
            data: Resolver<Partial<ArticleRevisionSocialMediaAuthorFactoryDefineInput>, BuildDataOptions>;
        };
    };
};
type ArticleRevisionSocialMediaAuthorTraitKeys<TOptions extends ArticleRevisionSocialMediaAuthorFactoryDefineOptions> = keyof TOptions["traits"];
export interface ArticleRevisionSocialMediaAuthorFactoryInterfaceWithoutTraits {
    readonly _factoryFor: "ArticleRevisionSocialMediaAuthor";
    build(inputData?: Partial<Prisma.ArticleRevisionSocialMediaAuthorCreateInput>): PromiseLike<Prisma.ArticleRevisionSocialMediaAuthorCreateInput>;
    buildCreateInput(inputData?: Partial<Prisma.ArticleRevisionSocialMediaAuthorCreateInput>): PromiseLike<Prisma.ArticleRevisionSocialMediaAuthorCreateInput>;
    buildList(inputData: number | readonly Partial<Prisma.ArticleRevisionSocialMediaAuthorCreateInput>[]): PromiseLike<Prisma.ArticleRevisionSocialMediaAuthorCreateInput[]>;
    pickForConnect(inputData: ArticleRevisionSocialMediaAuthor): Pick<ArticleRevisionSocialMediaAuthor, "revisionId" | "authorId">;
    create(inputData?: Partial<Prisma.ArticleRevisionSocialMediaAuthorCreateInput>): PromiseLike<ArticleRevisionSocialMediaAuthor>;
    createList(inputData: number | readonly Partial<Prisma.ArticleRevisionSocialMediaAuthorCreateInput>[]): PromiseLike<ArticleRevisionSocialMediaAuthor[]>;
    createForConnect(inputData?: Partial<Prisma.ArticleRevisionSocialMediaAuthorCreateInput>): PromiseLike<Pick<ArticleRevisionSocialMediaAuthor, "revisionId" | "authorId">>;
}
export interface ArticleRevisionSocialMediaAuthorFactoryInterface<TOptions extends ArticleRevisionSocialMediaAuthorFactoryDefineOptions = ArticleRevisionSocialMediaAuthorFactoryDefineOptions> extends ArticleRevisionSocialMediaAuthorFactoryInterfaceWithoutTraits {
    use(name: ArticleRevisionSocialMediaAuthorTraitKeys<TOptions>, ...names: readonly ArticleRevisionSocialMediaAuthorTraitKeys<TOptions>[]): ArticleRevisionSocialMediaAuthorFactoryInterfaceWithoutTraits;
}
/**
 * Define factory for {@link ArticleRevisionSocialMediaAuthor} model.
 *
 * @param options
 * @returns factory {@link ArticleRevisionSocialMediaAuthorFactoryInterface}
 */
export declare function defineArticleRevisionSocialMediaAuthorFactory<TOptions extends ArticleRevisionSocialMediaAuthorFactoryDefineOptions>(options: TOptions): ArticleRevisionSocialMediaAuthorFactoryInterface<TOptions>;
type ArticlepublishedFactory = {
    _factoryFor: "ArticleRevision";
    build: () => PromiseLike<Prisma.ArticleRevisionCreateNestedOneWithoutPublishedArticleInput["create"]>;
};
type ArticlependingFactory = {
    _factoryFor: "ArticleRevision";
    build: () => PromiseLike<Prisma.ArticleRevisionCreateNestedOneWithoutPendingArticleInput["create"]>;
};
type ArticledraftFactory = {
    _factoryFor: "ArticleRevision";
    build: () => PromiseLike<Prisma.ArticleRevisionCreateNestedOneWithoutDraftArticleInput["create"]>;
};
type ArticleFactoryDefineInput = {
    id?: string;
    createdAt?: Date;
    modifiedAt?: Date;
    shared?: boolean;
    hidden?: boolean;
    published?: ArticlepublishedFactory | Prisma.ArticleRevisionCreateNestedOneWithoutPublishedArticleInput;
    pending?: ArticlependingFactory | Prisma.ArticleRevisionCreateNestedOneWithoutPendingArticleInput;
    draft?: ArticledraftFactory | Prisma.ArticleRevisionCreateNestedOneWithoutDraftArticleInput;
    navigations?: Prisma.NavigationLinkCreateNestedManyWithoutArticleInput;
    tags?: Prisma.TaggedArticlesCreateNestedManyWithoutArticleInput;
};
type ArticleFactoryDefineOptions = {
    defaultData?: Resolver<ArticleFactoryDefineInput, BuildDataOptions>;
    traits?: {
        [traitName: string | symbol]: {
            data: Resolver<Partial<ArticleFactoryDefineInput>, BuildDataOptions>;
        };
    };
};
type ArticleTraitKeys<TOptions extends ArticleFactoryDefineOptions> = keyof TOptions["traits"];
export interface ArticleFactoryInterfaceWithoutTraits {
    readonly _factoryFor: "Article";
    build(inputData?: Partial<Prisma.ArticleCreateInput>): PromiseLike<Prisma.ArticleCreateInput>;
    buildCreateInput(inputData?: Partial<Prisma.ArticleCreateInput>): PromiseLike<Prisma.ArticleCreateInput>;
    buildList(inputData: number | readonly Partial<Prisma.ArticleCreateInput>[]): PromiseLike<Prisma.ArticleCreateInput[]>;
    pickForConnect(inputData: Article): Pick<Article, "id">;
    create(inputData?: Partial<Prisma.ArticleCreateInput>): PromiseLike<Article>;
    createList(inputData: number | readonly Partial<Prisma.ArticleCreateInput>[]): PromiseLike<Article[]>;
    createForConnect(inputData?: Partial<Prisma.ArticleCreateInput>): PromiseLike<Pick<Article, "id">>;
}
export interface ArticleFactoryInterface<TOptions extends ArticleFactoryDefineOptions = ArticleFactoryDefineOptions> extends ArticleFactoryInterfaceWithoutTraits {
    use(name: ArticleTraitKeys<TOptions>, ...names: readonly ArticleTraitKeys<TOptions>[]): ArticleFactoryInterfaceWithoutTraits;
}
/**
 * Define factory for {@link Article} model.
 *
 * @param options
 * @returns factory {@link ArticleFactoryInterface}
 */
export declare function defineArticleFactory<TOptions extends ArticleFactoryDefineOptions>(options?: TOptions): ArticleFactoryInterface<TOptions>;
type TaggedArticlesarticleFactory = {
    _factoryFor: "Article";
    build: () => PromiseLike<Prisma.ArticleCreateNestedOneWithoutTagsInput["create"]>;
};
type TaggedArticlestagFactory = {
    _factoryFor: "Tag";
    build: () => PromiseLike<Prisma.TagCreateNestedOneWithoutArticlesInput["create"]>;
};
type TaggedArticlesFactoryDefineInput = {
    createdAt?: Date;
    modifiedAt?: Date;
    article: TaggedArticlesarticleFactory | Prisma.ArticleCreateNestedOneWithoutTagsInput;
    tag: TaggedArticlestagFactory | Prisma.TagCreateNestedOneWithoutArticlesInput;
};
type TaggedArticlesFactoryDefineOptions = {
    defaultData: Resolver<TaggedArticlesFactoryDefineInput, BuildDataOptions>;
    traits?: {
        [traitName: string | symbol]: {
            data: Resolver<Partial<TaggedArticlesFactoryDefineInput>, BuildDataOptions>;
        };
    };
};
type TaggedArticlesTraitKeys<TOptions extends TaggedArticlesFactoryDefineOptions> = keyof TOptions["traits"];
export interface TaggedArticlesFactoryInterfaceWithoutTraits {
    readonly _factoryFor: "TaggedArticles";
    build(inputData?: Partial<Prisma.TaggedArticlesCreateInput>): PromiseLike<Prisma.TaggedArticlesCreateInput>;
    buildCreateInput(inputData?: Partial<Prisma.TaggedArticlesCreateInput>): PromiseLike<Prisma.TaggedArticlesCreateInput>;
    buildList(inputData: number | readonly Partial<Prisma.TaggedArticlesCreateInput>[]): PromiseLike<Prisma.TaggedArticlesCreateInput[]>;
    pickForConnect(inputData: TaggedArticles): Pick<TaggedArticles, "articleId" | "tagId">;
    create(inputData?: Partial<Prisma.TaggedArticlesCreateInput>): PromiseLike<TaggedArticles>;
    createList(inputData: number | readonly Partial<Prisma.TaggedArticlesCreateInput>[]): PromiseLike<TaggedArticles[]>;
    createForConnect(inputData?: Partial<Prisma.TaggedArticlesCreateInput>): PromiseLike<Pick<TaggedArticles, "articleId" | "tagId">>;
}
export interface TaggedArticlesFactoryInterface<TOptions extends TaggedArticlesFactoryDefineOptions = TaggedArticlesFactoryDefineOptions> extends TaggedArticlesFactoryInterfaceWithoutTraits {
    use(name: TaggedArticlesTraitKeys<TOptions>, ...names: readonly TaggedArticlesTraitKeys<TOptions>[]): TaggedArticlesFactoryInterfaceWithoutTraits;
}
/**
 * Define factory for {@link TaggedArticles} model.
 *
 * @param options
 * @returns factory {@link TaggedArticlesFactoryInterface}
 */
export declare function defineTaggedArticlesFactory<TOptions extends TaggedArticlesFactoryDefineOptions>(options: TOptions): TaggedArticlesFactoryInterface<TOptions>;
type AuthorsLinksAuthorFactory = {
    _factoryFor: "Author";
    build: () => PromiseLike<Prisma.AuthorCreateNestedOneWithoutLinksInput["create"]>;
};
type AuthorsLinksFactoryDefineInput = {
    id?: string;
    createdAt?: Date;
    modifiedAt?: Date;
    title?: string;
    url?: string;
    Author?: AuthorsLinksAuthorFactory | Prisma.AuthorCreateNestedOneWithoutLinksInput;
};
type AuthorsLinksFactoryDefineOptions = {
    defaultData?: Resolver<AuthorsLinksFactoryDefineInput, BuildDataOptions>;
    traits?: {
        [traitName: string | symbol]: {
            data: Resolver<Partial<AuthorsLinksFactoryDefineInput>, BuildDataOptions>;
        };
    };
};
type AuthorsLinksTraitKeys<TOptions extends AuthorsLinksFactoryDefineOptions> = keyof TOptions["traits"];
export interface AuthorsLinksFactoryInterfaceWithoutTraits {
    readonly _factoryFor: "AuthorsLinks";
    build(inputData?: Partial<Prisma.AuthorsLinksCreateInput>): PromiseLike<Prisma.AuthorsLinksCreateInput>;
    buildCreateInput(inputData?: Partial<Prisma.AuthorsLinksCreateInput>): PromiseLike<Prisma.AuthorsLinksCreateInput>;
    buildList(inputData: number | readonly Partial<Prisma.AuthorsLinksCreateInput>[]): PromiseLike<Prisma.AuthorsLinksCreateInput[]>;
    pickForConnect(inputData: AuthorsLinks): Pick<AuthorsLinks, "id">;
    create(inputData?: Partial<Prisma.AuthorsLinksCreateInput>): PromiseLike<AuthorsLinks>;
    createList(inputData: number | readonly Partial<Prisma.AuthorsLinksCreateInput>[]): PromiseLike<AuthorsLinks[]>;
    createForConnect(inputData?: Partial<Prisma.AuthorsLinksCreateInput>): PromiseLike<Pick<AuthorsLinks, "id">>;
}
export interface AuthorsLinksFactoryInterface<TOptions extends AuthorsLinksFactoryDefineOptions = AuthorsLinksFactoryDefineOptions> extends AuthorsLinksFactoryInterfaceWithoutTraits {
    use(name: AuthorsLinksTraitKeys<TOptions>, ...names: readonly AuthorsLinksTraitKeys<TOptions>[]): AuthorsLinksFactoryInterfaceWithoutTraits;
}
/**
 * Define factory for {@link AuthorsLinks} model.
 *
 * @param options
 * @returns factory {@link AuthorsLinksFactoryInterface}
 */
export declare function defineAuthorsLinksFactory<TOptions extends AuthorsLinksFactoryDefineOptions>(options?: TOptions): AuthorsLinksFactoryInterface<TOptions>;
type AuthorimageFactory = {
    _factoryFor: "Image";
    build: () => PromiseLike<Prisma.ImageCreateNestedOneWithoutAuthorInput["create"]>;
};
type AuthorFactoryDefineInput = {
    id?: string;
    createdAt?: Date;
    modifiedAt?: Date;
    name?: string;
    slug?: string;
    jobTitle?: string | null;
    bio?: Prisma.NullableJsonNullValueInput | Prisma.InputJsonValue;
    links?: Prisma.AuthorsLinksCreateNestedManyWithoutAuthorInput;
    image?: AuthorimageFactory | Prisma.ImageCreateNestedOneWithoutAuthorInput;
    articlesAsAuthor?: Prisma.ArticleRevisionAuthorCreateNestedManyWithoutAuthorInput;
    articlesAsSocialMediaAuthor?: Prisma.ArticleRevisionSocialMediaAuthorCreateNestedManyWithoutAuthorInput;
    tags?: Prisma.TaggedAuthorsCreateNestedManyWithoutAuthorInput;
};
type AuthorFactoryDefineOptions = {
    defaultData?: Resolver<AuthorFactoryDefineInput, BuildDataOptions>;
    traits?: {
        [traitName: string | symbol]: {
            data: Resolver<Partial<AuthorFactoryDefineInput>, BuildDataOptions>;
        };
    };
};
type AuthorTraitKeys<TOptions extends AuthorFactoryDefineOptions> = keyof TOptions["traits"];
export interface AuthorFactoryInterfaceWithoutTraits {
    readonly _factoryFor: "Author";
    build(inputData?: Partial<Prisma.AuthorCreateInput>): PromiseLike<Prisma.AuthorCreateInput>;
    buildCreateInput(inputData?: Partial<Prisma.AuthorCreateInput>): PromiseLike<Prisma.AuthorCreateInput>;
    buildList(inputData: number | readonly Partial<Prisma.AuthorCreateInput>[]): PromiseLike<Prisma.AuthorCreateInput[]>;
    pickForConnect(inputData: Author): Pick<Author, "id">;
    create(inputData?: Partial<Prisma.AuthorCreateInput>): PromiseLike<Author>;
    createList(inputData: number | readonly Partial<Prisma.AuthorCreateInput>[]): PromiseLike<Author[]>;
    createForConnect(inputData?: Partial<Prisma.AuthorCreateInput>): PromiseLike<Pick<Author, "id">>;
}
export interface AuthorFactoryInterface<TOptions extends AuthorFactoryDefineOptions = AuthorFactoryDefineOptions> extends AuthorFactoryInterfaceWithoutTraits {
    use(name: AuthorTraitKeys<TOptions>, ...names: readonly AuthorTraitKeys<TOptions>[]): AuthorFactoryInterfaceWithoutTraits;
}
/**
 * Define factory for {@link Author} model.
 *
 * @param options
 * @returns factory {@link AuthorFactoryInterface}
 */
export declare function defineAuthorFactory<TOptions extends AuthorFactoryDefineOptions>(options?: TOptions): AuthorFactoryInterface<TOptions>;
type TaggedAuthorsauthorFactory = {
    _factoryFor: "Author";
    build: () => PromiseLike<Prisma.AuthorCreateNestedOneWithoutTagsInput["create"]>;
};
type TaggedAuthorstagFactory = {
    _factoryFor: "Tag";
    build: () => PromiseLike<Prisma.TagCreateNestedOneWithoutAuthorsInput["create"]>;
};
type TaggedAuthorsFactoryDefineInput = {
    createdAt?: Date;
    modifiedAt?: Date;
    author: TaggedAuthorsauthorFactory | Prisma.AuthorCreateNestedOneWithoutTagsInput;
    tag: TaggedAuthorstagFactory | Prisma.TagCreateNestedOneWithoutAuthorsInput;
};
type TaggedAuthorsFactoryDefineOptions = {
    defaultData: Resolver<TaggedAuthorsFactoryDefineInput, BuildDataOptions>;
    traits?: {
        [traitName: string | symbol]: {
            data: Resolver<Partial<TaggedAuthorsFactoryDefineInput>, BuildDataOptions>;
        };
    };
};
type TaggedAuthorsTraitKeys<TOptions extends TaggedAuthorsFactoryDefineOptions> = keyof TOptions["traits"];
export interface TaggedAuthorsFactoryInterfaceWithoutTraits {
    readonly _factoryFor: "TaggedAuthors";
    build(inputData?: Partial<Prisma.TaggedAuthorsCreateInput>): PromiseLike<Prisma.TaggedAuthorsCreateInput>;
    buildCreateInput(inputData?: Partial<Prisma.TaggedAuthorsCreateInput>): PromiseLike<Prisma.TaggedAuthorsCreateInput>;
    buildList(inputData: number | readonly Partial<Prisma.TaggedAuthorsCreateInput>[]): PromiseLike<Prisma.TaggedAuthorsCreateInput[]>;
    pickForConnect(inputData: TaggedAuthors): Pick<TaggedAuthors, "authorId" | "tagId">;
    create(inputData?: Partial<Prisma.TaggedAuthorsCreateInput>): PromiseLike<TaggedAuthors>;
    createList(inputData: number | readonly Partial<Prisma.TaggedAuthorsCreateInput>[]): PromiseLike<TaggedAuthors[]>;
    createForConnect(inputData?: Partial<Prisma.TaggedAuthorsCreateInput>): PromiseLike<Pick<TaggedAuthors, "authorId" | "tagId">>;
}
export interface TaggedAuthorsFactoryInterface<TOptions extends TaggedAuthorsFactoryDefineOptions = TaggedAuthorsFactoryDefineOptions> extends TaggedAuthorsFactoryInterfaceWithoutTraits {
    use(name: TaggedAuthorsTraitKeys<TOptions>, ...names: readonly TaggedAuthorsTraitKeys<TOptions>[]): TaggedAuthorsFactoryInterfaceWithoutTraits;
}
/**
 * Define factory for {@link TaggedAuthors} model.
 *
 * @param options
 * @returns factory {@link TaggedAuthorsFactoryInterface}
 */
export declare function defineTaggedAuthorsFactory<TOptions extends TaggedAuthorsFactoryDefineOptions>(options: TOptions): TaggedAuthorsFactoryInterface<TOptions>;
type FocalPointimageFactory = {
    _factoryFor: "Image";
    build: () => PromiseLike<Prisma.ImageCreateNestedOneWithoutFocalPointInput["create"]>;
};
type FocalPointFactoryDefineInput = {
    x?: number | null;
    y?: number | null;
    image?: FocalPointimageFactory | Prisma.ImageCreateNestedOneWithoutFocalPointInput;
};
type FocalPointFactoryDefineOptions = {
    defaultData?: Resolver<FocalPointFactoryDefineInput, BuildDataOptions>;
    traits?: {
        [traitName: string | symbol]: {
            data: Resolver<Partial<FocalPointFactoryDefineInput>, BuildDataOptions>;
        };
    };
};
type FocalPointTraitKeys<TOptions extends FocalPointFactoryDefineOptions> = keyof TOptions["traits"];
export interface FocalPointFactoryInterfaceWithoutTraits {
    readonly _factoryFor: "FocalPoint";
    build(inputData?: Partial<Prisma.FocalPointCreateInput>): PromiseLike<Prisma.FocalPointCreateInput>;
    buildCreateInput(inputData?: Partial<Prisma.FocalPointCreateInput>): PromiseLike<Prisma.FocalPointCreateInput>;
    buildList(inputData: number | readonly Partial<Prisma.FocalPointCreateInput>[]): PromiseLike<Prisma.FocalPointCreateInput[]>;
    pickForConnect(inputData: FocalPoint): Pick<FocalPoint, "imageId">;
    create(inputData?: Partial<Prisma.FocalPointCreateInput>): PromiseLike<FocalPoint>;
    createList(inputData: number | readonly Partial<Prisma.FocalPointCreateInput>[]): PromiseLike<FocalPoint[]>;
    createForConnect(inputData?: Partial<Prisma.FocalPointCreateInput>): PromiseLike<Pick<FocalPoint, "imageId">>;
}
export interface FocalPointFactoryInterface<TOptions extends FocalPointFactoryDefineOptions = FocalPointFactoryDefineOptions> extends FocalPointFactoryInterfaceWithoutTraits {
    use(name: FocalPointTraitKeys<TOptions>, ...names: readonly FocalPointTraitKeys<TOptions>[]): FocalPointFactoryInterfaceWithoutTraits;
}
/**
 * Define factory for {@link FocalPoint} model.
 *
 * @param options
 * @returns factory {@link FocalPointFactoryInterface}
 */
export declare function defineFocalPointFactory<TOptions extends FocalPointFactoryDefineOptions>(options?: TOptions): FocalPointFactoryInterface<TOptions>;
type ImagefocalPointFactory = {
    _factoryFor: "FocalPoint";
    build: () => PromiseLike<Prisma.FocalPointCreateNestedOneWithoutImageInput["create"]>;
};
type ImageFactoryDefineInput = {
    id?: string;
    createdAt?: Date;
    description?: string | null;
    extension?: string;
    fileSize?: number;
    filename?: string | null;
    format?: string;
    license?: string | null;
    link?: string | null;
    mimeType?: string;
    modifiedAt?: Date;
    source?: string | null;
    tags?: Prisma.ImageCreatetagsInput | Prisma.Enumerable<string>;
    title?: string | null;
    height?: number;
    width?: number;
    focalPoint?: ImagefocalPointFactory | Prisma.FocalPointCreateNestedOneWithoutImageInput;
    Author?: Prisma.AuthorCreateNestedManyWithoutImageInput;
    MemberPlan?: Prisma.MemberPlanCreateNestedManyWithoutImageInput;
    PeerProfile?: Prisma.PeerProfileCreateNestedManyWithoutLogoInput;
    Comment?: Prisma.CommentCreateNestedManyWithoutGuestUserImageInput;
    articleRevisionSocialMediaImages?: Prisma.ArticleRevisionCreateNestedManyWithoutSocialMediaImageInput;
    articleRevisionImages?: Prisma.ArticleRevisionCreateNestedManyWithoutImageInput;
    pageRevisionSocialMediaImages?: Prisma.PageRevisionCreateNestedManyWithoutSocialMediaImageInput;
    pageRevisionImages?: Prisma.PageRevisionCreateNestedManyWithoutImageInput;
    users?: Prisma.UserCreateNestedManyWithoutUserImageInput;
    events?: Prisma.EventCreateNestedManyWithoutImageInput;
};
type ImageFactoryDefineOptions = {
    defaultData?: Resolver<ImageFactoryDefineInput, BuildDataOptions>;
    traits?: {
        [traitName: string | symbol]: {
            data: Resolver<Partial<ImageFactoryDefineInput>, BuildDataOptions>;
        };
    };
};
type ImageTraitKeys<TOptions extends ImageFactoryDefineOptions> = keyof TOptions["traits"];
export interface ImageFactoryInterfaceWithoutTraits {
    readonly _factoryFor: "Image";
    build(inputData?: Partial<Prisma.ImageCreateInput>): PromiseLike<Prisma.ImageCreateInput>;
    buildCreateInput(inputData?: Partial<Prisma.ImageCreateInput>): PromiseLike<Prisma.ImageCreateInput>;
    buildList(inputData: number | readonly Partial<Prisma.ImageCreateInput>[]): PromiseLike<Prisma.ImageCreateInput[]>;
    pickForConnect(inputData: Image): Pick<Image, "id">;
    create(inputData?: Partial<Prisma.ImageCreateInput>): PromiseLike<Image>;
    createList(inputData: number | readonly Partial<Prisma.ImageCreateInput>[]): PromiseLike<Image[]>;
    createForConnect(inputData?: Partial<Prisma.ImageCreateInput>): PromiseLike<Pick<Image, "id">>;
}
export interface ImageFactoryInterface<TOptions extends ImageFactoryDefineOptions = ImageFactoryDefineOptions> extends ImageFactoryInterfaceWithoutTraits {
    use(name: ImageTraitKeys<TOptions>, ...names: readonly ImageTraitKeys<TOptions>[]): ImageFactoryInterfaceWithoutTraits;
}
/**
 * Define factory for {@link Image} model.
 *
 * @param options
 * @returns factory {@link ImageFactoryInterface}
 */
export declare function defineImageFactory<TOptions extends ImageFactoryDefineOptions>(options?: TOptions): ImageFactoryInterface<TOptions>;
type CommentsRevisionsCommentFactory = {
    _factoryFor: "Comment";
    build: () => PromiseLike<Prisma.CommentCreateNestedOneWithoutRevisionsInput["create"]>;
};
type CommentsRevisionsFactoryDefineInput = {
    id?: string;
    createdAt?: Date;
    text?: Prisma.NullableJsonNullValueInput | Prisma.InputJsonValue;
    title?: string | null;
    lead?: string | null;
    Comment?: CommentsRevisionsCommentFactory | Prisma.CommentCreateNestedOneWithoutRevisionsInput;
};
type CommentsRevisionsFactoryDefineOptions = {
    defaultData?: Resolver<CommentsRevisionsFactoryDefineInput, BuildDataOptions>;
    traits?: {
        [traitName: string | symbol]: {
            data: Resolver<Partial<CommentsRevisionsFactoryDefineInput>, BuildDataOptions>;
        };
    };
};
type CommentsRevisionsTraitKeys<TOptions extends CommentsRevisionsFactoryDefineOptions> = keyof TOptions["traits"];
export interface CommentsRevisionsFactoryInterfaceWithoutTraits {
    readonly _factoryFor: "CommentsRevisions";
    build(inputData?: Partial<Prisma.CommentsRevisionsCreateInput>): PromiseLike<Prisma.CommentsRevisionsCreateInput>;
    buildCreateInput(inputData?: Partial<Prisma.CommentsRevisionsCreateInput>): PromiseLike<Prisma.CommentsRevisionsCreateInput>;
    buildList(inputData: number | readonly Partial<Prisma.CommentsRevisionsCreateInput>[]): PromiseLike<Prisma.CommentsRevisionsCreateInput[]>;
    pickForConnect(inputData: CommentsRevisions): Pick<CommentsRevisions, "id">;
    create(inputData?: Partial<Prisma.CommentsRevisionsCreateInput>): PromiseLike<CommentsRevisions>;
    createList(inputData: number | readonly Partial<Prisma.CommentsRevisionsCreateInput>[]): PromiseLike<CommentsRevisions[]>;
    createForConnect(inputData?: Partial<Prisma.CommentsRevisionsCreateInput>): PromiseLike<Pick<CommentsRevisions, "id">>;
}
export interface CommentsRevisionsFactoryInterface<TOptions extends CommentsRevisionsFactoryDefineOptions = CommentsRevisionsFactoryDefineOptions> extends CommentsRevisionsFactoryInterfaceWithoutTraits {
    use(name: CommentsRevisionsTraitKeys<TOptions>, ...names: readonly CommentsRevisionsTraitKeys<TOptions>[]): CommentsRevisionsFactoryInterfaceWithoutTraits;
}
/**
 * Define factory for {@link CommentsRevisions} model.
 *
 * @param options
 * @returns factory {@link CommentsRevisionsFactoryInterface}
 */
export declare function defineCommentsRevisionsFactory<TOptions extends CommentsRevisionsFactoryDefineOptions>(options?: TOptions): CommentsRevisionsFactoryInterface<TOptions>;
type CommentpeerFactory = {
    _factoryFor: "Peer";
    build: () => PromiseLike<Prisma.PeerCreateNestedOneWithoutCommentsInput["create"]>;
};
type CommentguestUserImageFactory = {
    _factoryFor: "Image";
    build: () => PromiseLike<Prisma.ImageCreateNestedOneWithoutCommentInput["create"]>;
};
type CommentuserFactory = {
    _factoryFor: "User";
    build: () => PromiseLike<Prisma.UserCreateNestedOneWithoutCommentInput["create"]>;
};
type CommentFactoryDefineInput = {
    id?: string;
    createdAt?: Date;
    modifiedAt?: Date;
    itemID?: string;
    itemType?: CommentItemType;
    parentID?: string | null;
    rejectionReason?: CommentRejectionReason | null;
    state?: CommentState;
    source?: string | null;
    authorType?: CommentAuthorType;
    guestUsername?: string | null;
    peer?: CommentpeerFactory | Prisma.PeerCreateNestedOneWithoutCommentsInput;
    revisions?: Prisma.CommentsRevisionsCreateNestedManyWithoutCommentInput;
    guestUserImage?: CommentguestUserImageFactory | Prisma.ImageCreateNestedOneWithoutCommentInput;
    user?: CommentuserFactory | Prisma.UserCreateNestedOneWithoutCommentInput;
    tags?: Prisma.TaggedCommentsCreateNestedManyWithoutCommentInput;
    ratings?: Prisma.CommentRatingCreateNestedManyWithoutCommentInput;
    overriddenRatings?: Prisma.CommentRatingOverrideCreateNestedManyWithoutCommentInput;
};
type CommentFactoryDefineOptions = {
    defaultData?: Resolver<CommentFactoryDefineInput, BuildDataOptions>;
    traits?: {
        [traitName: string | symbol]: {
            data: Resolver<Partial<CommentFactoryDefineInput>, BuildDataOptions>;
        };
    };
};
type CommentTraitKeys<TOptions extends CommentFactoryDefineOptions> = keyof TOptions["traits"];
export interface CommentFactoryInterfaceWithoutTraits {
    readonly _factoryFor: "Comment";
    build(inputData?: Partial<Prisma.CommentCreateInput>): PromiseLike<Prisma.CommentCreateInput>;
    buildCreateInput(inputData?: Partial<Prisma.CommentCreateInput>): PromiseLike<Prisma.CommentCreateInput>;
    buildList(inputData: number | readonly Partial<Prisma.CommentCreateInput>[]): PromiseLike<Prisma.CommentCreateInput[]>;
    pickForConnect(inputData: Comment): Pick<Comment, "id">;
    create(inputData?: Partial<Prisma.CommentCreateInput>): PromiseLike<Comment>;
    createList(inputData: number | readonly Partial<Prisma.CommentCreateInput>[]): PromiseLike<Comment[]>;
    createForConnect(inputData?: Partial<Prisma.CommentCreateInput>): PromiseLike<Pick<Comment, "id">>;
}
export interface CommentFactoryInterface<TOptions extends CommentFactoryDefineOptions = CommentFactoryDefineOptions> extends CommentFactoryInterfaceWithoutTraits {
    use(name: CommentTraitKeys<TOptions>, ...names: readonly CommentTraitKeys<TOptions>[]): CommentFactoryInterfaceWithoutTraits;
}
/**
 * Define factory for {@link Comment} model.
 *
 * @param options
 * @returns factory {@link CommentFactoryInterface}
 */
export declare function defineCommentFactory<TOptions extends CommentFactoryDefineOptions>(options?: TOptions): CommentFactoryInterface<TOptions>;
type TaggedCommentscommentFactory = {
    _factoryFor: "Comment";
    build: () => PromiseLike<Prisma.CommentCreateNestedOneWithoutTagsInput["create"]>;
};
type TaggedCommentstagFactory = {
    _factoryFor: "Tag";
    build: () => PromiseLike<Prisma.TagCreateNestedOneWithoutCommentsInput["create"]>;
};
type TaggedCommentsFactoryDefineInput = {
    createdAt?: Date;
    modifiedAt?: Date;
    comment: TaggedCommentscommentFactory | Prisma.CommentCreateNestedOneWithoutTagsInput;
    tag: TaggedCommentstagFactory | Prisma.TagCreateNestedOneWithoutCommentsInput;
};
type TaggedCommentsFactoryDefineOptions = {
    defaultData: Resolver<TaggedCommentsFactoryDefineInput, BuildDataOptions>;
    traits?: {
        [traitName: string | symbol]: {
            data: Resolver<Partial<TaggedCommentsFactoryDefineInput>, BuildDataOptions>;
        };
    };
};
type TaggedCommentsTraitKeys<TOptions extends TaggedCommentsFactoryDefineOptions> = keyof TOptions["traits"];
export interface TaggedCommentsFactoryInterfaceWithoutTraits {
    readonly _factoryFor: "TaggedComments";
    build(inputData?: Partial<Prisma.TaggedCommentsCreateInput>): PromiseLike<Prisma.TaggedCommentsCreateInput>;
    buildCreateInput(inputData?: Partial<Prisma.TaggedCommentsCreateInput>): PromiseLike<Prisma.TaggedCommentsCreateInput>;
    buildList(inputData: number | readonly Partial<Prisma.TaggedCommentsCreateInput>[]): PromiseLike<Prisma.TaggedCommentsCreateInput[]>;
    pickForConnect(inputData: TaggedComments): Pick<TaggedComments, "commentId" | "tagId">;
    create(inputData?: Partial<Prisma.TaggedCommentsCreateInput>): PromiseLike<TaggedComments>;
    createList(inputData: number | readonly Partial<Prisma.TaggedCommentsCreateInput>[]): PromiseLike<TaggedComments[]>;
    createForConnect(inputData?: Partial<Prisma.TaggedCommentsCreateInput>): PromiseLike<Pick<TaggedComments, "commentId" | "tagId">>;
}
export interface TaggedCommentsFactoryInterface<TOptions extends TaggedCommentsFactoryDefineOptions = TaggedCommentsFactoryDefineOptions> extends TaggedCommentsFactoryInterfaceWithoutTraits {
    use(name: TaggedCommentsTraitKeys<TOptions>, ...names: readonly TaggedCommentsTraitKeys<TOptions>[]): TaggedCommentsFactoryInterfaceWithoutTraits;
}
/**
 * Define factory for {@link TaggedComments} model.
 *
 * @param options
 * @returns factory {@link TaggedCommentsFactoryInterface}
 */
export declare function defineTaggedCommentsFactory<TOptions extends TaggedCommentsFactoryDefineOptions>(options: TOptions): TaggedCommentsFactoryInterface<TOptions>;
type CommentRatingSystemFactoryDefineInput = {
    id?: string;
    createdAt?: Date;
    modifiedAt?: Date;
    name?: string | null;
    answers?: Prisma.CommentRatingSystemAnswerCreateNestedManyWithoutRatingSystemInput;
};
type CommentRatingSystemFactoryDefineOptions = {
    defaultData?: Resolver<CommentRatingSystemFactoryDefineInput, BuildDataOptions>;
    traits?: {
        [traitName: string | symbol]: {
            data: Resolver<Partial<CommentRatingSystemFactoryDefineInput>, BuildDataOptions>;
        };
    };
};
type CommentRatingSystemTraitKeys<TOptions extends CommentRatingSystemFactoryDefineOptions> = keyof TOptions["traits"];
export interface CommentRatingSystemFactoryInterfaceWithoutTraits {
    readonly _factoryFor: "CommentRatingSystem";
    build(inputData?: Partial<Prisma.CommentRatingSystemCreateInput>): PromiseLike<Prisma.CommentRatingSystemCreateInput>;
    buildCreateInput(inputData?: Partial<Prisma.CommentRatingSystemCreateInput>): PromiseLike<Prisma.CommentRatingSystemCreateInput>;
    buildList(inputData: number | readonly Partial<Prisma.CommentRatingSystemCreateInput>[]): PromiseLike<Prisma.CommentRatingSystemCreateInput[]>;
    pickForConnect(inputData: CommentRatingSystem): Pick<CommentRatingSystem, "id">;
    create(inputData?: Partial<Prisma.CommentRatingSystemCreateInput>): PromiseLike<CommentRatingSystem>;
    createList(inputData: number | readonly Partial<Prisma.CommentRatingSystemCreateInput>[]): PromiseLike<CommentRatingSystem[]>;
    createForConnect(inputData?: Partial<Prisma.CommentRatingSystemCreateInput>): PromiseLike<Pick<CommentRatingSystem, "id">>;
}
export interface CommentRatingSystemFactoryInterface<TOptions extends CommentRatingSystemFactoryDefineOptions = CommentRatingSystemFactoryDefineOptions> extends CommentRatingSystemFactoryInterfaceWithoutTraits {
    use(name: CommentRatingSystemTraitKeys<TOptions>, ...names: readonly CommentRatingSystemTraitKeys<TOptions>[]): CommentRatingSystemFactoryInterfaceWithoutTraits;
}
/**
 * Define factory for {@link CommentRatingSystem} model.
 *
 * @param options
 * @returns factory {@link CommentRatingSystemFactoryInterface}
 */
export declare function defineCommentRatingSystemFactory<TOptions extends CommentRatingSystemFactoryDefineOptions>(options?: TOptions): CommentRatingSystemFactoryInterface<TOptions>;
type CommentRatingSystemAnswerratingSystemFactory = {
    _factoryFor: "CommentRatingSystem";
    build: () => PromiseLike<Prisma.CommentRatingSystemCreateNestedOneWithoutAnswersInput["create"]>;
};
type CommentRatingSystemAnswerFactoryDefineInput = {
    id?: string;
    createdAt?: Date;
    modifiedAt?: Date;
    type?: RatingSystemType;
    answer?: string | null;
    ratingSystem: CommentRatingSystemAnswerratingSystemFactory | Prisma.CommentRatingSystemCreateNestedOneWithoutAnswersInput;
    ratings?: Prisma.CommentRatingCreateNestedManyWithoutAnswerInput;
    overriddenRatings?: Prisma.CommentRatingOverrideCreateNestedManyWithoutAnswerInput;
};
type CommentRatingSystemAnswerFactoryDefineOptions = {
    defaultData: Resolver<CommentRatingSystemAnswerFactoryDefineInput, BuildDataOptions>;
    traits?: {
        [traitName: string | symbol]: {
            data: Resolver<Partial<CommentRatingSystemAnswerFactoryDefineInput>, BuildDataOptions>;
        };
    };
};
type CommentRatingSystemAnswerTraitKeys<TOptions extends CommentRatingSystemAnswerFactoryDefineOptions> = keyof TOptions["traits"];
export interface CommentRatingSystemAnswerFactoryInterfaceWithoutTraits {
    readonly _factoryFor: "CommentRatingSystemAnswer";
    build(inputData?: Partial<Prisma.CommentRatingSystemAnswerCreateInput>): PromiseLike<Prisma.CommentRatingSystemAnswerCreateInput>;
    buildCreateInput(inputData?: Partial<Prisma.CommentRatingSystemAnswerCreateInput>): PromiseLike<Prisma.CommentRatingSystemAnswerCreateInput>;
    buildList(inputData: number | readonly Partial<Prisma.CommentRatingSystemAnswerCreateInput>[]): PromiseLike<Prisma.CommentRatingSystemAnswerCreateInput[]>;
    pickForConnect(inputData: CommentRatingSystemAnswer): Pick<CommentRatingSystemAnswer, "id">;
    create(inputData?: Partial<Prisma.CommentRatingSystemAnswerCreateInput>): PromiseLike<CommentRatingSystemAnswer>;
    createList(inputData: number | readonly Partial<Prisma.CommentRatingSystemAnswerCreateInput>[]): PromiseLike<CommentRatingSystemAnswer[]>;
    createForConnect(inputData?: Partial<Prisma.CommentRatingSystemAnswerCreateInput>): PromiseLike<Pick<CommentRatingSystemAnswer, "id">>;
}
export interface CommentRatingSystemAnswerFactoryInterface<TOptions extends CommentRatingSystemAnswerFactoryDefineOptions = CommentRatingSystemAnswerFactoryDefineOptions> extends CommentRatingSystemAnswerFactoryInterfaceWithoutTraits {
    use(name: CommentRatingSystemAnswerTraitKeys<TOptions>, ...names: readonly CommentRatingSystemAnswerTraitKeys<TOptions>[]): CommentRatingSystemAnswerFactoryInterfaceWithoutTraits;
}
/**
 * Define factory for {@link CommentRatingSystemAnswer} model.
 *
 * @param options
 * @returns factory {@link CommentRatingSystemAnswerFactoryInterface}
 */
export declare function defineCommentRatingSystemAnswerFactory<TOptions extends CommentRatingSystemAnswerFactoryDefineOptions>(options: TOptions): CommentRatingSystemAnswerFactoryInterface<TOptions>;
type CommentRatinguserFactory = {
    _factoryFor: "User";
    build: () => PromiseLike<Prisma.UserCreateNestedOneWithoutCommentRatingInput["create"]>;
};
type CommentRatinganswerFactory = {
    _factoryFor: "CommentRatingSystemAnswer";
    build: () => PromiseLike<Prisma.CommentRatingSystemAnswerCreateNestedOneWithoutRatingsInput["create"]>;
};
type CommentRatingcommentFactory = {
    _factoryFor: "Comment";
    build: () => PromiseLike<Prisma.CommentCreateNestedOneWithoutRatingsInput["create"]>;
};
type CommentRatingFactoryDefineInput = {
    id?: string;
    createdAt?: Date;
    modifiedAt?: Date;
    value?: number;
    fingerprint?: string | null;
    disabled?: boolean;
    user?: CommentRatinguserFactory | Prisma.UserCreateNestedOneWithoutCommentRatingInput;
    answer: CommentRatinganswerFactory | Prisma.CommentRatingSystemAnswerCreateNestedOneWithoutRatingsInput;
    comment: CommentRatingcommentFactory | Prisma.CommentCreateNestedOneWithoutRatingsInput;
};
type CommentRatingFactoryDefineOptions = {
    defaultData: Resolver<CommentRatingFactoryDefineInput, BuildDataOptions>;
    traits?: {
        [traitName: string | symbol]: {
            data: Resolver<Partial<CommentRatingFactoryDefineInput>, BuildDataOptions>;
        };
    };
};
type CommentRatingTraitKeys<TOptions extends CommentRatingFactoryDefineOptions> = keyof TOptions["traits"];
export interface CommentRatingFactoryInterfaceWithoutTraits {
    readonly _factoryFor: "CommentRating";
    build(inputData?: Partial<Prisma.CommentRatingCreateInput>): PromiseLike<Prisma.CommentRatingCreateInput>;
    buildCreateInput(inputData?: Partial<Prisma.CommentRatingCreateInput>): PromiseLike<Prisma.CommentRatingCreateInput>;
    buildList(inputData: number | readonly Partial<Prisma.CommentRatingCreateInput>[]): PromiseLike<Prisma.CommentRatingCreateInput[]>;
    pickForConnect(inputData: CommentRating): Pick<CommentRating, "id">;
    create(inputData?: Partial<Prisma.CommentRatingCreateInput>): PromiseLike<CommentRating>;
    createList(inputData: number | readonly Partial<Prisma.CommentRatingCreateInput>[]): PromiseLike<CommentRating[]>;
    createForConnect(inputData?: Partial<Prisma.CommentRatingCreateInput>): PromiseLike<Pick<CommentRating, "id">>;
}
export interface CommentRatingFactoryInterface<TOptions extends CommentRatingFactoryDefineOptions = CommentRatingFactoryDefineOptions> extends CommentRatingFactoryInterfaceWithoutTraits {
    use(name: CommentRatingTraitKeys<TOptions>, ...names: readonly CommentRatingTraitKeys<TOptions>[]): CommentRatingFactoryInterfaceWithoutTraits;
}
/**
 * Define factory for {@link CommentRating} model.
 *
 * @param options
 * @returns factory {@link CommentRatingFactoryInterface}
 */
export declare function defineCommentRatingFactory<TOptions extends CommentRatingFactoryDefineOptions>(options: TOptions): CommentRatingFactoryInterface<TOptions>;
type CommentRatingOverrideanswerFactory = {
    _factoryFor: "CommentRatingSystemAnswer";
    build: () => PromiseLike<Prisma.CommentRatingSystemAnswerCreateNestedOneWithoutOverriddenRatingsInput["create"]>;
};
type CommentRatingOverridecommentFactory = {
    _factoryFor: "Comment";
    build: () => PromiseLike<Prisma.CommentCreateNestedOneWithoutOverriddenRatingsInput["create"]>;
};
type CommentRatingOverrideFactoryDefineInput = {
    createdAt?: Date;
    modifiedAt?: Date;
    value?: number | null;
    answer: CommentRatingOverrideanswerFactory | Prisma.CommentRatingSystemAnswerCreateNestedOneWithoutOverriddenRatingsInput;
    comment: CommentRatingOverridecommentFactory | Prisma.CommentCreateNestedOneWithoutOverriddenRatingsInput;
};
type CommentRatingOverrideFactoryDefineOptions = {
    defaultData: Resolver<CommentRatingOverrideFactoryDefineInput, BuildDataOptions>;
    traits?: {
        [traitName: string | symbol]: {
            data: Resolver<Partial<CommentRatingOverrideFactoryDefineInput>, BuildDataOptions>;
        };
    };
};
type CommentRatingOverrideTraitKeys<TOptions extends CommentRatingOverrideFactoryDefineOptions> = keyof TOptions["traits"];
export interface CommentRatingOverrideFactoryInterfaceWithoutTraits {
    readonly _factoryFor: "CommentRatingOverride";
    build(inputData?: Partial<Prisma.CommentRatingOverrideCreateInput>): PromiseLike<Prisma.CommentRatingOverrideCreateInput>;
    buildCreateInput(inputData?: Partial<Prisma.CommentRatingOverrideCreateInput>): PromiseLike<Prisma.CommentRatingOverrideCreateInput>;
    buildList(inputData: number | readonly Partial<Prisma.CommentRatingOverrideCreateInput>[]): PromiseLike<Prisma.CommentRatingOverrideCreateInput[]>;
    pickForConnect(inputData: CommentRatingOverride): Pick<CommentRatingOverride, "answerId" | "commentId">;
    create(inputData?: Partial<Prisma.CommentRatingOverrideCreateInput>): PromiseLike<CommentRatingOverride>;
    createList(inputData: number | readonly Partial<Prisma.CommentRatingOverrideCreateInput>[]): PromiseLike<CommentRatingOverride[]>;
    createForConnect(inputData?: Partial<Prisma.CommentRatingOverrideCreateInput>): PromiseLike<Pick<CommentRatingOverride, "answerId" | "commentId">>;
}
export interface CommentRatingOverrideFactoryInterface<TOptions extends CommentRatingOverrideFactoryDefineOptions = CommentRatingOverrideFactoryDefineOptions> extends CommentRatingOverrideFactoryInterfaceWithoutTraits {
    use(name: CommentRatingOverrideTraitKeys<TOptions>, ...names: readonly CommentRatingOverrideTraitKeys<TOptions>[]): CommentRatingOverrideFactoryInterfaceWithoutTraits;
}
/**
 * Define factory for {@link CommentRatingOverride} model.
 *
 * @param options
 * @returns factory {@link CommentRatingOverrideFactoryInterface}
 */
export declare function defineCommentRatingOverrideFactory<TOptions extends CommentRatingOverrideFactoryDefineOptions>(options: TOptions): CommentRatingOverrideFactoryInterface<TOptions>;
type InvoiceIteminvoicesFactory = {
    _factoryFor: "Invoice";
    build: () => PromiseLike<Prisma.InvoiceCreateNestedOneWithoutItemsInput["create"]>;
};
type InvoiceItemFactoryDefineInput = {
    id?: string;
    createdAt?: Date;
    modifiedAt?: Date;
    name?: string;
    description?: string | null;
    quantity?: number;
    amount?: number;
    invoices?: InvoiceIteminvoicesFactory | Prisma.InvoiceCreateNestedOneWithoutItemsInput;
};
type InvoiceItemFactoryDefineOptions = {
    defaultData?: Resolver<InvoiceItemFactoryDefineInput, BuildDataOptions>;
    traits?: {
        [traitName: string | symbol]: {
            data: Resolver<Partial<InvoiceItemFactoryDefineInput>, BuildDataOptions>;
        };
    };
};
type InvoiceItemTraitKeys<TOptions extends InvoiceItemFactoryDefineOptions> = keyof TOptions["traits"];
export interface InvoiceItemFactoryInterfaceWithoutTraits {
    readonly _factoryFor: "InvoiceItem";
    build(inputData?: Partial<Prisma.InvoiceItemCreateInput>): PromiseLike<Prisma.InvoiceItemCreateInput>;
    buildCreateInput(inputData?: Partial<Prisma.InvoiceItemCreateInput>): PromiseLike<Prisma.InvoiceItemCreateInput>;
    buildList(inputData: number | readonly Partial<Prisma.InvoiceItemCreateInput>[]): PromiseLike<Prisma.InvoiceItemCreateInput[]>;
    pickForConnect(inputData: InvoiceItem): Pick<InvoiceItem, "id">;
    create(inputData?: Partial<Prisma.InvoiceItemCreateInput>): PromiseLike<InvoiceItem>;
    createList(inputData: number | readonly Partial<Prisma.InvoiceItemCreateInput>[]): PromiseLike<InvoiceItem[]>;
    createForConnect(inputData?: Partial<Prisma.InvoiceItemCreateInput>): PromiseLike<Pick<InvoiceItem, "id">>;
}
export interface InvoiceItemFactoryInterface<TOptions extends InvoiceItemFactoryDefineOptions = InvoiceItemFactoryDefineOptions> extends InvoiceItemFactoryInterfaceWithoutTraits {
    use(name: InvoiceItemTraitKeys<TOptions>, ...names: readonly InvoiceItemTraitKeys<TOptions>[]): InvoiceItemFactoryInterfaceWithoutTraits;
}
/**
 * Define factory for {@link InvoiceItem} model.
 *
 * @param options
 * @returns factory {@link InvoiceItemFactoryInterface}
 */
export declare function defineInvoiceItemFactory<TOptions extends InvoiceItemFactoryDefineOptions>(options?: TOptions): InvoiceItemFactoryInterface<TOptions>;
type InvoicesubscriptionFactory = {
    _factoryFor: "Subscription";
    build: () => PromiseLike<Prisma.SubscriptionCreateNestedOneWithoutInvoicesInput["create"]>;
};
type InvoiceFactoryDefineInput = {
    id?: string;
    createdAt?: Date;
    modifiedAt?: Date;
    mail?: string;
    dueAt?: Date;
    description?: string | null;
    paidAt?: Date | null;
    canceledAt?: Date | null;
    scheduledDeactivationAt?: Date;
    manuallySetAsPaidByUserId?: string | null;
    items?: Prisma.InvoiceItemCreateNestedManyWithoutInvoicesInput;
    subscription?: InvoicesubscriptionFactory | Prisma.SubscriptionCreateNestedOneWithoutInvoicesInput;
    subscriptionPeriods?: Prisma.SubscriptionPeriodCreateNestedManyWithoutInvoiceInput;
};
type InvoiceFactoryDefineOptions = {
    defaultData?: Resolver<InvoiceFactoryDefineInput, BuildDataOptions>;
    traits?: {
        [traitName: string | symbol]: {
            data: Resolver<Partial<InvoiceFactoryDefineInput>, BuildDataOptions>;
        };
    };
};
type InvoiceTraitKeys<TOptions extends InvoiceFactoryDefineOptions> = keyof TOptions["traits"];
export interface InvoiceFactoryInterfaceWithoutTraits {
    readonly _factoryFor: "Invoice";
    build(inputData?: Partial<Prisma.InvoiceCreateInput>): PromiseLike<Prisma.InvoiceCreateInput>;
    buildCreateInput(inputData?: Partial<Prisma.InvoiceCreateInput>): PromiseLike<Prisma.InvoiceCreateInput>;
    buildList(inputData: number | readonly Partial<Prisma.InvoiceCreateInput>[]): PromiseLike<Prisma.InvoiceCreateInput[]>;
    pickForConnect(inputData: Invoice): Pick<Invoice, "id">;
    create(inputData?: Partial<Prisma.InvoiceCreateInput>): PromiseLike<Invoice>;
    createList(inputData: number | readonly Partial<Prisma.InvoiceCreateInput>[]): PromiseLike<Invoice[]>;
    createForConnect(inputData?: Partial<Prisma.InvoiceCreateInput>): PromiseLike<Pick<Invoice, "id">>;
}
export interface InvoiceFactoryInterface<TOptions extends InvoiceFactoryDefineOptions = InvoiceFactoryDefineOptions> extends InvoiceFactoryInterfaceWithoutTraits {
    use(name: InvoiceTraitKeys<TOptions>, ...names: readonly InvoiceTraitKeys<TOptions>[]): InvoiceFactoryInterfaceWithoutTraits;
}
/**
 * Define factory for {@link Invoice} model.
 *
 * @param options
 * @returns factory {@link InvoiceFactoryInterface}
 */
export declare function defineInvoiceFactory<TOptions extends InvoiceFactoryDefineOptions>(options?: TOptions): InvoiceFactoryInterface<TOptions>;
type MailLogrecipientFactory = {
    _factoryFor: "User";
    build: () => PromiseLike<Prisma.UserCreateNestedOneWithoutMailSentInput["create"]>;
};
type MailLogmailTemplateFactory = {
    _factoryFor: "MailTemplate";
    build: () => PromiseLike<Prisma.MailTemplateCreateNestedOneWithoutMailLogInput["create"]>;
};
type MailLogFactoryDefineInput = {
    id?: string;
    createdAt?: Date;
    modifiedAt?: Date;
    state?: MailLogState;
    sentDate?: Date;
    mailProviderID?: string;
    mailIdentifier?: string;
    mailData?: string | null;
    subject?: string | null;
    recipient: MailLogrecipientFactory | Prisma.UserCreateNestedOneWithoutMailSentInput;
    mailTemplate: MailLogmailTemplateFactory | Prisma.MailTemplateCreateNestedOneWithoutMailLogInput;
};
type MailLogFactoryDefineOptions = {
    defaultData: Resolver<MailLogFactoryDefineInput, BuildDataOptions>;
    traits?: {
        [traitName: string | symbol]: {
            data: Resolver<Partial<MailLogFactoryDefineInput>, BuildDataOptions>;
        };
    };
};
type MailLogTraitKeys<TOptions extends MailLogFactoryDefineOptions> = keyof TOptions["traits"];
export interface MailLogFactoryInterfaceWithoutTraits {
    readonly _factoryFor: "MailLog";
    build(inputData?: Partial<Prisma.MailLogCreateInput>): PromiseLike<Prisma.MailLogCreateInput>;
    buildCreateInput(inputData?: Partial<Prisma.MailLogCreateInput>): PromiseLike<Prisma.MailLogCreateInput>;
    buildList(inputData: number | readonly Partial<Prisma.MailLogCreateInput>[]): PromiseLike<Prisma.MailLogCreateInput[]>;
    pickForConnect(inputData: MailLog): Pick<MailLog, "id">;
    create(inputData?: Partial<Prisma.MailLogCreateInput>): PromiseLike<MailLog>;
    createList(inputData: number | readonly Partial<Prisma.MailLogCreateInput>[]): PromiseLike<MailLog[]>;
    createForConnect(inputData?: Partial<Prisma.MailLogCreateInput>): PromiseLike<Pick<MailLog, "id">>;
}
export interface MailLogFactoryInterface<TOptions extends MailLogFactoryDefineOptions = MailLogFactoryDefineOptions> extends MailLogFactoryInterfaceWithoutTraits {
    use(name: MailLogTraitKeys<TOptions>, ...names: readonly MailLogTraitKeys<TOptions>[]): MailLogFactoryInterfaceWithoutTraits;
}
/**
 * Define factory for {@link MailLog} model.
 *
 * @param options
 * @returns factory {@link MailLogFactoryInterface}
 */
export declare function defineMailLogFactory<TOptions extends MailLogFactoryDefineOptions>(options: TOptions): MailLogFactoryInterface<TOptions>;
type AvailablePaymentMethodMemberPlanFactory = {
    _factoryFor: "MemberPlan";
    build: () => PromiseLike<Prisma.MemberPlanCreateNestedOneWithoutAvailablePaymentMethodsInput["create"]>;
};
type AvailablePaymentMethodFactoryDefineInput = {
    id?: string;
    createdAt?: Date;
    modifiedAt?: Date;
    paymentMethodIDs?: Prisma.AvailablePaymentMethodCreatepaymentMethodIDsInput | Prisma.Enumerable<string>;
    paymentPeriodicities?: Prisma.AvailablePaymentMethodCreatepaymentPeriodicitiesInput | Prisma.Enumerable<PaymentPeriodicity>;
    forceAutoRenewal?: boolean;
    MemberPlan?: AvailablePaymentMethodMemberPlanFactory | Prisma.MemberPlanCreateNestedOneWithoutAvailablePaymentMethodsInput;
};
type AvailablePaymentMethodFactoryDefineOptions = {
    defaultData?: Resolver<AvailablePaymentMethodFactoryDefineInput, BuildDataOptions>;
    traits?: {
        [traitName: string | symbol]: {
            data: Resolver<Partial<AvailablePaymentMethodFactoryDefineInput>, BuildDataOptions>;
        };
    };
};
type AvailablePaymentMethodTraitKeys<TOptions extends AvailablePaymentMethodFactoryDefineOptions> = keyof TOptions["traits"];
export interface AvailablePaymentMethodFactoryInterfaceWithoutTraits {
    readonly _factoryFor: "AvailablePaymentMethod";
    build(inputData?: Partial<Prisma.AvailablePaymentMethodCreateInput>): PromiseLike<Prisma.AvailablePaymentMethodCreateInput>;
    buildCreateInput(inputData?: Partial<Prisma.AvailablePaymentMethodCreateInput>): PromiseLike<Prisma.AvailablePaymentMethodCreateInput>;
    buildList(inputData: number | readonly Partial<Prisma.AvailablePaymentMethodCreateInput>[]): PromiseLike<Prisma.AvailablePaymentMethodCreateInput[]>;
    pickForConnect(inputData: AvailablePaymentMethod): Pick<AvailablePaymentMethod, "id">;
    create(inputData?: Partial<Prisma.AvailablePaymentMethodCreateInput>): PromiseLike<AvailablePaymentMethod>;
    createList(inputData: number | readonly Partial<Prisma.AvailablePaymentMethodCreateInput>[]): PromiseLike<AvailablePaymentMethod[]>;
    createForConnect(inputData?: Partial<Prisma.AvailablePaymentMethodCreateInput>): PromiseLike<Pick<AvailablePaymentMethod, "id">>;
}
export interface AvailablePaymentMethodFactoryInterface<TOptions extends AvailablePaymentMethodFactoryDefineOptions = AvailablePaymentMethodFactoryDefineOptions> extends AvailablePaymentMethodFactoryInterfaceWithoutTraits {
    use(name: AvailablePaymentMethodTraitKeys<TOptions>, ...names: readonly AvailablePaymentMethodTraitKeys<TOptions>[]): AvailablePaymentMethodFactoryInterfaceWithoutTraits;
}
/**
 * Define factory for {@link AvailablePaymentMethod} model.
 *
 * @param options
 * @returns factory {@link AvailablePaymentMethodFactoryInterface}
 */
export declare function defineAvailablePaymentMethodFactory<TOptions extends AvailablePaymentMethodFactoryDefineOptions>(options?: TOptions): AvailablePaymentMethodFactoryInterface<TOptions>;
type MemberPlanimageFactory = {
    _factoryFor: "Image";
    build: () => PromiseLike<Prisma.ImageCreateNestedOneWithoutMemberPlanInput["create"]>;
};
type MemberPlanFactoryDefineInput = {
    id?: string;
    createdAt?: Date;
    modifiedAt?: Date;
    name?: string;
    slug?: string;
    tags?: Prisma.MemberPlanCreatetagsInput | Prisma.Enumerable<string>;
    description?: Prisma.JsonNullValueInput | Prisma.InputJsonValue;
    active?: boolean;
    amountPerMonthMin?: number;
    extendable?: boolean;
    maxCount?: number | null;
    availablePaymentMethods?: Prisma.AvailablePaymentMethodCreateNestedManyWithoutMemberPlanInput;
    image?: MemberPlanimageFactory | Prisma.ImageCreateNestedOneWithoutMemberPlanInput;
    Subscription?: Prisma.SubscriptionCreateNestedManyWithoutMemberPlanInput;
    subscriptionFlows?: Prisma.SubscriptionFlowCreateNestedManyWithoutMemberPlanInput;
};
type MemberPlanFactoryDefineOptions = {
    defaultData?: Resolver<MemberPlanFactoryDefineInput, BuildDataOptions>;
    traits?: {
        [traitName: string | symbol]: {
            data: Resolver<Partial<MemberPlanFactoryDefineInput>, BuildDataOptions>;
        };
    };
};
type MemberPlanTraitKeys<TOptions extends MemberPlanFactoryDefineOptions> = keyof TOptions["traits"];
export interface MemberPlanFactoryInterfaceWithoutTraits {
    readonly _factoryFor: "MemberPlan";
    build(inputData?: Partial<Prisma.MemberPlanCreateInput>): PromiseLike<Prisma.MemberPlanCreateInput>;
    buildCreateInput(inputData?: Partial<Prisma.MemberPlanCreateInput>): PromiseLike<Prisma.MemberPlanCreateInput>;
    buildList(inputData: number | readonly Partial<Prisma.MemberPlanCreateInput>[]): PromiseLike<Prisma.MemberPlanCreateInput[]>;
    pickForConnect(inputData: MemberPlan): Pick<MemberPlan, "id">;
    create(inputData?: Partial<Prisma.MemberPlanCreateInput>): PromiseLike<MemberPlan>;
    createList(inputData: number | readonly Partial<Prisma.MemberPlanCreateInput>[]): PromiseLike<MemberPlan[]>;
    createForConnect(inputData?: Partial<Prisma.MemberPlanCreateInput>): PromiseLike<Pick<MemberPlan, "id">>;
}
export interface MemberPlanFactoryInterface<TOptions extends MemberPlanFactoryDefineOptions = MemberPlanFactoryDefineOptions> extends MemberPlanFactoryInterfaceWithoutTraits {
    use(name: MemberPlanTraitKeys<TOptions>, ...names: readonly MemberPlanTraitKeys<TOptions>[]): MemberPlanFactoryInterfaceWithoutTraits;
}
/**
 * Define factory for {@link MemberPlan} model.
 *
 * @param options
 * @returns factory {@link MemberPlanFactoryInterface}
 */
export declare function defineMemberPlanFactory<TOptions extends MemberPlanFactoryDefineOptions>(options?: TOptions): MemberPlanFactoryInterface<TOptions>;
type NavigationLinkpageFactory = {
    _factoryFor: "Page";
    build: () => PromiseLike<Prisma.PageCreateNestedOneWithoutNavigationsInput["create"]>;
};
type NavigationLinkarticleFactory = {
    _factoryFor: "Article";
    build: () => PromiseLike<Prisma.ArticleCreateNestedOneWithoutNavigationsInput["create"]>;
};
type NavigationLinknavigationFactory = {
    _factoryFor: "Navigation";
    build: () => PromiseLike<Prisma.NavigationCreateNestedOneWithoutLinksInput["create"]>;
};
type NavigationLinkFactoryDefineInput = {
    id?: string;
    createdAt?: Date;
    modifiedAt?: Date;
    label?: string;
    type?: string;
    url?: string | null;
    page?: NavigationLinkpageFactory | Prisma.PageCreateNestedOneWithoutNavigationsInput;
    article?: NavigationLinkarticleFactory | Prisma.ArticleCreateNestedOneWithoutNavigationsInput;
    navigation?: NavigationLinknavigationFactory | Prisma.NavigationCreateNestedOneWithoutLinksInput;
};
type NavigationLinkFactoryDefineOptions = {
    defaultData?: Resolver<NavigationLinkFactoryDefineInput, BuildDataOptions>;
    traits?: {
        [traitName: string | symbol]: {
            data: Resolver<Partial<NavigationLinkFactoryDefineInput>, BuildDataOptions>;
        };
    };
};
type NavigationLinkTraitKeys<TOptions extends NavigationLinkFactoryDefineOptions> = keyof TOptions["traits"];
export interface NavigationLinkFactoryInterfaceWithoutTraits {
    readonly _factoryFor: "NavigationLink";
    build(inputData?: Partial<Prisma.NavigationLinkCreateInput>): PromiseLike<Prisma.NavigationLinkCreateInput>;
    buildCreateInput(inputData?: Partial<Prisma.NavigationLinkCreateInput>): PromiseLike<Prisma.NavigationLinkCreateInput>;
    buildList(inputData: number | readonly Partial<Prisma.NavigationLinkCreateInput>[]): PromiseLike<Prisma.NavigationLinkCreateInput[]>;
    pickForConnect(inputData: NavigationLink): Pick<NavigationLink, "id">;
    create(inputData?: Partial<Prisma.NavigationLinkCreateInput>): PromiseLike<NavigationLink>;
    createList(inputData: number | readonly Partial<Prisma.NavigationLinkCreateInput>[]): PromiseLike<NavigationLink[]>;
    createForConnect(inputData?: Partial<Prisma.NavigationLinkCreateInput>): PromiseLike<Pick<NavigationLink, "id">>;
}
export interface NavigationLinkFactoryInterface<TOptions extends NavigationLinkFactoryDefineOptions = NavigationLinkFactoryDefineOptions> extends NavigationLinkFactoryInterfaceWithoutTraits {
    use(name: NavigationLinkTraitKeys<TOptions>, ...names: readonly NavigationLinkTraitKeys<TOptions>[]): NavigationLinkFactoryInterfaceWithoutTraits;
}
/**
 * Define factory for {@link NavigationLink} model.
 *
 * @param options
 * @returns factory {@link NavigationLinkFactoryInterface}
 */
export declare function defineNavigationLinkFactory<TOptions extends NavigationLinkFactoryDefineOptions>(options?: TOptions): NavigationLinkFactoryInterface<TOptions>;
type NavigationFactoryDefineInput = {
    id?: string;
    createdAt?: Date;
    modifiedAt?: Date;
    key?: string;
    name?: string;
    links?: Prisma.NavigationLinkCreateNestedManyWithoutNavigationInput;
};
type NavigationFactoryDefineOptions = {
    defaultData?: Resolver<NavigationFactoryDefineInput, BuildDataOptions>;
    traits?: {
        [traitName: string | symbol]: {
            data: Resolver<Partial<NavigationFactoryDefineInput>, BuildDataOptions>;
        };
    };
};
type NavigationTraitKeys<TOptions extends NavigationFactoryDefineOptions> = keyof TOptions["traits"];
export interface NavigationFactoryInterfaceWithoutTraits {
    readonly _factoryFor: "Navigation";
    build(inputData?: Partial<Prisma.NavigationCreateInput>): PromiseLike<Prisma.NavigationCreateInput>;
    buildCreateInput(inputData?: Partial<Prisma.NavigationCreateInput>): PromiseLike<Prisma.NavigationCreateInput>;
    buildList(inputData: number | readonly Partial<Prisma.NavigationCreateInput>[]): PromiseLike<Prisma.NavigationCreateInput[]>;
    pickForConnect(inputData: Navigation): Pick<Navigation, "id">;
    create(inputData?: Partial<Prisma.NavigationCreateInput>): PromiseLike<Navigation>;
    createList(inputData: number | readonly Partial<Prisma.NavigationCreateInput>[]): PromiseLike<Navigation[]>;
    createForConnect(inputData?: Partial<Prisma.NavigationCreateInput>): PromiseLike<Pick<Navigation, "id">>;
}
export interface NavigationFactoryInterface<TOptions extends NavigationFactoryDefineOptions = NavigationFactoryDefineOptions> extends NavigationFactoryInterfaceWithoutTraits {
    use(name: NavigationTraitKeys<TOptions>, ...names: readonly NavigationTraitKeys<TOptions>[]): NavigationFactoryInterfaceWithoutTraits;
}
/**
 * Define factory for {@link Navigation} model.
 *
 * @param options
 * @returns factory {@link NavigationFactoryInterface}
 */
export declare function defineNavigationFactory<TOptions extends NavigationFactoryDefineOptions>(options?: TOptions): NavigationFactoryInterface<TOptions>;
type PageRevisionimageFactory = {
    _factoryFor: "Image";
    build: () => PromiseLike<Prisma.ImageCreateNestedOneWithoutPageRevisionImagesInput["create"]>;
};
type PageRevisionsocialMediaImageFactory = {
    _factoryFor: "Image";
    build: () => PromiseLike<Prisma.ImageCreateNestedOneWithoutPageRevisionSocialMediaImagesInput["create"]>;
};
type PageRevisionFactoryDefineInput = {
    id?: string;
    revision?: number;
    createdAt?: Date;
    modifiedAt?: Date | null;
    updatedAt?: Date | null;
    publishedAt?: Date | null;
    publishAt?: Date | null;
    slug?: string | null;
    title?: string;
    description?: string | null;
    tags?: Prisma.PageRevisionCreatetagsInput | Prisma.Enumerable<string>;
    socialMediaTitle?: string | null;
    socialMediaDescription?: string | null;
    blocks?: Prisma.JsonNullValueInput | Prisma.InputJsonValue;
    properties?: Prisma.MetadataPropertyCreateNestedManyWithoutPageRevisionInput;
    image?: PageRevisionimageFactory | Prisma.ImageCreateNestedOneWithoutPageRevisionImagesInput;
    socialMediaImage?: PageRevisionsocialMediaImageFactory | Prisma.ImageCreateNestedOneWithoutPageRevisionSocialMediaImagesInput;
    PublishedPage?: Prisma.PageCreateNestedManyWithoutPublishedInput;
    PendingPage?: Prisma.PageCreateNestedManyWithoutPendingInput;
    DraftPage?: Prisma.PageCreateNestedManyWithoutDraftInput;
};
type PageRevisionFactoryDefineOptions = {
    defaultData?: Resolver<PageRevisionFactoryDefineInput, BuildDataOptions>;
    traits?: {
        [traitName: string | symbol]: {
            data: Resolver<Partial<PageRevisionFactoryDefineInput>, BuildDataOptions>;
        };
    };
};
type PageRevisionTraitKeys<TOptions extends PageRevisionFactoryDefineOptions> = keyof TOptions["traits"];
export interface PageRevisionFactoryInterfaceWithoutTraits {
    readonly _factoryFor: "PageRevision";
    build(inputData?: Partial<Prisma.PageRevisionCreateInput>): PromiseLike<Prisma.PageRevisionCreateInput>;
    buildCreateInput(inputData?: Partial<Prisma.PageRevisionCreateInput>): PromiseLike<Prisma.PageRevisionCreateInput>;
    buildList(inputData: number | readonly Partial<Prisma.PageRevisionCreateInput>[]): PromiseLike<Prisma.PageRevisionCreateInput[]>;
    pickForConnect(inputData: PageRevision): Pick<PageRevision, "id">;
    create(inputData?: Partial<Prisma.PageRevisionCreateInput>): PromiseLike<PageRevision>;
    createList(inputData: number | readonly Partial<Prisma.PageRevisionCreateInput>[]): PromiseLike<PageRevision[]>;
    createForConnect(inputData?: Partial<Prisma.PageRevisionCreateInput>): PromiseLike<Pick<PageRevision, "id">>;
}
export interface PageRevisionFactoryInterface<TOptions extends PageRevisionFactoryDefineOptions = PageRevisionFactoryDefineOptions> extends PageRevisionFactoryInterfaceWithoutTraits {
    use(name: PageRevisionTraitKeys<TOptions>, ...names: readonly PageRevisionTraitKeys<TOptions>[]): PageRevisionFactoryInterfaceWithoutTraits;
}
/**
 * Define factory for {@link PageRevision} model.
 *
 * @param options
 * @returns factory {@link PageRevisionFactoryInterface}
 */
export declare function definePageRevisionFactory<TOptions extends PageRevisionFactoryDefineOptions>(options?: TOptions): PageRevisionFactoryInterface<TOptions>;
type PagepublishedFactory = {
    _factoryFor: "PageRevision";
    build: () => PromiseLike<Prisma.PageRevisionCreateNestedOneWithoutPublishedPageInput["create"]>;
};
type PagependingFactory = {
    _factoryFor: "PageRevision";
    build: () => PromiseLike<Prisma.PageRevisionCreateNestedOneWithoutPendingPageInput["create"]>;
};
type PagedraftFactory = {
    _factoryFor: "PageRevision";
    build: () => PromiseLike<Prisma.PageRevisionCreateNestedOneWithoutDraftPageInput["create"]>;
};
type PageFactoryDefineInput = {
    id?: string;
    createdAt?: Date;
    modifiedAt?: Date;
    published?: PagepublishedFactory | Prisma.PageRevisionCreateNestedOneWithoutPublishedPageInput;
    pending?: PagependingFactory | Prisma.PageRevisionCreateNestedOneWithoutPendingPageInput;
    draft?: PagedraftFactory | Prisma.PageRevisionCreateNestedOneWithoutDraftPageInput;
    navigations?: Prisma.NavigationLinkCreateNestedManyWithoutPageInput;
    tags?: Prisma.TaggedPagesCreateNestedManyWithoutPageInput;
};
type PageFactoryDefineOptions = {
    defaultData?: Resolver<PageFactoryDefineInput, BuildDataOptions>;
    traits?: {
        [traitName: string | symbol]: {
            data: Resolver<Partial<PageFactoryDefineInput>, BuildDataOptions>;
        };
    };
};
type PageTraitKeys<TOptions extends PageFactoryDefineOptions> = keyof TOptions["traits"];
export interface PageFactoryInterfaceWithoutTraits {
    readonly _factoryFor: "Page";
    build(inputData?: Partial<Prisma.PageCreateInput>): PromiseLike<Prisma.PageCreateInput>;
    buildCreateInput(inputData?: Partial<Prisma.PageCreateInput>): PromiseLike<Prisma.PageCreateInput>;
    buildList(inputData: number | readonly Partial<Prisma.PageCreateInput>[]): PromiseLike<Prisma.PageCreateInput[]>;
    pickForConnect(inputData: Page): Pick<Page, "id">;
    create(inputData?: Partial<Prisma.PageCreateInput>): PromiseLike<Page>;
    createList(inputData: number | readonly Partial<Prisma.PageCreateInput>[]): PromiseLike<Page[]>;
    createForConnect(inputData?: Partial<Prisma.PageCreateInput>): PromiseLike<Pick<Page, "id">>;
}
export interface PageFactoryInterface<TOptions extends PageFactoryDefineOptions = PageFactoryDefineOptions> extends PageFactoryInterfaceWithoutTraits {
    use(name: PageTraitKeys<TOptions>, ...names: readonly PageTraitKeys<TOptions>[]): PageFactoryInterfaceWithoutTraits;
}
/**
 * Define factory for {@link Page} model.
 *
 * @param options
 * @returns factory {@link PageFactoryInterface}
 */
export declare function definePageFactory<TOptions extends PageFactoryDefineOptions>(options?: TOptions): PageFactoryInterface<TOptions>;
type TaggedPagespageFactory = {
    _factoryFor: "Page";
    build: () => PromiseLike<Prisma.PageCreateNestedOneWithoutTagsInput["create"]>;
};
type TaggedPagestagFactory = {
    _factoryFor: "Tag";
    build: () => PromiseLike<Prisma.TagCreateNestedOneWithoutPagesInput["create"]>;
};
type TaggedPagesFactoryDefineInput = {
    createdAt?: Date;
    modifiedAt?: Date;
    page: TaggedPagespageFactory | Prisma.PageCreateNestedOneWithoutTagsInput;
    tag: TaggedPagestagFactory | Prisma.TagCreateNestedOneWithoutPagesInput;
};
type TaggedPagesFactoryDefineOptions = {
    defaultData: Resolver<TaggedPagesFactoryDefineInput, BuildDataOptions>;
    traits?: {
        [traitName: string | symbol]: {
            data: Resolver<Partial<TaggedPagesFactoryDefineInput>, BuildDataOptions>;
        };
    };
};
type TaggedPagesTraitKeys<TOptions extends TaggedPagesFactoryDefineOptions> = keyof TOptions["traits"];
export interface TaggedPagesFactoryInterfaceWithoutTraits {
    readonly _factoryFor: "TaggedPages";
    build(inputData?: Partial<Prisma.TaggedPagesCreateInput>): PromiseLike<Prisma.TaggedPagesCreateInput>;
    buildCreateInput(inputData?: Partial<Prisma.TaggedPagesCreateInput>): PromiseLike<Prisma.TaggedPagesCreateInput>;
    buildList(inputData: number | readonly Partial<Prisma.TaggedPagesCreateInput>[]): PromiseLike<Prisma.TaggedPagesCreateInput[]>;
    pickForConnect(inputData: TaggedPages): Pick<TaggedPages, "pageId" | "tagId">;
    create(inputData?: Partial<Prisma.TaggedPagesCreateInput>): PromiseLike<TaggedPages>;
    createList(inputData: number | readonly Partial<Prisma.TaggedPagesCreateInput>[]): PromiseLike<TaggedPages[]>;
    createForConnect(inputData?: Partial<Prisma.TaggedPagesCreateInput>): PromiseLike<Pick<TaggedPages, "pageId" | "tagId">>;
}
export interface TaggedPagesFactoryInterface<TOptions extends TaggedPagesFactoryDefineOptions = TaggedPagesFactoryDefineOptions> extends TaggedPagesFactoryInterfaceWithoutTraits {
    use(name: TaggedPagesTraitKeys<TOptions>, ...names: readonly TaggedPagesTraitKeys<TOptions>[]): TaggedPagesFactoryInterfaceWithoutTraits;
}
/**
 * Define factory for {@link TaggedPages} model.
 *
 * @param options
 * @returns factory {@link TaggedPagesFactoryInterface}
 */
export declare function defineTaggedPagesFactory<TOptions extends TaggedPagesFactoryDefineOptions>(options: TOptions): TaggedPagesFactoryInterface<TOptions>;
type PaymentMethodFactoryDefineInput = {
    id?: string;
    createdAt?: Date;
    modifiedAt?: Date;
    name?: string;
    slug?: string;
    description?: string;
    paymentProviderID?: string;
    active?: boolean;
    Subscription?: Prisma.SubscriptionCreateNestedManyWithoutPaymentMethodInput;
    Payment?: Prisma.PaymentCreateNestedManyWithoutPaymentMethodInput;
    subscriptionFlows?: Prisma.SubscriptionFlowCreateNestedManyWithoutPaymentMethodsInput;
};
type PaymentMethodFactoryDefineOptions = {
    defaultData?: Resolver<PaymentMethodFactoryDefineInput, BuildDataOptions>;
    traits?: {
        [traitName: string | symbol]: {
            data: Resolver<Partial<PaymentMethodFactoryDefineInput>, BuildDataOptions>;
        };
    };
};
type PaymentMethodTraitKeys<TOptions extends PaymentMethodFactoryDefineOptions> = keyof TOptions["traits"];
export interface PaymentMethodFactoryInterfaceWithoutTraits {
    readonly _factoryFor: "PaymentMethod";
    build(inputData?: Partial<Prisma.PaymentMethodCreateInput>): PromiseLike<Prisma.PaymentMethodCreateInput>;
    buildCreateInput(inputData?: Partial<Prisma.PaymentMethodCreateInput>): PromiseLike<Prisma.PaymentMethodCreateInput>;
    buildList(inputData: number | readonly Partial<Prisma.PaymentMethodCreateInput>[]): PromiseLike<Prisma.PaymentMethodCreateInput[]>;
    pickForConnect(inputData: PaymentMethod): Pick<PaymentMethod, "id">;
    create(inputData?: Partial<Prisma.PaymentMethodCreateInput>): PromiseLike<PaymentMethod>;
    createList(inputData: number | readonly Partial<Prisma.PaymentMethodCreateInput>[]): PromiseLike<PaymentMethod[]>;
    createForConnect(inputData?: Partial<Prisma.PaymentMethodCreateInput>): PromiseLike<Pick<PaymentMethod, "id">>;
}
export interface PaymentMethodFactoryInterface<TOptions extends PaymentMethodFactoryDefineOptions = PaymentMethodFactoryDefineOptions> extends PaymentMethodFactoryInterfaceWithoutTraits {
    use(name: PaymentMethodTraitKeys<TOptions>, ...names: readonly PaymentMethodTraitKeys<TOptions>[]): PaymentMethodFactoryInterfaceWithoutTraits;
}
/**
 * Define factory for {@link PaymentMethod} model.
 *
 * @param options
 * @returns factory {@link PaymentMethodFactoryInterface}
 */
export declare function definePaymentMethodFactory<TOptions extends PaymentMethodFactoryDefineOptions>(options?: TOptions): PaymentMethodFactoryInterface<TOptions>;
type PaymentpaymentMethodFactory = {
    _factoryFor: "PaymentMethod";
    build: () => PromiseLike<Prisma.PaymentMethodCreateNestedOneWithoutPaymentInput["create"]>;
};
type PaymentFactoryDefineInput = {
    id?: string;
    createdAt?: Date;
    modifiedAt?: Date;
    invoiceID?: string;
    state?: PaymentState;
    intentID?: string | null;
    intentSecret?: string | null;
    intentData?: string | null;
    paymentData?: string | null;
    paymentMethod: PaymentpaymentMethodFactory | Prisma.PaymentMethodCreateNestedOneWithoutPaymentInput;
};
type PaymentFactoryDefineOptions = {
    defaultData: Resolver<PaymentFactoryDefineInput, BuildDataOptions>;
    traits?: {
        [traitName: string | symbol]: {
            data: Resolver<Partial<PaymentFactoryDefineInput>, BuildDataOptions>;
        };
    };
};
type PaymentTraitKeys<TOptions extends PaymentFactoryDefineOptions> = keyof TOptions["traits"];
export interface PaymentFactoryInterfaceWithoutTraits {
    readonly _factoryFor: "Payment";
    build(inputData?: Partial<Prisma.PaymentCreateInput>): PromiseLike<Prisma.PaymentCreateInput>;
    buildCreateInput(inputData?: Partial<Prisma.PaymentCreateInput>): PromiseLike<Prisma.PaymentCreateInput>;
    buildList(inputData: number | readonly Partial<Prisma.PaymentCreateInput>[]): PromiseLike<Prisma.PaymentCreateInput[]>;
    pickForConnect(inputData: Payment): Pick<Payment, "id">;
    create(inputData?: Partial<Prisma.PaymentCreateInput>): PromiseLike<Payment>;
    createList(inputData: number | readonly Partial<Prisma.PaymentCreateInput>[]): PromiseLike<Payment[]>;
    createForConnect(inputData?: Partial<Prisma.PaymentCreateInput>): PromiseLike<Pick<Payment, "id">>;
}
export interface PaymentFactoryInterface<TOptions extends PaymentFactoryDefineOptions = PaymentFactoryDefineOptions> extends PaymentFactoryInterfaceWithoutTraits {
    use(name: PaymentTraitKeys<TOptions>, ...names: readonly PaymentTraitKeys<TOptions>[]): PaymentFactoryInterfaceWithoutTraits;
}
/**
 * Define factory for {@link Payment} model.
 *
 * @param options
 * @returns factory {@link PaymentFactoryInterface}
 */
export declare function definePaymentFactory<TOptions extends PaymentFactoryDefineOptions>(options: TOptions): PaymentFactoryInterface<TOptions>;
type PeerProfilelogoFactory = {
    _factoryFor: "Image";
    build: () => PromiseLike<Prisma.ImageCreateNestedOneWithoutPeerProfileInput["create"]>;
};
type PeerProfileFactoryDefineInput = {
    id?: string;
    name?: string;
    themeColor?: string;
    themeFontColor?: string;
    callToActionURL?: string;
    callToActionText?: Prisma.JsonNullValueInput | Prisma.InputJsonValue;
    callToActionImageURL?: string | null;
    callToActionImageID?: string | null;
    logo?: PeerProfilelogoFactory | Prisma.ImageCreateNestedOneWithoutPeerProfileInput;
};
type PeerProfileFactoryDefineOptions = {
    defaultData?: Resolver<PeerProfileFactoryDefineInput, BuildDataOptions>;
    traits?: {
        [traitName: string | symbol]: {
            data: Resolver<Partial<PeerProfileFactoryDefineInput>, BuildDataOptions>;
        };
    };
};
type PeerProfileTraitKeys<TOptions extends PeerProfileFactoryDefineOptions> = keyof TOptions["traits"];
export interface PeerProfileFactoryInterfaceWithoutTraits {
    readonly _factoryFor: "PeerProfile";
    build(inputData?: Partial<Prisma.PeerProfileCreateInput>): PromiseLike<Prisma.PeerProfileCreateInput>;
    buildCreateInput(inputData?: Partial<Prisma.PeerProfileCreateInput>): PromiseLike<Prisma.PeerProfileCreateInput>;
    buildList(inputData: number | readonly Partial<Prisma.PeerProfileCreateInput>[]): PromiseLike<Prisma.PeerProfileCreateInput[]>;
    pickForConnect(inputData: PeerProfile): Pick<PeerProfile, "id">;
    create(inputData?: Partial<Prisma.PeerProfileCreateInput>): PromiseLike<PeerProfile>;
    createList(inputData: number | readonly Partial<Prisma.PeerProfileCreateInput>[]): PromiseLike<PeerProfile[]>;
    createForConnect(inputData?: Partial<Prisma.PeerProfileCreateInput>): PromiseLike<Pick<PeerProfile, "id">>;
}
export interface PeerProfileFactoryInterface<TOptions extends PeerProfileFactoryDefineOptions = PeerProfileFactoryDefineOptions> extends PeerProfileFactoryInterfaceWithoutTraits {
    use(name: PeerProfileTraitKeys<TOptions>, ...names: readonly PeerProfileTraitKeys<TOptions>[]): PeerProfileFactoryInterfaceWithoutTraits;
}
/**
 * Define factory for {@link PeerProfile} model.
 *
 * @param options
 * @returns factory {@link PeerProfileFactoryInterface}
 */
export declare function definePeerProfileFactory<TOptions extends PeerProfileFactoryDefineOptions>(options?: TOptions): PeerProfileFactoryInterface<TOptions>;
type PeerFactoryDefineInput = {
    id?: string;
    createdAt?: Date;
    modifiedAt?: Date;
    name?: string;
    slug?: string;
    hostURL?: string;
    token?: string;
    isDisabled?: boolean;
    comments?: Prisma.CommentCreateNestedManyWithoutPeerInput;
};
type PeerFactoryDefineOptions = {
    defaultData?: Resolver<PeerFactoryDefineInput, BuildDataOptions>;
    traits?: {
        [traitName: string | symbol]: {
            data: Resolver<Partial<PeerFactoryDefineInput>, BuildDataOptions>;
        };
    };
};
type PeerTraitKeys<TOptions extends PeerFactoryDefineOptions> = keyof TOptions["traits"];
export interface PeerFactoryInterfaceWithoutTraits {
    readonly _factoryFor: "Peer";
    build(inputData?: Partial<Prisma.PeerCreateInput>): PromiseLike<Prisma.PeerCreateInput>;
    buildCreateInput(inputData?: Partial<Prisma.PeerCreateInput>): PromiseLike<Prisma.PeerCreateInput>;
    buildList(inputData: number | readonly Partial<Prisma.PeerCreateInput>[]): PromiseLike<Prisma.PeerCreateInput[]>;
    pickForConnect(inputData: Peer): Pick<Peer, "id">;
    create(inputData?: Partial<Prisma.PeerCreateInput>): PromiseLike<Peer>;
    createList(inputData: number | readonly Partial<Prisma.PeerCreateInput>[]): PromiseLike<Peer[]>;
    createForConnect(inputData?: Partial<Prisma.PeerCreateInput>): PromiseLike<Pick<Peer, "id">>;
}
export interface PeerFactoryInterface<TOptions extends PeerFactoryDefineOptions = PeerFactoryDefineOptions> extends PeerFactoryInterfaceWithoutTraits {
    use(name: PeerTraitKeys<TOptions>, ...names: readonly PeerTraitKeys<TOptions>[]): PeerFactoryInterfaceWithoutTraits;
}
/**
 * Define factory for {@link Peer} model.
 *
 * @param options
 * @returns factory {@link PeerFactoryInterface}
 */
export declare function definePeerFactory<TOptions extends PeerFactoryDefineOptions>(options?: TOptions): PeerFactoryInterface<TOptions>;
type TokenFactoryDefineInput = {
    id?: string;
    createdAt?: Date;
    modifiedAt?: Date;
    name?: string;
    token?: string;
    roleIDs?: Prisma.TokenCreateroleIDsInput | Prisma.Enumerable<string>;
};
type TokenFactoryDefineOptions = {
    defaultData?: Resolver<TokenFactoryDefineInput, BuildDataOptions>;
    traits?: {
        [traitName: string | symbol]: {
            data: Resolver<Partial<TokenFactoryDefineInput>, BuildDataOptions>;
        };
    };
};
type TokenTraitKeys<TOptions extends TokenFactoryDefineOptions> = keyof TOptions["traits"];
export interface TokenFactoryInterfaceWithoutTraits {
    readonly _factoryFor: "Token";
    build(inputData?: Partial<Prisma.TokenCreateInput>): PromiseLike<Prisma.TokenCreateInput>;
    buildCreateInput(inputData?: Partial<Prisma.TokenCreateInput>): PromiseLike<Prisma.TokenCreateInput>;
    buildList(inputData: number | readonly Partial<Prisma.TokenCreateInput>[]): PromiseLike<Prisma.TokenCreateInput[]>;
    pickForConnect(inputData: Token): Pick<Token, "id">;
    create(inputData?: Partial<Prisma.TokenCreateInput>): PromiseLike<Token>;
    createList(inputData: number | readonly Partial<Prisma.TokenCreateInput>[]): PromiseLike<Token[]>;
    createForConnect(inputData?: Partial<Prisma.TokenCreateInput>): PromiseLike<Pick<Token, "id">>;
}
export interface TokenFactoryInterface<TOptions extends TokenFactoryDefineOptions = TokenFactoryDefineOptions> extends TokenFactoryInterfaceWithoutTraits {
    use(name: TokenTraitKeys<TOptions>, ...names: readonly TokenTraitKeys<TOptions>[]): TokenFactoryInterfaceWithoutTraits;
}
/**
 * Define factory for {@link Token} model.
 *
 * @param options
 * @returns factory {@link TokenFactoryInterface}
 */
export declare function defineTokenFactory<TOptions extends TokenFactoryDefineOptions>(options?: TOptions): TokenFactoryInterface<TOptions>;
type SessionuserFactory = {
    _factoryFor: "User";
    build: () => PromiseLike<Prisma.UserCreateNestedOneWithoutSessionInput["create"]>;
};
type SessionFactoryDefineInput = {
    id?: string;
    createdAt?: Date;
    expiresAt?: Date;
    token?: string;
    user: SessionuserFactory | Prisma.UserCreateNestedOneWithoutSessionInput;
};
type SessionFactoryDefineOptions = {
    defaultData: Resolver<SessionFactoryDefineInput, BuildDataOptions>;
    traits?: {
        [traitName: string | symbol]: {
            data: Resolver<Partial<SessionFactoryDefineInput>, BuildDataOptions>;
        };
    };
};
type SessionTraitKeys<TOptions extends SessionFactoryDefineOptions> = keyof TOptions["traits"];
export interface SessionFactoryInterfaceWithoutTraits {
    readonly _factoryFor: "Session";
    build(inputData?: Partial<Prisma.SessionCreateInput>): PromiseLike<Prisma.SessionCreateInput>;
    buildCreateInput(inputData?: Partial<Prisma.SessionCreateInput>): PromiseLike<Prisma.SessionCreateInput>;
    buildList(inputData: number | readonly Partial<Prisma.SessionCreateInput>[]): PromiseLike<Prisma.SessionCreateInput[]>;
    pickForConnect(inputData: Session): Pick<Session, "id">;
    create(inputData?: Partial<Prisma.SessionCreateInput>): PromiseLike<Session>;
    createList(inputData: number | readonly Partial<Prisma.SessionCreateInput>[]): PromiseLike<Session[]>;
    createForConnect(inputData?: Partial<Prisma.SessionCreateInput>): PromiseLike<Pick<Session, "id">>;
}
export interface SessionFactoryInterface<TOptions extends SessionFactoryDefineOptions = SessionFactoryDefineOptions> extends SessionFactoryInterfaceWithoutTraits {
    use(name: SessionTraitKeys<TOptions>, ...names: readonly SessionTraitKeys<TOptions>[]): SessionFactoryInterfaceWithoutTraits;
}
/**
 * Define factory for {@link Session} model.
 *
 * @param options
 * @returns factory {@link SessionFactoryInterface}
 */
export declare function defineSessionFactory<TOptions extends SessionFactoryDefineOptions>(options: TOptions): SessionFactoryInterface<TOptions>;
type SubscriptionPeriodinvoiceFactory = {
    _factoryFor: "Invoice";
    build: () => PromiseLike<Prisma.InvoiceCreateNestedOneWithoutSubscriptionPeriodsInput["create"]>;
};
type SubscriptionPeriodsubscriptionFactory = {
    _factoryFor: "Subscription";
    build: () => PromiseLike<Prisma.SubscriptionCreateNestedOneWithoutPeriodsInput["create"]>;
};
type SubscriptionPeriodFactoryDefineInput = {
    id?: string;
    createdAt?: Date;
    modifiedAt?: Date;
    startsAt?: Date;
    endsAt?: Date;
    paymentPeriodicity?: PaymentPeriodicity;
    amount?: number;
    invoice: SubscriptionPeriodinvoiceFactory | Prisma.InvoiceCreateNestedOneWithoutSubscriptionPeriodsInput;
    subscription?: SubscriptionPeriodsubscriptionFactory | Prisma.SubscriptionCreateNestedOneWithoutPeriodsInput;
};
type SubscriptionPeriodFactoryDefineOptions = {
    defaultData: Resolver<SubscriptionPeriodFactoryDefineInput, BuildDataOptions>;
    traits?: {
        [traitName: string | symbol]: {
            data: Resolver<Partial<SubscriptionPeriodFactoryDefineInput>, BuildDataOptions>;
        };
    };
};
type SubscriptionPeriodTraitKeys<TOptions extends SubscriptionPeriodFactoryDefineOptions> = keyof TOptions["traits"];
export interface SubscriptionPeriodFactoryInterfaceWithoutTraits {
    readonly _factoryFor: "SubscriptionPeriod";
    build(inputData?: Partial<Prisma.SubscriptionPeriodCreateInput>): PromiseLike<Prisma.SubscriptionPeriodCreateInput>;
    buildCreateInput(inputData?: Partial<Prisma.SubscriptionPeriodCreateInput>): PromiseLike<Prisma.SubscriptionPeriodCreateInput>;
    buildList(inputData: number | readonly Partial<Prisma.SubscriptionPeriodCreateInput>[]): PromiseLike<Prisma.SubscriptionPeriodCreateInput[]>;
    pickForConnect(inputData: SubscriptionPeriod): Pick<SubscriptionPeriod, "id">;
    create(inputData?: Partial<Prisma.SubscriptionPeriodCreateInput>): PromiseLike<SubscriptionPeriod>;
    createList(inputData: number | readonly Partial<Prisma.SubscriptionPeriodCreateInput>[]): PromiseLike<SubscriptionPeriod[]>;
    createForConnect(inputData?: Partial<Prisma.SubscriptionPeriodCreateInput>): PromiseLike<Pick<SubscriptionPeriod, "id">>;
}
export interface SubscriptionPeriodFactoryInterface<TOptions extends SubscriptionPeriodFactoryDefineOptions = SubscriptionPeriodFactoryDefineOptions> extends SubscriptionPeriodFactoryInterfaceWithoutTraits {
    use(name: SubscriptionPeriodTraitKeys<TOptions>, ...names: readonly SubscriptionPeriodTraitKeys<TOptions>[]): SubscriptionPeriodFactoryInterfaceWithoutTraits;
}
/**
 * Define factory for {@link SubscriptionPeriod} model.
 *
 * @param options
 * @returns factory {@link SubscriptionPeriodFactoryInterface}
 */
export declare function defineSubscriptionPeriodFactory<TOptions extends SubscriptionPeriodFactoryDefineOptions>(options: TOptions): SubscriptionPeriodFactoryInterface<TOptions>;
type SubscriptionDeactivationsubscriptionFactory = {
    _factoryFor: "Subscription";
    build: () => PromiseLike<Prisma.SubscriptionCreateNestedOneWithoutDeactivationInput["create"]>;
};
type SubscriptionDeactivationFactoryDefineInput = {
    id?: string;
    createdAt?: Date;
    modifiedAt?: Date;
    date?: Date;
    reason?: SubscriptionDeactivationReason;
    subscription: SubscriptionDeactivationsubscriptionFactory | Prisma.SubscriptionCreateNestedOneWithoutDeactivationInput;
};
type SubscriptionDeactivationFactoryDefineOptions = {
    defaultData: Resolver<SubscriptionDeactivationFactoryDefineInput, BuildDataOptions>;
    traits?: {
        [traitName: string | symbol]: {
            data: Resolver<Partial<SubscriptionDeactivationFactoryDefineInput>, BuildDataOptions>;
        };
    };
};
type SubscriptionDeactivationTraitKeys<TOptions extends SubscriptionDeactivationFactoryDefineOptions> = keyof TOptions["traits"];
export interface SubscriptionDeactivationFactoryInterfaceWithoutTraits {
    readonly _factoryFor: "SubscriptionDeactivation";
    build(inputData?: Partial<Prisma.SubscriptionDeactivationCreateInput>): PromiseLike<Prisma.SubscriptionDeactivationCreateInput>;
    buildCreateInput(inputData?: Partial<Prisma.SubscriptionDeactivationCreateInput>): PromiseLike<Prisma.SubscriptionDeactivationCreateInput>;
    buildList(inputData: number | readonly Partial<Prisma.SubscriptionDeactivationCreateInput>[]): PromiseLike<Prisma.SubscriptionDeactivationCreateInput[]>;
    pickForConnect(inputData: SubscriptionDeactivation): Pick<SubscriptionDeactivation, "id">;
    create(inputData?: Partial<Prisma.SubscriptionDeactivationCreateInput>): PromiseLike<SubscriptionDeactivation>;
    createList(inputData: number | readonly Partial<Prisma.SubscriptionDeactivationCreateInput>[]): PromiseLike<SubscriptionDeactivation[]>;
    createForConnect(inputData?: Partial<Prisma.SubscriptionDeactivationCreateInput>): PromiseLike<Pick<SubscriptionDeactivation, "id">>;
}
export interface SubscriptionDeactivationFactoryInterface<TOptions extends SubscriptionDeactivationFactoryDefineOptions = SubscriptionDeactivationFactoryDefineOptions> extends SubscriptionDeactivationFactoryInterfaceWithoutTraits {
    use(name: SubscriptionDeactivationTraitKeys<TOptions>, ...names: readonly SubscriptionDeactivationTraitKeys<TOptions>[]): SubscriptionDeactivationFactoryInterfaceWithoutTraits;
}
/**
 * Define factory for {@link SubscriptionDeactivation} model.
 *
 * @param options
 * @returns factory {@link SubscriptionDeactivationFactoryInterface}
 */
export declare function defineSubscriptionDeactivationFactory<TOptions extends SubscriptionDeactivationFactoryDefineOptions>(options: TOptions): SubscriptionDeactivationFactoryInterface<TOptions>;
type SubscriptiondeactivationFactory = {
    _factoryFor: "SubscriptionDeactivation";
    build: () => PromiseLike<Prisma.SubscriptionDeactivationCreateNestedOneWithoutSubscriptionInput["create"]>;
};
type SubscriptionpaymentMethodFactory = {
    _factoryFor: "PaymentMethod";
    build: () => PromiseLike<Prisma.PaymentMethodCreateNestedOneWithoutSubscriptionInput["create"]>;
};
type SubscriptionmemberPlanFactory = {
    _factoryFor: "MemberPlan";
    build: () => PromiseLike<Prisma.MemberPlanCreateNestedOneWithoutSubscriptionInput["create"]>;
};
type SubscriptionuserFactory = {
    _factoryFor: "User";
    build: () => PromiseLike<Prisma.UserCreateNestedOneWithoutSubscriptionInput["create"]>;
};
type SubscriptionFactoryDefineInput = {
    id?: string;
    createdAt?: Date;
    modifiedAt?: Date;
    paymentPeriodicity?: PaymentPeriodicity;
    monthlyAmount?: number;
    autoRenew?: boolean;
    startsAt?: Date;
    paidUntil?: Date | null;
    extendable?: boolean;
    periods?: Prisma.SubscriptionPeriodCreateNestedManyWithoutSubscriptionInput;
    properties?: Prisma.MetadataPropertyCreateNestedManyWithoutSubscriptionInput;
    deactivation?: SubscriptiondeactivationFactory | Prisma.SubscriptionDeactivationCreateNestedOneWithoutSubscriptionInput;
    paymentMethod: SubscriptionpaymentMethodFactory | Prisma.PaymentMethodCreateNestedOneWithoutSubscriptionInput;
    memberPlan: SubscriptionmemberPlanFactory | Prisma.MemberPlanCreateNestedOneWithoutSubscriptionInput;
    user: SubscriptionuserFactory | Prisma.UserCreateNestedOneWithoutSubscriptionInput;
    invoices?: Prisma.InvoiceCreateNestedManyWithoutSubscriptionInput;
};
type SubscriptionFactoryDefineOptions = {
    defaultData: Resolver<SubscriptionFactoryDefineInput, BuildDataOptions>;
    traits?: {
        [traitName: string | symbol]: {
            data: Resolver<Partial<SubscriptionFactoryDefineInput>, BuildDataOptions>;
        };
    };
};
type SubscriptionTraitKeys<TOptions extends SubscriptionFactoryDefineOptions> = keyof TOptions["traits"];
export interface SubscriptionFactoryInterfaceWithoutTraits {
    readonly _factoryFor: "Subscription";
    build(inputData?: Partial<Prisma.SubscriptionCreateInput>): PromiseLike<Prisma.SubscriptionCreateInput>;
    buildCreateInput(inputData?: Partial<Prisma.SubscriptionCreateInput>): PromiseLike<Prisma.SubscriptionCreateInput>;
    buildList(inputData: number | readonly Partial<Prisma.SubscriptionCreateInput>[]): PromiseLike<Prisma.SubscriptionCreateInput[]>;
    pickForConnect(inputData: Subscription): Pick<Subscription, "id">;
    create(inputData?: Partial<Prisma.SubscriptionCreateInput>): PromiseLike<Subscription>;
    createList(inputData: number | readonly Partial<Prisma.SubscriptionCreateInput>[]): PromiseLike<Subscription[]>;
    createForConnect(inputData?: Partial<Prisma.SubscriptionCreateInput>): PromiseLike<Pick<Subscription, "id">>;
}
export interface SubscriptionFactoryInterface<TOptions extends SubscriptionFactoryDefineOptions = SubscriptionFactoryDefineOptions> extends SubscriptionFactoryInterfaceWithoutTraits {
    use(name: SubscriptionTraitKeys<TOptions>, ...names: readonly SubscriptionTraitKeys<TOptions>[]): SubscriptionFactoryInterfaceWithoutTraits;
}
/**
 * Define factory for {@link Subscription} model.
 *
 * @param options
 * @returns factory {@link SubscriptionFactoryInterface}
 */
export declare function defineSubscriptionFactory<TOptions extends SubscriptionFactoryDefineOptions>(options: TOptions): SubscriptionFactoryInterface<TOptions>;
type UserAddressUserFactory = {
    _factoryFor: "User";
    build: () => PromiseLike<Prisma.UserCreateNestedOneWithoutAddressInput["create"]>;
};
type UserAddressFactoryDefineInput = {
    createdAt?: Date;
    modifiedAt?: Date;
    company?: string | null;
    streetAddress?: string | null;
    streetAddress2?: string | null;
    zipCode?: string | null;
    city?: string | null;
    country?: string | null;
    User: UserAddressUserFactory | Prisma.UserCreateNestedOneWithoutAddressInput;
};
type UserAddressFactoryDefineOptions = {
    defaultData: Resolver<UserAddressFactoryDefineInput, BuildDataOptions>;
    traits?: {
        [traitName: string | symbol]: {
            data: Resolver<Partial<UserAddressFactoryDefineInput>, BuildDataOptions>;
        };
    };
};
type UserAddressTraitKeys<TOptions extends UserAddressFactoryDefineOptions> = keyof TOptions["traits"];
export interface UserAddressFactoryInterfaceWithoutTraits {
    readonly _factoryFor: "UserAddress";
    build(inputData?: Partial<Prisma.UserAddressCreateInput>): PromiseLike<Prisma.UserAddressCreateInput>;
    buildCreateInput(inputData?: Partial<Prisma.UserAddressCreateInput>): PromiseLike<Prisma.UserAddressCreateInput>;
    buildList(inputData: number | readonly Partial<Prisma.UserAddressCreateInput>[]): PromiseLike<Prisma.UserAddressCreateInput[]>;
    pickForConnect(inputData: UserAddress): Pick<UserAddress, "userId">;
    create(inputData?: Partial<Prisma.UserAddressCreateInput>): PromiseLike<UserAddress>;
    createList(inputData: number | readonly Partial<Prisma.UserAddressCreateInput>[]): PromiseLike<UserAddress[]>;
    createForConnect(inputData?: Partial<Prisma.UserAddressCreateInput>): PromiseLike<Pick<UserAddress, "userId">>;
}
export interface UserAddressFactoryInterface<TOptions extends UserAddressFactoryDefineOptions = UserAddressFactoryDefineOptions> extends UserAddressFactoryInterfaceWithoutTraits {
    use(name: UserAddressTraitKeys<TOptions>, ...names: readonly UserAddressTraitKeys<TOptions>[]): UserAddressFactoryInterfaceWithoutTraits;
}
/**
 * Define factory for {@link UserAddress} model.
 *
 * @param options
 * @returns factory {@link UserAddressFactoryInterface}
 */
export declare function defineUserAddressFactory<TOptions extends UserAddressFactoryDefineOptions>(options: TOptions): UserAddressFactoryInterface<TOptions>;
type UserOAuth2AccountUserFactory = {
    _factoryFor: "User";
    build: () => PromiseLike<Prisma.UserCreateNestedOneWithoutOauth2AccountsInput["create"]>;
};
type UserOAuth2AccountFactoryDefineInput = {
    id?: string;
    createdAt?: Date;
    modifiedAt?: Date;
    type?: string;
    provider?: string;
    providerAccountId?: string;
    refreshToken?: string | null;
    accessToken?: string;
    expiresAt?: number;
    tokenType?: string;
    scope?: string;
    idToken?: string;
    oauthTokenSecret?: string | null;
    oauthToken?: string | null;
    sessionState?: string | null;
    User?: UserOAuth2AccountUserFactory | Prisma.UserCreateNestedOneWithoutOauth2AccountsInput;
};
type UserOAuth2AccountFactoryDefineOptions = {
    defaultData?: Resolver<UserOAuth2AccountFactoryDefineInput, BuildDataOptions>;
    traits?: {
        [traitName: string | symbol]: {
            data: Resolver<Partial<UserOAuth2AccountFactoryDefineInput>, BuildDataOptions>;
        };
    };
};
type UserOAuth2AccountTraitKeys<TOptions extends UserOAuth2AccountFactoryDefineOptions> = keyof TOptions["traits"];
export interface UserOAuth2AccountFactoryInterfaceWithoutTraits {
    readonly _factoryFor: "UserOAuth2Account";
    build(inputData?: Partial<Prisma.UserOAuth2AccountCreateInput>): PromiseLike<Prisma.UserOAuth2AccountCreateInput>;
    buildCreateInput(inputData?: Partial<Prisma.UserOAuth2AccountCreateInput>): PromiseLike<Prisma.UserOAuth2AccountCreateInput>;
    buildList(inputData: number | readonly Partial<Prisma.UserOAuth2AccountCreateInput>[]): PromiseLike<Prisma.UserOAuth2AccountCreateInput[]>;
    pickForConnect(inputData: UserOAuth2Account): Pick<UserOAuth2Account, "id">;
    create(inputData?: Partial<Prisma.UserOAuth2AccountCreateInput>): PromiseLike<UserOAuth2Account>;
    createList(inputData: number | readonly Partial<Prisma.UserOAuth2AccountCreateInput>[]): PromiseLike<UserOAuth2Account[]>;
    createForConnect(inputData?: Partial<Prisma.UserOAuth2AccountCreateInput>): PromiseLike<Pick<UserOAuth2Account, "id">>;
}
export interface UserOAuth2AccountFactoryInterface<TOptions extends UserOAuth2AccountFactoryDefineOptions = UserOAuth2AccountFactoryDefineOptions> extends UserOAuth2AccountFactoryInterfaceWithoutTraits {
    use(name: UserOAuth2AccountTraitKeys<TOptions>, ...names: readonly UserOAuth2AccountTraitKeys<TOptions>[]): UserOAuth2AccountFactoryInterfaceWithoutTraits;
}
/**
 * Define factory for {@link UserOAuth2Account} model.
 *
 * @param options
 * @returns factory {@link UserOAuth2AccountFactoryInterface}
 */
export declare function defineUserOAuth2AccountFactory<TOptions extends UserOAuth2AccountFactoryDefineOptions>(options?: TOptions): UserOAuth2AccountFactoryInterface<TOptions>;
type PaymentProviderCustomerUserFactory = {
    _factoryFor: "User";
    build: () => PromiseLike<Prisma.UserCreateNestedOneWithoutPaymentProviderCustomersInput["create"]>;
};
type PaymentProviderCustomerFactoryDefineInput = {
    id?: string;
    createdAt?: Date;
    modifiedAt?: Date;
    paymentProviderID?: string;
    customerID?: string;
    User?: PaymentProviderCustomerUserFactory | Prisma.UserCreateNestedOneWithoutPaymentProviderCustomersInput;
};
type PaymentProviderCustomerFactoryDefineOptions = {
    defaultData?: Resolver<PaymentProviderCustomerFactoryDefineInput, BuildDataOptions>;
    traits?: {
        [traitName: string | symbol]: {
            data: Resolver<Partial<PaymentProviderCustomerFactoryDefineInput>, BuildDataOptions>;
        };
    };
};
type PaymentProviderCustomerTraitKeys<TOptions extends PaymentProviderCustomerFactoryDefineOptions> = keyof TOptions["traits"];
export interface PaymentProviderCustomerFactoryInterfaceWithoutTraits {
    readonly _factoryFor: "PaymentProviderCustomer";
    build(inputData?: Partial<Prisma.PaymentProviderCustomerCreateInput>): PromiseLike<Prisma.PaymentProviderCustomerCreateInput>;
    buildCreateInput(inputData?: Partial<Prisma.PaymentProviderCustomerCreateInput>): PromiseLike<Prisma.PaymentProviderCustomerCreateInput>;
    buildList(inputData: number | readonly Partial<Prisma.PaymentProviderCustomerCreateInput>[]): PromiseLike<Prisma.PaymentProviderCustomerCreateInput[]>;
    pickForConnect(inputData: PaymentProviderCustomer): Pick<PaymentProviderCustomer, "id">;
    create(inputData?: Partial<Prisma.PaymentProviderCustomerCreateInput>): PromiseLike<PaymentProviderCustomer>;
    createList(inputData: number | readonly Partial<Prisma.PaymentProviderCustomerCreateInput>[]): PromiseLike<PaymentProviderCustomer[]>;
    createForConnect(inputData?: Partial<Prisma.PaymentProviderCustomerCreateInput>): PromiseLike<Pick<PaymentProviderCustomer, "id">>;
}
export interface PaymentProviderCustomerFactoryInterface<TOptions extends PaymentProviderCustomerFactoryDefineOptions = PaymentProviderCustomerFactoryDefineOptions> extends PaymentProviderCustomerFactoryInterfaceWithoutTraits {
    use(name: PaymentProviderCustomerTraitKeys<TOptions>, ...names: readonly PaymentProviderCustomerTraitKeys<TOptions>[]): PaymentProviderCustomerFactoryInterfaceWithoutTraits;
}
/**
 * Define factory for {@link PaymentProviderCustomer} model.
 *
 * @param options
 * @returns factory {@link PaymentProviderCustomerFactoryInterface}
 */
export declare function definePaymentProviderCustomerFactory<TOptions extends PaymentProviderCustomerFactoryDefineOptions>(options?: TOptions): PaymentProviderCustomerFactoryInterface<TOptions>;
type UseruserImageFactory = {
    _factoryFor: "Image";
    build: () => PromiseLike<Prisma.ImageCreateNestedOneWithoutUsersInput["create"]>;
};
type UseraddressFactory = {
    _factoryFor: "UserAddress";
    build: () => PromiseLike<Prisma.UserAddressCreateNestedOneWithoutUserInput["create"]>;
};
type UserFactoryDefineInput = {
    id?: string;
    createdAt?: Date;
    modifiedAt?: Date;
    email?: string;
    emailVerifiedAt?: Date | null;
    name?: string;
    firstName?: string | null;
    preferredName?: string | null;
    flair?: string | null;
    password?: string;
    active?: boolean;
    lastLogin?: Date | null;
    roleIDs?: Prisma.UserCreateroleIDsInput | Prisma.Enumerable<string>;
    userImage?: UseruserImageFactory | Prisma.ImageCreateNestedOneWithoutUsersInput;
    address?: UseraddressFactory | Prisma.UserAddressCreateNestedOneWithoutUserInput;
    properties?: Prisma.MetadataPropertyCreateNestedManyWithoutUserInput;
    oauth2Accounts?: Prisma.UserOAuth2AccountCreateNestedManyWithoutUserInput;
    paymentProviderCustomers?: Prisma.PaymentProviderCustomerCreateNestedManyWithoutUserInput;
    Comment?: Prisma.CommentCreateNestedManyWithoutUserInput;
    Session?: Prisma.SessionCreateNestedManyWithoutUserInput;
    Subscription?: Prisma.SubscriptionCreateNestedManyWithoutUserInput;
    CommentRating?: Prisma.CommentRatingCreateNestedManyWithoutUserInput;
    PollVote?: Prisma.PollVoteCreateNestedManyWithoutUserInput;
    mailSent?: Prisma.MailLogCreateNestedManyWithoutRecipientInput;
    UserConsent?: Prisma.UserConsentCreateNestedManyWithoutUserInput;
};
type UserFactoryDefineOptions = {
    defaultData?: Resolver<UserFactoryDefineInput, BuildDataOptions>;
    traits?: {
        [traitName: string | symbol]: {
            data: Resolver<Partial<UserFactoryDefineInput>, BuildDataOptions>;
        };
    };
};
type UserTraitKeys<TOptions extends UserFactoryDefineOptions> = keyof TOptions["traits"];
export interface UserFactoryInterfaceWithoutTraits {
    readonly _factoryFor: "User";
    build(inputData?: Partial<Prisma.UserCreateInput>): PromiseLike<Prisma.UserCreateInput>;
    buildCreateInput(inputData?: Partial<Prisma.UserCreateInput>): PromiseLike<Prisma.UserCreateInput>;
    buildList(inputData: number | readonly Partial<Prisma.UserCreateInput>[]): PromiseLike<Prisma.UserCreateInput[]>;
    pickForConnect(inputData: User): Pick<User, "id">;
    create(inputData?: Partial<Prisma.UserCreateInput>): PromiseLike<User>;
    createList(inputData: number | readonly Partial<Prisma.UserCreateInput>[]): PromiseLike<User[]>;
    createForConnect(inputData?: Partial<Prisma.UserCreateInput>): PromiseLike<Pick<User, "id">>;
}
export interface UserFactoryInterface<TOptions extends UserFactoryDefineOptions = UserFactoryDefineOptions> extends UserFactoryInterfaceWithoutTraits {
    use(name: UserTraitKeys<TOptions>, ...names: readonly UserTraitKeys<TOptions>[]): UserFactoryInterfaceWithoutTraits;
}
/**
 * Define factory for {@link User} model.
 *
 * @param options
 * @returns factory {@link UserFactoryInterface}
 */
export declare function defineUserFactory<TOptions extends UserFactoryDefineOptions>(options?: TOptions): UserFactoryInterface<TOptions>;
type UserRoleFactoryDefineInput = {
    id?: string;
    createdAt?: Date;
    modifiedAt?: Date;
    description?: string | null;
    name?: string;
    permissionIDs?: Prisma.UserRoleCreatepermissionIDsInput | Prisma.Enumerable<string>;
    systemRole?: boolean;
};
type UserRoleFactoryDefineOptions = {
    defaultData?: Resolver<UserRoleFactoryDefineInput, BuildDataOptions>;
    traits?: {
        [traitName: string | symbol]: {
            data: Resolver<Partial<UserRoleFactoryDefineInput>, BuildDataOptions>;
        };
    };
};
type UserRoleTraitKeys<TOptions extends UserRoleFactoryDefineOptions> = keyof TOptions["traits"];
export interface UserRoleFactoryInterfaceWithoutTraits {
    readonly _factoryFor: "UserRole";
    build(inputData?: Partial<Prisma.UserRoleCreateInput>): PromiseLike<Prisma.UserRoleCreateInput>;
    buildCreateInput(inputData?: Partial<Prisma.UserRoleCreateInput>): PromiseLike<Prisma.UserRoleCreateInput>;
    buildList(inputData: number | readonly Partial<Prisma.UserRoleCreateInput>[]): PromiseLike<Prisma.UserRoleCreateInput[]>;
    pickForConnect(inputData: UserRole): Pick<UserRole, "id">;
    create(inputData?: Partial<Prisma.UserRoleCreateInput>): PromiseLike<UserRole>;
    createList(inputData: number | readonly Partial<Prisma.UserRoleCreateInput>[]): PromiseLike<UserRole[]>;
    createForConnect(inputData?: Partial<Prisma.UserRoleCreateInput>): PromiseLike<Pick<UserRole, "id">>;
}
export interface UserRoleFactoryInterface<TOptions extends UserRoleFactoryDefineOptions = UserRoleFactoryDefineOptions> extends UserRoleFactoryInterfaceWithoutTraits {
    use(name: UserRoleTraitKeys<TOptions>, ...names: readonly UserRoleTraitKeys<TOptions>[]): UserRoleFactoryInterfaceWithoutTraits;
}
/**
 * Define factory for {@link UserRole} model.
 *
 * @param options
 * @returns factory {@link UserRoleFactoryInterface}
 */
export declare function defineUserRoleFactory<TOptions extends UserRoleFactoryDefineOptions>(options?: TOptions): UserRoleFactoryInterface<TOptions>;
type SettingFactoryDefineInput = {
    id?: string;
    createdAt?: Date;
    modifiedAt?: Date;
    name?: string;
    value?: Prisma.JsonNullValueInput | Prisma.InputJsonValue;
    settingRestriction?: Prisma.JsonNullValueInput | Prisma.InputJsonValue;
};
type SettingFactoryDefineOptions = {
    defaultData?: Resolver<SettingFactoryDefineInput, BuildDataOptions>;
    traits?: {
        [traitName: string | symbol]: {
            data: Resolver<Partial<SettingFactoryDefineInput>, BuildDataOptions>;
        };
    };
};
type SettingTraitKeys<TOptions extends SettingFactoryDefineOptions> = keyof TOptions["traits"];
export interface SettingFactoryInterfaceWithoutTraits {
    readonly _factoryFor: "Setting";
    build(inputData?: Partial<Prisma.SettingCreateInput>): PromiseLike<Prisma.SettingCreateInput>;
    buildCreateInput(inputData?: Partial<Prisma.SettingCreateInput>): PromiseLike<Prisma.SettingCreateInput>;
    buildList(inputData: number | readonly Partial<Prisma.SettingCreateInput>[]): PromiseLike<Prisma.SettingCreateInput[]>;
    pickForConnect(inputData: Setting): Pick<Setting, "id">;
    create(inputData?: Partial<Prisma.SettingCreateInput>): PromiseLike<Setting>;
    createList(inputData: number | readonly Partial<Prisma.SettingCreateInput>[]): PromiseLike<Setting[]>;
    createForConnect(inputData?: Partial<Prisma.SettingCreateInput>): PromiseLike<Pick<Setting, "id">>;
}
export interface SettingFactoryInterface<TOptions extends SettingFactoryDefineOptions = SettingFactoryDefineOptions> extends SettingFactoryInterfaceWithoutTraits {
    use(name: SettingTraitKeys<TOptions>, ...names: readonly SettingTraitKeys<TOptions>[]): SettingFactoryInterfaceWithoutTraits;
}
/**
 * Define factory for {@link Setting} model.
 *
 * @param options
 * @returns factory {@link SettingFactoryInterface}
 */
export declare function defineSettingFactory<TOptions extends SettingFactoryDefineOptions>(options?: TOptions): SettingFactoryInterface<TOptions>;
type TagFactoryDefineInput = {
    id?: string;
    createdAt?: Date;
    modifiedAt?: Date;
    type?: TagType;
    tag?: string | null;
    main?: boolean;
    comments?: Prisma.TaggedCommentsCreateNestedManyWithoutTagInput;
    events?: Prisma.TaggedEventsCreateNestedManyWithoutTagInput;
    authors?: Prisma.TaggedAuthorsCreateNestedManyWithoutTagInput;
    articles?: Prisma.TaggedArticlesCreateNestedManyWithoutTagInput;
    pages?: Prisma.TaggedPagesCreateNestedManyWithoutTagInput;
};
type TagFactoryDefineOptions = {
    defaultData?: Resolver<TagFactoryDefineInput, BuildDataOptions>;
    traits?: {
        [traitName: string | symbol]: {
            data: Resolver<Partial<TagFactoryDefineInput>, BuildDataOptions>;
        };
    };
};
type TagTraitKeys<TOptions extends TagFactoryDefineOptions> = keyof TOptions["traits"];
export interface TagFactoryInterfaceWithoutTraits {
    readonly _factoryFor: "Tag";
    build(inputData?: Partial<Prisma.TagCreateInput>): PromiseLike<Prisma.TagCreateInput>;
    buildCreateInput(inputData?: Partial<Prisma.TagCreateInput>): PromiseLike<Prisma.TagCreateInput>;
    buildList(inputData: number | readonly Partial<Prisma.TagCreateInput>[]): PromiseLike<Prisma.TagCreateInput[]>;
    pickForConnect(inputData: Tag): Pick<Tag, "id">;
    create(inputData?: Partial<Prisma.TagCreateInput>): PromiseLike<Tag>;
    createList(inputData: number | readonly Partial<Prisma.TagCreateInput>[]): PromiseLike<Tag[]>;
    createForConnect(inputData?: Partial<Prisma.TagCreateInput>): PromiseLike<Pick<Tag, "id">>;
}
export interface TagFactoryInterface<TOptions extends TagFactoryDefineOptions = TagFactoryDefineOptions> extends TagFactoryInterfaceWithoutTraits {
    use(name: TagTraitKeys<TOptions>, ...names: readonly TagTraitKeys<TOptions>[]): TagFactoryInterfaceWithoutTraits;
}
/**
 * Define factory for {@link Tag} model.
 *
 * @param options
 * @returns factory {@link TagFactoryInterface}
 */
export declare function defineTagFactory<TOptions extends TagFactoryDefineOptions>(options?: TOptions): TagFactoryInterface<TOptions>;
type PollFactoryDefineInput = {
    id?: string;
    createdAt?: Date;
    modifiedAt?: Date;
    opensAt?: Date;
    closedAt?: Date | null;
    question?: string | null;
    infoText?: Prisma.NullableJsonNullValueInput | Prisma.InputJsonValue;
    answers?: Prisma.PollAnswerCreateNestedManyWithoutPollInput;
    votes?: Prisma.PollVoteCreateNestedManyWithoutPollInput;
    externalVoteSources?: Prisma.PollExternalVoteSourceCreateNestedManyWithoutPollInput;
};
type PollFactoryDefineOptions = {
    defaultData?: Resolver<PollFactoryDefineInput, BuildDataOptions>;
    traits?: {
        [traitName: string | symbol]: {
            data: Resolver<Partial<PollFactoryDefineInput>, BuildDataOptions>;
        };
    };
};
type PollTraitKeys<TOptions extends PollFactoryDefineOptions> = keyof TOptions["traits"];
export interface PollFactoryInterfaceWithoutTraits {
    readonly _factoryFor: "Poll";
    build(inputData?: Partial<Prisma.PollCreateInput>): PromiseLike<Prisma.PollCreateInput>;
    buildCreateInput(inputData?: Partial<Prisma.PollCreateInput>): PromiseLike<Prisma.PollCreateInput>;
    buildList(inputData: number | readonly Partial<Prisma.PollCreateInput>[]): PromiseLike<Prisma.PollCreateInput[]>;
    pickForConnect(inputData: Poll): Pick<Poll, "id">;
    create(inputData?: Partial<Prisma.PollCreateInput>): PromiseLike<Poll>;
    createList(inputData: number | readonly Partial<Prisma.PollCreateInput>[]): PromiseLike<Poll[]>;
    createForConnect(inputData?: Partial<Prisma.PollCreateInput>): PromiseLike<Pick<Poll, "id">>;
}
export interface PollFactoryInterface<TOptions extends PollFactoryDefineOptions = PollFactoryDefineOptions> extends PollFactoryInterfaceWithoutTraits {
    use(name: PollTraitKeys<TOptions>, ...names: readonly PollTraitKeys<TOptions>[]): PollFactoryInterfaceWithoutTraits;
}
/**
 * Define factory for {@link Poll} model.
 *
 * @param options
 * @returns factory {@link PollFactoryInterface}
 */
export declare function definePollFactory<TOptions extends PollFactoryDefineOptions>(options?: TOptions): PollFactoryInterface<TOptions>;
type PollAnswerpollFactory = {
    _factoryFor: "Poll";
    build: () => PromiseLike<Prisma.PollCreateNestedOneWithoutAnswersInput["create"]>;
};
type PollAnswerFactoryDefineInput = {
    id?: string;
    createdAt?: Date;
    modifiedAt?: Date;
    answer?: string | null;
    poll: PollAnswerpollFactory | Prisma.PollCreateNestedOneWithoutAnswersInput;
    votes?: Prisma.PollVoteCreateNestedManyWithoutAnswerInput;
    externalVotes?: Prisma.PollExternalVoteCreateNestedManyWithoutAnswerInput;
};
type PollAnswerFactoryDefineOptions = {
    defaultData: Resolver<PollAnswerFactoryDefineInput, BuildDataOptions>;
    traits?: {
        [traitName: string | symbol]: {
            data: Resolver<Partial<PollAnswerFactoryDefineInput>, BuildDataOptions>;
        };
    };
};
type PollAnswerTraitKeys<TOptions extends PollAnswerFactoryDefineOptions> = keyof TOptions["traits"];
export interface PollAnswerFactoryInterfaceWithoutTraits {
    readonly _factoryFor: "PollAnswer";
    build(inputData?: Partial<Prisma.PollAnswerCreateInput>): PromiseLike<Prisma.PollAnswerCreateInput>;
    buildCreateInput(inputData?: Partial<Prisma.PollAnswerCreateInput>): PromiseLike<Prisma.PollAnswerCreateInput>;
    buildList(inputData: number | readonly Partial<Prisma.PollAnswerCreateInput>[]): PromiseLike<Prisma.PollAnswerCreateInput[]>;
    pickForConnect(inputData: PollAnswer): Pick<PollAnswer, "id">;
    create(inputData?: Partial<Prisma.PollAnswerCreateInput>): PromiseLike<PollAnswer>;
    createList(inputData: number | readonly Partial<Prisma.PollAnswerCreateInput>[]): PromiseLike<PollAnswer[]>;
    createForConnect(inputData?: Partial<Prisma.PollAnswerCreateInput>): PromiseLike<Pick<PollAnswer, "id">>;
}
export interface PollAnswerFactoryInterface<TOptions extends PollAnswerFactoryDefineOptions = PollAnswerFactoryDefineOptions> extends PollAnswerFactoryInterfaceWithoutTraits {
    use(name: PollAnswerTraitKeys<TOptions>, ...names: readonly PollAnswerTraitKeys<TOptions>[]): PollAnswerFactoryInterfaceWithoutTraits;
}
/**
 * Define factory for {@link PollAnswer} model.
 *
 * @param options
 * @returns factory {@link PollAnswerFactoryInterface}
 */
export declare function definePollAnswerFactory<TOptions extends PollAnswerFactoryDefineOptions>(options: TOptions): PollAnswerFactoryInterface<TOptions>;
type PollVoteuserFactory = {
    _factoryFor: "User";
    build: () => PromiseLike<Prisma.UserCreateNestedOneWithoutPollVoteInput["create"]>;
};
type PollVoteanswerFactory = {
    _factoryFor: "PollAnswer";
    build: () => PromiseLike<Prisma.PollAnswerCreateNestedOneWithoutVotesInput["create"]>;
};
type PollVotepollFactory = {
    _factoryFor: "Poll";
    build: () => PromiseLike<Prisma.PollCreateNestedOneWithoutVotesInput["create"]>;
};
type PollVoteFactoryDefineInput = {
    id?: string;
    createdAt?: Date;
    modifiedAt?: Date;
    fingerprint?: string | null;
    disabled?: boolean;
    user?: PollVoteuserFactory | Prisma.UserCreateNestedOneWithoutPollVoteInput;
    answer: PollVoteanswerFactory | Prisma.PollAnswerCreateNestedOneWithoutVotesInput;
    poll: PollVotepollFactory | Prisma.PollCreateNestedOneWithoutVotesInput;
};
type PollVoteFactoryDefineOptions = {
    defaultData: Resolver<PollVoteFactoryDefineInput, BuildDataOptions>;
    traits?: {
        [traitName: string | symbol]: {
            data: Resolver<Partial<PollVoteFactoryDefineInput>, BuildDataOptions>;
        };
    };
};
type PollVoteTraitKeys<TOptions extends PollVoteFactoryDefineOptions> = keyof TOptions["traits"];
export interface PollVoteFactoryInterfaceWithoutTraits {
    readonly _factoryFor: "PollVote";
    build(inputData?: Partial<Prisma.PollVoteCreateInput>): PromiseLike<Prisma.PollVoteCreateInput>;
    buildCreateInput(inputData?: Partial<Prisma.PollVoteCreateInput>): PromiseLike<Prisma.PollVoteCreateInput>;
    buildList(inputData: number | readonly Partial<Prisma.PollVoteCreateInput>[]): PromiseLike<Prisma.PollVoteCreateInput[]>;
    pickForConnect(inputData: PollVote): Pick<PollVote, "id">;
    create(inputData?: Partial<Prisma.PollVoteCreateInput>): PromiseLike<PollVote>;
    createList(inputData: number | readonly Partial<Prisma.PollVoteCreateInput>[]): PromiseLike<PollVote[]>;
    createForConnect(inputData?: Partial<Prisma.PollVoteCreateInput>): PromiseLike<Pick<PollVote, "id">>;
}
export interface PollVoteFactoryInterface<TOptions extends PollVoteFactoryDefineOptions = PollVoteFactoryDefineOptions> extends PollVoteFactoryInterfaceWithoutTraits {
    use(name: PollVoteTraitKeys<TOptions>, ...names: readonly PollVoteTraitKeys<TOptions>[]): PollVoteFactoryInterfaceWithoutTraits;
}
/**
 * Define factory for {@link PollVote} model.
 *
 * @param options
 * @returns factory {@link PollVoteFactoryInterface}
 */
export declare function definePollVoteFactory<TOptions extends PollVoteFactoryDefineOptions>(options: TOptions): PollVoteFactoryInterface<TOptions>;
type PollExternalVoteSourcepollFactory = {
    _factoryFor: "Poll";
    build: () => PromiseLike<Prisma.PollCreateNestedOneWithoutExternalVoteSourcesInput["create"]>;
};
type PollExternalVoteSourceFactoryDefineInput = {
    id?: string;
    createdAt?: Date;
    modifiedAt?: Date;
    source?: string | null;
    poll: PollExternalVoteSourcepollFactory | Prisma.PollCreateNestedOneWithoutExternalVoteSourcesInput;
    voteAmounts?: Prisma.PollExternalVoteCreateNestedManyWithoutSourceInput;
};
type PollExternalVoteSourceFactoryDefineOptions = {
    defaultData: Resolver<PollExternalVoteSourceFactoryDefineInput, BuildDataOptions>;
    traits?: {
        [traitName: string | symbol]: {
            data: Resolver<Partial<PollExternalVoteSourceFactoryDefineInput>, BuildDataOptions>;
        };
    };
};
type PollExternalVoteSourceTraitKeys<TOptions extends PollExternalVoteSourceFactoryDefineOptions> = keyof TOptions["traits"];
export interface PollExternalVoteSourceFactoryInterfaceWithoutTraits {
    readonly _factoryFor: "PollExternalVoteSource";
    build(inputData?: Partial<Prisma.PollExternalVoteSourceCreateInput>): PromiseLike<Prisma.PollExternalVoteSourceCreateInput>;
    buildCreateInput(inputData?: Partial<Prisma.PollExternalVoteSourceCreateInput>): PromiseLike<Prisma.PollExternalVoteSourceCreateInput>;
    buildList(inputData: number | readonly Partial<Prisma.PollExternalVoteSourceCreateInput>[]): PromiseLike<Prisma.PollExternalVoteSourceCreateInput[]>;
    pickForConnect(inputData: PollExternalVoteSource): Pick<PollExternalVoteSource, "id">;
    create(inputData?: Partial<Prisma.PollExternalVoteSourceCreateInput>): PromiseLike<PollExternalVoteSource>;
    createList(inputData: number | readonly Partial<Prisma.PollExternalVoteSourceCreateInput>[]): PromiseLike<PollExternalVoteSource[]>;
    createForConnect(inputData?: Partial<Prisma.PollExternalVoteSourceCreateInput>): PromiseLike<Pick<PollExternalVoteSource, "id">>;
}
export interface PollExternalVoteSourceFactoryInterface<TOptions extends PollExternalVoteSourceFactoryDefineOptions = PollExternalVoteSourceFactoryDefineOptions> extends PollExternalVoteSourceFactoryInterfaceWithoutTraits {
    use(name: PollExternalVoteSourceTraitKeys<TOptions>, ...names: readonly PollExternalVoteSourceTraitKeys<TOptions>[]): PollExternalVoteSourceFactoryInterfaceWithoutTraits;
}
/**
 * Define factory for {@link PollExternalVoteSource} model.
 *
 * @param options
 * @returns factory {@link PollExternalVoteSourceFactoryInterface}
 */
export declare function definePollExternalVoteSourceFactory<TOptions extends PollExternalVoteSourceFactoryDefineOptions>(options: TOptions): PollExternalVoteSourceFactoryInterface<TOptions>;
type PollExternalVoteanswerFactory = {
    _factoryFor: "PollAnswer";
    build: () => PromiseLike<Prisma.PollAnswerCreateNestedOneWithoutExternalVotesInput["create"]>;
};
type PollExternalVotesourceFactory = {
    _factoryFor: "PollExternalVoteSource";
    build: () => PromiseLike<Prisma.PollExternalVoteSourceCreateNestedOneWithoutVoteAmountsInput["create"]>;
};
type PollExternalVoteFactoryDefineInput = {
    id?: string;
    createdAt?: Date;
    modifiedAt?: Date;
    amount?: number;
    answer: PollExternalVoteanswerFactory | Prisma.PollAnswerCreateNestedOneWithoutExternalVotesInput;
    source: PollExternalVotesourceFactory | Prisma.PollExternalVoteSourceCreateNestedOneWithoutVoteAmountsInput;
};
type PollExternalVoteFactoryDefineOptions = {
    defaultData: Resolver<PollExternalVoteFactoryDefineInput, BuildDataOptions>;
    traits?: {
        [traitName: string | symbol]: {
            data: Resolver<Partial<PollExternalVoteFactoryDefineInput>, BuildDataOptions>;
        };
    };
};
type PollExternalVoteTraitKeys<TOptions extends PollExternalVoteFactoryDefineOptions> = keyof TOptions["traits"];
export interface PollExternalVoteFactoryInterfaceWithoutTraits {
    readonly _factoryFor: "PollExternalVote";
    build(inputData?: Partial<Prisma.PollExternalVoteCreateInput>): PromiseLike<Prisma.PollExternalVoteCreateInput>;
    buildCreateInput(inputData?: Partial<Prisma.PollExternalVoteCreateInput>): PromiseLike<Prisma.PollExternalVoteCreateInput>;
    buildList(inputData: number | readonly Partial<Prisma.PollExternalVoteCreateInput>[]): PromiseLike<Prisma.PollExternalVoteCreateInput[]>;
    pickForConnect(inputData: PollExternalVote): Pick<PollExternalVote, "id">;
    create(inputData?: Partial<Prisma.PollExternalVoteCreateInput>): PromiseLike<PollExternalVote>;
    createList(inputData: number | readonly Partial<Prisma.PollExternalVoteCreateInput>[]): PromiseLike<PollExternalVote[]>;
    createForConnect(inputData?: Partial<Prisma.PollExternalVoteCreateInput>): PromiseLike<Pick<PollExternalVote, "id">>;
}
export interface PollExternalVoteFactoryInterface<TOptions extends PollExternalVoteFactoryDefineOptions = PollExternalVoteFactoryDefineOptions> extends PollExternalVoteFactoryInterfaceWithoutTraits {
    use(name: PollExternalVoteTraitKeys<TOptions>, ...names: readonly PollExternalVoteTraitKeys<TOptions>[]): PollExternalVoteFactoryInterfaceWithoutTraits;
}
/**
 * Define factory for {@link PollExternalVote} model.
 *
 * @param options
 * @returns factory {@link PollExternalVoteFactoryInterface}
 */
export declare function definePollExternalVoteFactory<TOptions extends PollExternalVoteFactoryDefineOptions>(options: TOptions): PollExternalVoteFactoryInterface<TOptions>;
type EventimageFactory = {
    _factoryFor: "Image";
    build: () => PromiseLike<Prisma.ImageCreateNestedOneWithoutEventsInput["create"]>;
};
type EventFactoryDefineInput = {
    id?: string;
    createdAt?: Date;
    modifiedAt?: Date;
    name?: string;
    description?: Prisma.EventCreatedescriptionInput | Prisma.Enumerable<Prisma.InputJsonValue>;
    status?: EventStatus;
    location?: string | null;
    startsAt?: Date;
    endsAt?: Date | null;
    externalSourceName?: string | null;
    externalSourceId?: string | null;
    image?: EventimageFactory | Prisma.ImageCreateNestedOneWithoutEventsInput;
    tags?: Prisma.TaggedEventsCreateNestedManyWithoutEventInput;
};
type EventFactoryDefineOptions = {
    defaultData?: Resolver<EventFactoryDefineInput, BuildDataOptions>;
    traits?: {
        [traitName: string | symbol]: {
            data: Resolver<Partial<EventFactoryDefineInput>, BuildDataOptions>;
        };
    };
};
type EventTraitKeys<TOptions extends EventFactoryDefineOptions> = keyof TOptions["traits"];
export interface EventFactoryInterfaceWithoutTraits {
    readonly _factoryFor: "Event";
    build(inputData?: Partial<Prisma.EventCreateInput>): PromiseLike<Prisma.EventCreateInput>;
    buildCreateInput(inputData?: Partial<Prisma.EventCreateInput>): PromiseLike<Prisma.EventCreateInput>;
    buildList(inputData: number | readonly Partial<Prisma.EventCreateInput>[]): PromiseLike<Prisma.EventCreateInput[]>;
    pickForConnect(inputData: Event): Pick<Event, "id">;
    create(inputData?: Partial<Prisma.EventCreateInput>): PromiseLike<Event>;
    createList(inputData: number | readonly Partial<Prisma.EventCreateInput>[]): PromiseLike<Event[]>;
    createForConnect(inputData?: Partial<Prisma.EventCreateInput>): PromiseLike<Pick<Event, "id">>;
}
export interface EventFactoryInterface<TOptions extends EventFactoryDefineOptions = EventFactoryDefineOptions> extends EventFactoryInterfaceWithoutTraits {
    use(name: EventTraitKeys<TOptions>, ...names: readonly EventTraitKeys<TOptions>[]): EventFactoryInterfaceWithoutTraits;
}
/**
 * Define factory for {@link Event} model.
 *
 * @param options
 * @returns factory {@link EventFactoryInterface}
 */
export declare function defineEventFactory<TOptions extends EventFactoryDefineOptions>(options?: TOptions): EventFactoryInterface<TOptions>;
type TaggedEventseventFactory = {
    _factoryFor: "Event";
    build: () => PromiseLike<Prisma.EventCreateNestedOneWithoutTagsInput["create"]>;
};
type TaggedEventstagFactory = {
    _factoryFor: "Tag";
    build: () => PromiseLike<Prisma.TagCreateNestedOneWithoutEventsInput["create"]>;
};
type TaggedEventsFactoryDefineInput = {
    createdAt?: Date;
    modifiedAt?: Date;
    event: TaggedEventseventFactory | Prisma.EventCreateNestedOneWithoutTagsInput;
    tag: TaggedEventstagFactory | Prisma.TagCreateNestedOneWithoutEventsInput;
};
type TaggedEventsFactoryDefineOptions = {
    defaultData: Resolver<TaggedEventsFactoryDefineInput, BuildDataOptions>;
    traits?: {
        [traitName: string | symbol]: {
            data: Resolver<Partial<TaggedEventsFactoryDefineInput>, BuildDataOptions>;
        };
    };
};
type TaggedEventsTraitKeys<TOptions extends TaggedEventsFactoryDefineOptions> = keyof TOptions["traits"];
export interface TaggedEventsFactoryInterfaceWithoutTraits {
    readonly _factoryFor: "TaggedEvents";
    build(inputData?: Partial<Prisma.TaggedEventsCreateInput>): PromiseLike<Prisma.TaggedEventsCreateInput>;
    buildCreateInput(inputData?: Partial<Prisma.TaggedEventsCreateInput>): PromiseLike<Prisma.TaggedEventsCreateInput>;
    buildList(inputData: number | readonly Partial<Prisma.TaggedEventsCreateInput>[]): PromiseLike<Prisma.TaggedEventsCreateInput[]>;
    pickForConnect(inputData: TaggedEvents): Pick<TaggedEvents, "eventId" | "tagId">;
    create(inputData?: Partial<Prisma.TaggedEventsCreateInput>): PromiseLike<TaggedEvents>;
    createList(inputData: number | readonly Partial<Prisma.TaggedEventsCreateInput>[]): PromiseLike<TaggedEvents[]>;
    createForConnect(inputData?: Partial<Prisma.TaggedEventsCreateInput>): PromiseLike<Pick<TaggedEvents, "eventId" | "tagId">>;
}
export interface TaggedEventsFactoryInterface<TOptions extends TaggedEventsFactoryDefineOptions = TaggedEventsFactoryDefineOptions> extends TaggedEventsFactoryInterfaceWithoutTraits {
    use(name: TaggedEventsTraitKeys<TOptions>, ...names: readonly TaggedEventsTraitKeys<TOptions>[]): TaggedEventsFactoryInterfaceWithoutTraits;
}
/**
 * Define factory for {@link TaggedEvents} model.
 *
 * @param options
 * @returns factory {@link TaggedEventsFactoryInterface}
 */
export declare function defineTaggedEventsFactory<TOptions extends TaggedEventsFactoryDefineOptions>(options: TOptions): TaggedEventsFactoryInterface<TOptions>;
type ConsentFactoryDefineInput = {
    id?: string;
    createdAt?: Date;
    modifiedAt?: Date;
    name?: string;
    slug?: string;
    defaultValue?: boolean;
    userConsents?: Prisma.UserConsentCreateNestedManyWithoutConsentInput;
};
type ConsentFactoryDefineOptions = {
    defaultData?: Resolver<ConsentFactoryDefineInput, BuildDataOptions>;
    traits?: {
        [traitName: string | symbol]: {
            data: Resolver<Partial<ConsentFactoryDefineInput>, BuildDataOptions>;
        };
    };
};
type ConsentTraitKeys<TOptions extends ConsentFactoryDefineOptions> = keyof TOptions["traits"];
export interface ConsentFactoryInterfaceWithoutTraits {
    readonly _factoryFor: "Consent";
    build(inputData?: Partial<Prisma.ConsentCreateInput>): PromiseLike<Prisma.ConsentCreateInput>;
    buildCreateInput(inputData?: Partial<Prisma.ConsentCreateInput>): PromiseLike<Prisma.ConsentCreateInput>;
    buildList(inputData: number | readonly Partial<Prisma.ConsentCreateInput>[]): PromiseLike<Prisma.ConsentCreateInput[]>;
    pickForConnect(inputData: Consent): Pick<Consent, "id">;
    create(inputData?: Partial<Prisma.ConsentCreateInput>): PromiseLike<Consent>;
    createList(inputData: number | readonly Partial<Prisma.ConsentCreateInput>[]): PromiseLike<Consent[]>;
    createForConnect(inputData?: Partial<Prisma.ConsentCreateInput>): PromiseLike<Pick<Consent, "id">>;
}
export interface ConsentFactoryInterface<TOptions extends ConsentFactoryDefineOptions = ConsentFactoryDefineOptions> extends ConsentFactoryInterfaceWithoutTraits {
    use(name: ConsentTraitKeys<TOptions>, ...names: readonly ConsentTraitKeys<TOptions>[]): ConsentFactoryInterfaceWithoutTraits;
}
/**
 * Define factory for {@link Consent} model.
 *
 * @param options
 * @returns factory {@link ConsentFactoryInterface}
 */
export declare function defineConsentFactory<TOptions extends ConsentFactoryDefineOptions>(options?: TOptions): ConsentFactoryInterface<TOptions>;
type UserConsentconsentFactory = {
    _factoryFor: "Consent";
    build: () => PromiseLike<Prisma.ConsentCreateNestedOneWithoutUserConsentsInput["create"]>;
};
type UserConsentuserFactory = {
    _factoryFor: "User";
    build: () => PromiseLike<Prisma.UserCreateNestedOneWithoutUserConsentInput["create"]>;
};
type UserConsentFactoryDefineInput = {
    id?: string;
    createdAt?: Date;
    modifiedAt?: Date;
    value?: boolean;
    consent: UserConsentconsentFactory | Prisma.ConsentCreateNestedOneWithoutUserConsentsInput;
    user: UserConsentuserFactory | Prisma.UserCreateNestedOneWithoutUserConsentInput;
};
type UserConsentFactoryDefineOptions = {
    defaultData: Resolver<UserConsentFactoryDefineInput, BuildDataOptions>;
    traits?: {
        [traitName: string | symbol]: {
            data: Resolver<Partial<UserConsentFactoryDefineInput>, BuildDataOptions>;
        };
    };
};
type UserConsentTraitKeys<TOptions extends UserConsentFactoryDefineOptions> = keyof TOptions["traits"];
export interface UserConsentFactoryInterfaceWithoutTraits {
    readonly _factoryFor: "UserConsent";
    build(inputData?: Partial<Prisma.UserConsentCreateInput>): PromiseLike<Prisma.UserConsentCreateInput>;
    buildCreateInput(inputData?: Partial<Prisma.UserConsentCreateInput>): PromiseLike<Prisma.UserConsentCreateInput>;
    buildList(inputData: number | readonly Partial<Prisma.UserConsentCreateInput>[]): PromiseLike<Prisma.UserConsentCreateInput[]>;
    pickForConnect(inputData: UserConsent): Pick<UserConsent, "id">;
    create(inputData?: Partial<Prisma.UserConsentCreateInput>): PromiseLike<UserConsent>;
    createList(inputData: number | readonly Partial<Prisma.UserConsentCreateInput>[]): PromiseLike<UserConsent[]>;
    createForConnect(inputData?: Partial<Prisma.UserConsentCreateInput>): PromiseLike<Pick<UserConsent, "id">>;
}
export interface UserConsentFactoryInterface<TOptions extends UserConsentFactoryDefineOptions = UserConsentFactoryDefineOptions> extends UserConsentFactoryInterfaceWithoutTraits {
    use(name: UserConsentTraitKeys<TOptions>, ...names: readonly UserConsentTraitKeys<TOptions>[]): UserConsentFactoryInterfaceWithoutTraits;
}
/**
 * Define factory for {@link UserConsent} model.
 *
 * @param options
 * @returns factory {@link UserConsentFactoryInterface}
 */
export declare function defineUserConsentFactory<TOptions extends UserConsentFactoryDefineOptions>(options: TOptions): UserConsentFactoryInterface<TOptions>;
type UserFlowMailmailTemplateFactory = {
    _factoryFor: "MailTemplate";
    build: () => PromiseLike<Prisma.MailTemplateCreateNestedOneWithoutUserFlowMailsInput["create"]>;
};
type UserFlowMailFactoryDefineInput = {
    id?: string;
    createdAt?: Date;
    modifiedAt?: Date;
    event?: UserEvent;
    mailTemplate?: UserFlowMailmailTemplateFactory | Prisma.MailTemplateCreateNestedOneWithoutUserFlowMailsInput;
};
type UserFlowMailFactoryDefineOptions = {
    defaultData?: Resolver<UserFlowMailFactoryDefineInput, BuildDataOptions>;
    traits?: {
        [traitName: string | symbol]: {
            data: Resolver<Partial<UserFlowMailFactoryDefineInput>, BuildDataOptions>;
        };
    };
};
type UserFlowMailTraitKeys<TOptions extends UserFlowMailFactoryDefineOptions> = keyof TOptions["traits"];
export interface UserFlowMailFactoryInterfaceWithoutTraits {
    readonly _factoryFor: "UserFlowMail";
    build(inputData?: Partial<Prisma.UserFlowMailCreateInput>): PromiseLike<Prisma.UserFlowMailCreateInput>;
    buildCreateInput(inputData?: Partial<Prisma.UserFlowMailCreateInput>): PromiseLike<Prisma.UserFlowMailCreateInput>;
    buildList(inputData: number | readonly Partial<Prisma.UserFlowMailCreateInput>[]): PromiseLike<Prisma.UserFlowMailCreateInput[]>;
    pickForConnect(inputData: UserFlowMail): Pick<UserFlowMail, "id">;
    create(inputData?: Partial<Prisma.UserFlowMailCreateInput>): PromiseLike<UserFlowMail>;
    createList(inputData: number | readonly Partial<Prisma.UserFlowMailCreateInput>[]): PromiseLike<UserFlowMail[]>;
    createForConnect(inputData?: Partial<Prisma.UserFlowMailCreateInput>): PromiseLike<Pick<UserFlowMail, "id">>;
}
export interface UserFlowMailFactoryInterface<TOptions extends UserFlowMailFactoryDefineOptions = UserFlowMailFactoryDefineOptions> extends UserFlowMailFactoryInterfaceWithoutTraits {
    use(name: UserFlowMailTraitKeys<TOptions>, ...names: readonly UserFlowMailTraitKeys<TOptions>[]): UserFlowMailFactoryInterfaceWithoutTraits;
}
/**
 * Define factory for {@link UserFlowMail} model.
 *
 * @param options
 * @returns factory {@link UserFlowMailFactoryInterface}
 */
export declare function defineUserFlowMailFactory<TOptions extends UserFlowMailFactoryDefineOptions>(options?: TOptions): UserFlowMailFactoryInterface<TOptions>;
type SubscriptionFlowmemberPlanFactory = {
    _factoryFor: "MemberPlan";
    build: () => PromiseLike<Prisma.MemberPlanCreateNestedOneWithoutSubscriptionFlowsInput["create"]>;
};
type SubscriptionFlowFactoryDefineInput = {
    id?: string;
    createdAt?: Date;
    modifiedAt?: Date;
    default?: boolean;
    periodicities?: Prisma.SubscriptionFlowCreateperiodicitiesInput | Prisma.Enumerable<PaymentPeriodicity>;
    autoRenewal?: Prisma.SubscriptionFlowCreateautoRenewalInput | Prisma.Enumerable<boolean>;
    memberPlan?: SubscriptionFlowmemberPlanFactory | Prisma.MemberPlanCreateNestedOneWithoutSubscriptionFlowsInput;
    paymentMethods?: Prisma.PaymentMethodCreateNestedManyWithoutSubscriptionFlowsInput;
    intervals?: Prisma.SubscriptionIntervalCreateNestedManyWithoutSubscriptionFlowInput;
};
type SubscriptionFlowFactoryDefineOptions = {
    defaultData?: Resolver<SubscriptionFlowFactoryDefineInput, BuildDataOptions>;
    traits?: {
        [traitName: string | symbol]: {
            data: Resolver<Partial<SubscriptionFlowFactoryDefineInput>, BuildDataOptions>;
        };
    };
};
type SubscriptionFlowTraitKeys<TOptions extends SubscriptionFlowFactoryDefineOptions> = keyof TOptions["traits"];
export interface SubscriptionFlowFactoryInterfaceWithoutTraits {
    readonly _factoryFor: "SubscriptionFlow";
    build(inputData?: Partial<Prisma.SubscriptionFlowCreateInput>): PromiseLike<Prisma.SubscriptionFlowCreateInput>;
    buildCreateInput(inputData?: Partial<Prisma.SubscriptionFlowCreateInput>): PromiseLike<Prisma.SubscriptionFlowCreateInput>;
    buildList(inputData: number | readonly Partial<Prisma.SubscriptionFlowCreateInput>[]): PromiseLike<Prisma.SubscriptionFlowCreateInput[]>;
    pickForConnect(inputData: SubscriptionFlow): Pick<SubscriptionFlow, "id">;
    create(inputData?: Partial<Prisma.SubscriptionFlowCreateInput>): PromiseLike<SubscriptionFlow>;
    createList(inputData: number | readonly Partial<Prisma.SubscriptionFlowCreateInput>[]): PromiseLike<SubscriptionFlow[]>;
    createForConnect(inputData?: Partial<Prisma.SubscriptionFlowCreateInput>): PromiseLike<Pick<SubscriptionFlow, "id">>;
}
export interface SubscriptionFlowFactoryInterface<TOptions extends SubscriptionFlowFactoryDefineOptions = SubscriptionFlowFactoryDefineOptions> extends SubscriptionFlowFactoryInterfaceWithoutTraits {
    use(name: SubscriptionFlowTraitKeys<TOptions>, ...names: readonly SubscriptionFlowTraitKeys<TOptions>[]): SubscriptionFlowFactoryInterfaceWithoutTraits;
}
/**
 * Define factory for {@link SubscriptionFlow} model.
 *
 * @param options
 * @returns factory {@link SubscriptionFlowFactoryInterface}
 */
export declare function defineSubscriptionFlowFactory<TOptions extends SubscriptionFlowFactoryDefineOptions>(options?: TOptions): SubscriptionFlowFactoryInterface<TOptions>;
type SubscriptionIntervalmailTemplateFactory = {
    _factoryFor: "MailTemplate";
    build: () => PromiseLike<Prisma.MailTemplateCreateNestedOneWithoutSubscriptionIntervalsInput["create"]>;
};
type SubscriptionIntervalsubscriptionFlowFactory = {
    _factoryFor: "SubscriptionFlow";
    build: () => PromiseLike<Prisma.SubscriptionFlowCreateNestedOneWithoutIntervalsInput["create"]>;
};
type SubscriptionIntervalFactoryDefineInput = {
    id?: string;
    createdAt?: Date;
    modifiedAt?: Date;
    event?: SubscriptionEvent;
    daysAwayFromEnding?: number | null;
    mailTemplate?: SubscriptionIntervalmailTemplateFactory | Prisma.MailTemplateCreateNestedOneWithoutSubscriptionIntervalsInput;
    subscriptionFlow: SubscriptionIntervalsubscriptionFlowFactory | Prisma.SubscriptionFlowCreateNestedOneWithoutIntervalsInput;
};
type SubscriptionIntervalFactoryDefineOptions = {
    defaultData: Resolver<SubscriptionIntervalFactoryDefineInput, BuildDataOptions>;
    traits?: {
        [traitName: string | symbol]: {
            data: Resolver<Partial<SubscriptionIntervalFactoryDefineInput>, BuildDataOptions>;
        };
    };
};
type SubscriptionIntervalTraitKeys<TOptions extends SubscriptionIntervalFactoryDefineOptions> = keyof TOptions["traits"];
export interface SubscriptionIntervalFactoryInterfaceWithoutTraits {
    readonly _factoryFor: "SubscriptionInterval";
    build(inputData?: Partial<Prisma.SubscriptionIntervalCreateInput>): PromiseLike<Prisma.SubscriptionIntervalCreateInput>;
    buildCreateInput(inputData?: Partial<Prisma.SubscriptionIntervalCreateInput>): PromiseLike<Prisma.SubscriptionIntervalCreateInput>;
    buildList(inputData: number | readonly Partial<Prisma.SubscriptionIntervalCreateInput>[]): PromiseLike<Prisma.SubscriptionIntervalCreateInput[]>;
    pickForConnect(inputData: SubscriptionInterval): Pick<SubscriptionInterval, "id">;
    create(inputData?: Partial<Prisma.SubscriptionIntervalCreateInput>): PromiseLike<SubscriptionInterval>;
    createList(inputData: number | readonly Partial<Prisma.SubscriptionIntervalCreateInput>[]): PromiseLike<SubscriptionInterval[]>;
    createForConnect(inputData?: Partial<Prisma.SubscriptionIntervalCreateInput>): PromiseLike<Pick<SubscriptionInterval, "id">>;
}
export interface SubscriptionIntervalFactoryInterface<TOptions extends SubscriptionIntervalFactoryDefineOptions = SubscriptionIntervalFactoryDefineOptions> extends SubscriptionIntervalFactoryInterfaceWithoutTraits {
    use(name: SubscriptionIntervalTraitKeys<TOptions>, ...names: readonly SubscriptionIntervalTraitKeys<TOptions>[]): SubscriptionIntervalFactoryInterfaceWithoutTraits;
}
/**
 * Define factory for {@link SubscriptionInterval} model.
 *
 * @param options
 * @returns factory {@link SubscriptionIntervalFactoryInterface}
 */
export declare function defineSubscriptionIntervalFactory<TOptions extends SubscriptionIntervalFactoryDefineOptions>(options: TOptions): SubscriptionIntervalFactoryInterface<TOptions>;
type MailTemplateFactoryDefineInput = {
    id?: string;
    createdAt?: Date;
    modifiedAt?: Date;
    name?: string;
    description?: string | null;
    externalMailTemplateId?: string;
    remoteMissing?: boolean;
    subscriptionIntervals?: Prisma.SubscriptionIntervalCreateNestedManyWithoutMailTemplateInput;
    userFlowMails?: Prisma.UserFlowMailCreateNestedManyWithoutMailTemplateInput;
    mailLog?: Prisma.MailLogCreateNestedManyWithoutMailTemplateInput;
};
type MailTemplateFactoryDefineOptions = {
    defaultData?: Resolver<MailTemplateFactoryDefineInput, BuildDataOptions>;
    traits?: {
        [traitName: string | symbol]: {
            data: Resolver<Partial<MailTemplateFactoryDefineInput>, BuildDataOptions>;
        };
    };
};
type MailTemplateTraitKeys<TOptions extends MailTemplateFactoryDefineOptions> = keyof TOptions["traits"];
export interface MailTemplateFactoryInterfaceWithoutTraits {
    readonly _factoryFor: "MailTemplate";
    build(inputData?: Partial<Prisma.MailTemplateCreateInput>): PromiseLike<Prisma.MailTemplateCreateInput>;
    buildCreateInput(inputData?: Partial<Prisma.MailTemplateCreateInput>): PromiseLike<Prisma.MailTemplateCreateInput>;
    buildList(inputData: number | readonly Partial<Prisma.MailTemplateCreateInput>[]): PromiseLike<Prisma.MailTemplateCreateInput[]>;
    pickForConnect(inputData: MailTemplate): Pick<MailTemplate, "id">;
    create(inputData?: Partial<Prisma.MailTemplateCreateInput>): PromiseLike<MailTemplate>;
    createList(inputData: number | readonly Partial<Prisma.MailTemplateCreateInput>[]): PromiseLike<MailTemplate[]>;
    createForConnect(inputData?: Partial<Prisma.MailTemplateCreateInput>): PromiseLike<Pick<MailTemplate, "id">>;
}
export interface MailTemplateFactoryInterface<TOptions extends MailTemplateFactoryDefineOptions = MailTemplateFactoryDefineOptions> extends MailTemplateFactoryInterfaceWithoutTraits {
    use(name: MailTemplateTraitKeys<TOptions>, ...names: readonly MailTemplateTraitKeys<TOptions>[]): MailTemplateFactoryInterfaceWithoutTraits;
}
/**
 * Define factory for {@link MailTemplate} model.
 *
 * @param options
 * @returns factory {@link MailTemplateFactoryInterface}
 */
export declare function defineMailTemplateFactory<TOptions extends MailTemplateFactoryDefineOptions>(options?: TOptions): MailTemplateFactoryInterface<TOptions>;
type PeriodicJobFactoryDefineInput = {
    id?: string;
    createdAt?: Date;
    modifiedAt?: Date;
    date?: Date;
    executionTime?: Date | null;
    successfullyFinished?: Date | null;
    finishedWithError?: Date | null;
    tries?: number;
    error?: string | null;
};
type PeriodicJobFactoryDefineOptions = {
    defaultData?: Resolver<PeriodicJobFactoryDefineInput, BuildDataOptions>;
    traits?: {
        [traitName: string | symbol]: {
            data: Resolver<Partial<PeriodicJobFactoryDefineInput>, BuildDataOptions>;
        };
    };
};
type PeriodicJobTraitKeys<TOptions extends PeriodicJobFactoryDefineOptions> = keyof TOptions["traits"];
export interface PeriodicJobFactoryInterfaceWithoutTraits {
    readonly _factoryFor: "PeriodicJob";
    build(inputData?: Partial<Prisma.PeriodicJobCreateInput>): PromiseLike<Prisma.PeriodicJobCreateInput>;
    buildCreateInput(inputData?: Partial<Prisma.PeriodicJobCreateInput>): PromiseLike<Prisma.PeriodicJobCreateInput>;
    buildList(inputData: number | readonly Partial<Prisma.PeriodicJobCreateInput>[]): PromiseLike<Prisma.PeriodicJobCreateInput[]>;
    pickForConnect(inputData: PeriodicJob): Pick<PeriodicJob, "id">;
    create(inputData?: Partial<Prisma.PeriodicJobCreateInput>): PromiseLike<PeriodicJob>;
    createList(inputData: number | readonly Partial<Prisma.PeriodicJobCreateInput>[]): PromiseLike<PeriodicJob[]>;
    createForConnect(inputData?: Partial<Prisma.PeriodicJobCreateInput>): PromiseLike<Pick<PeriodicJob, "id">>;
}
export interface PeriodicJobFactoryInterface<TOptions extends PeriodicJobFactoryDefineOptions = PeriodicJobFactoryDefineOptions> extends PeriodicJobFactoryInterfaceWithoutTraits {
    use(name: PeriodicJobTraitKeys<TOptions>, ...names: readonly PeriodicJobTraitKeys<TOptions>[]): PeriodicJobFactoryInterfaceWithoutTraits;
}
/**
 * Define factory for {@link PeriodicJob} model.
 *
 * @param options
 * @returns factory {@link PeriodicJobFactoryInterface}
 */
export declare function definePeriodicJobFactory<TOptions extends PeriodicJobFactoryDefineOptions>(options?: TOptions): PeriodicJobFactoryInterface<TOptions>;
type BlockStyleFactoryDefineInput = {
    id?: string;
    createdAt?: Date;
    modifiedAt?: Date;
    name?: string;
    blocks?: Prisma.BlockStyleCreateblocksInput | Prisma.Enumerable<BlockType>;
};
type BlockStyleFactoryDefineOptions = {
    defaultData?: Resolver<BlockStyleFactoryDefineInput, BuildDataOptions>;
    traits?: {
        [traitName: string | symbol]: {
            data: Resolver<Partial<BlockStyleFactoryDefineInput>, BuildDataOptions>;
        };
    };
};
type BlockStyleTraitKeys<TOptions extends BlockStyleFactoryDefineOptions> = keyof TOptions["traits"];
export interface BlockStyleFactoryInterfaceWithoutTraits {
    readonly _factoryFor: "BlockStyle";
    build(inputData?: Partial<Prisma.BlockStyleCreateInput>): PromiseLike<Prisma.BlockStyleCreateInput>;
    buildCreateInput(inputData?: Partial<Prisma.BlockStyleCreateInput>): PromiseLike<Prisma.BlockStyleCreateInput>;
    buildList(inputData: number | readonly Partial<Prisma.BlockStyleCreateInput>[]): PromiseLike<Prisma.BlockStyleCreateInput[]>;
    pickForConnect(inputData: BlockStyle): Pick<BlockStyle, "id">;
    create(inputData?: Partial<Prisma.BlockStyleCreateInput>): PromiseLike<BlockStyle>;
    createList(inputData: number | readonly Partial<Prisma.BlockStyleCreateInput>[]): PromiseLike<BlockStyle[]>;
    createForConnect(inputData?: Partial<Prisma.BlockStyleCreateInput>): PromiseLike<Pick<BlockStyle, "id">>;
}
export interface BlockStyleFactoryInterface<TOptions extends BlockStyleFactoryDefineOptions = BlockStyleFactoryDefineOptions> extends BlockStyleFactoryInterfaceWithoutTraits {
    use(name: BlockStyleTraitKeys<TOptions>, ...names: readonly BlockStyleTraitKeys<TOptions>[]): BlockStyleFactoryInterfaceWithoutTraits;
}
/**
 * Define factory for {@link BlockStyle} model.
 *
 * @param options
 * @returns factory {@link BlockStyleFactoryInterface}
 */
export declare function defineBlockStyleFactory<TOptions extends BlockStyleFactoryDefineOptions>(options?: TOptions): BlockStyleFactoryInterface<TOptions>;
