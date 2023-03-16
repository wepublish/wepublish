import type { MetadataProperty } from "@prisma/client";
import type { ArticleRevision } from "@prisma/client";
import type { ArticleRevisionAuthor } from "@prisma/client";
import type { ArticleRevisionSocialMediaAuthor } from "@prisma/client";
import type { Article } from "@prisma/client";
import type { AuthorsLinks } from "@prisma/client";
import type { Author } from "@prisma/client";
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
import type { UserFlow } from "@prisma/client";
import type { SubscriptionFlow } from "@prisma/client";
import type { SubscriptionInterval } from "@prisma/client";
import type { MailTemplate } from "@prisma/client";
import type { PeriodicJob } from "@prisma/client";
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
import type { SubscriptionEvent } from "@prisma/client";
import { Prisma } from "@prisma/client";
import type { PrismaClient } from "@prisma/client";
import { getClient, ModelWithFields, createScreener, getScalarFieldValueGenerator, Resolver, normalizeResolver, normalizeList, getSequenceCounter, } from "@quramy/prisma-fabbrica/lib/internal";
export { initialize, resetSequence, registerScalarFieldValueGenerator, resetScalarFieldValueGenerator } from "@quramy/prisma-fabbrica/lib/internal";

type BuildDataOptions = {
    readonly seq: number;
};

const modelFieldDefinitions: ModelWithFields[] = [{
        name: "MetadataProperty",
        fields: [{
                name: "ArticleRevision",
                type: "ArticleRevision",
                relationName: "ArticleRevisionToMetadataProperty"
            }, {
                name: "PageRevision",
                type: "PageRevision",
                relationName: "MetadataPropertyToPageRevision"
            }, {
                name: "Subscription",
                type: "Subscription",
                relationName: "MetadataPropertyToSubscription"
            }, {
                name: "User",
                type: "User",
                relationName: "MetadataPropertyToUser"
            }]
    }, {
        name: "ArticleRevision",
        fields: [{
                name: "properties",
                type: "MetadataProperty",
                relationName: "ArticleRevisionToMetadataProperty"
            }, {
                name: "image",
                type: "Image",
                relationName: "articleRevisionImage"
            }, {
                name: "authors",
                type: "ArticleRevisionAuthor",
                relationName: "ArticleRevisionToArticleRevisionAuthor"
            }, {
                name: "socialMediaAuthors",
                type: "ArticleRevisionSocialMediaAuthor",
                relationName: "ArticleRevisionToArticleRevisionSocialMediaAuthor"
            }, {
                name: "socialMediaImage",
                type: "Image",
                relationName: "articleRevisionSocialMediaImage"
            }, {
                name: "PublishedArticle",
                type: "Article",
                relationName: "publishedArticleRevision"
            }, {
                name: "PendingArticle",
                type: "Article",
                relationName: "pendingArticleRevision"
            }, {
                name: "DraftArticle",
                type: "Article",
                relationName: "draftArticleRevision"
            }]
    }, {
        name: "ArticleRevisionAuthor",
        fields: [{
                name: "revision",
                type: "ArticleRevision",
                relationName: "ArticleRevisionToArticleRevisionAuthor"
            }, {
                name: "author",
                type: "Author",
                relationName: "ArticleRevisionAuthorToAuthor"
            }]
    }, {
        name: "ArticleRevisionSocialMediaAuthor",
        fields: [{
                name: "revision",
                type: "ArticleRevision",
                relationName: "ArticleRevisionToArticleRevisionSocialMediaAuthor"
            }, {
                name: "author",
                type: "Author",
                relationName: "ArticleRevisionSocialMediaAuthorToAuthor"
            }]
    }, {
        name: "Article",
        fields: [{
                name: "published",
                type: "ArticleRevision",
                relationName: "publishedArticleRevision"
            }, {
                name: "pending",
                type: "ArticleRevision",
                relationName: "pendingArticleRevision"
            }, {
                name: "draft",
                type: "ArticleRevision",
                relationName: "draftArticleRevision"
            }, {
                name: "navigations",
                type: "NavigationLink",
                relationName: "ArticleToNavigationLink"
            }]
    }, {
        name: "AuthorsLinks",
        fields: [{
                name: "Author",
                type: "Author",
                relationName: "AuthorToAuthorsLinks"
            }]
    }, {
        name: "Author",
        fields: [{
                name: "links",
                type: "AuthorsLinks",
                relationName: "AuthorToAuthorsLinks"
            }, {
                name: "image",
                type: "Image",
                relationName: "AuthorToImage"
            }, {
                name: "articlesAsAuthor",
                type: "ArticleRevisionAuthor",
                relationName: "ArticleRevisionAuthorToAuthor"
            }, {
                name: "articlesAsSocialMediaAuthor",
                type: "ArticleRevisionSocialMediaAuthor",
                relationName: "ArticleRevisionSocialMediaAuthorToAuthor"
            }]
    }, {
        name: "FocalPoint",
        fields: [{
                name: "image",
                type: "Image",
                relationName: "FocalPointToImage"
            }]
    }, {
        name: "Image",
        fields: [{
                name: "focalPoint",
                type: "FocalPoint",
                relationName: "FocalPointToImage"
            }, {
                name: "Author",
                type: "Author",
                relationName: "AuthorToImage"
            }, {
                name: "MemberPlan",
                type: "MemberPlan",
                relationName: "ImageToMemberPlan"
            }, {
                name: "PeerProfile",
                type: "PeerProfile",
                relationName: "ImageToPeerProfile"
            }, {
                name: "Comment",
                type: "Comment",
                relationName: "CommentToImage"
            }, {
                name: "articleRevisionSocialMediaImages",
                type: "ArticleRevision",
                relationName: "articleRevisionSocialMediaImage"
            }, {
                name: "articleRevisionImages",
                type: "ArticleRevision",
                relationName: "articleRevisionImage"
            }, {
                name: "pageRevisionSocialMediaImages",
                type: "PageRevision",
                relationName: "pageRevisionSocialMediaImage"
            }, {
                name: "pageRevisionImages",
                type: "PageRevision",
                relationName: "pageRevisionImage"
            }, {
                name: "users",
                type: "User",
                relationName: "ImageToUser"
            }, {
                name: "events",
                type: "Event",
                relationName: "EventToImage"
            }]
    }, {
        name: "CommentsRevisions",
        fields: [{
                name: "Comment",
                type: "Comment",
                relationName: "CommentToCommentsRevisions"
            }]
    }, {
        name: "Comment",
        fields: [{
                name: "peer",
                type: "Peer",
                relationName: "CommentToPeer"
            }, {
                name: "revisions",
                type: "CommentsRevisions",
                relationName: "CommentToCommentsRevisions"
            }, {
                name: "guestUserImage",
                type: "Image",
                relationName: "CommentToImage"
            }, {
                name: "user",
                type: "User",
                relationName: "CommentToUser"
            }, {
                name: "tags",
                type: "TaggedComments",
                relationName: "CommentToTaggedComments"
            }, {
                name: "ratings",
                type: "CommentRating",
                relationName: "CommentToCommentRating"
            }, {
                name: "overriddenRatings",
                type: "CommentRatingOverride",
                relationName: "CommentToCommentRatingOverride"
            }]
    }, {
        name: "TaggedComments",
        fields: [{
                name: "comment",
                type: "Comment",
                relationName: "CommentToTaggedComments"
            }, {
                name: "tag",
                type: "Tag",
                relationName: "TagToTaggedComments"
            }]
    }, {
        name: "CommentRatingSystem",
        fields: [{
                name: "answers",
                type: "CommentRatingSystemAnswer",
                relationName: "CommentRatingSystemToCommentRatingSystemAnswer"
            }]
    }, {
        name: "CommentRatingSystemAnswer",
        fields: [{
                name: "ratingSystem",
                type: "CommentRatingSystem",
                relationName: "CommentRatingSystemToCommentRatingSystemAnswer"
            }, {
                name: "ratings",
                type: "CommentRating",
                relationName: "CommentRatingToCommentRatingSystemAnswer"
            }, {
                name: "overriddenRatings",
                type: "CommentRatingOverride",
                relationName: "CommentRatingOverrideToCommentRatingSystemAnswer"
            }]
    }, {
        name: "CommentRating",
        fields: [{
                name: "user",
                type: "User",
                relationName: "CommentRatingToUser"
            }, {
                name: "answer",
                type: "CommentRatingSystemAnswer",
                relationName: "CommentRatingToCommentRatingSystemAnswer"
            }, {
                name: "comment",
                type: "Comment",
                relationName: "CommentToCommentRating"
            }]
    }, {
        name: "CommentRatingOverride",
        fields: [{
                name: "answer",
                type: "CommentRatingSystemAnswer",
                relationName: "CommentRatingOverrideToCommentRatingSystemAnswer"
            }, {
                name: "comment",
                type: "Comment",
                relationName: "CommentToCommentRatingOverride"
            }]
    }, {
        name: "InvoiceItem",
        fields: [{
                name: "invoices",
                type: "Invoice",
                relationName: "InvoiceToInvoiceItem"
            }]
    }, {
        name: "Invoice",
        fields: [{
                name: "items",
                type: "InvoiceItem",
                relationName: "InvoiceToInvoiceItem"
            }, {
                name: "subscription",
                type: "Subscription",
                relationName: "InvoiceToSubscription"
            }, {
                name: "user",
                type: "User",
                relationName: "InvoiceToUser"
            }, {
                name: "subscriptionPeriods",
                type: "SubscriptionPeriod",
                relationName: "InvoiceToSubscriptionPeriod"
            }]
    }, {
        name: "MailLog",
        fields: [{
                name: "recipient",
                type: "User",
                relationName: "MailLogToUser"
            }, {
                name: "mailTemplate",
                type: "MailTemplate",
                relationName: "MailLogToMailTemplate"
            }]
    }, {
        name: "AvailablePaymentMethod",
        fields: [{
                name: "MemberPlan",
                type: "MemberPlan",
                relationName: "AvailablePaymentMethodToMemberPlan"
            }]
    }, {
        name: "MemberPlan",
        fields: [{
                name: "availablePaymentMethods",
                type: "AvailablePaymentMethod",
                relationName: "AvailablePaymentMethodToMemberPlan"
            }, {
                name: "image",
                type: "Image",
                relationName: "ImageToMemberPlan"
            }, {
                name: "Subscription",
                type: "Subscription",
                relationName: "MemberPlanToSubscription"
            }, {
                name: "subscriptionFlows",
                type: "SubscriptionFlow",
                relationName: "MemberPlanToSubscriptionFlow"
            }]
    }, {
        name: "NavigationLink",
        fields: [{
                name: "page",
                type: "Page",
                relationName: "NavigationLinkToPage"
            }, {
                name: "article",
                type: "Article",
                relationName: "ArticleToNavigationLink"
            }, {
                name: "navigation",
                type: "Navigation",
                relationName: "NavigationToNavigationLink"
            }]
    }, {
        name: "Navigation",
        fields: [{
                name: "links",
                type: "NavigationLink",
                relationName: "NavigationToNavigationLink"
            }]
    }, {
        name: "PageRevision",
        fields: [{
                name: "properties",
                type: "MetadataProperty",
                relationName: "MetadataPropertyToPageRevision"
            }, {
                name: "image",
                type: "Image",
                relationName: "pageRevisionImage"
            }, {
                name: "socialMediaImage",
                type: "Image",
                relationName: "pageRevisionSocialMediaImage"
            }, {
                name: "PublishedPage",
                type: "Page",
                relationName: "publishedPageRevision"
            }, {
                name: "PendingPage",
                type: "Page",
                relationName: "pendingPageRevision"
            }, {
                name: "DraftPage",
                type: "Page",
                relationName: "draftPageRevision"
            }]
    }, {
        name: "Page",
        fields: [{
                name: "published",
                type: "PageRevision",
                relationName: "publishedPageRevision"
            }, {
                name: "pending",
                type: "PageRevision",
                relationName: "pendingPageRevision"
            }, {
                name: "draft",
                type: "PageRevision",
                relationName: "draftPageRevision"
            }, {
                name: "navigations",
                type: "NavigationLink",
                relationName: "NavigationLinkToPage"
            }]
    }, {
        name: "PaymentMethod",
        fields: [{
                name: "Subscription",
                type: "Subscription",
                relationName: "PaymentMethodToSubscription"
            }, {
                name: "Payment",
                type: "Payment",
                relationName: "PaymentToPaymentMethod"
            }, {
                name: "subscriptionFlows",
                type: "SubscriptionFlow",
                relationName: "PaymentMethodToSubscriptionFlow"
            }]
    }, {
        name: "Payment",
        fields: [{
                name: "paymentMethod",
                type: "PaymentMethod",
                relationName: "PaymentToPaymentMethod"
            }]
    }, {
        name: "PeerProfile",
        fields: [{
                name: "logo",
                type: "Image",
                relationName: "ImageToPeerProfile"
            }]
    }, {
        name: "Peer",
        fields: [{
                name: "comments",
                type: "Comment",
                relationName: "CommentToPeer"
            }]
    }, {
        name: "Token",
        fields: []
    }, {
        name: "Session",
        fields: [{
                name: "user",
                type: "User",
                relationName: "SessionToUser"
            }]
    }, {
        name: "SubscriptionPeriod",
        fields: [{
                name: "invoice",
                type: "Invoice",
                relationName: "InvoiceToSubscriptionPeriod"
            }, {
                name: "subscription",
                type: "Subscription",
                relationName: "SubscriptionToSubscriptionPeriod"
            }]
    }, {
        name: "SubscriptionDeactivation",
        fields: [{
                name: "subscription",
                type: "Subscription",
                relationName: "SubscriptionToSubscriptionDeactivation"
            }]
    }, {
        name: "Subscription",
        fields: [{
                name: "periods",
                type: "SubscriptionPeriod",
                relationName: "SubscriptionToSubscriptionPeriod"
            }, {
                name: "properties",
                type: "MetadataProperty",
                relationName: "MetadataPropertyToSubscription"
            }, {
                name: "deactivation",
                type: "SubscriptionDeactivation",
                relationName: "SubscriptionToSubscriptionDeactivation"
            }, {
                name: "paymentMethod",
                type: "PaymentMethod",
                relationName: "PaymentMethodToSubscription"
            }, {
                name: "memberPlan",
                type: "MemberPlan",
                relationName: "MemberPlanToSubscription"
            }, {
                name: "user",
                type: "User",
                relationName: "SubscriptionToUser"
            }, {
                name: "invoices",
                type: "Invoice",
                relationName: "InvoiceToSubscription"
            }]
    }, {
        name: "UserAddress",
        fields: [{
                name: "User",
                type: "User",
                relationName: "UserToUserAddress"
            }]
    }, {
        name: "UserOAuth2Account",
        fields: [{
                name: "User",
                type: "User",
                relationName: "UserToUserOAuth2Account"
            }]
    }, {
        name: "PaymentProviderCustomer",
        fields: [{
                name: "User",
                type: "User",
                relationName: "PaymentProviderCustomerToUser"
            }]
    }, {
        name: "User",
        fields: [{
                name: "userImage",
                type: "Image",
                relationName: "ImageToUser"
            }, {
                name: "address",
                type: "UserAddress",
                relationName: "UserToUserAddress"
            }, {
                name: "properties",
                type: "MetadataProperty",
                relationName: "MetadataPropertyToUser"
            }, {
                name: "oauth2Accounts",
                type: "UserOAuth2Account",
                relationName: "UserToUserOAuth2Account"
            }, {
                name: "paymentProviderCustomers",
                type: "PaymentProviderCustomer",
                relationName: "PaymentProviderCustomerToUser"
            }, {
                name: "Comment",
                type: "Comment",
                relationName: "CommentToUser"
            }, {
                name: "Session",
                type: "Session",
                relationName: "SessionToUser"
            }, {
                name: "Subscription",
                type: "Subscription",
                relationName: "SubscriptionToUser"
            }, {
                name: "Invoice",
                type: "Invoice",
                relationName: "InvoiceToUser"
            }, {
                name: "CommentRating",
                type: "CommentRating",
                relationName: "CommentRatingToUser"
            }, {
                name: "PollVote",
                type: "PollVote",
                relationName: "PollVoteToUser"
            }, {
                name: "mailSent",
                type: "MailLog",
                relationName: "MailLogToUser"
            }]
    }, {
        name: "UserRole",
        fields: []
    }, {
        name: "Setting",
        fields: []
    }, {
        name: "Tag",
        fields: [{
                name: "comments",
                type: "TaggedComments",
                relationName: "TagToTaggedComments"
            }, {
                name: "events",
                type: "TaggedEvents",
                relationName: "TagToTaggedEvents"
            }]
    }, {
        name: "Poll",
        fields: [{
                name: "answers",
                type: "PollAnswer",
                relationName: "PollToPollAnswer"
            }, {
                name: "votes",
                type: "PollVote",
                relationName: "PollToPollVote"
            }, {
                name: "externalVoteSources",
                type: "PollExternalVoteSource",
                relationName: "PollToPollExternalVoteSource"
            }]
    }, {
        name: "PollAnswer",
        fields: [{
                name: "poll",
                type: "Poll",
                relationName: "PollToPollAnswer"
            }, {
                name: "votes",
                type: "PollVote",
                relationName: "PollAnswerToPollVote"
            }, {
                name: "externalVotes",
                type: "PollExternalVote",
                relationName: "PollAnswerToPollExternalVote"
            }]
    }, {
        name: "PollVote",
        fields: [{
                name: "user",
                type: "User",
                relationName: "PollVoteToUser"
            }, {
                name: "answer",
                type: "PollAnswer",
                relationName: "PollAnswerToPollVote"
            }, {
                name: "poll",
                type: "Poll",
                relationName: "PollToPollVote"
            }]
    }, {
        name: "PollExternalVoteSource",
        fields: [{
                name: "poll",
                type: "Poll",
                relationName: "PollToPollExternalVoteSource"
            }, {
                name: "voteAmounts",
                type: "PollExternalVote",
                relationName: "PollExternalVoteToPollExternalVoteSource"
            }]
    }, {
        name: "PollExternalVote",
        fields: [{
                name: "answer",
                type: "PollAnswer",
                relationName: "PollAnswerToPollExternalVote"
            }, {
                name: "source",
                type: "PollExternalVoteSource",
                relationName: "PollExternalVoteToPollExternalVoteSource"
            }]
    }, {
        name: "Event",
        fields: [{
                name: "image",
                type: "Image",
                relationName: "EventToImage"
            }, {
                name: "tags",
                type: "TaggedEvents",
                relationName: "EventToTaggedEvents"
            }]
    }, {
        name: "TaggedEvents",
        fields: [{
                name: "event",
                type: "Event",
                relationName: "EventToTaggedEvents"
            }, {
                name: "tag",
                type: "Tag",
                relationName: "TagToTaggedEvents"
            }]
    }, {
        name: "UserFlow",
        fields: [{
                name: "accountCreationMailTemplate",
                type: "MailTemplate",
                relationName: "accountCreationMailTemplate"
            }, {
                name: "passwordResetMailTemplate",
                type: "MailTemplate",
                relationName: "passwordResetMailTemplate"
            }, {
                name: "loginLinkMailTemplate",
                type: "MailTemplate",
                relationName: "loginLinkMailTemplate"
            }]
    }, {
        name: "SubscriptionFlow",
        fields: [{
                name: "memberPlan",
                type: "MemberPlan",
                relationName: "MemberPlanToSubscriptionFlow"
            }, {
                name: "paymentMethods",
                type: "PaymentMethod",
                relationName: "PaymentMethodToSubscriptionFlow"
            }, {
                name: "intervals",
                type: "SubscriptionInterval",
                relationName: "SubscriptionFlowToSubscriptionInterval"
            }]
    }, {
        name: "SubscriptionInterval",
        fields: [{
                name: "mailTemplate",
                type: "MailTemplate",
                relationName: "MailTemplateToSubscriptionInterval"
            }, {
                name: "subscriptionFlow",
                type: "SubscriptionFlow",
                relationName: "SubscriptionFlowToSubscriptionInterval"
            }]
    }, {
        name: "MailTemplate",
        fields: [{
                name: "subscriptionIntervals",
                type: "SubscriptionInterval",
                relationName: "MailTemplateToSubscriptionInterval"
            }, {
                name: "accountCreations",
                type: "UserFlow",
                relationName: "accountCreationMailTemplate"
            }, {
                name: "passwordResets",
                type: "UserFlow",
                relationName: "passwordResetMailTemplate"
            }, {
                name: "loginLinks",
                type: "UserFlow",
                relationName: "loginLinkMailTemplate"
            }, {
                name: "mailLog",
                type: "MailLog",
                relationName: "MailLogToMailTemplate"
            }]
    }, {
        name: "PeriodicJob",
        fields: []
    }];

type MetadataPropertyScalarOrEnumFields = {
    key: string;
    value: string;
    public: boolean;
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
};

function isMetadataPropertyArticleRevisionFactory(x: MetadataPropertyArticleRevisionFactory | Prisma.ArticleRevisionCreateNestedOneWithoutPropertiesInput | undefined): x is MetadataPropertyArticleRevisionFactory {
    return (x as any)?._factoryFor === "ArticleRevision";
}

function isMetadataPropertyPageRevisionFactory(x: MetadataPropertyPageRevisionFactory | Prisma.PageRevisionCreateNestedOneWithoutPropertiesInput | undefined): x is MetadataPropertyPageRevisionFactory {
    return (x as any)?._factoryFor === "PageRevision";
}

function isMetadataPropertySubscriptionFactory(x: MetadataPropertySubscriptionFactory | Prisma.SubscriptionCreateNestedOneWithoutPropertiesInput | undefined): x is MetadataPropertySubscriptionFactory {
    return (x as any)?._factoryFor === "Subscription";
}

function isMetadataPropertyUserFactory(x: MetadataPropertyUserFactory | Prisma.UserCreateNestedOneWithoutPropertiesInput | undefined): x is MetadataPropertyUserFactory {
    return (x as any)?._factoryFor === "User";
}

export interface MetadataPropertyFactoryInterface {
    readonly _factoryFor: "MetadataProperty";
    build(inputData?: Partial<Prisma.MetadataPropertyCreateInput>): PromiseLike<Prisma.MetadataPropertyCreateInput>;
    buildCreateInput(inputData?: Partial<Prisma.MetadataPropertyCreateInput>): PromiseLike<Prisma.MetadataPropertyCreateInput>;
    buildList(inputData: number | readonly Partial<Prisma.MetadataPropertyCreateInput>[]): PromiseLike<Prisma.MetadataPropertyCreateInput[]>;
    pickForConnect(inputData: MetadataProperty): Pick<MetadataProperty, "id">;
    create(inputData?: Partial<Prisma.MetadataPropertyCreateInput>): PromiseLike<MetadataProperty>;
    createList(inputData: number | readonly Partial<Prisma.MetadataPropertyCreateInput>[]): PromiseLike<MetadataProperty[]>;
    createForConnect(inputData?: Partial<Prisma.MetadataPropertyCreateInput>): PromiseLike<Pick<MetadataProperty, "id">>;
}

function autoGenerateMetadataPropertyScalarsOrEnums({ seq }: {
    readonly seq: number;
}): MetadataPropertyScalarOrEnumFields {
    return {
        key: getScalarFieldValueGenerator().String({ modelName: "MetadataProperty", fieldName: "key", isId: false, isUnique: false, seq }),
        value: getScalarFieldValueGenerator().String({ modelName: "MetadataProperty", fieldName: "value", isId: false, isUnique: false, seq }),
        public: getScalarFieldValueGenerator().Boolean({ modelName: "MetadataProperty", fieldName: "public", isId: false, isUnique: false, seq })
    };
}

function defineMetadataPropertyFactoryInternal({ defaultData: defaultDataResolver }: MetadataPropertyFactoryDefineOptions): MetadataPropertyFactoryInterface {
    const seqKey = {};
    const getSeq = () => getSequenceCounter(seqKey);
    const screen = createScreener("MetadataProperty", modelFieldDefinitions);
    const build = async (inputData: Partial<Prisma.MetadataPropertyCreateInput> = {}) => {
        const seq = getSeq();
        const requiredScalarData = autoGenerateMetadataPropertyScalarsOrEnums({ seq });
        const resolveValue = normalizeResolver<MetadataPropertyFactoryDefineInput, BuildDataOptions>(defaultDataResolver ?? {});
        const defaultData = await resolveValue({ seq });
        const defaultAssociations = {
            ArticleRevision: isMetadataPropertyArticleRevisionFactory(defaultData.ArticleRevision) ? {
                create: await defaultData.ArticleRevision.build()
            } : defaultData.ArticleRevision,
            PageRevision: isMetadataPropertyPageRevisionFactory(defaultData.PageRevision) ? {
                create: await defaultData.PageRevision.build()
            } : defaultData.PageRevision,
            Subscription: isMetadataPropertySubscriptionFactory(defaultData.Subscription) ? {
                create: await defaultData.Subscription.build()
            } : defaultData.Subscription,
            User: isMetadataPropertyUserFactory(defaultData.User) ? {
                create: await defaultData.User.build()
            } : defaultData.User
        };
        const data: Prisma.MetadataPropertyCreateInput = { ...requiredScalarData, ...defaultData, ...defaultAssociations, ...inputData };
        return data;
    };
    const buildList = (inputData: number | readonly Partial<Prisma.MetadataPropertyCreateInput>[]) => Promise.all(normalizeList(inputData).map(data => build(data)));
    const pickForConnect = (inputData: MetadataProperty) => ({
        id: inputData.id
    });
    const create = async (inputData: Partial<Prisma.MetadataPropertyCreateInput> = {}) => {
        const data = await build(inputData).then(screen);
        return await getClient<PrismaClient>().metadataProperty.create({ data });
    };
    const createList = (inputData: number | readonly Partial<Prisma.MetadataPropertyCreateInput>[]) => Promise.all(normalizeList(inputData).map(data => create(data)));
    const createForConnect = (inputData: Partial<Prisma.MetadataPropertyCreateInput> = {}) => create(inputData).then(pickForConnect);
    return {
        _factoryFor: "MetadataProperty" as const,
        build,
        buildList,
        buildCreateInput: build,
        pickForConnect,
        create,
        createList,
        createForConnect,
    };
}

/**
 * Define factory for {@link MetadataProperty} model.
 *
 * @param options
 * @returns factory {@link MetadataPropertyFactoryInterface}
 */
export function defineMetadataPropertyFactory(options: MetadataPropertyFactoryDefineOptions = {}): MetadataPropertyFactoryInterface {
    return defineMetadataPropertyFactoryInternal(options);
}

type ArticleRevisionScalarOrEnumFields = {
    breaking: boolean;
    blocks: Prisma.JsonNullValueInput | Prisma.InputJsonValue;
    hideAuthor: boolean;
};

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
    properties?: Prisma.MetadataPropertyCreateNestedManyWithoutArticleRevisionInput;
    image?: ArticleRevisionimageFactory | Prisma.ImageCreateNestedOneWithoutArticleRevisionImagesInput;
    authors?: Prisma.ArticleRevisionAuthorCreateNestedManyWithoutRevisionInput;
    breaking?: boolean;
    blocks?: Prisma.JsonNullValueInput | Prisma.InputJsonValue;
    hideAuthor?: boolean;
    socialMediaTitle?: string | null;
    socialMediaDescription?: string | null;
    socialMediaAuthors?: Prisma.ArticleRevisionSocialMediaAuthorCreateNestedManyWithoutRevisionInput;
    socialMediaImage?: ArticleRevisionsocialMediaImageFactory | Prisma.ImageCreateNestedOneWithoutArticleRevisionSocialMediaImagesInput;
    revision?: number;
    createdAt?: Date;
    modifiedAt?: Date | null;
    updatedAt?: Date | null;
    publishAt?: Date | null;
    publishedAt?: Date | null;
    PublishedArticle?: Prisma.ArticleCreateNestedManyWithoutPublishedInput;
    PendingArticle?: Prisma.ArticleCreateNestedManyWithoutPendingInput;
    DraftArticle?: Prisma.ArticleCreateNestedManyWithoutDraftInput;
};

type ArticleRevisionFactoryDefineOptions = {
    defaultData?: Resolver<ArticleRevisionFactoryDefineInput, BuildDataOptions>;
};

function isArticleRevisionimageFactory(x: ArticleRevisionimageFactory | Prisma.ImageCreateNestedOneWithoutArticleRevisionImagesInput | undefined): x is ArticleRevisionimageFactory {
    return (x as any)?._factoryFor === "Image";
}

function isArticleRevisionsocialMediaImageFactory(x: ArticleRevisionsocialMediaImageFactory | Prisma.ImageCreateNestedOneWithoutArticleRevisionSocialMediaImagesInput | undefined): x is ArticleRevisionsocialMediaImageFactory {
    return (x as any)?._factoryFor === "Image";
}

export interface ArticleRevisionFactoryInterface {
    readonly _factoryFor: "ArticleRevision";
    build(inputData?: Partial<Prisma.ArticleRevisionCreateInput>): PromiseLike<Prisma.ArticleRevisionCreateInput>;
    buildCreateInput(inputData?: Partial<Prisma.ArticleRevisionCreateInput>): PromiseLike<Prisma.ArticleRevisionCreateInput>;
    buildList(inputData: number | readonly Partial<Prisma.ArticleRevisionCreateInput>[]): PromiseLike<Prisma.ArticleRevisionCreateInput[]>;
    pickForConnect(inputData: ArticleRevision): Pick<ArticleRevision, "id">;
    create(inputData?: Partial<Prisma.ArticleRevisionCreateInput>): PromiseLike<ArticleRevision>;
    createList(inputData: number | readonly Partial<Prisma.ArticleRevisionCreateInput>[]): PromiseLike<ArticleRevision[]>;
    createForConnect(inputData?: Partial<Prisma.ArticleRevisionCreateInput>): PromiseLike<Pick<ArticleRevision, "id">>;
}

function autoGenerateArticleRevisionScalarsOrEnums({ seq }: {
    readonly seq: number;
}): ArticleRevisionScalarOrEnumFields {
    return {
        breaking: getScalarFieldValueGenerator().Boolean({ modelName: "ArticleRevision", fieldName: "breaking", isId: false, isUnique: false, seq }),
        blocks: getScalarFieldValueGenerator().Json({ modelName: "ArticleRevision", fieldName: "blocks", isId: false, isUnique: false, seq }),
        hideAuthor: getScalarFieldValueGenerator().Boolean({ modelName: "ArticleRevision", fieldName: "hideAuthor", isId: false, isUnique: false, seq })
    };
}

function defineArticleRevisionFactoryInternal({ defaultData: defaultDataResolver }: ArticleRevisionFactoryDefineOptions): ArticleRevisionFactoryInterface {
    const seqKey = {};
    const getSeq = () => getSequenceCounter(seqKey);
    const screen = createScreener("ArticleRevision", modelFieldDefinitions);
    const build = async (inputData: Partial<Prisma.ArticleRevisionCreateInput> = {}) => {
        const seq = getSeq();
        const requiredScalarData = autoGenerateArticleRevisionScalarsOrEnums({ seq });
        const resolveValue = normalizeResolver<ArticleRevisionFactoryDefineInput, BuildDataOptions>(defaultDataResolver ?? {});
        const defaultData = await resolveValue({ seq });
        const defaultAssociations = {
            image: isArticleRevisionimageFactory(defaultData.image) ? {
                create: await defaultData.image.build()
            } : defaultData.image,
            socialMediaImage: isArticleRevisionsocialMediaImageFactory(defaultData.socialMediaImage) ? {
                create: await defaultData.socialMediaImage.build()
            } : defaultData.socialMediaImage
        };
        const data: Prisma.ArticleRevisionCreateInput = { ...requiredScalarData, ...defaultData, ...defaultAssociations, ...inputData };
        return data;
    };
    const buildList = (inputData: number | readonly Partial<Prisma.ArticleRevisionCreateInput>[]) => Promise.all(normalizeList(inputData).map(data => build(data)));
    const pickForConnect = (inputData: ArticleRevision) => ({
        id: inputData.id
    });
    const create = async (inputData: Partial<Prisma.ArticleRevisionCreateInput> = {}) => {
        const data = await build(inputData).then(screen);
        return await getClient<PrismaClient>().articleRevision.create({ data });
    };
    const createList = (inputData: number | readonly Partial<Prisma.ArticleRevisionCreateInput>[]) => Promise.all(normalizeList(inputData).map(data => create(data)));
    const createForConnect = (inputData: Partial<Prisma.ArticleRevisionCreateInput> = {}) => create(inputData).then(pickForConnect);
    return {
        _factoryFor: "ArticleRevision" as const,
        build,
        buildList,
        buildCreateInput: build,
        pickForConnect,
        create,
        createList,
        createForConnect,
    };
}

/**
 * Define factory for {@link ArticleRevision} model.
 *
 * @param options
 * @returns factory {@link ArticleRevisionFactoryInterface}
 */
export function defineArticleRevisionFactory(options: ArticleRevisionFactoryDefineOptions = {}): ArticleRevisionFactoryInterface {
    return defineArticleRevisionFactoryInternal(options);
}

type ArticleRevisionAuthorScalarOrEnumFields = {};

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
};

function isArticleRevisionAuthorrevisionFactory(x: ArticleRevisionAuthorrevisionFactory | Prisma.ArticleRevisionCreateNestedOneWithoutAuthorsInput | undefined): x is ArticleRevisionAuthorrevisionFactory {
    return (x as any)?._factoryFor === "ArticleRevision";
}

function isArticleRevisionAuthorauthorFactory(x: ArticleRevisionAuthorauthorFactory | Prisma.AuthorCreateNestedOneWithoutArticlesAsAuthorInput | undefined): x is ArticleRevisionAuthorauthorFactory {
    return (x as any)?._factoryFor === "Author";
}

export interface ArticleRevisionAuthorFactoryInterface {
    readonly _factoryFor: "ArticleRevisionAuthor";
    build(inputData?: Partial<Prisma.ArticleRevisionAuthorCreateInput>): PromiseLike<Prisma.ArticleRevisionAuthorCreateInput>;
    buildCreateInput(inputData?: Partial<Prisma.ArticleRevisionAuthorCreateInput>): PromiseLike<Prisma.ArticleRevisionAuthorCreateInput>;
    buildList(inputData: number | readonly Partial<Prisma.ArticleRevisionAuthorCreateInput>[]): PromiseLike<Prisma.ArticleRevisionAuthorCreateInput[]>;
    pickForConnect(inputData: ArticleRevisionAuthor): Pick<ArticleRevisionAuthor, "revisionId" | "authorId">;
    create(inputData?: Partial<Prisma.ArticleRevisionAuthorCreateInput>): PromiseLike<ArticleRevisionAuthor>;
    createList(inputData: number | readonly Partial<Prisma.ArticleRevisionAuthorCreateInput>[]): PromiseLike<ArticleRevisionAuthor[]>;
    createForConnect(inputData?: Partial<Prisma.ArticleRevisionAuthorCreateInput>): PromiseLike<Pick<ArticleRevisionAuthor, "revisionId" | "authorId">>;
}

function autoGenerateArticleRevisionAuthorScalarsOrEnums({ seq }: {
    readonly seq: number;
}): ArticleRevisionAuthorScalarOrEnumFields {
    return {};
}

function defineArticleRevisionAuthorFactoryInternal({ defaultData: defaultDataResolver }: ArticleRevisionAuthorFactoryDefineOptions): ArticleRevisionAuthorFactoryInterface {
    const seqKey = {};
    const getSeq = () => getSequenceCounter(seqKey);
    const screen = createScreener("ArticleRevisionAuthor", modelFieldDefinitions);
    const build = async (inputData: Partial<Prisma.ArticleRevisionAuthorCreateInput> = {}) => {
        const seq = getSeq();
        const requiredScalarData = autoGenerateArticleRevisionAuthorScalarsOrEnums({ seq });
        const resolveValue = normalizeResolver<ArticleRevisionAuthorFactoryDefineInput, BuildDataOptions>(defaultDataResolver ?? {});
        const defaultData = await resolveValue({ seq });
        const defaultAssociations = {
            revision: isArticleRevisionAuthorrevisionFactory(defaultData.revision) ? {
                create: await defaultData.revision.build()
            } : defaultData.revision,
            author: isArticleRevisionAuthorauthorFactory(defaultData.author) ? {
                create: await defaultData.author.build()
            } : defaultData.author
        };
        const data: Prisma.ArticleRevisionAuthorCreateInput = { ...requiredScalarData, ...defaultData, ...defaultAssociations, ...inputData };
        return data;
    };
    const buildList = (inputData: number | readonly Partial<Prisma.ArticleRevisionAuthorCreateInput>[]) => Promise.all(normalizeList(inputData).map(data => build(data)));
    const pickForConnect = (inputData: ArticleRevisionAuthor) => ({
        revisionId: inputData.revisionId,
        authorId: inputData.authorId
    });
    const create = async (inputData: Partial<Prisma.ArticleRevisionAuthorCreateInput> = {}) => {
        const data = await build(inputData).then(screen);
        return await getClient<PrismaClient>().articleRevisionAuthor.create({ data });
    };
    const createList = (inputData: number | readonly Partial<Prisma.ArticleRevisionAuthorCreateInput>[]) => Promise.all(normalizeList(inputData).map(data => create(data)));
    const createForConnect = (inputData: Partial<Prisma.ArticleRevisionAuthorCreateInput> = {}) => create(inputData).then(pickForConnect);
    return {
        _factoryFor: "ArticleRevisionAuthor" as const,
        build,
        buildList,
        buildCreateInput: build,
        pickForConnect,
        create,
        createList,
        createForConnect,
    };
}

/**
 * Define factory for {@link ArticleRevisionAuthor} model.
 *
 * @param options
 * @returns factory {@link ArticleRevisionAuthorFactoryInterface}
 */
export function defineArticleRevisionAuthorFactory(options: ArticleRevisionAuthorFactoryDefineOptions): ArticleRevisionAuthorFactoryInterface {
    return defineArticleRevisionAuthorFactoryInternal(options);
}

type ArticleRevisionSocialMediaAuthorScalarOrEnumFields = {};

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
};

function isArticleRevisionSocialMediaAuthorrevisionFactory(x: ArticleRevisionSocialMediaAuthorrevisionFactory | Prisma.ArticleRevisionCreateNestedOneWithoutSocialMediaAuthorsInput | undefined): x is ArticleRevisionSocialMediaAuthorrevisionFactory {
    return (x as any)?._factoryFor === "ArticleRevision";
}

function isArticleRevisionSocialMediaAuthorauthorFactory(x: ArticleRevisionSocialMediaAuthorauthorFactory | Prisma.AuthorCreateNestedOneWithoutArticlesAsSocialMediaAuthorInput | undefined): x is ArticleRevisionSocialMediaAuthorauthorFactory {
    return (x as any)?._factoryFor === "Author";
}

export interface ArticleRevisionSocialMediaAuthorFactoryInterface {
    readonly _factoryFor: "ArticleRevisionSocialMediaAuthor";
    build(inputData?: Partial<Prisma.ArticleRevisionSocialMediaAuthorCreateInput>): PromiseLike<Prisma.ArticleRevisionSocialMediaAuthorCreateInput>;
    buildCreateInput(inputData?: Partial<Prisma.ArticleRevisionSocialMediaAuthorCreateInput>): PromiseLike<Prisma.ArticleRevisionSocialMediaAuthorCreateInput>;
    buildList(inputData: number | readonly Partial<Prisma.ArticleRevisionSocialMediaAuthorCreateInput>[]): PromiseLike<Prisma.ArticleRevisionSocialMediaAuthorCreateInput[]>;
    pickForConnect(inputData: ArticleRevisionSocialMediaAuthor): Pick<ArticleRevisionSocialMediaAuthor, "revisionId" | "authorId">;
    create(inputData?: Partial<Prisma.ArticleRevisionSocialMediaAuthorCreateInput>): PromiseLike<ArticleRevisionSocialMediaAuthor>;
    createList(inputData: number | readonly Partial<Prisma.ArticleRevisionSocialMediaAuthorCreateInput>[]): PromiseLike<ArticleRevisionSocialMediaAuthor[]>;
    createForConnect(inputData?: Partial<Prisma.ArticleRevisionSocialMediaAuthorCreateInput>): PromiseLike<Pick<ArticleRevisionSocialMediaAuthor, "revisionId" | "authorId">>;
}

function autoGenerateArticleRevisionSocialMediaAuthorScalarsOrEnums({ seq }: {
    readonly seq: number;
}): ArticleRevisionSocialMediaAuthorScalarOrEnumFields {
    return {};
}

function defineArticleRevisionSocialMediaAuthorFactoryInternal({ defaultData: defaultDataResolver }: ArticleRevisionSocialMediaAuthorFactoryDefineOptions): ArticleRevisionSocialMediaAuthorFactoryInterface {
    const seqKey = {};
    const getSeq = () => getSequenceCounter(seqKey);
    const screen = createScreener("ArticleRevisionSocialMediaAuthor", modelFieldDefinitions);
    const build = async (inputData: Partial<Prisma.ArticleRevisionSocialMediaAuthorCreateInput> = {}) => {
        const seq = getSeq();
        const requiredScalarData = autoGenerateArticleRevisionSocialMediaAuthorScalarsOrEnums({ seq });
        const resolveValue = normalizeResolver<ArticleRevisionSocialMediaAuthorFactoryDefineInput, BuildDataOptions>(defaultDataResolver ?? {});
        const defaultData = await resolveValue({ seq });
        const defaultAssociations = {
            revision: isArticleRevisionSocialMediaAuthorrevisionFactory(defaultData.revision) ? {
                create: await defaultData.revision.build()
            } : defaultData.revision,
            author: isArticleRevisionSocialMediaAuthorauthorFactory(defaultData.author) ? {
                create: await defaultData.author.build()
            } : defaultData.author
        };
        const data: Prisma.ArticleRevisionSocialMediaAuthorCreateInput = { ...requiredScalarData, ...defaultData, ...defaultAssociations, ...inputData };
        return data;
    };
    const buildList = (inputData: number | readonly Partial<Prisma.ArticleRevisionSocialMediaAuthorCreateInput>[]) => Promise.all(normalizeList(inputData).map(data => build(data)));
    const pickForConnect = (inputData: ArticleRevisionSocialMediaAuthor) => ({
        revisionId: inputData.revisionId,
        authorId: inputData.authorId
    });
    const create = async (inputData: Partial<Prisma.ArticleRevisionSocialMediaAuthorCreateInput> = {}) => {
        const data = await build(inputData).then(screen);
        return await getClient<PrismaClient>().articleRevisionSocialMediaAuthor.create({ data });
    };
    const createList = (inputData: number | readonly Partial<Prisma.ArticleRevisionSocialMediaAuthorCreateInput>[]) => Promise.all(normalizeList(inputData).map(data => create(data)));
    const createForConnect = (inputData: Partial<Prisma.ArticleRevisionSocialMediaAuthorCreateInput> = {}) => create(inputData).then(pickForConnect);
    return {
        _factoryFor: "ArticleRevisionSocialMediaAuthor" as const,
        build,
        buildList,
        buildCreateInput: build,
        pickForConnect,
        create,
        createList,
        createForConnect,
    };
}

/**
 * Define factory for {@link ArticleRevisionSocialMediaAuthor} model.
 *
 * @param options
 * @returns factory {@link ArticleRevisionSocialMediaAuthorFactoryInterface}
 */
export function defineArticleRevisionSocialMediaAuthorFactory(options: ArticleRevisionSocialMediaAuthorFactoryDefineOptions): ArticleRevisionSocialMediaAuthorFactoryInterface {
    return defineArticleRevisionSocialMediaAuthorFactoryInternal(options);
}

type ArticleScalarOrEnumFields = {
    shared: boolean;
};

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
    published?: ArticlepublishedFactory | Prisma.ArticleRevisionCreateNestedOneWithoutPublishedArticleInput;
    pending?: ArticlependingFactory | Prisma.ArticleRevisionCreateNestedOneWithoutPendingArticleInput;
    draft?: ArticledraftFactory | Prisma.ArticleRevisionCreateNestedOneWithoutDraftArticleInput;
    shared?: boolean;
    navigations?: Prisma.NavigationLinkCreateNestedManyWithoutArticleInput;
};

type ArticleFactoryDefineOptions = {
    defaultData?: Resolver<ArticleFactoryDefineInput, BuildDataOptions>;
};

function isArticlepublishedFactory(x: ArticlepublishedFactory | Prisma.ArticleRevisionCreateNestedOneWithoutPublishedArticleInput | undefined): x is ArticlepublishedFactory {
    return (x as any)?._factoryFor === "ArticleRevision";
}

function isArticlependingFactory(x: ArticlependingFactory | Prisma.ArticleRevisionCreateNestedOneWithoutPendingArticleInput | undefined): x is ArticlependingFactory {
    return (x as any)?._factoryFor === "ArticleRevision";
}

function isArticledraftFactory(x: ArticledraftFactory | Prisma.ArticleRevisionCreateNestedOneWithoutDraftArticleInput | undefined): x is ArticledraftFactory {
    return (x as any)?._factoryFor === "ArticleRevision";
}

export interface ArticleFactoryInterface {
    readonly _factoryFor: "Article";
    build(inputData?: Partial<Prisma.ArticleCreateInput>): PromiseLike<Prisma.ArticleCreateInput>;
    buildCreateInput(inputData?: Partial<Prisma.ArticleCreateInput>): PromiseLike<Prisma.ArticleCreateInput>;
    buildList(inputData: number | readonly Partial<Prisma.ArticleCreateInput>[]): PromiseLike<Prisma.ArticleCreateInput[]>;
    pickForConnect(inputData: Article): Pick<Article, "id">;
    create(inputData?: Partial<Prisma.ArticleCreateInput>): PromiseLike<Article>;
    createList(inputData: number | readonly Partial<Prisma.ArticleCreateInput>[]): PromiseLike<Article[]>;
    createForConnect(inputData?: Partial<Prisma.ArticleCreateInput>): PromiseLike<Pick<Article, "id">>;
}

function autoGenerateArticleScalarsOrEnums({ seq }: {
    readonly seq: number;
}): ArticleScalarOrEnumFields {
    return {
        shared: getScalarFieldValueGenerator().Boolean({ modelName: "Article", fieldName: "shared", isId: false, isUnique: false, seq })
    };
}

function defineArticleFactoryInternal({ defaultData: defaultDataResolver }: ArticleFactoryDefineOptions): ArticleFactoryInterface {
    const seqKey = {};
    const getSeq = () => getSequenceCounter(seqKey);
    const screen = createScreener("Article", modelFieldDefinitions);
    const build = async (inputData: Partial<Prisma.ArticleCreateInput> = {}) => {
        const seq = getSeq();
        const requiredScalarData = autoGenerateArticleScalarsOrEnums({ seq });
        const resolveValue = normalizeResolver<ArticleFactoryDefineInput, BuildDataOptions>(defaultDataResolver ?? {});
        const defaultData = await resolveValue({ seq });
        const defaultAssociations = {
            published: isArticlepublishedFactory(defaultData.published) ? {
                create: await defaultData.published.build()
            } : defaultData.published,
            pending: isArticlependingFactory(defaultData.pending) ? {
                create: await defaultData.pending.build()
            } : defaultData.pending,
            draft: isArticledraftFactory(defaultData.draft) ? {
                create: await defaultData.draft.build()
            } : defaultData.draft
        };
        const data: Prisma.ArticleCreateInput = { ...requiredScalarData, ...defaultData, ...defaultAssociations, ...inputData };
        return data;
    };
    const buildList = (inputData: number | readonly Partial<Prisma.ArticleCreateInput>[]) => Promise.all(normalizeList(inputData).map(data => build(data)));
    const pickForConnect = (inputData: Article) => ({
        id: inputData.id
    });
    const create = async (inputData: Partial<Prisma.ArticleCreateInput> = {}) => {
        const data = await build(inputData).then(screen);
        return await getClient<PrismaClient>().article.create({ data });
    };
    const createList = (inputData: number | readonly Partial<Prisma.ArticleCreateInput>[]) => Promise.all(normalizeList(inputData).map(data => create(data)));
    const createForConnect = (inputData: Partial<Prisma.ArticleCreateInput> = {}) => create(inputData).then(pickForConnect);
    return {
        _factoryFor: "Article" as const,
        build,
        buildList,
        buildCreateInput: build,
        pickForConnect,
        create,
        createList,
        createForConnect,
    };
}

/**
 * Define factory for {@link Article} model.
 *
 * @param options
 * @returns factory {@link ArticleFactoryInterface}
 */
export function defineArticleFactory(options: ArticleFactoryDefineOptions = {}): ArticleFactoryInterface {
    return defineArticleFactoryInternal(options);
}

type AuthorsLinksScalarOrEnumFields = {
    title: string;
    url: string;
};

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
};

function isAuthorsLinksAuthorFactory(x: AuthorsLinksAuthorFactory | Prisma.AuthorCreateNestedOneWithoutLinksInput | undefined): x is AuthorsLinksAuthorFactory {
    return (x as any)?._factoryFor === "Author";
}

export interface AuthorsLinksFactoryInterface {
    readonly _factoryFor: "AuthorsLinks";
    build(inputData?: Partial<Prisma.AuthorsLinksCreateInput>): PromiseLike<Prisma.AuthorsLinksCreateInput>;
    buildCreateInput(inputData?: Partial<Prisma.AuthorsLinksCreateInput>): PromiseLike<Prisma.AuthorsLinksCreateInput>;
    buildList(inputData: number | readonly Partial<Prisma.AuthorsLinksCreateInput>[]): PromiseLike<Prisma.AuthorsLinksCreateInput[]>;
    pickForConnect(inputData: AuthorsLinks): Pick<AuthorsLinks, "id">;
    create(inputData?: Partial<Prisma.AuthorsLinksCreateInput>): PromiseLike<AuthorsLinks>;
    createList(inputData: number | readonly Partial<Prisma.AuthorsLinksCreateInput>[]): PromiseLike<AuthorsLinks[]>;
    createForConnect(inputData?: Partial<Prisma.AuthorsLinksCreateInput>): PromiseLike<Pick<AuthorsLinks, "id">>;
}

function autoGenerateAuthorsLinksScalarsOrEnums({ seq }: {
    readonly seq: number;
}): AuthorsLinksScalarOrEnumFields {
    return {
        title: getScalarFieldValueGenerator().String({ modelName: "AuthorsLinks", fieldName: "title", isId: false, isUnique: false, seq }),
        url: getScalarFieldValueGenerator().String({ modelName: "AuthorsLinks", fieldName: "url", isId: false, isUnique: false, seq })
    };
}

function defineAuthorsLinksFactoryInternal({ defaultData: defaultDataResolver }: AuthorsLinksFactoryDefineOptions): AuthorsLinksFactoryInterface {
    const seqKey = {};
    const getSeq = () => getSequenceCounter(seqKey);
    const screen = createScreener("AuthorsLinks", modelFieldDefinitions);
    const build = async (inputData: Partial<Prisma.AuthorsLinksCreateInput> = {}) => {
        const seq = getSeq();
        const requiredScalarData = autoGenerateAuthorsLinksScalarsOrEnums({ seq });
        const resolveValue = normalizeResolver<AuthorsLinksFactoryDefineInput, BuildDataOptions>(defaultDataResolver ?? {});
        const defaultData = await resolveValue({ seq });
        const defaultAssociations = {
            Author: isAuthorsLinksAuthorFactory(defaultData.Author) ? {
                create: await defaultData.Author.build()
            } : defaultData.Author
        };
        const data: Prisma.AuthorsLinksCreateInput = { ...requiredScalarData, ...defaultData, ...defaultAssociations, ...inputData };
        return data;
    };
    const buildList = (inputData: number | readonly Partial<Prisma.AuthorsLinksCreateInput>[]) => Promise.all(normalizeList(inputData).map(data => build(data)));
    const pickForConnect = (inputData: AuthorsLinks) => ({
        id: inputData.id
    });
    const create = async (inputData: Partial<Prisma.AuthorsLinksCreateInput> = {}) => {
        const data = await build(inputData).then(screen);
        return await getClient<PrismaClient>().authorsLinks.create({ data });
    };
    const createList = (inputData: number | readonly Partial<Prisma.AuthorsLinksCreateInput>[]) => Promise.all(normalizeList(inputData).map(data => create(data)));
    const createForConnect = (inputData: Partial<Prisma.AuthorsLinksCreateInput> = {}) => create(inputData).then(pickForConnect);
    return {
        _factoryFor: "AuthorsLinks" as const,
        build,
        buildList,
        buildCreateInput: build,
        pickForConnect,
        create,
        createList,
        createForConnect,
    };
}

/**
 * Define factory for {@link AuthorsLinks} model.
 *
 * @param options
 * @returns factory {@link AuthorsLinksFactoryInterface}
 */
export function defineAuthorsLinksFactory(options: AuthorsLinksFactoryDefineOptions = {}): AuthorsLinksFactoryInterface {
    return defineAuthorsLinksFactoryInternal(options);
}

type AuthorScalarOrEnumFields = {
    name: string;
    slug: string;
    bio: Prisma.JsonNullValueInput | Prisma.InputJsonValue;
};

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
    links?: Prisma.AuthorsLinksCreateNestedManyWithoutAuthorInput;
    bio?: Prisma.JsonNullValueInput | Prisma.InputJsonValue;
    image?: AuthorimageFactory | Prisma.ImageCreateNestedOneWithoutAuthorInput;
    articlesAsAuthor?: Prisma.ArticleRevisionAuthorCreateNestedManyWithoutAuthorInput;
    articlesAsSocialMediaAuthor?: Prisma.ArticleRevisionSocialMediaAuthorCreateNestedManyWithoutAuthorInput;
};

type AuthorFactoryDefineOptions = {
    defaultData?: Resolver<AuthorFactoryDefineInput, BuildDataOptions>;
};

function isAuthorimageFactory(x: AuthorimageFactory | Prisma.ImageCreateNestedOneWithoutAuthorInput | undefined): x is AuthorimageFactory {
    return (x as any)?._factoryFor === "Image";
}

export interface AuthorFactoryInterface {
    readonly _factoryFor: "Author";
    build(inputData?: Partial<Prisma.AuthorCreateInput>): PromiseLike<Prisma.AuthorCreateInput>;
    buildCreateInput(inputData?: Partial<Prisma.AuthorCreateInput>): PromiseLike<Prisma.AuthorCreateInput>;
    buildList(inputData: number | readonly Partial<Prisma.AuthorCreateInput>[]): PromiseLike<Prisma.AuthorCreateInput[]>;
    pickForConnect(inputData: Author): Pick<Author, "id">;
    create(inputData?: Partial<Prisma.AuthorCreateInput>): PromiseLike<Author>;
    createList(inputData: number | readonly Partial<Prisma.AuthorCreateInput>[]): PromiseLike<Author[]>;
    createForConnect(inputData?: Partial<Prisma.AuthorCreateInput>): PromiseLike<Pick<Author, "id">>;
}

function autoGenerateAuthorScalarsOrEnums({ seq }: {
    readonly seq: number;
}): AuthorScalarOrEnumFields {
    return {
        name: getScalarFieldValueGenerator().String({ modelName: "Author", fieldName: "name", isId: false, isUnique: false, seq }),
        slug: getScalarFieldValueGenerator().String({ modelName: "Author", fieldName: "slug", isId: false, isUnique: true, seq }),
        bio: getScalarFieldValueGenerator().Json({ modelName: "Author", fieldName: "bio", isId: false, isUnique: false, seq })
    };
}

function defineAuthorFactoryInternal({ defaultData: defaultDataResolver }: AuthorFactoryDefineOptions): AuthorFactoryInterface {
    const seqKey = {};
    const getSeq = () => getSequenceCounter(seqKey);
    const screen = createScreener("Author", modelFieldDefinitions);
    const build = async (inputData: Partial<Prisma.AuthorCreateInput> = {}) => {
        const seq = getSeq();
        const requiredScalarData = autoGenerateAuthorScalarsOrEnums({ seq });
        const resolveValue = normalizeResolver<AuthorFactoryDefineInput, BuildDataOptions>(defaultDataResolver ?? {});
        const defaultData = await resolveValue({ seq });
        const defaultAssociations = {
            image: isAuthorimageFactory(defaultData.image) ? {
                create: await defaultData.image.build()
            } : defaultData.image
        };
        const data: Prisma.AuthorCreateInput = { ...requiredScalarData, ...defaultData, ...defaultAssociations, ...inputData };
        return data;
    };
    const buildList = (inputData: number | readonly Partial<Prisma.AuthorCreateInput>[]) => Promise.all(normalizeList(inputData).map(data => build(data)));
    const pickForConnect = (inputData: Author) => ({
        id: inputData.id
    });
    const create = async (inputData: Partial<Prisma.AuthorCreateInput> = {}) => {
        const data = await build(inputData).then(screen);
        return await getClient<PrismaClient>().author.create({ data });
    };
    const createList = (inputData: number | readonly Partial<Prisma.AuthorCreateInput>[]) => Promise.all(normalizeList(inputData).map(data => create(data)));
    const createForConnect = (inputData: Partial<Prisma.AuthorCreateInput> = {}) => create(inputData).then(pickForConnect);
    return {
        _factoryFor: "Author" as const,
        build,
        buildList,
        buildCreateInput: build,
        pickForConnect,
        create,
        createList,
        createForConnect,
    };
}

/**
 * Define factory for {@link Author} model.
 *
 * @param options
 * @returns factory {@link AuthorFactoryInterface}
 */
export function defineAuthorFactory(options: AuthorFactoryDefineOptions = {}): AuthorFactoryInterface {
    return defineAuthorFactoryInternal(options);
}

type FocalPointScalarOrEnumFields = {};

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
};

function isFocalPointimageFactory(x: FocalPointimageFactory | Prisma.ImageCreateNestedOneWithoutFocalPointInput | undefined): x is FocalPointimageFactory {
    return (x as any)?._factoryFor === "Image";
}

export interface FocalPointFactoryInterface {
    readonly _factoryFor: "FocalPoint";
    build(inputData?: Partial<Prisma.FocalPointCreateInput>): PromiseLike<Prisma.FocalPointCreateInput>;
    buildCreateInput(inputData?: Partial<Prisma.FocalPointCreateInput>): PromiseLike<Prisma.FocalPointCreateInput>;
    buildList(inputData: number | readonly Partial<Prisma.FocalPointCreateInput>[]): PromiseLike<Prisma.FocalPointCreateInput[]>;
    pickForConnect(inputData: FocalPoint): Pick<FocalPoint, "imageId">;
    create(inputData?: Partial<Prisma.FocalPointCreateInput>): PromiseLike<FocalPoint>;
    createList(inputData: number | readonly Partial<Prisma.FocalPointCreateInput>[]): PromiseLike<FocalPoint[]>;
    createForConnect(inputData?: Partial<Prisma.FocalPointCreateInput>): PromiseLike<Pick<FocalPoint, "imageId">>;
}

function autoGenerateFocalPointScalarsOrEnums({ seq }: {
    readonly seq: number;
}): FocalPointScalarOrEnumFields {
    return {};
}

function defineFocalPointFactoryInternal({ defaultData: defaultDataResolver }: FocalPointFactoryDefineOptions): FocalPointFactoryInterface {
    const seqKey = {};
    const getSeq = () => getSequenceCounter(seqKey);
    const screen = createScreener("FocalPoint", modelFieldDefinitions);
    const build = async (inputData: Partial<Prisma.FocalPointCreateInput> = {}) => {
        const seq = getSeq();
        const requiredScalarData = autoGenerateFocalPointScalarsOrEnums({ seq });
        const resolveValue = normalizeResolver<FocalPointFactoryDefineInput, BuildDataOptions>(defaultDataResolver ?? {});
        const defaultData = await resolveValue({ seq });
        const defaultAssociations = {
            image: isFocalPointimageFactory(defaultData.image) ? {
                create: await defaultData.image.build()
            } : defaultData.image
        };
        const data: Prisma.FocalPointCreateInput = { ...requiredScalarData, ...defaultData, ...defaultAssociations, ...inputData };
        return data;
    };
    const buildList = (inputData: number | readonly Partial<Prisma.FocalPointCreateInput>[]) => Promise.all(normalizeList(inputData).map(data => build(data)));
    const pickForConnect = (inputData: FocalPoint) => ({
        imageId: inputData.imageId
    });
    const create = async (inputData: Partial<Prisma.FocalPointCreateInput> = {}) => {
        const data = await build(inputData).then(screen);
        return await getClient<PrismaClient>().focalPoint.create({ data });
    };
    const createList = (inputData: number | readonly Partial<Prisma.FocalPointCreateInput>[]) => Promise.all(normalizeList(inputData).map(data => create(data)));
    const createForConnect = (inputData: Partial<Prisma.FocalPointCreateInput> = {}) => create(inputData).then(pickForConnect);
    return {
        _factoryFor: "FocalPoint" as const,
        build,
        buildList,
        buildCreateInput: build,
        pickForConnect,
        create,
        createList,
        createForConnect,
    };
}

/**
 * Define factory for {@link FocalPoint} model.
 *
 * @param options
 * @returns factory {@link FocalPointFactoryInterface}
 */
export function defineFocalPointFactory(options: FocalPointFactoryDefineOptions = {}): FocalPointFactoryInterface {
    return defineFocalPointFactoryInternal(options);
}

type ImageScalarOrEnumFields = {
    id: string;
    extension: string;
    fileSize: number;
    format: string;
    mimeType: string;
    height: number;
    width: number;
};

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
    focalPoint?: ImagefocalPointFactory | Prisma.FocalPointCreateNestedOneWithoutImageInput;
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
};

function isImagefocalPointFactory(x: ImagefocalPointFactory | Prisma.FocalPointCreateNestedOneWithoutImageInput | undefined): x is ImagefocalPointFactory {
    return (x as any)?._factoryFor === "FocalPoint";
}

export interface ImageFactoryInterface {
    readonly _factoryFor: "Image";
    build(inputData?: Partial<Prisma.ImageCreateInput>): PromiseLike<Prisma.ImageCreateInput>;
    buildCreateInput(inputData?: Partial<Prisma.ImageCreateInput>): PromiseLike<Prisma.ImageCreateInput>;
    buildList(inputData: number | readonly Partial<Prisma.ImageCreateInput>[]): PromiseLike<Prisma.ImageCreateInput[]>;
    pickForConnect(inputData: Image): Pick<Image, "id">;
    create(inputData?: Partial<Prisma.ImageCreateInput>): PromiseLike<Image>;
    createList(inputData: number | readonly Partial<Prisma.ImageCreateInput>[]): PromiseLike<Image[]>;
    createForConnect(inputData?: Partial<Prisma.ImageCreateInput>): PromiseLike<Pick<Image, "id">>;
}

function autoGenerateImageScalarsOrEnums({ seq }: {
    readonly seq: number;
}): ImageScalarOrEnumFields {
    return {
        id: getScalarFieldValueGenerator().String({ modelName: "Image", fieldName: "id", isId: true, isUnique: false, seq }),
        extension: getScalarFieldValueGenerator().String({ modelName: "Image", fieldName: "extension", isId: false, isUnique: false, seq }),
        fileSize: getScalarFieldValueGenerator().Int({ modelName: "Image", fieldName: "fileSize", isId: false, isUnique: false, seq }),
        format: getScalarFieldValueGenerator().String({ modelName: "Image", fieldName: "format", isId: false, isUnique: false, seq }),
        mimeType: getScalarFieldValueGenerator().String({ modelName: "Image", fieldName: "mimeType", isId: false, isUnique: false, seq }),
        height: getScalarFieldValueGenerator().Int({ modelName: "Image", fieldName: "height", isId: false, isUnique: false, seq }),
        width: getScalarFieldValueGenerator().Int({ modelName: "Image", fieldName: "width", isId: false, isUnique: false, seq })
    };
}

function defineImageFactoryInternal({ defaultData: defaultDataResolver }: ImageFactoryDefineOptions): ImageFactoryInterface {
    const seqKey = {};
    const getSeq = () => getSequenceCounter(seqKey);
    const screen = createScreener("Image", modelFieldDefinitions);
    const build = async (inputData: Partial<Prisma.ImageCreateInput> = {}) => {
        const seq = getSeq();
        const requiredScalarData = autoGenerateImageScalarsOrEnums({ seq });
        const resolveValue = normalizeResolver<ImageFactoryDefineInput, BuildDataOptions>(defaultDataResolver ?? {});
        const defaultData = await resolveValue({ seq });
        const defaultAssociations = {
            focalPoint: isImagefocalPointFactory(defaultData.focalPoint) ? {
                create: await defaultData.focalPoint.build()
            } : defaultData.focalPoint
        };
        const data: Prisma.ImageCreateInput = { ...requiredScalarData, ...defaultData, ...defaultAssociations, ...inputData };
        return data;
    };
    const buildList = (inputData: number | readonly Partial<Prisma.ImageCreateInput>[]) => Promise.all(normalizeList(inputData).map(data => build(data)));
    const pickForConnect = (inputData: Image) => ({
        id: inputData.id
    });
    const create = async (inputData: Partial<Prisma.ImageCreateInput> = {}) => {
        const data = await build(inputData).then(screen);
        return await getClient<PrismaClient>().image.create({ data });
    };
    const createList = (inputData: number | readonly Partial<Prisma.ImageCreateInput>[]) => Promise.all(normalizeList(inputData).map(data => create(data)));
    const createForConnect = (inputData: Partial<Prisma.ImageCreateInput> = {}) => create(inputData).then(pickForConnect);
    return {
        _factoryFor: "Image" as const,
        build,
        buildList,
        buildCreateInput: build,
        pickForConnect,
        create,
        createList,
        createForConnect,
    };
}

/**
 * Define factory for {@link Image} model.
 *
 * @param options
 * @returns factory {@link ImageFactoryInterface}
 */
export function defineImageFactory(options: ImageFactoryDefineOptions = {}): ImageFactoryInterface {
    return defineImageFactoryInternal(options);
}

type CommentsRevisionsScalarOrEnumFields = {};

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
};

function isCommentsRevisionsCommentFactory(x: CommentsRevisionsCommentFactory | Prisma.CommentCreateNestedOneWithoutRevisionsInput | undefined): x is CommentsRevisionsCommentFactory {
    return (x as any)?._factoryFor === "Comment";
}

export interface CommentsRevisionsFactoryInterface {
    readonly _factoryFor: "CommentsRevisions";
    build(inputData?: Partial<Prisma.CommentsRevisionsCreateInput>): PromiseLike<Prisma.CommentsRevisionsCreateInput>;
    buildCreateInput(inputData?: Partial<Prisma.CommentsRevisionsCreateInput>): PromiseLike<Prisma.CommentsRevisionsCreateInput>;
    buildList(inputData: number | readonly Partial<Prisma.CommentsRevisionsCreateInput>[]): PromiseLike<Prisma.CommentsRevisionsCreateInput[]>;
    pickForConnect(inputData: CommentsRevisions): Pick<CommentsRevisions, "id">;
    create(inputData?: Partial<Prisma.CommentsRevisionsCreateInput>): PromiseLike<CommentsRevisions>;
    createList(inputData: number | readonly Partial<Prisma.CommentsRevisionsCreateInput>[]): PromiseLike<CommentsRevisions[]>;
    createForConnect(inputData?: Partial<Prisma.CommentsRevisionsCreateInput>): PromiseLike<Pick<CommentsRevisions, "id">>;
}

function autoGenerateCommentsRevisionsScalarsOrEnums({ seq }: {
    readonly seq: number;
}): CommentsRevisionsScalarOrEnumFields {
    return {};
}

function defineCommentsRevisionsFactoryInternal({ defaultData: defaultDataResolver }: CommentsRevisionsFactoryDefineOptions): CommentsRevisionsFactoryInterface {
    const seqKey = {};
    const getSeq = () => getSequenceCounter(seqKey);
    const screen = createScreener("CommentsRevisions", modelFieldDefinitions);
    const build = async (inputData: Partial<Prisma.CommentsRevisionsCreateInput> = {}) => {
        const seq = getSeq();
        const requiredScalarData = autoGenerateCommentsRevisionsScalarsOrEnums({ seq });
        const resolveValue = normalizeResolver<CommentsRevisionsFactoryDefineInput, BuildDataOptions>(defaultDataResolver ?? {});
        const defaultData = await resolveValue({ seq });
        const defaultAssociations = {
            Comment: isCommentsRevisionsCommentFactory(defaultData.Comment) ? {
                create: await defaultData.Comment.build()
            } : defaultData.Comment
        };
        const data: Prisma.CommentsRevisionsCreateInput = { ...requiredScalarData, ...defaultData, ...defaultAssociations, ...inputData };
        return data;
    };
    const buildList = (inputData: number | readonly Partial<Prisma.CommentsRevisionsCreateInput>[]) => Promise.all(normalizeList(inputData).map(data => build(data)));
    const pickForConnect = (inputData: CommentsRevisions) => ({
        id: inputData.id
    });
    const create = async (inputData: Partial<Prisma.CommentsRevisionsCreateInput> = {}) => {
        const data = await build(inputData).then(screen);
        return await getClient<PrismaClient>().commentsRevisions.create({ data });
    };
    const createList = (inputData: number | readonly Partial<Prisma.CommentsRevisionsCreateInput>[]) => Promise.all(normalizeList(inputData).map(data => create(data)));
    const createForConnect = (inputData: Partial<Prisma.CommentsRevisionsCreateInput> = {}) => create(inputData).then(pickForConnect);
    return {
        _factoryFor: "CommentsRevisions" as const,
        build,
        buildList,
        buildCreateInput: build,
        pickForConnect,
        create,
        createList,
        createForConnect,
    };
}

/**
 * Define factory for {@link CommentsRevisions} model.
 *
 * @param options
 * @returns factory {@link CommentsRevisionsFactoryInterface}
 */
export function defineCommentsRevisionsFactory(options: CommentsRevisionsFactoryDefineOptions = {}): CommentsRevisionsFactoryInterface {
    return defineCommentsRevisionsFactoryInternal(options);
}

type CommentScalarOrEnumFields = {
    itemID: string;
    itemType: CommentItemType;
    state: CommentState;
    authorType: CommentAuthorType;
};

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
    peer?: CommentpeerFactory | Prisma.PeerCreateNestedOneWithoutCommentsInput;
    parentID?: string | null;
    revisions?: Prisma.CommentsRevisionsCreateNestedManyWithoutCommentInput;
    rejectionReason?: CommentRejectionReason | null;
    state?: CommentState;
    source?: string | null;
    authorType?: CommentAuthorType;
    guestUsername?: string | null;
    guestUserImage?: CommentguestUserImageFactory | Prisma.ImageCreateNestedOneWithoutCommentInput;
    user?: CommentuserFactory | Prisma.UserCreateNestedOneWithoutCommentInput;
    tags?: Prisma.TaggedCommentsCreateNestedManyWithoutCommentInput;
    ratings?: Prisma.CommentRatingCreateNestedManyWithoutCommentInput;
    overriddenRatings?: Prisma.CommentRatingOverrideCreateNestedManyWithoutCommentInput;
};

type CommentFactoryDefineOptions = {
    defaultData?: Resolver<CommentFactoryDefineInput, BuildDataOptions>;
};

function isCommentpeerFactory(x: CommentpeerFactory | Prisma.PeerCreateNestedOneWithoutCommentsInput | undefined): x is CommentpeerFactory {
    return (x as any)?._factoryFor === "Peer";
}

function isCommentguestUserImageFactory(x: CommentguestUserImageFactory | Prisma.ImageCreateNestedOneWithoutCommentInput | undefined): x is CommentguestUserImageFactory {
    return (x as any)?._factoryFor === "Image";
}

function isCommentuserFactory(x: CommentuserFactory | Prisma.UserCreateNestedOneWithoutCommentInput | undefined): x is CommentuserFactory {
    return (x as any)?._factoryFor === "User";
}

export interface CommentFactoryInterface {
    readonly _factoryFor: "Comment";
    build(inputData?: Partial<Prisma.CommentCreateInput>): PromiseLike<Prisma.CommentCreateInput>;
    buildCreateInput(inputData?: Partial<Prisma.CommentCreateInput>): PromiseLike<Prisma.CommentCreateInput>;
    buildList(inputData: number | readonly Partial<Prisma.CommentCreateInput>[]): PromiseLike<Prisma.CommentCreateInput[]>;
    pickForConnect(inputData: Comment): Pick<Comment, "id">;
    create(inputData?: Partial<Prisma.CommentCreateInput>): PromiseLike<Comment>;
    createList(inputData: number | readonly Partial<Prisma.CommentCreateInput>[]): PromiseLike<Comment[]>;
    createForConnect(inputData?: Partial<Prisma.CommentCreateInput>): PromiseLike<Pick<Comment, "id">>;
}

function autoGenerateCommentScalarsOrEnums({ seq }: {
    readonly seq: number;
}): CommentScalarOrEnumFields {
    return {
        itemID: getScalarFieldValueGenerator().String({ modelName: "Comment", fieldName: "itemID", isId: false, isUnique: false, seq }),
        itemType: "peerArticle",
        state: "approved",
        authorType: "team"
    };
}

function defineCommentFactoryInternal({ defaultData: defaultDataResolver }: CommentFactoryDefineOptions): CommentFactoryInterface {
    const seqKey = {};
    const getSeq = () => getSequenceCounter(seqKey);
    const screen = createScreener("Comment", modelFieldDefinitions);
    const build = async (inputData: Partial<Prisma.CommentCreateInput> = {}) => {
        const seq = getSeq();
        const requiredScalarData = autoGenerateCommentScalarsOrEnums({ seq });
        const resolveValue = normalizeResolver<CommentFactoryDefineInput, BuildDataOptions>(defaultDataResolver ?? {});
        const defaultData = await resolveValue({ seq });
        const defaultAssociations = {
            peer: isCommentpeerFactory(defaultData.peer) ? {
                create: await defaultData.peer.build()
            } : defaultData.peer,
            guestUserImage: isCommentguestUserImageFactory(defaultData.guestUserImage) ? {
                create: await defaultData.guestUserImage.build()
            } : defaultData.guestUserImage,
            user: isCommentuserFactory(defaultData.user) ? {
                create: await defaultData.user.build()
            } : defaultData.user
        };
        const data: Prisma.CommentCreateInput = { ...requiredScalarData, ...defaultData, ...defaultAssociations, ...inputData };
        return data;
    };
    const buildList = (inputData: number | readonly Partial<Prisma.CommentCreateInput>[]) => Promise.all(normalizeList(inputData).map(data => build(data)));
    const pickForConnect = (inputData: Comment) => ({
        id: inputData.id
    });
    const create = async (inputData: Partial<Prisma.CommentCreateInput> = {}) => {
        const data = await build(inputData).then(screen);
        return await getClient<PrismaClient>().comment.create({ data });
    };
    const createList = (inputData: number | readonly Partial<Prisma.CommentCreateInput>[]) => Promise.all(normalizeList(inputData).map(data => create(data)));
    const createForConnect = (inputData: Partial<Prisma.CommentCreateInput> = {}) => create(inputData).then(pickForConnect);
    return {
        _factoryFor: "Comment" as const,
        build,
        buildList,
        buildCreateInput: build,
        pickForConnect,
        create,
        createList,
        createForConnect,
    };
}

/**
 * Define factory for {@link Comment} model.
 *
 * @param options
 * @returns factory {@link CommentFactoryInterface}
 */
export function defineCommentFactory(options: CommentFactoryDefineOptions = {}): CommentFactoryInterface {
    return defineCommentFactoryInternal(options);
}

type TaggedCommentsScalarOrEnumFields = {};

type TaggedCommentscommentFactory = {
    _factoryFor: "Comment";
    build: () => PromiseLike<Prisma.CommentCreateNestedOneWithoutTagsInput["create"]>;
};

type TaggedCommentstagFactory = {
    _factoryFor: "Tag";
    build: () => PromiseLike<Prisma.TagCreateNestedOneWithoutCommentsInput["create"]>;
};

type TaggedCommentsFactoryDefineInput = {
    comment: TaggedCommentscommentFactory | Prisma.CommentCreateNestedOneWithoutTagsInput;
    tag: TaggedCommentstagFactory | Prisma.TagCreateNestedOneWithoutCommentsInput;
    createdAt?: Date;
    modifiedAt?: Date;
};

type TaggedCommentsFactoryDefineOptions = {
    defaultData: Resolver<TaggedCommentsFactoryDefineInput, BuildDataOptions>;
};

function isTaggedCommentscommentFactory(x: TaggedCommentscommentFactory | Prisma.CommentCreateNestedOneWithoutTagsInput | undefined): x is TaggedCommentscommentFactory {
    return (x as any)?._factoryFor === "Comment";
}

function isTaggedCommentstagFactory(x: TaggedCommentstagFactory | Prisma.TagCreateNestedOneWithoutCommentsInput | undefined): x is TaggedCommentstagFactory {
    return (x as any)?._factoryFor === "Tag";
}

export interface TaggedCommentsFactoryInterface {
    readonly _factoryFor: "TaggedComments";
    build(inputData?: Partial<Prisma.TaggedCommentsCreateInput>): PromiseLike<Prisma.TaggedCommentsCreateInput>;
    buildCreateInput(inputData?: Partial<Prisma.TaggedCommentsCreateInput>): PromiseLike<Prisma.TaggedCommentsCreateInput>;
    buildList(inputData: number | readonly Partial<Prisma.TaggedCommentsCreateInput>[]): PromiseLike<Prisma.TaggedCommentsCreateInput[]>;
    pickForConnect(inputData: TaggedComments): Pick<TaggedComments, "commentId" | "tagId">;
    create(inputData?: Partial<Prisma.TaggedCommentsCreateInput>): PromiseLike<TaggedComments>;
    createList(inputData: number | readonly Partial<Prisma.TaggedCommentsCreateInput>[]): PromiseLike<TaggedComments[]>;
    createForConnect(inputData?: Partial<Prisma.TaggedCommentsCreateInput>): PromiseLike<Pick<TaggedComments, "commentId" | "tagId">>;
}

function autoGenerateTaggedCommentsScalarsOrEnums({ seq }: {
    readonly seq: number;
}): TaggedCommentsScalarOrEnumFields {
    return {};
}

function defineTaggedCommentsFactoryInternal({ defaultData: defaultDataResolver }: TaggedCommentsFactoryDefineOptions): TaggedCommentsFactoryInterface {
    const seqKey = {};
    const getSeq = () => getSequenceCounter(seqKey);
    const screen = createScreener("TaggedComments", modelFieldDefinitions);
    const build = async (inputData: Partial<Prisma.TaggedCommentsCreateInput> = {}) => {
        const seq = getSeq();
        const requiredScalarData = autoGenerateTaggedCommentsScalarsOrEnums({ seq });
        const resolveValue = normalizeResolver<TaggedCommentsFactoryDefineInput, BuildDataOptions>(defaultDataResolver ?? {});
        const defaultData = await resolveValue({ seq });
        const defaultAssociations = {
            comment: isTaggedCommentscommentFactory(defaultData.comment) ? {
                create: await defaultData.comment.build()
            } : defaultData.comment,
            tag: isTaggedCommentstagFactory(defaultData.tag) ? {
                create: await defaultData.tag.build()
            } : defaultData.tag
        };
        const data: Prisma.TaggedCommentsCreateInput = { ...requiredScalarData, ...defaultData, ...defaultAssociations, ...inputData };
        return data;
    };
    const buildList = (inputData: number | readonly Partial<Prisma.TaggedCommentsCreateInput>[]) => Promise.all(normalizeList(inputData).map(data => build(data)));
    const pickForConnect = (inputData: TaggedComments) => ({
        commentId: inputData.commentId,
        tagId: inputData.tagId
    });
    const create = async (inputData: Partial<Prisma.TaggedCommentsCreateInput> = {}) => {
        const data = await build(inputData).then(screen);
        return await getClient<PrismaClient>().taggedComments.create({ data });
    };
    const createList = (inputData: number | readonly Partial<Prisma.TaggedCommentsCreateInput>[]) => Promise.all(normalizeList(inputData).map(data => create(data)));
    const createForConnect = (inputData: Partial<Prisma.TaggedCommentsCreateInput> = {}) => create(inputData).then(pickForConnect);
    return {
        _factoryFor: "TaggedComments" as const,
        build,
        buildList,
        buildCreateInput: build,
        pickForConnect,
        create,
        createList,
        createForConnect,
    };
}

/**
 * Define factory for {@link TaggedComments} model.
 *
 * @param options
 * @returns factory {@link TaggedCommentsFactoryInterface}
 */
export function defineTaggedCommentsFactory(options: TaggedCommentsFactoryDefineOptions): TaggedCommentsFactoryInterface {
    return defineTaggedCommentsFactoryInternal(options);
}

type CommentRatingSystemScalarOrEnumFields = {};

type CommentRatingSystemFactoryDefineInput = {
    id?: string;
    createdAt?: Date;
    modifiedAt?: Date;
    name?: string | null;
    answers?: Prisma.CommentRatingSystemAnswerCreateNestedManyWithoutRatingSystemInput;
};

type CommentRatingSystemFactoryDefineOptions = {
    defaultData?: Resolver<CommentRatingSystemFactoryDefineInput, BuildDataOptions>;
};

export interface CommentRatingSystemFactoryInterface {
    readonly _factoryFor: "CommentRatingSystem";
    build(inputData?: Partial<Prisma.CommentRatingSystemCreateInput>): PromiseLike<Prisma.CommentRatingSystemCreateInput>;
    buildCreateInput(inputData?: Partial<Prisma.CommentRatingSystemCreateInput>): PromiseLike<Prisma.CommentRatingSystemCreateInput>;
    buildList(inputData: number | readonly Partial<Prisma.CommentRatingSystemCreateInput>[]): PromiseLike<Prisma.CommentRatingSystemCreateInput[]>;
    pickForConnect(inputData: CommentRatingSystem): Pick<CommentRatingSystem, "id">;
    create(inputData?: Partial<Prisma.CommentRatingSystemCreateInput>): PromiseLike<CommentRatingSystem>;
    createList(inputData: number | readonly Partial<Prisma.CommentRatingSystemCreateInput>[]): PromiseLike<CommentRatingSystem[]>;
    createForConnect(inputData?: Partial<Prisma.CommentRatingSystemCreateInput>): PromiseLike<Pick<CommentRatingSystem, "id">>;
}

function autoGenerateCommentRatingSystemScalarsOrEnums({ seq }: {
    readonly seq: number;
}): CommentRatingSystemScalarOrEnumFields {
    return {};
}

function defineCommentRatingSystemFactoryInternal({ defaultData: defaultDataResolver }: CommentRatingSystemFactoryDefineOptions): CommentRatingSystemFactoryInterface {
    const seqKey = {};
    const getSeq = () => getSequenceCounter(seqKey);
    const screen = createScreener("CommentRatingSystem", modelFieldDefinitions);
    const build = async (inputData: Partial<Prisma.CommentRatingSystemCreateInput> = {}) => {
        const seq = getSeq();
        const requiredScalarData = autoGenerateCommentRatingSystemScalarsOrEnums({ seq });
        const resolveValue = normalizeResolver<CommentRatingSystemFactoryDefineInput, BuildDataOptions>(defaultDataResolver ?? {});
        const defaultData = await resolveValue({ seq });
        const defaultAssociations = {};
        const data: Prisma.CommentRatingSystemCreateInput = { ...requiredScalarData, ...defaultData, ...defaultAssociations, ...inputData };
        return data;
    };
    const buildList = (inputData: number | readonly Partial<Prisma.CommentRatingSystemCreateInput>[]) => Promise.all(normalizeList(inputData).map(data => build(data)));
    const pickForConnect = (inputData: CommentRatingSystem) => ({
        id: inputData.id
    });
    const create = async (inputData: Partial<Prisma.CommentRatingSystemCreateInput> = {}) => {
        const data = await build(inputData).then(screen);
        return await getClient<PrismaClient>().commentRatingSystem.create({ data });
    };
    const createList = (inputData: number | readonly Partial<Prisma.CommentRatingSystemCreateInput>[]) => Promise.all(normalizeList(inputData).map(data => create(data)));
    const createForConnect = (inputData: Partial<Prisma.CommentRatingSystemCreateInput> = {}) => create(inputData).then(pickForConnect);
    return {
        _factoryFor: "CommentRatingSystem" as const,
        build,
        buildList,
        buildCreateInput: build,
        pickForConnect,
        create,
        createList,
        createForConnect,
    };
}

/**
 * Define factory for {@link CommentRatingSystem} model.
 *
 * @param options
 * @returns factory {@link CommentRatingSystemFactoryInterface}
 */
export function defineCommentRatingSystemFactory(options: CommentRatingSystemFactoryDefineOptions = {}): CommentRatingSystemFactoryInterface {
    return defineCommentRatingSystemFactoryInternal(options);
}

type CommentRatingSystemAnswerScalarOrEnumFields = {
    type: RatingSystemType;
};

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
};

function isCommentRatingSystemAnswerratingSystemFactory(x: CommentRatingSystemAnswerratingSystemFactory | Prisma.CommentRatingSystemCreateNestedOneWithoutAnswersInput | undefined): x is CommentRatingSystemAnswerratingSystemFactory {
    return (x as any)?._factoryFor === "CommentRatingSystem";
}

export interface CommentRatingSystemAnswerFactoryInterface {
    readonly _factoryFor: "CommentRatingSystemAnswer";
    build(inputData?: Partial<Prisma.CommentRatingSystemAnswerCreateInput>): PromiseLike<Prisma.CommentRatingSystemAnswerCreateInput>;
    buildCreateInput(inputData?: Partial<Prisma.CommentRatingSystemAnswerCreateInput>): PromiseLike<Prisma.CommentRatingSystemAnswerCreateInput>;
    buildList(inputData: number | readonly Partial<Prisma.CommentRatingSystemAnswerCreateInput>[]): PromiseLike<Prisma.CommentRatingSystemAnswerCreateInput[]>;
    pickForConnect(inputData: CommentRatingSystemAnswer): Pick<CommentRatingSystemAnswer, "id">;
    create(inputData?: Partial<Prisma.CommentRatingSystemAnswerCreateInput>): PromiseLike<CommentRatingSystemAnswer>;
    createList(inputData: number | readonly Partial<Prisma.CommentRatingSystemAnswerCreateInput>[]): PromiseLike<CommentRatingSystemAnswer[]>;
    createForConnect(inputData?: Partial<Prisma.CommentRatingSystemAnswerCreateInput>): PromiseLike<Pick<CommentRatingSystemAnswer, "id">>;
}

function autoGenerateCommentRatingSystemAnswerScalarsOrEnums({ seq }: {
    readonly seq: number;
}): CommentRatingSystemAnswerScalarOrEnumFields {
    return {
        type: "star"
    };
}

function defineCommentRatingSystemAnswerFactoryInternal({ defaultData: defaultDataResolver }: CommentRatingSystemAnswerFactoryDefineOptions): CommentRatingSystemAnswerFactoryInterface {
    const seqKey = {};
    const getSeq = () => getSequenceCounter(seqKey);
    const screen = createScreener("CommentRatingSystemAnswer", modelFieldDefinitions);
    const build = async (inputData: Partial<Prisma.CommentRatingSystemAnswerCreateInput> = {}) => {
        const seq = getSeq();
        const requiredScalarData = autoGenerateCommentRatingSystemAnswerScalarsOrEnums({ seq });
        const resolveValue = normalizeResolver<CommentRatingSystemAnswerFactoryDefineInput, BuildDataOptions>(defaultDataResolver ?? {});
        const defaultData = await resolveValue({ seq });
        const defaultAssociations = {
            ratingSystem: isCommentRatingSystemAnswerratingSystemFactory(defaultData.ratingSystem) ? {
                create: await defaultData.ratingSystem.build()
            } : defaultData.ratingSystem
        };
        const data: Prisma.CommentRatingSystemAnswerCreateInput = { ...requiredScalarData, ...defaultData, ...defaultAssociations, ...inputData };
        return data;
    };
    const buildList = (inputData: number | readonly Partial<Prisma.CommentRatingSystemAnswerCreateInput>[]) => Promise.all(normalizeList(inputData).map(data => build(data)));
    const pickForConnect = (inputData: CommentRatingSystemAnswer) => ({
        id: inputData.id
    });
    const create = async (inputData: Partial<Prisma.CommentRatingSystemAnswerCreateInput> = {}) => {
        const data = await build(inputData).then(screen);
        return await getClient<PrismaClient>().commentRatingSystemAnswer.create({ data });
    };
    const createList = (inputData: number | readonly Partial<Prisma.CommentRatingSystemAnswerCreateInput>[]) => Promise.all(normalizeList(inputData).map(data => create(data)));
    const createForConnect = (inputData: Partial<Prisma.CommentRatingSystemAnswerCreateInput> = {}) => create(inputData).then(pickForConnect);
    return {
        _factoryFor: "CommentRatingSystemAnswer" as const,
        build,
        buildList,
        buildCreateInput: build,
        pickForConnect,
        create,
        createList,
        createForConnect,
    };
}

/**
 * Define factory for {@link CommentRatingSystemAnswer} model.
 *
 * @param options
 * @returns factory {@link CommentRatingSystemAnswerFactoryInterface}
 */
export function defineCommentRatingSystemAnswerFactory(options: CommentRatingSystemAnswerFactoryDefineOptions): CommentRatingSystemAnswerFactoryInterface {
    return defineCommentRatingSystemAnswerFactoryInternal(options);
}

type CommentRatingScalarOrEnumFields = {
    value: number;
};

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
    user?: CommentRatinguserFactory | Prisma.UserCreateNestedOneWithoutCommentRatingInput;
    answer: CommentRatinganswerFactory | Prisma.CommentRatingSystemAnswerCreateNestedOneWithoutRatingsInput;
    comment: CommentRatingcommentFactory | Prisma.CommentCreateNestedOneWithoutRatingsInput;
    value?: number;
    fingerprint?: string | null;
    disabled?: boolean;
};

type CommentRatingFactoryDefineOptions = {
    defaultData: Resolver<CommentRatingFactoryDefineInput, BuildDataOptions>;
};

function isCommentRatinguserFactory(x: CommentRatinguserFactory | Prisma.UserCreateNestedOneWithoutCommentRatingInput | undefined): x is CommentRatinguserFactory {
    return (x as any)?._factoryFor === "User";
}

function isCommentRatinganswerFactory(x: CommentRatinganswerFactory | Prisma.CommentRatingSystemAnswerCreateNestedOneWithoutRatingsInput | undefined): x is CommentRatinganswerFactory {
    return (x as any)?._factoryFor === "CommentRatingSystemAnswer";
}

function isCommentRatingcommentFactory(x: CommentRatingcommentFactory | Prisma.CommentCreateNestedOneWithoutRatingsInput | undefined): x is CommentRatingcommentFactory {
    return (x as any)?._factoryFor === "Comment";
}

export interface CommentRatingFactoryInterface {
    readonly _factoryFor: "CommentRating";
    build(inputData?: Partial<Prisma.CommentRatingCreateInput>): PromiseLike<Prisma.CommentRatingCreateInput>;
    buildCreateInput(inputData?: Partial<Prisma.CommentRatingCreateInput>): PromiseLike<Prisma.CommentRatingCreateInput>;
    buildList(inputData: number | readonly Partial<Prisma.CommentRatingCreateInput>[]): PromiseLike<Prisma.CommentRatingCreateInput[]>;
    pickForConnect(inputData: CommentRating): Pick<CommentRating, "id">;
    create(inputData?: Partial<Prisma.CommentRatingCreateInput>): PromiseLike<CommentRating>;
    createList(inputData: number | readonly Partial<Prisma.CommentRatingCreateInput>[]): PromiseLike<CommentRating[]>;
    createForConnect(inputData?: Partial<Prisma.CommentRatingCreateInput>): PromiseLike<Pick<CommentRating, "id">>;
}

function autoGenerateCommentRatingScalarsOrEnums({ seq }: {
    readonly seq: number;
}): CommentRatingScalarOrEnumFields {
    return {
        value: getScalarFieldValueGenerator().Int({ modelName: "CommentRating", fieldName: "value", isId: false, isUnique: false, seq })
    };
}

function defineCommentRatingFactoryInternal({ defaultData: defaultDataResolver }: CommentRatingFactoryDefineOptions): CommentRatingFactoryInterface {
    const seqKey = {};
    const getSeq = () => getSequenceCounter(seqKey);
    const screen = createScreener("CommentRating", modelFieldDefinitions);
    const build = async (inputData: Partial<Prisma.CommentRatingCreateInput> = {}) => {
        const seq = getSeq();
        const requiredScalarData = autoGenerateCommentRatingScalarsOrEnums({ seq });
        const resolveValue = normalizeResolver<CommentRatingFactoryDefineInput, BuildDataOptions>(defaultDataResolver ?? {});
        const defaultData = await resolveValue({ seq });
        const defaultAssociations = {
            user: isCommentRatinguserFactory(defaultData.user) ? {
                create: await defaultData.user.build()
            } : defaultData.user,
            answer: isCommentRatinganswerFactory(defaultData.answer) ? {
                create: await defaultData.answer.build()
            } : defaultData.answer,
            comment: isCommentRatingcommentFactory(defaultData.comment) ? {
                create: await defaultData.comment.build()
            } : defaultData.comment
        };
        const data: Prisma.CommentRatingCreateInput = { ...requiredScalarData, ...defaultData, ...defaultAssociations, ...inputData };
        return data;
    };
    const buildList = (inputData: number | readonly Partial<Prisma.CommentRatingCreateInput>[]) => Promise.all(normalizeList(inputData).map(data => build(data)));
    const pickForConnect = (inputData: CommentRating) => ({
        id: inputData.id
    });
    const create = async (inputData: Partial<Prisma.CommentRatingCreateInput> = {}) => {
        const data = await build(inputData).then(screen);
        return await getClient<PrismaClient>().commentRating.create({ data });
    };
    const createList = (inputData: number | readonly Partial<Prisma.CommentRatingCreateInput>[]) => Promise.all(normalizeList(inputData).map(data => create(data)));
    const createForConnect = (inputData: Partial<Prisma.CommentRatingCreateInput> = {}) => create(inputData).then(pickForConnect);
    return {
        _factoryFor: "CommentRating" as const,
        build,
        buildList,
        buildCreateInput: build,
        pickForConnect,
        create,
        createList,
        createForConnect,
    };
}

/**
 * Define factory for {@link CommentRating} model.
 *
 * @param options
 * @returns factory {@link CommentRatingFactoryInterface}
 */
export function defineCommentRatingFactory(options: CommentRatingFactoryDefineOptions): CommentRatingFactoryInterface {
    return defineCommentRatingFactoryInternal(options);
}

type CommentRatingOverrideScalarOrEnumFields = {};

type CommentRatingOverrideanswerFactory = {
    _factoryFor: "CommentRatingSystemAnswer";
    build: () => PromiseLike<Prisma.CommentRatingSystemAnswerCreateNestedOneWithoutOverriddenRatingsInput["create"]>;
};

type CommentRatingOverridecommentFactory = {
    _factoryFor: "Comment";
    build: () => PromiseLike<Prisma.CommentCreateNestedOneWithoutOverriddenRatingsInput["create"]>;
};

type CommentRatingOverrideFactoryDefineInput = {
    answer: CommentRatingOverrideanswerFactory | Prisma.CommentRatingSystemAnswerCreateNestedOneWithoutOverriddenRatingsInput;
    comment: CommentRatingOverridecommentFactory | Prisma.CommentCreateNestedOneWithoutOverriddenRatingsInput;
    createdAt?: Date;
    modifiedAt?: Date;
    value?: number | null;
};

type CommentRatingOverrideFactoryDefineOptions = {
    defaultData: Resolver<CommentRatingOverrideFactoryDefineInput, BuildDataOptions>;
};

function isCommentRatingOverrideanswerFactory(x: CommentRatingOverrideanswerFactory | Prisma.CommentRatingSystemAnswerCreateNestedOneWithoutOverriddenRatingsInput | undefined): x is CommentRatingOverrideanswerFactory {
    return (x as any)?._factoryFor === "CommentRatingSystemAnswer";
}

function isCommentRatingOverridecommentFactory(x: CommentRatingOverridecommentFactory | Prisma.CommentCreateNestedOneWithoutOverriddenRatingsInput | undefined): x is CommentRatingOverridecommentFactory {
    return (x as any)?._factoryFor === "Comment";
}

export interface CommentRatingOverrideFactoryInterface {
    readonly _factoryFor: "CommentRatingOverride";
    build(inputData?: Partial<Prisma.CommentRatingOverrideCreateInput>): PromiseLike<Prisma.CommentRatingOverrideCreateInput>;
    buildCreateInput(inputData?: Partial<Prisma.CommentRatingOverrideCreateInput>): PromiseLike<Prisma.CommentRatingOverrideCreateInput>;
    buildList(inputData: number | readonly Partial<Prisma.CommentRatingOverrideCreateInput>[]): PromiseLike<Prisma.CommentRatingOverrideCreateInput[]>;
    pickForConnect(inputData: CommentRatingOverride): Pick<CommentRatingOverride, "answerId" | "commentId">;
    create(inputData?: Partial<Prisma.CommentRatingOverrideCreateInput>): PromiseLike<CommentRatingOverride>;
    createList(inputData: number | readonly Partial<Prisma.CommentRatingOverrideCreateInput>[]): PromiseLike<CommentRatingOverride[]>;
    createForConnect(inputData?: Partial<Prisma.CommentRatingOverrideCreateInput>): PromiseLike<Pick<CommentRatingOverride, "answerId" | "commentId">>;
}

function autoGenerateCommentRatingOverrideScalarsOrEnums({ seq }: {
    readonly seq: number;
}): CommentRatingOverrideScalarOrEnumFields {
    return {};
}

function defineCommentRatingOverrideFactoryInternal({ defaultData: defaultDataResolver }: CommentRatingOverrideFactoryDefineOptions): CommentRatingOverrideFactoryInterface {
    const seqKey = {};
    const getSeq = () => getSequenceCounter(seqKey);
    const screen = createScreener("CommentRatingOverride", modelFieldDefinitions);
    const build = async (inputData: Partial<Prisma.CommentRatingOverrideCreateInput> = {}) => {
        const seq = getSeq();
        const requiredScalarData = autoGenerateCommentRatingOverrideScalarsOrEnums({ seq });
        const resolveValue = normalizeResolver<CommentRatingOverrideFactoryDefineInput, BuildDataOptions>(defaultDataResolver ?? {});
        const defaultData = await resolveValue({ seq });
        const defaultAssociations = {
            answer: isCommentRatingOverrideanswerFactory(defaultData.answer) ? {
                create: await defaultData.answer.build()
            } : defaultData.answer,
            comment: isCommentRatingOverridecommentFactory(defaultData.comment) ? {
                create: await defaultData.comment.build()
            } : defaultData.comment
        };
        const data: Prisma.CommentRatingOverrideCreateInput = { ...requiredScalarData, ...defaultData, ...defaultAssociations, ...inputData };
        return data;
    };
    const buildList = (inputData: number | readonly Partial<Prisma.CommentRatingOverrideCreateInput>[]) => Promise.all(normalizeList(inputData).map(data => build(data)));
    const pickForConnect = (inputData: CommentRatingOverride) => ({
        answerId: inputData.answerId,
        commentId: inputData.commentId
    });
    const create = async (inputData: Partial<Prisma.CommentRatingOverrideCreateInput> = {}) => {
        const data = await build(inputData).then(screen);
        return await getClient<PrismaClient>().commentRatingOverride.create({ data });
    };
    const createList = (inputData: number | readonly Partial<Prisma.CommentRatingOverrideCreateInput>[]) => Promise.all(normalizeList(inputData).map(data => create(data)));
    const createForConnect = (inputData: Partial<Prisma.CommentRatingOverrideCreateInput> = {}) => create(inputData).then(pickForConnect);
    return {
        _factoryFor: "CommentRatingOverride" as const,
        build,
        buildList,
        buildCreateInput: build,
        pickForConnect,
        create,
        createList,
        createForConnect,
    };
}

/**
 * Define factory for {@link CommentRatingOverride} model.
 *
 * @param options
 * @returns factory {@link CommentRatingOverrideFactoryInterface}
 */
export function defineCommentRatingOverrideFactory(options: CommentRatingOverrideFactoryDefineOptions): CommentRatingOverrideFactoryInterface {
    return defineCommentRatingOverrideFactoryInternal(options);
}

type InvoiceItemScalarOrEnumFields = {
    name: string;
    quantity: number;
    amount: number;
};

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
};

function isInvoiceIteminvoicesFactory(x: InvoiceIteminvoicesFactory | Prisma.InvoiceCreateNestedOneWithoutItemsInput | undefined): x is InvoiceIteminvoicesFactory {
    return (x as any)?._factoryFor === "Invoice";
}

export interface InvoiceItemFactoryInterface {
    readonly _factoryFor: "InvoiceItem";
    build(inputData?: Partial<Prisma.InvoiceItemCreateInput>): PromiseLike<Prisma.InvoiceItemCreateInput>;
    buildCreateInput(inputData?: Partial<Prisma.InvoiceItemCreateInput>): PromiseLike<Prisma.InvoiceItemCreateInput>;
    buildList(inputData: number | readonly Partial<Prisma.InvoiceItemCreateInput>[]): PromiseLike<Prisma.InvoiceItemCreateInput[]>;
    pickForConnect(inputData: InvoiceItem): Pick<InvoiceItem, "id">;
    create(inputData?: Partial<Prisma.InvoiceItemCreateInput>): PromiseLike<InvoiceItem>;
    createList(inputData: number | readonly Partial<Prisma.InvoiceItemCreateInput>[]): PromiseLike<InvoiceItem[]>;
    createForConnect(inputData?: Partial<Prisma.InvoiceItemCreateInput>): PromiseLike<Pick<InvoiceItem, "id">>;
}

function autoGenerateInvoiceItemScalarsOrEnums({ seq }: {
    readonly seq: number;
}): InvoiceItemScalarOrEnumFields {
    return {
        name: getScalarFieldValueGenerator().String({ modelName: "InvoiceItem", fieldName: "name", isId: false, isUnique: false, seq }),
        quantity: getScalarFieldValueGenerator().Int({ modelName: "InvoiceItem", fieldName: "quantity", isId: false, isUnique: false, seq }),
        amount: getScalarFieldValueGenerator().Int({ modelName: "InvoiceItem", fieldName: "amount", isId: false, isUnique: false, seq })
    };
}

function defineInvoiceItemFactoryInternal({ defaultData: defaultDataResolver }: InvoiceItemFactoryDefineOptions): InvoiceItemFactoryInterface {
    const seqKey = {};
    const getSeq = () => getSequenceCounter(seqKey);
    const screen = createScreener("InvoiceItem", modelFieldDefinitions);
    const build = async (inputData: Partial<Prisma.InvoiceItemCreateInput> = {}) => {
        const seq = getSeq();
        const requiredScalarData = autoGenerateInvoiceItemScalarsOrEnums({ seq });
        const resolveValue = normalizeResolver<InvoiceItemFactoryDefineInput, BuildDataOptions>(defaultDataResolver ?? {});
        const defaultData = await resolveValue({ seq });
        const defaultAssociations = {
            invoices: isInvoiceIteminvoicesFactory(defaultData.invoices) ? {
                create: await defaultData.invoices.build()
            } : defaultData.invoices
        };
        const data: Prisma.InvoiceItemCreateInput = { ...requiredScalarData, ...defaultData, ...defaultAssociations, ...inputData };
        return data;
    };
    const buildList = (inputData: number | readonly Partial<Prisma.InvoiceItemCreateInput>[]) => Promise.all(normalizeList(inputData).map(data => build(data)));
    const pickForConnect = (inputData: InvoiceItem) => ({
        id: inputData.id
    });
    const create = async (inputData: Partial<Prisma.InvoiceItemCreateInput> = {}) => {
        const data = await build(inputData).then(screen);
        return await getClient<PrismaClient>().invoiceItem.create({ data });
    };
    const createList = (inputData: number | readonly Partial<Prisma.InvoiceItemCreateInput>[]) => Promise.all(normalizeList(inputData).map(data => create(data)));
    const createForConnect = (inputData: Partial<Prisma.InvoiceItemCreateInput> = {}) => create(inputData).then(pickForConnect);
    return {
        _factoryFor: "InvoiceItem" as const,
        build,
        buildList,
        buildCreateInput: build,
        pickForConnect,
        create,
        createList,
        createForConnect,
    };
}

/**
 * Define factory for {@link InvoiceItem} model.
 *
 * @param options
 * @returns factory {@link InvoiceItemFactoryInterface}
 */
export function defineInvoiceItemFactory(options: InvoiceItemFactoryDefineOptions = {}): InvoiceItemFactoryInterface {
    return defineInvoiceItemFactoryInternal(options);
}

type InvoiceScalarOrEnumFields = {
    mail: string;
    dueAt: Date;
};

type InvoicesubscriptionFactory = {
    _factoryFor: "Subscription";
    build: () => PromiseLike<Prisma.SubscriptionCreateNestedOneWithoutInvoicesInput["create"]>;
};

type InvoiceuserFactory = {
    _factoryFor: "User";
    build: () => PromiseLike<Prisma.UserCreateNestedOneWithoutInvoiceInput["create"]>;
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
    paymentDeadline?: Date | null;
    sentReminderAt?: Date | null;
    items?: Prisma.InvoiceItemCreateNestedManyWithoutInvoicesInput;
    manuallySetAsPaidByUserId?: string | null;
    subscription?: InvoicesubscriptionFactory | Prisma.SubscriptionCreateNestedOneWithoutInvoicesInput;
    user?: InvoiceuserFactory | Prisma.UserCreateNestedOneWithoutInvoiceInput;
    subscriptionPeriods?: Prisma.SubscriptionPeriodCreateNestedManyWithoutInvoiceInput;
};

type InvoiceFactoryDefineOptions = {
    defaultData?: Resolver<InvoiceFactoryDefineInput, BuildDataOptions>;
};

function isInvoicesubscriptionFactory(x: InvoicesubscriptionFactory | Prisma.SubscriptionCreateNestedOneWithoutInvoicesInput | undefined): x is InvoicesubscriptionFactory {
    return (x as any)?._factoryFor === "Subscription";
}

function isInvoiceuserFactory(x: InvoiceuserFactory | Prisma.UserCreateNestedOneWithoutInvoiceInput | undefined): x is InvoiceuserFactory {
    return (x as any)?._factoryFor === "User";
}

export interface InvoiceFactoryInterface {
    readonly _factoryFor: "Invoice";
    build(inputData?: Partial<Prisma.InvoiceCreateInput>): PromiseLike<Prisma.InvoiceCreateInput>;
    buildCreateInput(inputData?: Partial<Prisma.InvoiceCreateInput>): PromiseLike<Prisma.InvoiceCreateInput>;
    buildList(inputData: number | readonly Partial<Prisma.InvoiceCreateInput>[]): PromiseLike<Prisma.InvoiceCreateInput[]>;
    pickForConnect(inputData: Invoice): Pick<Invoice, "id">;
    create(inputData?: Partial<Prisma.InvoiceCreateInput>): PromiseLike<Invoice>;
    createList(inputData: number | readonly Partial<Prisma.InvoiceCreateInput>[]): PromiseLike<Invoice[]>;
    createForConnect(inputData?: Partial<Prisma.InvoiceCreateInput>): PromiseLike<Pick<Invoice, "id">>;
}

function autoGenerateInvoiceScalarsOrEnums({ seq }: {
    readonly seq: number;
}): InvoiceScalarOrEnumFields {
    return {
        mail: getScalarFieldValueGenerator().String({ modelName: "Invoice", fieldName: "mail", isId: false, isUnique: false, seq }),
        dueAt: getScalarFieldValueGenerator().DateTime({ modelName: "Invoice", fieldName: "dueAt", isId: false, isUnique: false, seq })
    };
}

function defineInvoiceFactoryInternal({ defaultData: defaultDataResolver }: InvoiceFactoryDefineOptions): InvoiceFactoryInterface {
    const seqKey = {};
    const getSeq = () => getSequenceCounter(seqKey);
    const screen = createScreener("Invoice", modelFieldDefinitions);
    const build = async (inputData: Partial<Prisma.InvoiceCreateInput> = {}) => {
        const seq = getSeq();
        const requiredScalarData = autoGenerateInvoiceScalarsOrEnums({ seq });
        const resolveValue = normalizeResolver<InvoiceFactoryDefineInput, BuildDataOptions>(defaultDataResolver ?? {});
        const defaultData = await resolveValue({ seq });
        const defaultAssociations = {
            subscription: isInvoicesubscriptionFactory(defaultData.subscription) ? {
                create: await defaultData.subscription.build()
            } : defaultData.subscription,
            user: isInvoiceuserFactory(defaultData.user) ? {
                create: await defaultData.user.build()
            } : defaultData.user
        };
        const data: Prisma.InvoiceCreateInput = { ...requiredScalarData, ...defaultData, ...defaultAssociations, ...inputData };
        return data;
    };
    const buildList = (inputData: number | readonly Partial<Prisma.InvoiceCreateInput>[]) => Promise.all(normalizeList(inputData).map(data => build(data)));
    const pickForConnect = (inputData: Invoice) => ({
        id: inputData.id
    });
    const create = async (inputData: Partial<Prisma.InvoiceCreateInput> = {}) => {
        const data = await build(inputData).then(screen);
        return await getClient<PrismaClient>().invoice.create({ data });
    };
    const createList = (inputData: number | readonly Partial<Prisma.InvoiceCreateInput>[]) => Promise.all(normalizeList(inputData).map(data => create(data)));
    const createForConnect = (inputData: Partial<Prisma.InvoiceCreateInput> = {}) => create(inputData).then(pickForConnect);
    return {
        _factoryFor: "Invoice" as const,
        build,
        buildList,
        buildCreateInput: build,
        pickForConnect,
        create,
        createList,
        createForConnect,
    };
}

/**
 * Define factory for {@link Invoice} model.
 *
 * @param options
 * @returns factory {@link InvoiceFactoryInterface}
 */
export function defineInvoiceFactory(options: InvoiceFactoryDefineOptions = {}): InvoiceFactoryInterface {
    return defineInvoiceFactoryInternal(options);
}

type MailLogScalarOrEnumFields = {
    state: MailLogState;
    sentDate: Date;
    mailProviderID: string;
    mailIdentifier: string;
};

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
    recipient: MailLogrecipientFactory | Prisma.UserCreateNestedOneWithoutMailSentInput;
    state?: MailLogState;
    sentDate?: Date;
    mailProviderID?: string;
    mailIdentifier?: string;
    mailTemplate: MailLogmailTemplateFactory | Prisma.MailTemplateCreateNestedOneWithoutMailLogInput;
    mailData?: string | null;
    subject?: string | null;
};

type MailLogFactoryDefineOptions = {
    defaultData: Resolver<MailLogFactoryDefineInput, BuildDataOptions>;
};

function isMailLogrecipientFactory(x: MailLogrecipientFactory | Prisma.UserCreateNestedOneWithoutMailSentInput | undefined): x is MailLogrecipientFactory {
    return (x as any)?._factoryFor === "User";
}

function isMailLogmailTemplateFactory(x: MailLogmailTemplateFactory | Prisma.MailTemplateCreateNestedOneWithoutMailLogInput | undefined): x is MailLogmailTemplateFactory {
    return (x as any)?._factoryFor === "MailTemplate";
}

export interface MailLogFactoryInterface {
    readonly _factoryFor: "MailLog";
    build(inputData?: Partial<Prisma.MailLogCreateInput>): PromiseLike<Prisma.MailLogCreateInput>;
    buildCreateInput(inputData?: Partial<Prisma.MailLogCreateInput>): PromiseLike<Prisma.MailLogCreateInput>;
    buildList(inputData: number | readonly Partial<Prisma.MailLogCreateInput>[]): PromiseLike<Prisma.MailLogCreateInput[]>;
    pickForConnect(inputData: MailLog): Pick<MailLog, "id">;
    create(inputData?: Partial<Prisma.MailLogCreateInput>): PromiseLike<MailLog>;
    createList(inputData: number | readonly Partial<Prisma.MailLogCreateInput>[]): PromiseLike<MailLog[]>;
    createForConnect(inputData?: Partial<Prisma.MailLogCreateInput>): PromiseLike<Pick<MailLog, "id">>;
}

function autoGenerateMailLogScalarsOrEnums({ seq }: {
    readonly seq: number;
}): MailLogScalarOrEnumFields {
    return {
        state: "submitted",
        sentDate: getScalarFieldValueGenerator().DateTime({ modelName: "MailLog", fieldName: "sentDate", isId: false, isUnique: false, seq }),
        mailProviderID: getScalarFieldValueGenerator().String({ modelName: "MailLog", fieldName: "mailProviderID", isId: false, isUnique: false, seq }),
        mailIdentifier: getScalarFieldValueGenerator().String({ modelName: "MailLog", fieldName: "mailIdentifier", isId: false, isUnique: true, seq })
    };
}

function defineMailLogFactoryInternal({ defaultData: defaultDataResolver }: MailLogFactoryDefineOptions): MailLogFactoryInterface {
    const seqKey = {};
    const getSeq = () => getSequenceCounter(seqKey);
    const screen = createScreener("MailLog", modelFieldDefinitions);
    const build = async (inputData: Partial<Prisma.MailLogCreateInput> = {}) => {
        const seq = getSeq();
        const requiredScalarData = autoGenerateMailLogScalarsOrEnums({ seq });
        const resolveValue = normalizeResolver<MailLogFactoryDefineInput, BuildDataOptions>(defaultDataResolver ?? {});
        const defaultData = await resolveValue({ seq });
        const defaultAssociations = {
            recipient: isMailLogrecipientFactory(defaultData.recipient) ? {
                create: await defaultData.recipient.build()
            } : defaultData.recipient,
            mailTemplate: isMailLogmailTemplateFactory(defaultData.mailTemplate) ? {
                create: await defaultData.mailTemplate.build()
            } : defaultData.mailTemplate
        };
        const data: Prisma.MailLogCreateInput = { ...requiredScalarData, ...defaultData, ...defaultAssociations, ...inputData };
        return data;
    };
    const buildList = (inputData: number | readonly Partial<Prisma.MailLogCreateInput>[]) => Promise.all(normalizeList(inputData).map(data => build(data)));
    const pickForConnect = (inputData: MailLog) => ({
        id: inputData.id
    });
    const create = async (inputData: Partial<Prisma.MailLogCreateInput> = {}) => {
        const data = await build(inputData).then(screen);
        return await getClient<PrismaClient>().mailLog.create({ data });
    };
    const createList = (inputData: number | readonly Partial<Prisma.MailLogCreateInput>[]) => Promise.all(normalizeList(inputData).map(data => create(data)));
    const createForConnect = (inputData: Partial<Prisma.MailLogCreateInput> = {}) => create(inputData).then(pickForConnect);
    return {
        _factoryFor: "MailLog" as const,
        build,
        buildList,
        buildCreateInput: build,
        pickForConnect,
        create,
        createList,
        createForConnect,
    };
}

/**
 * Define factory for {@link MailLog} model.
 *
 * @param options
 * @returns factory {@link MailLogFactoryInterface}
 */
export function defineMailLogFactory(options: MailLogFactoryDefineOptions): MailLogFactoryInterface {
    return defineMailLogFactoryInternal(options);
}

type AvailablePaymentMethodScalarOrEnumFields = {
    forceAutoRenewal: boolean;
};

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
};

function isAvailablePaymentMethodMemberPlanFactory(x: AvailablePaymentMethodMemberPlanFactory | Prisma.MemberPlanCreateNestedOneWithoutAvailablePaymentMethodsInput | undefined): x is AvailablePaymentMethodMemberPlanFactory {
    return (x as any)?._factoryFor === "MemberPlan";
}

export interface AvailablePaymentMethodFactoryInterface {
    readonly _factoryFor: "AvailablePaymentMethod";
    build(inputData?: Partial<Prisma.AvailablePaymentMethodCreateInput>): PromiseLike<Prisma.AvailablePaymentMethodCreateInput>;
    buildCreateInput(inputData?: Partial<Prisma.AvailablePaymentMethodCreateInput>): PromiseLike<Prisma.AvailablePaymentMethodCreateInput>;
    buildList(inputData: number | readonly Partial<Prisma.AvailablePaymentMethodCreateInput>[]): PromiseLike<Prisma.AvailablePaymentMethodCreateInput[]>;
    pickForConnect(inputData: AvailablePaymentMethod): Pick<AvailablePaymentMethod, "id">;
    create(inputData?: Partial<Prisma.AvailablePaymentMethodCreateInput>): PromiseLike<AvailablePaymentMethod>;
    createList(inputData: number | readonly Partial<Prisma.AvailablePaymentMethodCreateInput>[]): PromiseLike<AvailablePaymentMethod[]>;
    createForConnect(inputData?: Partial<Prisma.AvailablePaymentMethodCreateInput>): PromiseLike<Pick<AvailablePaymentMethod, "id">>;
}

function autoGenerateAvailablePaymentMethodScalarsOrEnums({ seq }: {
    readonly seq: number;
}): AvailablePaymentMethodScalarOrEnumFields {
    return {
        forceAutoRenewal: getScalarFieldValueGenerator().Boolean({ modelName: "AvailablePaymentMethod", fieldName: "forceAutoRenewal", isId: false, isUnique: false, seq })
    };
}

function defineAvailablePaymentMethodFactoryInternal({ defaultData: defaultDataResolver }: AvailablePaymentMethodFactoryDefineOptions): AvailablePaymentMethodFactoryInterface {
    const seqKey = {};
    const getSeq = () => getSequenceCounter(seqKey);
    const screen = createScreener("AvailablePaymentMethod", modelFieldDefinitions);
    const build = async (inputData: Partial<Prisma.AvailablePaymentMethodCreateInput> = {}) => {
        const seq = getSeq();
        const requiredScalarData = autoGenerateAvailablePaymentMethodScalarsOrEnums({ seq });
        const resolveValue = normalizeResolver<AvailablePaymentMethodFactoryDefineInput, BuildDataOptions>(defaultDataResolver ?? {});
        const defaultData = await resolveValue({ seq });
        const defaultAssociations = {
            MemberPlan: isAvailablePaymentMethodMemberPlanFactory(defaultData.MemberPlan) ? {
                create: await defaultData.MemberPlan.build()
            } : defaultData.MemberPlan
        };
        const data: Prisma.AvailablePaymentMethodCreateInput = { ...requiredScalarData, ...defaultData, ...defaultAssociations, ...inputData };
        return data;
    };
    const buildList = (inputData: number | readonly Partial<Prisma.AvailablePaymentMethodCreateInput>[]) => Promise.all(normalizeList(inputData).map(data => build(data)));
    const pickForConnect = (inputData: AvailablePaymentMethod) => ({
        id: inputData.id
    });
    const create = async (inputData: Partial<Prisma.AvailablePaymentMethodCreateInput> = {}) => {
        const data = await build(inputData).then(screen);
        return await getClient<PrismaClient>().availablePaymentMethod.create({ data });
    };
    const createList = (inputData: number | readonly Partial<Prisma.AvailablePaymentMethodCreateInput>[]) => Promise.all(normalizeList(inputData).map(data => create(data)));
    const createForConnect = (inputData: Partial<Prisma.AvailablePaymentMethodCreateInput> = {}) => create(inputData).then(pickForConnect);
    return {
        _factoryFor: "AvailablePaymentMethod" as const,
        build,
        buildList,
        buildCreateInput: build,
        pickForConnect,
        create,
        createList,
        createForConnect,
    };
}

/**
 * Define factory for {@link AvailablePaymentMethod} model.
 *
 * @param options
 * @returns factory {@link AvailablePaymentMethodFactoryInterface}
 */
export function defineAvailablePaymentMethodFactory(options: AvailablePaymentMethodFactoryDefineOptions = {}): AvailablePaymentMethodFactoryInterface {
    return defineAvailablePaymentMethodFactoryInternal(options);
}

type MemberPlanScalarOrEnumFields = {
    name: string;
    slug: string;
    description: Prisma.JsonNullValueInput | Prisma.InputJsonValue;
    active: boolean;
    amountPerMonthMin: number;
};

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
    availablePaymentMethods?: Prisma.AvailablePaymentMethodCreateNestedManyWithoutMemberPlanInput;
    image?: MemberPlanimageFactory | Prisma.ImageCreateNestedOneWithoutMemberPlanInput;
    Subscription?: Prisma.SubscriptionCreateNestedManyWithoutMemberPlanInput;
    subscriptionFlows?: Prisma.SubscriptionFlowCreateNestedManyWithoutMemberPlanInput;
};

type MemberPlanFactoryDefineOptions = {
    defaultData?: Resolver<MemberPlanFactoryDefineInput, BuildDataOptions>;
};

function isMemberPlanimageFactory(x: MemberPlanimageFactory | Prisma.ImageCreateNestedOneWithoutMemberPlanInput | undefined): x is MemberPlanimageFactory {
    return (x as any)?._factoryFor === "Image";
}

export interface MemberPlanFactoryInterface {
    readonly _factoryFor: "MemberPlan";
    build(inputData?: Partial<Prisma.MemberPlanCreateInput>): PromiseLike<Prisma.MemberPlanCreateInput>;
    buildCreateInput(inputData?: Partial<Prisma.MemberPlanCreateInput>): PromiseLike<Prisma.MemberPlanCreateInput>;
    buildList(inputData: number | readonly Partial<Prisma.MemberPlanCreateInput>[]): PromiseLike<Prisma.MemberPlanCreateInput[]>;
    pickForConnect(inputData: MemberPlan): Pick<MemberPlan, "id">;
    create(inputData?: Partial<Prisma.MemberPlanCreateInput>): PromiseLike<MemberPlan>;
    createList(inputData: number | readonly Partial<Prisma.MemberPlanCreateInput>[]): PromiseLike<MemberPlan[]>;
    createForConnect(inputData?: Partial<Prisma.MemberPlanCreateInput>): PromiseLike<Pick<MemberPlan, "id">>;
}

function autoGenerateMemberPlanScalarsOrEnums({ seq }: {
    readonly seq: number;
}): MemberPlanScalarOrEnumFields {
    return {
        name: getScalarFieldValueGenerator().String({ modelName: "MemberPlan", fieldName: "name", isId: false, isUnique: false, seq }),
        slug: getScalarFieldValueGenerator().String({ modelName: "MemberPlan", fieldName: "slug", isId: false, isUnique: true, seq }),
        description: getScalarFieldValueGenerator().Json({ modelName: "MemberPlan", fieldName: "description", isId: false, isUnique: false, seq }),
        active: getScalarFieldValueGenerator().Boolean({ modelName: "MemberPlan", fieldName: "active", isId: false, isUnique: false, seq }),
        amountPerMonthMin: getScalarFieldValueGenerator().Float({ modelName: "MemberPlan", fieldName: "amountPerMonthMin", isId: false, isUnique: false, seq })
    };
}

function defineMemberPlanFactoryInternal({ defaultData: defaultDataResolver }: MemberPlanFactoryDefineOptions): MemberPlanFactoryInterface {
    const seqKey = {};
    const getSeq = () => getSequenceCounter(seqKey);
    const screen = createScreener("MemberPlan", modelFieldDefinitions);
    const build = async (inputData: Partial<Prisma.MemberPlanCreateInput> = {}) => {
        const seq = getSeq();
        const requiredScalarData = autoGenerateMemberPlanScalarsOrEnums({ seq });
        const resolveValue = normalizeResolver<MemberPlanFactoryDefineInput, BuildDataOptions>(defaultDataResolver ?? {});
        const defaultData = await resolveValue({ seq });
        const defaultAssociations = {
            image: isMemberPlanimageFactory(defaultData.image) ? {
                create: await defaultData.image.build()
            } : defaultData.image
        };
        const data: Prisma.MemberPlanCreateInput = { ...requiredScalarData, ...defaultData, ...defaultAssociations, ...inputData };
        return data;
    };
    const buildList = (inputData: number | readonly Partial<Prisma.MemberPlanCreateInput>[]) => Promise.all(normalizeList(inputData).map(data => build(data)));
    const pickForConnect = (inputData: MemberPlan) => ({
        id: inputData.id
    });
    const create = async (inputData: Partial<Prisma.MemberPlanCreateInput> = {}) => {
        const data = await build(inputData).then(screen);
        return await getClient<PrismaClient>().memberPlan.create({ data });
    };
    const createList = (inputData: number | readonly Partial<Prisma.MemberPlanCreateInput>[]) => Promise.all(normalizeList(inputData).map(data => create(data)));
    const createForConnect = (inputData: Partial<Prisma.MemberPlanCreateInput> = {}) => create(inputData).then(pickForConnect);
    return {
        _factoryFor: "MemberPlan" as const,
        build,
        buildList,
        buildCreateInput: build,
        pickForConnect,
        create,
        createList,
        createForConnect,
    };
}

/**
 * Define factory for {@link MemberPlan} model.
 *
 * @param options
 * @returns factory {@link MemberPlanFactoryInterface}
 */
export function defineMemberPlanFactory(options: MemberPlanFactoryDefineOptions = {}): MemberPlanFactoryInterface {
    return defineMemberPlanFactoryInternal(options);
}

type NavigationLinkScalarOrEnumFields = {
    label: string;
    type: string;
};

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
};

function isNavigationLinkpageFactory(x: NavigationLinkpageFactory | Prisma.PageCreateNestedOneWithoutNavigationsInput | undefined): x is NavigationLinkpageFactory {
    return (x as any)?._factoryFor === "Page";
}

function isNavigationLinkarticleFactory(x: NavigationLinkarticleFactory | Prisma.ArticleCreateNestedOneWithoutNavigationsInput | undefined): x is NavigationLinkarticleFactory {
    return (x as any)?._factoryFor === "Article";
}

function isNavigationLinknavigationFactory(x: NavigationLinknavigationFactory | Prisma.NavigationCreateNestedOneWithoutLinksInput | undefined): x is NavigationLinknavigationFactory {
    return (x as any)?._factoryFor === "Navigation";
}

export interface NavigationLinkFactoryInterface {
    readonly _factoryFor: "NavigationLink";
    build(inputData?: Partial<Prisma.NavigationLinkCreateInput>): PromiseLike<Prisma.NavigationLinkCreateInput>;
    buildCreateInput(inputData?: Partial<Prisma.NavigationLinkCreateInput>): PromiseLike<Prisma.NavigationLinkCreateInput>;
    buildList(inputData: number | readonly Partial<Prisma.NavigationLinkCreateInput>[]): PromiseLike<Prisma.NavigationLinkCreateInput[]>;
    pickForConnect(inputData: NavigationLink): Pick<NavigationLink, "id">;
    create(inputData?: Partial<Prisma.NavigationLinkCreateInput>): PromiseLike<NavigationLink>;
    createList(inputData: number | readonly Partial<Prisma.NavigationLinkCreateInput>[]): PromiseLike<NavigationLink[]>;
    createForConnect(inputData?: Partial<Prisma.NavigationLinkCreateInput>): PromiseLike<Pick<NavigationLink, "id">>;
}

function autoGenerateNavigationLinkScalarsOrEnums({ seq }: {
    readonly seq: number;
}): NavigationLinkScalarOrEnumFields {
    return {
        label: getScalarFieldValueGenerator().String({ modelName: "NavigationLink", fieldName: "label", isId: false, isUnique: false, seq }),
        type: getScalarFieldValueGenerator().String({ modelName: "NavigationLink", fieldName: "type", isId: false, isUnique: false, seq })
    };
}

function defineNavigationLinkFactoryInternal({ defaultData: defaultDataResolver }: NavigationLinkFactoryDefineOptions): NavigationLinkFactoryInterface {
    const seqKey = {};
    const getSeq = () => getSequenceCounter(seqKey);
    const screen = createScreener("NavigationLink", modelFieldDefinitions);
    const build = async (inputData: Partial<Prisma.NavigationLinkCreateInput> = {}) => {
        const seq = getSeq();
        const requiredScalarData = autoGenerateNavigationLinkScalarsOrEnums({ seq });
        const resolveValue = normalizeResolver<NavigationLinkFactoryDefineInput, BuildDataOptions>(defaultDataResolver ?? {});
        const defaultData = await resolveValue({ seq });
        const defaultAssociations = {
            page: isNavigationLinkpageFactory(defaultData.page) ? {
                create: await defaultData.page.build()
            } : defaultData.page,
            article: isNavigationLinkarticleFactory(defaultData.article) ? {
                create: await defaultData.article.build()
            } : defaultData.article,
            navigation: isNavigationLinknavigationFactory(defaultData.navigation) ? {
                create: await defaultData.navigation.build()
            } : defaultData.navigation
        };
        const data: Prisma.NavigationLinkCreateInput = { ...requiredScalarData, ...defaultData, ...defaultAssociations, ...inputData };
        return data;
    };
    const buildList = (inputData: number | readonly Partial<Prisma.NavigationLinkCreateInput>[]) => Promise.all(normalizeList(inputData).map(data => build(data)));
    const pickForConnect = (inputData: NavigationLink) => ({
        id: inputData.id
    });
    const create = async (inputData: Partial<Prisma.NavigationLinkCreateInput> = {}) => {
        const data = await build(inputData).then(screen);
        return await getClient<PrismaClient>().navigationLink.create({ data });
    };
    const createList = (inputData: number | readonly Partial<Prisma.NavigationLinkCreateInput>[]) => Promise.all(normalizeList(inputData).map(data => create(data)));
    const createForConnect = (inputData: Partial<Prisma.NavigationLinkCreateInput> = {}) => create(inputData).then(pickForConnect);
    return {
        _factoryFor: "NavigationLink" as const,
        build,
        buildList,
        buildCreateInput: build,
        pickForConnect,
        create,
        createList,
        createForConnect,
    };
}

/**
 * Define factory for {@link NavigationLink} model.
 *
 * @param options
 * @returns factory {@link NavigationLinkFactoryInterface}
 */
export function defineNavigationLinkFactory(options: NavigationLinkFactoryDefineOptions = {}): NavigationLinkFactoryInterface {
    return defineNavigationLinkFactoryInternal(options);
}

type NavigationScalarOrEnumFields = {
    key: string;
    name: string;
};

type NavigationFactoryDefineInput = {
    id?: string;
    createdAt?: Date;
    modifiedAt?: Date;
    key?: string;
    links?: Prisma.NavigationLinkCreateNestedManyWithoutNavigationInput;
    name?: string;
};

type NavigationFactoryDefineOptions = {
    defaultData?: Resolver<NavigationFactoryDefineInput, BuildDataOptions>;
};

export interface NavigationFactoryInterface {
    readonly _factoryFor: "Navigation";
    build(inputData?: Partial<Prisma.NavigationCreateInput>): PromiseLike<Prisma.NavigationCreateInput>;
    buildCreateInput(inputData?: Partial<Prisma.NavigationCreateInput>): PromiseLike<Prisma.NavigationCreateInput>;
    buildList(inputData: number | readonly Partial<Prisma.NavigationCreateInput>[]): PromiseLike<Prisma.NavigationCreateInput[]>;
    pickForConnect(inputData: Navigation): Pick<Navigation, "id">;
    create(inputData?: Partial<Prisma.NavigationCreateInput>): PromiseLike<Navigation>;
    createList(inputData: number | readonly Partial<Prisma.NavigationCreateInput>[]): PromiseLike<Navigation[]>;
    createForConnect(inputData?: Partial<Prisma.NavigationCreateInput>): PromiseLike<Pick<Navigation, "id">>;
}

function autoGenerateNavigationScalarsOrEnums({ seq }: {
    readonly seq: number;
}): NavigationScalarOrEnumFields {
    return {
        key: getScalarFieldValueGenerator().String({ modelName: "Navigation", fieldName: "key", isId: false, isUnique: true, seq }),
        name: getScalarFieldValueGenerator().String({ modelName: "Navigation", fieldName: "name", isId: false, isUnique: false, seq })
    };
}

function defineNavigationFactoryInternal({ defaultData: defaultDataResolver }: NavigationFactoryDefineOptions): NavigationFactoryInterface {
    const seqKey = {};
    const getSeq = () => getSequenceCounter(seqKey);
    const screen = createScreener("Navigation", modelFieldDefinitions);
    const build = async (inputData: Partial<Prisma.NavigationCreateInput> = {}) => {
        const seq = getSeq();
        const requiredScalarData = autoGenerateNavigationScalarsOrEnums({ seq });
        const resolveValue = normalizeResolver<NavigationFactoryDefineInput, BuildDataOptions>(defaultDataResolver ?? {});
        const defaultData = await resolveValue({ seq });
        const defaultAssociations = {};
        const data: Prisma.NavigationCreateInput = { ...requiredScalarData, ...defaultData, ...defaultAssociations, ...inputData };
        return data;
    };
    const buildList = (inputData: number | readonly Partial<Prisma.NavigationCreateInput>[]) => Promise.all(normalizeList(inputData).map(data => build(data)));
    const pickForConnect = (inputData: Navigation) => ({
        id: inputData.id
    });
    const create = async (inputData: Partial<Prisma.NavigationCreateInput> = {}) => {
        const data = await build(inputData).then(screen);
        return await getClient<PrismaClient>().navigation.create({ data });
    };
    const createList = (inputData: number | readonly Partial<Prisma.NavigationCreateInput>[]) => Promise.all(normalizeList(inputData).map(data => create(data)));
    const createForConnect = (inputData: Partial<Prisma.NavigationCreateInput> = {}) => create(inputData).then(pickForConnect);
    return {
        _factoryFor: "Navigation" as const,
        build,
        buildList,
        buildCreateInput: build,
        pickForConnect,
        create,
        createList,
        createForConnect,
    };
}

/**
 * Define factory for {@link Navigation} model.
 *
 * @param options
 * @returns factory {@link NavigationFactoryInterface}
 */
export function defineNavigationFactory(options: NavigationFactoryDefineOptions = {}): NavigationFactoryInterface {
    return defineNavigationFactoryInternal(options);
}

type PageRevisionScalarOrEnumFields = {
    title: string;
    blocks: Prisma.JsonNullValueInput | Prisma.InputJsonValue;
};

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
    properties?: Prisma.MetadataPropertyCreateNestedManyWithoutPageRevisionInput;
    image?: PageRevisionimageFactory | Prisma.ImageCreateNestedOneWithoutPageRevisionImagesInput;
    socialMediaTitle?: string | null;
    socialMediaDescription?: string | null;
    socialMediaImage?: PageRevisionsocialMediaImageFactory | Prisma.ImageCreateNestedOneWithoutPageRevisionSocialMediaImagesInput;
    blocks?: Prisma.JsonNullValueInput | Prisma.InputJsonValue;
    PublishedPage?: Prisma.PageCreateNestedManyWithoutPublishedInput;
    PendingPage?: Prisma.PageCreateNestedManyWithoutPendingInput;
    DraftPage?: Prisma.PageCreateNestedManyWithoutDraftInput;
};

type PageRevisionFactoryDefineOptions = {
    defaultData?: Resolver<PageRevisionFactoryDefineInput, BuildDataOptions>;
};

function isPageRevisionimageFactory(x: PageRevisionimageFactory | Prisma.ImageCreateNestedOneWithoutPageRevisionImagesInput | undefined): x is PageRevisionimageFactory {
    return (x as any)?._factoryFor === "Image";
}

function isPageRevisionsocialMediaImageFactory(x: PageRevisionsocialMediaImageFactory | Prisma.ImageCreateNestedOneWithoutPageRevisionSocialMediaImagesInput | undefined): x is PageRevisionsocialMediaImageFactory {
    return (x as any)?._factoryFor === "Image";
}

export interface PageRevisionFactoryInterface {
    readonly _factoryFor: "PageRevision";
    build(inputData?: Partial<Prisma.PageRevisionCreateInput>): PromiseLike<Prisma.PageRevisionCreateInput>;
    buildCreateInput(inputData?: Partial<Prisma.PageRevisionCreateInput>): PromiseLike<Prisma.PageRevisionCreateInput>;
    buildList(inputData: number | readonly Partial<Prisma.PageRevisionCreateInput>[]): PromiseLike<Prisma.PageRevisionCreateInput[]>;
    pickForConnect(inputData: PageRevision): Pick<PageRevision, "id">;
    create(inputData?: Partial<Prisma.PageRevisionCreateInput>): PromiseLike<PageRevision>;
    createList(inputData: number | readonly Partial<Prisma.PageRevisionCreateInput>[]): PromiseLike<PageRevision[]>;
    createForConnect(inputData?: Partial<Prisma.PageRevisionCreateInput>): PromiseLike<Pick<PageRevision, "id">>;
}

function autoGeneratePageRevisionScalarsOrEnums({ seq }: {
    readonly seq: number;
}): PageRevisionScalarOrEnumFields {
    return {
        title: getScalarFieldValueGenerator().String({ modelName: "PageRevision", fieldName: "title", isId: false, isUnique: false, seq }),
        blocks: getScalarFieldValueGenerator().Json({ modelName: "PageRevision", fieldName: "blocks", isId: false, isUnique: false, seq })
    };
}

function definePageRevisionFactoryInternal({ defaultData: defaultDataResolver }: PageRevisionFactoryDefineOptions): PageRevisionFactoryInterface {
    const seqKey = {};
    const getSeq = () => getSequenceCounter(seqKey);
    const screen = createScreener("PageRevision", modelFieldDefinitions);
    const build = async (inputData: Partial<Prisma.PageRevisionCreateInput> = {}) => {
        const seq = getSeq();
        const requiredScalarData = autoGeneratePageRevisionScalarsOrEnums({ seq });
        const resolveValue = normalizeResolver<PageRevisionFactoryDefineInput, BuildDataOptions>(defaultDataResolver ?? {});
        const defaultData = await resolveValue({ seq });
        const defaultAssociations = {
            image: isPageRevisionimageFactory(defaultData.image) ? {
                create: await defaultData.image.build()
            } : defaultData.image,
            socialMediaImage: isPageRevisionsocialMediaImageFactory(defaultData.socialMediaImage) ? {
                create: await defaultData.socialMediaImage.build()
            } : defaultData.socialMediaImage
        };
        const data: Prisma.PageRevisionCreateInput = { ...requiredScalarData, ...defaultData, ...defaultAssociations, ...inputData };
        return data;
    };
    const buildList = (inputData: number | readonly Partial<Prisma.PageRevisionCreateInput>[]) => Promise.all(normalizeList(inputData).map(data => build(data)));
    const pickForConnect = (inputData: PageRevision) => ({
        id: inputData.id
    });
    const create = async (inputData: Partial<Prisma.PageRevisionCreateInput> = {}) => {
        const data = await build(inputData).then(screen);
        return await getClient<PrismaClient>().pageRevision.create({ data });
    };
    const createList = (inputData: number | readonly Partial<Prisma.PageRevisionCreateInput>[]) => Promise.all(normalizeList(inputData).map(data => create(data)));
    const createForConnect = (inputData: Partial<Prisma.PageRevisionCreateInput> = {}) => create(inputData).then(pickForConnect);
    return {
        _factoryFor: "PageRevision" as const,
        build,
        buildList,
        buildCreateInput: build,
        pickForConnect,
        create,
        createList,
        createForConnect,
    };
}

/**
 * Define factory for {@link PageRevision} model.
 *
 * @param options
 * @returns factory {@link PageRevisionFactoryInterface}
 */
export function definePageRevisionFactory(options: PageRevisionFactoryDefineOptions = {}): PageRevisionFactoryInterface {
    return definePageRevisionFactoryInternal(options);
}

type PageScalarOrEnumFields = {};

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
};

type PageFactoryDefineOptions = {
    defaultData?: Resolver<PageFactoryDefineInput, BuildDataOptions>;
};

function isPagepublishedFactory(x: PagepublishedFactory | Prisma.PageRevisionCreateNestedOneWithoutPublishedPageInput | undefined): x is PagepublishedFactory {
    return (x as any)?._factoryFor === "PageRevision";
}

function isPagependingFactory(x: PagependingFactory | Prisma.PageRevisionCreateNestedOneWithoutPendingPageInput | undefined): x is PagependingFactory {
    return (x as any)?._factoryFor === "PageRevision";
}

function isPagedraftFactory(x: PagedraftFactory | Prisma.PageRevisionCreateNestedOneWithoutDraftPageInput | undefined): x is PagedraftFactory {
    return (x as any)?._factoryFor === "PageRevision";
}

export interface PageFactoryInterface {
    readonly _factoryFor: "Page";
    build(inputData?: Partial<Prisma.PageCreateInput>): PromiseLike<Prisma.PageCreateInput>;
    buildCreateInput(inputData?: Partial<Prisma.PageCreateInput>): PromiseLike<Prisma.PageCreateInput>;
    buildList(inputData: number | readonly Partial<Prisma.PageCreateInput>[]): PromiseLike<Prisma.PageCreateInput[]>;
    pickForConnect(inputData: Page): Pick<Page, "id">;
    create(inputData?: Partial<Prisma.PageCreateInput>): PromiseLike<Page>;
    createList(inputData: number | readonly Partial<Prisma.PageCreateInput>[]): PromiseLike<Page[]>;
    createForConnect(inputData?: Partial<Prisma.PageCreateInput>): PromiseLike<Pick<Page, "id">>;
}

function autoGeneratePageScalarsOrEnums({ seq }: {
    readonly seq: number;
}): PageScalarOrEnumFields {
    return {};
}

function definePageFactoryInternal({ defaultData: defaultDataResolver }: PageFactoryDefineOptions): PageFactoryInterface {
    const seqKey = {};
    const getSeq = () => getSequenceCounter(seqKey);
    const screen = createScreener("Page", modelFieldDefinitions);
    const build = async (inputData: Partial<Prisma.PageCreateInput> = {}) => {
        const seq = getSeq();
        const requiredScalarData = autoGeneratePageScalarsOrEnums({ seq });
        const resolveValue = normalizeResolver<PageFactoryDefineInput, BuildDataOptions>(defaultDataResolver ?? {});
        const defaultData = await resolveValue({ seq });
        const defaultAssociations = {
            published: isPagepublishedFactory(defaultData.published) ? {
                create: await defaultData.published.build()
            } : defaultData.published,
            pending: isPagependingFactory(defaultData.pending) ? {
                create: await defaultData.pending.build()
            } : defaultData.pending,
            draft: isPagedraftFactory(defaultData.draft) ? {
                create: await defaultData.draft.build()
            } : defaultData.draft
        };
        const data: Prisma.PageCreateInput = { ...requiredScalarData, ...defaultData, ...defaultAssociations, ...inputData };
        return data;
    };
    const buildList = (inputData: number | readonly Partial<Prisma.PageCreateInput>[]) => Promise.all(normalizeList(inputData).map(data => build(data)));
    const pickForConnect = (inputData: Page) => ({
        id: inputData.id
    });
    const create = async (inputData: Partial<Prisma.PageCreateInput> = {}) => {
        const data = await build(inputData).then(screen);
        return await getClient<PrismaClient>().page.create({ data });
    };
    const createList = (inputData: number | readonly Partial<Prisma.PageCreateInput>[]) => Promise.all(normalizeList(inputData).map(data => create(data)));
    const createForConnect = (inputData: Partial<Prisma.PageCreateInput> = {}) => create(inputData).then(pickForConnect);
    return {
        _factoryFor: "Page" as const,
        build,
        buildList,
        buildCreateInput: build,
        pickForConnect,
        create,
        createList,
        createForConnect,
    };
}

/**
 * Define factory for {@link Page} model.
 *
 * @param options
 * @returns factory {@link PageFactoryInterface}
 */
export function definePageFactory(options: PageFactoryDefineOptions = {}): PageFactoryInterface {
    return definePageFactoryInternal(options);
}

type PaymentMethodScalarOrEnumFields = {
    name: string;
    slug: string;
    description: string;
    paymentProviderID: string;
    active: boolean;
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
    Subscription?: Prisma.SubscriptionCreateNestedManyWithoutPaymentMethodInput;
    Payment?: Prisma.PaymentCreateNestedManyWithoutPaymentMethodInput;
    subscriptionFlows?: Prisma.SubscriptionFlowCreateNestedManyWithoutPaymentMethodsInput;
};

type PaymentMethodFactoryDefineOptions = {
    defaultData?: Resolver<PaymentMethodFactoryDefineInput, BuildDataOptions>;
};

export interface PaymentMethodFactoryInterface {
    readonly _factoryFor: "PaymentMethod";
    build(inputData?: Partial<Prisma.PaymentMethodCreateInput>): PromiseLike<Prisma.PaymentMethodCreateInput>;
    buildCreateInput(inputData?: Partial<Prisma.PaymentMethodCreateInput>): PromiseLike<Prisma.PaymentMethodCreateInput>;
    buildList(inputData: number | readonly Partial<Prisma.PaymentMethodCreateInput>[]): PromiseLike<Prisma.PaymentMethodCreateInput[]>;
    pickForConnect(inputData: PaymentMethod): Pick<PaymentMethod, "id">;
    create(inputData?: Partial<Prisma.PaymentMethodCreateInput>): PromiseLike<PaymentMethod>;
    createList(inputData: number | readonly Partial<Prisma.PaymentMethodCreateInput>[]): PromiseLike<PaymentMethod[]>;
    createForConnect(inputData?: Partial<Prisma.PaymentMethodCreateInput>): PromiseLike<Pick<PaymentMethod, "id">>;
}

function autoGeneratePaymentMethodScalarsOrEnums({ seq }: {
    readonly seq: number;
}): PaymentMethodScalarOrEnumFields {
    return {
        name: getScalarFieldValueGenerator().String({ modelName: "PaymentMethod", fieldName: "name", isId: false, isUnique: false, seq }),
        slug: getScalarFieldValueGenerator().String({ modelName: "PaymentMethod", fieldName: "slug", isId: false, isUnique: false, seq }),
        description: getScalarFieldValueGenerator().String({ modelName: "PaymentMethod", fieldName: "description", isId: false, isUnique: false, seq }),
        paymentProviderID: getScalarFieldValueGenerator().String({ modelName: "PaymentMethod", fieldName: "paymentProviderID", isId: false, isUnique: false, seq }),
        active: getScalarFieldValueGenerator().Boolean({ modelName: "PaymentMethod", fieldName: "active", isId: false, isUnique: false, seq })
    };
}

function definePaymentMethodFactoryInternal({ defaultData: defaultDataResolver }: PaymentMethodFactoryDefineOptions): PaymentMethodFactoryInterface {
    const seqKey = {};
    const getSeq = () => getSequenceCounter(seqKey);
    const screen = createScreener("PaymentMethod", modelFieldDefinitions);
    const build = async (inputData: Partial<Prisma.PaymentMethodCreateInput> = {}) => {
        const seq = getSeq();
        const requiredScalarData = autoGeneratePaymentMethodScalarsOrEnums({ seq });
        const resolveValue = normalizeResolver<PaymentMethodFactoryDefineInput, BuildDataOptions>(defaultDataResolver ?? {});
        const defaultData = await resolveValue({ seq });
        const defaultAssociations = {};
        const data: Prisma.PaymentMethodCreateInput = { ...requiredScalarData, ...defaultData, ...defaultAssociations, ...inputData };
        return data;
    };
    const buildList = (inputData: number | readonly Partial<Prisma.PaymentMethodCreateInput>[]) => Promise.all(normalizeList(inputData).map(data => build(data)));
    const pickForConnect = (inputData: PaymentMethod) => ({
        id: inputData.id
    });
    const create = async (inputData: Partial<Prisma.PaymentMethodCreateInput> = {}) => {
        const data = await build(inputData).then(screen);
        return await getClient<PrismaClient>().paymentMethod.create({ data });
    };
    const createList = (inputData: number | readonly Partial<Prisma.PaymentMethodCreateInput>[]) => Promise.all(normalizeList(inputData).map(data => create(data)));
    const createForConnect = (inputData: Partial<Prisma.PaymentMethodCreateInput> = {}) => create(inputData).then(pickForConnect);
    return {
        _factoryFor: "PaymentMethod" as const,
        build,
        buildList,
        buildCreateInput: build,
        pickForConnect,
        create,
        createList,
        createForConnect,
    };
}

/**
 * Define factory for {@link PaymentMethod} model.
 *
 * @param options
 * @returns factory {@link PaymentMethodFactoryInterface}
 */
export function definePaymentMethodFactory(options: PaymentMethodFactoryDefineOptions = {}): PaymentMethodFactoryInterface {
    return definePaymentMethodFactoryInternal(options);
}

type PaymentScalarOrEnumFields = {
    invoiceID: string;
    state: PaymentState;
};

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
};

function isPaymentpaymentMethodFactory(x: PaymentpaymentMethodFactory | Prisma.PaymentMethodCreateNestedOneWithoutPaymentInput | undefined): x is PaymentpaymentMethodFactory {
    return (x as any)?._factoryFor === "PaymentMethod";
}

export interface PaymentFactoryInterface {
    readonly _factoryFor: "Payment";
    build(inputData?: Partial<Prisma.PaymentCreateInput>): PromiseLike<Prisma.PaymentCreateInput>;
    buildCreateInput(inputData?: Partial<Prisma.PaymentCreateInput>): PromiseLike<Prisma.PaymentCreateInput>;
    buildList(inputData: number | readonly Partial<Prisma.PaymentCreateInput>[]): PromiseLike<Prisma.PaymentCreateInput[]>;
    pickForConnect(inputData: Payment): Pick<Payment, "id">;
    create(inputData?: Partial<Prisma.PaymentCreateInput>): PromiseLike<Payment>;
    createList(inputData: number | readonly Partial<Prisma.PaymentCreateInput>[]): PromiseLike<Payment[]>;
    createForConnect(inputData?: Partial<Prisma.PaymentCreateInput>): PromiseLike<Pick<Payment, "id">>;
}

function autoGeneratePaymentScalarsOrEnums({ seq }: {
    readonly seq: number;
}): PaymentScalarOrEnumFields {
    return {
        invoiceID: getScalarFieldValueGenerator().String({ modelName: "Payment", fieldName: "invoiceID", isId: false, isUnique: false, seq }),
        state: "created"
    };
}

function definePaymentFactoryInternal({ defaultData: defaultDataResolver }: PaymentFactoryDefineOptions): PaymentFactoryInterface {
    const seqKey = {};
    const getSeq = () => getSequenceCounter(seqKey);
    const screen = createScreener("Payment", modelFieldDefinitions);
    const build = async (inputData: Partial<Prisma.PaymentCreateInput> = {}) => {
        const seq = getSeq();
        const requiredScalarData = autoGeneratePaymentScalarsOrEnums({ seq });
        const resolveValue = normalizeResolver<PaymentFactoryDefineInput, BuildDataOptions>(defaultDataResolver ?? {});
        const defaultData = await resolveValue({ seq });
        const defaultAssociations = {
            paymentMethod: isPaymentpaymentMethodFactory(defaultData.paymentMethod) ? {
                create: await defaultData.paymentMethod.build()
            } : defaultData.paymentMethod
        };
        const data: Prisma.PaymentCreateInput = { ...requiredScalarData, ...defaultData, ...defaultAssociations, ...inputData };
        return data;
    };
    const buildList = (inputData: number | readonly Partial<Prisma.PaymentCreateInput>[]) => Promise.all(normalizeList(inputData).map(data => build(data)));
    const pickForConnect = (inputData: Payment) => ({
        id: inputData.id
    });
    const create = async (inputData: Partial<Prisma.PaymentCreateInput> = {}) => {
        const data = await build(inputData).then(screen);
        return await getClient<PrismaClient>().payment.create({ data });
    };
    const createList = (inputData: number | readonly Partial<Prisma.PaymentCreateInput>[]) => Promise.all(normalizeList(inputData).map(data => create(data)));
    const createForConnect = (inputData: Partial<Prisma.PaymentCreateInput> = {}) => create(inputData).then(pickForConnect);
    return {
        _factoryFor: "Payment" as const,
        build,
        buildList,
        buildCreateInput: build,
        pickForConnect,
        create,
        createList,
        createForConnect,
    };
}

/**
 * Define factory for {@link Payment} model.
 *
 * @param options
 * @returns factory {@link PaymentFactoryInterface}
 */
export function definePaymentFactory(options: PaymentFactoryDefineOptions): PaymentFactoryInterface {
    return definePaymentFactoryInternal(options);
}

type PeerProfileScalarOrEnumFields = {
    name: string;
    themeColor: string;
    themeFontColor: string;
    callToActionURL: string;
    callToActionText: Prisma.JsonNullValueInput | Prisma.InputJsonValue;
};

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
};

function isPeerProfilelogoFactory(x: PeerProfilelogoFactory | Prisma.ImageCreateNestedOneWithoutPeerProfileInput | undefined): x is PeerProfilelogoFactory {
    return (x as any)?._factoryFor === "Image";
}

export interface PeerProfileFactoryInterface {
    readonly _factoryFor: "PeerProfile";
    build(inputData?: Partial<Prisma.PeerProfileCreateInput>): PromiseLike<Prisma.PeerProfileCreateInput>;
    buildCreateInput(inputData?: Partial<Prisma.PeerProfileCreateInput>): PromiseLike<Prisma.PeerProfileCreateInput>;
    buildList(inputData: number | readonly Partial<Prisma.PeerProfileCreateInput>[]): PromiseLike<Prisma.PeerProfileCreateInput[]>;
    pickForConnect(inputData: PeerProfile): Pick<PeerProfile, "id">;
    create(inputData?: Partial<Prisma.PeerProfileCreateInput>): PromiseLike<PeerProfile>;
    createList(inputData: number | readonly Partial<Prisma.PeerProfileCreateInput>[]): PromiseLike<PeerProfile[]>;
    createForConnect(inputData?: Partial<Prisma.PeerProfileCreateInput>): PromiseLike<Pick<PeerProfile, "id">>;
}

function autoGeneratePeerProfileScalarsOrEnums({ seq }: {
    readonly seq: number;
}): PeerProfileScalarOrEnumFields {
    return {
        name: getScalarFieldValueGenerator().String({ modelName: "PeerProfile", fieldName: "name", isId: false, isUnique: false, seq }),
        themeColor: getScalarFieldValueGenerator().String({ modelName: "PeerProfile", fieldName: "themeColor", isId: false, isUnique: false, seq }),
        themeFontColor: getScalarFieldValueGenerator().String({ modelName: "PeerProfile", fieldName: "themeFontColor", isId: false, isUnique: false, seq }),
        callToActionURL: getScalarFieldValueGenerator().String({ modelName: "PeerProfile", fieldName: "callToActionURL", isId: false, isUnique: false, seq }),
        callToActionText: getScalarFieldValueGenerator().Json({ modelName: "PeerProfile", fieldName: "callToActionText", isId: false, isUnique: false, seq })
    };
}

function definePeerProfileFactoryInternal({ defaultData: defaultDataResolver }: PeerProfileFactoryDefineOptions): PeerProfileFactoryInterface {
    const seqKey = {};
    const getSeq = () => getSequenceCounter(seqKey);
    const screen = createScreener("PeerProfile", modelFieldDefinitions);
    const build = async (inputData: Partial<Prisma.PeerProfileCreateInput> = {}) => {
        const seq = getSeq();
        const requiredScalarData = autoGeneratePeerProfileScalarsOrEnums({ seq });
        const resolveValue = normalizeResolver<PeerProfileFactoryDefineInput, BuildDataOptions>(defaultDataResolver ?? {});
        const defaultData = await resolveValue({ seq });
        const defaultAssociations = {
            logo: isPeerProfilelogoFactory(defaultData.logo) ? {
                create: await defaultData.logo.build()
            } : defaultData.logo
        };
        const data: Prisma.PeerProfileCreateInput = { ...requiredScalarData, ...defaultData, ...defaultAssociations, ...inputData };
        return data;
    };
    const buildList = (inputData: number | readonly Partial<Prisma.PeerProfileCreateInput>[]) => Promise.all(normalizeList(inputData).map(data => build(data)));
    const pickForConnect = (inputData: PeerProfile) => ({
        id: inputData.id
    });
    const create = async (inputData: Partial<Prisma.PeerProfileCreateInput> = {}) => {
        const data = await build(inputData).then(screen);
        return await getClient<PrismaClient>().peerProfile.create({ data });
    };
    const createList = (inputData: number | readonly Partial<Prisma.PeerProfileCreateInput>[]) => Promise.all(normalizeList(inputData).map(data => create(data)));
    const createForConnect = (inputData: Partial<Prisma.PeerProfileCreateInput> = {}) => create(inputData).then(pickForConnect);
    return {
        _factoryFor: "PeerProfile" as const,
        build,
        buildList,
        buildCreateInput: build,
        pickForConnect,
        create,
        createList,
        createForConnect,
    };
}

/**
 * Define factory for {@link PeerProfile} model.
 *
 * @param options
 * @returns factory {@link PeerProfileFactoryInterface}
 */
export function definePeerProfileFactory(options: PeerProfileFactoryDefineOptions = {}): PeerProfileFactoryInterface {
    return definePeerProfileFactoryInternal(options);
}

type PeerScalarOrEnumFields = {
    name: string;
    slug: string;
    hostURL: string;
    token: string;
};

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
};

export interface PeerFactoryInterface {
    readonly _factoryFor: "Peer";
    build(inputData?: Partial<Prisma.PeerCreateInput>): PromiseLike<Prisma.PeerCreateInput>;
    buildCreateInput(inputData?: Partial<Prisma.PeerCreateInput>): PromiseLike<Prisma.PeerCreateInput>;
    buildList(inputData: number | readonly Partial<Prisma.PeerCreateInput>[]): PromiseLike<Prisma.PeerCreateInput[]>;
    pickForConnect(inputData: Peer): Pick<Peer, "id">;
    create(inputData?: Partial<Prisma.PeerCreateInput>): PromiseLike<Peer>;
    createList(inputData: number | readonly Partial<Prisma.PeerCreateInput>[]): PromiseLike<Peer[]>;
    createForConnect(inputData?: Partial<Prisma.PeerCreateInput>): PromiseLike<Pick<Peer, "id">>;
}

function autoGeneratePeerScalarsOrEnums({ seq }: {
    readonly seq: number;
}): PeerScalarOrEnumFields {
    return {
        name: getScalarFieldValueGenerator().String({ modelName: "Peer", fieldName: "name", isId: false, isUnique: false, seq }),
        slug: getScalarFieldValueGenerator().String({ modelName: "Peer", fieldName: "slug", isId: false, isUnique: true, seq }),
        hostURL: getScalarFieldValueGenerator().String({ modelName: "Peer", fieldName: "hostURL", isId: false, isUnique: false, seq }),
        token: getScalarFieldValueGenerator().String({ modelName: "Peer", fieldName: "token", isId: false, isUnique: false, seq })
    };
}

function definePeerFactoryInternal({ defaultData: defaultDataResolver }: PeerFactoryDefineOptions): PeerFactoryInterface {
    const seqKey = {};
    const getSeq = () => getSequenceCounter(seqKey);
    const screen = createScreener("Peer", modelFieldDefinitions);
    const build = async (inputData: Partial<Prisma.PeerCreateInput> = {}) => {
        const seq = getSeq();
        const requiredScalarData = autoGeneratePeerScalarsOrEnums({ seq });
        const resolveValue = normalizeResolver<PeerFactoryDefineInput, BuildDataOptions>(defaultDataResolver ?? {});
        const defaultData = await resolveValue({ seq });
        const defaultAssociations = {};
        const data: Prisma.PeerCreateInput = { ...requiredScalarData, ...defaultData, ...defaultAssociations, ...inputData };
        return data;
    };
    const buildList = (inputData: number | readonly Partial<Prisma.PeerCreateInput>[]) => Promise.all(normalizeList(inputData).map(data => build(data)));
    const pickForConnect = (inputData: Peer) => ({
        id: inputData.id
    });
    const create = async (inputData: Partial<Prisma.PeerCreateInput> = {}) => {
        const data = await build(inputData).then(screen);
        return await getClient<PrismaClient>().peer.create({ data });
    };
    const createList = (inputData: number | readonly Partial<Prisma.PeerCreateInput>[]) => Promise.all(normalizeList(inputData).map(data => create(data)));
    const createForConnect = (inputData: Partial<Prisma.PeerCreateInput> = {}) => create(inputData).then(pickForConnect);
    return {
        _factoryFor: "Peer" as const,
        build,
        buildList,
        buildCreateInput: build,
        pickForConnect,
        create,
        createList,
        createForConnect,
    };
}

/**
 * Define factory for {@link Peer} model.
 *
 * @param options
 * @returns factory {@link PeerFactoryInterface}
 */
export function definePeerFactory(options: PeerFactoryDefineOptions = {}): PeerFactoryInterface {
    return definePeerFactoryInternal(options);
}

type TokenScalarOrEnumFields = {
    name: string;
    token: string;
};

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
};

export interface TokenFactoryInterface {
    readonly _factoryFor: "Token";
    build(inputData?: Partial<Prisma.TokenCreateInput>): PromiseLike<Prisma.TokenCreateInput>;
    buildCreateInput(inputData?: Partial<Prisma.TokenCreateInput>): PromiseLike<Prisma.TokenCreateInput>;
    buildList(inputData: number | readonly Partial<Prisma.TokenCreateInput>[]): PromiseLike<Prisma.TokenCreateInput[]>;
    pickForConnect(inputData: Token): Pick<Token, "id">;
    create(inputData?: Partial<Prisma.TokenCreateInput>): PromiseLike<Token>;
    createList(inputData: number | readonly Partial<Prisma.TokenCreateInput>[]): PromiseLike<Token[]>;
    createForConnect(inputData?: Partial<Prisma.TokenCreateInput>): PromiseLike<Pick<Token, "id">>;
}

function autoGenerateTokenScalarsOrEnums({ seq }: {
    readonly seq: number;
}): TokenScalarOrEnumFields {
    return {
        name: getScalarFieldValueGenerator().String({ modelName: "Token", fieldName: "name", isId: false, isUnique: true, seq }),
        token: getScalarFieldValueGenerator().String({ modelName: "Token", fieldName: "token", isId: false, isUnique: false, seq })
    };
}

function defineTokenFactoryInternal({ defaultData: defaultDataResolver }: TokenFactoryDefineOptions): TokenFactoryInterface {
    const seqKey = {};
    const getSeq = () => getSequenceCounter(seqKey);
    const screen = createScreener("Token", modelFieldDefinitions);
    const build = async (inputData: Partial<Prisma.TokenCreateInput> = {}) => {
        const seq = getSeq();
        const requiredScalarData = autoGenerateTokenScalarsOrEnums({ seq });
        const resolveValue = normalizeResolver<TokenFactoryDefineInput, BuildDataOptions>(defaultDataResolver ?? {});
        const defaultData = await resolveValue({ seq });
        const defaultAssociations = {};
        const data: Prisma.TokenCreateInput = { ...requiredScalarData, ...defaultData, ...defaultAssociations, ...inputData };
        return data;
    };
    const buildList = (inputData: number | readonly Partial<Prisma.TokenCreateInput>[]) => Promise.all(normalizeList(inputData).map(data => build(data)));
    const pickForConnect = (inputData: Token) => ({
        id: inputData.id
    });
    const create = async (inputData: Partial<Prisma.TokenCreateInput> = {}) => {
        const data = await build(inputData).then(screen);
        return await getClient<PrismaClient>().token.create({ data });
    };
    const createList = (inputData: number | readonly Partial<Prisma.TokenCreateInput>[]) => Promise.all(normalizeList(inputData).map(data => create(data)));
    const createForConnect = (inputData: Partial<Prisma.TokenCreateInput> = {}) => create(inputData).then(pickForConnect);
    return {
        _factoryFor: "Token" as const,
        build,
        buildList,
        buildCreateInput: build,
        pickForConnect,
        create,
        createList,
        createForConnect,
    };
}

/**
 * Define factory for {@link Token} model.
 *
 * @param options
 * @returns factory {@link TokenFactoryInterface}
 */
export function defineTokenFactory(options: TokenFactoryDefineOptions = {}): TokenFactoryInterface {
    return defineTokenFactoryInternal(options);
}

type SessionScalarOrEnumFields = {
    expiresAt: Date;
    token: string;
};

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
};

function isSessionuserFactory(x: SessionuserFactory | Prisma.UserCreateNestedOneWithoutSessionInput | undefined): x is SessionuserFactory {
    return (x as any)?._factoryFor === "User";
}

export interface SessionFactoryInterface {
    readonly _factoryFor: "Session";
    build(inputData?: Partial<Prisma.SessionCreateInput>): PromiseLike<Prisma.SessionCreateInput>;
    buildCreateInput(inputData?: Partial<Prisma.SessionCreateInput>): PromiseLike<Prisma.SessionCreateInput>;
    buildList(inputData: number | readonly Partial<Prisma.SessionCreateInput>[]): PromiseLike<Prisma.SessionCreateInput[]>;
    pickForConnect(inputData: Session): Pick<Session, "id">;
    create(inputData?: Partial<Prisma.SessionCreateInput>): PromiseLike<Session>;
    createList(inputData: number | readonly Partial<Prisma.SessionCreateInput>[]): PromiseLike<Session[]>;
    createForConnect(inputData?: Partial<Prisma.SessionCreateInput>): PromiseLike<Pick<Session, "id">>;
}

function autoGenerateSessionScalarsOrEnums({ seq }: {
    readonly seq: number;
}): SessionScalarOrEnumFields {
    return {
        expiresAt: getScalarFieldValueGenerator().DateTime({ modelName: "Session", fieldName: "expiresAt", isId: false, isUnique: false, seq }),
        token: getScalarFieldValueGenerator().String({ modelName: "Session", fieldName: "token", isId: false, isUnique: true, seq })
    };
}

function defineSessionFactoryInternal({ defaultData: defaultDataResolver }: SessionFactoryDefineOptions): SessionFactoryInterface {
    const seqKey = {};
    const getSeq = () => getSequenceCounter(seqKey);
    const screen = createScreener("Session", modelFieldDefinitions);
    const build = async (inputData: Partial<Prisma.SessionCreateInput> = {}) => {
        const seq = getSeq();
        const requiredScalarData = autoGenerateSessionScalarsOrEnums({ seq });
        const resolveValue = normalizeResolver<SessionFactoryDefineInput, BuildDataOptions>(defaultDataResolver ?? {});
        const defaultData = await resolveValue({ seq });
        const defaultAssociations = {
            user: isSessionuserFactory(defaultData.user) ? {
                create: await defaultData.user.build()
            } : defaultData.user
        };
        const data: Prisma.SessionCreateInput = { ...requiredScalarData, ...defaultData, ...defaultAssociations, ...inputData };
        return data;
    };
    const buildList = (inputData: number | readonly Partial<Prisma.SessionCreateInput>[]) => Promise.all(normalizeList(inputData).map(data => build(data)));
    const pickForConnect = (inputData: Session) => ({
        id: inputData.id
    });
    const create = async (inputData: Partial<Prisma.SessionCreateInput> = {}) => {
        const data = await build(inputData).then(screen);
        return await getClient<PrismaClient>().session.create({ data });
    };
    const createList = (inputData: number | readonly Partial<Prisma.SessionCreateInput>[]) => Promise.all(normalizeList(inputData).map(data => create(data)));
    const createForConnect = (inputData: Partial<Prisma.SessionCreateInput> = {}) => create(inputData).then(pickForConnect);
    return {
        _factoryFor: "Session" as const,
        build,
        buildList,
        buildCreateInput: build,
        pickForConnect,
        create,
        createList,
        createForConnect,
    };
}

/**
 * Define factory for {@link Session} model.
 *
 * @param options
 * @returns factory {@link SessionFactoryInterface}
 */
export function defineSessionFactory(options: SessionFactoryDefineOptions): SessionFactoryInterface {
    return defineSessionFactoryInternal(options);
}

type SubscriptionPeriodScalarOrEnumFields = {
    startsAt: Date;
    endsAt: Date;
    paymentPeriodicity: PaymentPeriodicity;
    amount: number;
};

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
};

function isSubscriptionPeriodinvoiceFactory(x: SubscriptionPeriodinvoiceFactory | Prisma.InvoiceCreateNestedOneWithoutSubscriptionPeriodsInput | undefined): x is SubscriptionPeriodinvoiceFactory {
    return (x as any)?._factoryFor === "Invoice";
}

function isSubscriptionPeriodsubscriptionFactory(x: SubscriptionPeriodsubscriptionFactory | Prisma.SubscriptionCreateNestedOneWithoutPeriodsInput | undefined): x is SubscriptionPeriodsubscriptionFactory {
    return (x as any)?._factoryFor === "Subscription";
}

export interface SubscriptionPeriodFactoryInterface {
    readonly _factoryFor: "SubscriptionPeriod";
    build(inputData?: Partial<Prisma.SubscriptionPeriodCreateInput>): PromiseLike<Prisma.SubscriptionPeriodCreateInput>;
    buildCreateInput(inputData?: Partial<Prisma.SubscriptionPeriodCreateInput>): PromiseLike<Prisma.SubscriptionPeriodCreateInput>;
    buildList(inputData: number | readonly Partial<Prisma.SubscriptionPeriodCreateInput>[]): PromiseLike<Prisma.SubscriptionPeriodCreateInput[]>;
    pickForConnect(inputData: SubscriptionPeriod): Pick<SubscriptionPeriod, "id">;
    create(inputData?: Partial<Prisma.SubscriptionPeriodCreateInput>): PromiseLike<SubscriptionPeriod>;
    createList(inputData: number | readonly Partial<Prisma.SubscriptionPeriodCreateInput>[]): PromiseLike<SubscriptionPeriod[]>;
    createForConnect(inputData?: Partial<Prisma.SubscriptionPeriodCreateInput>): PromiseLike<Pick<SubscriptionPeriod, "id">>;
}

function autoGenerateSubscriptionPeriodScalarsOrEnums({ seq }: {
    readonly seq: number;
}): SubscriptionPeriodScalarOrEnumFields {
    return {
        startsAt: getScalarFieldValueGenerator().DateTime({ modelName: "SubscriptionPeriod", fieldName: "startsAt", isId: false, isUnique: false, seq }),
        endsAt: getScalarFieldValueGenerator().DateTime({ modelName: "SubscriptionPeriod", fieldName: "endsAt", isId: false, isUnique: false, seq }),
        paymentPeriodicity: "monthly",
        amount: getScalarFieldValueGenerator().Float({ modelName: "SubscriptionPeriod", fieldName: "amount", isId: false, isUnique: false, seq })
    };
}

function defineSubscriptionPeriodFactoryInternal({ defaultData: defaultDataResolver }: SubscriptionPeriodFactoryDefineOptions): SubscriptionPeriodFactoryInterface {
    const seqKey = {};
    const getSeq = () => getSequenceCounter(seqKey);
    const screen = createScreener("SubscriptionPeriod", modelFieldDefinitions);
    const build = async (inputData: Partial<Prisma.SubscriptionPeriodCreateInput> = {}) => {
        const seq = getSeq();
        const requiredScalarData = autoGenerateSubscriptionPeriodScalarsOrEnums({ seq });
        const resolveValue = normalizeResolver<SubscriptionPeriodFactoryDefineInput, BuildDataOptions>(defaultDataResolver ?? {});
        const defaultData = await resolveValue({ seq });
        const defaultAssociations = {
            invoice: isSubscriptionPeriodinvoiceFactory(defaultData.invoice) ? {
                create: await defaultData.invoice.build()
            } : defaultData.invoice,
            subscription: isSubscriptionPeriodsubscriptionFactory(defaultData.subscription) ? {
                create: await defaultData.subscription.build()
            } : defaultData.subscription
        };
        const data: Prisma.SubscriptionPeriodCreateInput = { ...requiredScalarData, ...defaultData, ...defaultAssociations, ...inputData };
        return data;
    };
    const buildList = (inputData: number | readonly Partial<Prisma.SubscriptionPeriodCreateInput>[]) => Promise.all(normalizeList(inputData).map(data => build(data)));
    const pickForConnect = (inputData: SubscriptionPeriod) => ({
        id: inputData.id
    });
    const create = async (inputData: Partial<Prisma.SubscriptionPeriodCreateInput> = {}) => {
        const data = await build(inputData).then(screen);
        return await getClient<PrismaClient>().subscriptionPeriod.create({ data });
    };
    const createList = (inputData: number | readonly Partial<Prisma.SubscriptionPeriodCreateInput>[]) => Promise.all(normalizeList(inputData).map(data => create(data)));
    const createForConnect = (inputData: Partial<Prisma.SubscriptionPeriodCreateInput> = {}) => create(inputData).then(pickForConnect);
    return {
        _factoryFor: "SubscriptionPeriod" as const,
        build,
        buildList,
        buildCreateInput: build,
        pickForConnect,
        create,
        createList,
        createForConnect,
    };
}

/**
 * Define factory for {@link SubscriptionPeriod} model.
 *
 * @param options
 * @returns factory {@link SubscriptionPeriodFactoryInterface}
 */
export function defineSubscriptionPeriodFactory(options: SubscriptionPeriodFactoryDefineOptions): SubscriptionPeriodFactoryInterface {
    return defineSubscriptionPeriodFactoryInternal(options);
}

type SubscriptionDeactivationScalarOrEnumFields = {
    date: Date;
    reason: SubscriptionDeactivationReason;
};

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
};

function isSubscriptionDeactivationsubscriptionFactory(x: SubscriptionDeactivationsubscriptionFactory | Prisma.SubscriptionCreateNestedOneWithoutDeactivationInput | undefined): x is SubscriptionDeactivationsubscriptionFactory {
    return (x as any)?._factoryFor === "Subscription";
}

export interface SubscriptionDeactivationFactoryInterface {
    readonly _factoryFor: "SubscriptionDeactivation";
    build(inputData?: Partial<Prisma.SubscriptionDeactivationCreateInput>): PromiseLike<Prisma.SubscriptionDeactivationCreateInput>;
    buildCreateInput(inputData?: Partial<Prisma.SubscriptionDeactivationCreateInput>): PromiseLike<Prisma.SubscriptionDeactivationCreateInput>;
    buildList(inputData: number | readonly Partial<Prisma.SubscriptionDeactivationCreateInput>[]): PromiseLike<Prisma.SubscriptionDeactivationCreateInput[]>;
    pickForConnect(inputData: SubscriptionDeactivation): Pick<SubscriptionDeactivation, "id">;
    create(inputData?: Partial<Prisma.SubscriptionDeactivationCreateInput>): PromiseLike<SubscriptionDeactivation>;
    createList(inputData: number | readonly Partial<Prisma.SubscriptionDeactivationCreateInput>[]): PromiseLike<SubscriptionDeactivation[]>;
    createForConnect(inputData?: Partial<Prisma.SubscriptionDeactivationCreateInput>): PromiseLike<Pick<SubscriptionDeactivation, "id">>;
}

function autoGenerateSubscriptionDeactivationScalarsOrEnums({ seq }: {
    readonly seq: number;
}): SubscriptionDeactivationScalarOrEnumFields {
    return {
        date: getScalarFieldValueGenerator().DateTime({ modelName: "SubscriptionDeactivation", fieldName: "date", isId: false, isUnique: false, seq }),
        reason: "none"
    };
}

function defineSubscriptionDeactivationFactoryInternal({ defaultData: defaultDataResolver }: SubscriptionDeactivationFactoryDefineOptions): SubscriptionDeactivationFactoryInterface {
    const seqKey = {};
    const getSeq = () => getSequenceCounter(seqKey);
    const screen = createScreener("SubscriptionDeactivation", modelFieldDefinitions);
    const build = async (inputData: Partial<Prisma.SubscriptionDeactivationCreateInput> = {}) => {
        const seq = getSeq();
        const requiredScalarData = autoGenerateSubscriptionDeactivationScalarsOrEnums({ seq });
        const resolveValue = normalizeResolver<SubscriptionDeactivationFactoryDefineInput, BuildDataOptions>(defaultDataResolver ?? {});
        const defaultData = await resolveValue({ seq });
        const defaultAssociations = {
            subscription: isSubscriptionDeactivationsubscriptionFactory(defaultData.subscription) ? {
                create: await defaultData.subscription.build()
            } : defaultData.subscription
        };
        const data: Prisma.SubscriptionDeactivationCreateInput = { ...requiredScalarData, ...defaultData, ...defaultAssociations, ...inputData };
        return data;
    };
    const buildList = (inputData: number | readonly Partial<Prisma.SubscriptionDeactivationCreateInput>[]) => Promise.all(normalizeList(inputData).map(data => build(data)));
    const pickForConnect = (inputData: SubscriptionDeactivation) => ({
        id: inputData.id
    });
    const create = async (inputData: Partial<Prisma.SubscriptionDeactivationCreateInput> = {}) => {
        const data = await build(inputData).then(screen);
        return await getClient<PrismaClient>().subscriptionDeactivation.create({ data });
    };
    const createList = (inputData: number | readonly Partial<Prisma.SubscriptionDeactivationCreateInput>[]) => Promise.all(normalizeList(inputData).map(data => create(data)));
    const createForConnect = (inputData: Partial<Prisma.SubscriptionDeactivationCreateInput> = {}) => create(inputData).then(pickForConnect);
    return {
        _factoryFor: "SubscriptionDeactivation" as const,
        build,
        buildList,
        buildCreateInput: build,
        pickForConnect,
        create,
        createList,
        createForConnect,
    };
}

/**
 * Define factory for {@link SubscriptionDeactivation} model.
 *
 * @param options
 * @returns factory {@link SubscriptionDeactivationFactoryInterface}
 */
export function defineSubscriptionDeactivationFactory(options: SubscriptionDeactivationFactoryDefineOptions): SubscriptionDeactivationFactoryInterface {
    return defineSubscriptionDeactivationFactoryInternal(options);
}

type SubscriptionScalarOrEnumFields = {
    paymentPeriodicity: PaymentPeriodicity;
    monthlyAmount: number;
    autoRenew: boolean;
    startsAt: Date;
};

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
};

function isSubscriptiondeactivationFactory(x: SubscriptiondeactivationFactory | Prisma.SubscriptionDeactivationCreateNestedOneWithoutSubscriptionInput | undefined): x is SubscriptiondeactivationFactory {
    return (x as any)?._factoryFor === "SubscriptionDeactivation";
}

function isSubscriptionpaymentMethodFactory(x: SubscriptionpaymentMethodFactory | Prisma.PaymentMethodCreateNestedOneWithoutSubscriptionInput | undefined): x is SubscriptionpaymentMethodFactory {
    return (x as any)?._factoryFor === "PaymentMethod";
}

function isSubscriptionmemberPlanFactory(x: SubscriptionmemberPlanFactory | Prisma.MemberPlanCreateNestedOneWithoutSubscriptionInput | undefined): x is SubscriptionmemberPlanFactory {
    return (x as any)?._factoryFor === "MemberPlan";
}

function isSubscriptionuserFactory(x: SubscriptionuserFactory | Prisma.UserCreateNestedOneWithoutSubscriptionInput | undefined): x is SubscriptionuserFactory {
    return (x as any)?._factoryFor === "User";
}

export interface SubscriptionFactoryInterface {
    readonly _factoryFor: "Subscription";
    build(inputData?: Partial<Prisma.SubscriptionCreateInput>): PromiseLike<Prisma.SubscriptionCreateInput>;
    buildCreateInput(inputData?: Partial<Prisma.SubscriptionCreateInput>): PromiseLike<Prisma.SubscriptionCreateInput>;
    buildList(inputData: number | readonly Partial<Prisma.SubscriptionCreateInput>[]): PromiseLike<Prisma.SubscriptionCreateInput[]>;
    pickForConnect(inputData: Subscription): Pick<Subscription, "id">;
    create(inputData?: Partial<Prisma.SubscriptionCreateInput>): PromiseLike<Subscription>;
    createList(inputData: number | readonly Partial<Prisma.SubscriptionCreateInput>[]): PromiseLike<Subscription[]>;
    createForConnect(inputData?: Partial<Prisma.SubscriptionCreateInput>): PromiseLike<Pick<Subscription, "id">>;
}

function autoGenerateSubscriptionScalarsOrEnums({ seq }: {
    readonly seq: number;
}): SubscriptionScalarOrEnumFields {
    return {
        paymentPeriodicity: "monthly",
        monthlyAmount: getScalarFieldValueGenerator().Float({ modelName: "Subscription", fieldName: "monthlyAmount", isId: false, isUnique: false, seq }),
        autoRenew: getScalarFieldValueGenerator().Boolean({ modelName: "Subscription", fieldName: "autoRenew", isId: false, isUnique: false, seq }),
        startsAt: getScalarFieldValueGenerator().DateTime({ modelName: "Subscription", fieldName: "startsAt", isId: false, isUnique: false, seq })
    };
}

function defineSubscriptionFactoryInternal({ defaultData: defaultDataResolver }: SubscriptionFactoryDefineOptions): SubscriptionFactoryInterface {
    const seqKey = {};
    const getSeq = () => getSequenceCounter(seqKey);
    const screen = createScreener("Subscription", modelFieldDefinitions);
    const build = async (inputData: Partial<Prisma.SubscriptionCreateInput> = {}) => {
        const seq = getSeq();
        const requiredScalarData = autoGenerateSubscriptionScalarsOrEnums({ seq });
        const resolveValue = normalizeResolver<SubscriptionFactoryDefineInput, BuildDataOptions>(defaultDataResolver ?? {});
        const defaultData = await resolveValue({ seq });
        const defaultAssociations = {
            deactivation: isSubscriptiondeactivationFactory(defaultData.deactivation) ? {
                create: await defaultData.deactivation.build()
            } : defaultData.deactivation,
            paymentMethod: isSubscriptionpaymentMethodFactory(defaultData.paymentMethod) ? {
                create: await defaultData.paymentMethod.build()
            } : defaultData.paymentMethod,
            memberPlan: isSubscriptionmemberPlanFactory(defaultData.memberPlan) ? {
                create: await defaultData.memberPlan.build()
            } : defaultData.memberPlan,
            user: isSubscriptionuserFactory(defaultData.user) ? {
                create: await defaultData.user.build()
            } : defaultData.user
        };
        const data: Prisma.SubscriptionCreateInput = { ...requiredScalarData, ...defaultData, ...defaultAssociations, ...inputData };
        return data;
    };
    const buildList = (inputData: number | readonly Partial<Prisma.SubscriptionCreateInput>[]) => Promise.all(normalizeList(inputData).map(data => build(data)));
    const pickForConnect = (inputData: Subscription) => ({
        id: inputData.id
    });
    const create = async (inputData: Partial<Prisma.SubscriptionCreateInput> = {}) => {
        const data = await build(inputData).then(screen);
        return await getClient<PrismaClient>().subscription.create({ data });
    };
    const createList = (inputData: number | readonly Partial<Prisma.SubscriptionCreateInput>[]) => Promise.all(normalizeList(inputData).map(data => create(data)));
    const createForConnect = (inputData: Partial<Prisma.SubscriptionCreateInput> = {}) => create(inputData).then(pickForConnect);
    return {
        _factoryFor: "Subscription" as const,
        build,
        buildList,
        buildCreateInput: build,
        pickForConnect,
        create,
        createList,
        createForConnect,
    };
}

/**
 * Define factory for {@link Subscription} model.
 *
 * @param options
 * @returns factory {@link SubscriptionFactoryInterface}
 */
export function defineSubscriptionFactory(options: SubscriptionFactoryDefineOptions): SubscriptionFactoryInterface {
    return defineSubscriptionFactoryInternal(options);
}

type UserAddressScalarOrEnumFields = {};

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
};

function isUserAddressUserFactory(x: UserAddressUserFactory | Prisma.UserCreateNestedOneWithoutAddressInput | undefined): x is UserAddressUserFactory {
    return (x as any)?._factoryFor === "User";
}

export interface UserAddressFactoryInterface {
    readonly _factoryFor: "UserAddress";
    build(inputData?: Partial<Prisma.UserAddressCreateInput>): PromiseLike<Prisma.UserAddressCreateInput>;
    buildCreateInput(inputData?: Partial<Prisma.UserAddressCreateInput>): PromiseLike<Prisma.UserAddressCreateInput>;
    buildList(inputData: number | readonly Partial<Prisma.UserAddressCreateInput>[]): PromiseLike<Prisma.UserAddressCreateInput[]>;
    pickForConnect(inputData: UserAddress): Pick<UserAddress, "userId">;
    create(inputData?: Partial<Prisma.UserAddressCreateInput>): PromiseLike<UserAddress>;
    createList(inputData: number | readonly Partial<Prisma.UserAddressCreateInput>[]): PromiseLike<UserAddress[]>;
    createForConnect(inputData?: Partial<Prisma.UserAddressCreateInput>): PromiseLike<Pick<UserAddress, "userId">>;
}

function autoGenerateUserAddressScalarsOrEnums({ seq }: {
    readonly seq: number;
}): UserAddressScalarOrEnumFields {
    return {};
}

function defineUserAddressFactoryInternal({ defaultData: defaultDataResolver }: UserAddressFactoryDefineOptions): UserAddressFactoryInterface {
    const seqKey = {};
    const getSeq = () => getSequenceCounter(seqKey);
    const screen = createScreener("UserAddress", modelFieldDefinitions);
    const build = async (inputData: Partial<Prisma.UserAddressCreateInput> = {}) => {
        const seq = getSeq();
        const requiredScalarData = autoGenerateUserAddressScalarsOrEnums({ seq });
        const resolveValue = normalizeResolver<UserAddressFactoryDefineInput, BuildDataOptions>(defaultDataResolver ?? {});
        const defaultData = await resolveValue({ seq });
        const defaultAssociations = {
            User: isUserAddressUserFactory(defaultData.User) ? {
                create: await defaultData.User.build()
            } : defaultData.User
        };
        const data: Prisma.UserAddressCreateInput = { ...requiredScalarData, ...defaultData, ...defaultAssociations, ...inputData };
        return data;
    };
    const buildList = (inputData: number | readonly Partial<Prisma.UserAddressCreateInput>[]) => Promise.all(normalizeList(inputData).map(data => build(data)));
    const pickForConnect = (inputData: UserAddress) => ({
        userId: inputData.userId
    });
    const create = async (inputData: Partial<Prisma.UserAddressCreateInput> = {}) => {
        const data = await build(inputData).then(screen);
        return await getClient<PrismaClient>().userAddress.create({ data });
    };
    const createList = (inputData: number | readonly Partial<Prisma.UserAddressCreateInput>[]) => Promise.all(normalizeList(inputData).map(data => create(data)));
    const createForConnect = (inputData: Partial<Prisma.UserAddressCreateInput> = {}) => create(inputData).then(pickForConnect);
    return {
        _factoryFor: "UserAddress" as const,
        build,
        buildList,
        buildCreateInput: build,
        pickForConnect,
        create,
        createList,
        createForConnect,
    };
}

/**
 * Define factory for {@link UserAddress} model.
 *
 * @param options
 * @returns factory {@link UserAddressFactoryInterface}
 */
export function defineUserAddressFactory(options: UserAddressFactoryDefineOptions): UserAddressFactoryInterface {
    return defineUserAddressFactoryInternal(options);
}

type UserOAuth2AccountScalarOrEnumFields = {
    type: string;
    provider: string;
    providerAccountId: string;
    accessToken: string;
    expiresAt: number;
    tokenType: string;
    scope: string;
    idToken: string;
};

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
};

function isUserOAuth2AccountUserFactory(x: UserOAuth2AccountUserFactory | Prisma.UserCreateNestedOneWithoutOauth2AccountsInput | undefined): x is UserOAuth2AccountUserFactory {
    return (x as any)?._factoryFor === "User";
}

export interface UserOAuth2AccountFactoryInterface {
    readonly _factoryFor: "UserOAuth2Account";
    build(inputData?: Partial<Prisma.UserOAuth2AccountCreateInput>): PromiseLike<Prisma.UserOAuth2AccountCreateInput>;
    buildCreateInput(inputData?: Partial<Prisma.UserOAuth2AccountCreateInput>): PromiseLike<Prisma.UserOAuth2AccountCreateInput>;
    buildList(inputData: number | readonly Partial<Prisma.UserOAuth2AccountCreateInput>[]): PromiseLike<Prisma.UserOAuth2AccountCreateInput[]>;
    pickForConnect(inputData: UserOAuth2Account): Pick<UserOAuth2Account, "id">;
    create(inputData?: Partial<Prisma.UserOAuth2AccountCreateInput>): PromiseLike<UserOAuth2Account>;
    createList(inputData: number | readonly Partial<Prisma.UserOAuth2AccountCreateInput>[]): PromiseLike<UserOAuth2Account[]>;
    createForConnect(inputData?: Partial<Prisma.UserOAuth2AccountCreateInput>): PromiseLike<Pick<UserOAuth2Account, "id">>;
}

function autoGenerateUserOAuth2AccountScalarsOrEnums({ seq }: {
    readonly seq: number;
}): UserOAuth2AccountScalarOrEnumFields {
    return {
        type: getScalarFieldValueGenerator().String({ modelName: "UserOAuth2Account", fieldName: "type", isId: false, isUnique: false, seq }),
        provider: getScalarFieldValueGenerator().String({ modelName: "UserOAuth2Account", fieldName: "provider", isId: false, isUnique: false, seq }),
        providerAccountId: getScalarFieldValueGenerator().String({ modelName: "UserOAuth2Account", fieldName: "providerAccountId", isId: false, isUnique: false, seq }),
        accessToken: getScalarFieldValueGenerator().String({ modelName: "UserOAuth2Account", fieldName: "accessToken", isId: false, isUnique: false, seq }),
        expiresAt: getScalarFieldValueGenerator().Int({ modelName: "UserOAuth2Account", fieldName: "expiresAt", isId: false, isUnique: false, seq }),
        tokenType: getScalarFieldValueGenerator().String({ modelName: "UserOAuth2Account", fieldName: "tokenType", isId: false, isUnique: false, seq }),
        scope: getScalarFieldValueGenerator().String({ modelName: "UserOAuth2Account", fieldName: "scope", isId: false, isUnique: false, seq }),
        idToken: getScalarFieldValueGenerator().String({ modelName: "UserOAuth2Account", fieldName: "idToken", isId: false, isUnique: false, seq })
    };
}

function defineUserOAuth2AccountFactoryInternal({ defaultData: defaultDataResolver }: UserOAuth2AccountFactoryDefineOptions): UserOAuth2AccountFactoryInterface {
    const seqKey = {};
    const getSeq = () => getSequenceCounter(seqKey);
    const screen = createScreener("UserOAuth2Account", modelFieldDefinitions);
    const build = async (inputData: Partial<Prisma.UserOAuth2AccountCreateInput> = {}) => {
        const seq = getSeq();
        const requiredScalarData = autoGenerateUserOAuth2AccountScalarsOrEnums({ seq });
        const resolveValue = normalizeResolver<UserOAuth2AccountFactoryDefineInput, BuildDataOptions>(defaultDataResolver ?? {});
        const defaultData = await resolveValue({ seq });
        const defaultAssociations = {
            User: isUserOAuth2AccountUserFactory(defaultData.User) ? {
                create: await defaultData.User.build()
            } : defaultData.User
        };
        const data: Prisma.UserOAuth2AccountCreateInput = { ...requiredScalarData, ...defaultData, ...defaultAssociations, ...inputData };
        return data;
    };
    const buildList = (inputData: number | readonly Partial<Prisma.UserOAuth2AccountCreateInput>[]) => Promise.all(normalizeList(inputData).map(data => build(data)));
    const pickForConnect = (inputData: UserOAuth2Account) => ({
        id: inputData.id
    });
    const create = async (inputData: Partial<Prisma.UserOAuth2AccountCreateInput> = {}) => {
        const data = await build(inputData).then(screen);
        return await getClient<PrismaClient>().userOAuth2Account.create({ data });
    };
    const createList = (inputData: number | readonly Partial<Prisma.UserOAuth2AccountCreateInput>[]) => Promise.all(normalizeList(inputData).map(data => create(data)));
    const createForConnect = (inputData: Partial<Prisma.UserOAuth2AccountCreateInput> = {}) => create(inputData).then(pickForConnect);
    return {
        _factoryFor: "UserOAuth2Account" as const,
        build,
        buildList,
        buildCreateInput: build,
        pickForConnect,
        create,
        createList,
        createForConnect,
    };
}

/**
 * Define factory for {@link UserOAuth2Account} model.
 *
 * @param options
 * @returns factory {@link UserOAuth2AccountFactoryInterface}
 */
export function defineUserOAuth2AccountFactory(options: UserOAuth2AccountFactoryDefineOptions = {}): UserOAuth2AccountFactoryInterface {
    return defineUserOAuth2AccountFactoryInternal(options);
}

type PaymentProviderCustomerScalarOrEnumFields = {
    paymentProviderID: string;
    customerID: string;
};

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
};

function isPaymentProviderCustomerUserFactory(x: PaymentProviderCustomerUserFactory | Prisma.UserCreateNestedOneWithoutPaymentProviderCustomersInput | undefined): x is PaymentProviderCustomerUserFactory {
    return (x as any)?._factoryFor === "User";
}

export interface PaymentProviderCustomerFactoryInterface {
    readonly _factoryFor: "PaymentProviderCustomer";
    build(inputData?: Partial<Prisma.PaymentProviderCustomerCreateInput>): PromiseLike<Prisma.PaymentProviderCustomerCreateInput>;
    buildCreateInput(inputData?: Partial<Prisma.PaymentProviderCustomerCreateInput>): PromiseLike<Prisma.PaymentProviderCustomerCreateInput>;
    buildList(inputData: number | readonly Partial<Prisma.PaymentProviderCustomerCreateInput>[]): PromiseLike<Prisma.PaymentProviderCustomerCreateInput[]>;
    pickForConnect(inputData: PaymentProviderCustomer): Pick<PaymentProviderCustomer, "id">;
    create(inputData?: Partial<Prisma.PaymentProviderCustomerCreateInput>): PromiseLike<PaymentProviderCustomer>;
    createList(inputData: number | readonly Partial<Prisma.PaymentProviderCustomerCreateInput>[]): PromiseLike<PaymentProviderCustomer[]>;
    createForConnect(inputData?: Partial<Prisma.PaymentProviderCustomerCreateInput>): PromiseLike<Pick<PaymentProviderCustomer, "id">>;
}

function autoGeneratePaymentProviderCustomerScalarsOrEnums({ seq }: {
    readonly seq: number;
}): PaymentProviderCustomerScalarOrEnumFields {
    return {
        paymentProviderID: getScalarFieldValueGenerator().String({ modelName: "PaymentProviderCustomer", fieldName: "paymentProviderID", isId: false, isUnique: false, seq }),
        customerID: getScalarFieldValueGenerator().String({ modelName: "PaymentProviderCustomer", fieldName: "customerID", isId: false, isUnique: false, seq })
    };
}

function definePaymentProviderCustomerFactoryInternal({ defaultData: defaultDataResolver }: PaymentProviderCustomerFactoryDefineOptions): PaymentProviderCustomerFactoryInterface {
    const seqKey = {};
    const getSeq = () => getSequenceCounter(seqKey);
    const screen = createScreener("PaymentProviderCustomer", modelFieldDefinitions);
    const build = async (inputData: Partial<Prisma.PaymentProviderCustomerCreateInput> = {}) => {
        const seq = getSeq();
        const requiredScalarData = autoGeneratePaymentProviderCustomerScalarsOrEnums({ seq });
        const resolveValue = normalizeResolver<PaymentProviderCustomerFactoryDefineInput, BuildDataOptions>(defaultDataResolver ?? {});
        const defaultData = await resolveValue({ seq });
        const defaultAssociations = {
            User: isPaymentProviderCustomerUserFactory(defaultData.User) ? {
                create: await defaultData.User.build()
            } : defaultData.User
        };
        const data: Prisma.PaymentProviderCustomerCreateInput = { ...requiredScalarData, ...defaultData, ...defaultAssociations, ...inputData };
        return data;
    };
    const buildList = (inputData: number | readonly Partial<Prisma.PaymentProviderCustomerCreateInput>[]) => Promise.all(normalizeList(inputData).map(data => build(data)));
    const pickForConnect = (inputData: PaymentProviderCustomer) => ({
        id: inputData.id
    });
    const create = async (inputData: Partial<Prisma.PaymentProviderCustomerCreateInput> = {}) => {
        const data = await build(inputData).then(screen);
        return await getClient<PrismaClient>().paymentProviderCustomer.create({ data });
    };
    const createList = (inputData: number | readonly Partial<Prisma.PaymentProviderCustomerCreateInput>[]) => Promise.all(normalizeList(inputData).map(data => create(data)));
    const createForConnect = (inputData: Partial<Prisma.PaymentProviderCustomerCreateInput> = {}) => create(inputData).then(pickForConnect);
    return {
        _factoryFor: "PaymentProviderCustomer" as const,
        build,
        buildList,
        buildCreateInput: build,
        pickForConnect,
        create,
        createList,
        createForConnect,
    };
}

/**
 * Define factory for {@link PaymentProviderCustomer} model.
 *
 * @param options
 * @returns factory {@link PaymentProviderCustomerFactoryInterface}
 */
export function definePaymentProviderCustomerFactory(options: PaymentProviderCustomerFactoryDefineOptions = {}): PaymentProviderCustomerFactoryInterface {
    return definePaymentProviderCustomerFactoryInternal(options);
}

type UserScalarOrEnumFields = {
    email: string;
    name: string;
    password: string;
    active: boolean;
};

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
    Invoice?: Prisma.InvoiceCreateNestedManyWithoutUserInput;
    CommentRating?: Prisma.CommentRatingCreateNestedManyWithoutUserInput;
    PollVote?: Prisma.PollVoteCreateNestedManyWithoutUserInput;
    mailSent?: Prisma.MailLogCreateNestedManyWithoutRecipientInput;
};

type UserFactoryDefineOptions = {
    defaultData?: Resolver<UserFactoryDefineInput, BuildDataOptions>;
};

function isUseruserImageFactory(x: UseruserImageFactory | Prisma.ImageCreateNestedOneWithoutUsersInput | undefined): x is UseruserImageFactory {
    return (x as any)?._factoryFor === "Image";
}

function isUseraddressFactory(x: UseraddressFactory | Prisma.UserAddressCreateNestedOneWithoutUserInput | undefined): x is UseraddressFactory {
    return (x as any)?._factoryFor === "UserAddress";
}

export interface UserFactoryInterface {
    readonly _factoryFor: "User";
    build(inputData?: Partial<Prisma.UserCreateInput>): PromiseLike<Prisma.UserCreateInput>;
    buildCreateInput(inputData?: Partial<Prisma.UserCreateInput>): PromiseLike<Prisma.UserCreateInput>;
    buildList(inputData: number | readonly Partial<Prisma.UserCreateInput>[]): PromiseLike<Prisma.UserCreateInput[]>;
    pickForConnect(inputData: User): Pick<User, "id">;
    create(inputData?: Partial<Prisma.UserCreateInput>): PromiseLike<User>;
    createList(inputData: number | readonly Partial<Prisma.UserCreateInput>[]): PromiseLike<User[]>;
    createForConnect(inputData?: Partial<Prisma.UserCreateInput>): PromiseLike<Pick<User, "id">>;
}

function autoGenerateUserScalarsOrEnums({ seq }: {
    readonly seq: number;
}): UserScalarOrEnumFields {
    return {
        email: getScalarFieldValueGenerator().String({ modelName: "User", fieldName: "email", isId: false, isUnique: true, seq }),
        name: getScalarFieldValueGenerator().String({ modelName: "User", fieldName: "name", isId: false, isUnique: false, seq }),
        password: getScalarFieldValueGenerator().String({ modelName: "User", fieldName: "password", isId: false, isUnique: false, seq }),
        active: getScalarFieldValueGenerator().Boolean({ modelName: "User", fieldName: "active", isId: false, isUnique: false, seq })
    };
}

function defineUserFactoryInternal({ defaultData: defaultDataResolver }: UserFactoryDefineOptions): UserFactoryInterface {
    const seqKey = {};
    const getSeq = () => getSequenceCounter(seqKey);
    const screen = createScreener("User", modelFieldDefinitions);
    const build = async (inputData: Partial<Prisma.UserCreateInput> = {}) => {
        const seq = getSeq();
        const requiredScalarData = autoGenerateUserScalarsOrEnums({ seq });
        const resolveValue = normalizeResolver<UserFactoryDefineInput, BuildDataOptions>(defaultDataResolver ?? {});
        const defaultData = await resolveValue({ seq });
        const defaultAssociations = {
            userImage: isUseruserImageFactory(defaultData.userImage) ? {
                create: await defaultData.userImage.build()
            } : defaultData.userImage,
            address: isUseraddressFactory(defaultData.address) ? {
                create: await defaultData.address.build()
            } : defaultData.address
        };
        const data: Prisma.UserCreateInput = { ...requiredScalarData, ...defaultData, ...defaultAssociations, ...inputData };
        return data;
    };
    const buildList = (inputData: number | readonly Partial<Prisma.UserCreateInput>[]) => Promise.all(normalizeList(inputData).map(data => build(data)));
    const pickForConnect = (inputData: User) => ({
        id: inputData.id
    });
    const create = async (inputData: Partial<Prisma.UserCreateInput> = {}) => {
        const data = await build(inputData).then(screen);
        return await getClient<PrismaClient>().user.create({ data });
    };
    const createList = (inputData: number | readonly Partial<Prisma.UserCreateInput>[]) => Promise.all(normalizeList(inputData).map(data => create(data)));
    const createForConnect = (inputData: Partial<Prisma.UserCreateInput> = {}) => create(inputData).then(pickForConnect);
    return {
        _factoryFor: "User" as const,
        build,
        buildList,
        buildCreateInput: build,
        pickForConnect,
        create,
        createList,
        createForConnect,
    };
}

/**
 * Define factory for {@link User} model.
 *
 * @param options
 * @returns factory {@link UserFactoryInterface}
 */
export function defineUserFactory(options: UserFactoryDefineOptions = {}): UserFactoryInterface {
    return defineUserFactoryInternal(options);
}

type UserRoleScalarOrEnumFields = {
    name: string;
    systemRole: boolean;
};

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
};

export interface UserRoleFactoryInterface {
    readonly _factoryFor: "UserRole";
    build(inputData?: Partial<Prisma.UserRoleCreateInput>): PromiseLike<Prisma.UserRoleCreateInput>;
    buildCreateInput(inputData?: Partial<Prisma.UserRoleCreateInput>): PromiseLike<Prisma.UserRoleCreateInput>;
    buildList(inputData: number | readonly Partial<Prisma.UserRoleCreateInput>[]): PromiseLike<Prisma.UserRoleCreateInput[]>;
    pickForConnect(inputData: UserRole): Pick<UserRole, "id">;
    create(inputData?: Partial<Prisma.UserRoleCreateInput>): PromiseLike<UserRole>;
    createList(inputData: number | readonly Partial<Prisma.UserRoleCreateInput>[]): PromiseLike<UserRole[]>;
    createForConnect(inputData?: Partial<Prisma.UserRoleCreateInput>): PromiseLike<Pick<UserRole, "id">>;
}

function autoGenerateUserRoleScalarsOrEnums({ seq }: {
    readonly seq: number;
}): UserRoleScalarOrEnumFields {
    return {
        name: getScalarFieldValueGenerator().String({ modelName: "UserRole", fieldName: "name", isId: false, isUnique: true, seq }),
        systemRole: getScalarFieldValueGenerator().Boolean({ modelName: "UserRole", fieldName: "systemRole", isId: false, isUnique: false, seq })
    };
}

function defineUserRoleFactoryInternal({ defaultData: defaultDataResolver }: UserRoleFactoryDefineOptions): UserRoleFactoryInterface {
    const seqKey = {};
    const getSeq = () => getSequenceCounter(seqKey);
    const screen = createScreener("UserRole", modelFieldDefinitions);
    const build = async (inputData: Partial<Prisma.UserRoleCreateInput> = {}) => {
        const seq = getSeq();
        const requiredScalarData = autoGenerateUserRoleScalarsOrEnums({ seq });
        const resolveValue = normalizeResolver<UserRoleFactoryDefineInput, BuildDataOptions>(defaultDataResolver ?? {});
        const defaultData = await resolveValue({ seq });
        const defaultAssociations = {};
        const data: Prisma.UserRoleCreateInput = { ...requiredScalarData, ...defaultData, ...defaultAssociations, ...inputData };
        return data;
    };
    const buildList = (inputData: number | readonly Partial<Prisma.UserRoleCreateInput>[]) => Promise.all(normalizeList(inputData).map(data => build(data)));
    const pickForConnect = (inputData: UserRole) => ({
        id: inputData.id
    });
    const create = async (inputData: Partial<Prisma.UserRoleCreateInput> = {}) => {
        const data = await build(inputData).then(screen);
        return await getClient<PrismaClient>().userRole.create({ data });
    };
    const createList = (inputData: number | readonly Partial<Prisma.UserRoleCreateInput>[]) => Promise.all(normalizeList(inputData).map(data => create(data)));
    const createForConnect = (inputData: Partial<Prisma.UserRoleCreateInput> = {}) => create(inputData).then(pickForConnect);
    return {
        _factoryFor: "UserRole" as const,
        build,
        buildList,
        buildCreateInput: build,
        pickForConnect,
        create,
        createList,
        createForConnect,
    };
}

/**
 * Define factory for {@link UserRole} model.
 *
 * @param options
 * @returns factory {@link UserRoleFactoryInterface}
 */
export function defineUserRoleFactory(options: UserRoleFactoryDefineOptions = {}): UserRoleFactoryInterface {
    return defineUserRoleFactoryInternal(options);
}

type SettingScalarOrEnumFields = {
    name: string;
    value: Prisma.JsonNullValueInput | Prisma.InputJsonValue;
    settingRestriction: Prisma.JsonNullValueInput | Prisma.InputJsonValue;
};

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
};

export interface SettingFactoryInterface {
    readonly _factoryFor: "Setting";
    build(inputData?: Partial<Prisma.SettingCreateInput>): PromiseLike<Prisma.SettingCreateInput>;
    buildCreateInput(inputData?: Partial<Prisma.SettingCreateInput>): PromiseLike<Prisma.SettingCreateInput>;
    buildList(inputData: number | readonly Partial<Prisma.SettingCreateInput>[]): PromiseLike<Prisma.SettingCreateInput[]>;
    pickForConnect(inputData: Setting): Pick<Setting, "id">;
    create(inputData?: Partial<Prisma.SettingCreateInput>): PromiseLike<Setting>;
    createList(inputData: number | readonly Partial<Prisma.SettingCreateInput>[]): PromiseLike<Setting[]>;
    createForConnect(inputData?: Partial<Prisma.SettingCreateInput>): PromiseLike<Pick<Setting, "id">>;
}

function autoGenerateSettingScalarsOrEnums({ seq }: {
    readonly seq: number;
}): SettingScalarOrEnumFields {
    return {
        name: getScalarFieldValueGenerator().String({ modelName: "Setting", fieldName: "name", isId: false, isUnique: true, seq }),
        value: getScalarFieldValueGenerator().Json({ modelName: "Setting", fieldName: "value", isId: false, isUnique: false, seq }),
        settingRestriction: getScalarFieldValueGenerator().Json({ modelName: "Setting", fieldName: "settingRestriction", isId: false, isUnique: false, seq })
    };
}

function defineSettingFactoryInternal({ defaultData: defaultDataResolver }: SettingFactoryDefineOptions): SettingFactoryInterface {
    const seqKey = {};
    const getSeq = () => getSequenceCounter(seqKey);
    const screen = createScreener("Setting", modelFieldDefinitions);
    const build = async (inputData: Partial<Prisma.SettingCreateInput> = {}) => {
        const seq = getSeq();
        const requiredScalarData = autoGenerateSettingScalarsOrEnums({ seq });
        const resolveValue = normalizeResolver<SettingFactoryDefineInput, BuildDataOptions>(defaultDataResolver ?? {});
        const defaultData = await resolveValue({ seq });
        const defaultAssociations = {};
        const data: Prisma.SettingCreateInput = { ...requiredScalarData, ...defaultData, ...defaultAssociations, ...inputData };
        return data;
    };
    const buildList = (inputData: number | readonly Partial<Prisma.SettingCreateInput>[]) => Promise.all(normalizeList(inputData).map(data => build(data)));
    const pickForConnect = (inputData: Setting) => ({
        id: inputData.id
    });
    const create = async (inputData: Partial<Prisma.SettingCreateInput> = {}) => {
        const data = await build(inputData).then(screen);
        return await getClient<PrismaClient>().setting.create({ data });
    };
    const createList = (inputData: number | readonly Partial<Prisma.SettingCreateInput>[]) => Promise.all(normalizeList(inputData).map(data => create(data)));
    const createForConnect = (inputData: Partial<Prisma.SettingCreateInput> = {}) => create(inputData).then(pickForConnect);
    return {
        _factoryFor: "Setting" as const,
        build,
        buildList,
        buildCreateInput: build,
        pickForConnect,
        create,
        createList,
        createForConnect,
    };
}

/**
 * Define factory for {@link Setting} model.
 *
 * @param options
 * @returns factory {@link SettingFactoryInterface}
 */
export function defineSettingFactory(options: SettingFactoryDefineOptions = {}): SettingFactoryInterface {
    return defineSettingFactoryInternal(options);
}

type TagScalarOrEnumFields = {
    type: TagType;
};

type TagFactoryDefineInput = {
    id?: string;
    createdAt?: Date;
    modifiedAt?: Date;
    type?: TagType;
    tag?: string | null;
    comments?: Prisma.TaggedCommentsCreateNestedManyWithoutTagInput;
    events?: Prisma.TaggedEventsCreateNestedManyWithoutTagInput;
};

type TagFactoryDefineOptions = {
    defaultData?: Resolver<TagFactoryDefineInput, BuildDataOptions>;
};

export interface TagFactoryInterface {
    readonly _factoryFor: "Tag";
    build(inputData?: Partial<Prisma.TagCreateInput>): PromiseLike<Prisma.TagCreateInput>;
    buildCreateInput(inputData?: Partial<Prisma.TagCreateInput>): PromiseLike<Prisma.TagCreateInput>;
    buildList(inputData: number | readonly Partial<Prisma.TagCreateInput>[]): PromiseLike<Prisma.TagCreateInput[]>;
    pickForConnect(inputData: Tag): Pick<Tag, "id">;
    create(inputData?: Partial<Prisma.TagCreateInput>): PromiseLike<Tag>;
    createList(inputData: number | readonly Partial<Prisma.TagCreateInput>[]): PromiseLike<Tag[]>;
    createForConnect(inputData?: Partial<Prisma.TagCreateInput>): PromiseLike<Pick<Tag, "id">>;
}

function autoGenerateTagScalarsOrEnums({ seq }: {
    readonly seq: number;
}): TagScalarOrEnumFields {
    return {
        type: "Comment"
    };
}

function defineTagFactoryInternal({ defaultData: defaultDataResolver }: TagFactoryDefineOptions): TagFactoryInterface {
    const seqKey = {};
    const getSeq = () => getSequenceCounter(seqKey);
    const screen = createScreener("Tag", modelFieldDefinitions);
    const build = async (inputData: Partial<Prisma.TagCreateInput> = {}) => {
        const seq = getSeq();
        const requiredScalarData = autoGenerateTagScalarsOrEnums({ seq });
        const resolveValue = normalizeResolver<TagFactoryDefineInput, BuildDataOptions>(defaultDataResolver ?? {});
        const defaultData = await resolveValue({ seq });
        const defaultAssociations = {};
        const data: Prisma.TagCreateInput = { ...requiredScalarData, ...defaultData, ...defaultAssociations, ...inputData };
        return data;
    };
    const buildList = (inputData: number | readonly Partial<Prisma.TagCreateInput>[]) => Promise.all(normalizeList(inputData).map(data => build(data)));
    const pickForConnect = (inputData: Tag) => ({
        id: inputData.id
    });
    const create = async (inputData: Partial<Prisma.TagCreateInput> = {}) => {
        const data = await build(inputData).then(screen);
        return await getClient<PrismaClient>().tag.create({ data });
    };
    const createList = (inputData: number | readonly Partial<Prisma.TagCreateInput>[]) => Promise.all(normalizeList(inputData).map(data => create(data)));
    const createForConnect = (inputData: Partial<Prisma.TagCreateInput> = {}) => create(inputData).then(pickForConnect);
    return {
        _factoryFor: "Tag" as const,
        build,
        buildList,
        buildCreateInput: build,
        pickForConnect,
        create,
        createList,
        createForConnect,
    };
}

/**
 * Define factory for {@link Tag} model.
 *
 * @param options
 * @returns factory {@link TagFactoryInterface}
 */
export function defineTagFactory(options: TagFactoryDefineOptions = {}): TagFactoryInterface {
    return defineTagFactoryInternal(options);
}

type PollScalarOrEnumFields = {};

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
};

export interface PollFactoryInterface {
    readonly _factoryFor: "Poll";
    build(inputData?: Partial<Prisma.PollCreateInput>): PromiseLike<Prisma.PollCreateInput>;
    buildCreateInput(inputData?: Partial<Prisma.PollCreateInput>): PromiseLike<Prisma.PollCreateInput>;
    buildList(inputData: number | readonly Partial<Prisma.PollCreateInput>[]): PromiseLike<Prisma.PollCreateInput[]>;
    pickForConnect(inputData: Poll): Pick<Poll, "id">;
    create(inputData?: Partial<Prisma.PollCreateInput>): PromiseLike<Poll>;
    createList(inputData: number | readonly Partial<Prisma.PollCreateInput>[]): PromiseLike<Poll[]>;
    createForConnect(inputData?: Partial<Prisma.PollCreateInput>): PromiseLike<Pick<Poll, "id">>;
}

function autoGeneratePollScalarsOrEnums({ seq }: {
    readonly seq: number;
}): PollScalarOrEnumFields {
    return {};
}

function definePollFactoryInternal({ defaultData: defaultDataResolver }: PollFactoryDefineOptions): PollFactoryInterface {
    const seqKey = {};
    const getSeq = () => getSequenceCounter(seqKey);
    const screen = createScreener("Poll", modelFieldDefinitions);
    const build = async (inputData: Partial<Prisma.PollCreateInput> = {}) => {
        const seq = getSeq();
        const requiredScalarData = autoGeneratePollScalarsOrEnums({ seq });
        const resolveValue = normalizeResolver<PollFactoryDefineInput, BuildDataOptions>(defaultDataResolver ?? {});
        const defaultData = await resolveValue({ seq });
        const defaultAssociations = {};
        const data: Prisma.PollCreateInput = { ...requiredScalarData, ...defaultData, ...defaultAssociations, ...inputData };
        return data;
    };
    const buildList = (inputData: number | readonly Partial<Prisma.PollCreateInput>[]) => Promise.all(normalizeList(inputData).map(data => build(data)));
    const pickForConnect = (inputData: Poll) => ({
        id: inputData.id
    });
    const create = async (inputData: Partial<Prisma.PollCreateInput> = {}) => {
        const data = await build(inputData).then(screen);
        return await getClient<PrismaClient>().poll.create({ data });
    };
    const createList = (inputData: number | readonly Partial<Prisma.PollCreateInput>[]) => Promise.all(normalizeList(inputData).map(data => create(data)));
    const createForConnect = (inputData: Partial<Prisma.PollCreateInput> = {}) => create(inputData).then(pickForConnect);
    return {
        _factoryFor: "Poll" as const,
        build,
        buildList,
        buildCreateInput: build,
        pickForConnect,
        create,
        createList,
        createForConnect,
    };
}

/**
 * Define factory for {@link Poll} model.
 *
 * @param options
 * @returns factory {@link PollFactoryInterface}
 */
export function definePollFactory(options: PollFactoryDefineOptions = {}): PollFactoryInterface {
    return definePollFactoryInternal(options);
}

type PollAnswerScalarOrEnumFields = {};

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
};

function isPollAnswerpollFactory(x: PollAnswerpollFactory | Prisma.PollCreateNestedOneWithoutAnswersInput | undefined): x is PollAnswerpollFactory {
    return (x as any)?._factoryFor === "Poll";
}

export interface PollAnswerFactoryInterface {
    readonly _factoryFor: "PollAnswer";
    build(inputData?: Partial<Prisma.PollAnswerCreateInput>): PromiseLike<Prisma.PollAnswerCreateInput>;
    buildCreateInput(inputData?: Partial<Prisma.PollAnswerCreateInput>): PromiseLike<Prisma.PollAnswerCreateInput>;
    buildList(inputData: number | readonly Partial<Prisma.PollAnswerCreateInput>[]): PromiseLike<Prisma.PollAnswerCreateInput[]>;
    pickForConnect(inputData: PollAnswer): Pick<PollAnswer, "id">;
    create(inputData?: Partial<Prisma.PollAnswerCreateInput>): PromiseLike<PollAnswer>;
    createList(inputData: number | readonly Partial<Prisma.PollAnswerCreateInput>[]): PromiseLike<PollAnswer[]>;
    createForConnect(inputData?: Partial<Prisma.PollAnswerCreateInput>): PromiseLike<Pick<PollAnswer, "id">>;
}

function autoGeneratePollAnswerScalarsOrEnums({ seq }: {
    readonly seq: number;
}): PollAnswerScalarOrEnumFields {
    return {};
}

function definePollAnswerFactoryInternal({ defaultData: defaultDataResolver }: PollAnswerFactoryDefineOptions): PollAnswerFactoryInterface {
    const seqKey = {};
    const getSeq = () => getSequenceCounter(seqKey);
    const screen = createScreener("PollAnswer", modelFieldDefinitions);
    const build = async (inputData: Partial<Prisma.PollAnswerCreateInput> = {}) => {
        const seq = getSeq();
        const requiredScalarData = autoGeneratePollAnswerScalarsOrEnums({ seq });
        const resolveValue = normalizeResolver<PollAnswerFactoryDefineInput, BuildDataOptions>(defaultDataResolver ?? {});
        const defaultData = await resolveValue({ seq });
        const defaultAssociations = {
            poll: isPollAnswerpollFactory(defaultData.poll) ? {
                create: await defaultData.poll.build()
            } : defaultData.poll
        };
        const data: Prisma.PollAnswerCreateInput = { ...requiredScalarData, ...defaultData, ...defaultAssociations, ...inputData };
        return data;
    };
    const buildList = (inputData: number | readonly Partial<Prisma.PollAnswerCreateInput>[]) => Promise.all(normalizeList(inputData).map(data => build(data)));
    const pickForConnect = (inputData: PollAnswer) => ({
        id: inputData.id
    });
    const create = async (inputData: Partial<Prisma.PollAnswerCreateInput> = {}) => {
        const data = await build(inputData).then(screen);
        return await getClient<PrismaClient>().pollAnswer.create({ data });
    };
    const createList = (inputData: number | readonly Partial<Prisma.PollAnswerCreateInput>[]) => Promise.all(normalizeList(inputData).map(data => create(data)));
    const createForConnect = (inputData: Partial<Prisma.PollAnswerCreateInput> = {}) => create(inputData).then(pickForConnect);
    return {
        _factoryFor: "PollAnswer" as const,
        build,
        buildList,
        buildCreateInput: build,
        pickForConnect,
        create,
        createList,
        createForConnect,
    };
}

/**
 * Define factory for {@link PollAnswer} model.
 *
 * @param options
 * @returns factory {@link PollAnswerFactoryInterface}
 */
export function definePollAnswerFactory(options: PollAnswerFactoryDefineOptions): PollAnswerFactoryInterface {
    return definePollAnswerFactoryInternal(options);
}

type PollVoteScalarOrEnumFields = {};

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
    user?: PollVoteuserFactory | Prisma.UserCreateNestedOneWithoutPollVoteInput;
    answer: PollVoteanswerFactory | Prisma.PollAnswerCreateNestedOneWithoutVotesInput;
    poll: PollVotepollFactory | Prisma.PollCreateNestedOneWithoutVotesInput;
    fingerprint?: string | null;
    disabled?: boolean;
};

type PollVoteFactoryDefineOptions = {
    defaultData: Resolver<PollVoteFactoryDefineInput, BuildDataOptions>;
};

function isPollVoteuserFactory(x: PollVoteuserFactory | Prisma.UserCreateNestedOneWithoutPollVoteInput | undefined): x is PollVoteuserFactory {
    return (x as any)?._factoryFor === "User";
}

function isPollVoteanswerFactory(x: PollVoteanswerFactory | Prisma.PollAnswerCreateNestedOneWithoutVotesInput | undefined): x is PollVoteanswerFactory {
    return (x as any)?._factoryFor === "PollAnswer";
}

function isPollVotepollFactory(x: PollVotepollFactory | Prisma.PollCreateNestedOneWithoutVotesInput | undefined): x is PollVotepollFactory {
    return (x as any)?._factoryFor === "Poll";
}

export interface PollVoteFactoryInterface {
    readonly _factoryFor: "PollVote";
    build(inputData?: Partial<Prisma.PollVoteCreateInput>): PromiseLike<Prisma.PollVoteCreateInput>;
    buildCreateInput(inputData?: Partial<Prisma.PollVoteCreateInput>): PromiseLike<Prisma.PollVoteCreateInput>;
    buildList(inputData: number | readonly Partial<Prisma.PollVoteCreateInput>[]): PromiseLike<Prisma.PollVoteCreateInput[]>;
    pickForConnect(inputData: PollVote): Pick<PollVote, "id">;
    create(inputData?: Partial<Prisma.PollVoteCreateInput>): PromiseLike<PollVote>;
    createList(inputData: number | readonly Partial<Prisma.PollVoteCreateInput>[]): PromiseLike<PollVote[]>;
    createForConnect(inputData?: Partial<Prisma.PollVoteCreateInput>): PromiseLike<Pick<PollVote, "id">>;
}

function autoGeneratePollVoteScalarsOrEnums({ seq }: {
    readonly seq: number;
}): PollVoteScalarOrEnumFields {
    return {};
}

function definePollVoteFactoryInternal({ defaultData: defaultDataResolver }: PollVoteFactoryDefineOptions): PollVoteFactoryInterface {
    const seqKey = {};
    const getSeq = () => getSequenceCounter(seqKey);
    const screen = createScreener("PollVote", modelFieldDefinitions);
    const build = async (inputData: Partial<Prisma.PollVoteCreateInput> = {}) => {
        const seq = getSeq();
        const requiredScalarData = autoGeneratePollVoteScalarsOrEnums({ seq });
        const resolveValue = normalizeResolver<PollVoteFactoryDefineInput, BuildDataOptions>(defaultDataResolver ?? {});
        const defaultData = await resolveValue({ seq });
        const defaultAssociations = {
            user: isPollVoteuserFactory(defaultData.user) ? {
                create: await defaultData.user.build()
            } : defaultData.user,
            answer: isPollVoteanswerFactory(defaultData.answer) ? {
                create: await defaultData.answer.build()
            } : defaultData.answer,
            poll: isPollVotepollFactory(defaultData.poll) ? {
                create: await defaultData.poll.build()
            } : defaultData.poll
        };
        const data: Prisma.PollVoteCreateInput = { ...requiredScalarData, ...defaultData, ...defaultAssociations, ...inputData };
        return data;
    };
    const buildList = (inputData: number | readonly Partial<Prisma.PollVoteCreateInput>[]) => Promise.all(normalizeList(inputData).map(data => build(data)));
    const pickForConnect = (inputData: PollVote) => ({
        id: inputData.id
    });
    const create = async (inputData: Partial<Prisma.PollVoteCreateInput> = {}) => {
        const data = await build(inputData).then(screen);
        return await getClient<PrismaClient>().pollVote.create({ data });
    };
    const createList = (inputData: number | readonly Partial<Prisma.PollVoteCreateInput>[]) => Promise.all(normalizeList(inputData).map(data => create(data)));
    const createForConnect = (inputData: Partial<Prisma.PollVoteCreateInput> = {}) => create(inputData).then(pickForConnect);
    return {
        _factoryFor: "PollVote" as const,
        build,
        buildList,
        buildCreateInput: build,
        pickForConnect,
        create,
        createList,
        createForConnect,
    };
}

/**
 * Define factory for {@link PollVote} model.
 *
 * @param options
 * @returns factory {@link PollVoteFactoryInterface}
 */
export function definePollVoteFactory(options: PollVoteFactoryDefineOptions): PollVoteFactoryInterface {
    return definePollVoteFactoryInternal(options);
}

type PollExternalVoteSourceScalarOrEnumFields = {};

type PollExternalVoteSourcepollFactory = {
    _factoryFor: "Poll";
    build: () => PromiseLike<Prisma.PollCreateNestedOneWithoutExternalVoteSourcesInput["create"]>;
};

type PollExternalVoteSourceFactoryDefineInput = {
    id?: string;
    createdAt?: Date;
    modifiedAt?: Date;
    poll: PollExternalVoteSourcepollFactory | Prisma.PollCreateNestedOneWithoutExternalVoteSourcesInput;
    source?: string | null;
    voteAmounts?: Prisma.PollExternalVoteCreateNestedManyWithoutSourceInput;
};

type PollExternalVoteSourceFactoryDefineOptions = {
    defaultData: Resolver<PollExternalVoteSourceFactoryDefineInput, BuildDataOptions>;
};

function isPollExternalVoteSourcepollFactory(x: PollExternalVoteSourcepollFactory | Prisma.PollCreateNestedOneWithoutExternalVoteSourcesInput | undefined): x is PollExternalVoteSourcepollFactory {
    return (x as any)?._factoryFor === "Poll";
}

export interface PollExternalVoteSourceFactoryInterface {
    readonly _factoryFor: "PollExternalVoteSource";
    build(inputData?: Partial<Prisma.PollExternalVoteSourceCreateInput>): PromiseLike<Prisma.PollExternalVoteSourceCreateInput>;
    buildCreateInput(inputData?: Partial<Prisma.PollExternalVoteSourceCreateInput>): PromiseLike<Prisma.PollExternalVoteSourceCreateInput>;
    buildList(inputData: number | readonly Partial<Prisma.PollExternalVoteSourceCreateInput>[]): PromiseLike<Prisma.PollExternalVoteSourceCreateInput[]>;
    pickForConnect(inputData: PollExternalVoteSource): Pick<PollExternalVoteSource, "id">;
    create(inputData?: Partial<Prisma.PollExternalVoteSourceCreateInput>): PromiseLike<PollExternalVoteSource>;
    createList(inputData: number | readonly Partial<Prisma.PollExternalVoteSourceCreateInput>[]): PromiseLike<PollExternalVoteSource[]>;
    createForConnect(inputData?: Partial<Prisma.PollExternalVoteSourceCreateInput>): PromiseLike<Pick<PollExternalVoteSource, "id">>;
}

function autoGeneratePollExternalVoteSourceScalarsOrEnums({ seq }: {
    readonly seq: number;
}): PollExternalVoteSourceScalarOrEnumFields {
    return {};
}

function definePollExternalVoteSourceFactoryInternal({ defaultData: defaultDataResolver }: PollExternalVoteSourceFactoryDefineOptions): PollExternalVoteSourceFactoryInterface {
    const seqKey = {};
    const getSeq = () => getSequenceCounter(seqKey);
    const screen = createScreener("PollExternalVoteSource", modelFieldDefinitions);
    const build = async (inputData: Partial<Prisma.PollExternalVoteSourceCreateInput> = {}) => {
        const seq = getSeq();
        const requiredScalarData = autoGeneratePollExternalVoteSourceScalarsOrEnums({ seq });
        const resolveValue = normalizeResolver<PollExternalVoteSourceFactoryDefineInput, BuildDataOptions>(defaultDataResolver ?? {});
        const defaultData = await resolveValue({ seq });
        const defaultAssociations = {
            poll: isPollExternalVoteSourcepollFactory(defaultData.poll) ? {
                create: await defaultData.poll.build()
            } : defaultData.poll
        };
        const data: Prisma.PollExternalVoteSourceCreateInput = { ...requiredScalarData, ...defaultData, ...defaultAssociations, ...inputData };
        return data;
    };
    const buildList = (inputData: number | readonly Partial<Prisma.PollExternalVoteSourceCreateInput>[]) => Promise.all(normalizeList(inputData).map(data => build(data)));
    const pickForConnect = (inputData: PollExternalVoteSource) => ({
        id: inputData.id
    });
    const create = async (inputData: Partial<Prisma.PollExternalVoteSourceCreateInput> = {}) => {
        const data = await build(inputData).then(screen);
        return await getClient<PrismaClient>().pollExternalVoteSource.create({ data });
    };
    const createList = (inputData: number | readonly Partial<Prisma.PollExternalVoteSourceCreateInput>[]) => Promise.all(normalizeList(inputData).map(data => create(data)));
    const createForConnect = (inputData: Partial<Prisma.PollExternalVoteSourceCreateInput> = {}) => create(inputData).then(pickForConnect);
    return {
        _factoryFor: "PollExternalVoteSource" as const,
        build,
        buildList,
        buildCreateInput: build,
        pickForConnect,
        create,
        createList,
        createForConnect,
    };
}

/**
 * Define factory for {@link PollExternalVoteSource} model.
 *
 * @param options
 * @returns factory {@link PollExternalVoteSourceFactoryInterface}
 */
export function definePollExternalVoteSourceFactory(options: PollExternalVoteSourceFactoryDefineOptions): PollExternalVoteSourceFactoryInterface {
    return definePollExternalVoteSourceFactoryInternal(options);
}

type PollExternalVoteScalarOrEnumFields = {};

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
    answer: PollExternalVoteanswerFactory | Prisma.PollAnswerCreateNestedOneWithoutExternalVotesInput;
    source: PollExternalVotesourceFactory | Prisma.PollExternalVoteSourceCreateNestedOneWithoutVoteAmountsInput;
    amount?: number;
};

type PollExternalVoteFactoryDefineOptions = {
    defaultData: Resolver<PollExternalVoteFactoryDefineInput, BuildDataOptions>;
};

function isPollExternalVoteanswerFactory(x: PollExternalVoteanswerFactory | Prisma.PollAnswerCreateNestedOneWithoutExternalVotesInput | undefined): x is PollExternalVoteanswerFactory {
    return (x as any)?._factoryFor === "PollAnswer";
}

function isPollExternalVotesourceFactory(x: PollExternalVotesourceFactory | Prisma.PollExternalVoteSourceCreateNestedOneWithoutVoteAmountsInput | undefined): x is PollExternalVotesourceFactory {
    return (x as any)?._factoryFor === "PollExternalVoteSource";
}

export interface PollExternalVoteFactoryInterface {
    readonly _factoryFor: "PollExternalVote";
    build(inputData?: Partial<Prisma.PollExternalVoteCreateInput>): PromiseLike<Prisma.PollExternalVoteCreateInput>;
    buildCreateInput(inputData?: Partial<Prisma.PollExternalVoteCreateInput>): PromiseLike<Prisma.PollExternalVoteCreateInput>;
    buildList(inputData: number | readonly Partial<Prisma.PollExternalVoteCreateInput>[]): PromiseLike<Prisma.PollExternalVoteCreateInput[]>;
    pickForConnect(inputData: PollExternalVote): Pick<PollExternalVote, "id">;
    create(inputData?: Partial<Prisma.PollExternalVoteCreateInput>): PromiseLike<PollExternalVote>;
    createList(inputData: number | readonly Partial<Prisma.PollExternalVoteCreateInput>[]): PromiseLike<PollExternalVote[]>;
    createForConnect(inputData?: Partial<Prisma.PollExternalVoteCreateInput>): PromiseLike<Pick<PollExternalVote, "id">>;
}

function autoGeneratePollExternalVoteScalarsOrEnums({ seq }: {
    readonly seq: number;
}): PollExternalVoteScalarOrEnumFields {
    return {};
}

function definePollExternalVoteFactoryInternal({ defaultData: defaultDataResolver }: PollExternalVoteFactoryDefineOptions): PollExternalVoteFactoryInterface {
    const seqKey = {};
    const getSeq = () => getSequenceCounter(seqKey);
    const screen = createScreener("PollExternalVote", modelFieldDefinitions);
    const build = async (inputData: Partial<Prisma.PollExternalVoteCreateInput> = {}) => {
        const seq = getSeq();
        const requiredScalarData = autoGeneratePollExternalVoteScalarsOrEnums({ seq });
        const resolveValue = normalizeResolver<PollExternalVoteFactoryDefineInput, BuildDataOptions>(defaultDataResolver ?? {});
        const defaultData = await resolveValue({ seq });
        const defaultAssociations = {
            answer: isPollExternalVoteanswerFactory(defaultData.answer) ? {
                create: await defaultData.answer.build()
            } : defaultData.answer,
            source: isPollExternalVotesourceFactory(defaultData.source) ? {
                create: await defaultData.source.build()
            } : defaultData.source
        };
        const data: Prisma.PollExternalVoteCreateInput = { ...requiredScalarData, ...defaultData, ...defaultAssociations, ...inputData };
        return data;
    };
    const buildList = (inputData: number | readonly Partial<Prisma.PollExternalVoteCreateInput>[]) => Promise.all(normalizeList(inputData).map(data => build(data)));
    const pickForConnect = (inputData: PollExternalVote) => ({
        id: inputData.id
    });
    const create = async (inputData: Partial<Prisma.PollExternalVoteCreateInput> = {}) => {
        const data = await build(inputData).then(screen);
        return await getClient<PrismaClient>().pollExternalVote.create({ data });
    };
    const createList = (inputData: number | readonly Partial<Prisma.PollExternalVoteCreateInput>[]) => Promise.all(normalizeList(inputData).map(data => create(data)));
    const createForConnect = (inputData: Partial<Prisma.PollExternalVoteCreateInput> = {}) => create(inputData).then(pickForConnect);
    return {
        _factoryFor: "PollExternalVote" as const,
        build,
        buildList,
        buildCreateInput: build,
        pickForConnect,
        create,
        createList,
        createForConnect,
    };
}

/**
 * Define factory for {@link PollExternalVote} model.
 *
 * @param options
 * @returns factory {@link PollExternalVoteFactoryInterface}
 */
export function definePollExternalVoteFactory(options: PollExternalVoteFactoryDefineOptions): PollExternalVoteFactoryInterface {
    return definePollExternalVoteFactoryInternal(options);
}

type EventScalarOrEnumFields = {
    name: string;
    startsAt: Date;
};

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
    image?: EventimageFactory | Prisma.ImageCreateNestedOneWithoutEventsInput;
    location?: string | null;
    startsAt?: Date;
    endsAt?: Date | null;
    tags?: Prisma.TaggedEventsCreateNestedManyWithoutEventInput;
};

type EventFactoryDefineOptions = {
    defaultData?: Resolver<EventFactoryDefineInput, BuildDataOptions>;
};

function isEventimageFactory(x: EventimageFactory | Prisma.ImageCreateNestedOneWithoutEventsInput | undefined): x is EventimageFactory {
    return (x as any)?._factoryFor === "Image";
}

export interface EventFactoryInterface {
    readonly _factoryFor: "Event";
    build(inputData?: Partial<Prisma.EventCreateInput>): PromiseLike<Prisma.EventCreateInput>;
    buildCreateInput(inputData?: Partial<Prisma.EventCreateInput>): PromiseLike<Prisma.EventCreateInput>;
    buildList(inputData: number | readonly Partial<Prisma.EventCreateInput>[]): PromiseLike<Prisma.EventCreateInput[]>;
    pickForConnect(inputData: Event): Pick<Event, "id">;
    create(inputData?: Partial<Prisma.EventCreateInput>): PromiseLike<Event>;
    createList(inputData: number | readonly Partial<Prisma.EventCreateInput>[]): PromiseLike<Event[]>;
    createForConnect(inputData?: Partial<Prisma.EventCreateInput>): PromiseLike<Pick<Event, "id">>;
}

function autoGenerateEventScalarsOrEnums({ seq }: {
    readonly seq: number;
}): EventScalarOrEnumFields {
    return {
        name: getScalarFieldValueGenerator().String({ modelName: "Event", fieldName: "name", isId: false, isUnique: false, seq }),
        startsAt: getScalarFieldValueGenerator().DateTime({ modelName: "Event", fieldName: "startsAt", isId: false, isUnique: false, seq })
    };
}

function defineEventFactoryInternal({ defaultData: defaultDataResolver }: EventFactoryDefineOptions): EventFactoryInterface {
    const seqKey = {};
    const getSeq = () => getSequenceCounter(seqKey);
    const screen = createScreener("Event", modelFieldDefinitions);
    const build = async (inputData: Partial<Prisma.EventCreateInput> = {}) => {
        const seq = getSeq();
        const requiredScalarData = autoGenerateEventScalarsOrEnums({ seq });
        const resolveValue = normalizeResolver<EventFactoryDefineInput, BuildDataOptions>(defaultDataResolver ?? {});
        const defaultData = await resolveValue({ seq });
        const defaultAssociations = {
            image: isEventimageFactory(defaultData.image) ? {
                create: await defaultData.image.build()
            } : defaultData.image
        };
        const data: Prisma.EventCreateInput = { ...requiredScalarData, ...defaultData, ...defaultAssociations, ...inputData };
        return data;
    };
    const buildList = (inputData: number | readonly Partial<Prisma.EventCreateInput>[]) => Promise.all(normalizeList(inputData).map(data => build(data)));
    const pickForConnect = (inputData: Event) => ({
        id: inputData.id
    });
    const create = async (inputData: Partial<Prisma.EventCreateInput> = {}) => {
        const data = await build(inputData).then(screen);
        return await getClient<PrismaClient>().event.create({ data });
    };
    const createList = (inputData: number | readonly Partial<Prisma.EventCreateInput>[]) => Promise.all(normalizeList(inputData).map(data => create(data)));
    const createForConnect = (inputData: Partial<Prisma.EventCreateInput> = {}) => create(inputData).then(pickForConnect);
    return {
        _factoryFor: "Event" as const,
        build,
        buildList,
        buildCreateInput: build,
        pickForConnect,
        create,
        createList,
        createForConnect,
    };
}

/**
 * Define factory for {@link Event} model.
 *
 * @param options
 * @returns factory {@link EventFactoryInterface}
 */
export function defineEventFactory(options: EventFactoryDefineOptions = {}): EventFactoryInterface {
    return defineEventFactoryInternal(options);
}

type TaggedEventsScalarOrEnumFields = {};

type TaggedEventseventFactory = {
    _factoryFor: "Event";
    build: () => PromiseLike<Prisma.EventCreateNestedOneWithoutTagsInput["create"]>;
};

type TaggedEventstagFactory = {
    _factoryFor: "Tag";
    build: () => PromiseLike<Prisma.TagCreateNestedOneWithoutEventsInput["create"]>;
};

type TaggedEventsFactoryDefineInput = {
    event: TaggedEventseventFactory | Prisma.EventCreateNestedOneWithoutTagsInput;
    tag: TaggedEventstagFactory | Prisma.TagCreateNestedOneWithoutEventsInput;
    createdAt?: Date;
    modifiedAt?: Date;
};

type TaggedEventsFactoryDefineOptions = {
    defaultData: Resolver<TaggedEventsFactoryDefineInput, BuildDataOptions>;
};

function isTaggedEventseventFactory(x: TaggedEventseventFactory | Prisma.EventCreateNestedOneWithoutTagsInput | undefined): x is TaggedEventseventFactory {
    return (x as any)?._factoryFor === "Event";
}

function isTaggedEventstagFactory(x: TaggedEventstagFactory | Prisma.TagCreateNestedOneWithoutEventsInput | undefined): x is TaggedEventstagFactory {
    return (x as any)?._factoryFor === "Tag";
}

export interface TaggedEventsFactoryInterface {
    readonly _factoryFor: "TaggedEvents";
    build(inputData?: Partial<Prisma.TaggedEventsCreateInput>): PromiseLike<Prisma.TaggedEventsCreateInput>;
    buildCreateInput(inputData?: Partial<Prisma.TaggedEventsCreateInput>): PromiseLike<Prisma.TaggedEventsCreateInput>;
    buildList(inputData: number | readonly Partial<Prisma.TaggedEventsCreateInput>[]): PromiseLike<Prisma.TaggedEventsCreateInput[]>;
    pickForConnect(inputData: TaggedEvents): Pick<TaggedEvents, "eventId" | "tagId">;
    create(inputData?: Partial<Prisma.TaggedEventsCreateInput>): PromiseLike<TaggedEvents>;
    createList(inputData: number | readonly Partial<Prisma.TaggedEventsCreateInput>[]): PromiseLike<TaggedEvents[]>;
    createForConnect(inputData?: Partial<Prisma.TaggedEventsCreateInput>): PromiseLike<Pick<TaggedEvents, "eventId" | "tagId">>;
}

function autoGenerateTaggedEventsScalarsOrEnums({ seq }: {
    readonly seq: number;
}): TaggedEventsScalarOrEnumFields {
    return {};
}

function defineTaggedEventsFactoryInternal({ defaultData: defaultDataResolver }: TaggedEventsFactoryDefineOptions): TaggedEventsFactoryInterface {
    const seqKey = {};
    const getSeq = () => getSequenceCounter(seqKey);
    const screen = createScreener("TaggedEvents", modelFieldDefinitions);
    const build = async (inputData: Partial<Prisma.TaggedEventsCreateInput> = {}) => {
        const seq = getSeq();
        const requiredScalarData = autoGenerateTaggedEventsScalarsOrEnums({ seq });
        const resolveValue = normalizeResolver<TaggedEventsFactoryDefineInput, BuildDataOptions>(defaultDataResolver ?? {});
        const defaultData = await resolveValue({ seq });
        const defaultAssociations = {
            event: isTaggedEventseventFactory(defaultData.event) ? {
                create: await defaultData.event.build()
            } : defaultData.event,
            tag: isTaggedEventstagFactory(defaultData.tag) ? {
                create: await defaultData.tag.build()
            } : defaultData.tag
        };
        const data: Prisma.TaggedEventsCreateInput = { ...requiredScalarData, ...defaultData, ...defaultAssociations, ...inputData };
        return data;
    };
    const buildList = (inputData: number | readonly Partial<Prisma.TaggedEventsCreateInput>[]) => Promise.all(normalizeList(inputData).map(data => build(data)));
    const pickForConnect = (inputData: TaggedEvents) => ({
        eventId: inputData.eventId,
        tagId: inputData.tagId
    });
    const create = async (inputData: Partial<Prisma.TaggedEventsCreateInput> = {}) => {
        const data = await build(inputData).then(screen);
        return await getClient<PrismaClient>().taggedEvents.create({ data });
    };
    const createList = (inputData: number | readonly Partial<Prisma.TaggedEventsCreateInput>[]) => Promise.all(normalizeList(inputData).map(data => create(data)));
    const createForConnect = (inputData: Partial<Prisma.TaggedEventsCreateInput> = {}) => create(inputData).then(pickForConnect);
    return {
        _factoryFor: "TaggedEvents" as const,
        build,
        buildList,
        buildCreateInput: build,
        pickForConnect,
        create,
        createList,
        createForConnect,
    };
}

/**
 * Define factory for {@link TaggedEvents} model.
 *
 * @param options
 * @returns factory {@link TaggedEventsFactoryInterface}
 */
export function defineTaggedEventsFactory(options: TaggedEventsFactoryDefineOptions): TaggedEventsFactoryInterface {
    return defineTaggedEventsFactoryInternal(options);
}

type UserFlowScalarOrEnumFields = {};

type UserFlowaccountCreationMailTemplateFactory = {
    _factoryFor: "MailTemplate";
    build: () => PromiseLike<Prisma.MailTemplateCreateNestedOneWithoutAccountCreationsInput["create"]>;
};

type UserFlowpasswordResetMailTemplateFactory = {
    _factoryFor: "MailTemplate";
    build: () => PromiseLike<Prisma.MailTemplateCreateNestedOneWithoutPasswordResetsInput["create"]>;
};

type UserFlowloginLinkMailTemplateFactory = {
    _factoryFor: "MailTemplate";
    build: () => PromiseLike<Prisma.MailTemplateCreateNestedOneWithoutLoginLinksInput["create"]>;
};

type UserFlowFactoryDefineInput = {
    createdAt?: Date;
    modifiedAt?: Date;
    accountCreationMailTemplate?: UserFlowaccountCreationMailTemplateFactory | Prisma.MailTemplateCreateNestedOneWithoutAccountCreationsInput;
    passwordResetMailTemplate?: UserFlowpasswordResetMailTemplateFactory | Prisma.MailTemplateCreateNestedOneWithoutPasswordResetsInput;
    loginLinkMailTemplate?: UserFlowloginLinkMailTemplateFactory | Prisma.MailTemplateCreateNestedOneWithoutLoginLinksInput;
};

type UserFlowFactoryDefineOptions = {
    defaultData?: Resolver<UserFlowFactoryDefineInput, BuildDataOptions>;
};

function isUserFlowaccountCreationMailTemplateFactory(x: UserFlowaccountCreationMailTemplateFactory | Prisma.MailTemplateCreateNestedOneWithoutAccountCreationsInput | undefined): x is UserFlowaccountCreationMailTemplateFactory {
    return (x as any)?._factoryFor === "MailTemplate";
}

function isUserFlowpasswordResetMailTemplateFactory(x: UserFlowpasswordResetMailTemplateFactory | Prisma.MailTemplateCreateNestedOneWithoutPasswordResetsInput | undefined): x is UserFlowpasswordResetMailTemplateFactory {
    return (x as any)?._factoryFor === "MailTemplate";
}

function isUserFlowloginLinkMailTemplateFactory(x: UserFlowloginLinkMailTemplateFactory | Prisma.MailTemplateCreateNestedOneWithoutLoginLinksInput | undefined): x is UserFlowloginLinkMailTemplateFactory {
    return (x as any)?._factoryFor === "MailTemplate";
}

export interface UserFlowFactoryInterface {
    readonly _factoryFor: "UserFlow";
    build(inputData?: Partial<Prisma.UserFlowCreateInput>): PromiseLike<Prisma.UserFlowCreateInput>;
    buildCreateInput(inputData?: Partial<Prisma.UserFlowCreateInput>): PromiseLike<Prisma.UserFlowCreateInput>;
    buildList(inputData: number | readonly Partial<Prisma.UserFlowCreateInput>[]): PromiseLike<Prisma.UserFlowCreateInput[]>;
    pickForConnect(inputData: UserFlow): Pick<UserFlow, "id">;
    create(inputData?: Partial<Prisma.UserFlowCreateInput>): PromiseLike<UserFlow>;
    createList(inputData: number | readonly Partial<Prisma.UserFlowCreateInput>[]): PromiseLike<UserFlow[]>;
    createForConnect(inputData?: Partial<Prisma.UserFlowCreateInput>): PromiseLike<Pick<UserFlow, "id">>;
}

function autoGenerateUserFlowScalarsOrEnums({ seq }: {
    readonly seq: number;
}): UserFlowScalarOrEnumFields {
    return {};
}

function defineUserFlowFactoryInternal({ defaultData: defaultDataResolver }: UserFlowFactoryDefineOptions): UserFlowFactoryInterface {
    const seqKey = {};
    const getSeq = () => getSequenceCounter(seqKey);
    const screen = createScreener("UserFlow", modelFieldDefinitions);
    const build = async (inputData: Partial<Prisma.UserFlowCreateInput> = {}) => {
        const seq = getSeq();
        const requiredScalarData = autoGenerateUserFlowScalarsOrEnums({ seq });
        const resolveValue = normalizeResolver<UserFlowFactoryDefineInput, BuildDataOptions>(defaultDataResolver ?? {});
        const defaultData = await resolveValue({ seq });
        const defaultAssociations = {
            accountCreationMailTemplate: isUserFlowaccountCreationMailTemplateFactory(defaultData.accountCreationMailTemplate) ? {
                create: await defaultData.accountCreationMailTemplate.build()
            } : defaultData.accountCreationMailTemplate,
            passwordResetMailTemplate: isUserFlowpasswordResetMailTemplateFactory(defaultData.passwordResetMailTemplate) ? {
                create: await defaultData.passwordResetMailTemplate.build()
            } : defaultData.passwordResetMailTemplate,
            loginLinkMailTemplate: isUserFlowloginLinkMailTemplateFactory(defaultData.loginLinkMailTemplate) ? {
                create: await defaultData.loginLinkMailTemplate.build()
            } : defaultData.loginLinkMailTemplate
        };
        const data: Prisma.UserFlowCreateInput = { ...requiredScalarData, ...defaultData, ...defaultAssociations, ...inputData };
        return data;
    };
    const buildList = (inputData: number | readonly Partial<Prisma.UserFlowCreateInput>[]) => Promise.all(normalizeList(inputData).map(data => build(data)));
    const pickForConnect = (inputData: UserFlow) => ({
        id: inputData.id
    });
    const create = async (inputData: Partial<Prisma.UserFlowCreateInput> = {}) => {
        const data = await build(inputData).then(screen);
        return await getClient<PrismaClient>().userFlow.create({ data });
    };
    const createList = (inputData: number | readonly Partial<Prisma.UserFlowCreateInput>[]) => Promise.all(normalizeList(inputData).map(data => create(data)));
    const createForConnect = (inputData: Partial<Prisma.UserFlowCreateInput> = {}) => create(inputData).then(pickForConnect);
    return {
        _factoryFor: "UserFlow" as const,
        build,
        buildList,
        buildCreateInput: build,
        pickForConnect,
        create,
        createList,
        createForConnect,
    };
}

/**
 * Define factory for {@link UserFlow} model.
 *
 * @param options
 * @returns factory {@link UserFlowFactoryInterface}
 */
export function defineUserFlowFactory(options: UserFlowFactoryDefineOptions = {}): UserFlowFactoryInterface {
    return defineUserFlowFactoryInternal(options);
}

type SubscriptionFlowScalarOrEnumFields = {};

type SubscriptionFlowmemberPlanFactory = {
    _factoryFor: "MemberPlan";
    build: () => PromiseLike<Prisma.MemberPlanCreateNestedOneWithoutSubscriptionFlowsInput["create"]>;
};

type SubscriptionFlowFactoryDefineInput = {
    createdAt?: Date;
    modifiedAt?: Date;
    default?: boolean;
    memberPlan?: SubscriptionFlowmemberPlanFactory | Prisma.MemberPlanCreateNestedOneWithoutSubscriptionFlowsInput;
    paymentMethods?: Prisma.PaymentMethodCreateNestedManyWithoutSubscriptionFlowsInput;
    periodicities?: Prisma.SubscriptionFlowCreateperiodicitiesInput | Prisma.Enumerable<PaymentPeriodicity>;
    autoRenewal?: Prisma.SubscriptionFlowCreateautoRenewalInput | Prisma.Enumerable<boolean>;
    intervals?: Prisma.SubscriptionIntervalCreateNestedManyWithoutSubscriptionFlowInput;
};

type SubscriptionFlowFactoryDefineOptions = {
    defaultData?: Resolver<SubscriptionFlowFactoryDefineInput, BuildDataOptions>;
};

function isSubscriptionFlowmemberPlanFactory(x: SubscriptionFlowmemberPlanFactory | Prisma.MemberPlanCreateNestedOneWithoutSubscriptionFlowsInput | undefined): x is SubscriptionFlowmemberPlanFactory {
    return (x as any)?._factoryFor === "MemberPlan";
}

export interface SubscriptionFlowFactoryInterface {
    readonly _factoryFor: "SubscriptionFlow";
    build(inputData?: Partial<Prisma.SubscriptionFlowCreateInput>): PromiseLike<Prisma.SubscriptionFlowCreateInput>;
    buildCreateInput(inputData?: Partial<Prisma.SubscriptionFlowCreateInput>): PromiseLike<Prisma.SubscriptionFlowCreateInput>;
    buildList(inputData: number | readonly Partial<Prisma.SubscriptionFlowCreateInput>[]): PromiseLike<Prisma.SubscriptionFlowCreateInput[]>;
    pickForConnect(inputData: SubscriptionFlow): Pick<SubscriptionFlow, "id">;
    create(inputData?: Partial<Prisma.SubscriptionFlowCreateInput>): PromiseLike<SubscriptionFlow>;
    createList(inputData: number | readonly Partial<Prisma.SubscriptionFlowCreateInput>[]): PromiseLike<SubscriptionFlow[]>;
    createForConnect(inputData?: Partial<Prisma.SubscriptionFlowCreateInput>): PromiseLike<Pick<SubscriptionFlow, "id">>;
}

function autoGenerateSubscriptionFlowScalarsOrEnums({ seq }: {
    readonly seq: number;
}): SubscriptionFlowScalarOrEnumFields {
    return {};
}

function defineSubscriptionFlowFactoryInternal({ defaultData: defaultDataResolver }: SubscriptionFlowFactoryDefineOptions): SubscriptionFlowFactoryInterface {
    const seqKey = {};
    const getSeq = () => getSequenceCounter(seqKey);
    const screen = createScreener("SubscriptionFlow", modelFieldDefinitions);
    const build = async (inputData: Partial<Prisma.SubscriptionFlowCreateInput> = {}) => {
        const seq = getSeq();
        const requiredScalarData = autoGenerateSubscriptionFlowScalarsOrEnums({ seq });
        const resolveValue = normalizeResolver<SubscriptionFlowFactoryDefineInput, BuildDataOptions>(defaultDataResolver ?? {});
        const defaultData = await resolveValue({ seq });
        const defaultAssociations = {
            memberPlan: isSubscriptionFlowmemberPlanFactory(defaultData.memberPlan) ? {
                create: await defaultData.memberPlan.build()
            } : defaultData.memberPlan
        };
        const data: Prisma.SubscriptionFlowCreateInput = { ...requiredScalarData, ...defaultData, ...defaultAssociations, ...inputData };
        return data;
    };
    const buildList = (inputData: number | readonly Partial<Prisma.SubscriptionFlowCreateInput>[]) => Promise.all(normalizeList(inputData).map(data => build(data)));
    const pickForConnect = (inputData: SubscriptionFlow) => ({
        id: inputData.id
    });
    const create = async (inputData: Partial<Prisma.SubscriptionFlowCreateInput> = {}) => {
        const data = await build(inputData).then(screen);
        return await getClient<PrismaClient>().subscriptionFlow.create({ data });
    };
    const createList = (inputData: number | readonly Partial<Prisma.SubscriptionFlowCreateInput>[]) => Promise.all(normalizeList(inputData).map(data => create(data)));
    const createForConnect = (inputData: Partial<Prisma.SubscriptionFlowCreateInput> = {}) => create(inputData).then(pickForConnect);
    return {
        _factoryFor: "SubscriptionFlow" as const,
        build,
        buildList,
        buildCreateInput: build,
        pickForConnect,
        create,
        createList,
        createForConnect,
    };
}

/**
 * Define factory for {@link SubscriptionFlow} model.
 *
 * @param options
 * @returns factory {@link SubscriptionFlowFactoryInterface}
 */
export function defineSubscriptionFlowFactory(options: SubscriptionFlowFactoryDefineOptions = {}): SubscriptionFlowFactoryInterface {
    return defineSubscriptionFlowFactoryInternal(options);
}

type SubscriptionIntervalScalarOrEnumFields = {
    event: SubscriptionEvent;
};

type SubscriptionIntervalmailTemplateFactory = {
    _factoryFor: "MailTemplate";
    build: () => PromiseLike<Prisma.MailTemplateCreateNestedOneWithoutSubscriptionIntervalsInput["create"]>;
};

type SubscriptionIntervalFactoryDefineInput = {
    createdAt?: Date;
    modifiedAt?: Date;
    event?: SubscriptionEvent;
    daysAwayFromEnding?: number | null;
    mailTemplate?: SubscriptionIntervalmailTemplateFactory | Prisma.MailTemplateCreateNestedOneWithoutSubscriptionIntervalsInput;
    subscriptionFlow?: Prisma.SubscriptionFlowCreateNestedManyWithoutIntervalsInput;
};

type SubscriptionIntervalFactoryDefineOptions = {
    defaultData?: Resolver<SubscriptionIntervalFactoryDefineInput, BuildDataOptions>;
};

function isSubscriptionIntervalmailTemplateFactory(x: SubscriptionIntervalmailTemplateFactory | Prisma.MailTemplateCreateNestedOneWithoutSubscriptionIntervalsInput | undefined): x is SubscriptionIntervalmailTemplateFactory {
    return (x as any)?._factoryFor === "MailTemplate";
}

export interface SubscriptionIntervalFactoryInterface {
    readonly _factoryFor: "SubscriptionInterval";
    build(inputData?: Partial<Prisma.SubscriptionIntervalCreateInput>): PromiseLike<Prisma.SubscriptionIntervalCreateInput>;
    buildCreateInput(inputData?: Partial<Prisma.SubscriptionIntervalCreateInput>): PromiseLike<Prisma.SubscriptionIntervalCreateInput>;
    buildList(inputData: number | readonly Partial<Prisma.SubscriptionIntervalCreateInput>[]): PromiseLike<Prisma.SubscriptionIntervalCreateInput[]>;
    pickForConnect(inputData: SubscriptionInterval): Pick<SubscriptionInterval, "id">;
    create(inputData?: Partial<Prisma.SubscriptionIntervalCreateInput>): PromiseLike<SubscriptionInterval>;
    createList(inputData: number | readonly Partial<Prisma.SubscriptionIntervalCreateInput>[]): PromiseLike<SubscriptionInterval[]>;
    createForConnect(inputData?: Partial<Prisma.SubscriptionIntervalCreateInput>): PromiseLike<Pick<SubscriptionInterval, "id">>;
}

function autoGenerateSubscriptionIntervalScalarsOrEnums({ seq }: {
    readonly seq: number;
}): SubscriptionIntervalScalarOrEnumFields {
    return {
        event: "SUBSCRIBE"
    };
}

function defineSubscriptionIntervalFactoryInternal({ defaultData: defaultDataResolver }: SubscriptionIntervalFactoryDefineOptions): SubscriptionIntervalFactoryInterface {
    const seqKey = {};
    const getSeq = () => getSequenceCounter(seqKey);
    const screen = createScreener("SubscriptionInterval", modelFieldDefinitions);
    const build = async (inputData: Partial<Prisma.SubscriptionIntervalCreateInput> = {}) => {
        const seq = getSeq();
        const requiredScalarData = autoGenerateSubscriptionIntervalScalarsOrEnums({ seq });
        const resolveValue = normalizeResolver<SubscriptionIntervalFactoryDefineInput, BuildDataOptions>(defaultDataResolver ?? {});
        const defaultData = await resolveValue({ seq });
        const defaultAssociations = {
            mailTemplate: isSubscriptionIntervalmailTemplateFactory(defaultData.mailTemplate) ? {
                create: await defaultData.mailTemplate.build()
            } : defaultData.mailTemplate
        };
        const data: Prisma.SubscriptionIntervalCreateInput = { ...requiredScalarData, ...defaultData, ...defaultAssociations, ...inputData };
        return data;
    };
    const buildList = (inputData: number | readonly Partial<Prisma.SubscriptionIntervalCreateInput>[]) => Promise.all(normalizeList(inputData).map(data => build(data)));
    const pickForConnect = (inputData: SubscriptionInterval) => ({
        id: inputData.id
    });
    const create = async (inputData: Partial<Prisma.SubscriptionIntervalCreateInput> = {}) => {
        const data = await build(inputData).then(screen);
        return await getClient<PrismaClient>().subscriptionInterval.create({ data });
    };
    const createList = (inputData: number | readonly Partial<Prisma.SubscriptionIntervalCreateInput>[]) => Promise.all(normalizeList(inputData).map(data => create(data)));
    const createForConnect = (inputData: Partial<Prisma.SubscriptionIntervalCreateInput> = {}) => create(inputData).then(pickForConnect);
    return {
        _factoryFor: "SubscriptionInterval" as const,
        build,
        buildList,
        buildCreateInput: build,
        pickForConnect,
        create,
        createList,
        createForConnect,
    };
}

/**
 * Define factory for {@link SubscriptionInterval} model.
 *
 * @param options
 * @returns factory {@link SubscriptionIntervalFactoryInterface}
 */
export function defineSubscriptionIntervalFactory(options: SubscriptionIntervalFactoryDefineOptions = {}): SubscriptionIntervalFactoryInterface {
    return defineSubscriptionIntervalFactoryInternal(options);
}

type MailTemplateScalarOrEnumFields = {
    name: string;
    externalMailTemplateId: string;
};

type MailTemplateaccountCreationsFactory = {
    _factoryFor: "UserFlow";
    build: () => PromiseLike<Prisma.UserFlowCreateNestedOneWithoutAccountCreationMailTemplateInput["create"]>;
};

type MailTemplatepasswordResetsFactory = {
    _factoryFor: "UserFlow";
    build: () => PromiseLike<Prisma.UserFlowCreateNestedOneWithoutPasswordResetMailTemplateInput["create"]>;
};

type MailTemplateloginLinksFactory = {
    _factoryFor: "UserFlow";
    build: () => PromiseLike<Prisma.UserFlowCreateNestedOneWithoutLoginLinkMailTemplateInput["create"]>;
};

type MailTemplateFactoryDefineInput = {
    createdAt?: Date;
    modifiedAt?: Date;
    name?: string;
    description?: string | null;
    externalMailTemplateId?: string;
    remoteMissing?: boolean;
    subscriptionIntervals?: Prisma.SubscriptionIntervalCreateNestedManyWithoutMailTemplateInput;
    accountCreations?: MailTemplateaccountCreationsFactory | Prisma.UserFlowCreateNestedOneWithoutAccountCreationMailTemplateInput;
    passwordResets?: MailTemplatepasswordResetsFactory | Prisma.UserFlowCreateNestedOneWithoutPasswordResetMailTemplateInput;
    loginLinks?: MailTemplateloginLinksFactory | Prisma.UserFlowCreateNestedOneWithoutLoginLinkMailTemplateInput;
    mailLog?: Prisma.MailLogCreateNestedManyWithoutMailTemplateInput;
};

type MailTemplateFactoryDefineOptions = {
    defaultData?: Resolver<MailTemplateFactoryDefineInput, BuildDataOptions>;
};

function isMailTemplateaccountCreationsFactory(x: MailTemplateaccountCreationsFactory | Prisma.UserFlowCreateNestedOneWithoutAccountCreationMailTemplateInput | undefined): x is MailTemplateaccountCreationsFactory {
    return (x as any)?._factoryFor === "UserFlow";
}

function isMailTemplatepasswordResetsFactory(x: MailTemplatepasswordResetsFactory | Prisma.UserFlowCreateNestedOneWithoutPasswordResetMailTemplateInput | undefined): x is MailTemplatepasswordResetsFactory {
    return (x as any)?._factoryFor === "UserFlow";
}

function isMailTemplateloginLinksFactory(x: MailTemplateloginLinksFactory | Prisma.UserFlowCreateNestedOneWithoutLoginLinkMailTemplateInput | undefined): x is MailTemplateloginLinksFactory {
    return (x as any)?._factoryFor === "UserFlow";
}

export interface MailTemplateFactoryInterface {
    readonly _factoryFor: "MailTemplate";
    build(inputData?: Partial<Prisma.MailTemplateCreateInput>): PromiseLike<Prisma.MailTemplateCreateInput>;
    buildCreateInput(inputData?: Partial<Prisma.MailTemplateCreateInput>): PromiseLike<Prisma.MailTemplateCreateInput>;
    buildList(inputData: number | readonly Partial<Prisma.MailTemplateCreateInput>[]): PromiseLike<Prisma.MailTemplateCreateInput[]>;
    pickForConnect(inputData: MailTemplate): Pick<MailTemplate, "id">;
    create(inputData?: Partial<Prisma.MailTemplateCreateInput>): PromiseLike<MailTemplate>;
    createList(inputData: number | readonly Partial<Prisma.MailTemplateCreateInput>[]): PromiseLike<MailTemplate[]>;
    createForConnect(inputData?: Partial<Prisma.MailTemplateCreateInput>): PromiseLike<Pick<MailTemplate, "id">>;
}

function autoGenerateMailTemplateScalarsOrEnums({ seq }: {
    readonly seq: number;
}): MailTemplateScalarOrEnumFields {
    return {
        name: getScalarFieldValueGenerator().String({ modelName: "MailTemplate", fieldName: "name", isId: false, isUnique: false, seq }),
        externalMailTemplateId: getScalarFieldValueGenerator().String({ modelName: "MailTemplate", fieldName: "externalMailTemplateId", isId: false, isUnique: true, seq })
    };
}

function defineMailTemplateFactoryInternal({ defaultData: defaultDataResolver }: MailTemplateFactoryDefineOptions): MailTemplateFactoryInterface {
    const seqKey = {};
    const getSeq = () => getSequenceCounter(seqKey);
    const screen = createScreener("MailTemplate", modelFieldDefinitions);
    const build = async (inputData: Partial<Prisma.MailTemplateCreateInput> = {}) => {
        const seq = getSeq();
        const requiredScalarData = autoGenerateMailTemplateScalarsOrEnums({ seq });
        const resolveValue = normalizeResolver<MailTemplateFactoryDefineInput, BuildDataOptions>(defaultDataResolver ?? {});
        const defaultData = await resolveValue({ seq });
        const defaultAssociations = {
            accountCreations: isMailTemplateaccountCreationsFactory(defaultData.accountCreations) ? {
                create: await defaultData.accountCreations.build()
            } : defaultData.accountCreations,
            passwordResets: isMailTemplatepasswordResetsFactory(defaultData.passwordResets) ? {
                create: await defaultData.passwordResets.build()
            } : defaultData.passwordResets,
            loginLinks: isMailTemplateloginLinksFactory(defaultData.loginLinks) ? {
                create: await defaultData.loginLinks.build()
            } : defaultData.loginLinks
        };
        const data: Prisma.MailTemplateCreateInput = { ...requiredScalarData, ...defaultData, ...defaultAssociations, ...inputData };
        return data;
    };
    const buildList = (inputData: number | readonly Partial<Prisma.MailTemplateCreateInput>[]) => Promise.all(normalizeList(inputData).map(data => build(data)));
    const pickForConnect = (inputData: MailTemplate) => ({
        id: inputData.id
    });
    const create = async (inputData: Partial<Prisma.MailTemplateCreateInput> = {}) => {
        const data = await build(inputData).then(screen);
        return await getClient<PrismaClient>().mailTemplate.create({ data });
    };
    const createList = (inputData: number | readonly Partial<Prisma.MailTemplateCreateInput>[]) => Promise.all(normalizeList(inputData).map(data => create(data)));
    const createForConnect = (inputData: Partial<Prisma.MailTemplateCreateInput> = {}) => create(inputData).then(pickForConnect);
    return {
        _factoryFor: "MailTemplate" as const,
        build,
        buildList,
        buildCreateInput: build,
        pickForConnect,
        create,
        createList,
        createForConnect,
    };
}

/**
 * Define factory for {@link MailTemplate} model.
 *
 * @param options
 * @returns factory {@link MailTemplateFactoryInterface}
 */
export function defineMailTemplateFactory(options: MailTemplateFactoryDefineOptions = {}): MailTemplateFactoryInterface {
    return defineMailTemplateFactoryInternal(options);
}

type PeriodicJobScalarOrEnumFields = {
    date: Date;
};

type PeriodicJobFactoryDefineInput = {
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
};

export interface PeriodicJobFactoryInterface {
    readonly _factoryFor: "PeriodicJob";
    build(inputData?: Partial<Prisma.PeriodicJobCreateInput>): PromiseLike<Prisma.PeriodicJobCreateInput>;
    buildCreateInput(inputData?: Partial<Prisma.PeriodicJobCreateInput>): PromiseLike<Prisma.PeriodicJobCreateInput>;
    buildList(inputData: number | readonly Partial<Prisma.PeriodicJobCreateInput>[]): PromiseLike<Prisma.PeriodicJobCreateInput[]>;
    pickForConnect(inputData: PeriodicJob): Pick<PeriodicJob, "id">;
    create(inputData?: Partial<Prisma.PeriodicJobCreateInput>): PromiseLike<PeriodicJob>;
    createList(inputData: number | readonly Partial<Prisma.PeriodicJobCreateInput>[]): PromiseLike<PeriodicJob[]>;
    createForConnect(inputData?: Partial<Prisma.PeriodicJobCreateInput>): PromiseLike<Pick<PeriodicJob, "id">>;
}

function autoGeneratePeriodicJobScalarsOrEnums({ seq }: {
    readonly seq: number;
}): PeriodicJobScalarOrEnumFields {
    return {
        date: getScalarFieldValueGenerator().DateTime({ modelName: "PeriodicJob", fieldName: "date", isId: false, isUnique: true, seq })
    };
}

function definePeriodicJobFactoryInternal({ defaultData: defaultDataResolver }: PeriodicJobFactoryDefineOptions): PeriodicJobFactoryInterface {
    const seqKey = {};
    const getSeq = () => getSequenceCounter(seqKey);
    const screen = createScreener("PeriodicJob", modelFieldDefinitions);
    const build = async (inputData: Partial<Prisma.PeriodicJobCreateInput> = {}) => {
        const seq = getSeq();
        const requiredScalarData = autoGeneratePeriodicJobScalarsOrEnums({ seq });
        const resolveValue = normalizeResolver<PeriodicJobFactoryDefineInput, BuildDataOptions>(defaultDataResolver ?? {});
        const defaultData = await resolveValue({ seq });
        const defaultAssociations = {};
        const data: Prisma.PeriodicJobCreateInput = { ...requiredScalarData, ...defaultData, ...defaultAssociations, ...inputData };
        return data;
    };
    const buildList = (inputData: number | readonly Partial<Prisma.PeriodicJobCreateInput>[]) => Promise.all(normalizeList(inputData).map(data => build(data)));
    const pickForConnect = (inputData: PeriodicJob) => ({
        id: inputData.id
    });
    const create = async (inputData: Partial<Prisma.PeriodicJobCreateInput> = {}) => {
        const data = await build(inputData).then(screen);
        return await getClient<PrismaClient>().periodicJob.create({ data });
    };
    const createList = (inputData: number | readonly Partial<Prisma.PeriodicJobCreateInput>[]) => Promise.all(normalizeList(inputData).map(data => create(data)));
    const createForConnect = (inputData: Partial<Prisma.PeriodicJobCreateInput> = {}) => create(inputData).then(pickForConnect);
    return {
        _factoryFor: "PeriodicJob" as const,
        build,
        buildList,
        buildCreateInput: build,
        pickForConnect,
        create,
        createList,
        createForConnect,
    };
}

/**
 * Define factory for {@link PeriodicJob} model.
 *
 * @param options
 * @returns factory {@link PeriodicJobFactoryInterface}
 */
export function definePeriodicJobFactory(options: PeriodicJobFactoryDefineOptions = {}): PeriodicJobFactoryInterface {
    return definePeriodicJobFactoryInternal(options);
}
