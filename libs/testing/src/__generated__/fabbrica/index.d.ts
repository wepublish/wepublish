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
import type { Currency } from "@prisma/client";
import type { MailLogState } from "@prisma/client";
import type { PaymentPeriodicity } from "@prisma/client";
import type { PaymentState } from "@prisma/client";
import type { SubscriptionDeactivationReason } from "@prisma/client";
import type { TagType } from "@prisma/client";
import type { EventStatus } from "@prisma/client";
import type { UserEvent } from "@prisma/client";
import type { SubscriptionEvent } from "@prisma/client";
import type { BlockType } from "@prisma/client";
import type { Prisma } from "@prisma/client";
import type { Resolver } from "@quramy/prisma-fabbrica/lib/internal";
export { resetSequence, registerScalarFieldValueGenerator, resetScalarFieldValueGenerator } from "@quramy/prisma-fabbrica/lib/internal";
type BuildDataOptions<TTransients extends Record<string, unknown>> = {
    readonly seq: number;
} & TTransients;
type TraitName = string | symbol;
type CallbackDefineOptions<TCreated, TCreateInput, TTransients extends Record<string, unknown>> = {
    onAfterBuild?: (createInput: TCreateInput, transientFields: TTransients) => void | PromiseLike<void>;
    onBeforeCreate?: (createInput: TCreateInput, transientFields: TTransients) => void | PromiseLike<void>;
    onAfterCreate?: (created: TCreated, transientFields: TTransients) => void | PromiseLike<void>;
};
export declare const initialize: (options: import("@quramy/prisma-fabbrica/lib/initialize").InitializeOptions) => void;
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
type MetadataPropertyTransientFields = Record<string, unknown> & Partial<Record<keyof MetadataPropertyFactoryDefineInput, never>>;
type MetadataPropertyFactoryTrait<TTransients extends Record<string, unknown>> = {
    data?: Resolver<Partial<MetadataPropertyFactoryDefineInput>, BuildDataOptions<TTransients>>;
} & CallbackDefineOptions<MetadataProperty, Prisma.MetadataPropertyCreateInput, TTransients>;
type MetadataPropertyFactoryDefineOptions<TTransients extends Record<string, unknown> = Record<string, unknown>> = {
    defaultData?: Resolver<MetadataPropertyFactoryDefineInput, BuildDataOptions<TTransients>>;
    traits?: {
        [traitName: TraitName]: MetadataPropertyFactoryTrait<TTransients>;
    };
} & CallbackDefineOptions<MetadataProperty, Prisma.MetadataPropertyCreateInput, TTransients>;
type MetadataPropertyTraitKeys<TOptions extends MetadataPropertyFactoryDefineOptions<any>> = Exclude<keyof TOptions["traits"], number>;
export interface MetadataPropertyFactoryInterfaceWithoutTraits<TTransients extends Record<string, unknown>> {
    readonly _factoryFor: "MetadataProperty";
    build(inputData?: Partial<Prisma.MetadataPropertyCreateInput & TTransients>): PromiseLike<Prisma.MetadataPropertyCreateInput>;
    buildCreateInput(inputData?: Partial<Prisma.MetadataPropertyCreateInput & TTransients>): PromiseLike<Prisma.MetadataPropertyCreateInput>;
    buildList(list: readonly Partial<Prisma.MetadataPropertyCreateInput & TTransients>[]): PromiseLike<Prisma.MetadataPropertyCreateInput[]>;
    buildList(count: number, item?: Partial<Prisma.MetadataPropertyCreateInput & TTransients>): PromiseLike<Prisma.MetadataPropertyCreateInput[]>;
    pickForConnect(inputData: MetadataProperty): Pick<MetadataProperty, "id">;
    create(inputData?: Partial<Prisma.MetadataPropertyCreateInput & TTransients>): PromiseLike<MetadataProperty>;
    createList(list: readonly Partial<Prisma.MetadataPropertyCreateInput & TTransients>[]): PromiseLike<MetadataProperty[]>;
    createList(count: number, item?: Partial<Prisma.MetadataPropertyCreateInput & TTransients>): PromiseLike<MetadataProperty[]>;
    createForConnect(inputData?: Partial<Prisma.MetadataPropertyCreateInput & TTransients>): PromiseLike<Pick<MetadataProperty, "id">>;
}
export interface MetadataPropertyFactoryInterface<TTransients extends Record<string, unknown> = Record<string, unknown>, TTraitName extends TraitName = TraitName> extends MetadataPropertyFactoryInterfaceWithoutTraits<TTransients> {
    use(name: TTraitName, ...names: readonly TTraitName[]): MetadataPropertyFactoryInterfaceWithoutTraits<TTransients>;
}
interface MetadataPropertyFactoryBuilder {
    <TOptions extends MetadataPropertyFactoryDefineOptions>(options?: TOptions): MetadataPropertyFactoryInterface<{}, MetadataPropertyTraitKeys<TOptions>>;
    withTransientFields: <TTransients extends MetadataPropertyTransientFields>(defaultTransientFieldValues: TTransients) => <TOptions extends MetadataPropertyFactoryDefineOptions<TTransients>>(options?: TOptions) => MetadataPropertyFactoryInterface<TTransients, MetadataPropertyTraitKeys<TOptions>>;
}
/**
 * Define factory for {@link MetadataProperty} model.
 *
 * @param options
 * @returns factory {@link MetadataPropertyFactoryInterface}
 */
export declare const defineMetadataPropertyFactory: MetadataPropertyFactoryBuilder;
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
    tags?: Prisma.ArticleRevisionCreatetagsInput | Array<string>;
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
type ArticleRevisionTransientFields = Record<string, unknown> & Partial<Record<keyof ArticleRevisionFactoryDefineInput, never>>;
type ArticleRevisionFactoryTrait<TTransients extends Record<string, unknown>> = {
    data?: Resolver<Partial<ArticleRevisionFactoryDefineInput>, BuildDataOptions<TTransients>>;
} & CallbackDefineOptions<ArticleRevision, Prisma.ArticleRevisionCreateInput, TTransients>;
type ArticleRevisionFactoryDefineOptions<TTransients extends Record<string, unknown> = Record<string, unknown>> = {
    defaultData?: Resolver<ArticleRevisionFactoryDefineInput, BuildDataOptions<TTransients>>;
    traits?: {
        [traitName: TraitName]: ArticleRevisionFactoryTrait<TTransients>;
    };
} & CallbackDefineOptions<ArticleRevision, Prisma.ArticleRevisionCreateInput, TTransients>;
type ArticleRevisionTraitKeys<TOptions extends ArticleRevisionFactoryDefineOptions<any>> = Exclude<keyof TOptions["traits"], number>;
export interface ArticleRevisionFactoryInterfaceWithoutTraits<TTransients extends Record<string, unknown>> {
    readonly _factoryFor: "ArticleRevision";
    build(inputData?: Partial<Prisma.ArticleRevisionCreateInput & TTransients>): PromiseLike<Prisma.ArticleRevisionCreateInput>;
    buildCreateInput(inputData?: Partial<Prisma.ArticleRevisionCreateInput & TTransients>): PromiseLike<Prisma.ArticleRevisionCreateInput>;
    buildList(list: readonly Partial<Prisma.ArticleRevisionCreateInput & TTransients>[]): PromiseLike<Prisma.ArticleRevisionCreateInput[]>;
    buildList(count: number, item?: Partial<Prisma.ArticleRevisionCreateInput & TTransients>): PromiseLike<Prisma.ArticleRevisionCreateInput[]>;
    pickForConnect(inputData: ArticleRevision): Pick<ArticleRevision, "id">;
    create(inputData?: Partial<Prisma.ArticleRevisionCreateInput & TTransients>): PromiseLike<ArticleRevision>;
    createList(list: readonly Partial<Prisma.ArticleRevisionCreateInput & TTransients>[]): PromiseLike<ArticleRevision[]>;
    createList(count: number, item?: Partial<Prisma.ArticleRevisionCreateInput & TTransients>): PromiseLike<ArticleRevision[]>;
    createForConnect(inputData?: Partial<Prisma.ArticleRevisionCreateInput & TTransients>): PromiseLike<Pick<ArticleRevision, "id">>;
}
export interface ArticleRevisionFactoryInterface<TTransients extends Record<string, unknown> = Record<string, unknown>, TTraitName extends TraitName = TraitName> extends ArticleRevisionFactoryInterfaceWithoutTraits<TTransients> {
    use(name: TTraitName, ...names: readonly TTraitName[]): ArticleRevisionFactoryInterfaceWithoutTraits<TTransients>;
}
interface ArticleRevisionFactoryBuilder {
    <TOptions extends ArticleRevisionFactoryDefineOptions>(options?: TOptions): ArticleRevisionFactoryInterface<{}, ArticleRevisionTraitKeys<TOptions>>;
    withTransientFields: <TTransients extends ArticleRevisionTransientFields>(defaultTransientFieldValues: TTransients) => <TOptions extends ArticleRevisionFactoryDefineOptions<TTransients>>(options?: TOptions) => ArticleRevisionFactoryInterface<TTransients, ArticleRevisionTraitKeys<TOptions>>;
}
/**
 * Define factory for {@link ArticleRevision} model.
 *
 * @param options
 * @returns factory {@link ArticleRevisionFactoryInterface}
 */
export declare const defineArticleRevisionFactory: ArticleRevisionFactoryBuilder;
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
type ArticleRevisionAuthorTransientFields = Record<string, unknown> & Partial<Record<keyof ArticleRevisionAuthorFactoryDefineInput, never>>;
type ArticleRevisionAuthorFactoryTrait<TTransients extends Record<string, unknown>> = {
    data?: Resolver<Partial<ArticleRevisionAuthorFactoryDefineInput>, BuildDataOptions<TTransients>>;
} & CallbackDefineOptions<ArticleRevisionAuthor, Prisma.ArticleRevisionAuthorCreateInput, TTransients>;
type ArticleRevisionAuthorFactoryDefineOptions<TTransients extends Record<string, unknown> = Record<string, unknown>> = {
    defaultData: Resolver<ArticleRevisionAuthorFactoryDefineInput, BuildDataOptions<TTransients>>;
    traits?: {
        [traitName: string | symbol]: ArticleRevisionAuthorFactoryTrait<TTransients>;
    };
} & CallbackDefineOptions<ArticleRevisionAuthor, Prisma.ArticleRevisionAuthorCreateInput, TTransients>;
type ArticleRevisionAuthorTraitKeys<TOptions extends ArticleRevisionAuthorFactoryDefineOptions<any>> = Exclude<keyof TOptions["traits"], number>;
export interface ArticleRevisionAuthorFactoryInterfaceWithoutTraits<TTransients extends Record<string, unknown>> {
    readonly _factoryFor: "ArticleRevisionAuthor";
    build(inputData?: Partial<Prisma.ArticleRevisionAuthorCreateInput & TTransients>): PromiseLike<Prisma.ArticleRevisionAuthorCreateInput>;
    buildCreateInput(inputData?: Partial<Prisma.ArticleRevisionAuthorCreateInput & TTransients>): PromiseLike<Prisma.ArticleRevisionAuthorCreateInput>;
    buildList(list: readonly Partial<Prisma.ArticleRevisionAuthorCreateInput & TTransients>[]): PromiseLike<Prisma.ArticleRevisionAuthorCreateInput[]>;
    buildList(count: number, item?: Partial<Prisma.ArticleRevisionAuthorCreateInput & TTransients>): PromiseLike<Prisma.ArticleRevisionAuthorCreateInput[]>;
    pickForConnect(inputData: ArticleRevisionAuthor): Pick<ArticleRevisionAuthor, "revisionId" | "authorId">;
    create(inputData?: Partial<Prisma.ArticleRevisionAuthorCreateInput & TTransients>): PromiseLike<ArticleRevisionAuthor>;
    createList(list: readonly Partial<Prisma.ArticleRevisionAuthorCreateInput & TTransients>[]): PromiseLike<ArticleRevisionAuthor[]>;
    createList(count: number, item?: Partial<Prisma.ArticleRevisionAuthorCreateInput & TTransients>): PromiseLike<ArticleRevisionAuthor[]>;
    createForConnect(inputData?: Partial<Prisma.ArticleRevisionAuthorCreateInput & TTransients>): PromiseLike<Pick<ArticleRevisionAuthor, "revisionId" | "authorId">>;
}
export interface ArticleRevisionAuthorFactoryInterface<TTransients extends Record<string, unknown> = Record<string, unknown>, TTraitName extends TraitName = TraitName> extends ArticleRevisionAuthorFactoryInterfaceWithoutTraits<TTransients> {
    use(name: TTraitName, ...names: readonly TTraitName[]): ArticleRevisionAuthorFactoryInterfaceWithoutTraits<TTransients>;
}
interface ArticleRevisionAuthorFactoryBuilder {
    <TOptions extends ArticleRevisionAuthorFactoryDefineOptions>(options: TOptions): ArticleRevisionAuthorFactoryInterface<{}, ArticleRevisionAuthorTraitKeys<TOptions>>;
    withTransientFields: <TTransients extends ArticleRevisionAuthorTransientFields>(defaultTransientFieldValues: TTransients) => <TOptions extends ArticleRevisionAuthorFactoryDefineOptions<TTransients>>(options: TOptions) => ArticleRevisionAuthorFactoryInterface<TTransients, ArticleRevisionAuthorTraitKeys<TOptions>>;
}
/**
 * Define factory for {@link ArticleRevisionAuthor} model.
 *
 * @param options
 * @returns factory {@link ArticleRevisionAuthorFactoryInterface}
 */
export declare const defineArticleRevisionAuthorFactory: ArticleRevisionAuthorFactoryBuilder;
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
type ArticleRevisionSocialMediaAuthorTransientFields = Record<string, unknown> & Partial<Record<keyof ArticleRevisionSocialMediaAuthorFactoryDefineInput, never>>;
type ArticleRevisionSocialMediaAuthorFactoryTrait<TTransients extends Record<string, unknown>> = {
    data?: Resolver<Partial<ArticleRevisionSocialMediaAuthorFactoryDefineInput>, BuildDataOptions<TTransients>>;
} & CallbackDefineOptions<ArticleRevisionSocialMediaAuthor, Prisma.ArticleRevisionSocialMediaAuthorCreateInput, TTransients>;
type ArticleRevisionSocialMediaAuthorFactoryDefineOptions<TTransients extends Record<string, unknown> = Record<string, unknown>> = {
    defaultData: Resolver<ArticleRevisionSocialMediaAuthorFactoryDefineInput, BuildDataOptions<TTransients>>;
    traits?: {
        [traitName: string | symbol]: ArticleRevisionSocialMediaAuthorFactoryTrait<TTransients>;
    };
} & CallbackDefineOptions<ArticleRevisionSocialMediaAuthor, Prisma.ArticleRevisionSocialMediaAuthorCreateInput, TTransients>;
type ArticleRevisionSocialMediaAuthorTraitKeys<TOptions extends ArticleRevisionSocialMediaAuthorFactoryDefineOptions<any>> = Exclude<keyof TOptions["traits"], number>;
export interface ArticleRevisionSocialMediaAuthorFactoryInterfaceWithoutTraits<TTransients extends Record<string, unknown>> {
    readonly _factoryFor: "ArticleRevisionSocialMediaAuthor";
    build(inputData?: Partial<Prisma.ArticleRevisionSocialMediaAuthorCreateInput & TTransients>): PromiseLike<Prisma.ArticleRevisionSocialMediaAuthorCreateInput>;
    buildCreateInput(inputData?: Partial<Prisma.ArticleRevisionSocialMediaAuthorCreateInput & TTransients>): PromiseLike<Prisma.ArticleRevisionSocialMediaAuthorCreateInput>;
    buildList(list: readonly Partial<Prisma.ArticleRevisionSocialMediaAuthorCreateInput & TTransients>[]): PromiseLike<Prisma.ArticleRevisionSocialMediaAuthorCreateInput[]>;
    buildList(count: number, item?: Partial<Prisma.ArticleRevisionSocialMediaAuthorCreateInput & TTransients>): PromiseLike<Prisma.ArticleRevisionSocialMediaAuthorCreateInput[]>;
    pickForConnect(inputData: ArticleRevisionSocialMediaAuthor): Pick<ArticleRevisionSocialMediaAuthor, "revisionId" | "authorId">;
    create(inputData?: Partial<Prisma.ArticleRevisionSocialMediaAuthorCreateInput & TTransients>): PromiseLike<ArticleRevisionSocialMediaAuthor>;
    createList(list: readonly Partial<Prisma.ArticleRevisionSocialMediaAuthorCreateInput & TTransients>[]): PromiseLike<ArticleRevisionSocialMediaAuthor[]>;
    createList(count: number, item?: Partial<Prisma.ArticleRevisionSocialMediaAuthorCreateInput & TTransients>): PromiseLike<ArticleRevisionSocialMediaAuthor[]>;
    createForConnect(inputData?: Partial<Prisma.ArticleRevisionSocialMediaAuthorCreateInput & TTransients>): PromiseLike<Pick<ArticleRevisionSocialMediaAuthor, "revisionId" | "authorId">>;
}
export interface ArticleRevisionSocialMediaAuthorFactoryInterface<TTransients extends Record<string, unknown> = Record<string, unknown>, TTraitName extends TraitName = TraitName> extends ArticleRevisionSocialMediaAuthorFactoryInterfaceWithoutTraits<TTransients> {
    use(name: TTraitName, ...names: readonly TTraitName[]): ArticleRevisionSocialMediaAuthorFactoryInterfaceWithoutTraits<TTransients>;
}
interface ArticleRevisionSocialMediaAuthorFactoryBuilder {
    <TOptions extends ArticleRevisionSocialMediaAuthorFactoryDefineOptions>(options: TOptions): ArticleRevisionSocialMediaAuthorFactoryInterface<{}, ArticleRevisionSocialMediaAuthorTraitKeys<TOptions>>;
    withTransientFields: <TTransients extends ArticleRevisionSocialMediaAuthorTransientFields>(defaultTransientFieldValues: TTransients) => <TOptions extends ArticleRevisionSocialMediaAuthorFactoryDefineOptions<TTransients>>(options: TOptions) => ArticleRevisionSocialMediaAuthorFactoryInterface<TTransients, ArticleRevisionSocialMediaAuthorTraitKeys<TOptions>>;
}
/**
 * Define factory for {@link ArticleRevisionSocialMediaAuthor} model.
 *
 * @param options
 * @returns factory {@link ArticleRevisionSocialMediaAuthorFactoryInterface}
 */
export declare const defineArticleRevisionSocialMediaAuthorFactory: ArticleRevisionSocialMediaAuthorFactoryBuilder;
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
    disableComments?: boolean;
    published?: ArticlepublishedFactory | Prisma.ArticleRevisionCreateNestedOneWithoutPublishedArticleInput;
    pending?: ArticlependingFactory | Prisma.ArticleRevisionCreateNestedOneWithoutPendingArticleInput;
    draft?: ArticledraftFactory | Prisma.ArticleRevisionCreateNestedOneWithoutDraftArticleInput;
    navigations?: Prisma.NavigationLinkCreateNestedManyWithoutArticleInput;
    tags?: Prisma.TaggedArticlesCreateNestedManyWithoutArticleInput;
};
type ArticleTransientFields = Record<string, unknown> & Partial<Record<keyof ArticleFactoryDefineInput, never>>;
type ArticleFactoryTrait<TTransients extends Record<string, unknown>> = {
    data?: Resolver<Partial<ArticleFactoryDefineInput>, BuildDataOptions<TTransients>>;
} & CallbackDefineOptions<Article, Prisma.ArticleCreateInput, TTransients>;
type ArticleFactoryDefineOptions<TTransients extends Record<string, unknown> = Record<string, unknown>> = {
    defaultData?: Resolver<ArticleFactoryDefineInput, BuildDataOptions<TTransients>>;
    traits?: {
        [traitName: TraitName]: ArticleFactoryTrait<TTransients>;
    };
} & CallbackDefineOptions<Article, Prisma.ArticleCreateInput, TTransients>;
type ArticleTraitKeys<TOptions extends ArticleFactoryDefineOptions<any>> = Exclude<keyof TOptions["traits"], number>;
export interface ArticleFactoryInterfaceWithoutTraits<TTransients extends Record<string, unknown>> {
    readonly _factoryFor: "Article";
    build(inputData?: Partial<Prisma.ArticleCreateInput & TTransients>): PromiseLike<Prisma.ArticleCreateInput>;
    buildCreateInput(inputData?: Partial<Prisma.ArticleCreateInput & TTransients>): PromiseLike<Prisma.ArticleCreateInput>;
    buildList(list: readonly Partial<Prisma.ArticleCreateInput & TTransients>[]): PromiseLike<Prisma.ArticleCreateInput[]>;
    buildList(count: number, item?: Partial<Prisma.ArticleCreateInput & TTransients>): PromiseLike<Prisma.ArticleCreateInput[]>;
    pickForConnect(inputData: Article): Pick<Article, "id">;
    create(inputData?: Partial<Prisma.ArticleCreateInput & TTransients>): PromiseLike<Article>;
    createList(list: readonly Partial<Prisma.ArticleCreateInput & TTransients>[]): PromiseLike<Article[]>;
    createList(count: number, item?: Partial<Prisma.ArticleCreateInput & TTransients>): PromiseLike<Article[]>;
    createForConnect(inputData?: Partial<Prisma.ArticleCreateInput & TTransients>): PromiseLike<Pick<Article, "id">>;
}
export interface ArticleFactoryInterface<TTransients extends Record<string, unknown> = Record<string, unknown>, TTraitName extends TraitName = TraitName> extends ArticleFactoryInterfaceWithoutTraits<TTransients> {
    use(name: TTraitName, ...names: readonly TTraitName[]): ArticleFactoryInterfaceWithoutTraits<TTransients>;
}
interface ArticleFactoryBuilder {
    <TOptions extends ArticleFactoryDefineOptions>(options?: TOptions): ArticleFactoryInterface<{}, ArticleTraitKeys<TOptions>>;
    withTransientFields: <TTransients extends ArticleTransientFields>(defaultTransientFieldValues: TTransients) => <TOptions extends ArticleFactoryDefineOptions<TTransients>>(options?: TOptions) => ArticleFactoryInterface<TTransients, ArticleTraitKeys<TOptions>>;
}
/**
 * Define factory for {@link Article} model.
 *
 * @param options
 * @returns factory {@link ArticleFactoryInterface}
 */
export declare const defineArticleFactory: ArticleFactoryBuilder;
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
type TaggedArticlesTransientFields = Record<string, unknown> & Partial<Record<keyof TaggedArticlesFactoryDefineInput, never>>;
type TaggedArticlesFactoryTrait<TTransients extends Record<string, unknown>> = {
    data?: Resolver<Partial<TaggedArticlesFactoryDefineInput>, BuildDataOptions<TTransients>>;
} & CallbackDefineOptions<TaggedArticles, Prisma.TaggedArticlesCreateInput, TTransients>;
type TaggedArticlesFactoryDefineOptions<TTransients extends Record<string, unknown> = Record<string, unknown>> = {
    defaultData: Resolver<TaggedArticlesFactoryDefineInput, BuildDataOptions<TTransients>>;
    traits?: {
        [traitName: string | symbol]: TaggedArticlesFactoryTrait<TTransients>;
    };
} & CallbackDefineOptions<TaggedArticles, Prisma.TaggedArticlesCreateInput, TTransients>;
type TaggedArticlesTraitKeys<TOptions extends TaggedArticlesFactoryDefineOptions<any>> = Exclude<keyof TOptions["traits"], number>;
export interface TaggedArticlesFactoryInterfaceWithoutTraits<TTransients extends Record<string, unknown>> {
    readonly _factoryFor: "TaggedArticles";
    build(inputData?: Partial<Prisma.TaggedArticlesCreateInput & TTransients>): PromiseLike<Prisma.TaggedArticlesCreateInput>;
    buildCreateInput(inputData?: Partial<Prisma.TaggedArticlesCreateInput & TTransients>): PromiseLike<Prisma.TaggedArticlesCreateInput>;
    buildList(list: readonly Partial<Prisma.TaggedArticlesCreateInput & TTransients>[]): PromiseLike<Prisma.TaggedArticlesCreateInput[]>;
    buildList(count: number, item?: Partial<Prisma.TaggedArticlesCreateInput & TTransients>): PromiseLike<Prisma.TaggedArticlesCreateInput[]>;
    pickForConnect(inputData: TaggedArticles): Pick<TaggedArticles, "articleId" | "tagId">;
    create(inputData?: Partial<Prisma.TaggedArticlesCreateInput & TTransients>): PromiseLike<TaggedArticles>;
    createList(list: readonly Partial<Prisma.TaggedArticlesCreateInput & TTransients>[]): PromiseLike<TaggedArticles[]>;
    createList(count: number, item?: Partial<Prisma.TaggedArticlesCreateInput & TTransients>): PromiseLike<TaggedArticles[]>;
    createForConnect(inputData?: Partial<Prisma.TaggedArticlesCreateInput & TTransients>): PromiseLike<Pick<TaggedArticles, "articleId" | "tagId">>;
}
export interface TaggedArticlesFactoryInterface<TTransients extends Record<string, unknown> = Record<string, unknown>, TTraitName extends TraitName = TraitName> extends TaggedArticlesFactoryInterfaceWithoutTraits<TTransients> {
    use(name: TTraitName, ...names: readonly TTraitName[]): TaggedArticlesFactoryInterfaceWithoutTraits<TTransients>;
}
interface TaggedArticlesFactoryBuilder {
    <TOptions extends TaggedArticlesFactoryDefineOptions>(options: TOptions): TaggedArticlesFactoryInterface<{}, TaggedArticlesTraitKeys<TOptions>>;
    withTransientFields: <TTransients extends TaggedArticlesTransientFields>(defaultTransientFieldValues: TTransients) => <TOptions extends TaggedArticlesFactoryDefineOptions<TTransients>>(options: TOptions) => TaggedArticlesFactoryInterface<TTransients, TaggedArticlesTraitKeys<TOptions>>;
}
/**
 * Define factory for {@link TaggedArticles} model.
 *
 * @param options
 * @returns factory {@link TaggedArticlesFactoryInterface}
 */
export declare const defineTaggedArticlesFactory: TaggedArticlesFactoryBuilder;
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
type AuthorsLinksTransientFields = Record<string, unknown> & Partial<Record<keyof AuthorsLinksFactoryDefineInput, never>>;
type AuthorsLinksFactoryTrait<TTransients extends Record<string, unknown>> = {
    data?: Resolver<Partial<AuthorsLinksFactoryDefineInput>, BuildDataOptions<TTransients>>;
} & CallbackDefineOptions<AuthorsLinks, Prisma.AuthorsLinksCreateInput, TTransients>;
type AuthorsLinksFactoryDefineOptions<TTransients extends Record<string, unknown> = Record<string, unknown>> = {
    defaultData?: Resolver<AuthorsLinksFactoryDefineInput, BuildDataOptions<TTransients>>;
    traits?: {
        [traitName: TraitName]: AuthorsLinksFactoryTrait<TTransients>;
    };
} & CallbackDefineOptions<AuthorsLinks, Prisma.AuthorsLinksCreateInput, TTransients>;
type AuthorsLinksTraitKeys<TOptions extends AuthorsLinksFactoryDefineOptions<any>> = Exclude<keyof TOptions["traits"], number>;
export interface AuthorsLinksFactoryInterfaceWithoutTraits<TTransients extends Record<string, unknown>> {
    readonly _factoryFor: "AuthorsLinks";
    build(inputData?: Partial<Prisma.AuthorsLinksCreateInput & TTransients>): PromiseLike<Prisma.AuthorsLinksCreateInput>;
    buildCreateInput(inputData?: Partial<Prisma.AuthorsLinksCreateInput & TTransients>): PromiseLike<Prisma.AuthorsLinksCreateInput>;
    buildList(list: readonly Partial<Prisma.AuthorsLinksCreateInput & TTransients>[]): PromiseLike<Prisma.AuthorsLinksCreateInput[]>;
    buildList(count: number, item?: Partial<Prisma.AuthorsLinksCreateInput & TTransients>): PromiseLike<Prisma.AuthorsLinksCreateInput[]>;
    pickForConnect(inputData: AuthorsLinks): Pick<AuthorsLinks, "id">;
    create(inputData?: Partial<Prisma.AuthorsLinksCreateInput & TTransients>): PromiseLike<AuthorsLinks>;
    createList(list: readonly Partial<Prisma.AuthorsLinksCreateInput & TTransients>[]): PromiseLike<AuthorsLinks[]>;
    createList(count: number, item?: Partial<Prisma.AuthorsLinksCreateInput & TTransients>): PromiseLike<AuthorsLinks[]>;
    createForConnect(inputData?: Partial<Prisma.AuthorsLinksCreateInput & TTransients>): PromiseLike<Pick<AuthorsLinks, "id">>;
}
export interface AuthorsLinksFactoryInterface<TTransients extends Record<string, unknown> = Record<string, unknown>, TTraitName extends TraitName = TraitName> extends AuthorsLinksFactoryInterfaceWithoutTraits<TTransients> {
    use(name: TTraitName, ...names: readonly TTraitName[]): AuthorsLinksFactoryInterfaceWithoutTraits<TTransients>;
}
interface AuthorsLinksFactoryBuilder {
    <TOptions extends AuthorsLinksFactoryDefineOptions>(options?: TOptions): AuthorsLinksFactoryInterface<{}, AuthorsLinksTraitKeys<TOptions>>;
    withTransientFields: <TTransients extends AuthorsLinksTransientFields>(defaultTransientFieldValues: TTransients) => <TOptions extends AuthorsLinksFactoryDefineOptions<TTransients>>(options?: TOptions) => AuthorsLinksFactoryInterface<TTransients, AuthorsLinksTraitKeys<TOptions>>;
}
/**
 * Define factory for {@link AuthorsLinks} model.
 *
 * @param options
 * @returns factory {@link AuthorsLinksFactoryInterface}
 */
export declare const defineAuthorsLinksFactory: AuthorsLinksFactoryBuilder;
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
    hideOnArticle?: boolean;
    hideOnTeaser?: boolean;
    hideOnTeam?: boolean;
    links?: Prisma.AuthorsLinksCreateNestedManyWithoutAuthorInput;
    image?: AuthorimageFactory | Prisma.ImageCreateNestedOneWithoutAuthorInput;
    articlesAsAuthor?: Prisma.ArticleRevisionAuthorCreateNestedManyWithoutAuthorInput;
    articlesAsSocialMediaAuthor?: Prisma.ArticleRevisionSocialMediaAuthorCreateNestedManyWithoutAuthorInput;
    tags?: Prisma.TaggedAuthorsCreateNestedManyWithoutAuthorInput;
};
type AuthorTransientFields = Record<string, unknown> & Partial<Record<keyof AuthorFactoryDefineInput, never>>;
type AuthorFactoryTrait<TTransients extends Record<string, unknown>> = {
    data?: Resolver<Partial<AuthorFactoryDefineInput>, BuildDataOptions<TTransients>>;
} & CallbackDefineOptions<Author, Prisma.AuthorCreateInput, TTransients>;
type AuthorFactoryDefineOptions<TTransients extends Record<string, unknown> = Record<string, unknown>> = {
    defaultData?: Resolver<AuthorFactoryDefineInput, BuildDataOptions<TTransients>>;
    traits?: {
        [traitName: TraitName]: AuthorFactoryTrait<TTransients>;
    };
} & CallbackDefineOptions<Author, Prisma.AuthorCreateInput, TTransients>;
type AuthorTraitKeys<TOptions extends AuthorFactoryDefineOptions<any>> = Exclude<keyof TOptions["traits"], number>;
export interface AuthorFactoryInterfaceWithoutTraits<TTransients extends Record<string, unknown>> {
    readonly _factoryFor: "Author";
    build(inputData?: Partial<Prisma.AuthorCreateInput & TTransients>): PromiseLike<Prisma.AuthorCreateInput>;
    buildCreateInput(inputData?: Partial<Prisma.AuthorCreateInput & TTransients>): PromiseLike<Prisma.AuthorCreateInput>;
    buildList(list: readonly Partial<Prisma.AuthorCreateInput & TTransients>[]): PromiseLike<Prisma.AuthorCreateInput[]>;
    buildList(count: number, item?: Partial<Prisma.AuthorCreateInput & TTransients>): PromiseLike<Prisma.AuthorCreateInput[]>;
    pickForConnect(inputData: Author): Pick<Author, "id">;
    create(inputData?: Partial<Prisma.AuthorCreateInput & TTransients>): PromiseLike<Author>;
    createList(list: readonly Partial<Prisma.AuthorCreateInput & TTransients>[]): PromiseLike<Author[]>;
    createList(count: number, item?: Partial<Prisma.AuthorCreateInput & TTransients>): PromiseLike<Author[]>;
    createForConnect(inputData?: Partial<Prisma.AuthorCreateInput & TTransients>): PromiseLike<Pick<Author, "id">>;
}
export interface AuthorFactoryInterface<TTransients extends Record<string, unknown> = Record<string, unknown>, TTraitName extends TraitName = TraitName> extends AuthorFactoryInterfaceWithoutTraits<TTransients> {
    use(name: TTraitName, ...names: readonly TTraitName[]): AuthorFactoryInterfaceWithoutTraits<TTransients>;
}
interface AuthorFactoryBuilder {
    <TOptions extends AuthorFactoryDefineOptions>(options?: TOptions): AuthorFactoryInterface<{}, AuthorTraitKeys<TOptions>>;
    withTransientFields: <TTransients extends AuthorTransientFields>(defaultTransientFieldValues: TTransients) => <TOptions extends AuthorFactoryDefineOptions<TTransients>>(options?: TOptions) => AuthorFactoryInterface<TTransients, AuthorTraitKeys<TOptions>>;
}
/**
 * Define factory for {@link Author} model.
 *
 * @param options
 * @returns factory {@link AuthorFactoryInterface}
 */
export declare const defineAuthorFactory: AuthorFactoryBuilder;
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
type TaggedAuthorsTransientFields = Record<string, unknown> & Partial<Record<keyof TaggedAuthorsFactoryDefineInput, never>>;
type TaggedAuthorsFactoryTrait<TTransients extends Record<string, unknown>> = {
    data?: Resolver<Partial<TaggedAuthorsFactoryDefineInput>, BuildDataOptions<TTransients>>;
} & CallbackDefineOptions<TaggedAuthors, Prisma.TaggedAuthorsCreateInput, TTransients>;
type TaggedAuthorsFactoryDefineOptions<TTransients extends Record<string, unknown> = Record<string, unknown>> = {
    defaultData: Resolver<TaggedAuthorsFactoryDefineInput, BuildDataOptions<TTransients>>;
    traits?: {
        [traitName: string | symbol]: TaggedAuthorsFactoryTrait<TTransients>;
    };
} & CallbackDefineOptions<TaggedAuthors, Prisma.TaggedAuthorsCreateInput, TTransients>;
type TaggedAuthorsTraitKeys<TOptions extends TaggedAuthorsFactoryDefineOptions<any>> = Exclude<keyof TOptions["traits"], number>;
export interface TaggedAuthorsFactoryInterfaceWithoutTraits<TTransients extends Record<string, unknown>> {
    readonly _factoryFor: "TaggedAuthors";
    build(inputData?: Partial<Prisma.TaggedAuthorsCreateInput & TTransients>): PromiseLike<Prisma.TaggedAuthorsCreateInput>;
    buildCreateInput(inputData?: Partial<Prisma.TaggedAuthorsCreateInput & TTransients>): PromiseLike<Prisma.TaggedAuthorsCreateInput>;
    buildList(list: readonly Partial<Prisma.TaggedAuthorsCreateInput & TTransients>[]): PromiseLike<Prisma.TaggedAuthorsCreateInput[]>;
    buildList(count: number, item?: Partial<Prisma.TaggedAuthorsCreateInput & TTransients>): PromiseLike<Prisma.TaggedAuthorsCreateInput[]>;
    pickForConnect(inputData: TaggedAuthors): Pick<TaggedAuthors, "authorId" | "tagId">;
    create(inputData?: Partial<Prisma.TaggedAuthorsCreateInput & TTransients>): PromiseLike<TaggedAuthors>;
    createList(list: readonly Partial<Prisma.TaggedAuthorsCreateInput & TTransients>[]): PromiseLike<TaggedAuthors[]>;
    createList(count: number, item?: Partial<Prisma.TaggedAuthorsCreateInput & TTransients>): PromiseLike<TaggedAuthors[]>;
    createForConnect(inputData?: Partial<Prisma.TaggedAuthorsCreateInput & TTransients>): PromiseLike<Pick<TaggedAuthors, "authorId" | "tagId">>;
}
export interface TaggedAuthorsFactoryInterface<TTransients extends Record<string, unknown> = Record<string, unknown>, TTraitName extends TraitName = TraitName> extends TaggedAuthorsFactoryInterfaceWithoutTraits<TTransients> {
    use(name: TTraitName, ...names: readonly TTraitName[]): TaggedAuthorsFactoryInterfaceWithoutTraits<TTransients>;
}
interface TaggedAuthorsFactoryBuilder {
    <TOptions extends TaggedAuthorsFactoryDefineOptions>(options: TOptions): TaggedAuthorsFactoryInterface<{}, TaggedAuthorsTraitKeys<TOptions>>;
    withTransientFields: <TTransients extends TaggedAuthorsTransientFields>(defaultTransientFieldValues: TTransients) => <TOptions extends TaggedAuthorsFactoryDefineOptions<TTransients>>(options: TOptions) => TaggedAuthorsFactoryInterface<TTransients, TaggedAuthorsTraitKeys<TOptions>>;
}
/**
 * Define factory for {@link TaggedAuthors} model.
 *
 * @param options
 * @returns factory {@link TaggedAuthorsFactoryInterface}
 */
export declare const defineTaggedAuthorsFactory: TaggedAuthorsFactoryBuilder;
type FocalPointimageFactory = {
    _factoryFor: "Image";
    build: () => PromiseLike<Prisma.ImageCreateNestedOneWithoutFocalPointInput["create"]>;
};
type FocalPointFactoryDefineInput = {
    x?: number | null;
    y?: number | null;
    image?: FocalPointimageFactory | Prisma.ImageCreateNestedOneWithoutFocalPointInput;
};
type FocalPointTransientFields = Record<string, unknown> & Partial<Record<keyof FocalPointFactoryDefineInput, never>>;
type FocalPointFactoryTrait<TTransients extends Record<string, unknown>> = {
    data?: Resolver<Partial<FocalPointFactoryDefineInput>, BuildDataOptions<TTransients>>;
} & CallbackDefineOptions<FocalPoint, Prisma.FocalPointCreateInput, TTransients>;
type FocalPointFactoryDefineOptions<TTransients extends Record<string, unknown> = Record<string, unknown>> = {
    defaultData?: Resolver<FocalPointFactoryDefineInput, BuildDataOptions<TTransients>>;
    traits?: {
        [traitName: TraitName]: FocalPointFactoryTrait<TTransients>;
    };
} & CallbackDefineOptions<FocalPoint, Prisma.FocalPointCreateInput, TTransients>;
type FocalPointTraitKeys<TOptions extends FocalPointFactoryDefineOptions<any>> = Exclude<keyof TOptions["traits"], number>;
export interface FocalPointFactoryInterfaceWithoutTraits<TTransients extends Record<string, unknown>> {
    readonly _factoryFor: "FocalPoint";
    build(inputData?: Partial<Prisma.FocalPointCreateInput & TTransients>): PromiseLike<Prisma.FocalPointCreateInput>;
    buildCreateInput(inputData?: Partial<Prisma.FocalPointCreateInput & TTransients>): PromiseLike<Prisma.FocalPointCreateInput>;
    buildList(list: readonly Partial<Prisma.FocalPointCreateInput & TTransients>[]): PromiseLike<Prisma.FocalPointCreateInput[]>;
    buildList(count: number, item?: Partial<Prisma.FocalPointCreateInput & TTransients>): PromiseLike<Prisma.FocalPointCreateInput[]>;
    pickForConnect(inputData: FocalPoint): Pick<FocalPoint, "imageId">;
    create(inputData?: Partial<Prisma.FocalPointCreateInput & TTransients>): PromiseLike<FocalPoint>;
    createList(list: readonly Partial<Prisma.FocalPointCreateInput & TTransients>[]): PromiseLike<FocalPoint[]>;
    createList(count: number, item?: Partial<Prisma.FocalPointCreateInput & TTransients>): PromiseLike<FocalPoint[]>;
    createForConnect(inputData?: Partial<Prisma.FocalPointCreateInput & TTransients>): PromiseLike<Pick<FocalPoint, "imageId">>;
}
export interface FocalPointFactoryInterface<TTransients extends Record<string, unknown> = Record<string, unknown>, TTraitName extends TraitName = TraitName> extends FocalPointFactoryInterfaceWithoutTraits<TTransients> {
    use(name: TTraitName, ...names: readonly TTraitName[]): FocalPointFactoryInterfaceWithoutTraits<TTransients>;
}
interface FocalPointFactoryBuilder {
    <TOptions extends FocalPointFactoryDefineOptions>(options?: TOptions): FocalPointFactoryInterface<{}, FocalPointTraitKeys<TOptions>>;
    withTransientFields: <TTransients extends FocalPointTransientFields>(defaultTransientFieldValues: TTransients) => <TOptions extends FocalPointFactoryDefineOptions<TTransients>>(options?: TOptions) => FocalPointFactoryInterface<TTransients, FocalPointTraitKeys<TOptions>>;
}
/**
 * Define factory for {@link FocalPoint} model.
 *
 * @param options
 * @returns factory {@link FocalPointFactoryInterface}
 */
export declare const defineFocalPointFactory: FocalPointFactoryBuilder;
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
    tags?: Prisma.ImageCreatetagsInput | Array<string>;
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
    paymentMethods?: Prisma.PaymentMethodCreateNestedManyWithoutImageInput;
};
type ImageTransientFields = Record<string, unknown> & Partial<Record<keyof ImageFactoryDefineInput, never>>;
type ImageFactoryTrait<TTransients extends Record<string, unknown>> = {
    data?: Resolver<Partial<ImageFactoryDefineInput>, BuildDataOptions<TTransients>>;
} & CallbackDefineOptions<Image, Prisma.ImageCreateInput, TTransients>;
type ImageFactoryDefineOptions<TTransients extends Record<string, unknown> = Record<string, unknown>> = {
    defaultData?: Resolver<ImageFactoryDefineInput, BuildDataOptions<TTransients>>;
    traits?: {
        [traitName: TraitName]: ImageFactoryTrait<TTransients>;
    };
} & CallbackDefineOptions<Image, Prisma.ImageCreateInput, TTransients>;
type ImageTraitKeys<TOptions extends ImageFactoryDefineOptions<any>> = Exclude<keyof TOptions["traits"], number>;
export interface ImageFactoryInterfaceWithoutTraits<TTransients extends Record<string, unknown>> {
    readonly _factoryFor: "Image";
    build(inputData?: Partial<Prisma.ImageCreateInput & TTransients>): PromiseLike<Prisma.ImageCreateInput>;
    buildCreateInput(inputData?: Partial<Prisma.ImageCreateInput & TTransients>): PromiseLike<Prisma.ImageCreateInput>;
    buildList(list: readonly Partial<Prisma.ImageCreateInput & TTransients>[]): PromiseLike<Prisma.ImageCreateInput[]>;
    buildList(count: number, item?: Partial<Prisma.ImageCreateInput & TTransients>): PromiseLike<Prisma.ImageCreateInput[]>;
    pickForConnect(inputData: Image): Pick<Image, "id">;
    create(inputData?: Partial<Prisma.ImageCreateInput & TTransients>): PromiseLike<Image>;
    createList(list: readonly Partial<Prisma.ImageCreateInput & TTransients>[]): PromiseLike<Image[]>;
    createList(count: number, item?: Partial<Prisma.ImageCreateInput & TTransients>): PromiseLike<Image[]>;
    createForConnect(inputData?: Partial<Prisma.ImageCreateInput & TTransients>): PromiseLike<Pick<Image, "id">>;
}
export interface ImageFactoryInterface<TTransients extends Record<string, unknown> = Record<string, unknown>, TTraitName extends TraitName = TraitName> extends ImageFactoryInterfaceWithoutTraits<TTransients> {
    use(name: TTraitName, ...names: readonly TTraitName[]): ImageFactoryInterfaceWithoutTraits<TTransients>;
}
interface ImageFactoryBuilder {
    <TOptions extends ImageFactoryDefineOptions>(options?: TOptions): ImageFactoryInterface<{}, ImageTraitKeys<TOptions>>;
    withTransientFields: <TTransients extends ImageTransientFields>(defaultTransientFieldValues: TTransients) => <TOptions extends ImageFactoryDefineOptions<TTransients>>(options?: TOptions) => ImageFactoryInterface<TTransients, ImageTraitKeys<TOptions>>;
}
/**
 * Define factory for {@link Image} model.
 *
 * @param options
 * @returns factory {@link ImageFactoryInterface}
 */
export declare const defineImageFactory: ImageFactoryBuilder;
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
type CommentsRevisionsTransientFields = Record<string, unknown> & Partial<Record<keyof CommentsRevisionsFactoryDefineInput, never>>;
type CommentsRevisionsFactoryTrait<TTransients extends Record<string, unknown>> = {
    data?: Resolver<Partial<CommentsRevisionsFactoryDefineInput>, BuildDataOptions<TTransients>>;
} & CallbackDefineOptions<CommentsRevisions, Prisma.CommentsRevisionsCreateInput, TTransients>;
type CommentsRevisionsFactoryDefineOptions<TTransients extends Record<string, unknown> = Record<string, unknown>> = {
    defaultData?: Resolver<CommentsRevisionsFactoryDefineInput, BuildDataOptions<TTransients>>;
    traits?: {
        [traitName: TraitName]: CommentsRevisionsFactoryTrait<TTransients>;
    };
} & CallbackDefineOptions<CommentsRevisions, Prisma.CommentsRevisionsCreateInput, TTransients>;
type CommentsRevisionsTraitKeys<TOptions extends CommentsRevisionsFactoryDefineOptions<any>> = Exclude<keyof TOptions["traits"], number>;
export interface CommentsRevisionsFactoryInterfaceWithoutTraits<TTransients extends Record<string, unknown>> {
    readonly _factoryFor: "CommentsRevisions";
    build(inputData?: Partial<Prisma.CommentsRevisionsCreateInput & TTransients>): PromiseLike<Prisma.CommentsRevisionsCreateInput>;
    buildCreateInput(inputData?: Partial<Prisma.CommentsRevisionsCreateInput & TTransients>): PromiseLike<Prisma.CommentsRevisionsCreateInput>;
    buildList(list: readonly Partial<Prisma.CommentsRevisionsCreateInput & TTransients>[]): PromiseLike<Prisma.CommentsRevisionsCreateInput[]>;
    buildList(count: number, item?: Partial<Prisma.CommentsRevisionsCreateInput & TTransients>): PromiseLike<Prisma.CommentsRevisionsCreateInput[]>;
    pickForConnect(inputData: CommentsRevisions): Pick<CommentsRevisions, "id">;
    create(inputData?: Partial<Prisma.CommentsRevisionsCreateInput & TTransients>): PromiseLike<CommentsRevisions>;
    createList(list: readonly Partial<Prisma.CommentsRevisionsCreateInput & TTransients>[]): PromiseLike<CommentsRevisions[]>;
    createList(count: number, item?: Partial<Prisma.CommentsRevisionsCreateInput & TTransients>): PromiseLike<CommentsRevisions[]>;
    createForConnect(inputData?: Partial<Prisma.CommentsRevisionsCreateInput & TTransients>): PromiseLike<Pick<CommentsRevisions, "id">>;
}
export interface CommentsRevisionsFactoryInterface<TTransients extends Record<string, unknown> = Record<string, unknown>, TTraitName extends TraitName = TraitName> extends CommentsRevisionsFactoryInterfaceWithoutTraits<TTransients> {
    use(name: TTraitName, ...names: readonly TTraitName[]): CommentsRevisionsFactoryInterfaceWithoutTraits<TTransients>;
}
interface CommentsRevisionsFactoryBuilder {
    <TOptions extends CommentsRevisionsFactoryDefineOptions>(options?: TOptions): CommentsRevisionsFactoryInterface<{}, CommentsRevisionsTraitKeys<TOptions>>;
    withTransientFields: <TTransients extends CommentsRevisionsTransientFields>(defaultTransientFieldValues: TTransients) => <TOptions extends CommentsRevisionsFactoryDefineOptions<TTransients>>(options?: TOptions) => CommentsRevisionsFactoryInterface<TTransients, CommentsRevisionsTraitKeys<TOptions>>;
}
/**
 * Define factory for {@link CommentsRevisions} model.
 *
 * @param options
 * @returns factory {@link CommentsRevisionsFactoryInterface}
 */
export declare const defineCommentsRevisionsFactory: CommentsRevisionsFactoryBuilder;
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
    featured?: boolean;
    peer?: CommentpeerFactory | Prisma.PeerCreateNestedOneWithoutCommentsInput;
    revisions?: Prisma.CommentsRevisionsCreateNestedManyWithoutCommentInput;
    guestUserImage?: CommentguestUserImageFactory | Prisma.ImageCreateNestedOneWithoutCommentInput;
    user?: CommentuserFactory | Prisma.UserCreateNestedOneWithoutCommentInput;
    tags?: Prisma.TaggedCommentsCreateNestedManyWithoutCommentInput;
    ratings?: Prisma.CommentRatingCreateNestedManyWithoutCommentInput;
    overriddenRatings?: Prisma.CommentRatingOverrideCreateNestedManyWithoutCommentInput;
};
type CommentTransientFields = Record<string, unknown> & Partial<Record<keyof CommentFactoryDefineInput, never>>;
type CommentFactoryTrait<TTransients extends Record<string, unknown>> = {
    data?: Resolver<Partial<CommentFactoryDefineInput>, BuildDataOptions<TTransients>>;
} & CallbackDefineOptions<Comment, Prisma.CommentCreateInput, TTransients>;
type CommentFactoryDefineOptions<TTransients extends Record<string, unknown> = Record<string, unknown>> = {
    defaultData?: Resolver<CommentFactoryDefineInput, BuildDataOptions<TTransients>>;
    traits?: {
        [traitName: TraitName]: CommentFactoryTrait<TTransients>;
    };
} & CallbackDefineOptions<Comment, Prisma.CommentCreateInput, TTransients>;
type CommentTraitKeys<TOptions extends CommentFactoryDefineOptions<any>> = Exclude<keyof TOptions["traits"], number>;
export interface CommentFactoryInterfaceWithoutTraits<TTransients extends Record<string, unknown>> {
    readonly _factoryFor: "Comment";
    build(inputData?: Partial<Prisma.CommentCreateInput & TTransients>): PromiseLike<Prisma.CommentCreateInput>;
    buildCreateInput(inputData?: Partial<Prisma.CommentCreateInput & TTransients>): PromiseLike<Prisma.CommentCreateInput>;
    buildList(list: readonly Partial<Prisma.CommentCreateInput & TTransients>[]): PromiseLike<Prisma.CommentCreateInput[]>;
    buildList(count: number, item?: Partial<Prisma.CommentCreateInput & TTransients>): PromiseLike<Prisma.CommentCreateInput[]>;
    pickForConnect(inputData: Comment): Pick<Comment, "id">;
    create(inputData?: Partial<Prisma.CommentCreateInput & TTransients>): PromiseLike<Comment>;
    createList(list: readonly Partial<Prisma.CommentCreateInput & TTransients>[]): PromiseLike<Comment[]>;
    createList(count: number, item?: Partial<Prisma.CommentCreateInput & TTransients>): PromiseLike<Comment[]>;
    createForConnect(inputData?: Partial<Prisma.CommentCreateInput & TTransients>): PromiseLike<Pick<Comment, "id">>;
}
export interface CommentFactoryInterface<TTransients extends Record<string, unknown> = Record<string, unknown>, TTraitName extends TraitName = TraitName> extends CommentFactoryInterfaceWithoutTraits<TTransients> {
    use(name: TTraitName, ...names: readonly TTraitName[]): CommentFactoryInterfaceWithoutTraits<TTransients>;
}
interface CommentFactoryBuilder {
    <TOptions extends CommentFactoryDefineOptions>(options?: TOptions): CommentFactoryInterface<{}, CommentTraitKeys<TOptions>>;
    withTransientFields: <TTransients extends CommentTransientFields>(defaultTransientFieldValues: TTransients) => <TOptions extends CommentFactoryDefineOptions<TTransients>>(options?: TOptions) => CommentFactoryInterface<TTransients, CommentTraitKeys<TOptions>>;
}
/**
 * Define factory for {@link Comment} model.
 *
 * @param options
 * @returns factory {@link CommentFactoryInterface}
 */
export declare const defineCommentFactory: CommentFactoryBuilder;
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
type TaggedCommentsTransientFields = Record<string, unknown> & Partial<Record<keyof TaggedCommentsFactoryDefineInput, never>>;
type TaggedCommentsFactoryTrait<TTransients extends Record<string, unknown>> = {
    data?: Resolver<Partial<TaggedCommentsFactoryDefineInput>, BuildDataOptions<TTransients>>;
} & CallbackDefineOptions<TaggedComments, Prisma.TaggedCommentsCreateInput, TTransients>;
type TaggedCommentsFactoryDefineOptions<TTransients extends Record<string, unknown> = Record<string, unknown>> = {
    defaultData: Resolver<TaggedCommentsFactoryDefineInput, BuildDataOptions<TTransients>>;
    traits?: {
        [traitName: string | symbol]: TaggedCommentsFactoryTrait<TTransients>;
    };
} & CallbackDefineOptions<TaggedComments, Prisma.TaggedCommentsCreateInput, TTransients>;
type TaggedCommentsTraitKeys<TOptions extends TaggedCommentsFactoryDefineOptions<any>> = Exclude<keyof TOptions["traits"], number>;
export interface TaggedCommentsFactoryInterfaceWithoutTraits<TTransients extends Record<string, unknown>> {
    readonly _factoryFor: "TaggedComments";
    build(inputData?: Partial<Prisma.TaggedCommentsCreateInput & TTransients>): PromiseLike<Prisma.TaggedCommentsCreateInput>;
    buildCreateInput(inputData?: Partial<Prisma.TaggedCommentsCreateInput & TTransients>): PromiseLike<Prisma.TaggedCommentsCreateInput>;
    buildList(list: readonly Partial<Prisma.TaggedCommentsCreateInput & TTransients>[]): PromiseLike<Prisma.TaggedCommentsCreateInput[]>;
    buildList(count: number, item?: Partial<Prisma.TaggedCommentsCreateInput & TTransients>): PromiseLike<Prisma.TaggedCommentsCreateInput[]>;
    pickForConnect(inputData: TaggedComments): Pick<TaggedComments, "commentId" | "tagId">;
    create(inputData?: Partial<Prisma.TaggedCommentsCreateInput & TTransients>): PromiseLike<TaggedComments>;
    createList(list: readonly Partial<Prisma.TaggedCommentsCreateInput & TTransients>[]): PromiseLike<TaggedComments[]>;
    createList(count: number, item?: Partial<Prisma.TaggedCommentsCreateInput & TTransients>): PromiseLike<TaggedComments[]>;
    createForConnect(inputData?: Partial<Prisma.TaggedCommentsCreateInput & TTransients>): PromiseLike<Pick<TaggedComments, "commentId" | "tagId">>;
}
export interface TaggedCommentsFactoryInterface<TTransients extends Record<string, unknown> = Record<string, unknown>, TTraitName extends TraitName = TraitName> extends TaggedCommentsFactoryInterfaceWithoutTraits<TTransients> {
    use(name: TTraitName, ...names: readonly TTraitName[]): TaggedCommentsFactoryInterfaceWithoutTraits<TTransients>;
}
interface TaggedCommentsFactoryBuilder {
    <TOptions extends TaggedCommentsFactoryDefineOptions>(options: TOptions): TaggedCommentsFactoryInterface<{}, TaggedCommentsTraitKeys<TOptions>>;
    withTransientFields: <TTransients extends TaggedCommentsTransientFields>(defaultTransientFieldValues: TTransients) => <TOptions extends TaggedCommentsFactoryDefineOptions<TTransients>>(options: TOptions) => TaggedCommentsFactoryInterface<TTransients, TaggedCommentsTraitKeys<TOptions>>;
}
/**
 * Define factory for {@link TaggedComments} model.
 *
 * @param options
 * @returns factory {@link TaggedCommentsFactoryInterface}
 */
export declare const defineTaggedCommentsFactory: TaggedCommentsFactoryBuilder;
type CommentRatingSystemFactoryDefineInput = {
    id?: string;
    createdAt?: Date;
    modifiedAt?: Date;
    name?: string | null;
    answers?: Prisma.CommentRatingSystemAnswerCreateNestedManyWithoutRatingSystemInput;
};
type CommentRatingSystemTransientFields = Record<string, unknown> & Partial<Record<keyof CommentRatingSystemFactoryDefineInput, never>>;
type CommentRatingSystemFactoryTrait<TTransients extends Record<string, unknown>> = {
    data?: Resolver<Partial<CommentRatingSystemFactoryDefineInput>, BuildDataOptions<TTransients>>;
} & CallbackDefineOptions<CommentRatingSystem, Prisma.CommentRatingSystemCreateInput, TTransients>;
type CommentRatingSystemFactoryDefineOptions<TTransients extends Record<string, unknown> = Record<string, unknown>> = {
    defaultData?: Resolver<CommentRatingSystemFactoryDefineInput, BuildDataOptions<TTransients>>;
    traits?: {
        [traitName: TraitName]: CommentRatingSystemFactoryTrait<TTransients>;
    };
} & CallbackDefineOptions<CommentRatingSystem, Prisma.CommentRatingSystemCreateInput, TTransients>;
type CommentRatingSystemTraitKeys<TOptions extends CommentRatingSystemFactoryDefineOptions<any>> = Exclude<keyof TOptions["traits"], number>;
export interface CommentRatingSystemFactoryInterfaceWithoutTraits<TTransients extends Record<string, unknown>> {
    readonly _factoryFor: "CommentRatingSystem";
    build(inputData?: Partial<Prisma.CommentRatingSystemCreateInput & TTransients>): PromiseLike<Prisma.CommentRatingSystemCreateInput>;
    buildCreateInput(inputData?: Partial<Prisma.CommentRatingSystemCreateInput & TTransients>): PromiseLike<Prisma.CommentRatingSystemCreateInput>;
    buildList(list: readonly Partial<Prisma.CommentRatingSystemCreateInput & TTransients>[]): PromiseLike<Prisma.CommentRatingSystemCreateInput[]>;
    buildList(count: number, item?: Partial<Prisma.CommentRatingSystemCreateInput & TTransients>): PromiseLike<Prisma.CommentRatingSystemCreateInput[]>;
    pickForConnect(inputData: CommentRatingSystem): Pick<CommentRatingSystem, "id">;
    create(inputData?: Partial<Prisma.CommentRatingSystemCreateInput & TTransients>): PromiseLike<CommentRatingSystem>;
    createList(list: readonly Partial<Prisma.CommentRatingSystemCreateInput & TTransients>[]): PromiseLike<CommentRatingSystem[]>;
    createList(count: number, item?: Partial<Prisma.CommentRatingSystemCreateInput & TTransients>): PromiseLike<CommentRatingSystem[]>;
    createForConnect(inputData?: Partial<Prisma.CommentRatingSystemCreateInput & TTransients>): PromiseLike<Pick<CommentRatingSystem, "id">>;
}
export interface CommentRatingSystemFactoryInterface<TTransients extends Record<string, unknown> = Record<string, unknown>, TTraitName extends TraitName = TraitName> extends CommentRatingSystemFactoryInterfaceWithoutTraits<TTransients> {
    use(name: TTraitName, ...names: readonly TTraitName[]): CommentRatingSystemFactoryInterfaceWithoutTraits<TTransients>;
}
interface CommentRatingSystemFactoryBuilder {
    <TOptions extends CommentRatingSystemFactoryDefineOptions>(options?: TOptions): CommentRatingSystemFactoryInterface<{}, CommentRatingSystemTraitKeys<TOptions>>;
    withTransientFields: <TTransients extends CommentRatingSystemTransientFields>(defaultTransientFieldValues: TTransients) => <TOptions extends CommentRatingSystemFactoryDefineOptions<TTransients>>(options?: TOptions) => CommentRatingSystemFactoryInterface<TTransients, CommentRatingSystemTraitKeys<TOptions>>;
}
/**
 * Define factory for {@link CommentRatingSystem} model.
 *
 * @param options
 * @returns factory {@link CommentRatingSystemFactoryInterface}
 */
export declare const defineCommentRatingSystemFactory: CommentRatingSystemFactoryBuilder;
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
type CommentRatingSystemAnswerTransientFields = Record<string, unknown> & Partial<Record<keyof CommentRatingSystemAnswerFactoryDefineInput, never>>;
type CommentRatingSystemAnswerFactoryTrait<TTransients extends Record<string, unknown>> = {
    data?: Resolver<Partial<CommentRatingSystemAnswerFactoryDefineInput>, BuildDataOptions<TTransients>>;
} & CallbackDefineOptions<CommentRatingSystemAnswer, Prisma.CommentRatingSystemAnswerCreateInput, TTransients>;
type CommentRatingSystemAnswerFactoryDefineOptions<TTransients extends Record<string, unknown> = Record<string, unknown>> = {
    defaultData: Resolver<CommentRatingSystemAnswerFactoryDefineInput, BuildDataOptions<TTransients>>;
    traits?: {
        [traitName: string | symbol]: CommentRatingSystemAnswerFactoryTrait<TTransients>;
    };
} & CallbackDefineOptions<CommentRatingSystemAnswer, Prisma.CommentRatingSystemAnswerCreateInput, TTransients>;
type CommentRatingSystemAnswerTraitKeys<TOptions extends CommentRatingSystemAnswerFactoryDefineOptions<any>> = Exclude<keyof TOptions["traits"], number>;
export interface CommentRatingSystemAnswerFactoryInterfaceWithoutTraits<TTransients extends Record<string, unknown>> {
    readonly _factoryFor: "CommentRatingSystemAnswer";
    build(inputData?: Partial<Prisma.CommentRatingSystemAnswerCreateInput & TTransients>): PromiseLike<Prisma.CommentRatingSystemAnswerCreateInput>;
    buildCreateInput(inputData?: Partial<Prisma.CommentRatingSystemAnswerCreateInput & TTransients>): PromiseLike<Prisma.CommentRatingSystemAnswerCreateInput>;
    buildList(list: readonly Partial<Prisma.CommentRatingSystemAnswerCreateInput & TTransients>[]): PromiseLike<Prisma.CommentRatingSystemAnswerCreateInput[]>;
    buildList(count: number, item?: Partial<Prisma.CommentRatingSystemAnswerCreateInput & TTransients>): PromiseLike<Prisma.CommentRatingSystemAnswerCreateInput[]>;
    pickForConnect(inputData: CommentRatingSystemAnswer): Pick<CommentRatingSystemAnswer, "id">;
    create(inputData?: Partial<Prisma.CommentRatingSystemAnswerCreateInput & TTransients>): PromiseLike<CommentRatingSystemAnswer>;
    createList(list: readonly Partial<Prisma.CommentRatingSystemAnswerCreateInput & TTransients>[]): PromiseLike<CommentRatingSystemAnswer[]>;
    createList(count: number, item?: Partial<Prisma.CommentRatingSystemAnswerCreateInput & TTransients>): PromiseLike<CommentRatingSystemAnswer[]>;
    createForConnect(inputData?: Partial<Prisma.CommentRatingSystemAnswerCreateInput & TTransients>): PromiseLike<Pick<CommentRatingSystemAnswer, "id">>;
}
export interface CommentRatingSystemAnswerFactoryInterface<TTransients extends Record<string, unknown> = Record<string, unknown>, TTraitName extends TraitName = TraitName> extends CommentRatingSystemAnswerFactoryInterfaceWithoutTraits<TTransients> {
    use(name: TTraitName, ...names: readonly TTraitName[]): CommentRatingSystemAnswerFactoryInterfaceWithoutTraits<TTransients>;
}
interface CommentRatingSystemAnswerFactoryBuilder {
    <TOptions extends CommentRatingSystemAnswerFactoryDefineOptions>(options: TOptions): CommentRatingSystemAnswerFactoryInterface<{}, CommentRatingSystemAnswerTraitKeys<TOptions>>;
    withTransientFields: <TTransients extends CommentRatingSystemAnswerTransientFields>(defaultTransientFieldValues: TTransients) => <TOptions extends CommentRatingSystemAnswerFactoryDefineOptions<TTransients>>(options: TOptions) => CommentRatingSystemAnswerFactoryInterface<TTransients, CommentRatingSystemAnswerTraitKeys<TOptions>>;
}
/**
 * Define factory for {@link CommentRatingSystemAnswer} model.
 *
 * @param options
 * @returns factory {@link CommentRatingSystemAnswerFactoryInterface}
 */
export declare const defineCommentRatingSystemAnswerFactory: CommentRatingSystemAnswerFactoryBuilder;
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
type CommentRatingTransientFields = Record<string, unknown> & Partial<Record<keyof CommentRatingFactoryDefineInput, never>>;
type CommentRatingFactoryTrait<TTransients extends Record<string, unknown>> = {
    data?: Resolver<Partial<CommentRatingFactoryDefineInput>, BuildDataOptions<TTransients>>;
} & CallbackDefineOptions<CommentRating, Prisma.CommentRatingCreateInput, TTransients>;
type CommentRatingFactoryDefineOptions<TTransients extends Record<string, unknown> = Record<string, unknown>> = {
    defaultData: Resolver<CommentRatingFactoryDefineInput, BuildDataOptions<TTransients>>;
    traits?: {
        [traitName: string | symbol]: CommentRatingFactoryTrait<TTransients>;
    };
} & CallbackDefineOptions<CommentRating, Prisma.CommentRatingCreateInput, TTransients>;
type CommentRatingTraitKeys<TOptions extends CommentRatingFactoryDefineOptions<any>> = Exclude<keyof TOptions["traits"], number>;
export interface CommentRatingFactoryInterfaceWithoutTraits<TTransients extends Record<string, unknown>> {
    readonly _factoryFor: "CommentRating";
    build(inputData?: Partial<Prisma.CommentRatingCreateInput & TTransients>): PromiseLike<Prisma.CommentRatingCreateInput>;
    buildCreateInput(inputData?: Partial<Prisma.CommentRatingCreateInput & TTransients>): PromiseLike<Prisma.CommentRatingCreateInput>;
    buildList(list: readonly Partial<Prisma.CommentRatingCreateInput & TTransients>[]): PromiseLike<Prisma.CommentRatingCreateInput[]>;
    buildList(count: number, item?: Partial<Prisma.CommentRatingCreateInput & TTransients>): PromiseLike<Prisma.CommentRatingCreateInput[]>;
    pickForConnect(inputData: CommentRating): Pick<CommentRating, "id">;
    create(inputData?: Partial<Prisma.CommentRatingCreateInput & TTransients>): PromiseLike<CommentRating>;
    createList(list: readonly Partial<Prisma.CommentRatingCreateInput & TTransients>[]): PromiseLike<CommentRating[]>;
    createList(count: number, item?: Partial<Prisma.CommentRatingCreateInput & TTransients>): PromiseLike<CommentRating[]>;
    createForConnect(inputData?: Partial<Prisma.CommentRatingCreateInput & TTransients>): PromiseLike<Pick<CommentRating, "id">>;
}
export interface CommentRatingFactoryInterface<TTransients extends Record<string, unknown> = Record<string, unknown>, TTraitName extends TraitName = TraitName> extends CommentRatingFactoryInterfaceWithoutTraits<TTransients> {
    use(name: TTraitName, ...names: readonly TTraitName[]): CommentRatingFactoryInterfaceWithoutTraits<TTransients>;
}
interface CommentRatingFactoryBuilder {
    <TOptions extends CommentRatingFactoryDefineOptions>(options: TOptions): CommentRatingFactoryInterface<{}, CommentRatingTraitKeys<TOptions>>;
    withTransientFields: <TTransients extends CommentRatingTransientFields>(defaultTransientFieldValues: TTransients) => <TOptions extends CommentRatingFactoryDefineOptions<TTransients>>(options: TOptions) => CommentRatingFactoryInterface<TTransients, CommentRatingTraitKeys<TOptions>>;
}
/**
 * Define factory for {@link CommentRating} model.
 *
 * @param options
 * @returns factory {@link CommentRatingFactoryInterface}
 */
export declare const defineCommentRatingFactory: CommentRatingFactoryBuilder;
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
type CommentRatingOverrideTransientFields = Record<string, unknown> & Partial<Record<keyof CommentRatingOverrideFactoryDefineInput, never>>;
type CommentRatingOverrideFactoryTrait<TTransients extends Record<string, unknown>> = {
    data?: Resolver<Partial<CommentRatingOverrideFactoryDefineInput>, BuildDataOptions<TTransients>>;
} & CallbackDefineOptions<CommentRatingOverride, Prisma.CommentRatingOverrideCreateInput, TTransients>;
type CommentRatingOverrideFactoryDefineOptions<TTransients extends Record<string, unknown> = Record<string, unknown>> = {
    defaultData: Resolver<CommentRatingOverrideFactoryDefineInput, BuildDataOptions<TTransients>>;
    traits?: {
        [traitName: string | symbol]: CommentRatingOverrideFactoryTrait<TTransients>;
    };
} & CallbackDefineOptions<CommentRatingOverride, Prisma.CommentRatingOverrideCreateInput, TTransients>;
type CommentRatingOverrideTraitKeys<TOptions extends CommentRatingOverrideFactoryDefineOptions<any>> = Exclude<keyof TOptions["traits"], number>;
export interface CommentRatingOverrideFactoryInterfaceWithoutTraits<TTransients extends Record<string, unknown>> {
    readonly _factoryFor: "CommentRatingOverride";
    build(inputData?: Partial<Prisma.CommentRatingOverrideCreateInput & TTransients>): PromiseLike<Prisma.CommentRatingOverrideCreateInput>;
    buildCreateInput(inputData?: Partial<Prisma.CommentRatingOverrideCreateInput & TTransients>): PromiseLike<Prisma.CommentRatingOverrideCreateInput>;
    buildList(list: readonly Partial<Prisma.CommentRatingOverrideCreateInput & TTransients>[]): PromiseLike<Prisma.CommentRatingOverrideCreateInput[]>;
    buildList(count: number, item?: Partial<Prisma.CommentRatingOverrideCreateInput & TTransients>): PromiseLike<Prisma.CommentRatingOverrideCreateInput[]>;
    pickForConnect(inputData: CommentRatingOverride): Pick<CommentRatingOverride, "answerId" | "commentId">;
    create(inputData?: Partial<Prisma.CommentRatingOverrideCreateInput & TTransients>): PromiseLike<CommentRatingOverride>;
    createList(list: readonly Partial<Prisma.CommentRatingOverrideCreateInput & TTransients>[]): PromiseLike<CommentRatingOverride[]>;
    createList(count: number, item?: Partial<Prisma.CommentRatingOverrideCreateInput & TTransients>): PromiseLike<CommentRatingOverride[]>;
    createForConnect(inputData?: Partial<Prisma.CommentRatingOverrideCreateInput & TTransients>): PromiseLike<Pick<CommentRatingOverride, "answerId" | "commentId">>;
}
export interface CommentRatingOverrideFactoryInterface<TTransients extends Record<string, unknown> = Record<string, unknown>, TTraitName extends TraitName = TraitName> extends CommentRatingOverrideFactoryInterfaceWithoutTraits<TTransients> {
    use(name: TTraitName, ...names: readonly TTraitName[]): CommentRatingOverrideFactoryInterfaceWithoutTraits<TTransients>;
}
interface CommentRatingOverrideFactoryBuilder {
    <TOptions extends CommentRatingOverrideFactoryDefineOptions>(options: TOptions): CommentRatingOverrideFactoryInterface<{}, CommentRatingOverrideTraitKeys<TOptions>>;
    withTransientFields: <TTransients extends CommentRatingOverrideTransientFields>(defaultTransientFieldValues: TTransients) => <TOptions extends CommentRatingOverrideFactoryDefineOptions<TTransients>>(options: TOptions) => CommentRatingOverrideFactoryInterface<TTransients, CommentRatingOverrideTraitKeys<TOptions>>;
}
/**
 * Define factory for {@link CommentRatingOverride} model.
 *
 * @param options
 * @returns factory {@link CommentRatingOverrideFactoryInterface}
 */
export declare const defineCommentRatingOverrideFactory: CommentRatingOverrideFactoryBuilder;
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
type InvoiceItemTransientFields = Record<string, unknown> & Partial<Record<keyof InvoiceItemFactoryDefineInput, never>>;
type InvoiceItemFactoryTrait<TTransients extends Record<string, unknown>> = {
    data?: Resolver<Partial<InvoiceItemFactoryDefineInput>, BuildDataOptions<TTransients>>;
} & CallbackDefineOptions<InvoiceItem, Prisma.InvoiceItemCreateInput, TTransients>;
type InvoiceItemFactoryDefineOptions<TTransients extends Record<string, unknown> = Record<string, unknown>> = {
    defaultData?: Resolver<InvoiceItemFactoryDefineInput, BuildDataOptions<TTransients>>;
    traits?: {
        [traitName: TraitName]: InvoiceItemFactoryTrait<TTransients>;
    };
} & CallbackDefineOptions<InvoiceItem, Prisma.InvoiceItemCreateInput, TTransients>;
type InvoiceItemTraitKeys<TOptions extends InvoiceItemFactoryDefineOptions<any>> = Exclude<keyof TOptions["traits"], number>;
export interface InvoiceItemFactoryInterfaceWithoutTraits<TTransients extends Record<string, unknown>> {
    readonly _factoryFor: "InvoiceItem";
    build(inputData?: Partial<Prisma.InvoiceItemCreateInput & TTransients>): PromiseLike<Prisma.InvoiceItemCreateInput>;
    buildCreateInput(inputData?: Partial<Prisma.InvoiceItemCreateInput & TTransients>): PromiseLike<Prisma.InvoiceItemCreateInput>;
    buildList(list: readonly Partial<Prisma.InvoiceItemCreateInput & TTransients>[]): PromiseLike<Prisma.InvoiceItemCreateInput[]>;
    buildList(count: number, item?: Partial<Prisma.InvoiceItemCreateInput & TTransients>): PromiseLike<Prisma.InvoiceItemCreateInput[]>;
    pickForConnect(inputData: InvoiceItem): Pick<InvoiceItem, "id">;
    create(inputData?: Partial<Prisma.InvoiceItemCreateInput & TTransients>): PromiseLike<InvoiceItem>;
    createList(list: readonly Partial<Prisma.InvoiceItemCreateInput & TTransients>[]): PromiseLike<InvoiceItem[]>;
    createList(count: number, item?: Partial<Prisma.InvoiceItemCreateInput & TTransients>): PromiseLike<InvoiceItem[]>;
    createForConnect(inputData?: Partial<Prisma.InvoiceItemCreateInput & TTransients>): PromiseLike<Pick<InvoiceItem, "id">>;
}
export interface InvoiceItemFactoryInterface<TTransients extends Record<string, unknown> = Record<string, unknown>, TTraitName extends TraitName = TraitName> extends InvoiceItemFactoryInterfaceWithoutTraits<TTransients> {
    use(name: TTraitName, ...names: readonly TTraitName[]): InvoiceItemFactoryInterfaceWithoutTraits<TTransients>;
}
interface InvoiceItemFactoryBuilder {
    <TOptions extends InvoiceItemFactoryDefineOptions>(options?: TOptions): InvoiceItemFactoryInterface<{}, InvoiceItemTraitKeys<TOptions>>;
    withTransientFields: <TTransients extends InvoiceItemTransientFields>(defaultTransientFieldValues: TTransients) => <TOptions extends InvoiceItemFactoryDefineOptions<TTransients>>(options?: TOptions) => InvoiceItemFactoryInterface<TTransients, InvoiceItemTraitKeys<TOptions>>;
}
/**
 * Define factory for {@link InvoiceItem} model.
 *
 * @param options
 * @returns factory {@link InvoiceItemFactoryInterface}
 */
export declare const defineInvoiceItemFactory: InvoiceItemFactoryBuilder;
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
    currency?: Currency;
    items?: Prisma.InvoiceItemCreateNestedManyWithoutInvoicesInput;
    subscription?: InvoicesubscriptionFactory | Prisma.SubscriptionCreateNestedOneWithoutInvoicesInput;
    subscriptionPeriods?: Prisma.SubscriptionPeriodCreateNestedManyWithoutInvoiceInput;
};
type InvoiceTransientFields = Record<string, unknown> & Partial<Record<keyof InvoiceFactoryDefineInput, never>>;
type InvoiceFactoryTrait<TTransients extends Record<string, unknown>> = {
    data?: Resolver<Partial<InvoiceFactoryDefineInput>, BuildDataOptions<TTransients>>;
} & CallbackDefineOptions<Invoice, Prisma.InvoiceCreateInput, TTransients>;
type InvoiceFactoryDefineOptions<TTransients extends Record<string, unknown> = Record<string, unknown>> = {
    defaultData?: Resolver<InvoiceFactoryDefineInput, BuildDataOptions<TTransients>>;
    traits?: {
        [traitName: TraitName]: InvoiceFactoryTrait<TTransients>;
    };
} & CallbackDefineOptions<Invoice, Prisma.InvoiceCreateInput, TTransients>;
type InvoiceTraitKeys<TOptions extends InvoiceFactoryDefineOptions<any>> = Exclude<keyof TOptions["traits"], number>;
export interface InvoiceFactoryInterfaceWithoutTraits<TTransients extends Record<string, unknown>> {
    readonly _factoryFor: "Invoice";
    build(inputData?: Partial<Prisma.InvoiceCreateInput & TTransients>): PromiseLike<Prisma.InvoiceCreateInput>;
    buildCreateInput(inputData?: Partial<Prisma.InvoiceCreateInput & TTransients>): PromiseLike<Prisma.InvoiceCreateInput>;
    buildList(list: readonly Partial<Prisma.InvoiceCreateInput & TTransients>[]): PromiseLike<Prisma.InvoiceCreateInput[]>;
    buildList(count: number, item?: Partial<Prisma.InvoiceCreateInput & TTransients>): PromiseLike<Prisma.InvoiceCreateInput[]>;
    pickForConnect(inputData: Invoice): Pick<Invoice, "id">;
    create(inputData?: Partial<Prisma.InvoiceCreateInput & TTransients>): PromiseLike<Invoice>;
    createList(list: readonly Partial<Prisma.InvoiceCreateInput & TTransients>[]): PromiseLike<Invoice[]>;
    createList(count: number, item?: Partial<Prisma.InvoiceCreateInput & TTransients>): PromiseLike<Invoice[]>;
    createForConnect(inputData?: Partial<Prisma.InvoiceCreateInput & TTransients>): PromiseLike<Pick<Invoice, "id">>;
}
export interface InvoiceFactoryInterface<TTransients extends Record<string, unknown> = Record<string, unknown>, TTraitName extends TraitName = TraitName> extends InvoiceFactoryInterfaceWithoutTraits<TTransients> {
    use(name: TTraitName, ...names: readonly TTraitName[]): InvoiceFactoryInterfaceWithoutTraits<TTransients>;
}
interface InvoiceFactoryBuilder {
    <TOptions extends InvoiceFactoryDefineOptions>(options?: TOptions): InvoiceFactoryInterface<{}, InvoiceTraitKeys<TOptions>>;
    withTransientFields: <TTransients extends InvoiceTransientFields>(defaultTransientFieldValues: TTransients) => <TOptions extends InvoiceFactoryDefineOptions<TTransients>>(options?: TOptions) => InvoiceFactoryInterface<TTransients, InvoiceTraitKeys<TOptions>>;
}
/**
 * Define factory for {@link Invoice} model.
 *
 * @param options
 * @returns factory {@link InvoiceFactoryInterface}
 */
export declare const defineInvoiceFactory: InvoiceFactoryBuilder;
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
type MailLogTransientFields = Record<string, unknown> & Partial<Record<keyof MailLogFactoryDefineInput, never>>;
type MailLogFactoryTrait<TTransients extends Record<string, unknown>> = {
    data?: Resolver<Partial<MailLogFactoryDefineInput>, BuildDataOptions<TTransients>>;
} & CallbackDefineOptions<MailLog, Prisma.MailLogCreateInput, TTransients>;
type MailLogFactoryDefineOptions<TTransients extends Record<string, unknown> = Record<string, unknown>> = {
    defaultData: Resolver<MailLogFactoryDefineInput, BuildDataOptions<TTransients>>;
    traits?: {
        [traitName: string | symbol]: MailLogFactoryTrait<TTransients>;
    };
} & CallbackDefineOptions<MailLog, Prisma.MailLogCreateInput, TTransients>;
type MailLogTraitKeys<TOptions extends MailLogFactoryDefineOptions<any>> = Exclude<keyof TOptions["traits"], number>;
export interface MailLogFactoryInterfaceWithoutTraits<TTransients extends Record<string, unknown>> {
    readonly _factoryFor: "MailLog";
    build(inputData?: Partial<Prisma.MailLogCreateInput & TTransients>): PromiseLike<Prisma.MailLogCreateInput>;
    buildCreateInput(inputData?: Partial<Prisma.MailLogCreateInput & TTransients>): PromiseLike<Prisma.MailLogCreateInput>;
    buildList(list: readonly Partial<Prisma.MailLogCreateInput & TTransients>[]): PromiseLike<Prisma.MailLogCreateInput[]>;
    buildList(count: number, item?: Partial<Prisma.MailLogCreateInput & TTransients>): PromiseLike<Prisma.MailLogCreateInput[]>;
    pickForConnect(inputData: MailLog): Pick<MailLog, "id">;
    create(inputData?: Partial<Prisma.MailLogCreateInput & TTransients>): PromiseLike<MailLog>;
    createList(list: readonly Partial<Prisma.MailLogCreateInput & TTransients>[]): PromiseLike<MailLog[]>;
    createList(count: number, item?: Partial<Prisma.MailLogCreateInput & TTransients>): PromiseLike<MailLog[]>;
    createForConnect(inputData?: Partial<Prisma.MailLogCreateInput & TTransients>): PromiseLike<Pick<MailLog, "id">>;
}
export interface MailLogFactoryInterface<TTransients extends Record<string, unknown> = Record<string, unknown>, TTraitName extends TraitName = TraitName> extends MailLogFactoryInterfaceWithoutTraits<TTransients> {
    use(name: TTraitName, ...names: readonly TTraitName[]): MailLogFactoryInterfaceWithoutTraits<TTransients>;
}
interface MailLogFactoryBuilder {
    <TOptions extends MailLogFactoryDefineOptions>(options: TOptions): MailLogFactoryInterface<{}, MailLogTraitKeys<TOptions>>;
    withTransientFields: <TTransients extends MailLogTransientFields>(defaultTransientFieldValues: TTransients) => <TOptions extends MailLogFactoryDefineOptions<TTransients>>(options: TOptions) => MailLogFactoryInterface<TTransients, MailLogTraitKeys<TOptions>>;
}
/**
 * Define factory for {@link MailLog} model.
 *
 * @param options
 * @returns factory {@link MailLogFactoryInterface}
 */
export declare const defineMailLogFactory: MailLogFactoryBuilder;
type AvailablePaymentMethodMemberPlanFactory = {
    _factoryFor: "MemberPlan";
    build: () => PromiseLike<Prisma.MemberPlanCreateNestedOneWithoutAvailablePaymentMethodsInput["create"]>;
};
type AvailablePaymentMethodFactoryDefineInput = {
    id?: string;
    createdAt?: Date;
    modifiedAt?: Date;
    paymentMethodIDs?: Prisma.AvailablePaymentMethodCreatepaymentMethodIDsInput | Array<string>;
    paymentPeriodicities?: Prisma.AvailablePaymentMethodCreatepaymentPeriodicitiesInput | Array<PaymentPeriodicity>;
    forceAutoRenewal?: boolean;
    MemberPlan?: AvailablePaymentMethodMemberPlanFactory | Prisma.MemberPlanCreateNestedOneWithoutAvailablePaymentMethodsInput;
};
type AvailablePaymentMethodTransientFields = Record<string, unknown> & Partial<Record<keyof AvailablePaymentMethodFactoryDefineInput, never>>;
type AvailablePaymentMethodFactoryTrait<TTransients extends Record<string, unknown>> = {
    data?: Resolver<Partial<AvailablePaymentMethodFactoryDefineInput>, BuildDataOptions<TTransients>>;
} & CallbackDefineOptions<AvailablePaymentMethod, Prisma.AvailablePaymentMethodCreateInput, TTransients>;
type AvailablePaymentMethodFactoryDefineOptions<TTransients extends Record<string, unknown> = Record<string, unknown>> = {
    defaultData?: Resolver<AvailablePaymentMethodFactoryDefineInput, BuildDataOptions<TTransients>>;
    traits?: {
        [traitName: TraitName]: AvailablePaymentMethodFactoryTrait<TTransients>;
    };
} & CallbackDefineOptions<AvailablePaymentMethod, Prisma.AvailablePaymentMethodCreateInput, TTransients>;
type AvailablePaymentMethodTraitKeys<TOptions extends AvailablePaymentMethodFactoryDefineOptions<any>> = Exclude<keyof TOptions["traits"], number>;
export interface AvailablePaymentMethodFactoryInterfaceWithoutTraits<TTransients extends Record<string, unknown>> {
    readonly _factoryFor: "AvailablePaymentMethod";
    build(inputData?: Partial<Prisma.AvailablePaymentMethodCreateInput & TTransients>): PromiseLike<Prisma.AvailablePaymentMethodCreateInput>;
    buildCreateInput(inputData?: Partial<Prisma.AvailablePaymentMethodCreateInput & TTransients>): PromiseLike<Prisma.AvailablePaymentMethodCreateInput>;
    buildList(list: readonly Partial<Prisma.AvailablePaymentMethodCreateInput & TTransients>[]): PromiseLike<Prisma.AvailablePaymentMethodCreateInput[]>;
    buildList(count: number, item?: Partial<Prisma.AvailablePaymentMethodCreateInput & TTransients>): PromiseLike<Prisma.AvailablePaymentMethodCreateInput[]>;
    pickForConnect(inputData: AvailablePaymentMethod): Pick<AvailablePaymentMethod, "id">;
    create(inputData?: Partial<Prisma.AvailablePaymentMethodCreateInput & TTransients>): PromiseLike<AvailablePaymentMethod>;
    createList(list: readonly Partial<Prisma.AvailablePaymentMethodCreateInput & TTransients>[]): PromiseLike<AvailablePaymentMethod[]>;
    createList(count: number, item?: Partial<Prisma.AvailablePaymentMethodCreateInput & TTransients>): PromiseLike<AvailablePaymentMethod[]>;
    createForConnect(inputData?: Partial<Prisma.AvailablePaymentMethodCreateInput & TTransients>): PromiseLike<Pick<AvailablePaymentMethod, "id">>;
}
export interface AvailablePaymentMethodFactoryInterface<TTransients extends Record<string, unknown> = Record<string, unknown>, TTraitName extends TraitName = TraitName> extends AvailablePaymentMethodFactoryInterfaceWithoutTraits<TTransients> {
    use(name: TTraitName, ...names: readonly TTraitName[]): AvailablePaymentMethodFactoryInterfaceWithoutTraits<TTransients>;
}
interface AvailablePaymentMethodFactoryBuilder {
    <TOptions extends AvailablePaymentMethodFactoryDefineOptions>(options?: TOptions): AvailablePaymentMethodFactoryInterface<{}, AvailablePaymentMethodTraitKeys<TOptions>>;
    withTransientFields: <TTransients extends AvailablePaymentMethodTransientFields>(defaultTransientFieldValues: TTransients) => <TOptions extends AvailablePaymentMethodFactoryDefineOptions<TTransients>>(options?: TOptions) => AvailablePaymentMethodFactoryInterface<TTransients, AvailablePaymentMethodTraitKeys<TOptions>>;
}
/**
 * Define factory for {@link AvailablePaymentMethod} model.
 *
 * @param options
 * @returns factory {@link AvailablePaymentMethodFactoryInterface}
 */
export declare const defineAvailablePaymentMethodFactory: AvailablePaymentMethodFactoryBuilder;
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
    tags?: Prisma.MemberPlanCreatetagsInput | Array<string>;
    description?: Prisma.JsonNullValueInput | Prisma.InputJsonValue;
    active?: boolean;
    currency?: Currency;
    amountPerMonthMin?: number;
    extendable?: boolean;
    maxCount?: number | null;
    availablePaymentMethods?: Prisma.AvailablePaymentMethodCreateNestedManyWithoutMemberPlanInput;
    image?: MemberPlanimageFactory | Prisma.ImageCreateNestedOneWithoutMemberPlanInput;
    Subscription?: Prisma.SubscriptionCreateNestedManyWithoutMemberPlanInput;
    subscriptionFlows?: Prisma.SubscriptionFlowCreateNestedManyWithoutMemberPlanInput;
};
type MemberPlanTransientFields = Record<string, unknown> & Partial<Record<keyof MemberPlanFactoryDefineInput, never>>;
type MemberPlanFactoryTrait<TTransients extends Record<string, unknown>> = {
    data?: Resolver<Partial<MemberPlanFactoryDefineInput>, BuildDataOptions<TTransients>>;
} & CallbackDefineOptions<MemberPlan, Prisma.MemberPlanCreateInput, TTransients>;
type MemberPlanFactoryDefineOptions<TTransients extends Record<string, unknown> = Record<string, unknown>> = {
    defaultData?: Resolver<MemberPlanFactoryDefineInput, BuildDataOptions<TTransients>>;
    traits?: {
        [traitName: TraitName]: MemberPlanFactoryTrait<TTransients>;
    };
} & CallbackDefineOptions<MemberPlan, Prisma.MemberPlanCreateInput, TTransients>;
type MemberPlanTraitKeys<TOptions extends MemberPlanFactoryDefineOptions<any>> = Exclude<keyof TOptions["traits"], number>;
export interface MemberPlanFactoryInterfaceWithoutTraits<TTransients extends Record<string, unknown>> {
    readonly _factoryFor: "MemberPlan";
    build(inputData?: Partial<Prisma.MemberPlanCreateInput & TTransients>): PromiseLike<Prisma.MemberPlanCreateInput>;
    buildCreateInput(inputData?: Partial<Prisma.MemberPlanCreateInput & TTransients>): PromiseLike<Prisma.MemberPlanCreateInput>;
    buildList(list: readonly Partial<Prisma.MemberPlanCreateInput & TTransients>[]): PromiseLike<Prisma.MemberPlanCreateInput[]>;
    buildList(count: number, item?: Partial<Prisma.MemberPlanCreateInput & TTransients>): PromiseLike<Prisma.MemberPlanCreateInput[]>;
    pickForConnect(inputData: MemberPlan): Pick<MemberPlan, "id">;
    create(inputData?: Partial<Prisma.MemberPlanCreateInput & TTransients>): PromiseLike<MemberPlan>;
    createList(list: readonly Partial<Prisma.MemberPlanCreateInput & TTransients>[]): PromiseLike<MemberPlan[]>;
    createList(count: number, item?: Partial<Prisma.MemberPlanCreateInput & TTransients>): PromiseLike<MemberPlan[]>;
    createForConnect(inputData?: Partial<Prisma.MemberPlanCreateInput & TTransients>): PromiseLike<Pick<MemberPlan, "id">>;
}
export interface MemberPlanFactoryInterface<TTransients extends Record<string, unknown> = Record<string, unknown>, TTraitName extends TraitName = TraitName> extends MemberPlanFactoryInterfaceWithoutTraits<TTransients> {
    use(name: TTraitName, ...names: readonly TTraitName[]): MemberPlanFactoryInterfaceWithoutTraits<TTransients>;
}
interface MemberPlanFactoryBuilder {
    <TOptions extends MemberPlanFactoryDefineOptions>(options?: TOptions): MemberPlanFactoryInterface<{}, MemberPlanTraitKeys<TOptions>>;
    withTransientFields: <TTransients extends MemberPlanTransientFields>(defaultTransientFieldValues: TTransients) => <TOptions extends MemberPlanFactoryDefineOptions<TTransients>>(options?: TOptions) => MemberPlanFactoryInterface<TTransients, MemberPlanTraitKeys<TOptions>>;
}
/**
 * Define factory for {@link MemberPlan} model.
 *
 * @param options
 * @returns factory {@link MemberPlanFactoryInterface}
 */
export declare const defineMemberPlanFactory: MemberPlanFactoryBuilder;
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
type NavigationLinkTransientFields = Record<string, unknown> & Partial<Record<keyof NavigationLinkFactoryDefineInput, never>>;
type NavigationLinkFactoryTrait<TTransients extends Record<string, unknown>> = {
    data?: Resolver<Partial<NavigationLinkFactoryDefineInput>, BuildDataOptions<TTransients>>;
} & CallbackDefineOptions<NavigationLink, Prisma.NavigationLinkCreateInput, TTransients>;
type NavigationLinkFactoryDefineOptions<TTransients extends Record<string, unknown> = Record<string, unknown>> = {
    defaultData?: Resolver<NavigationLinkFactoryDefineInput, BuildDataOptions<TTransients>>;
    traits?: {
        [traitName: TraitName]: NavigationLinkFactoryTrait<TTransients>;
    };
} & CallbackDefineOptions<NavigationLink, Prisma.NavigationLinkCreateInput, TTransients>;
type NavigationLinkTraitKeys<TOptions extends NavigationLinkFactoryDefineOptions<any>> = Exclude<keyof TOptions["traits"], number>;
export interface NavigationLinkFactoryInterfaceWithoutTraits<TTransients extends Record<string, unknown>> {
    readonly _factoryFor: "NavigationLink";
    build(inputData?: Partial<Prisma.NavigationLinkCreateInput & TTransients>): PromiseLike<Prisma.NavigationLinkCreateInput>;
    buildCreateInput(inputData?: Partial<Prisma.NavigationLinkCreateInput & TTransients>): PromiseLike<Prisma.NavigationLinkCreateInput>;
    buildList(list: readonly Partial<Prisma.NavigationLinkCreateInput & TTransients>[]): PromiseLike<Prisma.NavigationLinkCreateInput[]>;
    buildList(count: number, item?: Partial<Prisma.NavigationLinkCreateInput & TTransients>): PromiseLike<Prisma.NavigationLinkCreateInput[]>;
    pickForConnect(inputData: NavigationLink): Pick<NavigationLink, "id">;
    create(inputData?: Partial<Prisma.NavigationLinkCreateInput & TTransients>): PromiseLike<NavigationLink>;
    createList(list: readonly Partial<Prisma.NavigationLinkCreateInput & TTransients>[]): PromiseLike<NavigationLink[]>;
    createList(count: number, item?: Partial<Prisma.NavigationLinkCreateInput & TTransients>): PromiseLike<NavigationLink[]>;
    createForConnect(inputData?: Partial<Prisma.NavigationLinkCreateInput & TTransients>): PromiseLike<Pick<NavigationLink, "id">>;
}
export interface NavigationLinkFactoryInterface<TTransients extends Record<string, unknown> = Record<string, unknown>, TTraitName extends TraitName = TraitName> extends NavigationLinkFactoryInterfaceWithoutTraits<TTransients> {
    use(name: TTraitName, ...names: readonly TTraitName[]): NavigationLinkFactoryInterfaceWithoutTraits<TTransients>;
}
interface NavigationLinkFactoryBuilder {
    <TOptions extends NavigationLinkFactoryDefineOptions>(options?: TOptions): NavigationLinkFactoryInterface<{}, NavigationLinkTraitKeys<TOptions>>;
    withTransientFields: <TTransients extends NavigationLinkTransientFields>(defaultTransientFieldValues: TTransients) => <TOptions extends NavigationLinkFactoryDefineOptions<TTransients>>(options?: TOptions) => NavigationLinkFactoryInterface<TTransients, NavigationLinkTraitKeys<TOptions>>;
}
/**
 * Define factory for {@link NavigationLink} model.
 *
 * @param options
 * @returns factory {@link NavigationLinkFactoryInterface}
 */
export declare const defineNavigationLinkFactory: NavigationLinkFactoryBuilder;
type NavigationFactoryDefineInput = {
    id?: string;
    createdAt?: Date;
    modifiedAt?: Date;
    key?: string;
    name?: string;
    links?: Prisma.NavigationLinkCreateNestedManyWithoutNavigationInput;
};
type NavigationTransientFields = Record<string, unknown> & Partial<Record<keyof NavigationFactoryDefineInput, never>>;
type NavigationFactoryTrait<TTransients extends Record<string, unknown>> = {
    data?: Resolver<Partial<NavigationFactoryDefineInput>, BuildDataOptions<TTransients>>;
} & CallbackDefineOptions<Navigation, Prisma.NavigationCreateInput, TTransients>;
type NavigationFactoryDefineOptions<TTransients extends Record<string, unknown> = Record<string, unknown>> = {
    defaultData?: Resolver<NavigationFactoryDefineInput, BuildDataOptions<TTransients>>;
    traits?: {
        [traitName: TraitName]: NavigationFactoryTrait<TTransients>;
    };
} & CallbackDefineOptions<Navigation, Prisma.NavigationCreateInput, TTransients>;
type NavigationTraitKeys<TOptions extends NavigationFactoryDefineOptions<any>> = Exclude<keyof TOptions["traits"], number>;
export interface NavigationFactoryInterfaceWithoutTraits<TTransients extends Record<string, unknown>> {
    readonly _factoryFor: "Navigation";
    build(inputData?: Partial<Prisma.NavigationCreateInput & TTransients>): PromiseLike<Prisma.NavigationCreateInput>;
    buildCreateInput(inputData?: Partial<Prisma.NavigationCreateInput & TTransients>): PromiseLike<Prisma.NavigationCreateInput>;
    buildList(list: readonly Partial<Prisma.NavigationCreateInput & TTransients>[]): PromiseLike<Prisma.NavigationCreateInput[]>;
    buildList(count: number, item?: Partial<Prisma.NavigationCreateInput & TTransients>): PromiseLike<Prisma.NavigationCreateInput[]>;
    pickForConnect(inputData: Navigation): Pick<Navigation, "id">;
    create(inputData?: Partial<Prisma.NavigationCreateInput & TTransients>): PromiseLike<Navigation>;
    createList(list: readonly Partial<Prisma.NavigationCreateInput & TTransients>[]): PromiseLike<Navigation[]>;
    createList(count: number, item?: Partial<Prisma.NavigationCreateInput & TTransients>): PromiseLike<Navigation[]>;
    createForConnect(inputData?: Partial<Prisma.NavigationCreateInput & TTransients>): PromiseLike<Pick<Navigation, "id">>;
}
export interface NavigationFactoryInterface<TTransients extends Record<string, unknown> = Record<string, unknown>, TTraitName extends TraitName = TraitName> extends NavigationFactoryInterfaceWithoutTraits<TTransients> {
    use(name: TTraitName, ...names: readonly TTraitName[]): NavigationFactoryInterfaceWithoutTraits<TTransients>;
}
interface NavigationFactoryBuilder {
    <TOptions extends NavigationFactoryDefineOptions>(options?: TOptions): NavigationFactoryInterface<{}, NavigationTraitKeys<TOptions>>;
    withTransientFields: <TTransients extends NavigationTransientFields>(defaultTransientFieldValues: TTransients) => <TOptions extends NavigationFactoryDefineOptions<TTransients>>(options?: TOptions) => NavigationFactoryInterface<TTransients, NavigationTraitKeys<TOptions>>;
}
/**
 * Define factory for {@link Navigation} model.
 *
 * @param options
 * @returns factory {@link NavigationFactoryInterface}
 */
export declare const defineNavigationFactory: NavigationFactoryBuilder;
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
    tags?: Prisma.PageRevisionCreatetagsInput | Array<string>;
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
type PageRevisionTransientFields = Record<string, unknown> & Partial<Record<keyof PageRevisionFactoryDefineInput, never>>;
type PageRevisionFactoryTrait<TTransients extends Record<string, unknown>> = {
    data?: Resolver<Partial<PageRevisionFactoryDefineInput>, BuildDataOptions<TTransients>>;
} & CallbackDefineOptions<PageRevision, Prisma.PageRevisionCreateInput, TTransients>;
type PageRevisionFactoryDefineOptions<TTransients extends Record<string, unknown> = Record<string, unknown>> = {
    defaultData?: Resolver<PageRevisionFactoryDefineInput, BuildDataOptions<TTransients>>;
    traits?: {
        [traitName: TraitName]: PageRevisionFactoryTrait<TTransients>;
    };
} & CallbackDefineOptions<PageRevision, Prisma.PageRevisionCreateInput, TTransients>;
type PageRevisionTraitKeys<TOptions extends PageRevisionFactoryDefineOptions<any>> = Exclude<keyof TOptions["traits"], number>;
export interface PageRevisionFactoryInterfaceWithoutTraits<TTransients extends Record<string, unknown>> {
    readonly _factoryFor: "PageRevision";
    build(inputData?: Partial<Prisma.PageRevisionCreateInput & TTransients>): PromiseLike<Prisma.PageRevisionCreateInput>;
    buildCreateInput(inputData?: Partial<Prisma.PageRevisionCreateInput & TTransients>): PromiseLike<Prisma.PageRevisionCreateInput>;
    buildList(list: readonly Partial<Prisma.PageRevisionCreateInput & TTransients>[]): PromiseLike<Prisma.PageRevisionCreateInput[]>;
    buildList(count: number, item?: Partial<Prisma.PageRevisionCreateInput & TTransients>): PromiseLike<Prisma.PageRevisionCreateInput[]>;
    pickForConnect(inputData: PageRevision): Pick<PageRevision, "id">;
    create(inputData?: Partial<Prisma.PageRevisionCreateInput & TTransients>): PromiseLike<PageRevision>;
    createList(list: readonly Partial<Prisma.PageRevisionCreateInput & TTransients>[]): PromiseLike<PageRevision[]>;
    createList(count: number, item?: Partial<Prisma.PageRevisionCreateInput & TTransients>): PromiseLike<PageRevision[]>;
    createForConnect(inputData?: Partial<Prisma.PageRevisionCreateInput & TTransients>): PromiseLike<Pick<PageRevision, "id">>;
}
export interface PageRevisionFactoryInterface<TTransients extends Record<string, unknown> = Record<string, unknown>, TTraitName extends TraitName = TraitName> extends PageRevisionFactoryInterfaceWithoutTraits<TTransients> {
    use(name: TTraitName, ...names: readonly TTraitName[]): PageRevisionFactoryInterfaceWithoutTraits<TTransients>;
}
interface PageRevisionFactoryBuilder {
    <TOptions extends PageRevisionFactoryDefineOptions>(options?: TOptions): PageRevisionFactoryInterface<{}, PageRevisionTraitKeys<TOptions>>;
    withTransientFields: <TTransients extends PageRevisionTransientFields>(defaultTransientFieldValues: TTransients) => <TOptions extends PageRevisionFactoryDefineOptions<TTransients>>(options?: TOptions) => PageRevisionFactoryInterface<TTransients, PageRevisionTraitKeys<TOptions>>;
}
/**
 * Define factory for {@link PageRevision} model.
 *
 * @param options
 * @returns factory {@link PageRevisionFactoryInterface}
 */
export declare const definePageRevisionFactory: PageRevisionFactoryBuilder;
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
type PageTransientFields = Record<string, unknown> & Partial<Record<keyof PageFactoryDefineInput, never>>;
type PageFactoryTrait<TTransients extends Record<string, unknown>> = {
    data?: Resolver<Partial<PageFactoryDefineInput>, BuildDataOptions<TTransients>>;
} & CallbackDefineOptions<Page, Prisma.PageCreateInput, TTransients>;
type PageFactoryDefineOptions<TTransients extends Record<string, unknown> = Record<string, unknown>> = {
    defaultData?: Resolver<PageFactoryDefineInput, BuildDataOptions<TTransients>>;
    traits?: {
        [traitName: TraitName]: PageFactoryTrait<TTransients>;
    };
} & CallbackDefineOptions<Page, Prisma.PageCreateInput, TTransients>;
type PageTraitKeys<TOptions extends PageFactoryDefineOptions<any>> = Exclude<keyof TOptions["traits"], number>;
export interface PageFactoryInterfaceWithoutTraits<TTransients extends Record<string, unknown>> {
    readonly _factoryFor: "Page";
    build(inputData?: Partial<Prisma.PageCreateInput & TTransients>): PromiseLike<Prisma.PageCreateInput>;
    buildCreateInput(inputData?: Partial<Prisma.PageCreateInput & TTransients>): PromiseLike<Prisma.PageCreateInput>;
    buildList(list: readonly Partial<Prisma.PageCreateInput & TTransients>[]): PromiseLike<Prisma.PageCreateInput[]>;
    buildList(count: number, item?: Partial<Prisma.PageCreateInput & TTransients>): PromiseLike<Prisma.PageCreateInput[]>;
    pickForConnect(inputData: Page): Pick<Page, "id">;
    create(inputData?: Partial<Prisma.PageCreateInput & TTransients>): PromiseLike<Page>;
    createList(list: readonly Partial<Prisma.PageCreateInput & TTransients>[]): PromiseLike<Page[]>;
    createList(count: number, item?: Partial<Prisma.PageCreateInput & TTransients>): PromiseLike<Page[]>;
    createForConnect(inputData?: Partial<Prisma.PageCreateInput & TTransients>): PromiseLike<Pick<Page, "id">>;
}
export interface PageFactoryInterface<TTransients extends Record<string, unknown> = Record<string, unknown>, TTraitName extends TraitName = TraitName> extends PageFactoryInterfaceWithoutTraits<TTransients> {
    use(name: TTraitName, ...names: readonly TTraitName[]): PageFactoryInterfaceWithoutTraits<TTransients>;
}
interface PageFactoryBuilder {
    <TOptions extends PageFactoryDefineOptions>(options?: TOptions): PageFactoryInterface<{}, PageTraitKeys<TOptions>>;
    withTransientFields: <TTransients extends PageTransientFields>(defaultTransientFieldValues: TTransients) => <TOptions extends PageFactoryDefineOptions<TTransients>>(options?: TOptions) => PageFactoryInterface<TTransients, PageTraitKeys<TOptions>>;
}
/**
 * Define factory for {@link Page} model.
 *
 * @param options
 * @returns factory {@link PageFactoryInterface}
 */
export declare const definePageFactory: PageFactoryBuilder;
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
type TaggedPagesTransientFields = Record<string, unknown> & Partial<Record<keyof TaggedPagesFactoryDefineInput, never>>;
type TaggedPagesFactoryTrait<TTransients extends Record<string, unknown>> = {
    data?: Resolver<Partial<TaggedPagesFactoryDefineInput>, BuildDataOptions<TTransients>>;
} & CallbackDefineOptions<TaggedPages, Prisma.TaggedPagesCreateInput, TTransients>;
type TaggedPagesFactoryDefineOptions<TTransients extends Record<string, unknown> = Record<string, unknown>> = {
    defaultData: Resolver<TaggedPagesFactoryDefineInput, BuildDataOptions<TTransients>>;
    traits?: {
        [traitName: string | symbol]: TaggedPagesFactoryTrait<TTransients>;
    };
} & CallbackDefineOptions<TaggedPages, Prisma.TaggedPagesCreateInput, TTransients>;
type TaggedPagesTraitKeys<TOptions extends TaggedPagesFactoryDefineOptions<any>> = Exclude<keyof TOptions["traits"], number>;
export interface TaggedPagesFactoryInterfaceWithoutTraits<TTransients extends Record<string, unknown>> {
    readonly _factoryFor: "TaggedPages";
    build(inputData?: Partial<Prisma.TaggedPagesCreateInput & TTransients>): PromiseLike<Prisma.TaggedPagesCreateInput>;
    buildCreateInput(inputData?: Partial<Prisma.TaggedPagesCreateInput & TTransients>): PromiseLike<Prisma.TaggedPagesCreateInput>;
    buildList(list: readonly Partial<Prisma.TaggedPagesCreateInput & TTransients>[]): PromiseLike<Prisma.TaggedPagesCreateInput[]>;
    buildList(count: number, item?: Partial<Prisma.TaggedPagesCreateInput & TTransients>): PromiseLike<Prisma.TaggedPagesCreateInput[]>;
    pickForConnect(inputData: TaggedPages): Pick<TaggedPages, "pageId" | "tagId">;
    create(inputData?: Partial<Prisma.TaggedPagesCreateInput & TTransients>): PromiseLike<TaggedPages>;
    createList(list: readonly Partial<Prisma.TaggedPagesCreateInput & TTransients>[]): PromiseLike<TaggedPages[]>;
    createList(count: number, item?: Partial<Prisma.TaggedPagesCreateInput & TTransients>): PromiseLike<TaggedPages[]>;
    createForConnect(inputData?: Partial<Prisma.TaggedPagesCreateInput & TTransients>): PromiseLike<Pick<TaggedPages, "pageId" | "tagId">>;
}
export interface TaggedPagesFactoryInterface<TTransients extends Record<string, unknown> = Record<string, unknown>, TTraitName extends TraitName = TraitName> extends TaggedPagesFactoryInterfaceWithoutTraits<TTransients> {
    use(name: TTraitName, ...names: readonly TTraitName[]): TaggedPagesFactoryInterfaceWithoutTraits<TTransients>;
}
interface TaggedPagesFactoryBuilder {
    <TOptions extends TaggedPagesFactoryDefineOptions>(options: TOptions): TaggedPagesFactoryInterface<{}, TaggedPagesTraitKeys<TOptions>>;
    withTransientFields: <TTransients extends TaggedPagesTransientFields>(defaultTransientFieldValues: TTransients) => <TOptions extends TaggedPagesFactoryDefineOptions<TTransients>>(options: TOptions) => TaggedPagesFactoryInterface<TTransients, TaggedPagesTraitKeys<TOptions>>;
}
/**
 * Define factory for {@link TaggedPages} model.
 *
 * @param options
 * @returns factory {@link TaggedPagesFactoryInterface}
 */
export declare const defineTaggedPagesFactory: TaggedPagesFactoryBuilder;
type PaymentMethodimageFactory = {
    _factoryFor: "Image";
    build: () => PromiseLike<Prisma.ImageCreateNestedOneWithoutPaymentMethodsInput["create"]>;
};
type PaymentMethodFactoryDefineInput = {
    id?: string;
    createdAt?: Date;
    modifiedAt?: Date;
    name?: string;
    slug?: string;
    description?: string;
    paymentProviderID?: string;
    active?: boolean;
    image?: PaymentMethodimageFactory | Prisma.ImageCreateNestedOneWithoutPaymentMethodsInput;
    Subscription?: Prisma.SubscriptionCreateNestedManyWithoutPaymentMethodInput;
    Payment?: Prisma.PaymentCreateNestedManyWithoutPaymentMethodInput;
    subscriptionFlows?: Prisma.SubscriptionFlowCreateNestedManyWithoutPaymentMethodsInput;
};
type PaymentMethodTransientFields = Record<string, unknown> & Partial<Record<keyof PaymentMethodFactoryDefineInput, never>>;
type PaymentMethodFactoryTrait<TTransients extends Record<string, unknown>> = {
    data?: Resolver<Partial<PaymentMethodFactoryDefineInput>, BuildDataOptions<TTransients>>;
} & CallbackDefineOptions<PaymentMethod, Prisma.PaymentMethodCreateInput, TTransients>;
type PaymentMethodFactoryDefineOptions<TTransients extends Record<string, unknown> = Record<string, unknown>> = {
    defaultData?: Resolver<PaymentMethodFactoryDefineInput, BuildDataOptions<TTransients>>;
    traits?: {
        [traitName: TraitName]: PaymentMethodFactoryTrait<TTransients>;
    };
} & CallbackDefineOptions<PaymentMethod, Prisma.PaymentMethodCreateInput, TTransients>;
type PaymentMethodTraitKeys<TOptions extends PaymentMethodFactoryDefineOptions<any>> = Exclude<keyof TOptions["traits"], number>;
export interface PaymentMethodFactoryInterfaceWithoutTraits<TTransients extends Record<string, unknown>> {
    readonly _factoryFor: "PaymentMethod";
    build(inputData?: Partial<Prisma.PaymentMethodCreateInput & TTransients>): PromiseLike<Prisma.PaymentMethodCreateInput>;
    buildCreateInput(inputData?: Partial<Prisma.PaymentMethodCreateInput & TTransients>): PromiseLike<Prisma.PaymentMethodCreateInput>;
    buildList(list: readonly Partial<Prisma.PaymentMethodCreateInput & TTransients>[]): PromiseLike<Prisma.PaymentMethodCreateInput[]>;
    buildList(count: number, item?: Partial<Prisma.PaymentMethodCreateInput & TTransients>): PromiseLike<Prisma.PaymentMethodCreateInput[]>;
    pickForConnect(inputData: PaymentMethod): Pick<PaymentMethod, "id">;
    create(inputData?: Partial<Prisma.PaymentMethodCreateInput & TTransients>): PromiseLike<PaymentMethod>;
    createList(list: readonly Partial<Prisma.PaymentMethodCreateInput & TTransients>[]): PromiseLike<PaymentMethod[]>;
    createList(count: number, item?: Partial<Prisma.PaymentMethodCreateInput & TTransients>): PromiseLike<PaymentMethod[]>;
    createForConnect(inputData?: Partial<Prisma.PaymentMethodCreateInput & TTransients>): PromiseLike<Pick<PaymentMethod, "id">>;
}
export interface PaymentMethodFactoryInterface<TTransients extends Record<string, unknown> = Record<string, unknown>, TTraitName extends TraitName = TraitName> extends PaymentMethodFactoryInterfaceWithoutTraits<TTransients> {
    use(name: TTraitName, ...names: readonly TTraitName[]): PaymentMethodFactoryInterfaceWithoutTraits<TTransients>;
}
interface PaymentMethodFactoryBuilder {
    <TOptions extends PaymentMethodFactoryDefineOptions>(options?: TOptions): PaymentMethodFactoryInterface<{}, PaymentMethodTraitKeys<TOptions>>;
    withTransientFields: <TTransients extends PaymentMethodTransientFields>(defaultTransientFieldValues: TTransients) => <TOptions extends PaymentMethodFactoryDefineOptions<TTransients>>(options?: TOptions) => PaymentMethodFactoryInterface<TTransients, PaymentMethodTraitKeys<TOptions>>;
}
/**
 * Define factory for {@link PaymentMethod} model.
 *
 * @param options
 * @returns factory {@link PaymentMethodFactoryInterface}
 */
export declare const definePaymentMethodFactory: PaymentMethodFactoryBuilder;
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
type PaymentTransientFields = Record<string, unknown> & Partial<Record<keyof PaymentFactoryDefineInput, never>>;
type PaymentFactoryTrait<TTransients extends Record<string, unknown>> = {
    data?: Resolver<Partial<PaymentFactoryDefineInput>, BuildDataOptions<TTransients>>;
} & CallbackDefineOptions<Payment, Prisma.PaymentCreateInput, TTransients>;
type PaymentFactoryDefineOptions<TTransients extends Record<string, unknown> = Record<string, unknown>> = {
    defaultData: Resolver<PaymentFactoryDefineInput, BuildDataOptions<TTransients>>;
    traits?: {
        [traitName: string | symbol]: PaymentFactoryTrait<TTransients>;
    };
} & CallbackDefineOptions<Payment, Prisma.PaymentCreateInput, TTransients>;
type PaymentTraitKeys<TOptions extends PaymentFactoryDefineOptions<any>> = Exclude<keyof TOptions["traits"], number>;
export interface PaymentFactoryInterfaceWithoutTraits<TTransients extends Record<string, unknown>> {
    readonly _factoryFor: "Payment";
    build(inputData?: Partial<Prisma.PaymentCreateInput & TTransients>): PromiseLike<Prisma.PaymentCreateInput>;
    buildCreateInput(inputData?: Partial<Prisma.PaymentCreateInput & TTransients>): PromiseLike<Prisma.PaymentCreateInput>;
    buildList(list: readonly Partial<Prisma.PaymentCreateInput & TTransients>[]): PromiseLike<Prisma.PaymentCreateInput[]>;
    buildList(count: number, item?: Partial<Prisma.PaymentCreateInput & TTransients>): PromiseLike<Prisma.PaymentCreateInput[]>;
    pickForConnect(inputData: Payment): Pick<Payment, "id">;
    create(inputData?: Partial<Prisma.PaymentCreateInput & TTransients>): PromiseLike<Payment>;
    createList(list: readonly Partial<Prisma.PaymentCreateInput & TTransients>[]): PromiseLike<Payment[]>;
    createList(count: number, item?: Partial<Prisma.PaymentCreateInput & TTransients>): PromiseLike<Payment[]>;
    createForConnect(inputData?: Partial<Prisma.PaymentCreateInput & TTransients>): PromiseLike<Pick<Payment, "id">>;
}
export interface PaymentFactoryInterface<TTransients extends Record<string, unknown> = Record<string, unknown>, TTraitName extends TraitName = TraitName> extends PaymentFactoryInterfaceWithoutTraits<TTransients> {
    use(name: TTraitName, ...names: readonly TTraitName[]): PaymentFactoryInterfaceWithoutTraits<TTransients>;
}
interface PaymentFactoryBuilder {
    <TOptions extends PaymentFactoryDefineOptions>(options: TOptions): PaymentFactoryInterface<{}, PaymentTraitKeys<TOptions>>;
    withTransientFields: <TTransients extends PaymentTransientFields>(defaultTransientFieldValues: TTransients) => <TOptions extends PaymentFactoryDefineOptions<TTransients>>(options: TOptions) => PaymentFactoryInterface<TTransients, PaymentTraitKeys<TOptions>>;
}
/**
 * Define factory for {@link Payment} model.
 *
 * @param options
 * @returns factory {@link PaymentFactoryInterface}
 */
export declare const definePaymentFactory: PaymentFactoryBuilder;
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
type PeerProfileTransientFields = Record<string, unknown> & Partial<Record<keyof PeerProfileFactoryDefineInput, never>>;
type PeerProfileFactoryTrait<TTransients extends Record<string, unknown>> = {
    data?: Resolver<Partial<PeerProfileFactoryDefineInput>, BuildDataOptions<TTransients>>;
} & CallbackDefineOptions<PeerProfile, Prisma.PeerProfileCreateInput, TTransients>;
type PeerProfileFactoryDefineOptions<TTransients extends Record<string, unknown> = Record<string, unknown>> = {
    defaultData?: Resolver<PeerProfileFactoryDefineInput, BuildDataOptions<TTransients>>;
    traits?: {
        [traitName: TraitName]: PeerProfileFactoryTrait<TTransients>;
    };
} & CallbackDefineOptions<PeerProfile, Prisma.PeerProfileCreateInput, TTransients>;
type PeerProfileTraitKeys<TOptions extends PeerProfileFactoryDefineOptions<any>> = Exclude<keyof TOptions["traits"], number>;
export interface PeerProfileFactoryInterfaceWithoutTraits<TTransients extends Record<string, unknown>> {
    readonly _factoryFor: "PeerProfile";
    build(inputData?: Partial<Prisma.PeerProfileCreateInput & TTransients>): PromiseLike<Prisma.PeerProfileCreateInput>;
    buildCreateInput(inputData?: Partial<Prisma.PeerProfileCreateInput & TTransients>): PromiseLike<Prisma.PeerProfileCreateInput>;
    buildList(list: readonly Partial<Prisma.PeerProfileCreateInput & TTransients>[]): PromiseLike<Prisma.PeerProfileCreateInput[]>;
    buildList(count: number, item?: Partial<Prisma.PeerProfileCreateInput & TTransients>): PromiseLike<Prisma.PeerProfileCreateInput[]>;
    pickForConnect(inputData: PeerProfile): Pick<PeerProfile, "id">;
    create(inputData?: Partial<Prisma.PeerProfileCreateInput & TTransients>): PromiseLike<PeerProfile>;
    createList(list: readonly Partial<Prisma.PeerProfileCreateInput & TTransients>[]): PromiseLike<PeerProfile[]>;
    createList(count: number, item?: Partial<Prisma.PeerProfileCreateInput & TTransients>): PromiseLike<PeerProfile[]>;
    createForConnect(inputData?: Partial<Prisma.PeerProfileCreateInput & TTransients>): PromiseLike<Pick<PeerProfile, "id">>;
}
export interface PeerProfileFactoryInterface<TTransients extends Record<string, unknown> = Record<string, unknown>, TTraitName extends TraitName = TraitName> extends PeerProfileFactoryInterfaceWithoutTraits<TTransients> {
    use(name: TTraitName, ...names: readonly TTraitName[]): PeerProfileFactoryInterfaceWithoutTraits<TTransients>;
}
interface PeerProfileFactoryBuilder {
    <TOptions extends PeerProfileFactoryDefineOptions>(options?: TOptions): PeerProfileFactoryInterface<{}, PeerProfileTraitKeys<TOptions>>;
    withTransientFields: <TTransients extends PeerProfileTransientFields>(defaultTransientFieldValues: TTransients) => <TOptions extends PeerProfileFactoryDefineOptions<TTransients>>(options?: TOptions) => PeerProfileFactoryInterface<TTransients, PeerProfileTraitKeys<TOptions>>;
}
/**
 * Define factory for {@link PeerProfile} model.
 *
 * @param options
 * @returns factory {@link PeerProfileFactoryInterface}
 */
export declare const definePeerProfileFactory: PeerProfileFactoryBuilder;
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
type PeerTransientFields = Record<string, unknown> & Partial<Record<keyof PeerFactoryDefineInput, never>>;
type PeerFactoryTrait<TTransients extends Record<string, unknown>> = {
    data?: Resolver<Partial<PeerFactoryDefineInput>, BuildDataOptions<TTransients>>;
} & CallbackDefineOptions<Peer, Prisma.PeerCreateInput, TTransients>;
type PeerFactoryDefineOptions<TTransients extends Record<string, unknown> = Record<string, unknown>> = {
    defaultData?: Resolver<PeerFactoryDefineInput, BuildDataOptions<TTransients>>;
    traits?: {
        [traitName: TraitName]: PeerFactoryTrait<TTransients>;
    };
} & CallbackDefineOptions<Peer, Prisma.PeerCreateInput, TTransients>;
type PeerTraitKeys<TOptions extends PeerFactoryDefineOptions<any>> = Exclude<keyof TOptions["traits"], number>;
export interface PeerFactoryInterfaceWithoutTraits<TTransients extends Record<string, unknown>> {
    readonly _factoryFor: "Peer";
    build(inputData?: Partial<Prisma.PeerCreateInput & TTransients>): PromiseLike<Prisma.PeerCreateInput>;
    buildCreateInput(inputData?: Partial<Prisma.PeerCreateInput & TTransients>): PromiseLike<Prisma.PeerCreateInput>;
    buildList(list: readonly Partial<Prisma.PeerCreateInput & TTransients>[]): PromiseLike<Prisma.PeerCreateInput[]>;
    buildList(count: number, item?: Partial<Prisma.PeerCreateInput & TTransients>): PromiseLike<Prisma.PeerCreateInput[]>;
    pickForConnect(inputData: Peer): Pick<Peer, "id">;
    create(inputData?: Partial<Prisma.PeerCreateInput & TTransients>): PromiseLike<Peer>;
    createList(list: readonly Partial<Prisma.PeerCreateInput & TTransients>[]): PromiseLike<Peer[]>;
    createList(count: number, item?: Partial<Prisma.PeerCreateInput & TTransients>): PromiseLike<Peer[]>;
    createForConnect(inputData?: Partial<Prisma.PeerCreateInput & TTransients>): PromiseLike<Pick<Peer, "id">>;
}
export interface PeerFactoryInterface<TTransients extends Record<string, unknown> = Record<string, unknown>, TTraitName extends TraitName = TraitName> extends PeerFactoryInterfaceWithoutTraits<TTransients> {
    use(name: TTraitName, ...names: readonly TTraitName[]): PeerFactoryInterfaceWithoutTraits<TTransients>;
}
interface PeerFactoryBuilder {
    <TOptions extends PeerFactoryDefineOptions>(options?: TOptions): PeerFactoryInterface<{}, PeerTraitKeys<TOptions>>;
    withTransientFields: <TTransients extends PeerTransientFields>(defaultTransientFieldValues: TTransients) => <TOptions extends PeerFactoryDefineOptions<TTransients>>(options?: TOptions) => PeerFactoryInterface<TTransients, PeerTraitKeys<TOptions>>;
}
/**
 * Define factory for {@link Peer} model.
 *
 * @param options
 * @returns factory {@link PeerFactoryInterface}
 */
export declare const definePeerFactory: PeerFactoryBuilder;
type TokenFactoryDefineInput = {
    id?: string;
    createdAt?: Date;
    modifiedAt?: Date;
    name?: string;
    token?: string;
    roleIDs?: Prisma.TokenCreateroleIDsInput | Array<string>;
};
type TokenTransientFields = Record<string, unknown> & Partial<Record<keyof TokenFactoryDefineInput, never>>;
type TokenFactoryTrait<TTransients extends Record<string, unknown>> = {
    data?: Resolver<Partial<TokenFactoryDefineInput>, BuildDataOptions<TTransients>>;
} & CallbackDefineOptions<Token, Prisma.TokenCreateInput, TTransients>;
type TokenFactoryDefineOptions<TTransients extends Record<string, unknown> = Record<string, unknown>> = {
    defaultData?: Resolver<TokenFactoryDefineInput, BuildDataOptions<TTransients>>;
    traits?: {
        [traitName: TraitName]: TokenFactoryTrait<TTransients>;
    };
} & CallbackDefineOptions<Token, Prisma.TokenCreateInput, TTransients>;
type TokenTraitKeys<TOptions extends TokenFactoryDefineOptions<any>> = Exclude<keyof TOptions["traits"], number>;
export interface TokenFactoryInterfaceWithoutTraits<TTransients extends Record<string, unknown>> {
    readonly _factoryFor: "Token";
    build(inputData?: Partial<Prisma.TokenCreateInput & TTransients>): PromiseLike<Prisma.TokenCreateInput>;
    buildCreateInput(inputData?: Partial<Prisma.TokenCreateInput & TTransients>): PromiseLike<Prisma.TokenCreateInput>;
    buildList(list: readonly Partial<Prisma.TokenCreateInput & TTransients>[]): PromiseLike<Prisma.TokenCreateInput[]>;
    buildList(count: number, item?: Partial<Prisma.TokenCreateInput & TTransients>): PromiseLike<Prisma.TokenCreateInput[]>;
    pickForConnect(inputData: Token): Pick<Token, "id">;
    create(inputData?: Partial<Prisma.TokenCreateInput & TTransients>): PromiseLike<Token>;
    createList(list: readonly Partial<Prisma.TokenCreateInput & TTransients>[]): PromiseLike<Token[]>;
    createList(count: number, item?: Partial<Prisma.TokenCreateInput & TTransients>): PromiseLike<Token[]>;
    createForConnect(inputData?: Partial<Prisma.TokenCreateInput & TTransients>): PromiseLike<Pick<Token, "id">>;
}
export interface TokenFactoryInterface<TTransients extends Record<string, unknown> = Record<string, unknown>, TTraitName extends TraitName = TraitName> extends TokenFactoryInterfaceWithoutTraits<TTransients> {
    use(name: TTraitName, ...names: readonly TTraitName[]): TokenFactoryInterfaceWithoutTraits<TTransients>;
}
interface TokenFactoryBuilder {
    <TOptions extends TokenFactoryDefineOptions>(options?: TOptions): TokenFactoryInterface<{}, TokenTraitKeys<TOptions>>;
    withTransientFields: <TTransients extends TokenTransientFields>(defaultTransientFieldValues: TTransients) => <TOptions extends TokenFactoryDefineOptions<TTransients>>(options?: TOptions) => TokenFactoryInterface<TTransients, TokenTraitKeys<TOptions>>;
}
/**
 * Define factory for {@link Token} model.
 *
 * @param options
 * @returns factory {@link TokenFactoryInterface}
 */
export declare const defineTokenFactory: TokenFactoryBuilder;
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
type SessionTransientFields = Record<string, unknown> & Partial<Record<keyof SessionFactoryDefineInput, never>>;
type SessionFactoryTrait<TTransients extends Record<string, unknown>> = {
    data?: Resolver<Partial<SessionFactoryDefineInput>, BuildDataOptions<TTransients>>;
} & CallbackDefineOptions<Session, Prisma.SessionCreateInput, TTransients>;
type SessionFactoryDefineOptions<TTransients extends Record<string, unknown> = Record<string, unknown>> = {
    defaultData: Resolver<SessionFactoryDefineInput, BuildDataOptions<TTransients>>;
    traits?: {
        [traitName: string | symbol]: SessionFactoryTrait<TTransients>;
    };
} & CallbackDefineOptions<Session, Prisma.SessionCreateInput, TTransients>;
type SessionTraitKeys<TOptions extends SessionFactoryDefineOptions<any>> = Exclude<keyof TOptions["traits"], number>;
export interface SessionFactoryInterfaceWithoutTraits<TTransients extends Record<string, unknown>> {
    readonly _factoryFor: "Session";
    build(inputData?: Partial<Prisma.SessionCreateInput & TTransients>): PromiseLike<Prisma.SessionCreateInput>;
    buildCreateInput(inputData?: Partial<Prisma.SessionCreateInput & TTransients>): PromiseLike<Prisma.SessionCreateInput>;
    buildList(list: readonly Partial<Prisma.SessionCreateInput & TTransients>[]): PromiseLike<Prisma.SessionCreateInput[]>;
    buildList(count: number, item?: Partial<Prisma.SessionCreateInput & TTransients>): PromiseLike<Prisma.SessionCreateInput[]>;
    pickForConnect(inputData: Session): Pick<Session, "id">;
    create(inputData?: Partial<Prisma.SessionCreateInput & TTransients>): PromiseLike<Session>;
    createList(list: readonly Partial<Prisma.SessionCreateInput & TTransients>[]): PromiseLike<Session[]>;
    createList(count: number, item?: Partial<Prisma.SessionCreateInput & TTransients>): PromiseLike<Session[]>;
    createForConnect(inputData?: Partial<Prisma.SessionCreateInput & TTransients>): PromiseLike<Pick<Session, "id">>;
}
export interface SessionFactoryInterface<TTransients extends Record<string, unknown> = Record<string, unknown>, TTraitName extends TraitName = TraitName> extends SessionFactoryInterfaceWithoutTraits<TTransients> {
    use(name: TTraitName, ...names: readonly TTraitName[]): SessionFactoryInterfaceWithoutTraits<TTransients>;
}
interface SessionFactoryBuilder {
    <TOptions extends SessionFactoryDefineOptions>(options: TOptions): SessionFactoryInterface<{}, SessionTraitKeys<TOptions>>;
    withTransientFields: <TTransients extends SessionTransientFields>(defaultTransientFieldValues: TTransients) => <TOptions extends SessionFactoryDefineOptions<TTransients>>(options: TOptions) => SessionFactoryInterface<TTransients, SessionTraitKeys<TOptions>>;
}
/**
 * Define factory for {@link Session} model.
 *
 * @param options
 * @returns factory {@link SessionFactoryInterface}
 */
export declare const defineSessionFactory: SessionFactoryBuilder;
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
type SubscriptionPeriodTransientFields = Record<string, unknown> & Partial<Record<keyof SubscriptionPeriodFactoryDefineInput, never>>;
type SubscriptionPeriodFactoryTrait<TTransients extends Record<string, unknown>> = {
    data?: Resolver<Partial<SubscriptionPeriodFactoryDefineInput>, BuildDataOptions<TTransients>>;
} & CallbackDefineOptions<SubscriptionPeriod, Prisma.SubscriptionPeriodCreateInput, TTransients>;
type SubscriptionPeriodFactoryDefineOptions<TTransients extends Record<string, unknown> = Record<string, unknown>> = {
    defaultData: Resolver<SubscriptionPeriodFactoryDefineInput, BuildDataOptions<TTransients>>;
    traits?: {
        [traitName: string | symbol]: SubscriptionPeriodFactoryTrait<TTransients>;
    };
} & CallbackDefineOptions<SubscriptionPeriod, Prisma.SubscriptionPeriodCreateInput, TTransients>;
type SubscriptionPeriodTraitKeys<TOptions extends SubscriptionPeriodFactoryDefineOptions<any>> = Exclude<keyof TOptions["traits"], number>;
export interface SubscriptionPeriodFactoryInterfaceWithoutTraits<TTransients extends Record<string, unknown>> {
    readonly _factoryFor: "SubscriptionPeriod";
    build(inputData?: Partial<Prisma.SubscriptionPeriodCreateInput & TTransients>): PromiseLike<Prisma.SubscriptionPeriodCreateInput>;
    buildCreateInput(inputData?: Partial<Prisma.SubscriptionPeriodCreateInput & TTransients>): PromiseLike<Prisma.SubscriptionPeriodCreateInput>;
    buildList(list: readonly Partial<Prisma.SubscriptionPeriodCreateInput & TTransients>[]): PromiseLike<Prisma.SubscriptionPeriodCreateInput[]>;
    buildList(count: number, item?: Partial<Prisma.SubscriptionPeriodCreateInput & TTransients>): PromiseLike<Prisma.SubscriptionPeriodCreateInput[]>;
    pickForConnect(inputData: SubscriptionPeriod): Pick<SubscriptionPeriod, "id">;
    create(inputData?: Partial<Prisma.SubscriptionPeriodCreateInput & TTransients>): PromiseLike<SubscriptionPeriod>;
    createList(list: readonly Partial<Prisma.SubscriptionPeriodCreateInput & TTransients>[]): PromiseLike<SubscriptionPeriod[]>;
    createList(count: number, item?: Partial<Prisma.SubscriptionPeriodCreateInput & TTransients>): PromiseLike<SubscriptionPeriod[]>;
    createForConnect(inputData?: Partial<Prisma.SubscriptionPeriodCreateInput & TTransients>): PromiseLike<Pick<SubscriptionPeriod, "id">>;
}
export interface SubscriptionPeriodFactoryInterface<TTransients extends Record<string, unknown> = Record<string, unknown>, TTraitName extends TraitName = TraitName> extends SubscriptionPeriodFactoryInterfaceWithoutTraits<TTransients> {
    use(name: TTraitName, ...names: readonly TTraitName[]): SubscriptionPeriodFactoryInterfaceWithoutTraits<TTransients>;
}
interface SubscriptionPeriodFactoryBuilder {
    <TOptions extends SubscriptionPeriodFactoryDefineOptions>(options: TOptions): SubscriptionPeriodFactoryInterface<{}, SubscriptionPeriodTraitKeys<TOptions>>;
    withTransientFields: <TTransients extends SubscriptionPeriodTransientFields>(defaultTransientFieldValues: TTransients) => <TOptions extends SubscriptionPeriodFactoryDefineOptions<TTransients>>(options: TOptions) => SubscriptionPeriodFactoryInterface<TTransients, SubscriptionPeriodTraitKeys<TOptions>>;
}
/**
 * Define factory for {@link SubscriptionPeriod} model.
 *
 * @param options
 * @returns factory {@link SubscriptionPeriodFactoryInterface}
 */
export declare const defineSubscriptionPeriodFactory: SubscriptionPeriodFactoryBuilder;
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
type SubscriptionDeactivationTransientFields = Record<string, unknown> & Partial<Record<keyof SubscriptionDeactivationFactoryDefineInput, never>>;
type SubscriptionDeactivationFactoryTrait<TTransients extends Record<string, unknown>> = {
    data?: Resolver<Partial<SubscriptionDeactivationFactoryDefineInput>, BuildDataOptions<TTransients>>;
} & CallbackDefineOptions<SubscriptionDeactivation, Prisma.SubscriptionDeactivationCreateInput, TTransients>;
type SubscriptionDeactivationFactoryDefineOptions<TTransients extends Record<string, unknown> = Record<string, unknown>> = {
    defaultData: Resolver<SubscriptionDeactivationFactoryDefineInput, BuildDataOptions<TTransients>>;
    traits?: {
        [traitName: string | symbol]: SubscriptionDeactivationFactoryTrait<TTransients>;
    };
} & CallbackDefineOptions<SubscriptionDeactivation, Prisma.SubscriptionDeactivationCreateInput, TTransients>;
type SubscriptionDeactivationTraitKeys<TOptions extends SubscriptionDeactivationFactoryDefineOptions<any>> = Exclude<keyof TOptions["traits"], number>;
export interface SubscriptionDeactivationFactoryInterfaceWithoutTraits<TTransients extends Record<string, unknown>> {
    readonly _factoryFor: "SubscriptionDeactivation";
    build(inputData?: Partial<Prisma.SubscriptionDeactivationCreateInput & TTransients>): PromiseLike<Prisma.SubscriptionDeactivationCreateInput>;
    buildCreateInput(inputData?: Partial<Prisma.SubscriptionDeactivationCreateInput & TTransients>): PromiseLike<Prisma.SubscriptionDeactivationCreateInput>;
    buildList(list: readonly Partial<Prisma.SubscriptionDeactivationCreateInput & TTransients>[]): PromiseLike<Prisma.SubscriptionDeactivationCreateInput[]>;
    buildList(count: number, item?: Partial<Prisma.SubscriptionDeactivationCreateInput & TTransients>): PromiseLike<Prisma.SubscriptionDeactivationCreateInput[]>;
    pickForConnect(inputData: SubscriptionDeactivation): Pick<SubscriptionDeactivation, "id">;
    create(inputData?: Partial<Prisma.SubscriptionDeactivationCreateInput & TTransients>): PromiseLike<SubscriptionDeactivation>;
    createList(list: readonly Partial<Prisma.SubscriptionDeactivationCreateInput & TTransients>[]): PromiseLike<SubscriptionDeactivation[]>;
    createList(count: number, item?: Partial<Prisma.SubscriptionDeactivationCreateInput & TTransients>): PromiseLike<SubscriptionDeactivation[]>;
    createForConnect(inputData?: Partial<Prisma.SubscriptionDeactivationCreateInput & TTransients>): PromiseLike<Pick<SubscriptionDeactivation, "id">>;
}
export interface SubscriptionDeactivationFactoryInterface<TTransients extends Record<string, unknown> = Record<string, unknown>, TTraitName extends TraitName = TraitName> extends SubscriptionDeactivationFactoryInterfaceWithoutTraits<TTransients> {
    use(name: TTraitName, ...names: readonly TTraitName[]): SubscriptionDeactivationFactoryInterfaceWithoutTraits<TTransients>;
}
interface SubscriptionDeactivationFactoryBuilder {
    <TOptions extends SubscriptionDeactivationFactoryDefineOptions>(options: TOptions): SubscriptionDeactivationFactoryInterface<{}, SubscriptionDeactivationTraitKeys<TOptions>>;
    withTransientFields: <TTransients extends SubscriptionDeactivationTransientFields>(defaultTransientFieldValues: TTransients) => <TOptions extends SubscriptionDeactivationFactoryDefineOptions<TTransients>>(options: TOptions) => SubscriptionDeactivationFactoryInterface<TTransients, SubscriptionDeactivationTraitKeys<TOptions>>;
}
/**
 * Define factory for {@link SubscriptionDeactivation} model.
 *
 * @param options
 * @returns factory {@link SubscriptionDeactivationFactoryInterface}
 */
export declare const defineSubscriptionDeactivationFactory: SubscriptionDeactivationFactoryBuilder;
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
    currency?: Currency;
    periods?: Prisma.SubscriptionPeriodCreateNestedManyWithoutSubscriptionInput;
    properties?: Prisma.MetadataPropertyCreateNestedManyWithoutSubscriptionInput;
    deactivation?: SubscriptiondeactivationFactory | Prisma.SubscriptionDeactivationCreateNestedOneWithoutSubscriptionInput;
    paymentMethod: SubscriptionpaymentMethodFactory | Prisma.PaymentMethodCreateNestedOneWithoutSubscriptionInput;
    memberPlan: SubscriptionmemberPlanFactory | Prisma.MemberPlanCreateNestedOneWithoutSubscriptionInput;
    user: SubscriptionuserFactory | Prisma.UserCreateNestedOneWithoutSubscriptionInput;
    invoices?: Prisma.InvoiceCreateNestedManyWithoutSubscriptionInput;
};
type SubscriptionTransientFields = Record<string, unknown> & Partial<Record<keyof SubscriptionFactoryDefineInput, never>>;
type SubscriptionFactoryTrait<TTransients extends Record<string, unknown>> = {
    data?: Resolver<Partial<SubscriptionFactoryDefineInput>, BuildDataOptions<TTransients>>;
} & CallbackDefineOptions<Subscription, Prisma.SubscriptionCreateInput, TTransients>;
type SubscriptionFactoryDefineOptions<TTransients extends Record<string, unknown> = Record<string, unknown>> = {
    defaultData: Resolver<SubscriptionFactoryDefineInput, BuildDataOptions<TTransients>>;
    traits?: {
        [traitName: string | symbol]: SubscriptionFactoryTrait<TTransients>;
    };
} & CallbackDefineOptions<Subscription, Prisma.SubscriptionCreateInput, TTransients>;
type SubscriptionTraitKeys<TOptions extends SubscriptionFactoryDefineOptions<any>> = Exclude<keyof TOptions["traits"], number>;
export interface SubscriptionFactoryInterfaceWithoutTraits<TTransients extends Record<string, unknown>> {
    readonly _factoryFor: "Subscription";
    build(inputData?: Partial<Prisma.SubscriptionCreateInput & TTransients>): PromiseLike<Prisma.SubscriptionCreateInput>;
    buildCreateInput(inputData?: Partial<Prisma.SubscriptionCreateInput & TTransients>): PromiseLike<Prisma.SubscriptionCreateInput>;
    buildList(list: readonly Partial<Prisma.SubscriptionCreateInput & TTransients>[]): PromiseLike<Prisma.SubscriptionCreateInput[]>;
    buildList(count: number, item?: Partial<Prisma.SubscriptionCreateInput & TTransients>): PromiseLike<Prisma.SubscriptionCreateInput[]>;
    pickForConnect(inputData: Subscription): Pick<Subscription, "id">;
    create(inputData?: Partial<Prisma.SubscriptionCreateInput & TTransients>): PromiseLike<Subscription>;
    createList(list: readonly Partial<Prisma.SubscriptionCreateInput & TTransients>[]): PromiseLike<Subscription[]>;
    createList(count: number, item?: Partial<Prisma.SubscriptionCreateInput & TTransients>): PromiseLike<Subscription[]>;
    createForConnect(inputData?: Partial<Prisma.SubscriptionCreateInput & TTransients>): PromiseLike<Pick<Subscription, "id">>;
}
export interface SubscriptionFactoryInterface<TTransients extends Record<string, unknown> = Record<string, unknown>, TTraitName extends TraitName = TraitName> extends SubscriptionFactoryInterfaceWithoutTraits<TTransients> {
    use(name: TTraitName, ...names: readonly TTraitName[]): SubscriptionFactoryInterfaceWithoutTraits<TTransients>;
}
interface SubscriptionFactoryBuilder {
    <TOptions extends SubscriptionFactoryDefineOptions>(options: TOptions): SubscriptionFactoryInterface<{}, SubscriptionTraitKeys<TOptions>>;
    withTransientFields: <TTransients extends SubscriptionTransientFields>(defaultTransientFieldValues: TTransients) => <TOptions extends SubscriptionFactoryDefineOptions<TTransients>>(options: TOptions) => SubscriptionFactoryInterface<TTransients, SubscriptionTraitKeys<TOptions>>;
}
/**
 * Define factory for {@link Subscription} model.
 *
 * @param options
 * @returns factory {@link SubscriptionFactoryInterface}
 */
export declare const defineSubscriptionFactory: SubscriptionFactoryBuilder;
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
type UserAddressTransientFields = Record<string, unknown> & Partial<Record<keyof UserAddressFactoryDefineInput, never>>;
type UserAddressFactoryTrait<TTransients extends Record<string, unknown>> = {
    data?: Resolver<Partial<UserAddressFactoryDefineInput>, BuildDataOptions<TTransients>>;
} & CallbackDefineOptions<UserAddress, Prisma.UserAddressCreateInput, TTransients>;
type UserAddressFactoryDefineOptions<TTransients extends Record<string, unknown> = Record<string, unknown>> = {
    defaultData: Resolver<UserAddressFactoryDefineInput, BuildDataOptions<TTransients>>;
    traits?: {
        [traitName: string | symbol]: UserAddressFactoryTrait<TTransients>;
    };
} & CallbackDefineOptions<UserAddress, Prisma.UserAddressCreateInput, TTransients>;
type UserAddressTraitKeys<TOptions extends UserAddressFactoryDefineOptions<any>> = Exclude<keyof TOptions["traits"], number>;
export interface UserAddressFactoryInterfaceWithoutTraits<TTransients extends Record<string, unknown>> {
    readonly _factoryFor: "UserAddress";
    build(inputData?: Partial<Prisma.UserAddressCreateInput & TTransients>): PromiseLike<Prisma.UserAddressCreateInput>;
    buildCreateInput(inputData?: Partial<Prisma.UserAddressCreateInput & TTransients>): PromiseLike<Prisma.UserAddressCreateInput>;
    buildList(list: readonly Partial<Prisma.UserAddressCreateInput & TTransients>[]): PromiseLike<Prisma.UserAddressCreateInput[]>;
    buildList(count: number, item?: Partial<Prisma.UserAddressCreateInput & TTransients>): PromiseLike<Prisma.UserAddressCreateInput[]>;
    pickForConnect(inputData: UserAddress): Pick<UserAddress, "userId">;
    create(inputData?: Partial<Prisma.UserAddressCreateInput & TTransients>): PromiseLike<UserAddress>;
    createList(list: readonly Partial<Prisma.UserAddressCreateInput & TTransients>[]): PromiseLike<UserAddress[]>;
    createList(count: number, item?: Partial<Prisma.UserAddressCreateInput & TTransients>): PromiseLike<UserAddress[]>;
    createForConnect(inputData?: Partial<Prisma.UserAddressCreateInput & TTransients>): PromiseLike<Pick<UserAddress, "userId">>;
}
export interface UserAddressFactoryInterface<TTransients extends Record<string, unknown> = Record<string, unknown>, TTraitName extends TraitName = TraitName> extends UserAddressFactoryInterfaceWithoutTraits<TTransients> {
    use(name: TTraitName, ...names: readonly TTraitName[]): UserAddressFactoryInterfaceWithoutTraits<TTransients>;
}
interface UserAddressFactoryBuilder {
    <TOptions extends UserAddressFactoryDefineOptions>(options: TOptions): UserAddressFactoryInterface<{}, UserAddressTraitKeys<TOptions>>;
    withTransientFields: <TTransients extends UserAddressTransientFields>(defaultTransientFieldValues: TTransients) => <TOptions extends UserAddressFactoryDefineOptions<TTransients>>(options: TOptions) => UserAddressFactoryInterface<TTransients, UserAddressTraitKeys<TOptions>>;
}
/**
 * Define factory for {@link UserAddress} model.
 *
 * @param options
 * @returns factory {@link UserAddressFactoryInterface}
 */
export declare const defineUserAddressFactory: UserAddressFactoryBuilder;
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
type UserOAuth2AccountTransientFields = Record<string, unknown> & Partial<Record<keyof UserOAuth2AccountFactoryDefineInput, never>>;
type UserOAuth2AccountFactoryTrait<TTransients extends Record<string, unknown>> = {
    data?: Resolver<Partial<UserOAuth2AccountFactoryDefineInput>, BuildDataOptions<TTransients>>;
} & CallbackDefineOptions<UserOAuth2Account, Prisma.UserOAuth2AccountCreateInput, TTransients>;
type UserOAuth2AccountFactoryDefineOptions<TTransients extends Record<string, unknown> = Record<string, unknown>> = {
    defaultData?: Resolver<UserOAuth2AccountFactoryDefineInput, BuildDataOptions<TTransients>>;
    traits?: {
        [traitName: TraitName]: UserOAuth2AccountFactoryTrait<TTransients>;
    };
} & CallbackDefineOptions<UserOAuth2Account, Prisma.UserOAuth2AccountCreateInput, TTransients>;
type UserOAuth2AccountTraitKeys<TOptions extends UserOAuth2AccountFactoryDefineOptions<any>> = Exclude<keyof TOptions["traits"], number>;
export interface UserOAuth2AccountFactoryInterfaceWithoutTraits<TTransients extends Record<string, unknown>> {
    readonly _factoryFor: "UserOAuth2Account";
    build(inputData?: Partial<Prisma.UserOAuth2AccountCreateInput & TTransients>): PromiseLike<Prisma.UserOAuth2AccountCreateInput>;
    buildCreateInput(inputData?: Partial<Prisma.UserOAuth2AccountCreateInput & TTransients>): PromiseLike<Prisma.UserOAuth2AccountCreateInput>;
    buildList(list: readonly Partial<Prisma.UserOAuth2AccountCreateInput & TTransients>[]): PromiseLike<Prisma.UserOAuth2AccountCreateInput[]>;
    buildList(count: number, item?: Partial<Prisma.UserOAuth2AccountCreateInput & TTransients>): PromiseLike<Prisma.UserOAuth2AccountCreateInput[]>;
    pickForConnect(inputData: UserOAuth2Account): Pick<UserOAuth2Account, "id">;
    create(inputData?: Partial<Prisma.UserOAuth2AccountCreateInput & TTransients>): PromiseLike<UserOAuth2Account>;
    createList(list: readonly Partial<Prisma.UserOAuth2AccountCreateInput & TTransients>[]): PromiseLike<UserOAuth2Account[]>;
    createList(count: number, item?: Partial<Prisma.UserOAuth2AccountCreateInput & TTransients>): PromiseLike<UserOAuth2Account[]>;
    createForConnect(inputData?: Partial<Prisma.UserOAuth2AccountCreateInput & TTransients>): PromiseLike<Pick<UserOAuth2Account, "id">>;
}
export interface UserOAuth2AccountFactoryInterface<TTransients extends Record<string, unknown> = Record<string, unknown>, TTraitName extends TraitName = TraitName> extends UserOAuth2AccountFactoryInterfaceWithoutTraits<TTransients> {
    use(name: TTraitName, ...names: readonly TTraitName[]): UserOAuth2AccountFactoryInterfaceWithoutTraits<TTransients>;
}
interface UserOAuth2AccountFactoryBuilder {
    <TOptions extends UserOAuth2AccountFactoryDefineOptions>(options?: TOptions): UserOAuth2AccountFactoryInterface<{}, UserOAuth2AccountTraitKeys<TOptions>>;
    withTransientFields: <TTransients extends UserOAuth2AccountTransientFields>(defaultTransientFieldValues: TTransients) => <TOptions extends UserOAuth2AccountFactoryDefineOptions<TTransients>>(options?: TOptions) => UserOAuth2AccountFactoryInterface<TTransients, UserOAuth2AccountTraitKeys<TOptions>>;
}
/**
 * Define factory for {@link UserOAuth2Account} model.
 *
 * @param options
 * @returns factory {@link UserOAuth2AccountFactoryInterface}
 */
export declare const defineUserOAuth2AccountFactory: UserOAuth2AccountFactoryBuilder;
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
type PaymentProviderCustomerTransientFields = Record<string, unknown> & Partial<Record<keyof PaymentProviderCustomerFactoryDefineInput, never>>;
type PaymentProviderCustomerFactoryTrait<TTransients extends Record<string, unknown>> = {
    data?: Resolver<Partial<PaymentProviderCustomerFactoryDefineInput>, BuildDataOptions<TTransients>>;
} & CallbackDefineOptions<PaymentProviderCustomer, Prisma.PaymentProviderCustomerCreateInput, TTransients>;
type PaymentProviderCustomerFactoryDefineOptions<TTransients extends Record<string, unknown> = Record<string, unknown>> = {
    defaultData?: Resolver<PaymentProviderCustomerFactoryDefineInput, BuildDataOptions<TTransients>>;
    traits?: {
        [traitName: TraitName]: PaymentProviderCustomerFactoryTrait<TTransients>;
    };
} & CallbackDefineOptions<PaymentProviderCustomer, Prisma.PaymentProviderCustomerCreateInput, TTransients>;
type PaymentProviderCustomerTraitKeys<TOptions extends PaymentProviderCustomerFactoryDefineOptions<any>> = Exclude<keyof TOptions["traits"], number>;
export interface PaymentProviderCustomerFactoryInterfaceWithoutTraits<TTransients extends Record<string, unknown>> {
    readonly _factoryFor: "PaymentProviderCustomer";
    build(inputData?: Partial<Prisma.PaymentProviderCustomerCreateInput & TTransients>): PromiseLike<Prisma.PaymentProviderCustomerCreateInput>;
    buildCreateInput(inputData?: Partial<Prisma.PaymentProviderCustomerCreateInput & TTransients>): PromiseLike<Prisma.PaymentProviderCustomerCreateInput>;
    buildList(list: readonly Partial<Prisma.PaymentProviderCustomerCreateInput & TTransients>[]): PromiseLike<Prisma.PaymentProviderCustomerCreateInput[]>;
    buildList(count: number, item?: Partial<Prisma.PaymentProviderCustomerCreateInput & TTransients>): PromiseLike<Prisma.PaymentProviderCustomerCreateInput[]>;
    pickForConnect(inputData: PaymentProviderCustomer): Pick<PaymentProviderCustomer, "id">;
    create(inputData?: Partial<Prisma.PaymentProviderCustomerCreateInput & TTransients>): PromiseLike<PaymentProviderCustomer>;
    createList(list: readonly Partial<Prisma.PaymentProviderCustomerCreateInput & TTransients>[]): PromiseLike<PaymentProviderCustomer[]>;
    createList(count: number, item?: Partial<Prisma.PaymentProviderCustomerCreateInput & TTransients>): PromiseLike<PaymentProviderCustomer[]>;
    createForConnect(inputData?: Partial<Prisma.PaymentProviderCustomerCreateInput & TTransients>): PromiseLike<Pick<PaymentProviderCustomer, "id">>;
}
export interface PaymentProviderCustomerFactoryInterface<TTransients extends Record<string, unknown> = Record<string, unknown>, TTraitName extends TraitName = TraitName> extends PaymentProviderCustomerFactoryInterfaceWithoutTraits<TTransients> {
    use(name: TTraitName, ...names: readonly TTraitName[]): PaymentProviderCustomerFactoryInterfaceWithoutTraits<TTransients>;
}
interface PaymentProviderCustomerFactoryBuilder {
    <TOptions extends PaymentProviderCustomerFactoryDefineOptions>(options?: TOptions): PaymentProviderCustomerFactoryInterface<{}, PaymentProviderCustomerTraitKeys<TOptions>>;
    withTransientFields: <TTransients extends PaymentProviderCustomerTransientFields>(defaultTransientFieldValues: TTransients) => <TOptions extends PaymentProviderCustomerFactoryDefineOptions<TTransients>>(options?: TOptions) => PaymentProviderCustomerFactoryInterface<TTransients, PaymentProviderCustomerTraitKeys<TOptions>>;
}
/**
 * Define factory for {@link PaymentProviderCustomer} model.
 *
 * @param options
 * @returns factory {@link PaymentProviderCustomerFactoryInterface}
 */
export declare const definePaymentProviderCustomerFactory: PaymentProviderCustomerFactoryBuilder;
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
    birthday?: Date | null;
    email?: string;
    emailVerifiedAt?: Date | null;
    name?: string;
    firstName?: string | null;
    flair?: string | null;
    password?: string;
    active?: boolean;
    lastLogin?: Date | null;
    roleIDs?: Prisma.UserCreateroleIDsInput | Array<string>;
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
type UserTransientFields = Record<string, unknown> & Partial<Record<keyof UserFactoryDefineInput, never>>;
type UserFactoryTrait<TTransients extends Record<string, unknown>> = {
    data?: Resolver<Partial<UserFactoryDefineInput>, BuildDataOptions<TTransients>>;
} & CallbackDefineOptions<User, Prisma.UserCreateInput, TTransients>;
type UserFactoryDefineOptions<TTransients extends Record<string, unknown> = Record<string, unknown>> = {
    defaultData?: Resolver<UserFactoryDefineInput, BuildDataOptions<TTransients>>;
    traits?: {
        [traitName: TraitName]: UserFactoryTrait<TTransients>;
    };
} & CallbackDefineOptions<User, Prisma.UserCreateInput, TTransients>;
type UserTraitKeys<TOptions extends UserFactoryDefineOptions<any>> = Exclude<keyof TOptions["traits"], number>;
export interface UserFactoryInterfaceWithoutTraits<TTransients extends Record<string, unknown>> {
    readonly _factoryFor: "User";
    build(inputData?: Partial<Prisma.UserCreateInput & TTransients>): PromiseLike<Prisma.UserCreateInput>;
    buildCreateInput(inputData?: Partial<Prisma.UserCreateInput & TTransients>): PromiseLike<Prisma.UserCreateInput>;
    buildList(list: readonly Partial<Prisma.UserCreateInput & TTransients>[]): PromiseLike<Prisma.UserCreateInput[]>;
    buildList(count: number, item?: Partial<Prisma.UserCreateInput & TTransients>): PromiseLike<Prisma.UserCreateInput[]>;
    pickForConnect(inputData: User): Pick<User, "id">;
    create(inputData?: Partial<Prisma.UserCreateInput & TTransients>): PromiseLike<User>;
    createList(list: readonly Partial<Prisma.UserCreateInput & TTransients>[]): PromiseLike<User[]>;
    createList(count: number, item?: Partial<Prisma.UserCreateInput & TTransients>): PromiseLike<User[]>;
    createForConnect(inputData?: Partial<Prisma.UserCreateInput & TTransients>): PromiseLike<Pick<User, "id">>;
}
export interface UserFactoryInterface<TTransients extends Record<string, unknown> = Record<string, unknown>, TTraitName extends TraitName = TraitName> extends UserFactoryInterfaceWithoutTraits<TTransients> {
    use(name: TTraitName, ...names: readonly TTraitName[]): UserFactoryInterfaceWithoutTraits<TTransients>;
}
interface UserFactoryBuilder {
    <TOptions extends UserFactoryDefineOptions>(options?: TOptions): UserFactoryInterface<{}, UserTraitKeys<TOptions>>;
    withTransientFields: <TTransients extends UserTransientFields>(defaultTransientFieldValues: TTransients) => <TOptions extends UserFactoryDefineOptions<TTransients>>(options?: TOptions) => UserFactoryInterface<TTransients, UserTraitKeys<TOptions>>;
}
/**
 * Define factory for {@link User} model.
 *
 * @param options
 * @returns factory {@link UserFactoryInterface}
 */
export declare const defineUserFactory: UserFactoryBuilder;
type UserRoleFactoryDefineInput = {
    id?: string;
    createdAt?: Date;
    modifiedAt?: Date;
    description?: string | null;
    name?: string;
    permissionIDs?: Prisma.UserRoleCreatepermissionIDsInput | Array<string>;
    systemRole?: boolean;
};
type UserRoleTransientFields = Record<string, unknown> & Partial<Record<keyof UserRoleFactoryDefineInput, never>>;
type UserRoleFactoryTrait<TTransients extends Record<string, unknown>> = {
    data?: Resolver<Partial<UserRoleFactoryDefineInput>, BuildDataOptions<TTransients>>;
} & CallbackDefineOptions<UserRole, Prisma.UserRoleCreateInput, TTransients>;
type UserRoleFactoryDefineOptions<TTransients extends Record<string, unknown> = Record<string, unknown>> = {
    defaultData?: Resolver<UserRoleFactoryDefineInput, BuildDataOptions<TTransients>>;
    traits?: {
        [traitName: TraitName]: UserRoleFactoryTrait<TTransients>;
    };
} & CallbackDefineOptions<UserRole, Prisma.UserRoleCreateInput, TTransients>;
type UserRoleTraitKeys<TOptions extends UserRoleFactoryDefineOptions<any>> = Exclude<keyof TOptions["traits"], number>;
export interface UserRoleFactoryInterfaceWithoutTraits<TTransients extends Record<string, unknown>> {
    readonly _factoryFor: "UserRole";
    build(inputData?: Partial<Prisma.UserRoleCreateInput & TTransients>): PromiseLike<Prisma.UserRoleCreateInput>;
    buildCreateInput(inputData?: Partial<Prisma.UserRoleCreateInput & TTransients>): PromiseLike<Prisma.UserRoleCreateInput>;
    buildList(list: readonly Partial<Prisma.UserRoleCreateInput & TTransients>[]): PromiseLike<Prisma.UserRoleCreateInput[]>;
    buildList(count: number, item?: Partial<Prisma.UserRoleCreateInput & TTransients>): PromiseLike<Prisma.UserRoleCreateInput[]>;
    pickForConnect(inputData: UserRole): Pick<UserRole, "id">;
    create(inputData?: Partial<Prisma.UserRoleCreateInput & TTransients>): PromiseLike<UserRole>;
    createList(list: readonly Partial<Prisma.UserRoleCreateInput & TTransients>[]): PromiseLike<UserRole[]>;
    createList(count: number, item?: Partial<Prisma.UserRoleCreateInput & TTransients>): PromiseLike<UserRole[]>;
    createForConnect(inputData?: Partial<Prisma.UserRoleCreateInput & TTransients>): PromiseLike<Pick<UserRole, "id">>;
}
export interface UserRoleFactoryInterface<TTransients extends Record<string, unknown> = Record<string, unknown>, TTraitName extends TraitName = TraitName> extends UserRoleFactoryInterfaceWithoutTraits<TTransients> {
    use(name: TTraitName, ...names: readonly TTraitName[]): UserRoleFactoryInterfaceWithoutTraits<TTransients>;
}
interface UserRoleFactoryBuilder {
    <TOptions extends UserRoleFactoryDefineOptions>(options?: TOptions): UserRoleFactoryInterface<{}, UserRoleTraitKeys<TOptions>>;
    withTransientFields: <TTransients extends UserRoleTransientFields>(defaultTransientFieldValues: TTransients) => <TOptions extends UserRoleFactoryDefineOptions<TTransients>>(options?: TOptions) => UserRoleFactoryInterface<TTransients, UserRoleTraitKeys<TOptions>>;
}
/**
 * Define factory for {@link UserRole} model.
 *
 * @param options
 * @returns factory {@link UserRoleFactoryInterface}
 */
export declare const defineUserRoleFactory: UserRoleFactoryBuilder;
type SettingFactoryDefineInput = {
    id?: string;
    createdAt?: Date;
    modifiedAt?: Date;
    name?: string;
    value?: Prisma.JsonNullValueInput | Prisma.InputJsonValue;
    settingRestriction?: Prisma.JsonNullValueInput | Prisma.InputJsonValue;
};
type SettingTransientFields = Record<string, unknown> & Partial<Record<keyof SettingFactoryDefineInput, never>>;
type SettingFactoryTrait<TTransients extends Record<string, unknown>> = {
    data?: Resolver<Partial<SettingFactoryDefineInput>, BuildDataOptions<TTransients>>;
} & CallbackDefineOptions<Setting, Prisma.SettingCreateInput, TTransients>;
type SettingFactoryDefineOptions<TTransients extends Record<string, unknown> = Record<string, unknown>> = {
    defaultData?: Resolver<SettingFactoryDefineInput, BuildDataOptions<TTransients>>;
    traits?: {
        [traitName: TraitName]: SettingFactoryTrait<TTransients>;
    };
} & CallbackDefineOptions<Setting, Prisma.SettingCreateInput, TTransients>;
type SettingTraitKeys<TOptions extends SettingFactoryDefineOptions<any>> = Exclude<keyof TOptions["traits"], number>;
export interface SettingFactoryInterfaceWithoutTraits<TTransients extends Record<string, unknown>> {
    readonly _factoryFor: "Setting";
    build(inputData?: Partial<Prisma.SettingCreateInput & TTransients>): PromiseLike<Prisma.SettingCreateInput>;
    buildCreateInput(inputData?: Partial<Prisma.SettingCreateInput & TTransients>): PromiseLike<Prisma.SettingCreateInput>;
    buildList(list: readonly Partial<Prisma.SettingCreateInput & TTransients>[]): PromiseLike<Prisma.SettingCreateInput[]>;
    buildList(count: number, item?: Partial<Prisma.SettingCreateInput & TTransients>): PromiseLike<Prisma.SettingCreateInput[]>;
    pickForConnect(inputData: Setting): Pick<Setting, "id">;
    create(inputData?: Partial<Prisma.SettingCreateInput & TTransients>): PromiseLike<Setting>;
    createList(list: readonly Partial<Prisma.SettingCreateInput & TTransients>[]): PromiseLike<Setting[]>;
    createList(count: number, item?: Partial<Prisma.SettingCreateInput & TTransients>): PromiseLike<Setting[]>;
    createForConnect(inputData?: Partial<Prisma.SettingCreateInput & TTransients>): PromiseLike<Pick<Setting, "id">>;
}
export interface SettingFactoryInterface<TTransients extends Record<string, unknown> = Record<string, unknown>, TTraitName extends TraitName = TraitName> extends SettingFactoryInterfaceWithoutTraits<TTransients> {
    use(name: TTraitName, ...names: readonly TTraitName[]): SettingFactoryInterfaceWithoutTraits<TTransients>;
}
interface SettingFactoryBuilder {
    <TOptions extends SettingFactoryDefineOptions>(options?: TOptions): SettingFactoryInterface<{}, SettingTraitKeys<TOptions>>;
    withTransientFields: <TTransients extends SettingTransientFields>(defaultTransientFieldValues: TTransients) => <TOptions extends SettingFactoryDefineOptions<TTransients>>(options?: TOptions) => SettingFactoryInterface<TTransients, SettingTraitKeys<TOptions>>;
}
/**
 * Define factory for {@link Setting} model.
 *
 * @param options
 * @returns factory {@link SettingFactoryInterface}
 */
export declare const defineSettingFactory: SettingFactoryBuilder;
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
type TagTransientFields = Record<string, unknown> & Partial<Record<keyof TagFactoryDefineInput, never>>;
type TagFactoryTrait<TTransients extends Record<string, unknown>> = {
    data?: Resolver<Partial<TagFactoryDefineInput>, BuildDataOptions<TTransients>>;
} & CallbackDefineOptions<Tag, Prisma.TagCreateInput, TTransients>;
type TagFactoryDefineOptions<TTransients extends Record<string, unknown> = Record<string, unknown>> = {
    defaultData?: Resolver<TagFactoryDefineInput, BuildDataOptions<TTransients>>;
    traits?: {
        [traitName: TraitName]: TagFactoryTrait<TTransients>;
    };
} & CallbackDefineOptions<Tag, Prisma.TagCreateInput, TTransients>;
type TagTraitKeys<TOptions extends TagFactoryDefineOptions<any>> = Exclude<keyof TOptions["traits"], number>;
export interface TagFactoryInterfaceWithoutTraits<TTransients extends Record<string, unknown>> {
    readonly _factoryFor: "Tag";
    build(inputData?: Partial<Prisma.TagCreateInput & TTransients>): PromiseLike<Prisma.TagCreateInput>;
    buildCreateInput(inputData?: Partial<Prisma.TagCreateInput & TTransients>): PromiseLike<Prisma.TagCreateInput>;
    buildList(list: readonly Partial<Prisma.TagCreateInput & TTransients>[]): PromiseLike<Prisma.TagCreateInput[]>;
    buildList(count: number, item?: Partial<Prisma.TagCreateInput & TTransients>): PromiseLike<Prisma.TagCreateInput[]>;
    pickForConnect(inputData: Tag): Pick<Tag, "id">;
    create(inputData?: Partial<Prisma.TagCreateInput & TTransients>): PromiseLike<Tag>;
    createList(list: readonly Partial<Prisma.TagCreateInput & TTransients>[]): PromiseLike<Tag[]>;
    createList(count: number, item?: Partial<Prisma.TagCreateInput & TTransients>): PromiseLike<Tag[]>;
    createForConnect(inputData?: Partial<Prisma.TagCreateInput & TTransients>): PromiseLike<Pick<Tag, "id">>;
}
export interface TagFactoryInterface<TTransients extends Record<string, unknown> = Record<string, unknown>, TTraitName extends TraitName = TraitName> extends TagFactoryInterfaceWithoutTraits<TTransients> {
    use(name: TTraitName, ...names: readonly TTraitName[]): TagFactoryInterfaceWithoutTraits<TTransients>;
}
interface TagFactoryBuilder {
    <TOptions extends TagFactoryDefineOptions>(options?: TOptions): TagFactoryInterface<{}, TagTraitKeys<TOptions>>;
    withTransientFields: <TTransients extends TagTransientFields>(defaultTransientFieldValues: TTransients) => <TOptions extends TagFactoryDefineOptions<TTransients>>(options?: TOptions) => TagFactoryInterface<TTransients, TagTraitKeys<TOptions>>;
}
/**
 * Define factory for {@link Tag} model.
 *
 * @param options
 * @returns factory {@link TagFactoryInterface}
 */
export declare const defineTagFactory: TagFactoryBuilder;
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
type PollTransientFields = Record<string, unknown> & Partial<Record<keyof PollFactoryDefineInput, never>>;
type PollFactoryTrait<TTransients extends Record<string, unknown>> = {
    data?: Resolver<Partial<PollFactoryDefineInput>, BuildDataOptions<TTransients>>;
} & CallbackDefineOptions<Poll, Prisma.PollCreateInput, TTransients>;
type PollFactoryDefineOptions<TTransients extends Record<string, unknown> = Record<string, unknown>> = {
    defaultData?: Resolver<PollFactoryDefineInput, BuildDataOptions<TTransients>>;
    traits?: {
        [traitName: TraitName]: PollFactoryTrait<TTransients>;
    };
} & CallbackDefineOptions<Poll, Prisma.PollCreateInput, TTransients>;
type PollTraitKeys<TOptions extends PollFactoryDefineOptions<any>> = Exclude<keyof TOptions["traits"], number>;
export interface PollFactoryInterfaceWithoutTraits<TTransients extends Record<string, unknown>> {
    readonly _factoryFor: "Poll";
    build(inputData?: Partial<Prisma.PollCreateInput & TTransients>): PromiseLike<Prisma.PollCreateInput>;
    buildCreateInput(inputData?: Partial<Prisma.PollCreateInput & TTransients>): PromiseLike<Prisma.PollCreateInput>;
    buildList(list: readonly Partial<Prisma.PollCreateInput & TTransients>[]): PromiseLike<Prisma.PollCreateInput[]>;
    buildList(count: number, item?: Partial<Prisma.PollCreateInput & TTransients>): PromiseLike<Prisma.PollCreateInput[]>;
    pickForConnect(inputData: Poll): Pick<Poll, "id">;
    create(inputData?: Partial<Prisma.PollCreateInput & TTransients>): PromiseLike<Poll>;
    createList(list: readonly Partial<Prisma.PollCreateInput & TTransients>[]): PromiseLike<Poll[]>;
    createList(count: number, item?: Partial<Prisma.PollCreateInput & TTransients>): PromiseLike<Poll[]>;
    createForConnect(inputData?: Partial<Prisma.PollCreateInput & TTransients>): PromiseLike<Pick<Poll, "id">>;
}
export interface PollFactoryInterface<TTransients extends Record<string, unknown> = Record<string, unknown>, TTraitName extends TraitName = TraitName> extends PollFactoryInterfaceWithoutTraits<TTransients> {
    use(name: TTraitName, ...names: readonly TTraitName[]): PollFactoryInterfaceWithoutTraits<TTransients>;
}
interface PollFactoryBuilder {
    <TOptions extends PollFactoryDefineOptions>(options?: TOptions): PollFactoryInterface<{}, PollTraitKeys<TOptions>>;
    withTransientFields: <TTransients extends PollTransientFields>(defaultTransientFieldValues: TTransients) => <TOptions extends PollFactoryDefineOptions<TTransients>>(options?: TOptions) => PollFactoryInterface<TTransients, PollTraitKeys<TOptions>>;
}
/**
 * Define factory for {@link Poll} model.
 *
 * @param options
 * @returns factory {@link PollFactoryInterface}
 */
export declare const definePollFactory: PollFactoryBuilder;
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
type PollAnswerTransientFields = Record<string, unknown> & Partial<Record<keyof PollAnswerFactoryDefineInput, never>>;
type PollAnswerFactoryTrait<TTransients extends Record<string, unknown>> = {
    data?: Resolver<Partial<PollAnswerFactoryDefineInput>, BuildDataOptions<TTransients>>;
} & CallbackDefineOptions<PollAnswer, Prisma.PollAnswerCreateInput, TTransients>;
type PollAnswerFactoryDefineOptions<TTransients extends Record<string, unknown> = Record<string, unknown>> = {
    defaultData: Resolver<PollAnswerFactoryDefineInput, BuildDataOptions<TTransients>>;
    traits?: {
        [traitName: string | symbol]: PollAnswerFactoryTrait<TTransients>;
    };
} & CallbackDefineOptions<PollAnswer, Prisma.PollAnswerCreateInput, TTransients>;
type PollAnswerTraitKeys<TOptions extends PollAnswerFactoryDefineOptions<any>> = Exclude<keyof TOptions["traits"], number>;
export interface PollAnswerFactoryInterfaceWithoutTraits<TTransients extends Record<string, unknown>> {
    readonly _factoryFor: "PollAnswer";
    build(inputData?: Partial<Prisma.PollAnswerCreateInput & TTransients>): PromiseLike<Prisma.PollAnswerCreateInput>;
    buildCreateInput(inputData?: Partial<Prisma.PollAnswerCreateInput & TTransients>): PromiseLike<Prisma.PollAnswerCreateInput>;
    buildList(list: readonly Partial<Prisma.PollAnswerCreateInput & TTransients>[]): PromiseLike<Prisma.PollAnswerCreateInput[]>;
    buildList(count: number, item?: Partial<Prisma.PollAnswerCreateInput & TTransients>): PromiseLike<Prisma.PollAnswerCreateInput[]>;
    pickForConnect(inputData: PollAnswer): Pick<PollAnswer, "id">;
    create(inputData?: Partial<Prisma.PollAnswerCreateInput & TTransients>): PromiseLike<PollAnswer>;
    createList(list: readonly Partial<Prisma.PollAnswerCreateInput & TTransients>[]): PromiseLike<PollAnswer[]>;
    createList(count: number, item?: Partial<Prisma.PollAnswerCreateInput & TTransients>): PromiseLike<PollAnswer[]>;
    createForConnect(inputData?: Partial<Prisma.PollAnswerCreateInput & TTransients>): PromiseLike<Pick<PollAnswer, "id">>;
}
export interface PollAnswerFactoryInterface<TTransients extends Record<string, unknown> = Record<string, unknown>, TTraitName extends TraitName = TraitName> extends PollAnswerFactoryInterfaceWithoutTraits<TTransients> {
    use(name: TTraitName, ...names: readonly TTraitName[]): PollAnswerFactoryInterfaceWithoutTraits<TTransients>;
}
interface PollAnswerFactoryBuilder {
    <TOptions extends PollAnswerFactoryDefineOptions>(options: TOptions): PollAnswerFactoryInterface<{}, PollAnswerTraitKeys<TOptions>>;
    withTransientFields: <TTransients extends PollAnswerTransientFields>(defaultTransientFieldValues: TTransients) => <TOptions extends PollAnswerFactoryDefineOptions<TTransients>>(options: TOptions) => PollAnswerFactoryInterface<TTransients, PollAnswerTraitKeys<TOptions>>;
}
/**
 * Define factory for {@link PollAnswer} model.
 *
 * @param options
 * @returns factory {@link PollAnswerFactoryInterface}
 */
export declare const definePollAnswerFactory: PollAnswerFactoryBuilder;
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
type PollVoteTransientFields = Record<string, unknown> & Partial<Record<keyof PollVoteFactoryDefineInput, never>>;
type PollVoteFactoryTrait<TTransients extends Record<string, unknown>> = {
    data?: Resolver<Partial<PollVoteFactoryDefineInput>, BuildDataOptions<TTransients>>;
} & CallbackDefineOptions<PollVote, Prisma.PollVoteCreateInput, TTransients>;
type PollVoteFactoryDefineOptions<TTransients extends Record<string, unknown> = Record<string, unknown>> = {
    defaultData: Resolver<PollVoteFactoryDefineInput, BuildDataOptions<TTransients>>;
    traits?: {
        [traitName: string | symbol]: PollVoteFactoryTrait<TTransients>;
    };
} & CallbackDefineOptions<PollVote, Prisma.PollVoteCreateInput, TTransients>;
type PollVoteTraitKeys<TOptions extends PollVoteFactoryDefineOptions<any>> = Exclude<keyof TOptions["traits"], number>;
export interface PollVoteFactoryInterfaceWithoutTraits<TTransients extends Record<string, unknown>> {
    readonly _factoryFor: "PollVote";
    build(inputData?: Partial<Prisma.PollVoteCreateInput & TTransients>): PromiseLike<Prisma.PollVoteCreateInput>;
    buildCreateInput(inputData?: Partial<Prisma.PollVoteCreateInput & TTransients>): PromiseLike<Prisma.PollVoteCreateInput>;
    buildList(list: readonly Partial<Prisma.PollVoteCreateInput & TTransients>[]): PromiseLike<Prisma.PollVoteCreateInput[]>;
    buildList(count: number, item?: Partial<Prisma.PollVoteCreateInput & TTransients>): PromiseLike<Prisma.PollVoteCreateInput[]>;
    pickForConnect(inputData: PollVote): Pick<PollVote, "id">;
    create(inputData?: Partial<Prisma.PollVoteCreateInput & TTransients>): PromiseLike<PollVote>;
    createList(list: readonly Partial<Prisma.PollVoteCreateInput & TTransients>[]): PromiseLike<PollVote[]>;
    createList(count: number, item?: Partial<Prisma.PollVoteCreateInput & TTransients>): PromiseLike<PollVote[]>;
    createForConnect(inputData?: Partial<Prisma.PollVoteCreateInput & TTransients>): PromiseLike<Pick<PollVote, "id">>;
}
export interface PollVoteFactoryInterface<TTransients extends Record<string, unknown> = Record<string, unknown>, TTraitName extends TraitName = TraitName> extends PollVoteFactoryInterfaceWithoutTraits<TTransients> {
    use(name: TTraitName, ...names: readonly TTraitName[]): PollVoteFactoryInterfaceWithoutTraits<TTransients>;
}
interface PollVoteFactoryBuilder {
    <TOptions extends PollVoteFactoryDefineOptions>(options: TOptions): PollVoteFactoryInterface<{}, PollVoteTraitKeys<TOptions>>;
    withTransientFields: <TTransients extends PollVoteTransientFields>(defaultTransientFieldValues: TTransients) => <TOptions extends PollVoteFactoryDefineOptions<TTransients>>(options: TOptions) => PollVoteFactoryInterface<TTransients, PollVoteTraitKeys<TOptions>>;
}
/**
 * Define factory for {@link PollVote} model.
 *
 * @param options
 * @returns factory {@link PollVoteFactoryInterface}
 */
export declare const definePollVoteFactory: PollVoteFactoryBuilder;
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
type PollExternalVoteSourceTransientFields = Record<string, unknown> & Partial<Record<keyof PollExternalVoteSourceFactoryDefineInput, never>>;
type PollExternalVoteSourceFactoryTrait<TTransients extends Record<string, unknown>> = {
    data?: Resolver<Partial<PollExternalVoteSourceFactoryDefineInput>, BuildDataOptions<TTransients>>;
} & CallbackDefineOptions<PollExternalVoteSource, Prisma.PollExternalVoteSourceCreateInput, TTransients>;
type PollExternalVoteSourceFactoryDefineOptions<TTransients extends Record<string, unknown> = Record<string, unknown>> = {
    defaultData: Resolver<PollExternalVoteSourceFactoryDefineInput, BuildDataOptions<TTransients>>;
    traits?: {
        [traitName: string | symbol]: PollExternalVoteSourceFactoryTrait<TTransients>;
    };
} & CallbackDefineOptions<PollExternalVoteSource, Prisma.PollExternalVoteSourceCreateInput, TTransients>;
type PollExternalVoteSourceTraitKeys<TOptions extends PollExternalVoteSourceFactoryDefineOptions<any>> = Exclude<keyof TOptions["traits"], number>;
export interface PollExternalVoteSourceFactoryInterfaceWithoutTraits<TTransients extends Record<string, unknown>> {
    readonly _factoryFor: "PollExternalVoteSource";
    build(inputData?: Partial<Prisma.PollExternalVoteSourceCreateInput & TTransients>): PromiseLike<Prisma.PollExternalVoteSourceCreateInput>;
    buildCreateInput(inputData?: Partial<Prisma.PollExternalVoteSourceCreateInput & TTransients>): PromiseLike<Prisma.PollExternalVoteSourceCreateInput>;
    buildList(list: readonly Partial<Prisma.PollExternalVoteSourceCreateInput & TTransients>[]): PromiseLike<Prisma.PollExternalVoteSourceCreateInput[]>;
    buildList(count: number, item?: Partial<Prisma.PollExternalVoteSourceCreateInput & TTransients>): PromiseLike<Prisma.PollExternalVoteSourceCreateInput[]>;
    pickForConnect(inputData: PollExternalVoteSource): Pick<PollExternalVoteSource, "id">;
    create(inputData?: Partial<Prisma.PollExternalVoteSourceCreateInput & TTransients>): PromiseLike<PollExternalVoteSource>;
    createList(list: readonly Partial<Prisma.PollExternalVoteSourceCreateInput & TTransients>[]): PromiseLike<PollExternalVoteSource[]>;
    createList(count: number, item?: Partial<Prisma.PollExternalVoteSourceCreateInput & TTransients>): PromiseLike<PollExternalVoteSource[]>;
    createForConnect(inputData?: Partial<Prisma.PollExternalVoteSourceCreateInput & TTransients>): PromiseLike<Pick<PollExternalVoteSource, "id">>;
}
export interface PollExternalVoteSourceFactoryInterface<TTransients extends Record<string, unknown> = Record<string, unknown>, TTraitName extends TraitName = TraitName> extends PollExternalVoteSourceFactoryInterfaceWithoutTraits<TTransients> {
    use(name: TTraitName, ...names: readonly TTraitName[]): PollExternalVoteSourceFactoryInterfaceWithoutTraits<TTransients>;
}
interface PollExternalVoteSourceFactoryBuilder {
    <TOptions extends PollExternalVoteSourceFactoryDefineOptions>(options: TOptions): PollExternalVoteSourceFactoryInterface<{}, PollExternalVoteSourceTraitKeys<TOptions>>;
    withTransientFields: <TTransients extends PollExternalVoteSourceTransientFields>(defaultTransientFieldValues: TTransients) => <TOptions extends PollExternalVoteSourceFactoryDefineOptions<TTransients>>(options: TOptions) => PollExternalVoteSourceFactoryInterface<TTransients, PollExternalVoteSourceTraitKeys<TOptions>>;
}
/**
 * Define factory for {@link PollExternalVoteSource} model.
 *
 * @param options
 * @returns factory {@link PollExternalVoteSourceFactoryInterface}
 */
export declare const definePollExternalVoteSourceFactory: PollExternalVoteSourceFactoryBuilder;
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
type PollExternalVoteTransientFields = Record<string, unknown> & Partial<Record<keyof PollExternalVoteFactoryDefineInput, never>>;
type PollExternalVoteFactoryTrait<TTransients extends Record<string, unknown>> = {
    data?: Resolver<Partial<PollExternalVoteFactoryDefineInput>, BuildDataOptions<TTransients>>;
} & CallbackDefineOptions<PollExternalVote, Prisma.PollExternalVoteCreateInput, TTransients>;
type PollExternalVoteFactoryDefineOptions<TTransients extends Record<string, unknown> = Record<string, unknown>> = {
    defaultData: Resolver<PollExternalVoteFactoryDefineInput, BuildDataOptions<TTransients>>;
    traits?: {
        [traitName: string | symbol]: PollExternalVoteFactoryTrait<TTransients>;
    };
} & CallbackDefineOptions<PollExternalVote, Prisma.PollExternalVoteCreateInput, TTransients>;
type PollExternalVoteTraitKeys<TOptions extends PollExternalVoteFactoryDefineOptions<any>> = Exclude<keyof TOptions["traits"], number>;
export interface PollExternalVoteFactoryInterfaceWithoutTraits<TTransients extends Record<string, unknown>> {
    readonly _factoryFor: "PollExternalVote";
    build(inputData?: Partial<Prisma.PollExternalVoteCreateInput & TTransients>): PromiseLike<Prisma.PollExternalVoteCreateInput>;
    buildCreateInput(inputData?: Partial<Prisma.PollExternalVoteCreateInput & TTransients>): PromiseLike<Prisma.PollExternalVoteCreateInput>;
    buildList(list: readonly Partial<Prisma.PollExternalVoteCreateInput & TTransients>[]): PromiseLike<Prisma.PollExternalVoteCreateInput[]>;
    buildList(count: number, item?: Partial<Prisma.PollExternalVoteCreateInput & TTransients>): PromiseLike<Prisma.PollExternalVoteCreateInput[]>;
    pickForConnect(inputData: PollExternalVote): Pick<PollExternalVote, "id">;
    create(inputData?: Partial<Prisma.PollExternalVoteCreateInput & TTransients>): PromiseLike<PollExternalVote>;
    createList(list: readonly Partial<Prisma.PollExternalVoteCreateInput & TTransients>[]): PromiseLike<PollExternalVote[]>;
    createList(count: number, item?: Partial<Prisma.PollExternalVoteCreateInput & TTransients>): PromiseLike<PollExternalVote[]>;
    createForConnect(inputData?: Partial<Prisma.PollExternalVoteCreateInput & TTransients>): PromiseLike<Pick<PollExternalVote, "id">>;
}
export interface PollExternalVoteFactoryInterface<TTransients extends Record<string, unknown> = Record<string, unknown>, TTraitName extends TraitName = TraitName> extends PollExternalVoteFactoryInterfaceWithoutTraits<TTransients> {
    use(name: TTraitName, ...names: readonly TTraitName[]): PollExternalVoteFactoryInterfaceWithoutTraits<TTransients>;
}
interface PollExternalVoteFactoryBuilder {
    <TOptions extends PollExternalVoteFactoryDefineOptions>(options: TOptions): PollExternalVoteFactoryInterface<{}, PollExternalVoteTraitKeys<TOptions>>;
    withTransientFields: <TTransients extends PollExternalVoteTransientFields>(defaultTransientFieldValues: TTransients) => <TOptions extends PollExternalVoteFactoryDefineOptions<TTransients>>(options: TOptions) => PollExternalVoteFactoryInterface<TTransients, PollExternalVoteTraitKeys<TOptions>>;
}
/**
 * Define factory for {@link PollExternalVote} model.
 *
 * @param options
 * @returns factory {@link PollExternalVoteFactoryInterface}
 */
export declare const definePollExternalVoteFactory: PollExternalVoteFactoryBuilder;
type EventimageFactory = {
    _factoryFor: "Image";
    build: () => PromiseLike<Prisma.ImageCreateNestedOneWithoutEventsInput["create"]>;
};
type EventFactoryDefineInput = {
    id?: string;
    createdAt?: Date;
    modifiedAt?: Date;
    name?: string;
    lead?: string | null;
    description?: Prisma.EventCreatedescriptionInput | Array<Prisma.InputJsonValue>;
    status?: EventStatus;
    location?: string | null;
    startsAt?: Date;
    endsAt?: Date | null;
    externalSourceName?: string | null;
    externalSourceId?: string | null;
    image?: EventimageFactory | Prisma.ImageCreateNestedOneWithoutEventsInput;
    tags?: Prisma.TaggedEventsCreateNestedManyWithoutEventInput;
};
type EventTransientFields = Record<string, unknown> & Partial<Record<keyof EventFactoryDefineInput, never>>;
type EventFactoryTrait<TTransients extends Record<string, unknown>> = {
    data?: Resolver<Partial<EventFactoryDefineInput>, BuildDataOptions<TTransients>>;
} & CallbackDefineOptions<Event, Prisma.EventCreateInput, TTransients>;
type EventFactoryDefineOptions<TTransients extends Record<string, unknown> = Record<string, unknown>> = {
    defaultData?: Resolver<EventFactoryDefineInput, BuildDataOptions<TTransients>>;
    traits?: {
        [traitName: TraitName]: EventFactoryTrait<TTransients>;
    };
} & CallbackDefineOptions<Event, Prisma.EventCreateInput, TTransients>;
type EventTraitKeys<TOptions extends EventFactoryDefineOptions<any>> = Exclude<keyof TOptions["traits"], number>;
export interface EventFactoryInterfaceWithoutTraits<TTransients extends Record<string, unknown>> {
    readonly _factoryFor: "Event";
    build(inputData?: Partial<Prisma.EventCreateInput & TTransients>): PromiseLike<Prisma.EventCreateInput>;
    buildCreateInput(inputData?: Partial<Prisma.EventCreateInput & TTransients>): PromiseLike<Prisma.EventCreateInput>;
    buildList(list: readonly Partial<Prisma.EventCreateInput & TTransients>[]): PromiseLike<Prisma.EventCreateInput[]>;
    buildList(count: number, item?: Partial<Prisma.EventCreateInput & TTransients>): PromiseLike<Prisma.EventCreateInput[]>;
    pickForConnect(inputData: Event): Pick<Event, "id">;
    create(inputData?: Partial<Prisma.EventCreateInput & TTransients>): PromiseLike<Event>;
    createList(list: readonly Partial<Prisma.EventCreateInput & TTransients>[]): PromiseLike<Event[]>;
    createList(count: number, item?: Partial<Prisma.EventCreateInput & TTransients>): PromiseLike<Event[]>;
    createForConnect(inputData?: Partial<Prisma.EventCreateInput & TTransients>): PromiseLike<Pick<Event, "id">>;
}
export interface EventFactoryInterface<TTransients extends Record<string, unknown> = Record<string, unknown>, TTraitName extends TraitName = TraitName> extends EventFactoryInterfaceWithoutTraits<TTransients> {
    use(name: TTraitName, ...names: readonly TTraitName[]): EventFactoryInterfaceWithoutTraits<TTransients>;
}
interface EventFactoryBuilder {
    <TOptions extends EventFactoryDefineOptions>(options?: TOptions): EventFactoryInterface<{}, EventTraitKeys<TOptions>>;
    withTransientFields: <TTransients extends EventTransientFields>(defaultTransientFieldValues: TTransients) => <TOptions extends EventFactoryDefineOptions<TTransients>>(options?: TOptions) => EventFactoryInterface<TTransients, EventTraitKeys<TOptions>>;
}
/**
 * Define factory for {@link Event} model.
 *
 * @param options
 * @returns factory {@link EventFactoryInterface}
 */
export declare const defineEventFactory: EventFactoryBuilder;
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
type TaggedEventsTransientFields = Record<string, unknown> & Partial<Record<keyof TaggedEventsFactoryDefineInput, never>>;
type TaggedEventsFactoryTrait<TTransients extends Record<string, unknown>> = {
    data?: Resolver<Partial<TaggedEventsFactoryDefineInput>, BuildDataOptions<TTransients>>;
} & CallbackDefineOptions<TaggedEvents, Prisma.TaggedEventsCreateInput, TTransients>;
type TaggedEventsFactoryDefineOptions<TTransients extends Record<string, unknown> = Record<string, unknown>> = {
    defaultData: Resolver<TaggedEventsFactoryDefineInput, BuildDataOptions<TTransients>>;
    traits?: {
        [traitName: string | symbol]: TaggedEventsFactoryTrait<TTransients>;
    };
} & CallbackDefineOptions<TaggedEvents, Prisma.TaggedEventsCreateInput, TTransients>;
type TaggedEventsTraitKeys<TOptions extends TaggedEventsFactoryDefineOptions<any>> = Exclude<keyof TOptions["traits"], number>;
export interface TaggedEventsFactoryInterfaceWithoutTraits<TTransients extends Record<string, unknown>> {
    readonly _factoryFor: "TaggedEvents";
    build(inputData?: Partial<Prisma.TaggedEventsCreateInput & TTransients>): PromiseLike<Prisma.TaggedEventsCreateInput>;
    buildCreateInput(inputData?: Partial<Prisma.TaggedEventsCreateInput & TTransients>): PromiseLike<Prisma.TaggedEventsCreateInput>;
    buildList(list: readonly Partial<Prisma.TaggedEventsCreateInput & TTransients>[]): PromiseLike<Prisma.TaggedEventsCreateInput[]>;
    buildList(count: number, item?: Partial<Prisma.TaggedEventsCreateInput & TTransients>): PromiseLike<Prisma.TaggedEventsCreateInput[]>;
    pickForConnect(inputData: TaggedEvents): Pick<TaggedEvents, "eventId" | "tagId">;
    create(inputData?: Partial<Prisma.TaggedEventsCreateInput & TTransients>): PromiseLike<TaggedEvents>;
    createList(list: readonly Partial<Prisma.TaggedEventsCreateInput & TTransients>[]): PromiseLike<TaggedEvents[]>;
    createList(count: number, item?: Partial<Prisma.TaggedEventsCreateInput & TTransients>): PromiseLike<TaggedEvents[]>;
    createForConnect(inputData?: Partial<Prisma.TaggedEventsCreateInput & TTransients>): PromiseLike<Pick<TaggedEvents, "eventId" | "tagId">>;
}
export interface TaggedEventsFactoryInterface<TTransients extends Record<string, unknown> = Record<string, unknown>, TTraitName extends TraitName = TraitName> extends TaggedEventsFactoryInterfaceWithoutTraits<TTransients> {
    use(name: TTraitName, ...names: readonly TTraitName[]): TaggedEventsFactoryInterfaceWithoutTraits<TTransients>;
}
interface TaggedEventsFactoryBuilder {
    <TOptions extends TaggedEventsFactoryDefineOptions>(options: TOptions): TaggedEventsFactoryInterface<{}, TaggedEventsTraitKeys<TOptions>>;
    withTransientFields: <TTransients extends TaggedEventsTransientFields>(defaultTransientFieldValues: TTransients) => <TOptions extends TaggedEventsFactoryDefineOptions<TTransients>>(options: TOptions) => TaggedEventsFactoryInterface<TTransients, TaggedEventsTraitKeys<TOptions>>;
}
/**
 * Define factory for {@link TaggedEvents} model.
 *
 * @param options
 * @returns factory {@link TaggedEventsFactoryInterface}
 */
export declare const defineTaggedEventsFactory: TaggedEventsFactoryBuilder;
type ConsentFactoryDefineInput = {
    id?: string;
    createdAt?: Date;
    modifiedAt?: Date;
    name?: string;
    slug?: string;
    defaultValue?: boolean;
    userConsents?: Prisma.UserConsentCreateNestedManyWithoutConsentInput;
};
type ConsentTransientFields = Record<string, unknown> & Partial<Record<keyof ConsentFactoryDefineInput, never>>;
type ConsentFactoryTrait<TTransients extends Record<string, unknown>> = {
    data?: Resolver<Partial<ConsentFactoryDefineInput>, BuildDataOptions<TTransients>>;
} & CallbackDefineOptions<Consent, Prisma.ConsentCreateInput, TTransients>;
type ConsentFactoryDefineOptions<TTransients extends Record<string, unknown> = Record<string, unknown>> = {
    defaultData?: Resolver<ConsentFactoryDefineInput, BuildDataOptions<TTransients>>;
    traits?: {
        [traitName: TraitName]: ConsentFactoryTrait<TTransients>;
    };
} & CallbackDefineOptions<Consent, Prisma.ConsentCreateInput, TTransients>;
type ConsentTraitKeys<TOptions extends ConsentFactoryDefineOptions<any>> = Exclude<keyof TOptions["traits"], number>;
export interface ConsentFactoryInterfaceWithoutTraits<TTransients extends Record<string, unknown>> {
    readonly _factoryFor: "Consent";
    build(inputData?: Partial<Prisma.ConsentCreateInput & TTransients>): PromiseLike<Prisma.ConsentCreateInput>;
    buildCreateInput(inputData?: Partial<Prisma.ConsentCreateInput & TTransients>): PromiseLike<Prisma.ConsentCreateInput>;
    buildList(list: readonly Partial<Prisma.ConsentCreateInput & TTransients>[]): PromiseLike<Prisma.ConsentCreateInput[]>;
    buildList(count: number, item?: Partial<Prisma.ConsentCreateInput & TTransients>): PromiseLike<Prisma.ConsentCreateInput[]>;
    pickForConnect(inputData: Consent): Pick<Consent, "id">;
    create(inputData?: Partial<Prisma.ConsentCreateInput & TTransients>): PromiseLike<Consent>;
    createList(list: readonly Partial<Prisma.ConsentCreateInput & TTransients>[]): PromiseLike<Consent[]>;
    createList(count: number, item?: Partial<Prisma.ConsentCreateInput & TTransients>): PromiseLike<Consent[]>;
    createForConnect(inputData?: Partial<Prisma.ConsentCreateInput & TTransients>): PromiseLike<Pick<Consent, "id">>;
}
export interface ConsentFactoryInterface<TTransients extends Record<string, unknown> = Record<string, unknown>, TTraitName extends TraitName = TraitName> extends ConsentFactoryInterfaceWithoutTraits<TTransients> {
    use(name: TTraitName, ...names: readonly TTraitName[]): ConsentFactoryInterfaceWithoutTraits<TTransients>;
}
interface ConsentFactoryBuilder {
    <TOptions extends ConsentFactoryDefineOptions>(options?: TOptions): ConsentFactoryInterface<{}, ConsentTraitKeys<TOptions>>;
    withTransientFields: <TTransients extends ConsentTransientFields>(defaultTransientFieldValues: TTransients) => <TOptions extends ConsentFactoryDefineOptions<TTransients>>(options?: TOptions) => ConsentFactoryInterface<TTransients, ConsentTraitKeys<TOptions>>;
}
/**
 * Define factory for {@link Consent} model.
 *
 * @param options
 * @returns factory {@link ConsentFactoryInterface}
 */
export declare const defineConsentFactory: ConsentFactoryBuilder;
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
type UserConsentTransientFields = Record<string, unknown> & Partial<Record<keyof UserConsentFactoryDefineInput, never>>;
type UserConsentFactoryTrait<TTransients extends Record<string, unknown>> = {
    data?: Resolver<Partial<UserConsentFactoryDefineInput>, BuildDataOptions<TTransients>>;
} & CallbackDefineOptions<UserConsent, Prisma.UserConsentCreateInput, TTransients>;
type UserConsentFactoryDefineOptions<TTransients extends Record<string, unknown> = Record<string, unknown>> = {
    defaultData: Resolver<UserConsentFactoryDefineInput, BuildDataOptions<TTransients>>;
    traits?: {
        [traitName: string | symbol]: UserConsentFactoryTrait<TTransients>;
    };
} & CallbackDefineOptions<UserConsent, Prisma.UserConsentCreateInput, TTransients>;
type UserConsentTraitKeys<TOptions extends UserConsentFactoryDefineOptions<any>> = Exclude<keyof TOptions["traits"], number>;
export interface UserConsentFactoryInterfaceWithoutTraits<TTransients extends Record<string, unknown>> {
    readonly _factoryFor: "UserConsent";
    build(inputData?: Partial<Prisma.UserConsentCreateInput & TTransients>): PromiseLike<Prisma.UserConsentCreateInput>;
    buildCreateInput(inputData?: Partial<Prisma.UserConsentCreateInput & TTransients>): PromiseLike<Prisma.UserConsentCreateInput>;
    buildList(list: readonly Partial<Prisma.UserConsentCreateInput & TTransients>[]): PromiseLike<Prisma.UserConsentCreateInput[]>;
    buildList(count: number, item?: Partial<Prisma.UserConsentCreateInput & TTransients>): PromiseLike<Prisma.UserConsentCreateInput[]>;
    pickForConnect(inputData: UserConsent): Pick<UserConsent, "id">;
    create(inputData?: Partial<Prisma.UserConsentCreateInput & TTransients>): PromiseLike<UserConsent>;
    createList(list: readonly Partial<Prisma.UserConsentCreateInput & TTransients>[]): PromiseLike<UserConsent[]>;
    createList(count: number, item?: Partial<Prisma.UserConsentCreateInput & TTransients>): PromiseLike<UserConsent[]>;
    createForConnect(inputData?: Partial<Prisma.UserConsentCreateInput & TTransients>): PromiseLike<Pick<UserConsent, "id">>;
}
export interface UserConsentFactoryInterface<TTransients extends Record<string, unknown> = Record<string, unknown>, TTraitName extends TraitName = TraitName> extends UserConsentFactoryInterfaceWithoutTraits<TTransients> {
    use(name: TTraitName, ...names: readonly TTraitName[]): UserConsentFactoryInterfaceWithoutTraits<TTransients>;
}
interface UserConsentFactoryBuilder {
    <TOptions extends UserConsentFactoryDefineOptions>(options: TOptions): UserConsentFactoryInterface<{}, UserConsentTraitKeys<TOptions>>;
    withTransientFields: <TTransients extends UserConsentTransientFields>(defaultTransientFieldValues: TTransients) => <TOptions extends UserConsentFactoryDefineOptions<TTransients>>(options: TOptions) => UserConsentFactoryInterface<TTransients, UserConsentTraitKeys<TOptions>>;
}
/**
 * Define factory for {@link UserConsent} model.
 *
 * @param options
 * @returns factory {@link UserConsentFactoryInterface}
 */
export declare const defineUserConsentFactory: UserConsentFactoryBuilder;
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
type UserFlowMailTransientFields = Record<string, unknown> & Partial<Record<keyof UserFlowMailFactoryDefineInput, never>>;
type UserFlowMailFactoryTrait<TTransients extends Record<string, unknown>> = {
    data?: Resolver<Partial<UserFlowMailFactoryDefineInput>, BuildDataOptions<TTransients>>;
} & CallbackDefineOptions<UserFlowMail, Prisma.UserFlowMailCreateInput, TTransients>;
type UserFlowMailFactoryDefineOptions<TTransients extends Record<string, unknown> = Record<string, unknown>> = {
    defaultData?: Resolver<UserFlowMailFactoryDefineInput, BuildDataOptions<TTransients>>;
    traits?: {
        [traitName: TraitName]: UserFlowMailFactoryTrait<TTransients>;
    };
} & CallbackDefineOptions<UserFlowMail, Prisma.UserFlowMailCreateInput, TTransients>;
type UserFlowMailTraitKeys<TOptions extends UserFlowMailFactoryDefineOptions<any>> = Exclude<keyof TOptions["traits"], number>;
export interface UserFlowMailFactoryInterfaceWithoutTraits<TTransients extends Record<string, unknown>> {
    readonly _factoryFor: "UserFlowMail";
    build(inputData?: Partial<Prisma.UserFlowMailCreateInput & TTransients>): PromiseLike<Prisma.UserFlowMailCreateInput>;
    buildCreateInput(inputData?: Partial<Prisma.UserFlowMailCreateInput & TTransients>): PromiseLike<Prisma.UserFlowMailCreateInput>;
    buildList(list: readonly Partial<Prisma.UserFlowMailCreateInput & TTransients>[]): PromiseLike<Prisma.UserFlowMailCreateInput[]>;
    buildList(count: number, item?: Partial<Prisma.UserFlowMailCreateInput & TTransients>): PromiseLike<Prisma.UserFlowMailCreateInput[]>;
    pickForConnect(inputData: UserFlowMail): Pick<UserFlowMail, "id">;
    create(inputData?: Partial<Prisma.UserFlowMailCreateInput & TTransients>): PromiseLike<UserFlowMail>;
    createList(list: readonly Partial<Prisma.UserFlowMailCreateInput & TTransients>[]): PromiseLike<UserFlowMail[]>;
    createList(count: number, item?: Partial<Prisma.UserFlowMailCreateInput & TTransients>): PromiseLike<UserFlowMail[]>;
    createForConnect(inputData?: Partial<Prisma.UserFlowMailCreateInput & TTransients>): PromiseLike<Pick<UserFlowMail, "id">>;
}
export interface UserFlowMailFactoryInterface<TTransients extends Record<string, unknown> = Record<string, unknown>, TTraitName extends TraitName = TraitName> extends UserFlowMailFactoryInterfaceWithoutTraits<TTransients> {
    use(name: TTraitName, ...names: readonly TTraitName[]): UserFlowMailFactoryInterfaceWithoutTraits<TTransients>;
}
interface UserFlowMailFactoryBuilder {
    <TOptions extends UserFlowMailFactoryDefineOptions>(options?: TOptions): UserFlowMailFactoryInterface<{}, UserFlowMailTraitKeys<TOptions>>;
    withTransientFields: <TTransients extends UserFlowMailTransientFields>(defaultTransientFieldValues: TTransients) => <TOptions extends UserFlowMailFactoryDefineOptions<TTransients>>(options?: TOptions) => UserFlowMailFactoryInterface<TTransients, UserFlowMailTraitKeys<TOptions>>;
}
/**
 * Define factory for {@link UserFlowMail} model.
 *
 * @param options
 * @returns factory {@link UserFlowMailFactoryInterface}
 */
export declare const defineUserFlowMailFactory: UserFlowMailFactoryBuilder;
type SubscriptionFlowmemberPlanFactory = {
    _factoryFor: "MemberPlan";
    build: () => PromiseLike<Prisma.MemberPlanCreateNestedOneWithoutSubscriptionFlowsInput["create"]>;
};
type SubscriptionFlowFactoryDefineInput = {
    id?: string;
    createdAt?: Date;
    modifiedAt?: Date;
    default?: boolean;
    periodicities?: Prisma.SubscriptionFlowCreateperiodicitiesInput | Array<PaymentPeriodicity>;
    autoRenewal?: Prisma.SubscriptionFlowCreateautoRenewalInput | Array<boolean>;
    memberPlan?: SubscriptionFlowmemberPlanFactory | Prisma.MemberPlanCreateNestedOneWithoutSubscriptionFlowsInput;
    paymentMethods?: Prisma.PaymentMethodCreateNestedManyWithoutSubscriptionFlowsInput;
    intervals?: Prisma.SubscriptionIntervalCreateNestedManyWithoutSubscriptionFlowInput;
};
type SubscriptionFlowTransientFields = Record<string, unknown> & Partial<Record<keyof SubscriptionFlowFactoryDefineInput, never>>;
type SubscriptionFlowFactoryTrait<TTransients extends Record<string, unknown>> = {
    data?: Resolver<Partial<SubscriptionFlowFactoryDefineInput>, BuildDataOptions<TTransients>>;
} & CallbackDefineOptions<SubscriptionFlow, Prisma.SubscriptionFlowCreateInput, TTransients>;
type SubscriptionFlowFactoryDefineOptions<TTransients extends Record<string, unknown> = Record<string, unknown>> = {
    defaultData?: Resolver<SubscriptionFlowFactoryDefineInput, BuildDataOptions<TTransients>>;
    traits?: {
        [traitName: TraitName]: SubscriptionFlowFactoryTrait<TTransients>;
    };
} & CallbackDefineOptions<SubscriptionFlow, Prisma.SubscriptionFlowCreateInput, TTransients>;
type SubscriptionFlowTraitKeys<TOptions extends SubscriptionFlowFactoryDefineOptions<any>> = Exclude<keyof TOptions["traits"], number>;
export interface SubscriptionFlowFactoryInterfaceWithoutTraits<TTransients extends Record<string, unknown>> {
    readonly _factoryFor: "SubscriptionFlow";
    build(inputData?: Partial<Prisma.SubscriptionFlowCreateInput & TTransients>): PromiseLike<Prisma.SubscriptionFlowCreateInput>;
    buildCreateInput(inputData?: Partial<Prisma.SubscriptionFlowCreateInput & TTransients>): PromiseLike<Prisma.SubscriptionFlowCreateInput>;
    buildList(list: readonly Partial<Prisma.SubscriptionFlowCreateInput & TTransients>[]): PromiseLike<Prisma.SubscriptionFlowCreateInput[]>;
    buildList(count: number, item?: Partial<Prisma.SubscriptionFlowCreateInput & TTransients>): PromiseLike<Prisma.SubscriptionFlowCreateInput[]>;
    pickForConnect(inputData: SubscriptionFlow): Pick<SubscriptionFlow, "id">;
    create(inputData?: Partial<Prisma.SubscriptionFlowCreateInput & TTransients>): PromiseLike<SubscriptionFlow>;
    createList(list: readonly Partial<Prisma.SubscriptionFlowCreateInput & TTransients>[]): PromiseLike<SubscriptionFlow[]>;
    createList(count: number, item?: Partial<Prisma.SubscriptionFlowCreateInput & TTransients>): PromiseLike<SubscriptionFlow[]>;
    createForConnect(inputData?: Partial<Prisma.SubscriptionFlowCreateInput & TTransients>): PromiseLike<Pick<SubscriptionFlow, "id">>;
}
export interface SubscriptionFlowFactoryInterface<TTransients extends Record<string, unknown> = Record<string, unknown>, TTraitName extends TraitName = TraitName> extends SubscriptionFlowFactoryInterfaceWithoutTraits<TTransients> {
    use(name: TTraitName, ...names: readonly TTraitName[]): SubscriptionFlowFactoryInterfaceWithoutTraits<TTransients>;
}
interface SubscriptionFlowFactoryBuilder {
    <TOptions extends SubscriptionFlowFactoryDefineOptions>(options?: TOptions): SubscriptionFlowFactoryInterface<{}, SubscriptionFlowTraitKeys<TOptions>>;
    withTransientFields: <TTransients extends SubscriptionFlowTransientFields>(defaultTransientFieldValues: TTransients) => <TOptions extends SubscriptionFlowFactoryDefineOptions<TTransients>>(options?: TOptions) => SubscriptionFlowFactoryInterface<TTransients, SubscriptionFlowTraitKeys<TOptions>>;
}
/**
 * Define factory for {@link SubscriptionFlow} model.
 *
 * @param options
 * @returns factory {@link SubscriptionFlowFactoryInterface}
 */
export declare const defineSubscriptionFlowFactory: SubscriptionFlowFactoryBuilder;
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
type SubscriptionIntervalTransientFields = Record<string, unknown> & Partial<Record<keyof SubscriptionIntervalFactoryDefineInput, never>>;
type SubscriptionIntervalFactoryTrait<TTransients extends Record<string, unknown>> = {
    data?: Resolver<Partial<SubscriptionIntervalFactoryDefineInput>, BuildDataOptions<TTransients>>;
} & CallbackDefineOptions<SubscriptionInterval, Prisma.SubscriptionIntervalCreateInput, TTransients>;
type SubscriptionIntervalFactoryDefineOptions<TTransients extends Record<string, unknown> = Record<string, unknown>> = {
    defaultData: Resolver<SubscriptionIntervalFactoryDefineInput, BuildDataOptions<TTransients>>;
    traits?: {
        [traitName: string | symbol]: SubscriptionIntervalFactoryTrait<TTransients>;
    };
} & CallbackDefineOptions<SubscriptionInterval, Prisma.SubscriptionIntervalCreateInput, TTransients>;
type SubscriptionIntervalTraitKeys<TOptions extends SubscriptionIntervalFactoryDefineOptions<any>> = Exclude<keyof TOptions["traits"], number>;
export interface SubscriptionIntervalFactoryInterfaceWithoutTraits<TTransients extends Record<string, unknown>> {
    readonly _factoryFor: "SubscriptionInterval";
    build(inputData?: Partial<Prisma.SubscriptionIntervalCreateInput & TTransients>): PromiseLike<Prisma.SubscriptionIntervalCreateInput>;
    buildCreateInput(inputData?: Partial<Prisma.SubscriptionIntervalCreateInput & TTransients>): PromiseLike<Prisma.SubscriptionIntervalCreateInput>;
    buildList(list: readonly Partial<Prisma.SubscriptionIntervalCreateInput & TTransients>[]): PromiseLike<Prisma.SubscriptionIntervalCreateInput[]>;
    buildList(count: number, item?: Partial<Prisma.SubscriptionIntervalCreateInput & TTransients>): PromiseLike<Prisma.SubscriptionIntervalCreateInput[]>;
    pickForConnect(inputData: SubscriptionInterval): Pick<SubscriptionInterval, "id">;
    create(inputData?: Partial<Prisma.SubscriptionIntervalCreateInput & TTransients>): PromiseLike<SubscriptionInterval>;
    createList(list: readonly Partial<Prisma.SubscriptionIntervalCreateInput & TTransients>[]): PromiseLike<SubscriptionInterval[]>;
    createList(count: number, item?: Partial<Prisma.SubscriptionIntervalCreateInput & TTransients>): PromiseLike<SubscriptionInterval[]>;
    createForConnect(inputData?: Partial<Prisma.SubscriptionIntervalCreateInput & TTransients>): PromiseLike<Pick<SubscriptionInterval, "id">>;
}
export interface SubscriptionIntervalFactoryInterface<TTransients extends Record<string, unknown> = Record<string, unknown>, TTraitName extends TraitName = TraitName> extends SubscriptionIntervalFactoryInterfaceWithoutTraits<TTransients> {
    use(name: TTraitName, ...names: readonly TTraitName[]): SubscriptionIntervalFactoryInterfaceWithoutTraits<TTransients>;
}
interface SubscriptionIntervalFactoryBuilder {
    <TOptions extends SubscriptionIntervalFactoryDefineOptions>(options: TOptions): SubscriptionIntervalFactoryInterface<{}, SubscriptionIntervalTraitKeys<TOptions>>;
    withTransientFields: <TTransients extends SubscriptionIntervalTransientFields>(defaultTransientFieldValues: TTransients) => <TOptions extends SubscriptionIntervalFactoryDefineOptions<TTransients>>(options: TOptions) => SubscriptionIntervalFactoryInterface<TTransients, SubscriptionIntervalTraitKeys<TOptions>>;
}
/**
 * Define factory for {@link SubscriptionInterval} model.
 *
 * @param options
 * @returns factory {@link SubscriptionIntervalFactoryInterface}
 */
export declare const defineSubscriptionIntervalFactory: SubscriptionIntervalFactoryBuilder;
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
type MailTemplateTransientFields = Record<string, unknown> & Partial<Record<keyof MailTemplateFactoryDefineInput, never>>;
type MailTemplateFactoryTrait<TTransients extends Record<string, unknown>> = {
    data?: Resolver<Partial<MailTemplateFactoryDefineInput>, BuildDataOptions<TTransients>>;
} & CallbackDefineOptions<MailTemplate, Prisma.MailTemplateCreateInput, TTransients>;
type MailTemplateFactoryDefineOptions<TTransients extends Record<string, unknown> = Record<string, unknown>> = {
    defaultData?: Resolver<MailTemplateFactoryDefineInput, BuildDataOptions<TTransients>>;
    traits?: {
        [traitName: TraitName]: MailTemplateFactoryTrait<TTransients>;
    };
} & CallbackDefineOptions<MailTemplate, Prisma.MailTemplateCreateInput, TTransients>;
type MailTemplateTraitKeys<TOptions extends MailTemplateFactoryDefineOptions<any>> = Exclude<keyof TOptions["traits"], number>;
export interface MailTemplateFactoryInterfaceWithoutTraits<TTransients extends Record<string, unknown>> {
    readonly _factoryFor: "MailTemplate";
    build(inputData?: Partial<Prisma.MailTemplateCreateInput & TTransients>): PromiseLike<Prisma.MailTemplateCreateInput>;
    buildCreateInput(inputData?: Partial<Prisma.MailTemplateCreateInput & TTransients>): PromiseLike<Prisma.MailTemplateCreateInput>;
    buildList(list: readonly Partial<Prisma.MailTemplateCreateInput & TTransients>[]): PromiseLike<Prisma.MailTemplateCreateInput[]>;
    buildList(count: number, item?: Partial<Prisma.MailTemplateCreateInput & TTransients>): PromiseLike<Prisma.MailTemplateCreateInput[]>;
    pickForConnect(inputData: MailTemplate): Pick<MailTemplate, "id">;
    create(inputData?: Partial<Prisma.MailTemplateCreateInput & TTransients>): PromiseLike<MailTemplate>;
    createList(list: readonly Partial<Prisma.MailTemplateCreateInput & TTransients>[]): PromiseLike<MailTemplate[]>;
    createList(count: number, item?: Partial<Prisma.MailTemplateCreateInput & TTransients>): PromiseLike<MailTemplate[]>;
    createForConnect(inputData?: Partial<Prisma.MailTemplateCreateInput & TTransients>): PromiseLike<Pick<MailTemplate, "id">>;
}
export interface MailTemplateFactoryInterface<TTransients extends Record<string, unknown> = Record<string, unknown>, TTraitName extends TraitName = TraitName> extends MailTemplateFactoryInterfaceWithoutTraits<TTransients> {
    use(name: TTraitName, ...names: readonly TTraitName[]): MailTemplateFactoryInterfaceWithoutTraits<TTransients>;
}
interface MailTemplateFactoryBuilder {
    <TOptions extends MailTemplateFactoryDefineOptions>(options?: TOptions): MailTemplateFactoryInterface<{}, MailTemplateTraitKeys<TOptions>>;
    withTransientFields: <TTransients extends MailTemplateTransientFields>(defaultTransientFieldValues: TTransients) => <TOptions extends MailTemplateFactoryDefineOptions<TTransients>>(options?: TOptions) => MailTemplateFactoryInterface<TTransients, MailTemplateTraitKeys<TOptions>>;
}
/**
 * Define factory for {@link MailTemplate} model.
 *
 * @param options
 * @returns factory {@link MailTemplateFactoryInterface}
 */
export declare const defineMailTemplateFactory: MailTemplateFactoryBuilder;
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
type PeriodicJobTransientFields = Record<string, unknown> & Partial<Record<keyof PeriodicJobFactoryDefineInput, never>>;
type PeriodicJobFactoryTrait<TTransients extends Record<string, unknown>> = {
    data?: Resolver<Partial<PeriodicJobFactoryDefineInput>, BuildDataOptions<TTransients>>;
} & CallbackDefineOptions<PeriodicJob, Prisma.PeriodicJobCreateInput, TTransients>;
type PeriodicJobFactoryDefineOptions<TTransients extends Record<string, unknown> = Record<string, unknown>> = {
    defaultData?: Resolver<PeriodicJobFactoryDefineInput, BuildDataOptions<TTransients>>;
    traits?: {
        [traitName: TraitName]: PeriodicJobFactoryTrait<TTransients>;
    };
} & CallbackDefineOptions<PeriodicJob, Prisma.PeriodicJobCreateInput, TTransients>;
type PeriodicJobTraitKeys<TOptions extends PeriodicJobFactoryDefineOptions<any>> = Exclude<keyof TOptions["traits"], number>;
export interface PeriodicJobFactoryInterfaceWithoutTraits<TTransients extends Record<string, unknown>> {
    readonly _factoryFor: "PeriodicJob";
    build(inputData?: Partial<Prisma.PeriodicJobCreateInput & TTransients>): PromiseLike<Prisma.PeriodicJobCreateInput>;
    buildCreateInput(inputData?: Partial<Prisma.PeriodicJobCreateInput & TTransients>): PromiseLike<Prisma.PeriodicJobCreateInput>;
    buildList(list: readonly Partial<Prisma.PeriodicJobCreateInput & TTransients>[]): PromiseLike<Prisma.PeriodicJobCreateInput[]>;
    buildList(count: number, item?: Partial<Prisma.PeriodicJobCreateInput & TTransients>): PromiseLike<Prisma.PeriodicJobCreateInput[]>;
    pickForConnect(inputData: PeriodicJob): Pick<PeriodicJob, "id">;
    create(inputData?: Partial<Prisma.PeriodicJobCreateInput & TTransients>): PromiseLike<PeriodicJob>;
    createList(list: readonly Partial<Prisma.PeriodicJobCreateInput & TTransients>[]): PromiseLike<PeriodicJob[]>;
    createList(count: number, item?: Partial<Prisma.PeriodicJobCreateInput & TTransients>): PromiseLike<PeriodicJob[]>;
    createForConnect(inputData?: Partial<Prisma.PeriodicJobCreateInput & TTransients>): PromiseLike<Pick<PeriodicJob, "id">>;
}
export interface PeriodicJobFactoryInterface<TTransients extends Record<string, unknown> = Record<string, unknown>, TTraitName extends TraitName = TraitName> extends PeriodicJobFactoryInterfaceWithoutTraits<TTransients> {
    use(name: TTraitName, ...names: readonly TTraitName[]): PeriodicJobFactoryInterfaceWithoutTraits<TTransients>;
}
interface PeriodicJobFactoryBuilder {
    <TOptions extends PeriodicJobFactoryDefineOptions>(options?: TOptions): PeriodicJobFactoryInterface<{}, PeriodicJobTraitKeys<TOptions>>;
    withTransientFields: <TTransients extends PeriodicJobTransientFields>(defaultTransientFieldValues: TTransients) => <TOptions extends PeriodicJobFactoryDefineOptions<TTransients>>(options?: TOptions) => PeriodicJobFactoryInterface<TTransients, PeriodicJobTraitKeys<TOptions>>;
}
/**
 * Define factory for {@link PeriodicJob} model.
 *
 * @param options
 * @returns factory {@link PeriodicJobFactoryInterface}
 */
export declare const definePeriodicJobFactory: PeriodicJobFactoryBuilder;
type BlockStyleFactoryDefineInput = {
    id?: string;
    createdAt?: Date;
    modifiedAt?: Date;
    name?: string;
    blocks?: Prisma.BlockStyleCreateblocksInput | Array<BlockType>;
};
type BlockStyleTransientFields = Record<string, unknown> & Partial<Record<keyof BlockStyleFactoryDefineInput, never>>;
type BlockStyleFactoryTrait<TTransients extends Record<string, unknown>> = {
    data?: Resolver<Partial<BlockStyleFactoryDefineInput>, BuildDataOptions<TTransients>>;
} & CallbackDefineOptions<BlockStyle, Prisma.BlockStyleCreateInput, TTransients>;
type BlockStyleFactoryDefineOptions<TTransients extends Record<string, unknown> = Record<string, unknown>> = {
    defaultData?: Resolver<BlockStyleFactoryDefineInput, BuildDataOptions<TTransients>>;
    traits?: {
        [traitName: TraitName]: BlockStyleFactoryTrait<TTransients>;
    };
} & CallbackDefineOptions<BlockStyle, Prisma.BlockStyleCreateInput, TTransients>;
type BlockStyleTraitKeys<TOptions extends BlockStyleFactoryDefineOptions<any>> = Exclude<keyof TOptions["traits"], number>;
export interface BlockStyleFactoryInterfaceWithoutTraits<TTransients extends Record<string, unknown>> {
    readonly _factoryFor: "BlockStyle";
    build(inputData?: Partial<Prisma.BlockStyleCreateInput & TTransients>): PromiseLike<Prisma.BlockStyleCreateInput>;
    buildCreateInput(inputData?: Partial<Prisma.BlockStyleCreateInput & TTransients>): PromiseLike<Prisma.BlockStyleCreateInput>;
    buildList(list: readonly Partial<Prisma.BlockStyleCreateInput & TTransients>[]): PromiseLike<Prisma.BlockStyleCreateInput[]>;
    buildList(count: number, item?: Partial<Prisma.BlockStyleCreateInput & TTransients>): PromiseLike<Prisma.BlockStyleCreateInput[]>;
    pickForConnect(inputData: BlockStyle): Pick<BlockStyle, "id">;
    create(inputData?: Partial<Prisma.BlockStyleCreateInput & TTransients>): PromiseLike<BlockStyle>;
    createList(list: readonly Partial<Prisma.BlockStyleCreateInput & TTransients>[]): PromiseLike<BlockStyle[]>;
    createList(count: number, item?: Partial<Prisma.BlockStyleCreateInput & TTransients>): PromiseLike<BlockStyle[]>;
    createForConnect(inputData?: Partial<Prisma.BlockStyleCreateInput & TTransients>): PromiseLike<Pick<BlockStyle, "id">>;
}
export interface BlockStyleFactoryInterface<TTransients extends Record<string, unknown> = Record<string, unknown>, TTraitName extends TraitName = TraitName> extends BlockStyleFactoryInterfaceWithoutTraits<TTransients> {
    use(name: TTraitName, ...names: readonly TTraitName[]): BlockStyleFactoryInterfaceWithoutTraits<TTransients>;
}
interface BlockStyleFactoryBuilder {
    <TOptions extends BlockStyleFactoryDefineOptions>(options?: TOptions): BlockStyleFactoryInterface<{}, BlockStyleTraitKeys<TOptions>>;
    withTransientFields: <TTransients extends BlockStyleTransientFields>(defaultTransientFieldValues: TTransients) => <TOptions extends BlockStyleFactoryDefineOptions<TTransients>>(options?: TOptions) => BlockStyleFactoryInterface<TTransients, BlockStyleTraitKeys<TOptions>>;
}
/**
 * Define factory for {@link BlockStyle} model.
 *
 * @param options
 * @returns factory {@link BlockStyleFactoryInterface}
 */
export declare const defineBlockStyleFactory: BlockStyleFactoryBuilder;
