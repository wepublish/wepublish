import { __awaiter } from "tslib";
import { getClient, createScreener, getScalarFieldValueGenerator, normalizeResolver, normalizeList, getSequenceCounter, } from "@quramy/prisma-fabbrica/lib/internal";
export { initialize, resetSequence, registerScalarFieldValueGenerator, resetScalarFieldValueGenerator } from "@quramy/prisma-fabbrica/lib/internal";
const modelFieldDefinitions = [{
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
            }, {
                name: "tags",
                type: "TaggedArticles",
                relationName: "ArticleToTaggedArticles"
            }]
    }, {
        name: "TaggedArticles",
        fields: [{
                name: "article",
                type: "Article",
                relationName: "ArticleToTaggedArticles"
            }, {
                name: "tag",
                type: "Tag",
                relationName: "TagToTaggedArticles"
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
            }, {
                name: "tags",
                type: "TaggedAuthors",
                relationName: "AuthorToTaggedAuthors"
            }]
    }, {
        name: "TaggedAuthors",
        fields: [{
                name: "author",
                type: "Author",
                relationName: "AuthorToTaggedAuthors"
            }, {
                name: "tag",
                type: "Tag",
                relationName: "TagToTaggedAuthors"
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
            }, {
                name: "tags",
                type: "TaggedPages",
                relationName: "PageToTaggedPages"
            }]
    }, {
        name: "TaggedPages",
        fields: [{
                name: "page",
                type: "Page",
                relationName: "PageToTaggedPages"
            }, {
                name: "tag",
                type: "Tag",
                relationName: "TagToTaggedPages"
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
            }, {
                name: "UserConsent",
                type: "UserConsent",
                relationName: "UserToUserConsent"
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
            }, {
                name: "authors",
                type: "TaggedAuthors",
                relationName: "TagToTaggedAuthors"
            }, {
                name: "articles",
                type: "TaggedArticles",
                relationName: "TagToTaggedArticles"
            }, {
                name: "pages",
                type: "TaggedPages",
                relationName: "TagToTaggedPages"
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
        name: "Consent",
        fields: [{
                name: "userConsents",
                type: "UserConsent",
                relationName: "ConsentToUserConsent"
            }]
    }, {
        name: "UserConsent",
        fields: [{
                name: "consent",
                type: "Consent",
                relationName: "ConsentToUserConsent"
            }, {
                name: "user",
                type: "User",
                relationName: "UserToUserConsent"
            }]
    }, {
        name: "UserFlowMail",
        fields: [{
                name: "mailTemplate",
                type: "MailTemplate",
                relationName: "MailTemplateToUserFlowMail"
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
                name: "userFlowMails",
                type: "UserFlowMail",
                relationName: "MailTemplateToUserFlowMail"
            }, {
                name: "mailLog",
                type: "MailLog",
                relationName: "MailLogToMailTemplate"
            }]
    }, {
        name: "PeriodicJob",
        fields: []
    }, {
        name: "BlockStyle",
        fields: []
    }];
function isMetadataPropertyArticleRevisionFactory(x) {
    return (x === null || x === void 0 ? void 0 : x._factoryFor) === "ArticleRevision";
}
function isMetadataPropertyPageRevisionFactory(x) {
    return (x === null || x === void 0 ? void 0 : x._factoryFor) === "PageRevision";
}
function isMetadataPropertySubscriptionFactory(x) {
    return (x === null || x === void 0 ? void 0 : x._factoryFor) === "Subscription";
}
function isMetadataPropertyUserFactory(x) {
    return (x === null || x === void 0 ? void 0 : x._factoryFor) === "User";
}
function autoGenerateMetadataPropertyScalarsOrEnums({ seq }) {
    return {
        key: getScalarFieldValueGenerator().String({ modelName: "MetadataProperty", fieldName: "key", isId: false, isUnique: false, seq }),
        value: getScalarFieldValueGenerator().String({ modelName: "MetadataProperty", fieldName: "value", isId: false, isUnique: false, seq }),
        public: getScalarFieldValueGenerator().Boolean({ modelName: "MetadataProperty", fieldName: "public", isId: false, isUnique: false, seq })
    };
}
function defineMetadataPropertyFactoryInternal({ defaultData: defaultDataResolver, traits: traitsDefs = {} }) {
    const getFactoryWithTraits = (traitKeys = []) => {
        const seqKey = {};
        const getSeq = () => getSequenceCounter(seqKey);
        const screen = createScreener("MetadataProperty", modelFieldDefinitions);
        const build = (...args_1) => __awaiter(this, [...args_1], void 0, function* (inputData = {}) {
            const seq = getSeq();
            const requiredScalarData = autoGenerateMetadataPropertyScalarsOrEnums({ seq });
            const resolveValue = normalizeResolver(defaultDataResolver !== null && defaultDataResolver !== void 0 ? defaultDataResolver : {});
            const defaultData = yield traitKeys.reduce((queue, traitKey) => __awaiter(this, void 0, void 0, function* () {
                var _a, _b;
                const acc = yield queue;
                const resolveTraitValue = normalizeResolver((_b = (_a = traitsDefs[traitKey]) === null || _a === void 0 ? void 0 : _a.data) !== null && _b !== void 0 ? _b : {});
                const traitData = yield resolveTraitValue({ seq });
                return Object.assign(Object.assign({}, acc), traitData);
            }), resolveValue({ seq }));
            const defaultAssociations = {
                ArticleRevision: isMetadataPropertyArticleRevisionFactory(defaultData.ArticleRevision) ? {
                    create: yield defaultData.ArticleRevision.build()
                } : defaultData.ArticleRevision,
                PageRevision: isMetadataPropertyPageRevisionFactory(defaultData.PageRevision) ? {
                    create: yield defaultData.PageRevision.build()
                } : defaultData.PageRevision,
                Subscription: isMetadataPropertySubscriptionFactory(defaultData.Subscription) ? {
                    create: yield defaultData.Subscription.build()
                } : defaultData.Subscription,
                User: isMetadataPropertyUserFactory(defaultData.User) ? {
                    create: yield defaultData.User.build()
                } : defaultData.User
            };
            const data = Object.assign(Object.assign(Object.assign(Object.assign({}, requiredScalarData), defaultData), defaultAssociations), inputData);
            return data;
        });
        const buildList = (inputData) => Promise.all(normalizeList(inputData).map(data => build(data)));
        const pickForConnect = (inputData) => ({
            id: inputData.id
        });
        const create = (...args_2) => __awaiter(this, [...args_2], void 0, function* (inputData = {}) {
            const data = yield build(inputData).then(screen);
            return yield getClient().metadataProperty.create({ data });
        });
        const createList = (inputData) => Promise.all(normalizeList(inputData).map(data => create(data)));
        const createForConnect = (inputData = {}) => create(inputData).then(pickForConnect);
        return {
            _factoryFor: "MetadataProperty",
            build,
            buildList,
            buildCreateInput: build,
            pickForConnect,
            create,
            createList,
            createForConnect,
        };
    };
    const factory = getFactoryWithTraits();
    const useTraits = (name, ...names) => {
        return getFactoryWithTraits([name, ...names]);
    };
    return Object.assign(Object.assign({}, factory), { use: useTraits });
}
/**
 * Define factory for {@link MetadataProperty} model.
 *
 * @param options
 * @returns factory {@link MetadataPropertyFactoryInterface}
 */
export function defineMetadataPropertyFactory(options) {
    return defineMetadataPropertyFactoryInternal(options !== null && options !== void 0 ? options : {});
}
function isArticleRevisionimageFactory(x) {
    return (x === null || x === void 0 ? void 0 : x._factoryFor) === "Image";
}
function isArticleRevisionsocialMediaImageFactory(x) {
    return (x === null || x === void 0 ? void 0 : x._factoryFor) === "Image";
}
function autoGenerateArticleRevisionScalarsOrEnums({ seq }) {
    return {
        breaking: getScalarFieldValueGenerator().Boolean({ modelName: "ArticleRevision", fieldName: "breaking", isId: false, isUnique: false, seq }),
        blocks: getScalarFieldValueGenerator().Json({ modelName: "ArticleRevision", fieldName: "blocks", isId: false, isUnique: false, seq }),
        hideAuthor: getScalarFieldValueGenerator().Boolean({ modelName: "ArticleRevision", fieldName: "hideAuthor", isId: false, isUnique: false, seq })
    };
}
function defineArticleRevisionFactoryInternal({ defaultData: defaultDataResolver, traits: traitsDefs = {} }) {
    const getFactoryWithTraits = (traitKeys = []) => {
        const seqKey = {};
        const getSeq = () => getSequenceCounter(seqKey);
        const screen = createScreener("ArticleRevision", modelFieldDefinitions);
        const build = (...args_1) => __awaiter(this, [...args_1], void 0, function* (inputData = {}) {
            const seq = getSeq();
            const requiredScalarData = autoGenerateArticleRevisionScalarsOrEnums({ seq });
            const resolveValue = normalizeResolver(defaultDataResolver !== null && defaultDataResolver !== void 0 ? defaultDataResolver : {});
            const defaultData = yield traitKeys.reduce((queue, traitKey) => __awaiter(this, void 0, void 0, function* () {
                var _a, _b;
                const acc = yield queue;
                const resolveTraitValue = normalizeResolver((_b = (_a = traitsDefs[traitKey]) === null || _a === void 0 ? void 0 : _a.data) !== null && _b !== void 0 ? _b : {});
                const traitData = yield resolveTraitValue({ seq });
                return Object.assign(Object.assign({}, acc), traitData);
            }), resolveValue({ seq }));
            const defaultAssociations = {
                image: isArticleRevisionimageFactory(defaultData.image) ? {
                    create: yield defaultData.image.build()
                } : defaultData.image,
                socialMediaImage: isArticleRevisionsocialMediaImageFactory(defaultData.socialMediaImage) ? {
                    create: yield defaultData.socialMediaImage.build()
                } : defaultData.socialMediaImage
            };
            const data = Object.assign(Object.assign(Object.assign(Object.assign({}, requiredScalarData), defaultData), defaultAssociations), inputData);
            return data;
        });
        const buildList = (inputData) => Promise.all(normalizeList(inputData).map(data => build(data)));
        const pickForConnect = (inputData) => ({
            id: inputData.id
        });
        const create = (...args_2) => __awaiter(this, [...args_2], void 0, function* (inputData = {}) {
            const data = yield build(inputData).then(screen);
            return yield getClient().articleRevision.create({ data });
        });
        const createList = (inputData) => Promise.all(normalizeList(inputData).map(data => create(data)));
        const createForConnect = (inputData = {}) => create(inputData).then(pickForConnect);
        return {
            _factoryFor: "ArticleRevision",
            build,
            buildList,
            buildCreateInput: build,
            pickForConnect,
            create,
            createList,
            createForConnect,
        };
    };
    const factory = getFactoryWithTraits();
    const useTraits = (name, ...names) => {
        return getFactoryWithTraits([name, ...names]);
    };
    return Object.assign(Object.assign({}, factory), { use: useTraits });
}
/**
 * Define factory for {@link ArticleRevision} model.
 *
 * @param options
 * @returns factory {@link ArticleRevisionFactoryInterface}
 */
export function defineArticleRevisionFactory(options) {
    return defineArticleRevisionFactoryInternal(options !== null && options !== void 0 ? options : {});
}
function isArticleRevisionAuthorrevisionFactory(x) {
    return (x === null || x === void 0 ? void 0 : x._factoryFor) === "ArticleRevision";
}
function isArticleRevisionAuthorauthorFactory(x) {
    return (x === null || x === void 0 ? void 0 : x._factoryFor) === "Author";
}
function autoGenerateArticleRevisionAuthorScalarsOrEnums({ seq }) {
    return {};
}
function defineArticleRevisionAuthorFactoryInternal({ defaultData: defaultDataResolver, traits: traitsDefs = {} }) {
    const getFactoryWithTraits = (traitKeys = []) => {
        const seqKey = {};
        const getSeq = () => getSequenceCounter(seqKey);
        const screen = createScreener("ArticleRevisionAuthor", modelFieldDefinitions);
        const build = (...args_1) => __awaiter(this, [...args_1], void 0, function* (inputData = {}) {
            const seq = getSeq();
            const requiredScalarData = autoGenerateArticleRevisionAuthorScalarsOrEnums({ seq });
            const resolveValue = normalizeResolver(defaultDataResolver !== null && defaultDataResolver !== void 0 ? defaultDataResolver : {});
            const defaultData = yield traitKeys.reduce((queue, traitKey) => __awaiter(this, void 0, void 0, function* () {
                var _a, _b;
                const acc = yield queue;
                const resolveTraitValue = normalizeResolver((_b = (_a = traitsDefs[traitKey]) === null || _a === void 0 ? void 0 : _a.data) !== null && _b !== void 0 ? _b : {});
                const traitData = yield resolveTraitValue({ seq });
                return Object.assign(Object.assign({}, acc), traitData);
            }), resolveValue({ seq }));
            const defaultAssociations = {
                revision: isArticleRevisionAuthorrevisionFactory(defaultData.revision) ? {
                    create: yield defaultData.revision.build()
                } : defaultData.revision,
                author: isArticleRevisionAuthorauthorFactory(defaultData.author) ? {
                    create: yield defaultData.author.build()
                } : defaultData.author
            };
            const data = Object.assign(Object.assign(Object.assign(Object.assign({}, requiredScalarData), defaultData), defaultAssociations), inputData);
            return data;
        });
        const buildList = (inputData) => Promise.all(normalizeList(inputData).map(data => build(data)));
        const pickForConnect = (inputData) => ({
            revisionId: inputData.revisionId,
            authorId: inputData.authorId
        });
        const create = (...args_2) => __awaiter(this, [...args_2], void 0, function* (inputData = {}) {
            const data = yield build(inputData).then(screen);
            return yield getClient().articleRevisionAuthor.create({ data });
        });
        const createList = (inputData) => Promise.all(normalizeList(inputData).map(data => create(data)));
        const createForConnect = (inputData = {}) => create(inputData).then(pickForConnect);
        return {
            _factoryFor: "ArticleRevisionAuthor",
            build,
            buildList,
            buildCreateInput: build,
            pickForConnect,
            create,
            createList,
            createForConnect,
        };
    };
    const factory = getFactoryWithTraits();
    const useTraits = (name, ...names) => {
        return getFactoryWithTraits([name, ...names]);
    };
    return Object.assign(Object.assign({}, factory), { use: useTraits });
}
/**
 * Define factory for {@link ArticleRevisionAuthor} model.
 *
 * @param options
 * @returns factory {@link ArticleRevisionAuthorFactoryInterface}
 */
export function defineArticleRevisionAuthorFactory(options) {
    return defineArticleRevisionAuthorFactoryInternal(options);
}
function isArticleRevisionSocialMediaAuthorrevisionFactory(x) {
    return (x === null || x === void 0 ? void 0 : x._factoryFor) === "ArticleRevision";
}
function isArticleRevisionSocialMediaAuthorauthorFactory(x) {
    return (x === null || x === void 0 ? void 0 : x._factoryFor) === "Author";
}
function autoGenerateArticleRevisionSocialMediaAuthorScalarsOrEnums({ seq }) {
    return {};
}
function defineArticleRevisionSocialMediaAuthorFactoryInternal({ defaultData: defaultDataResolver, traits: traitsDefs = {} }) {
    const getFactoryWithTraits = (traitKeys = []) => {
        const seqKey = {};
        const getSeq = () => getSequenceCounter(seqKey);
        const screen = createScreener("ArticleRevisionSocialMediaAuthor", modelFieldDefinitions);
        const build = (...args_1) => __awaiter(this, [...args_1], void 0, function* (inputData = {}) {
            const seq = getSeq();
            const requiredScalarData = autoGenerateArticleRevisionSocialMediaAuthorScalarsOrEnums({ seq });
            const resolveValue = normalizeResolver(defaultDataResolver !== null && defaultDataResolver !== void 0 ? defaultDataResolver : {});
            const defaultData = yield traitKeys.reduce((queue, traitKey) => __awaiter(this, void 0, void 0, function* () {
                var _a, _b;
                const acc = yield queue;
                const resolveTraitValue = normalizeResolver((_b = (_a = traitsDefs[traitKey]) === null || _a === void 0 ? void 0 : _a.data) !== null && _b !== void 0 ? _b : {});
                const traitData = yield resolveTraitValue({ seq });
                return Object.assign(Object.assign({}, acc), traitData);
            }), resolveValue({ seq }));
            const defaultAssociations = {
                revision: isArticleRevisionSocialMediaAuthorrevisionFactory(defaultData.revision) ? {
                    create: yield defaultData.revision.build()
                } : defaultData.revision,
                author: isArticleRevisionSocialMediaAuthorauthorFactory(defaultData.author) ? {
                    create: yield defaultData.author.build()
                } : defaultData.author
            };
            const data = Object.assign(Object.assign(Object.assign(Object.assign({}, requiredScalarData), defaultData), defaultAssociations), inputData);
            return data;
        });
        const buildList = (inputData) => Promise.all(normalizeList(inputData).map(data => build(data)));
        const pickForConnect = (inputData) => ({
            revisionId: inputData.revisionId,
            authorId: inputData.authorId
        });
        const create = (...args_2) => __awaiter(this, [...args_2], void 0, function* (inputData = {}) {
            const data = yield build(inputData).then(screen);
            return yield getClient().articleRevisionSocialMediaAuthor.create({ data });
        });
        const createList = (inputData) => Promise.all(normalizeList(inputData).map(data => create(data)));
        const createForConnect = (inputData = {}) => create(inputData).then(pickForConnect);
        return {
            _factoryFor: "ArticleRevisionSocialMediaAuthor",
            build,
            buildList,
            buildCreateInput: build,
            pickForConnect,
            create,
            createList,
            createForConnect,
        };
    };
    const factory = getFactoryWithTraits();
    const useTraits = (name, ...names) => {
        return getFactoryWithTraits([name, ...names]);
    };
    return Object.assign(Object.assign({}, factory), { use: useTraits });
}
/**
 * Define factory for {@link ArticleRevisionSocialMediaAuthor} model.
 *
 * @param options
 * @returns factory {@link ArticleRevisionSocialMediaAuthorFactoryInterface}
 */
export function defineArticleRevisionSocialMediaAuthorFactory(options) {
    return defineArticleRevisionSocialMediaAuthorFactoryInternal(options);
}
function isArticlepublishedFactory(x) {
    return (x === null || x === void 0 ? void 0 : x._factoryFor) === "ArticleRevision";
}
function isArticlependingFactory(x) {
    return (x === null || x === void 0 ? void 0 : x._factoryFor) === "ArticleRevision";
}
function isArticledraftFactory(x) {
    return (x === null || x === void 0 ? void 0 : x._factoryFor) === "ArticleRevision";
}
function autoGenerateArticleScalarsOrEnums({ seq }) {
    return {
        shared: getScalarFieldValueGenerator().Boolean({ modelName: "Article", fieldName: "shared", isId: false, isUnique: false, seq })
    };
}
function defineArticleFactoryInternal({ defaultData: defaultDataResolver, traits: traitsDefs = {} }) {
    const getFactoryWithTraits = (traitKeys = []) => {
        const seqKey = {};
        const getSeq = () => getSequenceCounter(seqKey);
        const screen = createScreener("Article", modelFieldDefinitions);
        const build = (...args_1) => __awaiter(this, [...args_1], void 0, function* (inputData = {}) {
            const seq = getSeq();
            const requiredScalarData = autoGenerateArticleScalarsOrEnums({ seq });
            const resolveValue = normalizeResolver(defaultDataResolver !== null && defaultDataResolver !== void 0 ? defaultDataResolver : {});
            const defaultData = yield traitKeys.reduce((queue, traitKey) => __awaiter(this, void 0, void 0, function* () {
                var _a, _b;
                const acc = yield queue;
                const resolveTraitValue = normalizeResolver((_b = (_a = traitsDefs[traitKey]) === null || _a === void 0 ? void 0 : _a.data) !== null && _b !== void 0 ? _b : {});
                const traitData = yield resolveTraitValue({ seq });
                return Object.assign(Object.assign({}, acc), traitData);
            }), resolveValue({ seq }));
            const defaultAssociations = {
                published: isArticlepublishedFactory(defaultData.published) ? {
                    create: yield defaultData.published.build()
                } : defaultData.published,
                pending: isArticlependingFactory(defaultData.pending) ? {
                    create: yield defaultData.pending.build()
                } : defaultData.pending,
                draft: isArticledraftFactory(defaultData.draft) ? {
                    create: yield defaultData.draft.build()
                } : defaultData.draft
            };
            const data = Object.assign(Object.assign(Object.assign(Object.assign({}, requiredScalarData), defaultData), defaultAssociations), inputData);
            return data;
        });
        const buildList = (inputData) => Promise.all(normalizeList(inputData).map(data => build(data)));
        const pickForConnect = (inputData) => ({
            id: inputData.id
        });
        const create = (...args_2) => __awaiter(this, [...args_2], void 0, function* (inputData = {}) {
            const data = yield build(inputData).then(screen);
            return yield getClient().article.create({ data });
        });
        const createList = (inputData) => Promise.all(normalizeList(inputData).map(data => create(data)));
        const createForConnect = (inputData = {}) => create(inputData).then(pickForConnect);
        return {
            _factoryFor: "Article",
            build,
            buildList,
            buildCreateInput: build,
            pickForConnect,
            create,
            createList,
            createForConnect,
        };
    };
    const factory = getFactoryWithTraits();
    const useTraits = (name, ...names) => {
        return getFactoryWithTraits([name, ...names]);
    };
    return Object.assign(Object.assign({}, factory), { use: useTraits });
}
/**
 * Define factory for {@link Article} model.
 *
 * @param options
 * @returns factory {@link ArticleFactoryInterface}
 */
export function defineArticleFactory(options) {
    return defineArticleFactoryInternal(options !== null && options !== void 0 ? options : {});
}
function isTaggedArticlesarticleFactory(x) {
    return (x === null || x === void 0 ? void 0 : x._factoryFor) === "Article";
}
function isTaggedArticlestagFactory(x) {
    return (x === null || x === void 0 ? void 0 : x._factoryFor) === "Tag";
}
function autoGenerateTaggedArticlesScalarsOrEnums({ seq }) {
    return {};
}
function defineTaggedArticlesFactoryInternal({ defaultData: defaultDataResolver, traits: traitsDefs = {} }) {
    const getFactoryWithTraits = (traitKeys = []) => {
        const seqKey = {};
        const getSeq = () => getSequenceCounter(seqKey);
        const screen = createScreener("TaggedArticles", modelFieldDefinitions);
        const build = (...args_1) => __awaiter(this, [...args_1], void 0, function* (inputData = {}) {
            const seq = getSeq();
            const requiredScalarData = autoGenerateTaggedArticlesScalarsOrEnums({ seq });
            const resolveValue = normalizeResolver(defaultDataResolver !== null && defaultDataResolver !== void 0 ? defaultDataResolver : {});
            const defaultData = yield traitKeys.reduce((queue, traitKey) => __awaiter(this, void 0, void 0, function* () {
                var _a, _b;
                const acc = yield queue;
                const resolveTraitValue = normalizeResolver((_b = (_a = traitsDefs[traitKey]) === null || _a === void 0 ? void 0 : _a.data) !== null && _b !== void 0 ? _b : {});
                const traitData = yield resolveTraitValue({ seq });
                return Object.assign(Object.assign({}, acc), traitData);
            }), resolveValue({ seq }));
            const defaultAssociations = {
                article: isTaggedArticlesarticleFactory(defaultData.article) ? {
                    create: yield defaultData.article.build()
                } : defaultData.article,
                tag: isTaggedArticlestagFactory(defaultData.tag) ? {
                    create: yield defaultData.tag.build()
                } : defaultData.tag
            };
            const data = Object.assign(Object.assign(Object.assign(Object.assign({}, requiredScalarData), defaultData), defaultAssociations), inputData);
            return data;
        });
        const buildList = (inputData) => Promise.all(normalizeList(inputData).map(data => build(data)));
        const pickForConnect = (inputData) => ({
            articleId: inputData.articleId,
            tagId: inputData.tagId
        });
        const create = (...args_2) => __awaiter(this, [...args_2], void 0, function* (inputData = {}) {
            const data = yield build(inputData).then(screen);
            return yield getClient().taggedArticles.create({ data });
        });
        const createList = (inputData) => Promise.all(normalizeList(inputData).map(data => create(data)));
        const createForConnect = (inputData = {}) => create(inputData).then(pickForConnect);
        return {
            _factoryFor: "TaggedArticles",
            build,
            buildList,
            buildCreateInput: build,
            pickForConnect,
            create,
            createList,
            createForConnect,
        };
    };
    const factory = getFactoryWithTraits();
    const useTraits = (name, ...names) => {
        return getFactoryWithTraits([name, ...names]);
    };
    return Object.assign(Object.assign({}, factory), { use: useTraits });
}
/**
 * Define factory for {@link TaggedArticles} model.
 *
 * @param options
 * @returns factory {@link TaggedArticlesFactoryInterface}
 */
export function defineTaggedArticlesFactory(options) {
    return defineTaggedArticlesFactoryInternal(options);
}
function isAuthorsLinksAuthorFactory(x) {
    return (x === null || x === void 0 ? void 0 : x._factoryFor) === "Author";
}
function autoGenerateAuthorsLinksScalarsOrEnums({ seq }) {
    return {
        title: getScalarFieldValueGenerator().String({ modelName: "AuthorsLinks", fieldName: "title", isId: false, isUnique: false, seq }),
        url: getScalarFieldValueGenerator().String({ modelName: "AuthorsLinks", fieldName: "url", isId: false, isUnique: false, seq })
    };
}
function defineAuthorsLinksFactoryInternal({ defaultData: defaultDataResolver, traits: traitsDefs = {} }) {
    const getFactoryWithTraits = (traitKeys = []) => {
        const seqKey = {};
        const getSeq = () => getSequenceCounter(seqKey);
        const screen = createScreener("AuthorsLinks", modelFieldDefinitions);
        const build = (...args_1) => __awaiter(this, [...args_1], void 0, function* (inputData = {}) {
            const seq = getSeq();
            const requiredScalarData = autoGenerateAuthorsLinksScalarsOrEnums({ seq });
            const resolveValue = normalizeResolver(defaultDataResolver !== null && defaultDataResolver !== void 0 ? defaultDataResolver : {});
            const defaultData = yield traitKeys.reduce((queue, traitKey) => __awaiter(this, void 0, void 0, function* () {
                var _a, _b;
                const acc = yield queue;
                const resolveTraitValue = normalizeResolver((_b = (_a = traitsDefs[traitKey]) === null || _a === void 0 ? void 0 : _a.data) !== null && _b !== void 0 ? _b : {});
                const traitData = yield resolveTraitValue({ seq });
                return Object.assign(Object.assign({}, acc), traitData);
            }), resolveValue({ seq }));
            const defaultAssociations = {
                Author: isAuthorsLinksAuthorFactory(defaultData.Author) ? {
                    create: yield defaultData.Author.build()
                } : defaultData.Author
            };
            const data = Object.assign(Object.assign(Object.assign(Object.assign({}, requiredScalarData), defaultData), defaultAssociations), inputData);
            return data;
        });
        const buildList = (inputData) => Promise.all(normalizeList(inputData).map(data => build(data)));
        const pickForConnect = (inputData) => ({
            id: inputData.id
        });
        const create = (...args_2) => __awaiter(this, [...args_2], void 0, function* (inputData = {}) {
            const data = yield build(inputData).then(screen);
            return yield getClient().authorsLinks.create({ data });
        });
        const createList = (inputData) => Promise.all(normalizeList(inputData).map(data => create(data)));
        const createForConnect = (inputData = {}) => create(inputData).then(pickForConnect);
        return {
            _factoryFor: "AuthorsLinks",
            build,
            buildList,
            buildCreateInput: build,
            pickForConnect,
            create,
            createList,
            createForConnect,
        };
    };
    const factory = getFactoryWithTraits();
    const useTraits = (name, ...names) => {
        return getFactoryWithTraits([name, ...names]);
    };
    return Object.assign(Object.assign({}, factory), { use: useTraits });
}
/**
 * Define factory for {@link AuthorsLinks} model.
 *
 * @param options
 * @returns factory {@link AuthorsLinksFactoryInterface}
 */
export function defineAuthorsLinksFactory(options) {
    return defineAuthorsLinksFactoryInternal(options !== null && options !== void 0 ? options : {});
}
function isAuthorimageFactory(x) {
    return (x === null || x === void 0 ? void 0 : x._factoryFor) === "Image";
}
function autoGenerateAuthorScalarsOrEnums({ seq }) {
    return {
        name: getScalarFieldValueGenerator().String({ modelName: "Author", fieldName: "name", isId: false, isUnique: false, seq }),
        slug: getScalarFieldValueGenerator().String({ modelName: "Author", fieldName: "slug", isId: false, isUnique: true, seq })
    };
}
function defineAuthorFactoryInternal({ defaultData: defaultDataResolver, traits: traitsDefs = {} }) {
    const getFactoryWithTraits = (traitKeys = []) => {
        const seqKey = {};
        const getSeq = () => getSequenceCounter(seqKey);
        const screen = createScreener("Author", modelFieldDefinitions);
        const build = (...args_1) => __awaiter(this, [...args_1], void 0, function* (inputData = {}) {
            const seq = getSeq();
            const requiredScalarData = autoGenerateAuthorScalarsOrEnums({ seq });
            const resolveValue = normalizeResolver(defaultDataResolver !== null && defaultDataResolver !== void 0 ? defaultDataResolver : {});
            const defaultData = yield traitKeys.reduce((queue, traitKey) => __awaiter(this, void 0, void 0, function* () {
                var _a, _b;
                const acc = yield queue;
                const resolveTraitValue = normalizeResolver((_b = (_a = traitsDefs[traitKey]) === null || _a === void 0 ? void 0 : _a.data) !== null && _b !== void 0 ? _b : {});
                const traitData = yield resolveTraitValue({ seq });
                return Object.assign(Object.assign({}, acc), traitData);
            }), resolveValue({ seq }));
            const defaultAssociations = {
                image: isAuthorimageFactory(defaultData.image) ? {
                    create: yield defaultData.image.build()
                } : defaultData.image
            };
            const data = Object.assign(Object.assign(Object.assign(Object.assign({}, requiredScalarData), defaultData), defaultAssociations), inputData);
            return data;
        });
        const buildList = (inputData) => Promise.all(normalizeList(inputData).map(data => build(data)));
        const pickForConnect = (inputData) => ({
            id: inputData.id
        });
        const create = (...args_2) => __awaiter(this, [...args_2], void 0, function* (inputData = {}) {
            const data = yield build(inputData).then(screen);
            return yield getClient().author.create({ data });
        });
        const createList = (inputData) => Promise.all(normalizeList(inputData).map(data => create(data)));
        const createForConnect = (inputData = {}) => create(inputData).then(pickForConnect);
        return {
            _factoryFor: "Author",
            build,
            buildList,
            buildCreateInput: build,
            pickForConnect,
            create,
            createList,
            createForConnect,
        };
    };
    const factory = getFactoryWithTraits();
    const useTraits = (name, ...names) => {
        return getFactoryWithTraits([name, ...names]);
    };
    return Object.assign(Object.assign({}, factory), { use: useTraits });
}
/**
 * Define factory for {@link Author} model.
 *
 * @param options
 * @returns factory {@link AuthorFactoryInterface}
 */
export function defineAuthorFactory(options) {
    return defineAuthorFactoryInternal(options !== null && options !== void 0 ? options : {});
}
function isTaggedAuthorsauthorFactory(x) {
    return (x === null || x === void 0 ? void 0 : x._factoryFor) === "Author";
}
function isTaggedAuthorstagFactory(x) {
    return (x === null || x === void 0 ? void 0 : x._factoryFor) === "Tag";
}
function autoGenerateTaggedAuthorsScalarsOrEnums({ seq }) {
    return {};
}
function defineTaggedAuthorsFactoryInternal({ defaultData: defaultDataResolver, traits: traitsDefs = {} }) {
    const getFactoryWithTraits = (traitKeys = []) => {
        const seqKey = {};
        const getSeq = () => getSequenceCounter(seqKey);
        const screen = createScreener("TaggedAuthors", modelFieldDefinitions);
        const build = (...args_1) => __awaiter(this, [...args_1], void 0, function* (inputData = {}) {
            const seq = getSeq();
            const requiredScalarData = autoGenerateTaggedAuthorsScalarsOrEnums({ seq });
            const resolveValue = normalizeResolver(defaultDataResolver !== null && defaultDataResolver !== void 0 ? defaultDataResolver : {});
            const defaultData = yield traitKeys.reduce((queue, traitKey) => __awaiter(this, void 0, void 0, function* () {
                var _a, _b;
                const acc = yield queue;
                const resolveTraitValue = normalizeResolver((_b = (_a = traitsDefs[traitKey]) === null || _a === void 0 ? void 0 : _a.data) !== null && _b !== void 0 ? _b : {});
                const traitData = yield resolveTraitValue({ seq });
                return Object.assign(Object.assign({}, acc), traitData);
            }), resolveValue({ seq }));
            const defaultAssociations = {
                author: isTaggedAuthorsauthorFactory(defaultData.author) ? {
                    create: yield defaultData.author.build()
                } : defaultData.author,
                tag: isTaggedAuthorstagFactory(defaultData.tag) ? {
                    create: yield defaultData.tag.build()
                } : defaultData.tag
            };
            const data = Object.assign(Object.assign(Object.assign(Object.assign({}, requiredScalarData), defaultData), defaultAssociations), inputData);
            return data;
        });
        const buildList = (inputData) => Promise.all(normalizeList(inputData).map(data => build(data)));
        const pickForConnect = (inputData) => ({
            authorId: inputData.authorId,
            tagId: inputData.tagId
        });
        const create = (...args_2) => __awaiter(this, [...args_2], void 0, function* (inputData = {}) {
            const data = yield build(inputData).then(screen);
            return yield getClient().taggedAuthors.create({ data });
        });
        const createList = (inputData) => Promise.all(normalizeList(inputData).map(data => create(data)));
        const createForConnect = (inputData = {}) => create(inputData).then(pickForConnect);
        return {
            _factoryFor: "TaggedAuthors",
            build,
            buildList,
            buildCreateInput: build,
            pickForConnect,
            create,
            createList,
            createForConnect,
        };
    };
    const factory = getFactoryWithTraits();
    const useTraits = (name, ...names) => {
        return getFactoryWithTraits([name, ...names]);
    };
    return Object.assign(Object.assign({}, factory), { use: useTraits });
}
/**
 * Define factory for {@link TaggedAuthors} model.
 *
 * @param options
 * @returns factory {@link TaggedAuthorsFactoryInterface}
 */
export function defineTaggedAuthorsFactory(options) {
    return defineTaggedAuthorsFactoryInternal(options);
}
function isFocalPointimageFactory(x) {
    return (x === null || x === void 0 ? void 0 : x._factoryFor) === "Image";
}
function autoGenerateFocalPointScalarsOrEnums({ seq }) {
    return {};
}
function defineFocalPointFactoryInternal({ defaultData: defaultDataResolver, traits: traitsDefs = {} }) {
    const getFactoryWithTraits = (traitKeys = []) => {
        const seqKey = {};
        const getSeq = () => getSequenceCounter(seqKey);
        const screen = createScreener("FocalPoint", modelFieldDefinitions);
        const build = (...args_1) => __awaiter(this, [...args_1], void 0, function* (inputData = {}) {
            const seq = getSeq();
            const requiredScalarData = autoGenerateFocalPointScalarsOrEnums({ seq });
            const resolveValue = normalizeResolver(defaultDataResolver !== null && defaultDataResolver !== void 0 ? defaultDataResolver : {});
            const defaultData = yield traitKeys.reduce((queue, traitKey) => __awaiter(this, void 0, void 0, function* () {
                var _a, _b;
                const acc = yield queue;
                const resolveTraitValue = normalizeResolver((_b = (_a = traitsDefs[traitKey]) === null || _a === void 0 ? void 0 : _a.data) !== null && _b !== void 0 ? _b : {});
                const traitData = yield resolveTraitValue({ seq });
                return Object.assign(Object.assign({}, acc), traitData);
            }), resolveValue({ seq }));
            const defaultAssociations = {
                image: isFocalPointimageFactory(defaultData.image) ? {
                    create: yield defaultData.image.build()
                } : defaultData.image
            };
            const data = Object.assign(Object.assign(Object.assign(Object.assign({}, requiredScalarData), defaultData), defaultAssociations), inputData);
            return data;
        });
        const buildList = (inputData) => Promise.all(normalizeList(inputData).map(data => build(data)));
        const pickForConnect = (inputData) => ({
            imageId: inputData.imageId
        });
        const create = (...args_2) => __awaiter(this, [...args_2], void 0, function* (inputData = {}) {
            const data = yield build(inputData).then(screen);
            return yield getClient().focalPoint.create({ data });
        });
        const createList = (inputData) => Promise.all(normalizeList(inputData).map(data => create(data)));
        const createForConnect = (inputData = {}) => create(inputData).then(pickForConnect);
        return {
            _factoryFor: "FocalPoint",
            build,
            buildList,
            buildCreateInput: build,
            pickForConnect,
            create,
            createList,
            createForConnect,
        };
    };
    const factory = getFactoryWithTraits();
    const useTraits = (name, ...names) => {
        return getFactoryWithTraits([name, ...names]);
    };
    return Object.assign(Object.assign({}, factory), { use: useTraits });
}
/**
 * Define factory for {@link FocalPoint} model.
 *
 * @param options
 * @returns factory {@link FocalPointFactoryInterface}
 */
export function defineFocalPointFactory(options) {
    return defineFocalPointFactoryInternal(options !== null && options !== void 0 ? options : {});
}
function isImagefocalPointFactory(x) {
    return (x === null || x === void 0 ? void 0 : x._factoryFor) === "FocalPoint";
}
function autoGenerateImageScalarsOrEnums({ seq }) {
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
function defineImageFactoryInternal({ defaultData: defaultDataResolver, traits: traitsDefs = {} }) {
    const getFactoryWithTraits = (traitKeys = []) => {
        const seqKey = {};
        const getSeq = () => getSequenceCounter(seqKey);
        const screen = createScreener("Image", modelFieldDefinitions);
        const build = (...args_1) => __awaiter(this, [...args_1], void 0, function* (inputData = {}) {
            const seq = getSeq();
            const requiredScalarData = autoGenerateImageScalarsOrEnums({ seq });
            const resolveValue = normalizeResolver(defaultDataResolver !== null && defaultDataResolver !== void 0 ? defaultDataResolver : {});
            const defaultData = yield traitKeys.reduce((queue, traitKey) => __awaiter(this, void 0, void 0, function* () {
                var _a, _b;
                const acc = yield queue;
                const resolveTraitValue = normalizeResolver((_b = (_a = traitsDefs[traitKey]) === null || _a === void 0 ? void 0 : _a.data) !== null && _b !== void 0 ? _b : {});
                const traitData = yield resolveTraitValue({ seq });
                return Object.assign(Object.assign({}, acc), traitData);
            }), resolveValue({ seq }));
            const defaultAssociations = {
                focalPoint: isImagefocalPointFactory(defaultData.focalPoint) ? {
                    create: yield defaultData.focalPoint.build()
                } : defaultData.focalPoint
            };
            const data = Object.assign(Object.assign(Object.assign(Object.assign({}, requiredScalarData), defaultData), defaultAssociations), inputData);
            return data;
        });
        const buildList = (inputData) => Promise.all(normalizeList(inputData).map(data => build(data)));
        const pickForConnect = (inputData) => ({
            id: inputData.id
        });
        const create = (...args_2) => __awaiter(this, [...args_2], void 0, function* (inputData = {}) {
            const data = yield build(inputData).then(screen);
            return yield getClient().image.create({ data });
        });
        const createList = (inputData) => Promise.all(normalizeList(inputData).map(data => create(data)));
        const createForConnect = (inputData = {}) => create(inputData).then(pickForConnect);
        return {
            _factoryFor: "Image",
            build,
            buildList,
            buildCreateInput: build,
            pickForConnect,
            create,
            createList,
            createForConnect,
        };
    };
    const factory = getFactoryWithTraits();
    const useTraits = (name, ...names) => {
        return getFactoryWithTraits([name, ...names]);
    };
    return Object.assign(Object.assign({}, factory), { use: useTraits });
}
/**
 * Define factory for {@link Image} model.
 *
 * @param options
 * @returns factory {@link ImageFactoryInterface}
 */
export function defineImageFactory(options) {
    return defineImageFactoryInternal(options !== null && options !== void 0 ? options : {});
}
function isCommentsRevisionsCommentFactory(x) {
    return (x === null || x === void 0 ? void 0 : x._factoryFor) === "Comment";
}
function autoGenerateCommentsRevisionsScalarsOrEnums({ seq }) {
    return {};
}
function defineCommentsRevisionsFactoryInternal({ defaultData: defaultDataResolver, traits: traitsDefs = {} }) {
    const getFactoryWithTraits = (traitKeys = []) => {
        const seqKey = {};
        const getSeq = () => getSequenceCounter(seqKey);
        const screen = createScreener("CommentsRevisions", modelFieldDefinitions);
        const build = (...args_1) => __awaiter(this, [...args_1], void 0, function* (inputData = {}) {
            const seq = getSeq();
            const requiredScalarData = autoGenerateCommentsRevisionsScalarsOrEnums({ seq });
            const resolveValue = normalizeResolver(defaultDataResolver !== null && defaultDataResolver !== void 0 ? defaultDataResolver : {});
            const defaultData = yield traitKeys.reduce((queue, traitKey) => __awaiter(this, void 0, void 0, function* () {
                var _a, _b;
                const acc = yield queue;
                const resolveTraitValue = normalizeResolver((_b = (_a = traitsDefs[traitKey]) === null || _a === void 0 ? void 0 : _a.data) !== null && _b !== void 0 ? _b : {});
                const traitData = yield resolveTraitValue({ seq });
                return Object.assign(Object.assign({}, acc), traitData);
            }), resolveValue({ seq }));
            const defaultAssociations = {
                Comment: isCommentsRevisionsCommentFactory(defaultData.Comment) ? {
                    create: yield defaultData.Comment.build()
                } : defaultData.Comment
            };
            const data = Object.assign(Object.assign(Object.assign(Object.assign({}, requiredScalarData), defaultData), defaultAssociations), inputData);
            return data;
        });
        const buildList = (inputData) => Promise.all(normalizeList(inputData).map(data => build(data)));
        const pickForConnect = (inputData) => ({
            id: inputData.id
        });
        const create = (...args_2) => __awaiter(this, [...args_2], void 0, function* (inputData = {}) {
            const data = yield build(inputData).then(screen);
            return yield getClient().commentsRevisions.create({ data });
        });
        const createList = (inputData) => Promise.all(normalizeList(inputData).map(data => create(data)));
        const createForConnect = (inputData = {}) => create(inputData).then(pickForConnect);
        return {
            _factoryFor: "CommentsRevisions",
            build,
            buildList,
            buildCreateInput: build,
            pickForConnect,
            create,
            createList,
            createForConnect,
        };
    };
    const factory = getFactoryWithTraits();
    const useTraits = (name, ...names) => {
        return getFactoryWithTraits([name, ...names]);
    };
    return Object.assign(Object.assign({}, factory), { use: useTraits });
}
/**
 * Define factory for {@link CommentsRevisions} model.
 *
 * @param options
 * @returns factory {@link CommentsRevisionsFactoryInterface}
 */
export function defineCommentsRevisionsFactory(options) {
    return defineCommentsRevisionsFactoryInternal(options !== null && options !== void 0 ? options : {});
}
function isCommentpeerFactory(x) {
    return (x === null || x === void 0 ? void 0 : x._factoryFor) === "Peer";
}
function isCommentguestUserImageFactory(x) {
    return (x === null || x === void 0 ? void 0 : x._factoryFor) === "Image";
}
function isCommentuserFactory(x) {
    return (x === null || x === void 0 ? void 0 : x._factoryFor) === "User";
}
function autoGenerateCommentScalarsOrEnums({ seq }) {
    return {
        itemID: getScalarFieldValueGenerator().String({ modelName: "Comment", fieldName: "itemID", isId: false, isUnique: false, seq }),
        itemType: "peerArticle",
        state: "approved",
        authorType: "team"
    };
}
function defineCommentFactoryInternal({ defaultData: defaultDataResolver, traits: traitsDefs = {} }) {
    const getFactoryWithTraits = (traitKeys = []) => {
        const seqKey = {};
        const getSeq = () => getSequenceCounter(seqKey);
        const screen = createScreener("Comment", modelFieldDefinitions);
        const build = (...args_1) => __awaiter(this, [...args_1], void 0, function* (inputData = {}) {
            const seq = getSeq();
            const requiredScalarData = autoGenerateCommentScalarsOrEnums({ seq });
            const resolveValue = normalizeResolver(defaultDataResolver !== null && defaultDataResolver !== void 0 ? defaultDataResolver : {});
            const defaultData = yield traitKeys.reduce((queue, traitKey) => __awaiter(this, void 0, void 0, function* () {
                var _a, _b;
                const acc = yield queue;
                const resolveTraitValue = normalizeResolver((_b = (_a = traitsDefs[traitKey]) === null || _a === void 0 ? void 0 : _a.data) !== null && _b !== void 0 ? _b : {});
                const traitData = yield resolveTraitValue({ seq });
                return Object.assign(Object.assign({}, acc), traitData);
            }), resolveValue({ seq }));
            const defaultAssociations = {
                peer: isCommentpeerFactory(defaultData.peer) ? {
                    create: yield defaultData.peer.build()
                } : defaultData.peer,
                guestUserImage: isCommentguestUserImageFactory(defaultData.guestUserImage) ? {
                    create: yield defaultData.guestUserImage.build()
                } : defaultData.guestUserImage,
                user: isCommentuserFactory(defaultData.user) ? {
                    create: yield defaultData.user.build()
                } : defaultData.user
            };
            const data = Object.assign(Object.assign(Object.assign(Object.assign({}, requiredScalarData), defaultData), defaultAssociations), inputData);
            return data;
        });
        const buildList = (inputData) => Promise.all(normalizeList(inputData).map(data => build(data)));
        const pickForConnect = (inputData) => ({
            id: inputData.id
        });
        const create = (...args_2) => __awaiter(this, [...args_2], void 0, function* (inputData = {}) {
            const data = yield build(inputData).then(screen);
            return yield getClient().comment.create({ data });
        });
        const createList = (inputData) => Promise.all(normalizeList(inputData).map(data => create(data)));
        const createForConnect = (inputData = {}) => create(inputData).then(pickForConnect);
        return {
            _factoryFor: "Comment",
            build,
            buildList,
            buildCreateInput: build,
            pickForConnect,
            create,
            createList,
            createForConnect,
        };
    };
    const factory = getFactoryWithTraits();
    const useTraits = (name, ...names) => {
        return getFactoryWithTraits([name, ...names]);
    };
    return Object.assign(Object.assign({}, factory), { use: useTraits });
}
/**
 * Define factory for {@link Comment} model.
 *
 * @param options
 * @returns factory {@link CommentFactoryInterface}
 */
export function defineCommentFactory(options) {
    return defineCommentFactoryInternal(options !== null && options !== void 0 ? options : {});
}
function isTaggedCommentscommentFactory(x) {
    return (x === null || x === void 0 ? void 0 : x._factoryFor) === "Comment";
}
function isTaggedCommentstagFactory(x) {
    return (x === null || x === void 0 ? void 0 : x._factoryFor) === "Tag";
}
function autoGenerateTaggedCommentsScalarsOrEnums({ seq }) {
    return {};
}
function defineTaggedCommentsFactoryInternal({ defaultData: defaultDataResolver, traits: traitsDefs = {} }) {
    const getFactoryWithTraits = (traitKeys = []) => {
        const seqKey = {};
        const getSeq = () => getSequenceCounter(seqKey);
        const screen = createScreener("TaggedComments", modelFieldDefinitions);
        const build = (...args_1) => __awaiter(this, [...args_1], void 0, function* (inputData = {}) {
            const seq = getSeq();
            const requiredScalarData = autoGenerateTaggedCommentsScalarsOrEnums({ seq });
            const resolveValue = normalizeResolver(defaultDataResolver !== null && defaultDataResolver !== void 0 ? defaultDataResolver : {});
            const defaultData = yield traitKeys.reduce((queue, traitKey) => __awaiter(this, void 0, void 0, function* () {
                var _a, _b;
                const acc = yield queue;
                const resolveTraitValue = normalizeResolver((_b = (_a = traitsDefs[traitKey]) === null || _a === void 0 ? void 0 : _a.data) !== null && _b !== void 0 ? _b : {});
                const traitData = yield resolveTraitValue({ seq });
                return Object.assign(Object.assign({}, acc), traitData);
            }), resolveValue({ seq }));
            const defaultAssociations = {
                comment: isTaggedCommentscommentFactory(defaultData.comment) ? {
                    create: yield defaultData.comment.build()
                } : defaultData.comment,
                tag: isTaggedCommentstagFactory(defaultData.tag) ? {
                    create: yield defaultData.tag.build()
                } : defaultData.tag
            };
            const data = Object.assign(Object.assign(Object.assign(Object.assign({}, requiredScalarData), defaultData), defaultAssociations), inputData);
            return data;
        });
        const buildList = (inputData) => Promise.all(normalizeList(inputData).map(data => build(data)));
        const pickForConnect = (inputData) => ({
            commentId: inputData.commentId,
            tagId: inputData.tagId
        });
        const create = (...args_2) => __awaiter(this, [...args_2], void 0, function* (inputData = {}) {
            const data = yield build(inputData).then(screen);
            return yield getClient().taggedComments.create({ data });
        });
        const createList = (inputData) => Promise.all(normalizeList(inputData).map(data => create(data)));
        const createForConnect = (inputData = {}) => create(inputData).then(pickForConnect);
        return {
            _factoryFor: "TaggedComments",
            build,
            buildList,
            buildCreateInput: build,
            pickForConnect,
            create,
            createList,
            createForConnect,
        };
    };
    const factory = getFactoryWithTraits();
    const useTraits = (name, ...names) => {
        return getFactoryWithTraits([name, ...names]);
    };
    return Object.assign(Object.assign({}, factory), { use: useTraits });
}
/**
 * Define factory for {@link TaggedComments} model.
 *
 * @param options
 * @returns factory {@link TaggedCommentsFactoryInterface}
 */
export function defineTaggedCommentsFactory(options) {
    return defineTaggedCommentsFactoryInternal(options);
}
function autoGenerateCommentRatingSystemScalarsOrEnums({ seq }) {
    return {};
}
function defineCommentRatingSystemFactoryInternal({ defaultData: defaultDataResolver, traits: traitsDefs = {} }) {
    const getFactoryWithTraits = (traitKeys = []) => {
        const seqKey = {};
        const getSeq = () => getSequenceCounter(seqKey);
        const screen = createScreener("CommentRatingSystem", modelFieldDefinitions);
        const build = (...args_1) => __awaiter(this, [...args_1], void 0, function* (inputData = {}) {
            const seq = getSeq();
            const requiredScalarData = autoGenerateCommentRatingSystemScalarsOrEnums({ seq });
            const resolveValue = normalizeResolver(defaultDataResolver !== null && defaultDataResolver !== void 0 ? defaultDataResolver : {});
            const defaultData = yield traitKeys.reduce((queue, traitKey) => __awaiter(this, void 0, void 0, function* () {
                var _a, _b;
                const acc = yield queue;
                const resolveTraitValue = normalizeResolver((_b = (_a = traitsDefs[traitKey]) === null || _a === void 0 ? void 0 : _a.data) !== null && _b !== void 0 ? _b : {});
                const traitData = yield resolveTraitValue({ seq });
                return Object.assign(Object.assign({}, acc), traitData);
            }), resolveValue({ seq }));
            const defaultAssociations = {};
            const data = Object.assign(Object.assign(Object.assign(Object.assign({}, requiredScalarData), defaultData), defaultAssociations), inputData);
            return data;
        });
        const buildList = (inputData) => Promise.all(normalizeList(inputData).map(data => build(data)));
        const pickForConnect = (inputData) => ({
            id: inputData.id
        });
        const create = (...args_2) => __awaiter(this, [...args_2], void 0, function* (inputData = {}) {
            const data = yield build(inputData).then(screen);
            return yield getClient().commentRatingSystem.create({ data });
        });
        const createList = (inputData) => Promise.all(normalizeList(inputData).map(data => create(data)));
        const createForConnect = (inputData = {}) => create(inputData).then(pickForConnect);
        return {
            _factoryFor: "CommentRatingSystem",
            build,
            buildList,
            buildCreateInput: build,
            pickForConnect,
            create,
            createList,
            createForConnect,
        };
    };
    const factory = getFactoryWithTraits();
    const useTraits = (name, ...names) => {
        return getFactoryWithTraits([name, ...names]);
    };
    return Object.assign(Object.assign({}, factory), { use: useTraits });
}
/**
 * Define factory for {@link CommentRatingSystem} model.
 *
 * @param options
 * @returns factory {@link CommentRatingSystemFactoryInterface}
 */
export function defineCommentRatingSystemFactory(options) {
    return defineCommentRatingSystemFactoryInternal(options !== null && options !== void 0 ? options : {});
}
function isCommentRatingSystemAnswerratingSystemFactory(x) {
    return (x === null || x === void 0 ? void 0 : x._factoryFor) === "CommentRatingSystem";
}
function autoGenerateCommentRatingSystemAnswerScalarsOrEnums({ seq }) {
    return {
        type: "star"
    };
}
function defineCommentRatingSystemAnswerFactoryInternal({ defaultData: defaultDataResolver, traits: traitsDefs = {} }) {
    const getFactoryWithTraits = (traitKeys = []) => {
        const seqKey = {};
        const getSeq = () => getSequenceCounter(seqKey);
        const screen = createScreener("CommentRatingSystemAnswer", modelFieldDefinitions);
        const build = (...args_1) => __awaiter(this, [...args_1], void 0, function* (inputData = {}) {
            const seq = getSeq();
            const requiredScalarData = autoGenerateCommentRatingSystemAnswerScalarsOrEnums({ seq });
            const resolveValue = normalizeResolver(defaultDataResolver !== null && defaultDataResolver !== void 0 ? defaultDataResolver : {});
            const defaultData = yield traitKeys.reduce((queue, traitKey) => __awaiter(this, void 0, void 0, function* () {
                var _a, _b;
                const acc = yield queue;
                const resolveTraitValue = normalizeResolver((_b = (_a = traitsDefs[traitKey]) === null || _a === void 0 ? void 0 : _a.data) !== null && _b !== void 0 ? _b : {});
                const traitData = yield resolveTraitValue({ seq });
                return Object.assign(Object.assign({}, acc), traitData);
            }), resolveValue({ seq }));
            const defaultAssociations = {
                ratingSystem: isCommentRatingSystemAnswerratingSystemFactory(defaultData.ratingSystem) ? {
                    create: yield defaultData.ratingSystem.build()
                } : defaultData.ratingSystem
            };
            const data = Object.assign(Object.assign(Object.assign(Object.assign({}, requiredScalarData), defaultData), defaultAssociations), inputData);
            return data;
        });
        const buildList = (inputData) => Promise.all(normalizeList(inputData).map(data => build(data)));
        const pickForConnect = (inputData) => ({
            id: inputData.id
        });
        const create = (...args_2) => __awaiter(this, [...args_2], void 0, function* (inputData = {}) {
            const data = yield build(inputData).then(screen);
            return yield getClient().commentRatingSystemAnswer.create({ data });
        });
        const createList = (inputData) => Promise.all(normalizeList(inputData).map(data => create(data)));
        const createForConnect = (inputData = {}) => create(inputData).then(pickForConnect);
        return {
            _factoryFor: "CommentRatingSystemAnswer",
            build,
            buildList,
            buildCreateInput: build,
            pickForConnect,
            create,
            createList,
            createForConnect,
        };
    };
    const factory = getFactoryWithTraits();
    const useTraits = (name, ...names) => {
        return getFactoryWithTraits([name, ...names]);
    };
    return Object.assign(Object.assign({}, factory), { use: useTraits });
}
/**
 * Define factory for {@link CommentRatingSystemAnswer} model.
 *
 * @param options
 * @returns factory {@link CommentRatingSystemAnswerFactoryInterface}
 */
export function defineCommentRatingSystemAnswerFactory(options) {
    return defineCommentRatingSystemAnswerFactoryInternal(options);
}
function isCommentRatinguserFactory(x) {
    return (x === null || x === void 0 ? void 0 : x._factoryFor) === "User";
}
function isCommentRatinganswerFactory(x) {
    return (x === null || x === void 0 ? void 0 : x._factoryFor) === "CommentRatingSystemAnswer";
}
function isCommentRatingcommentFactory(x) {
    return (x === null || x === void 0 ? void 0 : x._factoryFor) === "Comment";
}
function autoGenerateCommentRatingScalarsOrEnums({ seq }) {
    return {
        value: getScalarFieldValueGenerator().Int({ modelName: "CommentRating", fieldName: "value", isId: false, isUnique: false, seq })
    };
}
function defineCommentRatingFactoryInternal({ defaultData: defaultDataResolver, traits: traitsDefs = {} }) {
    const getFactoryWithTraits = (traitKeys = []) => {
        const seqKey = {};
        const getSeq = () => getSequenceCounter(seqKey);
        const screen = createScreener("CommentRating", modelFieldDefinitions);
        const build = (...args_1) => __awaiter(this, [...args_1], void 0, function* (inputData = {}) {
            const seq = getSeq();
            const requiredScalarData = autoGenerateCommentRatingScalarsOrEnums({ seq });
            const resolveValue = normalizeResolver(defaultDataResolver !== null && defaultDataResolver !== void 0 ? defaultDataResolver : {});
            const defaultData = yield traitKeys.reduce((queue, traitKey) => __awaiter(this, void 0, void 0, function* () {
                var _a, _b;
                const acc = yield queue;
                const resolveTraitValue = normalizeResolver((_b = (_a = traitsDefs[traitKey]) === null || _a === void 0 ? void 0 : _a.data) !== null && _b !== void 0 ? _b : {});
                const traitData = yield resolveTraitValue({ seq });
                return Object.assign(Object.assign({}, acc), traitData);
            }), resolveValue({ seq }));
            const defaultAssociations = {
                user: isCommentRatinguserFactory(defaultData.user) ? {
                    create: yield defaultData.user.build()
                } : defaultData.user,
                answer: isCommentRatinganswerFactory(defaultData.answer) ? {
                    create: yield defaultData.answer.build()
                } : defaultData.answer,
                comment: isCommentRatingcommentFactory(defaultData.comment) ? {
                    create: yield defaultData.comment.build()
                } : defaultData.comment
            };
            const data = Object.assign(Object.assign(Object.assign(Object.assign({}, requiredScalarData), defaultData), defaultAssociations), inputData);
            return data;
        });
        const buildList = (inputData) => Promise.all(normalizeList(inputData).map(data => build(data)));
        const pickForConnect = (inputData) => ({
            id: inputData.id
        });
        const create = (...args_2) => __awaiter(this, [...args_2], void 0, function* (inputData = {}) {
            const data = yield build(inputData).then(screen);
            return yield getClient().commentRating.create({ data });
        });
        const createList = (inputData) => Promise.all(normalizeList(inputData).map(data => create(data)));
        const createForConnect = (inputData = {}) => create(inputData).then(pickForConnect);
        return {
            _factoryFor: "CommentRating",
            build,
            buildList,
            buildCreateInput: build,
            pickForConnect,
            create,
            createList,
            createForConnect,
        };
    };
    const factory = getFactoryWithTraits();
    const useTraits = (name, ...names) => {
        return getFactoryWithTraits([name, ...names]);
    };
    return Object.assign(Object.assign({}, factory), { use: useTraits });
}
/**
 * Define factory for {@link CommentRating} model.
 *
 * @param options
 * @returns factory {@link CommentRatingFactoryInterface}
 */
export function defineCommentRatingFactory(options) {
    return defineCommentRatingFactoryInternal(options);
}
function isCommentRatingOverrideanswerFactory(x) {
    return (x === null || x === void 0 ? void 0 : x._factoryFor) === "CommentRatingSystemAnswer";
}
function isCommentRatingOverridecommentFactory(x) {
    return (x === null || x === void 0 ? void 0 : x._factoryFor) === "Comment";
}
function autoGenerateCommentRatingOverrideScalarsOrEnums({ seq }) {
    return {};
}
function defineCommentRatingOverrideFactoryInternal({ defaultData: defaultDataResolver, traits: traitsDefs = {} }) {
    const getFactoryWithTraits = (traitKeys = []) => {
        const seqKey = {};
        const getSeq = () => getSequenceCounter(seqKey);
        const screen = createScreener("CommentRatingOverride", modelFieldDefinitions);
        const build = (...args_1) => __awaiter(this, [...args_1], void 0, function* (inputData = {}) {
            const seq = getSeq();
            const requiredScalarData = autoGenerateCommentRatingOverrideScalarsOrEnums({ seq });
            const resolveValue = normalizeResolver(defaultDataResolver !== null && defaultDataResolver !== void 0 ? defaultDataResolver : {});
            const defaultData = yield traitKeys.reduce((queue, traitKey) => __awaiter(this, void 0, void 0, function* () {
                var _a, _b;
                const acc = yield queue;
                const resolveTraitValue = normalizeResolver((_b = (_a = traitsDefs[traitKey]) === null || _a === void 0 ? void 0 : _a.data) !== null && _b !== void 0 ? _b : {});
                const traitData = yield resolveTraitValue({ seq });
                return Object.assign(Object.assign({}, acc), traitData);
            }), resolveValue({ seq }));
            const defaultAssociations = {
                answer: isCommentRatingOverrideanswerFactory(defaultData.answer) ? {
                    create: yield defaultData.answer.build()
                } : defaultData.answer,
                comment: isCommentRatingOverridecommentFactory(defaultData.comment) ? {
                    create: yield defaultData.comment.build()
                } : defaultData.comment
            };
            const data = Object.assign(Object.assign(Object.assign(Object.assign({}, requiredScalarData), defaultData), defaultAssociations), inputData);
            return data;
        });
        const buildList = (inputData) => Promise.all(normalizeList(inputData).map(data => build(data)));
        const pickForConnect = (inputData) => ({
            answerId: inputData.answerId,
            commentId: inputData.commentId
        });
        const create = (...args_2) => __awaiter(this, [...args_2], void 0, function* (inputData = {}) {
            const data = yield build(inputData).then(screen);
            return yield getClient().commentRatingOverride.create({ data });
        });
        const createList = (inputData) => Promise.all(normalizeList(inputData).map(data => create(data)));
        const createForConnect = (inputData = {}) => create(inputData).then(pickForConnect);
        return {
            _factoryFor: "CommentRatingOverride",
            build,
            buildList,
            buildCreateInput: build,
            pickForConnect,
            create,
            createList,
            createForConnect,
        };
    };
    const factory = getFactoryWithTraits();
    const useTraits = (name, ...names) => {
        return getFactoryWithTraits([name, ...names]);
    };
    return Object.assign(Object.assign({}, factory), { use: useTraits });
}
/**
 * Define factory for {@link CommentRatingOverride} model.
 *
 * @param options
 * @returns factory {@link CommentRatingOverrideFactoryInterface}
 */
export function defineCommentRatingOverrideFactory(options) {
    return defineCommentRatingOverrideFactoryInternal(options);
}
function isInvoiceIteminvoicesFactory(x) {
    return (x === null || x === void 0 ? void 0 : x._factoryFor) === "Invoice";
}
function autoGenerateInvoiceItemScalarsOrEnums({ seq }) {
    return {
        name: getScalarFieldValueGenerator().String({ modelName: "InvoiceItem", fieldName: "name", isId: false, isUnique: false, seq }),
        quantity: getScalarFieldValueGenerator().Int({ modelName: "InvoiceItem", fieldName: "quantity", isId: false, isUnique: false, seq }),
        amount: getScalarFieldValueGenerator().Int({ modelName: "InvoiceItem", fieldName: "amount", isId: false, isUnique: false, seq })
    };
}
function defineInvoiceItemFactoryInternal({ defaultData: defaultDataResolver, traits: traitsDefs = {} }) {
    const getFactoryWithTraits = (traitKeys = []) => {
        const seqKey = {};
        const getSeq = () => getSequenceCounter(seqKey);
        const screen = createScreener("InvoiceItem", modelFieldDefinitions);
        const build = (...args_1) => __awaiter(this, [...args_1], void 0, function* (inputData = {}) {
            const seq = getSeq();
            const requiredScalarData = autoGenerateInvoiceItemScalarsOrEnums({ seq });
            const resolveValue = normalizeResolver(defaultDataResolver !== null && defaultDataResolver !== void 0 ? defaultDataResolver : {});
            const defaultData = yield traitKeys.reduce((queue, traitKey) => __awaiter(this, void 0, void 0, function* () {
                var _a, _b;
                const acc = yield queue;
                const resolveTraitValue = normalizeResolver((_b = (_a = traitsDefs[traitKey]) === null || _a === void 0 ? void 0 : _a.data) !== null && _b !== void 0 ? _b : {});
                const traitData = yield resolveTraitValue({ seq });
                return Object.assign(Object.assign({}, acc), traitData);
            }), resolveValue({ seq }));
            const defaultAssociations = {
                invoices: isInvoiceIteminvoicesFactory(defaultData.invoices) ? {
                    create: yield defaultData.invoices.build()
                } : defaultData.invoices
            };
            const data = Object.assign(Object.assign(Object.assign(Object.assign({}, requiredScalarData), defaultData), defaultAssociations), inputData);
            return data;
        });
        const buildList = (inputData) => Promise.all(normalizeList(inputData).map(data => build(data)));
        const pickForConnect = (inputData) => ({
            id: inputData.id
        });
        const create = (...args_2) => __awaiter(this, [...args_2], void 0, function* (inputData = {}) {
            const data = yield build(inputData).then(screen);
            return yield getClient().invoiceItem.create({ data });
        });
        const createList = (inputData) => Promise.all(normalizeList(inputData).map(data => create(data)));
        const createForConnect = (inputData = {}) => create(inputData).then(pickForConnect);
        return {
            _factoryFor: "InvoiceItem",
            build,
            buildList,
            buildCreateInput: build,
            pickForConnect,
            create,
            createList,
            createForConnect,
        };
    };
    const factory = getFactoryWithTraits();
    const useTraits = (name, ...names) => {
        return getFactoryWithTraits([name, ...names]);
    };
    return Object.assign(Object.assign({}, factory), { use: useTraits });
}
/**
 * Define factory for {@link InvoiceItem} model.
 *
 * @param options
 * @returns factory {@link InvoiceItemFactoryInterface}
 */
export function defineInvoiceItemFactory(options) {
    return defineInvoiceItemFactoryInternal(options !== null && options !== void 0 ? options : {});
}
function isInvoicesubscriptionFactory(x) {
    return (x === null || x === void 0 ? void 0 : x._factoryFor) === "Subscription";
}
function autoGenerateInvoiceScalarsOrEnums({ seq }) {
    return {
        mail: getScalarFieldValueGenerator().String({ modelName: "Invoice", fieldName: "mail", isId: false, isUnique: false, seq }),
        dueAt: getScalarFieldValueGenerator().DateTime({ modelName: "Invoice", fieldName: "dueAt", isId: false, isUnique: false, seq }),
        scheduledDeactivationAt: getScalarFieldValueGenerator().DateTime({ modelName: "Invoice", fieldName: "scheduledDeactivationAt", isId: false, isUnique: false, seq })
    };
}
function defineInvoiceFactoryInternal({ defaultData: defaultDataResolver, traits: traitsDefs = {} }) {
    const getFactoryWithTraits = (traitKeys = []) => {
        const seqKey = {};
        const getSeq = () => getSequenceCounter(seqKey);
        const screen = createScreener("Invoice", modelFieldDefinitions);
        const build = (...args_1) => __awaiter(this, [...args_1], void 0, function* (inputData = {}) {
            const seq = getSeq();
            const requiredScalarData = autoGenerateInvoiceScalarsOrEnums({ seq });
            const resolveValue = normalizeResolver(defaultDataResolver !== null && defaultDataResolver !== void 0 ? defaultDataResolver : {});
            const defaultData = yield traitKeys.reduce((queue, traitKey) => __awaiter(this, void 0, void 0, function* () {
                var _a, _b;
                const acc = yield queue;
                const resolveTraitValue = normalizeResolver((_b = (_a = traitsDefs[traitKey]) === null || _a === void 0 ? void 0 : _a.data) !== null && _b !== void 0 ? _b : {});
                const traitData = yield resolveTraitValue({ seq });
                return Object.assign(Object.assign({}, acc), traitData);
            }), resolveValue({ seq }));
            const defaultAssociations = {
                subscription: isInvoicesubscriptionFactory(defaultData.subscription) ? {
                    create: yield defaultData.subscription.build()
                } : defaultData.subscription
            };
            const data = Object.assign(Object.assign(Object.assign(Object.assign({}, requiredScalarData), defaultData), defaultAssociations), inputData);
            return data;
        });
        const buildList = (inputData) => Promise.all(normalizeList(inputData).map(data => build(data)));
        const pickForConnect = (inputData) => ({
            id: inputData.id
        });
        const create = (...args_2) => __awaiter(this, [...args_2], void 0, function* (inputData = {}) {
            const data = yield build(inputData).then(screen);
            return yield getClient().invoice.create({ data });
        });
        const createList = (inputData) => Promise.all(normalizeList(inputData).map(data => create(data)));
        const createForConnect = (inputData = {}) => create(inputData).then(pickForConnect);
        return {
            _factoryFor: "Invoice",
            build,
            buildList,
            buildCreateInput: build,
            pickForConnect,
            create,
            createList,
            createForConnect,
        };
    };
    const factory = getFactoryWithTraits();
    const useTraits = (name, ...names) => {
        return getFactoryWithTraits([name, ...names]);
    };
    return Object.assign(Object.assign({}, factory), { use: useTraits });
}
/**
 * Define factory for {@link Invoice} model.
 *
 * @param options
 * @returns factory {@link InvoiceFactoryInterface}
 */
export function defineInvoiceFactory(options) {
    return defineInvoiceFactoryInternal(options !== null && options !== void 0 ? options : {});
}
function isMailLogrecipientFactory(x) {
    return (x === null || x === void 0 ? void 0 : x._factoryFor) === "User";
}
function isMailLogmailTemplateFactory(x) {
    return (x === null || x === void 0 ? void 0 : x._factoryFor) === "MailTemplate";
}
function autoGenerateMailLogScalarsOrEnums({ seq }) {
    return {
        state: "submitted",
        sentDate: getScalarFieldValueGenerator().DateTime({ modelName: "MailLog", fieldName: "sentDate", isId: false, isUnique: false, seq }),
        mailProviderID: getScalarFieldValueGenerator().String({ modelName: "MailLog", fieldName: "mailProviderID", isId: false, isUnique: false, seq }),
        mailIdentifier: getScalarFieldValueGenerator().String({ modelName: "MailLog", fieldName: "mailIdentifier", isId: false, isUnique: false, seq })
    };
}
function defineMailLogFactoryInternal({ defaultData: defaultDataResolver, traits: traitsDefs = {} }) {
    const getFactoryWithTraits = (traitKeys = []) => {
        const seqKey = {};
        const getSeq = () => getSequenceCounter(seqKey);
        const screen = createScreener("MailLog", modelFieldDefinitions);
        const build = (...args_1) => __awaiter(this, [...args_1], void 0, function* (inputData = {}) {
            const seq = getSeq();
            const requiredScalarData = autoGenerateMailLogScalarsOrEnums({ seq });
            const resolveValue = normalizeResolver(defaultDataResolver !== null && defaultDataResolver !== void 0 ? defaultDataResolver : {});
            const defaultData = yield traitKeys.reduce((queue, traitKey) => __awaiter(this, void 0, void 0, function* () {
                var _a, _b;
                const acc = yield queue;
                const resolveTraitValue = normalizeResolver((_b = (_a = traitsDefs[traitKey]) === null || _a === void 0 ? void 0 : _a.data) !== null && _b !== void 0 ? _b : {});
                const traitData = yield resolveTraitValue({ seq });
                return Object.assign(Object.assign({}, acc), traitData);
            }), resolveValue({ seq }));
            const defaultAssociations = {
                recipient: isMailLogrecipientFactory(defaultData.recipient) ? {
                    create: yield defaultData.recipient.build()
                } : defaultData.recipient,
                mailTemplate: isMailLogmailTemplateFactory(defaultData.mailTemplate) ? {
                    create: yield defaultData.mailTemplate.build()
                } : defaultData.mailTemplate
            };
            const data = Object.assign(Object.assign(Object.assign(Object.assign({}, requiredScalarData), defaultData), defaultAssociations), inputData);
            return data;
        });
        const buildList = (inputData) => Promise.all(normalizeList(inputData).map(data => build(data)));
        const pickForConnect = (inputData) => ({
            id: inputData.id
        });
        const create = (...args_2) => __awaiter(this, [...args_2], void 0, function* (inputData = {}) {
            const data = yield build(inputData).then(screen);
            return yield getClient().mailLog.create({ data });
        });
        const createList = (inputData) => Promise.all(normalizeList(inputData).map(data => create(data)));
        const createForConnect = (inputData = {}) => create(inputData).then(pickForConnect);
        return {
            _factoryFor: "MailLog",
            build,
            buildList,
            buildCreateInput: build,
            pickForConnect,
            create,
            createList,
            createForConnect,
        };
    };
    const factory = getFactoryWithTraits();
    const useTraits = (name, ...names) => {
        return getFactoryWithTraits([name, ...names]);
    };
    return Object.assign(Object.assign({}, factory), { use: useTraits });
}
/**
 * Define factory for {@link MailLog} model.
 *
 * @param options
 * @returns factory {@link MailLogFactoryInterface}
 */
export function defineMailLogFactory(options) {
    return defineMailLogFactoryInternal(options);
}
function isAvailablePaymentMethodMemberPlanFactory(x) {
    return (x === null || x === void 0 ? void 0 : x._factoryFor) === "MemberPlan";
}
function autoGenerateAvailablePaymentMethodScalarsOrEnums({ seq }) {
    return {
        forceAutoRenewal: getScalarFieldValueGenerator().Boolean({ modelName: "AvailablePaymentMethod", fieldName: "forceAutoRenewal", isId: false, isUnique: false, seq })
    };
}
function defineAvailablePaymentMethodFactoryInternal({ defaultData: defaultDataResolver, traits: traitsDefs = {} }) {
    const getFactoryWithTraits = (traitKeys = []) => {
        const seqKey = {};
        const getSeq = () => getSequenceCounter(seqKey);
        const screen = createScreener("AvailablePaymentMethod", modelFieldDefinitions);
        const build = (...args_1) => __awaiter(this, [...args_1], void 0, function* (inputData = {}) {
            const seq = getSeq();
            const requiredScalarData = autoGenerateAvailablePaymentMethodScalarsOrEnums({ seq });
            const resolveValue = normalizeResolver(defaultDataResolver !== null && defaultDataResolver !== void 0 ? defaultDataResolver : {});
            const defaultData = yield traitKeys.reduce((queue, traitKey) => __awaiter(this, void 0, void 0, function* () {
                var _a, _b;
                const acc = yield queue;
                const resolveTraitValue = normalizeResolver((_b = (_a = traitsDefs[traitKey]) === null || _a === void 0 ? void 0 : _a.data) !== null && _b !== void 0 ? _b : {});
                const traitData = yield resolveTraitValue({ seq });
                return Object.assign(Object.assign({}, acc), traitData);
            }), resolveValue({ seq }));
            const defaultAssociations = {
                MemberPlan: isAvailablePaymentMethodMemberPlanFactory(defaultData.MemberPlan) ? {
                    create: yield defaultData.MemberPlan.build()
                } : defaultData.MemberPlan
            };
            const data = Object.assign(Object.assign(Object.assign(Object.assign({}, requiredScalarData), defaultData), defaultAssociations), inputData);
            return data;
        });
        const buildList = (inputData) => Promise.all(normalizeList(inputData).map(data => build(data)));
        const pickForConnect = (inputData) => ({
            id: inputData.id
        });
        const create = (...args_2) => __awaiter(this, [...args_2], void 0, function* (inputData = {}) {
            const data = yield build(inputData).then(screen);
            return yield getClient().availablePaymentMethod.create({ data });
        });
        const createList = (inputData) => Promise.all(normalizeList(inputData).map(data => create(data)));
        const createForConnect = (inputData = {}) => create(inputData).then(pickForConnect);
        return {
            _factoryFor: "AvailablePaymentMethod",
            build,
            buildList,
            buildCreateInput: build,
            pickForConnect,
            create,
            createList,
            createForConnect,
        };
    };
    const factory = getFactoryWithTraits();
    const useTraits = (name, ...names) => {
        return getFactoryWithTraits([name, ...names]);
    };
    return Object.assign(Object.assign({}, factory), { use: useTraits });
}
/**
 * Define factory for {@link AvailablePaymentMethod} model.
 *
 * @param options
 * @returns factory {@link AvailablePaymentMethodFactoryInterface}
 */
export function defineAvailablePaymentMethodFactory(options) {
    return defineAvailablePaymentMethodFactoryInternal(options !== null && options !== void 0 ? options : {});
}
function isMemberPlanimageFactory(x) {
    return (x === null || x === void 0 ? void 0 : x._factoryFor) === "Image";
}
function autoGenerateMemberPlanScalarsOrEnums({ seq }) {
    return {
        name: getScalarFieldValueGenerator().String({ modelName: "MemberPlan", fieldName: "name", isId: false, isUnique: false, seq }),
        slug: getScalarFieldValueGenerator().String({ modelName: "MemberPlan", fieldName: "slug", isId: false, isUnique: true, seq }),
        description: getScalarFieldValueGenerator().Json({ modelName: "MemberPlan", fieldName: "description", isId: false, isUnique: false, seq }),
        active: getScalarFieldValueGenerator().Boolean({ modelName: "MemberPlan", fieldName: "active", isId: false, isUnique: false, seq }),
        amountPerMonthMin: getScalarFieldValueGenerator().Float({ modelName: "MemberPlan", fieldName: "amountPerMonthMin", isId: false, isUnique: false, seq })
    };
}
function defineMemberPlanFactoryInternal({ defaultData: defaultDataResolver, traits: traitsDefs = {} }) {
    const getFactoryWithTraits = (traitKeys = []) => {
        const seqKey = {};
        const getSeq = () => getSequenceCounter(seqKey);
        const screen = createScreener("MemberPlan", modelFieldDefinitions);
        const build = (...args_1) => __awaiter(this, [...args_1], void 0, function* (inputData = {}) {
            const seq = getSeq();
            const requiredScalarData = autoGenerateMemberPlanScalarsOrEnums({ seq });
            const resolveValue = normalizeResolver(defaultDataResolver !== null && defaultDataResolver !== void 0 ? defaultDataResolver : {});
            const defaultData = yield traitKeys.reduce((queue, traitKey) => __awaiter(this, void 0, void 0, function* () {
                var _a, _b;
                const acc = yield queue;
                const resolveTraitValue = normalizeResolver((_b = (_a = traitsDefs[traitKey]) === null || _a === void 0 ? void 0 : _a.data) !== null && _b !== void 0 ? _b : {});
                const traitData = yield resolveTraitValue({ seq });
                return Object.assign(Object.assign({}, acc), traitData);
            }), resolveValue({ seq }));
            const defaultAssociations = {
                image: isMemberPlanimageFactory(defaultData.image) ? {
                    create: yield defaultData.image.build()
                } : defaultData.image
            };
            const data = Object.assign(Object.assign(Object.assign(Object.assign({}, requiredScalarData), defaultData), defaultAssociations), inputData);
            return data;
        });
        const buildList = (inputData) => Promise.all(normalizeList(inputData).map(data => build(data)));
        const pickForConnect = (inputData) => ({
            id: inputData.id
        });
        const create = (...args_2) => __awaiter(this, [...args_2], void 0, function* (inputData = {}) {
            const data = yield build(inputData).then(screen);
            return yield getClient().memberPlan.create({ data });
        });
        const createList = (inputData) => Promise.all(normalizeList(inputData).map(data => create(data)));
        const createForConnect = (inputData = {}) => create(inputData).then(pickForConnect);
        return {
            _factoryFor: "MemberPlan",
            build,
            buildList,
            buildCreateInput: build,
            pickForConnect,
            create,
            createList,
            createForConnect,
        };
    };
    const factory = getFactoryWithTraits();
    const useTraits = (name, ...names) => {
        return getFactoryWithTraits([name, ...names]);
    };
    return Object.assign(Object.assign({}, factory), { use: useTraits });
}
/**
 * Define factory for {@link MemberPlan} model.
 *
 * @param options
 * @returns factory {@link MemberPlanFactoryInterface}
 */
export function defineMemberPlanFactory(options) {
    return defineMemberPlanFactoryInternal(options !== null && options !== void 0 ? options : {});
}
function isNavigationLinkpageFactory(x) {
    return (x === null || x === void 0 ? void 0 : x._factoryFor) === "Page";
}
function isNavigationLinkarticleFactory(x) {
    return (x === null || x === void 0 ? void 0 : x._factoryFor) === "Article";
}
function isNavigationLinknavigationFactory(x) {
    return (x === null || x === void 0 ? void 0 : x._factoryFor) === "Navigation";
}
function autoGenerateNavigationLinkScalarsOrEnums({ seq }) {
    return {
        label: getScalarFieldValueGenerator().String({ modelName: "NavigationLink", fieldName: "label", isId: false, isUnique: false, seq }),
        type: getScalarFieldValueGenerator().String({ modelName: "NavigationLink", fieldName: "type", isId: false, isUnique: false, seq })
    };
}
function defineNavigationLinkFactoryInternal({ defaultData: defaultDataResolver, traits: traitsDefs = {} }) {
    const getFactoryWithTraits = (traitKeys = []) => {
        const seqKey = {};
        const getSeq = () => getSequenceCounter(seqKey);
        const screen = createScreener("NavigationLink", modelFieldDefinitions);
        const build = (...args_1) => __awaiter(this, [...args_1], void 0, function* (inputData = {}) {
            const seq = getSeq();
            const requiredScalarData = autoGenerateNavigationLinkScalarsOrEnums({ seq });
            const resolveValue = normalizeResolver(defaultDataResolver !== null && defaultDataResolver !== void 0 ? defaultDataResolver : {});
            const defaultData = yield traitKeys.reduce((queue, traitKey) => __awaiter(this, void 0, void 0, function* () {
                var _a, _b;
                const acc = yield queue;
                const resolveTraitValue = normalizeResolver((_b = (_a = traitsDefs[traitKey]) === null || _a === void 0 ? void 0 : _a.data) !== null && _b !== void 0 ? _b : {});
                const traitData = yield resolveTraitValue({ seq });
                return Object.assign(Object.assign({}, acc), traitData);
            }), resolveValue({ seq }));
            const defaultAssociations = {
                page: isNavigationLinkpageFactory(defaultData.page) ? {
                    create: yield defaultData.page.build()
                } : defaultData.page,
                article: isNavigationLinkarticleFactory(defaultData.article) ? {
                    create: yield defaultData.article.build()
                } : defaultData.article,
                navigation: isNavigationLinknavigationFactory(defaultData.navigation) ? {
                    create: yield defaultData.navigation.build()
                } : defaultData.navigation
            };
            const data = Object.assign(Object.assign(Object.assign(Object.assign({}, requiredScalarData), defaultData), defaultAssociations), inputData);
            return data;
        });
        const buildList = (inputData) => Promise.all(normalizeList(inputData).map(data => build(data)));
        const pickForConnect = (inputData) => ({
            id: inputData.id
        });
        const create = (...args_2) => __awaiter(this, [...args_2], void 0, function* (inputData = {}) {
            const data = yield build(inputData).then(screen);
            return yield getClient().navigationLink.create({ data });
        });
        const createList = (inputData) => Promise.all(normalizeList(inputData).map(data => create(data)));
        const createForConnect = (inputData = {}) => create(inputData).then(pickForConnect);
        return {
            _factoryFor: "NavigationLink",
            build,
            buildList,
            buildCreateInput: build,
            pickForConnect,
            create,
            createList,
            createForConnect,
        };
    };
    const factory = getFactoryWithTraits();
    const useTraits = (name, ...names) => {
        return getFactoryWithTraits([name, ...names]);
    };
    return Object.assign(Object.assign({}, factory), { use: useTraits });
}
/**
 * Define factory for {@link NavigationLink} model.
 *
 * @param options
 * @returns factory {@link NavigationLinkFactoryInterface}
 */
export function defineNavigationLinkFactory(options) {
    return defineNavigationLinkFactoryInternal(options !== null && options !== void 0 ? options : {});
}
function autoGenerateNavigationScalarsOrEnums({ seq }) {
    return {
        key: getScalarFieldValueGenerator().String({ modelName: "Navigation", fieldName: "key", isId: false, isUnique: true, seq }),
        name: getScalarFieldValueGenerator().String({ modelName: "Navigation", fieldName: "name", isId: false, isUnique: false, seq })
    };
}
function defineNavigationFactoryInternal({ defaultData: defaultDataResolver, traits: traitsDefs = {} }) {
    const getFactoryWithTraits = (traitKeys = []) => {
        const seqKey = {};
        const getSeq = () => getSequenceCounter(seqKey);
        const screen = createScreener("Navigation", modelFieldDefinitions);
        const build = (...args_1) => __awaiter(this, [...args_1], void 0, function* (inputData = {}) {
            const seq = getSeq();
            const requiredScalarData = autoGenerateNavigationScalarsOrEnums({ seq });
            const resolveValue = normalizeResolver(defaultDataResolver !== null && defaultDataResolver !== void 0 ? defaultDataResolver : {});
            const defaultData = yield traitKeys.reduce((queue, traitKey) => __awaiter(this, void 0, void 0, function* () {
                var _a, _b;
                const acc = yield queue;
                const resolveTraitValue = normalizeResolver((_b = (_a = traitsDefs[traitKey]) === null || _a === void 0 ? void 0 : _a.data) !== null && _b !== void 0 ? _b : {});
                const traitData = yield resolveTraitValue({ seq });
                return Object.assign(Object.assign({}, acc), traitData);
            }), resolveValue({ seq }));
            const defaultAssociations = {};
            const data = Object.assign(Object.assign(Object.assign(Object.assign({}, requiredScalarData), defaultData), defaultAssociations), inputData);
            return data;
        });
        const buildList = (inputData) => Promise.all(normalizeList(inputData).map(data => build(data)));
        const pickForConnect = (inputData) => ({
            id: inputData.id
        });
        const create = (...args_2) => __awaiter(this, [...args_2], void 0, function* (inputData = {}) {
            const data = yield build(inputData).then(screen);
            return yield getClient().navigation.create({ data });
        });
        const createList = (inputData) => Promise.all(normalizeList(inputData).map(data => create(data)));
        const createForConnect = (inputData = {}) => create(inputData).then(pickForConnect);
        return {
            _factoryFor: "Navigation",
            build,
            buildList,
            buildCreateInput: build,
            pickForConnect,
            create,
            createList,
            createForConnect,
        };
    };
    const factory = getFactoryWithTraits();
    const useTraits = (name, ...names) => {
        return getFactoryWithTraits([name, ...names]);
    };
    return Object.assign(Object.assign({}, factory), { use: useTraits });
}
/**
 * Define factory for {@link Navigation} model.
 *
 * @param options
 * @returns factory {@link NavigationFactoryInterface}
 */
export function defineNavigationFactory(options) {
    return defineNavigationFactoryInternal(options !== null && options !== void 0 ? options : {});
}
function isPageRevisionimageFactory(x) {
    return (x === null || x === void 0 ? void 0 : x._factoryFor) === "Image";
}
function isPageRevisionsocialMediaImageFactory(x) {
    return (x === null || x === void 0 ? void 0 : x._factoryFor) === "Image";
}
function autoGeneratePageRevisionScalarsOrEnums({ seq }) {
    return {
        title: getScalarFieldValueGenerator().String({ modelName: "PageRevision", fieldName: "title", isId: false, isUnique: false, seq }),
        blocks: getScalarFieldValueGenerator().Json({ modelName: "PageRevision", fieldName: "blocks", isId: false, isUnique: false, seq })
    };
}
function definePageRevisionFactoryInternal({ defaultData: defaultDataResolver, traits: traitsDefs = {} }) {
    const getFactoryWithTraits = (traitKeys = []) => {
        const seqKey = {};
        const getSeq = () => getSequenceCounter(seqKey);
        const screen = createScreener("PageRevision", modelFieldDefinitions);
        const build = (...args_1) => __awaiter(this, [...args_1], void 0, function* (inputData = {}) {
            const seq = getSeq();
            const requiredScalarData = autoGeneratePageRevisionScalarsOrEnums({ seq });
            const resolveValue = normalizeResolver(defaultDataResolver !== null && defaultDataResolver !== void 0 ? defaultDataResolver : {});
            const defaultData = yield traitKeys.reduce((queue, traitKey) => __awaiter(this, void 0, void 0, function* () {
                var _a, _b;
                const acc = yield queue;
                const resolveTraitValue = normalizeResolver((_b = (_a = traitsDefs[traitKey]) === null || _a === void 0 ? void 0 : _a.data) !== null && _b !== void 0 ? _b : {});
                const traitData = yield resolveTraitValue({ seq });
                return Object.assign(Object.assign({}, acc), traitData);
            }), resolveValue({ seq }));
            const defaultAssociations = {
                image: isPageRevisionimageFactory(defaultData.image) ? {
                    create: yield defaultData.image.build()
                } : defaultData.image,
                socialMediaImage: isPageRevisionsocialMediaImageFactory(defaultData.socialMediaImage) ? {
                    create: yield defaultData.socialMediaImage.build()
                } : defaultData.socialMediaImage
            };
            const data = Object.assign(Object.assign(Object.assign(Object.assign({}, requiredScalarData), defaultData), defaultAssociations), inputData);
            return data;
        });
        const buildList = (inputData) => Promise.all(normalizeList(inputData).map(data => build(data)));
        const pickForConnect = (inputData) => ({
            id: inputData.id
        });
        const create = (...args_2) => __awaiter(this, [...args_2], void 0, function* (inputData = {}) {
            const data = yield build(inputData).then(screen);
            return yield getClient().pageRevision.create({ data });
        });
        const createList = (inputData) => Promise.all(normalizeList(inputData).map(data => create(data)));
        const createForConnect = (inputData = {}) => create(inputData).then(pickForConnect);
        return {
            _factoryFor: "PageRevision",
            build,
            buildList,
            buildCreateInput: build,
            pickForConnect,
            create,
            createList,
            createForConnect,
        };
    };
    const factory = getFactoryWithTraits();
    const useTraits = (name, ...names) => {
        return getFactoryWithTraits([name, ...names]);
    };
    return Object.assign(Object.assign({}, factory), { use: useTraits });
}
/**
 * Define factory for {@link PageRevision} model.
 *
 * @param options
 * @returns factory {@link PageRevisionFactoryInterface}
 */
export function definePageRevisionFactory(options) {
    return definePageRevisionFactoryInternal(options !== null && options !== void 0 ? options : {});
}
function isPagepublishedFactory(x) {
    return (x === null || x === void 0 ? void 0 : x._factoryFor) === "PageRevision";
}
function isPagependingFactory(x) {
    return (x === null || x === void 0 ? void 0 : x._factoryFor) === "PageRevision";
}
function isPagedraftFactory(x) {
    return (x === null || x === void 0 ? void 0 : x._factoryFor) === "PageRevision";
}
function autoGeneratePageScalarsOrEnums({ seq }) {
    return {};
}
function definePageFactoryInternal({ defaultData: defaultDataResolver, traits: traitsDefs = {} }) {
    const getFactoryWithTraits = (traitKeys = []) => {
        const seqKey = {};
        const getSeq = () => getSequenceCounter(seqKey);
        const screen = createScreener("Page", modelFieldDefinitions);
        const build = (...args_1) => __awaiter(this, [...args_1], void 0, function* (inputData = {}) {
            const seq = getSeq();
            const requiredScalarData = autoGeneratePageScalarsOrEnums({ seq });
            const resolveValue = normalizeResolver(defaultDataResolver !== null && defaultDataResolver !== void 0 ? defaultDataResolver : {});
            const defaultData = yield traitKeys.reduce((queue, traitKey) => __awaiter(this, void 0, void 0, function* () {
                var _a, _b;
                const acc = yield queue;
                const resolveTraitValue = normalizeResolver((_b = (_a = traitsDefs[traitKey]) === null || _a === void 0 ? void 0 : _a.data) !== null && _b !== void 0 ? _b : {});
                const traitData = yield resolveTraitValue({ seq });
                return Object.assign(Object.assign({}, acc), traitData);
            }), resolveValue({ seq }));
            const defaultAssociations = {
                published: isPagepublishedFactory(defaultData.published) ? {
                    create: yield defaultData.published.build()
                } : defaultData.published,
                pending: isPagependingFactory(defaultData.pending) ? {
                    create: yield defaultData.pending.build()
                } : defaultData.pending,
                draft: isPagedraftFactory(defaultData.draft) ? {
                    create: yield defaultData.draft.build()
                } : defaultData.draft
            };
            const data = Object.assign(Object.assign(Object.assign(Object.assign({}, requiredScalarData), defaultData), defaultAssociations), inputData);
            return data;
        });
        const buildList = (inputData) => Promise.all(normalizeList(inputData).map(data => build(data)));
        const pickForConnect = (inputData) => ({
            id: inputData.id
        });
        const create = (...args_2) => __awaiter(this, [...args_2], void 0, function* (inputData = {}) {
            const data = yield build(inputData).then(screen);
            return yield getClient().page.create({ data });
        });
        const createList = (inputData) => Promise.all(normalizeList(inputData).map(data => create(data)));
        const createForConnect = (inputData = {}) => create(inputData).then(pickForConnect);
        return {
            _factoryFor: "Page",
            build,
            buildList,
            buildCreateInput: build,
            pickForConnect,
            create,
            createList,
            createForConnect,
        };
    };
    const factory = getFactoryWithTraits();
    const useTraits = (name, ...names) => {
        return getFactoryWithTraits([name, ...names]);
    };
    return Object.assign(Object.assign({}, factory), { use: useTraits });
}
/**
 * Define factory for {@link Page} model.
 *
 * @param options
 * @returns factory {@link PageFactoryInterface}
 */
export function definePageFactory(options) {
    return definePageFactoryInternal(options !== null && options !== void 0 ? options : {});
}
function isTaggedPagespageFactory(x) {
    return (x === null || x === void 0 ? void 0 : x._factoryFor) === "Page";
}
function isTaggedPagestagFactory(x) {
    return (x === null || x === void 0 ? void 0 : x._factoryFor) === "Tag";
}
function autoGenerateTaggedPagesScalarsOrEnums({ seq }) {
    return {};
}
function defineTaggedPagesFactoryInternal({ defaultData: defaultDataResolver, traits: traitsDefs = {} }) {
    const getFactoryWithTraits = (traitKeys = []) => {
        const seqKey = {};
        const getSeq = () => getSequenceCounter(seqKey);
        const screen = createScreener("TaggedPages", modelFieldDefinitions);
        const build = (...args_1) => __awaiter(this, [...args_1], void 0, function* (inputData = {}) {
            const seq = getSeq();
            const requiredScalarData = autoGenerateTaggedPagesScalarsOrEnums({ seq });
            const resolveValue = normalizeResolver(defaultDataResolver !== null && defaultDataResolver !== void 0 ? defaultDataResolver : {});
            const defaultData = yield traitKeys.reduce((queue, traitKey) => __awaiter(this, void 0, void 0, function* () {
                var _a, _b;
                const acc = yield queue;
                const resolveTraitValue = normalizeResolver((_b = (_a = traitsDefs[traitKey]) === null || _a === void 0 ? void 0 : _a.data) !== null && _b !== void 0 ? _b : {});
                const traitData = yield resolveTraitValue({ seq });
                return Object.assign(Object.assign({}, acc), traitData);
            }), resolveValue({ seq }));
            const defaultAssociations = {
                page: isTaggedPagespageFactory(defaultData.page) ? {
                    create: yield defaultData.page.build()
                } : defaultData.page,
                tag: isTaggedPagestagFactory(defaultData.tag) ? {
                    create: yield defaultData.tag.build()
                } : defaultData.tag
            };
            const data = Object.assign(Object.assign(Object.assign(Object.assign({}, requiredScalarData), defaultData), defaultAssociations), inputData);
            return data;
        });
        const buildList = (inputData) => Promise.all(normalizeList(inputData).map(data => build(data)));
        const pickForConnect = (inputData) => ({
            pageId: inputData.pageId,
            tagId: inputData.tagId
        });
        const create = (...args_2) => __awaiter(this, [...args_2], void 0, function* (inputData = {}) {
            const data = yield build(inputData).then(screen);
            return yield getClient().taggedPages.create({ data });
        });
        const createList = (inputData) => Promise.all(normalizeList(inputData).map(data => create(data)));
        const createForConnect = (inputData = {}) => create(inputData).then(pickForConnect);
        return {
            _factoryFor: "TaggedPages",
            build,
            buildList,
            buildCreateInput: build,
            pickForConnect,
            create,
            createList,
            createForConnect,
        };
    };
    const factory = getFactoryWithTraits();
    const useTraits = (name, ...names) => {
        return getFactoryWithTraits([name, ...names]);
    };
    return Object.assign(Object.assign({}, factory), { use: useTraits });
}
/**
 * Define factory for {@link TaggedPages} model.
 *
 * @param options
 * @returns factory {@link TaggedPagesFactoryInterface}
 */
export function defineTaggedPagesFactory(options) {
    return defineTaggedPagesFactoryInternal(options);
}
function autoGeneratePaymentMethodScalarsOrEnums({ seq }) {
    return {
        name: getScalarFieldValueGenerator().String({ modelName: "PaymentMethod", fieldName: "name", isId: false, isUnique: false, seq }),
        slug: getScalarFieldValueGenerator().String({ modelName: "PaymentMethod", fieldName: "slug", isId: false, isUnique: false, seq }),
        description: getScalarFieldValueGenerator().String({ modelName: "PaymentMethod", fieldName: "description", isId: false, isUnique: false, seq }),
        paymentProviderID: getScalarFieldValueGenerator().String({ modelName: "PaymentMethod", fieldName: "paymentProviderID", isId: false, isUnique: false, seq }),
        active: getScalarFieldValueGenerator().Boolean({ modelName: "PaymentMethod", fieldName: "active", isId: false, isUnique: false, seq })
    };
}
function definePaymentMethodFactoryInternal({ defaultData: defaultDataResolver, traits: traitsDefs = {} }) {
    const getFactoryWithTraits = (traitKeys = []) => {
        const seqKey = {};
        const getSeq = () => getSequenceCounter(seqKey);
        const screen = createScreener("PaymentMethod", modelFieldDefinitions);
        const build = (...args_1) => __awaiter(this, [...args_1], void 0, function* (inputData = {}) {
            const seq = getSeq();
            const requiredScalarData = autoGeneratePaymentMethodScalarsOrEnums({ seq });
            const resolveValue = normalizeResolver(defaultDataResolver !== null && defaultDataResolver !== void 0 ? defaultDataResolver : {});
            const defaultData = yield traitKeys.reduce((queue, traitKey) => __awaiter(this, void 0, void 0, function* () {
                var _a, _b;
                const acc = yield queue;
                const resolveTraitValue = normalizeResolver((_b = (_a = traitsDefs[traitKey]) === null || _a === void 0 ? void 0 : _a.data) !== null && _b !== void 0 ? _b : {});
                const traitData = yield resolveTraitValue({ seq });
                return Object.assign(Object.assign({}, acc), traitData);
            }), resolveValue({ seq }));
            const defaultAssociations = {};
            const data = Object.assign(Object.assign(Object.assign(Object.assign({}, requiredScalarData), defaultData), defaultAssociations), inputData);
            return data;
        });
        const buildList = (inputData) => Promise.all(normalizeList(inputData).map(data => build(data)));
        const pickForConnect = (inputData) => ({
            id: inputData.id
        });
        const create = (...args_2) => __awaiter(this, [...args_2], void 0, function* (inputData = {}) {
            const data = yield build(inputData).then(screen);
            return yield getClient().paymentMethod.create({ data });
        });
        const createList = (inputData) => Promise.all(normalizeList(inputData).map(data => create(data)));
        const createForConnect = (inputData = {}) => create(inputData).then(pickForConnect);
        return {
            _factoryFor: "PaymentMethod",
            build,
            buildList,
            buildCreateInput: build,
            pickForConnect,
            create,
            createList,
            createForConnect,
        };
    };
    const factory = getFactoryWithTraits();
    const useTraits = (name, ...names) => {
        return getFactoryWithTraits([name, ...names]);
    };
    return Object.assign(Object.assign({}, factory), { use: useTraits });
}
/**
 * Define factory for {@link PaymentMethod} model.
 *
 * @param options
 * @returns factory {@link PaymentMethodFactoryInterface}
 */
export function definePaymentMethodFactory(options) {
    return definePaymentMethodFactoryInternal(options !== null && options !== void 0 ? options : {});
}
function isPaymentpaymentMethodFactory(x) {
    return (x === null || x === void 0 ? void 0 : x._factoryFor) === "PaymentMethod";
}
function autoGeneratePaymentScalarsOrEnums({ seq }) {
    return {
        invoiceID: getScalarFieldValueGenerator().String({ modelName: "Payment", fieldName: "invoiceID", isId: false, isUnique: false, seq }),
        state: "created"
    };
}
function definePaymentFactoryInternal({ defaultData: defaultDataResolver, traits: traitsDefs = {} }) {
    const getFactoryWithTraits = (traitKeys = []) => {
        const seqKey = {};
        const getSeq = () => getSequenceCounter(seqKey);
        const screen = createScreener("Payment", modelFieldDefinitions);
        const build = (...args_1) => __awaiter(this, [...args_1], void 0, function* (inputData = {}) {
            const seq = getSeq();
            const requiredScalarData = autoGeneratePaymentScalarsOrEnums({ seq });
            const resolveValue = normalizeResolver(defaultDataResolver !== null && defaultDataResolver !== void 0 ? defaultDataResolver : {});
            const defaultData = yield traitKeys.reduce((queue, traitKey) => __awaiter(this, void 0, void 0, function* () {
                var _a, _b;
                const acc = yield queue;
                const resolveTraitValue = normalizeResolver((_b = (_a = traitsDefs[traitKey]) === null || _a === void 0 ? void 0 : _a.data) !== null && _b !== void 0 ? _b : {});
                const traitData = yield resolveTraitValue({ seq });
                return Object.assign(Object.assign({}, acc), traitData);
            }), resolveValue({ seq }));
            const defaultAssociations = {
                paymentMethod: isPaymentpaymentMethodFactory(defaultData.paymentMethod) ? {
                    create: yield defaultData.paymentMethod.build()
                } : defaultData.paymentMethod
            };
            const data = Object.assign(Object.assign(Object.assign(Object.assign({}, requiredScalarData), defaultData), defaultAssociations), inputData);
            return data;
        });
        const buildList = (inputData) => Promise.all(normalizeList(inputData).map(data => build(data)));
        const pickForConnect = (inputData) => ({
            id: inputData.id
        });
        const create = (...args_2) => __awaiter(this, [...args_2], void 0, function* (inputData = {}) {
            const data = yield build(inputData).then(screen);
            return yield getClient().payment.create({ data });
        });
        const createList = (inputData) => Promise.all(normalizeList(inputData).map(data => create(data)));
        const createForConnect = (inputData = {}) => create(inputData).then(pickForConnect);
        return {
            _factoryFor: "Payment",
            build,
            buildList,
            buildCreateInput: build,
            pickForConnect,
            create,
            createList,
            createForConnect,
        };
    };
    const factory = getFactoryWithTraits();
    const useTraits = (name, ...names) => {
        return getFactoryWithTraits([name, ...names]);
    };
    return Object.assign(Object.assign({}, factory), { use: useTraits });
}
/**
 * Define factory for {@link Payment} model.
 *
 * @param options
 * @returns factory {@link PaymentFactoryInterface}
 */
export function definePaymentFactory(options) {
    return definePaymentFactoryInternal(options);
}
function isPeerProfilelogoFactory(x) {
    return (x === null || x === void 0 ? void 0 : x._factoryFor) === "Image";
}
function autoGeneratePeerProfileScalarsOrEnums({ seq }) {
    return {
        name: getScalarFieldValueGenerator().String({ modelName: "PeerProfile", fieldName: "name", isId: false, isUnique: false, seq }),
        themeColor: getScalarFieldValueGenerator().String({ modelName: "PeerProfile", fieldName: "themeColor", isId: false, isUnique: false, seq }),
        themeFontColor: getScalarFieldValueGenerator().String({ modelName: "PeerProfile", fieldName: "themeFontColor", isId: false, isUnique: false, seq }),
        callToActionURL: getScalarFieldValueGenerator().String({ modelName: "PeerProfile", fieldName: "callToActionURL", isId: false, isUnique: false, seq }),
        callToActionText: getScalarFieldValueGenerator().Json({ modelName: "PeerProfile", fieldName: "callToActionText", isId: false, isUnique: false, seq })
    };
}
function definePeerProfileFactoryInternal({ defaultData: defaultDataResolver, traits: traitsDefs = {} }) {
    const getFactoryWithTraits = (traitKeys = []) => {
        const seqKey = {};
        const getSeq = () => getSequenceCounter(seqKey);
        const screen = createScreener("PeerProfile", modelFieldDefinitions);
        const build = (...args_1) => __awaiter(this, [...args_1], void 0, function* (inputData = {}) {
            const seq = getSeq();
            const requiredScalarData = autoGeneratePeerProfileScalarsOrEnums({ seq });
            const resolveValue = normalizeResolver(defaultDataResolver !== null && defaultDataResolver !== void 0 ? defaultDataResolver : {});
            const defaultData = yield traitKeys.reduce((queue, traitKey) => __awaiter(this, void 0, void 0, function* () {
                var _a, _b;
                const acc = yield queue;
                const resolveTraitValue = normalizeResolver((_b = (_a = traitsDefs[traitKey]) === null || _a === void 0 ? void 0 : _a.data) !== null && _b !== void 0 ? _b : {});
                const traitData = yield resolveTraitValue({ seq });
                return Object.assign(Object.assign({}, acc), traitData);
            }), resolveValue({ seq }));
            const defaultAssociations = {
                logo: isPeerProfilelogoFactory(defaultData.logo) ? {
                    create: yield defaultData.logo.build()
                } : defaultData.logo
            };
            const data = Object.assign(Object.assign(Object.assign(Object.assign({}, requiredScalarData), defaultData), defaultAssociations), inputData);
            return data;
        });
        const buildList = (inputData) => Promise.all(normalizeList(inputData).map(data => build(data)));
        const pickForConnect = (inputData) => ({
            id: inputData.id
        });
        const create = (...args_2) => __awaiter(this, [...args_2], void 0, function* (inputData = {}) {
            const data = yield build(inputData).then(screen);
            return yield getClient().peerProfile.create({ data });
        });
        const createList = (inputData) => Promise.all(normalizeList(inputData).map(data => create(data)));
        const createForConnect = (inputData = {}) => create(inputData).then(pickForConnect);
        return {
            _factoryFor: "PeerProfile",
            build,
            buildList,
            buildCreateInput: build,
            pickForConnect,
            create,
            createList,
            createForConnect,
        };
    };
    const factory = getFactoryWithTraits();
    const useTraits = (name, ...names) => {
        return getFactoryWithTraits([name, ...names]);
    };
    return Object.assign(Object.assign({}, factory), { use: useTraits });
}
/**
 * Define factory for {@link PeerProfile} model.
 *
 * @param options
 * @returns factory {@link PeerProfileFactoryInterface}
 */
export function definePeerProfileFactory(options) {
    return definePeerProfileFactoryInternal(options !== null && options !== void 0 ? options : {});
}
function autoGeneratePeerScalarsOrEnums({ seq }) {
    return {
        name: getScalarFieldValueGenerator().String({ modelName: "Peer", fieldName: "name", isId: false, isUnique: false, seq }),
        slug: getScalarFieldValueGenerator().String({ modelName: "Peer", fieldName: "slug", isId: false, isUnique: true, seq }),
        hostURL: getScalarFieldValueGenerator().String({ modelName: "Peer", fieldName: "hostURL", isId: false, isUnique: false, seq }),
        token: getScalarFieldValueGenerator().String({ modelName: "Peer", fieldName: "token", isId: false, isUnique: false, seq })
    };
}
function definePeerFactoryInternal({ defaultData: defaultDataResolver, traits: traitsDefs = {} }) {
    const getFactoryWithTraits = (traitKeys = []) => {
        const seqKey = {};
        const getSeq = () => getSequenceCounter(seqKey);
        const screen = createScreener("Peer", modelFieldDefinitions);
        const build = (...args_1) => __awaiter(this, [...args_1], void 0, function* (inputData = {}) {
            const seq = getSeq();
            const requiredScalarData = autoGeneratePeerScalarsOrEnums({ seq });
            const resolveValue = normalizeResolver(defaultDataResolver !== null && defaultDataResolver !== void 0 ? defaultDataResolver : {});
            const defaultData = yield traitKeys.reduce((queue, traitKey) => __awaiter(this, void 0, void 0, function* () {
                var _a, _b;
                const acc = yield queue;
                const resolveTraitValue = normalizeResolver((_b = (_a = traitsDefs[traitKey]) === null || _a === void 0 ? void 0 : _a.data) !== null && _b !== void 0 ? _b : {});
                const traitData = yield resolveTraitValue({ seq });
                return Object.assign(Object.assign({}, acc), traitData);
            }), resolveValue({ seq }));
            const defaultAssociations = {};
            const data = Object.assign(Object.assign(Object.assign(Object.assign({}, requiredScalarData), defaultData), defaultAssociations), inputData);
            return data;
        });
        const buildList = (inputData) => Promise.all(normalizeList(inputData).map(data => build(data)));
        const pickForConnect = (inputData) => ({
            id: inputData.id
        });
        const create = (...args_2) => __awaiter(this, [...args_2], void 0, function* (inputData = {}) {
            const data = yield build(inputData).then(screen);
            return yield getClient().peer.create({ data });
        });
        const createList = (inputData) => Promise.all(normalizeList(inputData).map(data => create(data)));
        const createForConnect = (inputData = {}) => create(inputData).then(pickForConnect);
        return {
            _factoryFor: "Peer",
            build,
            buildList,
            buildCreateInput: build,
            pickForConnect,
            create,
            createList,
            createForConnect,
        };
    };
    const factory = getFactoryWithTraits();
    const useTraits = (name, ...names) => {
        return getFactoryWithTraits([name, ...names]);
    };
    return Object.assign(Object.assign({}, factory), { use: useTraits });
}
/**
 * Define factory for {@link Peer} model.
 *
 * @param options
 * @returns factory {@link PeerFactoryInterface}
 */
export function definePeerFactory(options) {
    return definePeerFactoryInternal(options !== null && options !== void 0 ? options : {});
}
function autoGenerateTokenScalarsOrEnums({ seq }) {
    return {
        name: getScalarFieldValueGenerator().String({ modelName: "Token", fieldName: "name", isId: false, isUnique: true, seq }),
        token: getScalarFieldValueGenerator().String({ modelName: "Token", fieldName: "token", isId: false, isUnique: false, seq })
    };
}
function defineTokenFactoryInternal({ defaultData: defaultDataResolver, traits: traitsDefs = {} }) {
    const getFactoryWithTraits = (traitKeys = []) => {
        const seqKey = {};
        const getSeq = () => getSequenceCounter(seqKey);
        const screen = createScreener("Token", modelFieldDefinitions);
        const build = (...args_1) => __awaiter(this, [...args_1], void 0, function* (inputData = {}) {
            const seq = getSeq();
            const requiredScalarData = autoGenerateTokenScalarsOrEnums({ seq });
            const resolveValue = normalizeResolver(defaultDataResolver !== null && defaultDataResolver !== void 0 ? defaultDataResolver : {});
            const defaultData = yield traitKeys.reduce((queue, traitKey) => __awaiter(this, void 0, void 0, function* () {
                var _a, _b;
                const acc = yield queue;
                const resolveTraitValue = normalizeResolver((_b = (_a = traitsDefs[traitKey]) === null || _a === void 0 ? void 0 : _a.data) !== null && _b !== void 0 ? _b : {});
                const traitData = yield resolveTraitValue({ seq });
                return Object.assign(Object.assign({}, acc), traitData);
            }), resolveValue({ seq }));
            const defaultAssociations = {};
            const data = Object.assign(Object.assign(Object.assign(Object.assign({}, requiredScalarData), defaultData), defaultAssociations), inputData);
            return data;
        });
        const buildList = (inputData) => Promise.all(normalizeList(inputData).map(data => build(data)));
        const pickForConnect = (inputData) => ({
            id: inputData.id
        });
        const create = (...args_2) => __awaiter(this, [...args_2], void 0, function* (inputData = {}) {
            const data = yield build(inputData).then(screen);
            return yield getClient().token.create({ data });
        });
        const createList = (inputData) => Promise.all(normalizeList(inputData).map(data => create(data)));
        const createForConnect = (inputData = {}) => create(inputData).then(pickForConnect);
        return {
            _factoryFor: "Token",
            build,
            buildList,
            buildCreateInput: build,
            pickForConnect,
            create,
            createList,
            createForConnect,
        };
    };
    const factory = getFactoryWithTraits();
    const useTraits = (name, ...names) => {
        return getFactoryWithTraits([name, ...names]);
    };
    return Object.assign(Object.assign({}, factory), { use: useTraits });
}
/**
 * Define factory for {@link Token} model.
 *
 * @param options
 * @returns factory {@link TokenFactoryInterface}
 */
export function defineTokenFactory(options) {
    return defineTokenFactoryInternal(options !== null && options !== void 0 ? options : {});
}
function isSessionuserFactory(x) {
    return (x === null || x === void 0 ? void 0 : x._factoryFor) === "User";
}
function autoGenerateSessionScalarsOrEnums({ seq }) {
    return {
        expiresAt: getScalarFieldValueGenerator().DateTime({ modelName: "Session", fieldName: "expiresAt", isId: false, isUnique: false, seq }),
        token: getScalarFieldValueGenerator().String({ modelName: "Session", fieldName: "token", isId: false, isUnique: true, seq })
    };
}
function defineSessionFactoryInternal({ defaultData: defaultDataResolver, traits: traitsDefs = {} }) {
    const getFactoryWithTraits = (traitKeys = []) => {
        const seqKey = {};
        const getSeq = () => getSequenceCounter(seqKey);
        const screen = createScreener("Session", modelFieldDefinitions);
        const build = (...args_1) => __awaiter(this, [...args_1], void 0, function* (inputData = {}) {
            const seq = getSeq();
            const requiredScalarData = autoGenerateSessionScalarsOrEnums({ seq });
            const resolveValue = normalizeResolver(defaultDataResolver !== null && defaultDataResolver !== void 0 ? defaultDataResolver : {});
            const defaultData = yield traitKeys.reduce((queue, traitKey) => __awaiter(this, void 0, void 0, function* () {
                var _a, _b;
                const acc = yield queue;
                const resolveTraitValue = normalizeResolver((_b = (_a = traitsDefs[traitKey]) === null || _a === void 0 ? void 0 : _a.data) !== null && _b !== void 0 ? _b : {});
                const traitData = yield resolveTraitValue({ seq });
                return Object.assign(Object.assign({}, acc), traitData);
            }), resolveValue({ seq }));
            const defaultAssociations = {
                user: isSessionuserFactory(defaultData.user) ? {
                    create: yield defaultData.user.build()
                } : defaultData.user
            };
            const data = Object.assign(Object.assign(Object.assign(Object.assign({}, requiredScalarData), defaultData), defaultAssociations), inputData);
            return data;
        });
        const buildList = (inputData) => Promise.all(normalizeList(inputData).map(data => build(data)));
        const pickForConnect = (inputData) => ({
            id: inputData.id
        });
        const create = (...args_2) => __awaiter(this, [...args_2], void 0, function* (inputData = {}) {
            const data = yield build(inputData).then(screen);
            return yield getClient().session.create({ data });
        });
        const createList = (inputData) => Promise.all(normalizeList(inputData).map(data => create(data)));
        const createForConnect = (inputData = {}) => create(inputData).then(pickForConnect);
        return {
            _factoryFor: "Session",
            build,
            buildList,
            buildCreateInput: build,
            pickForConnect,
            create,
            createList,
            createForConnect,
        };
    };
    const factory = getFactoryWithTraits();
    const useTraits = (name, ...names) => {
        return getFactoryWithTraits([name, ...names]);
    };
    return Object.assign(Object.assign({}, factory), { use: useTraits });
}
/**
 * Define factory for {@link Session} model.
 *
 * @param options
 * @returns factory {@link SessionFactoryInterface}
 */
export function defineSessionFactory(options) {
    return defineSessionFactoryInternal(options);
}
function isSubscriptionPeriodinvoiceFactory(x) {
    return (x === null || x === void 0 ? void 0 : x._factoryFor) === "Invoice";
}
function isSubscriptionPeriodsubscriptionFactory(x) {
    return (x === null || x === void 0 ? void 0 : x._factoryFor) === "Subscription";
}
function autoGenerateSubscriptionPeriodScalarsOrEnums({ seq }) {
    return {
        startsAt: getScalarFieldValueGenerator().DateTime({ modelName: "SubscriptionPeriod", fieldName: "startsAt", isId: false, isUnique: false, seq }),
        endsAt: getScalarFieldValueGenerator().DateTime({ modelName: "SubscriptionPeriod", fieldName: "endsAt", isId: false, isUnique: false, seq }),
        paymentPeriodicity: "monthly",
        amount: getScalarFieldValueGenerator().Float({ modelName: "SubscriptionPeriod", fieldName: "amount", isId: false, isUnique: false, seq })
    };
}
function defineSubscriptionPeriodFactoryInternal({ defaultData: defaultDataResolver, traits: traitsDefs = {} }) {
    const getFactoryWithTraits = (traitKeys = []) => {
        const seqKey = {};
        const getSeq = () => getSequenceCounter(seqKey);
        const screen = createScreener("SubscriptionPeriod", modelFieldDefinitions);
        const build = (...args_1) => __awaiter(this, [...args_1], void 0, function* (inputData = {}) {
            const seq = getSeq();
            const requiredScalarData = autoGenerateSubscriptionPeriodScalarsOrEnums({ seq });
            const resolveValue = normalizeResolver(defaultDataResolver !== null && defaultDataResolver !== void 0 ? defaultDataResolver : {});
            const defaultData = yield traitKeys.reduce((queue, traitKey) => __awaiter(this, void 0, void 0, function* () {
                var _a, _b;
                const acc = yield queue;
                const resolveTraitValue = normalizeResolver((_b = (_a = traitsDefs[traitKey]) === null || _a === void 0 ? void 0 : _a.data) !== null && _b !== void 0 ? _b : {});
                const traitData = yield resolveTraitValue({ seq });
                return Object.assign(Object.assign({}, acc), traitData);
            }), resolveValue({ seq }));
            const defaultAssociations = {
                invoice: isSubscriptionPeriodinvoiceFactory(defaultData.invoice) ? {
                    create: yield defaultData.invoice.build()
                } : defaultData.invoice,
                subscription: isSubscriptionPeriodsubscriptionFactory(defaultData.subscription) ? {
                    create: yield defaultData.subscription.build()
                } : defaultData.subscription
            };
            const data = Object.assign(Object.assign(Object.assign(Object.assign({}, requiredScalarData), defaultData), defaultAssociations), inputData);
            return data;
        });
        const buildList = (inputData) => Promise.all(normalizeList(inputData).map(data => build(data)));
        const pickForConnect = (inputData) => ({
            id: inputData.id
        });
        const create = (...args_2) => __awaiter(this, [...args_2], void 0, function* (inputData = {}) {
            const data = yield build(inputData).then(screen);
            return yield getClient().subscriptionPeriod.create({ data });
        });
        const createList = (inputData) => Promise.all(normalizeList(inputData).map(data => create(data)));
        const createForConnect = (inputData = {}) => create(inputData).then(pickForConnect);
        return {
            _factoryFor: "SubscriptionPeriod",
            build,
            buildList,
            buildCreateInput: build,
            pickForConnect,
            create,
            createList,
            createForConnect,
        };
    };
    const factory = getFactoryWithTraits();
    const useTraits = (name, ...names) => {
        return getFactoryWithTraits([name, ...names]);
    };
    return Object.assign(Object.assign({}, factory), { use: useTraits });
}
/**
 * Define factory for {@link SubscriptionPeriod} model.
 *
 * @param options
 * @returns factory {@link SubscriptionPeriodFactoryInterface}
 */
export function defineSubscriptionPeriodFactory(options) {
    return defineSubscriptionPeriodFactoryInternal(options);
}
function isSubscriptionDeactivationsubscriptionFactory(x) {
    return (x === null || x === void 0 ? void 0 : x._factoryFor) === "Subscription";
}
function autoGenerateSubscriptionDeactivationScalarsOrEnums({ seq }) {
    return {
        date: getScalarFieldValueGenerator().DateTime({ modelName: "SubscriptionDeactivation", fieldName: "date", isId: false, isUnique: false, seq }),
        reason: "none"
    };
}
function defineSubscriptionDeactivationFactoryInternal({ defaultData: defaultDataResolver, traits: traitsDefs = {} }) {
    const getFactoryWithTraits = (traitKeys = []) => {
        const seqKey = {};
        const getSeq = () => getSequenceCounter(seqKey);
        const screen = createScreener("SubscriptionDeactivation", modelFieldDefinitions);
        const build = (...args_1) => __awaiter(this, [...args_1], void 0, function* (inputData = {}) {
            const seq = getSeq();
            const requiredScalarData = autoGenerateSubscriptionDeactivationScalarsOrEnums({ seq });
            const resolveValue = normalizeResolver(defaultDataResolver !== null && defaultDataResolver !== void 0 ? defaultDataResolver : {});
            const defaultData = yield traitKeys.reduce((queue, traitKey) => __awaiter(this, void 0, void 0, function* () {
                var _a, _b;
                const acc = yield queue;
                const resolveTraitValue = normalizeResolver((_b = (_a = traitsDefs[traitKey]) === null || _a === void 0 ? void 0 : _a.data) !== null && _b !== void 0 ? _b : {});
                const traitData = yield resolveTraitValue({ seq });
                return Object.assign(Object.assign({}, acc), traitData);
            }), resolveValue({ seq }));
            const defaultAssociations = {
                subscription: isSubscriptionDeactivationsubscriptionFactory(defaultData.subscription) ? {
                    create: yield defaultData.subscription.build()
                } : defaultData.subscription
            };
            const data = Object.assign(Object.assign(Object.assign(Object.assign({}, requiredScalarData), defaultData), defaultAssociations), inputData);
            return data;
        });
        const buildList = (inputData) => Promise.all(normalizeList(inputData).map(data => build(data)));
        const pickForConnect = (inputData) => ({
            id: inputData.id
        });
        const create = (...args_2) => __awaiter(this, [...args_2], void 0, function* (inputData = {}) {
            const data = yield build(inputData).then(screen);
            return yield getClient().subscriptionDeactivation.create({ data });
        });
        const createList = (inputData) => Promise.all(normalizeList(inputData).map(data => create(data)));
        const createForConnect = (inputData = {}) => create(inputData).then(pickForConnect);
        return {
            _factoryFor: "SubscriptionDeactivation",
            build,
            buildList,
            buildCreateInput: build,
            pickForConnect,
            create,
            createList,
            createForConnect,
        };
    };
    const factory = getFactoryWithTraits();
    const useTraits = (name, ...names) => {
        return getFactoryWithTraits([name, ...names]);
    };
    return Object.assign(Object.assign({}, factory), { use: useTraits });
}
/**
 * Define factory for {@link SubscriptionDeactivation} model.
 *
 * @param options
 * @returns factory {@link SubscriptionDeactivationFactoryInterface}
 */
export function defineSubscriptionDeactivationFactory(options) {
    return defineSubscriptionDeactivationFactoryInternal(options);
}
function isSubscriptiondeactivationFactory(x) {
    return (x === null || x === void 0 ? void 0 : x._factoryFor) === "SubscriptionDeactivation";
}
function isSubscriptionpaymentMethodFactory(x) {
    return (x === null || x === void 0 ? void 0 : x._factoryFor) === "PaymentMethod";
}
function isSubscriptionmemberPlanFactory(x) {
    return (x === null || x === void 0 ? void 0 : x._factoryFor) === "MemberPlan";
}
function isSubscriptionuserFactory(x) {
    return (x === null || x === void 0 ? void 0 : x._factoryFor) === "User";
}
function autoGenerateSubscriptionScalarsOrEnums({ seq }) {
    return {
        paymentPeriodicity: "monthly",
        monthlyAmount: getScalarFieldValueGenerator().Float({ modelName: "Subscription", fieldName: "monthlyAmount", isId: false, isUnique: false, seq }),
        autoRenew: getScalarFieldValueGenerator().Boolean({ modelName: "Subscription", fieldName: "autoRenew", isId: false, isUnique: false, seq }),
        startsAt: getScalarFieldValueGenerator().DateTime({ modelName: "Subscription", fieldName: "startsAt", isId: false, isUnique: false, seq })
    };
}
function defineSubscriptionFactoryInternal({ defaultData: defaultDataResolver, traits: traitsDefs = {} }) {
    const getFactoryWithTraits = (traitKeys = []) => {
        const seqKey = {};
        const getSeq = () => getSequenceCounter(seqKey);
        const screen = createScreener("Subscription", modelFieldDefinitions);
        const build = (...args_1) => __awaiter(this, [...args_1], void 0, function* (inputData = {}) {
            const seq = getSeq();
            const requiredScalarData = autoGenerateSubscriptionScalarsOrEnums({ seq });
            const resolveValue = normalizeResolver(defaultDataResolver !== null && defaultDataResolver !== void 0 ? defaultDataResolver : {});
            const defaultData = yield traitKeys.reduce((queue, traitKey) => __awaiter(this, void 0, void 0, function* () {
                var _a, _b;
                const acc = yield queue;
                const resolveTraitValue = normalizeResolver((_b = (_a = traitsDefs[traitKey]) === null || _a === void 0 ? void 0 : _a.data) !== null && _b !== void 0 ? _b : {});
                const traitData = yield resolveTraitValue({ seq });
                return Object.assign(Object.assign({}, acc), traitData);
            }), resolveValue({ seq }));
            const defaultAssociations = {
                deactivation: isSubscriptiondeactivationFactory(defaultData.deactivation) ? {
                    create: yield defaultData.deactivation.build()
                } : defaultData.deactivation,
                paymentMethod: isSubscriptionpaymentMethodFactory(defaultData.paymentMethod) ? {
                    create: yield defaultData.paymentMethod.build()
                } : defaultData.paymentMethod,
                memberPlan: isSubscriptionmemberPlanFactory(defaultData.memberPlan) ? {
                    create: yield defaultData.memberPlan.build()
                } : defaultData.memberPlan,
                user: isSubscriptionuserFactory(defaultData.user) ? {
                    create: yield defaultData.user.build()
                } : defaultData.user
            };
            const data = Object.assign(Object.assign(Object.assign(Object.assign({}, requiredScalarData), defaultData), defaultAssociations), inputData);
            return data;
        });
        const buildList = (inputData) => Promise.all(normalizeList(inputData).map(data => build(data)));
        const pickForConnect = (inputData) => ({
            id: inputData.id
        });
        const create = (...args_2) => __awaiter(this, [...args_2], void 0, function* (inputData = {}) {
            const data = yield build(inputData).then(screen);
            return yield getClient().subscription.create({ data });
        });
        const createList = (inputData) => Promise.all(normalizeList(inputData).map(data => create(data)));
        const createForConnect = (inputData = {}) => create(inputData).then(pickForConnect);
        return {
            _factoryFor: "Subscription",
            build,
            buildList,
            buildCreateInput: build,
            pickForConnect,
            create,
            createList,
            createForConnect,
        };
    };
    const factory = getFactoryWithTraits();
    const useTraits = (name, ...names) => {
        return getFactoryWithTraits([name, ...names]);
    };
    return Object.assign(Object.assign({}, factory), { use: useTraits });
}
/**
 * Define factory for {@link Subscription} model.
 *
 * @param options
 * @returns factory {@link SubscriptionFactoryInterface}
 */
export function defineSubscriptionFactory(options) {
    return defineSubscriptionFactoryInternal(options);
}
function isUserAddressUserFactory(x) {
    return (x === null || x === void 0 ? void 0 : x._factoryFor) === "User";
}
function autoGenerateUserAddressScalarsOrEnums({ seq }) {
    return {};
}
function defineUserAddressFactoryInternal({ defaultData: defaultDataResolver, traits: traitsDefs = {} }) {
    const getFactoryWithTraits = (traitKeys = []) => {
        const seqKey = {};
        const getSeq = () => getSequenceCounter(seqKey);
        const screen = createScreener("UserAddress", modelFieldDefinitions);
        const build = (...args_1) => __awaiter(this, [...args_1], void 0, function* (inputData = {}) {
            const seq = getSeq();
            const requiredScalarData = autoGenerateUserAddressScalarsOrEnums({ seq });
            const resolveValue = normalizeResolver(defaultDataResolver !== null && defaultDataResolver !== void 0 ? defaultDataResolver : {});
            const defaultData = yield traitKeys.reduce((queue, traitKey) => __awaiter(this, void 0, void 0, function* () {
                var _a, _b;
                const acc = yield queue;
                const resolveTraitValue = normalizeResolver((_b = (_a = traitsDefs[traitKey]) === null || _a === void 0 ? void 0 : _a.data) !== null && _b !== void 0 ? _b : {});
                const traitData = yield resolveTraitValue({ seq });
                return Object.assign(Object.assign({}, acc), traitData);
            }), resolveValue({ seq }));
            const defaultAssociations = {
                User: isUserAddressUserFactory(defaultData.User) ? {
                    create: yield defaultData.User.build()
                } : defaultData.User
            };
            const data = Object.assign(Object.assign(Object.assign(Object.assign({}, requiredScalarData), defaultData), defaultAssociations), inputData);
            return data;
        });
        const buildList = (inputData) => Promise.all(normalizeList(inputData).map(data => build(data)));
        const pickForConnect = (inputData) => ({
            userId: inputData.userId
        });
        const create = (...args_2) => __awaiter(this, [...args_2], void 0, function* (inputData = {}) {
            const data = yield build(inputData).then(screen);
            return yield getClient().userAddress.create({ data });
        });
        const createList = (inputData) => Promise.all(normalizeList(inputData).map(data => create(data)));
        const createForConnect = (inputData = {}) => create(inputData).then(pickForConnect);
        return {
            _factoryFor: "UserAddress",
            build,
            buildList,
            buildCreateInput: build,
            pickForConnect,
            create,
            createList,
            createForConnect,
        };
    };
    const factory = getFactoryWithTraits();
    const useTraits = (name, ...names) => {
        return getFactoryWithTraits([name, ...names]);
    };
    return Object.assign(Object.assign({}, factory), { use: useTraits });
}
/**
 * Define factory for {@link UserAddress} model.
 *
 * @param options
 * @returns factory {@link UserAddressFactoryInterface}
 */
export function defineUserAddressFactory(options) {
    return defineUserAddressFactoryInternal(options);
}
function isUserOAuth2AccountUserFactory(x) {
    return (x === null || x === void 0 ? void 0 : x._factoryFor) === "User";
}
function autoGenerateUserOAuth2AccountScalarsOrEnums({ seq }) {
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
function defineUserOAuth2AccountFactoryInternal({ defaultData: defaultDataResolver, traits: traitsDefs = {} }) {
    const getFactoryWithTraits = (traitKeys = []) => {
        const seqKey = {};
        const getSeq = () => getSequenceCounter(seqKey);
        const screen = createScreener("UserOAuth2Account", modelFieldDefinitions);
        const build = (...args_1) => __awaiter(this, [...args_1], void 0, function* (inputData = {}) {
            const seq = getSeq();
            const requiredScalarData = autoGenerateUserOAuth2AccountScalarsOrEnums({ seq });
            const resolveValue = normalizeResolver(defaultDataResolver !== null && defaultDataResolver !== void 0 ? defaultDataResolver : {});
            const defaultData = yield traitKeys.reduce((queue, traitKey) => __awaiter(this, void 0, void 0, function* () {
                var _a, _b;
                const acc = yield queue;
                const resolveTraitValue = normalizeResolver((_b = (_a = traitsDefs[traitKey]) === null || _a === void 0 ? void 0 : _a.data) !== null && _b !== void 0 ? _b : {});
                const traitData = yield resolveTraitValue({ seq });
                return Object.assign(Object.assign({}, acc), traitData);
            }), resolveValue({ seq }));
            const defaultAssociations = {
                User: isUserOAuth2AccountUserFactory(defaultData.User) ? {
                    create: yield defaultData.User.build()
                } : defaultData.User
            };
            const data = Object.assign(Object.assign(Object.assign(Object.assign({}, requiredScalarData), defaultData), defaultAssociations), inputData);
            return data;
        });
        const buildList = (inputData) => Promise.all(normalizeList(inputData).map(data => build(data)));
        const pickForConnect = (inputData) => ({
            id: inputData.id
        });
        const create = (...args_2) => __awaiter(this, [...args_2], void 0, function* (inputData = {}) {
            const data = yield build(inputData).then(screen);
            return yield getClient().userOAuth2Account.create({ data });
        });
        const createList = (inputData) => Promise.all(normalizeList(inputData).map(data => create(data)));
        const createForConnect = (inputData = {}) => create(inputData).then(pickForConnect);
        return {
            _factoryFor: "UserOAuth2Account",
            build,
            buildList,
            buildCreateInput: build,
            pickForConnect,
            create,
            createList,
            createForConnect,
        };
    };
    const factory = getFactoryWithTraits();
    const useTraits = (name, ...names) => {
        return getFactoryWithTraits([name, ...names]);
    };
    return Object.assign(Object.assign({}, factory), { use: useTraits });
}
/**
 * Define factory for {@link UserOAuth2Account} model.
 *
 * @param options
 * @returns factory {@link UserOAuth2AccountFactoryInterface}
 */
export function defineUserOAuth2AccountFactory(options) {
    return defineUserOAuth2AccountFactoryInternal(options !== null && options !== void 0 ? options : {});
}
function isPaymentProviderCustomerUserFactory(x) {
    return (x === null || x === void 0 ? void 0 : x._factoryFor) === "User";
}
function autoGeneratePaymentProviderCustomerScalarsOrEnums({ seq }) {
    return {
        paymentProviderID: getScalarFieldValueGenerator().String({ modelName: "PaymentProviderCustomer", fieldName: "paymentProviderID", isId: false, isUnique: false, seq }),
        customerID: getScalarFieldValueGenerator().String({ modelName: "PaymentProviderCustomer", fieldName: "customerID", isId: false, isUnique: false, seq })
    };
}
function definePaymentProviderCustomerFactoryInternal({ defaultData: defaultDataResolver, traits: traitsDefs = {} }) {
    const getFactoryWithTraits = (traitKeys = []) => {
        const seqKey = {};
        const getSeq = () => getSequenceCounter(seqKey);
        const screen = createScreener("PaymentProviderCustomer", modelFieldDefinitions);
        const build = (...args_1) => __awaiter(this, [...args_1], void 0, function* (inputData = {}) {
            const seq = getSeq();
            const requiredScalarData = autoGeneratePaymentProviderCustomerScalarsOrEnums({ seq });
            const resolveValue = normalizeResolver(defaultDataResolver !== null && defaultDataResolver !== void 0 ? defaultDataResolver : {});
            const defaultData = yield traitKeys.reduce((queue, traitKey) => __awaiter(this, void 0, void 0, function* () {
                var _a, _b;
                const acc = yield queue;
                const resolveTraitValue = normalizeResolver((_b = (_a = traitsDefs[traitKey]) === null || _a === void 0 ? void 0 : _a.data) !== null && _b !== void 0 ? _b : {});
                const traitData = yield resolveTraitValue({ seq });
                return Object.assign(Object.assign({}, acc), traitData);
            }), resolveValue({ seq }));
            const defaultAssociations = {
                User: isPaymentProviderCustomerUserFactory(defaultData.User) ? {
                    create: yield defaultData.User.build()
                } : defaultData.User
            };
            const data = Object.assign(Object.assign(Object.assign(Object.assign({}, requiredScalarData), defaultData), defaultAssociations), inputData);
            return data;
        });
        const buildList = (inputData) => Promise.all(normalizeList(inputData).map(data => build(data)));
        const pickForConnect = (inputData) => ({
            id: inputData.id
        });
        const create = (...args_2) => __awaiter(this, [...args_2], void 0, function* (inputData = {}) {
            const data = yield build(inputData).then(screen);
            return yield getClient().paymentProviderCustomer.create({ data });
        });
        const createList = (inputData) => Promise.all(normalizeList(inputData).map(data => create(data)));
        const createForConnect = (inputData = {}) => create(inputData).then(pickForConnect);
        return {
            _factoryFor: "PaymentProviderCustomer",
            build,
            buildList,
            buildCreateInput: build,
            pickForConnect,
            create,
            createList,
            createForConnect,
        };
    };
    const factory = getFactoryWithTraits();
    const useTraits = (name, ...names) => {
        return getFactoryWithTraits([name, ...names]);
    };
    return Object.assign(Object.assign({}, factory), { use: useTraits });
}
/**
 * Define factory for {@link PaymentProviderCustomer} model.
 *
 * @param options
 * @returns factory {@link PaymentProviderCustomerFactoryInterface}
 */
export function definePaymentProviderCustomerFactory(options) {
    return definePaymentProviderCustomerFactoryInternal(options !== null && options !== void 0 ? options : {});
}
function isUseruserImageFactory(x) {
    return (x === null || x === void 0 ? void 0 : x._factoryFor) === "Image";
}
function isUseraddressFactory(x) {
    return (x === null || x === void 0 ? void 0 : x._factoryFor) === "UserAddress";
}
function autoGenerateUserScalarsOrEnums({ seq }) {
    return {
        email: getScalarFieldValueGenerator().String({ modelName: "User", fieldName: "email", isId: false, isUnique: true, seq }),
        name: getScalarFieldValueGenerator().String({ modelName: "User", fieldName: "name", isId: false, isUnique: false, seq }),
        password: getScalarFieldValueGenerator().String({ modelName: "User", fieldName: "password", isId: false, isUnique: false, seq }),
        active: getScalarFieldValueGenerator().Boolean({ modelName: "User", fieldName: "active", isId: false, isUnique: false, seq })
    };
}
function defineUserFactoryInternal({ defaultData: defaultDataResolver, traits: traitsDefs = {} }) {
    const getFactoryWithTraits = (traitKeys = []) => {
        const seqKey = {};
        const getSeq = () => getSequenceCounter(seqKey);
        const screen = createScreener("User", modelFieldDefinitions);
        const build = (...args_1) => __awaiter(this, [...args_1], void 0, function* (inputData = {}) {
            const seq = getSeq();
            const requiredScalarData = autoGenerateUserScalarsOrEnums({ seq });
            const resolveValue = normalizeResolver(defaultDataResolver !== null && defaultDataResolver !== void 0 ? defaultDataResolver : {});
            const defaultData = yield traitKeys.reduce((queue, traitKey) => __awaiter(this, void 0, void 0, function* () {
                var _a, _b;
                const acc = yield queue;
                const resolveTraitValue = normalizeResolver((_b = (_a = traitsDefs[traitKey]) === null || _a === void 0 ? void 0 : _a.data) !== null && _b !== void 0 ? _b : {});
                const traitData = yield resolveTraitValue({ seq });
                return Object.assign(Object.assign({}, acc), traitData);
            }), resolveValue({ seq }));
            const defaultAssociations = {
                userImage: isUseruserImageFactory(defaultData.userImage) ? {
                    create: yield defaultData.userImage.build()
                } : defaultData.userImage,
                address: isUseraddressFactory(defaultData.address) ? {
                    create: yield defaultData.address.build()
                } : defaultData.address
            };
            const data = Object.assign(Object.assign(Object.assign(Object.assign({}, requiredScalarData), defaultData), defaultAssociations), inputData);
            return data;
        });
        const buildList = (inputData) => Promise.all(normalizeList(inputData).map(data => build(data)));
        const pickForConnect = (inputData) => ({
            id: inputData.id
        });
        const create = (...args_2) => __awaiter(this, [...args_2], void 0, function* (inputData = {}) {
            const data = yield build(inputData).then(screen);
            return yield getClient().user.create({ data });
        });
        const createList = (inputData) => Promise.all(normalizeList(inputData).map(data => create(data)));
        const createForConnect = (inputData = {}) => create(inputData).then(pickForConnect);
        return {
            _factoryFor: "User",
            build,
            buildList,
            buildCreateInput: build,
            pickForConnect,
            create,
            createList,
            createForConnect,
        };
    };
    const factory = getFactoryWithTraits();
    const useTraits = (name, ...names) => {
        return getFactoryWithTraits([name, ...names]);
    };
    return Object.assign(Object.assign({}, factory), { use: useTraits });
}
/**
 * Define factory for {@link User} model.
 *
 * @param options
 * @returns factory {@link UserFactoryInterface}
 */
export function defineUserFactory(options) {
    return defineUserFactoryInternal(options !== null && options !== void 0 ? options : {});
}
function autoGenerateUserRoleScalarsOrEnums({ seq }) {
    return {
        name: getScalarFieldValueGenerator().String({ modelName: "UserRole", fieldName: "name", isId: false, isUnique: true, seq }),
        systemRole: getScalarFieldValueGenerator().Boolean({ modelName: "UserRole", fieldName: "systemRole", isId: false, isUnique: false, seq })
    };
}
function defineUserRoleFactoryInternal({ defaultData: defaultDataResolver, traits: traitsDefs = {} }) {
    const getFactoryWithTraits = (traitKeys = []) => {
        const seqKey = {};
        const getSeq = () => getSequenceCounter(seqKey);
        const screen = createScreener("UserRole", modelFieldDefinitions);
        const build = (...args_1) => __awaiter(this, [...args_1], void 0, function* (inputData = {}) {
            const seq = getSeq();
            const requiredScalarData = autoGenerateUserRoleScalarsOrEnums({ seq });
            const resolveValue = normalizeResolver(defaultDataResolver !== null && defaultDataResolver !== void 0 ? defaultDataResolver : {});
            const defaultData = yield traitKeys.reduce((queue, traitKey) => __awaiter(this, void 0, void 0, function* () {
                var _a, _b;
                const acc = yield queue;
                const resolveTraitValue = normalizeResolver((_b = (_a = traitsDefs[traitKey]) === null || _a === void 0 ? void 0 : _a.data) !== null && _b !== void 0 ? _b : {});
                const traitData = yield resolveTraitValue({ seq });
                return Object.assign(Object.assign({}, acc), traitData);
            }), resolveValue({ seq }));
            const defaultAssociations = {};
            const data = Object.assign(Object.assign(Object.assign(Object.assign({}, requiredScalarData), defaultData), defaultAssociations), inputData);
            return data;
        });
        const buildList = (inputData) => Promise.all(normalizeList(inputData).map(data => build(data)));
        const pickForConnect = (inputData) => ({
            id: inputData.id
        });
        const create = (...args_2) => __awaiter(this, [...args_2], void 0, function* (inputData = {}) {
            const data = yield build(inputData).then(screen);
            return yield getClient().userRole.create({ data });
        });
        const createList = (inputData) => Promise.all(normalizeList(inputData).map(data => create(data)));
        const createForConnect = (inputData = {}) => create(inputData).then(pickForConnect);
        return {
            _factoryFor: "UserRole",
            build,
            buildList,
            buildCreateInput: build,
            pickForConnect,
            create,
            createList,
            createForConnect,
        };
    };
    const factory = getFactoryWithTraits();
    const useTraits = (name, ...names) => {
        return getFactoryWithTraits([name, ...names]);
    };
    return Object.assign(Object.assign({}, factory), { use: useTraits });
}
/**
 * Define factory for {@link UserRole} model.
 *
 * @param options
 * @returns factory {@link UserRoleFactoryInterface}
 */
export function defineUserRoleFactory(options) {
    return defineUserRoleFactoryInternal(options !== null && options !== void 0 ? options : {});
}
function autoGenerateSettingScalarsOrEnums({ seq }) {
    return {
        name: getScalarFieldValueGenerator().String({ modelName: "Setting", fieldName: "name", isId: false, isUnique: true, seq }),
        value: getScalarFieldValueGenerator().Json({ modelName: "Setting", fieldName: "value", isId: false, isUnique: false, seq }),
        settingRestriction: getScalarFieldValueGenerator().Json({ modelName: "Setting", fieldName: "settingRestriction", isId: false, isUnique: false, seq })
    };
}
function defineSettingFactoryInternal({ defaultData: defaultDataResolver, traits: traitsDefs = {} }) {
    const getFactoryWithTraits = (traitKeys = []) => {
        const seqKey = {};
        const getSeq = () => getSequenceCounter(seqKey);
        const screen = createScreener("Setting", modelFieldDefinitions);
        const build = (...args_1) => __awaiter(this, [...args_1], void 0, function* (inputData = {}) {
            const seq = getSeq();
            const requiredScalarData = autoGenerateSettingScalarsOrEnums({ seq });
            const resolveValue = normalizeResolver(defaultDataResolver !== null && defaultDataResolver !== void 0 ? defaultDataResolver : {});
            const defaultData = yield traitKeys.reduce((queue, traitKey) => __awaiter(this, void 0, void 0, function* () {
                var _a, _b;
                const acc = yield queue;
                const resolveTraitValue = normalizeResolver((_b = (_a = traitsDefs[traitKey]) === null || _a === void 0 ? void 0 : _a.data) !== null && _b !== void 0 ? _b : {});
                const traitData = yield resolveTraitValue({ seq });
                return Object.assign(Object.assign({}, acc), traitData);
            }), resolveValue({ seq }));
            const defaultAssociations = {};
            const data = Object.assign(Object.assign(Object.assign(Object.assign({}, requiredScalarData), defaultData), defaultAssociations), inputData);
            return data;
        });
        const buildList = (inputData) => Promise.all(normalizeList(inputData).map(data => build(data)));
        const pickForConnect = (inputData) => ({
            id: inputData.id
        });
        const create = (...args_2) => __awaiter(this, [...args_2], void 0, function* (inputData = {}) {
            const data = yield build(inputData).then(screen);
            return yield getClient().setting.create({ data });
        });
        const createList = (inputData) => Promise.all(normalizeList(inputData).map(data => create(data)));
        const createForConnect = (inputData = {}) => create(inputData).then(pickForConnect);
        return {
            _factoryFor: "Setting",
            build,
            buildList,
            buildCreateInput: build,
            pickForConnect,
            create,
            createList,
            createForConnect,
        };
    };
    const factory = getFactoryWithTraits();
    const useTraits = (name, ...names) => {
        return getFactoryWithTraits([name, ...names]);
    };
    return Object.assign(Object.assign({}, factory), { use: useTraits });
}
/**
 * Define factory for {@link Setting} model.
 *
 * @param options
 * @returns factory {@link SettingFactoryInterface}
 */
export function defineSettingFactory(options) {
    return defineSettingFactoryInternal(options !== null && options !== void 0 ? options : {});
}
function autoGenerateTagScalarsOrEnums({ seq }) {
    return {
        type: "Comment"
    };
}
function defineTagFactoryInternal({ defaultData: defaultDataResolver, traits: traitsDefs = {} }) {
    const getFactoryWithTraits = (traitKeys = []) => {
        const seqKey = {};
        const getSeq = () => getSequenceCounter(seqKey);
        const screen = createScreener("Tag", modelFieldDefinitions);
        const build = (...args_1) => __awaiter(this, [...args_1], void 0, function* (inputData = {}) {
            const seq = getSeq();
            const requiredScalarData = autoGenerateTagScalarsOrEnums({ seq });
            const resolveValue = normalizeResolver(defaultDataResolver !== null && defaultDataResolver !== void 0 ? defaultDataResolver : {});
            const defaultData = yield traitKeys.reduce((queue, traitKey) => __awaiter(this, void 0, void 0, function* () {
                var _a, _b;
                const acc = yield queue;
                const resolveTraitValue = normalizeResolver((_b = (_a = traitsDefs[traitKey]) === null || _a === void 0 ? void 0 : _a.data) !== null && _b !== void 0 ? _b : {});
                const traitData = yield resolveTraitValue({ seq });
                return Object.assign(Object.assign({}, acc), traitData);
            }), resolveValue({ seq }));
            const defaultAssociations = {};
            const data = Object.assign(Object.assign(Object.assign(Object.assign({}, requiredScalarData), defaultData), defaultAssociations), inputData);
            return data;
        });
        const buildList = (inputData) => Promise.all(normalizeList(inputData).map(data => build(data)));
        const pickForConnect = (inputData) => ({
            id: inputData.id
        });
        const create = (...args_2) => __awaiter(this, [...args_2], void 0, function* (inputData = {}) {
            const data = yield build(inputData).then(screen);
            return yield getClient().tag.create({ data });
        });
        const createList = (inputData) => Promise.all(normalizeList(inputData).map(data => create(data)));
        const createForConnect = (inputData = {}) => create(inputData).then(pickForConnect);
        return {
            _factoryFor: "Tag",
            build,
            buildList,
            buildCreateInput: build,
            pickForConnect,
            create,
            createList,
            createForConnect,
        };
    };
    const factory = getFactoryWithTraits();
    const useTraits = (name, ...names) => {
        return getFactoryWithTraits([name, ...names]);
    };
    return Object.assign(Object.assign({}, factory), { use: useTraits });
}
/**
 * Define factory for {@link Tag} model.
 *
 * @param options
 * @returns factory {@link TagFactoryInterface}
 */
export function defineTagFactory(options) {
    return defineTagFactoryInternal(options !== null && options !== void 0 ? options : {});
}
function autoGeneratePollScalarsOrEnums({ seq }) {
    return {};
}
function definePollFactoryInternal({ defaultData: defaultDataResolver, traits: traitsDefs = {} }) {
    const getFactoryWithTraits = (traitKeys = []) => {
        const seqKey = {};
        const getSeq = () => getSequenceCounter(seqKey);
        const screen = createScreener("Poll", modelFieldDefinitions);
        const build = (...args_1) => __awaiter(this, [...args_1], void 0, function* (inputData = {}) {
            const seq = getSeq();
            const requiredScalarData = autoGeneratePollScalarsOrEnums({ seq });
            const resolveValue = normalizeResolver(defaultDataResolver !== null && defaultDataResolver !== void 0 ? defaultDataResolver : {});
            const defaultData = yield traitKeys.reduce((queue, traitKey) => __awaiter(this, void 0, void 0, function* () {
                var _a, _b;
                const acc = yield queue;
                const resolveTraitValue = normalizeResolver((_b = (_a = traitsDefs[traitKey]) === null || _a === void 0 ? void 0 : _a.data) !== null && _b !== void 0 ? _b : {});
                const traitData = yield resolveTraitValue({ seq });
                return Object.assign(Object.assign({}, acc), traitData);
            }), resolveValue({ seq }));
            const defaultAssociations = {};
            const data = Object.assign(Object.assign(Object.assign(Object.assign({}, requiredScalarData), defaultData), defaultAssociations), inputData);
            return data;
        });
        const buildList = (inputData) => Promise.all(normalizeList(inputData).map(data => build(data)));
        const pickForConnect = (inputData) => ({
            id: inputData.id
        });
        const create = (...args_2) => __awaiter(this, [...args_2], void 0, function* (inputData = {}) {
            const data = yield build(inputData).then(screen);
            return yield getClient().poll.create({ data });
        });
        const createList = (inputData) => Promise.all(normalizeList(inputData).map(data => create(data)));
        const createForConnect = (inputData = {}) => create(inputData).then(pickForConnect);
        return {
            _factoryFor: "Poll",
            build,
            buildList,
            buildCreateInput: build,
            pickForConnect,
            create,
            createList,
            createForConnect,
        };
    };
    const factory = getFactoryWithTraits();
    const useTraits = (name, ...names) => {
        return getFactoryWithTraits([name, ...names]);
    };
    return Object.assign(Object.assign({}, factory), { use: useTraits });
}
/**
 * Define factory for {@link Poll} model.
 *
 * @param options
 * @returns factory {@link PollFactoryInterface}
 */
export function definePollFactory(options) {
    return definePollFactoryInternal(options !== null && options !== void 0 ? options : {});
}
function isPollAnswerpollFactory(x) {
    return (x === null || x === void 0 ? void 0 : x._factoryFor) === "Poll";
}
function autoGeneratePollAnswerScalarsOrEnums({ seq }) {
    return {};
}
function definePollAnswerFactoryInternal({ defaultData: defaultDataResolver, traits: traitsDefs = {} }) {
    const getFactoryWithTraits = (traitKeys = []) => {
        const seqKey = {};
        const getSeq = () => getSequenceCounter(seqKey);
        const screen = createScreener("PollAnswer", modelFieldDefinitions);
        const build = (...args_1) => __awaiter(this, [...args_1], void 0, function* (inputData = {}) {
            const seq = getSeq();
            const requiredScalarData = autoGeneratePollAnswerScalarsOrEnums({ seq });
            const resolveValue = normalizeResolver(defaultDataResolver !== null && defaultDataResolver !== void 0 ? defaultDataResolver : {});
            const defaultData = yield traitKeys.reduce((queue, traitKey) => __awaiter(this, void 0, void 0, function* () {
                var _a, _b;
                const acc = yield queue;
                const resolveTraitValue = normalizeResolver((_b = (_a = traitsDefs[traitKey]) === null || _a === void 0 ? void 0 : _a.data) !== null && _b !== void 0 ? _b : {});
                const traitData = yield resolveTraitValue({ seq });
                return Object.assign(Object.assign({}, acc), traitData);
            }), resolveValue({ seq }));
            const defaultAssociations = {
                poll: isPollAnswerpollFactory(defaultData.poll) ? {
                    create: yield defaultData.poll.build()
                } : defaultData.poll
            };
            const data = Object.assign(Object.assign(Object.assign(Object.assign({}, requiredScalarData), defaultData), defaultAssociations), inputData);
            return data;
        });
        const buildList = (inputData) => Promise.all(normalizeList(inputData).map(data => build(data)));
        const pickForConnect = (inputData) => ({
            id: inputData.id
        });
        const create = (...args_2) => __awaiter(this, [...args_2], void 0, function* (inputData = {}) {
            const data = yield build(inputData).then(screen);
            return yield getClient().pollAnswer.create({ data });
        });
        const createList = (inputData) => Promise.all(normalizeList(inputData).map(data => create(data)));
        const createForConnect = (inputData = {}) => create(inputData).then(pickForConnect);
        return {
            _factoryFor: "PollAnswer",
            build,
            buildList,
            buildCreateInput: build,
            pickForConnect,
            create,
            createList,
            createForConnect,
        };
    };
    const factory = getFactoryWithTraits();
    const useTraits = (name, ...names) => {
        return getFactoryWithTraits([name, ...names]);
    };
    return Object.assign(Object.assign({}, factory), { use: useTraits });
}
/**
 * Define factory for {@link PollAnswer} model.
 *
 * @param options
 * @returns factory {@link PollAnswerFactoryInterface}
 */
export function definePollAnswerFactory(options) {
    return definePollAnswerFactoryInternal(options);
}
function isPollVoteuserFactory(x) {
    return (x === null || x === void 0 ? void 0 : x._factoryFor) === "User";
}
function isPollVoteanswerFactory(x) {
    return (x === null || x === void 0 ? void 0 : x._factoryFor) === "PollAnswer";
}
function isPollVotepollFactory(x) {
    return (x === null || x === void 0 ? void 0 : x._factoryFor) === "Poll";
}
function autoGeneratePollVoteScalarsOrEnums({ seq }) {
    return {};
}
function definePollVoteFactoryInternal({ defaultData: defaultDataResolver, traits: traitsDefs = {} }) {
    const getFactoryWithTraits = (traitKeys = []) => {
        const seqKey = {};
        const getSeq = () => getSequenceCounter(seqKey);
        const screen = createScreener("PollVote", modelFieldDefinitions);
        const build = (...args_1) => __awaiter(this, [...args_1], void 0, function* (inputData = {}) {
            const seq = getSeq();
            const requiredScalarData = autoGeneratePollVoteScalarsOrEnums({ seq });
            const resolveValue = normalizeResolver(defaultDataResolver !== null && defaultDataResolver !== void 0 ? defaultDataResolver : {});
            const defaultData = yield traitKeys.reduce((queue, traitKey) => __awaiter(this, void 0, void 0, function* () {
                var _a, _b;
                const acc = yield queue;
                const resolveTraitValue = normalizeResolver((_b = (_a = traitsDefs[traitKey]) === null || _a === void 0 ? void 0 : _a.data) !== null && _b !== void 0 ? _b : {});
                const traitData = yield resolveTraitValue({ seq });
                return Object.assign(Object.assign({}, acc), traitData);
            }), resolveValue({ seq }));
            const defaultAssociations = {
                user: isPollVoteuserFactory(defaultData.user) ? {
                    create: yield defaultData.user.build()
                } : defaultData.user,
                answer: isPollVoteanswerFactory(defaultData.answer) ? {
                    create: yield defaultData.answer.build()
                } : defaultData.answer,
                poll: isPollVotepollFactory(defaultData.poll) ? {
                    create: yield defaultData.poll.build()
                } : defaultData.poll
            };
            const data = Object.assign(Object.assign(Object.assign(Object.assign({}, requiredScalarData), defaultData), defaultAssociations), inputData);
            return data;
        });
        const buildList = (inputData) => Promise.all(normalizeList(inputData).map(data => build(data)));
        const pickForConnect = (inputData) => ({
            id: inputData.id
        });
        const create = (...args_2) => __awaiter(this, [...args_2], void 0, function* (inputData = {}) {
            const data = yield build(inputData).then(screen);
            return yield getClient().pollVote.create({ data });
        });
        const createList = (inputData) => Promise.all(normalizeList(inputData).map(data => create(data)));
        const createForConnect = (inputData = {}) => create(inputData).then(pickForConnect);
        return {
            _factoryFor: "PollVote",
            build,
            buildList,
            buildCreateInput: build,
            pickForConnect,
            create,
            createList,
            createForConnect,
        };
    };
    const factory = getFactoryWithTraits();
    const useTraits = (name, ...names) => {
        return getFactoryWithTraits([name, ...names]);
    };
    return Object.assign(Object.assign({}, factory), { use: useTraits });
}
/**
 * Define factory for {@link PollVote} model.
 *
 * @param options
 * @returns factory {@link PollVoteFactoryInterface}
 */
export function definePollVoteFactory(options) {
    return definePollVoteFactoryInternal(options);
}
function isPollExternalVoteSourcepollFactory(x) {
    return (x === null || x === void 0 ? void 0 : x._factoryFor) === "Poll";
}
function autoGeneratePollExternalVoteSourceScalarsOrEnums({ seq }) {
    return {};
}
function definePollExternalVoteSourceFactoryInternal({ defaultData: defaultDataResolver, traits: traitsDefs = {} }) {
    const getFactoryWithTraits = (traitKeys = []) => {
        const seqKey = {};
        const getSeq = () => getSequenceCounter(seqKey);
        const screen = createScreener("PollExternalVoteSource", modelFieldDefinitions);
        const build = (...args_1) => __awaiter(this, [...args_1], void 0, function* (inputData = {}) {
            const seq = getSeq();
            const requiredScalarData = autoGeneratePollExternalVoteSourceScalarsOrEnums({ seq });
            const resolveValue = normalizeResolver(defaultDataResolver !== null && defaultDataResolver !== void 0 ? defaultDataResolver : {});
            const defaultData = yield traitKeys.reduce((queue, traitKey) => __awaiter(this, void 0, void 0, function* () {
                var _a, _b;
                const acc = yield queue;
                const resolveTraitValue = normalizeResolver((_b = (_a = traitsDefs[traitKey]) === null || _a === void 0 ? void 0 : _a.data) !== null && _b !== void 0 ? _b : {});
                const traitData = yield resolveTraitValue({ seq });
                return Object.assign(Object.assign({}, acc), traitData);
            }), resolveValue({ seq }));
            const defaultAssociations = {
                poll: isPollExternalVoteSourcepollFactory(defaultData.poll) ? {
                    create: yield defaultData.poll.build()
                } : defaultData.poll
            };
            const data = Object.assign(Object.assign(Object.assign(Object.assign({}, requiredScalarData), defaultData), defaultAssociations), inputData);
            return data;
        });
        const buildList = (inputData) => Promise.all(normalizeList(inputData).map(data => build(data)));
        const pickForConnect = (inputData) => ({
            id: inputData.id
        });
        const create = (...args_2) => __awaiter(this, [...args_2], void 0, function* (inputData = {}) {
            const data = yield build(inputData).then(screen);
            return yield getClient().pollExternalVoteSource.create({ data });
        });
        const createList = (inputData) => Promise.all(normalizeList(inputData).map(data => create(data)));
        const createForConnect = (inputData = {}) => create(inputData).then(pickForConnect);
        return {
            _factoryFor: "PollExternalVoteSource",
            build,
            buildList,
            buildCreateInput: build,
            pickForConnect,
            create,
            createList,
            createForConnect,
        };
    };
    const factory = getFactoryWithTraits();
    const useTraits = (name, ...names) => {
        return getFactoryWithTraits([name, ...names]);
    };
    return Object.assign(Object.assign({}, factory), { use: useTraits });
}
/**
 * Define factory for {@link PollExternalVoteSource} model.
 *
 * @param options
 * @returns factory {@link PollExternalVoteSourceFactoryInterface}
 */
export function definePollExternalVoteSourceFactory(options) {
    return definePollExternalVoteSourceFactoryInternal(options);
}
function isPollExternalVoteanswerFactory(x) {
    return (x === null || x === void 0 ? void 0 : x._factoryFor) === "PollAnswer";
}
function isPollExternalVotesourceFactory(x) {
    return (x === null || x === void 0 ? void 0 : x._factoryFor) === "PollExternalVoteSource";
}
function autoGeneratePollExternalVoteScalarsOrEnums({ seq }) {
    return {};
}
function definePollExternalVoteFactoryInternal({ defaultData: defaultDataResolver, traits: traitsDefs = {} }) {
    const getFactoryWithTraits = (traitKeys = []) => {
        const seqKey = {};
        const getSeq = () => getSequenceCounter(seqKey);
        const screen = createScreener("PollExternalVote", modelFieldDefinitions);
        const build = (...args_1) => __awaiter(this, [...args_1], void 0, function* (inputData = {}) {
            const seq = getSeq();
            const requiredScalarData = autoGeneratePollExternalVoteScalarsOrEnums({ seq });
            const resolveValue = normalizeResolver(defaultDataResolver !== null && defaultDataResolver !== void 0 ? defaultDataResolver : {});
            const defaultData = yield traitKeys.reduce((queue, traitKey) => __awaiter(this, void 0, void 0, function* () {
                var _a, _b;
                const acc = yield queue;
                const resolveTraitValue = normalizeResolver((_b = (_a = traitsDefs[traitKey]) === null || _a === void 0 ? void 0 : _a.data) !== null && _b !== void 0 ? _b : {});
                const traitData = yield resolveTraitValue({ seq });
                return Object.assign(Object.assign({}, acc), traitData);
            }), resolveValue({ seq }));
            const defaultAssociations = {
                answer: isPollExternalVoteanswerFactory(defaultData.answer) ? {
                    create: yield defaultData.answer.build()
                } : defaultData.answer,
                source: isPollExternalVotesourceFactory(defaultData.source) ? {
                    create: yield defaultData.source.build()
                } : defaultData.source
            };
            const data = Object.assign(Object.assign(Object.assign(Object.assign({}, requiredScalarData), defaultData), defaultAssociations), inputData);
            return data;
        });
        const buildList = (inputData) => Promise.all(normalizeList(inputData).map(data => build(data)));
        const pickForConnect = (inputData) => ({
            id: inputData.id
        });
        const create = (...args_2) => __awaiter(this, [...args_2], void 0, function* (inputData = {}) {
            const data = yield build(inputData).then(screen);
            return yield getClient().pollExternalVote.create({ data });
        });
        const createList = (inputData) => Promise.all(normalizeList(inputData).map(data => create(data)));
        const createForConnect = (inputData = {}) => create(inputData).then(pickForConnect);
        return {
            _factoryFor: "PollExternalVote",
            build,
            buildList,
            buildCreateInput: build,
            pickForConnect,
            create,
            createList,
            createForConnect,
        };
    };
    const factory = getFactoryWithTraits();
    const useTraits = (name, ...names) => {
        return getFactoryWithTraits([name, ...names]);
    };
    return Object.assign(Object.assign({}, factory), { use: useTraits });
}
/**
 * Define factory for {@link PollExternalVote} model.
 *
 * @param options
 * @returns factory {@link PollExternalVoteFactoryInterface}
 */
export function definePollExternalVoteFactory(options) {
    return definePollExternalVoteFactoryInternal(options);
}
function isEventimageFactory(x) {
    return (x === null || x === void 0 ? void 0 : x._factoryFor) === "Image";
}
function autoGenerateEventScalarsOrEnums({ seq }) {
    return {
        name: getScalarFieldValueGenerator().String({ modelName: "Event", fieldName: "name", isId: false, isUnique: false, seq }),
        startsAt: getScalarFieldValueGenerator().DateTime({ modelName: "Event", fieldName: "startsAt", isId: false, isUnique: false, seq })
    };
}
function defineEventFactoryInternal({ defaultData: defaultDataResolver, traits: traitsDefs = {} }) {
    const getFactoryWithTraits = (traitKeys = []) => {
        const seqKey = {};
        const getSeq = () => getSequenceCounter(seqKey);
        const screen = createScreener("Event", modelFieldDefinitions);
        const build = (...args_1) => __awaiter(this, [...args_1], void 0, function* (inputData = {}) {
            const seq = getSeq();
            const requiredScalarData = autoGenerateEventScalarsOrEnums({ seq });
            const resolveValue = normalizeResolver(defaultDataResolver !== null && defaultDataResolver !== void 0 ? defaultDataResolver : {});
            const defaultData = yield traitKeys.reduce((queue, traitKey) => __awaiter(this, void 0, void 0, function* () {
                var _a, _b;
                const acc = yield queue;
                const resolveTraitValue = normalizeResolver((_b = (_a = traitsDefs[traitKey]) === null || _a === void 0 ? void 0 : _a.data) !== null && _b !== void 0 ? _b : {});
                const traitData = yield resolveTraitValue({ seq });
                return Object.assign(Object.assign({}, acc), traitData);
            }), resolveValue({ seq }));
            const defaultAssociations = {
                image: isEventimageFactory(defaultData.image) ? {
                    create: yield defaultData.image.build()
                } : defaultData.image
            };
            const data = Object.assign(Object.assign(Object.assign(Object.assign({}, requiredScalarData), defaultData), defaultAssociations), inputData);
            return data;
        });
        const buildList = (inputData) => Promise.all(normalizeList(inputData).map(data => build(data)));
        const pickForConnect = (inputData) => ({
            id: inputData.id
        });
        const create = (...args_2) => __awaiter(this, [...args_2], void 0, function* (inputData = {}) {
            const data = yield build(inputData).then(screen);
            return yield getClient().event.create({ data });
        });
        const createList = (inputData) => Promise.all(normalizeList(inputData).map(data => create(data)));
        const createForConnect = (inputData = {}) => create(inputData).then(pickForConnect);
        return {
            _factoryFor: "Event",
            build,
            buildList,
            buildCreateInput: build,
            pickForConnect,
            create,
            createList,
            createForConnect,
        };
    };
    const factory = getFactoryWithTraits();
    const useTraits = (name, ...names) => {
        return getFactoryWithTraits([name, ...names]);
    };
    return Object.assign(Object.assign({}, factory), { use: useTraits });
}
/**
 * Define factory for {@link Event} model.
 *
 * @param options
 * @returns factory {@link EventFactoryInterface}
 */
export function defineEventFactory(options) {
    return defineEventFactoryInternal(options !== null && options !== void 0 ? options : {});
}
function isTaggedEventseventFactory(x) {
    return (x === null || x === void 0 ? void 0 : x._factoryFor) === "Event";
}
function isTaggedEventstagFactory(x) {
    return (x === null || x === void 0 ? void 0 : x._factoryFor) === "Tag";
}
function autoGenerateTaggedEventsScalarsOrEnums({ seq }) {
    return {};
}
function defineTaggedEventsFactoryInternal({ defaultData: defaultDataResolver, traits: traitsDefs = {} }) {
    const getFactoryWithTraits = (traitKeys = []) => {
        const seqKey = {};
        const getSeq = () => getSequenceCounter(seqKey);
        const screen = createScreener("TaggedEvents", modelFieldDefinitions);
        const build = (...args_1) => __awaiter(this, [...args_1], void 0, function* (inputData = {}) {
            const seq = getSeq();
            const requiredScalarData = autoGenerateTaggedEventsScalarsOrEnums({ seq });
            const resolveValue = normalizeResolver(defaultDataResolver !== null && defaultDataResolver !== void 0 ? defaultDataResolver : {});
            const defaultData = yield traitKeys.reduce((queue, traitKey) => __awaiter(this, void 0, void 0, function* () {
                var _a, _b;
                const acc = yield queue;
                const resolveTraitValue = normalizeResolver((_b = (_a = traitsDefs[traitKey]) === null || _a === void 0 ? void 0 : _a.data) !== null && _b !== void 0 ? _b : {});
                const traitData = yield resolveTraitValue({ seq });
                return Object.assign(Object.assign({}, acc), traitData);
            }), resolveValue({ seq }));
            const defaultAssociations = {
                event: isTaggedEventseventFactory(defaultData.event) ? {
                    create: yield defaultData.event.build()
                } : defaultData.event,
                tag: isTaggedEventstagFactory(defaultData.tag) ? {
                    create: yield defaultData.tag.build()
                } : defaultData.tag
            };
            const data = Object.assign(Object.assign(Object.assign(Object.assign({}, requiredScalarData), defaultData), defaultAssociations), inputData);
            return data;
        });
        const buildList = (inputData) => Promise.all(normalizeList(inputData).map(data => build(data)));
        const pickForConnect = (inputData) => ({
            eventId: inputData.eventId,
            tagId: inputData.tagId
        });
        const create = (...args_2) => __awaiter(this, [...args_2], void 0, function* (inputData = {}) {
            const data = yield build(inputData).then(screen);
            return yield getClient().taggedEvents.create({ data });
        });
        const createList = (inputData) => Promise.all(normalizeList(inputData).map(data => create(data)));
        const createForConnect = (inputData = {}) => create(inputData).then(pickForConnect);
        return {
            _factoryFor: "TaggedEvents",
            build,
            buildList,
            buildCreateInput: build,
            pickForConnect,
            create,
            createList,
            createForConnect,
        };
    };
    const factory = getFactoryWithTraits();
    const useTraits = (name, ...names) => {
        return getFactoryWithTraits([name, ...names]);
    };
    return Object.assign(Object.assign({}, factory), { use: useTraits });
}
/**
 * Define factory for {@link TaggedEvents} model.
 *
 * @param options
 * @returns factory {@link TaggedEventsFactoryInterface}
 */
export function defineTaggedEventsFactory(options) {
    return defineTaggedEventsFactoryInternal(options);
}
function autoGenerateConsentScalarsOrEnums({ seq }) {
    return {
        name: getScalarFieldValueGenerator().String({ modelName: "Consent", fieldName: "name", isId: false, isUnique: false, seq }),
        slug: getScalarFieldValueGenerator().String({ modelName: "Consent", fieldName: "slug", isId: false, isUnique: true, seq }),
        defaultValue: getScalarFieldValueGenerator().Boolean({ modelName: "Consent", fieldName: "defaultValue", isId: false, isUnique: false, seq })
    };
}
function defineConsentFactoryInternal({ defaultData: defaultDataResolver, traits: traitsDefs = {} }) {
    const getFactoryWithTraits = (traitKeys = []) => {
        const seqKey = {};
        const getSeq = () => getSequenceCounter(seqKey);
        const screen = createScreener("Consent", modelFieldDefinitions);
        const build = (...args_1) => __awaiter(this, [...args_1], void 0, function* (inputData = {}) {
            const seq = getSeq();
            const requiredScalarData = autoGenerateConsentScalarsOrEnums({ seq });
            const resolveValue = normalizeResolver(defaultDataResolver !== null && defaultDataResolver !== void 0 ? defaultDataResolver : {});
            const defaultData = yield traitKeys.reduce((queue, traitKey) => __awaiter(this, void 0, void 0, function* () {
                var _a, _b;
                const acc = yield queue;
                const resolveTraitValue = normalizeResolver((_b = (_a = traitsDefs[traitKey]) === null || _a === void 0 ? void 0 : _a.data) !== null && _b !== void 0 ? _b : {});
                const traitData = yield resolveTraitValue({ seq });
                return Object.assign(Object.assign({}, acc), traitData);
            }), resolveValue({ seq }));
            const defaultAssociations = {};
            const data = Object.assign(Object.assign(Object.assign(Object.assign({}, requiredScalarData), defaultData), defaultAssociations), inputData);
            return data;
        });
        const buildList = (inputData) => Promise.all(normalizeList(inputData).map(data => build(data)));
        const pickForConnect = (inputData) => ({
            id: inputData.id
        });
        const create = (...args_2) => __awaiter(this, [...args_2], void 0, function* (inputData = {}) {
            const data = yield build(inputData).then(screen);
            return yield getClient().consent.create({ data });
        });
        const createList = (inputData) => Promise.all(normalizeList(inputData).map(data => create(data)));
        const createForConnect = (inputData = {}) => create(inputData).then(pickForConnect);
        return {
            _factoryFor: "Consent",
            build,
            buildList,
            buildCreateInput: build,
            pickForConnect,
            create,
            createList,
            createForConnect,
        };
    };
    const factory = getFactoryWithTraits();
    const useTraits = (name, ...names) => {
        return getFactoryWithTraits([name, ...names]);
    };
    return Object.assign(Object.assign({}, factory), { use: useTraits });
}
/**
 * Define factory for {@link Consent} model.
 *
 * @param options
 * @returns factory {@link ConsentFactoryInterface}
 */
export function defineConsentFactory(options) {
    return defineConsentFactoryInternal(options !== null && options !== void 0 ? options : {});
}
function isUserConsentconsentFactory(x) {
    return (x === null || x === void 0 ? void 0 : x._factoryFor) === "Consent";
}
function isUserConsentuserFactory(x) {
    return (x === null || x === void 0 ? void 0 : x._factoryFor) === "User";
}
function autoGenerateUserConsentScalarsOrEnums({ seq }) {
    return {
        value: getScalarFieldValueGenerator().Boolean({ modelName: "UserConsent", fieldName: "value", isId: false, isUnique: false, seq })
    };
}
function defineUserConsentFactoryInternal({ defaultData: defaultDataResolver, traits: traitsDefs = {} }) {
    const getFactoryWithTraits = (traitKeys = []) => {
        const seqKey = {};
        const getSeq = () => getSequenceCounter(seqKey);
        const screen = createScreener("UserConsent", modelFieldDefinitions);
        const build = (...args_1) => __awaiter(this, [...args_1], void 0, function* (inputData = {}) {
            const seq = getSeq();
            const requiredScalarData = autoGenerateUserConsentScalarsOrEnums({ seq });
            const resolveValue = normalizeResolver(defaultDataResolver !== null && defaultDataResolver !== void 0 ? defaultDataResolver : {});
            const defaultData = yield traitKeys.reduce((queue, traitKey) => __awaiter(this, void 0, void 0, function* () {
                var _a, _b;
                const acc = yield queue;
                const resolveTraitValue = normalizeResolver((_b = (_a = traitsDefs[traitKey]) === null || _a === void 0 ? void 0 : _a.data) !== null && _b !== void 0 ? _b : {});
                const traitData = yield resolveTraitValue({ seq });
                return Object.assign(Object.assign({}, acc), traitData);
            }), resolveValue({ seq }));
            const defaultAssociations = {
                consent: isUserConsentconsentFactory(defaultData.consent) ? {
                    create: yield defaultData.consent.build()
                } : defaultData.consent,
                user: isUserConsentuserFactory(defaultData.user) ? {
                    create: yield defaultData.user.build()
                } : defaultData.user
            };
            const data = Object.assign(Object.assign(Object.assign(Object.assign({}, requiredScalarData), defaultData), defaultAssociations), inputData);
            return data;
        });
        const buildList = (inputData) => Promise.all(normalizeList(inputData).map(data => build(data)));
        const pickForConnect = (inputData) => ({
            id: inputData.id
        });
        const create = (...args_2) => __awaiter(this, [...args_2], void 0, function* (inputData = {}) {
            const data = yield build(inputData).then(screen);
            return yield getClient().userConsent.create({ data });
        });
        const createList = (inputData) => Promise.all(normalizeList(inputData).map(data => create(data)));
        const createForConnect = (inputData = {}) => create(inputData).then(pickForConnect);
        return {
            _factoryFor: "UserConsent",
            build,
            buildList,
            buildCreateInput: build,
            pickForConnect,
            create,
            createList,
            createForConnect,
        };
    };
    const factory = getFactoryWithTraits();
    const useTraits = (name, ...names) => {
        return getFactoryWithTraits([name, ...names]);
    };
    return Object.assign(Object.assign({}, factory), { use: useTraits });
}
/**
 * Define factory for {@link UserConsent} model.
 *
 * @param options
 * @returns factory {@link UserConsentFactoryInterface}
 */
export function defineUserConsentFactory(options) {
    return defineUserConsentFactoryInternal(options);
}
function isUserFlowMailmailTemplateFactory(x) {
    return (x === null || x === void 0 ? void 0 : x._factoryFor) === "MailTemplate";
}
function autoGenerateUserFlowMailScalarsOrEnums({ seq }) {
    return {
        event: "ACCOUNT_CREATION"
    };
}
function defineUserFlowMailFactoryInternal({ defaultData: defaultDataResolver, traits: traitsDefs = {} }) {
    const getFactoryWithTraits = (traitKeys = []) => {
        const seqKey = {};
        const getSeq = () => getSequenceCounter(seqKey);
        const screen = createScreener("UserFlowMail", modelFieldDefinitions);
        const build = (...args_1) => __awaiter(this, [...args_1], void 0, function* (inputData = {}) {
            const seq = getSeq();
            const requiredScalarData = autoGenerateUserFlowMailScalarsOrEnums({ seq });
            const resolveValue = normalizeResolver(defaultDataResolver !== null && defaultDataResolver !== void 0 ? defaultDataResolver : {});
            const defaultData = yield traitKeys.reduce((queue, traitKey) => __awaiter(this, void 0, void 0, function* () {
                var _a, _b;
                const acc = yield queue;
                const resolveTraitValue = normalizeResolver((_b = (_a = traitsDefs[traitKey]) === null || _a === void 0 ? void 0 : _a.data) !== null && _b !== void 0 ? _b : {});
                const traitData = yield resolveTraitValue({ seq });
                return Object.assign(Object.assign({}, acc), traitData);
            }), resolveValue({ seq }));
            const defaultAssociations = {
                mailTemplate: isUserFlowMailmailTemplateFactory(defaultData.mailTemplate) ? {
                    create: yield defaultData.mailTemplate.build()
                } : defaultData.mailTemplate
            };
            const data = Object.assign(Object.assign(Object.assign(Object.assign({}, requiredScalarData), defaultData), defaultAssociations), inputData);
            return data;
        });
        const buildList = (inputData) => Promise.all(normalizeList(inputData).map(data => build(data)));
        const pickForConnect = (inputData) => ({
            id: inputData.id
        });
        const create = (...args_2) => __awaiter(this, [...args_2], void 0, function* (inputData = {}) {
            const data = yield build(inputData).then(screen);
            return yield getClient().userFlowMail.create({ data });
        });
        const createList = (inputData) => Promise.all(normalizeList(inputData).map(data => create(data)));
        const createForConnect = (inputData = {}) => create(inputData).then(pickForConnect);
        return {
            _factoryFor: "UserFlowMail",
            build,
            buildList,
            buildCreateInput: build,
            pickForConnect,
            create,
            createList,
            createForConnect,
        };
    };
    const factory = getFactoryWithTraits();
    const useTraits = (name, ...names) => {
        return getFactoryWithTraits([name, ...names]);
    };
    return Object.assign(Object.assign({}, factory), { use: useTraits });
}
/**
 * Define factory for {@link UserFlowMail} model.
 *
 * @param options
 * @returns factory {@link UserFlowMailFactoryInterface}
 */
export function defineUserFlowMailFactory(options) {
    return defineUserFlowMailFactoryInternal(options !== null && options !== void 0 ? options : {});
}
function isSubscriptionFlowmemberPlanFactory(x) {
    return (x === null || x === void 0 ? void 0 : x._factoryFor) === "MemberPlan";
}
function autoGenerateSubscriptionFlowScalarsOrEnums({ seq }) {
    return {};
}
function defineSubscriptionFlowFactoryInternal({ defaultData: defaultDataResolver, traits: traitsDefs = {} }) {
    const getFactoryWithTraits = (traitKeys = []) => {
        const seqKey = {};
        const getSeq = () => getSequenceCounter(seqKey);
        const screen = createScreener("SubscriptionFlow", modelFieldDefinitions);
        const build = (...args_1) => __awaiter(this, [...args_1], void 0, function* (inputData = {}) {
            const seq = getSeq();
            const requiredScalarData = autoGenerateSubscriptionFlowScalarsOrEnums({ seq });
            const resolveValue = normalizeResolver(defaultDataResolver !== null && defaultDataResolver !== void 0 ? defaultDataResolver : {});
            const defaultData = yield traitKeys.reduce((queue, traitKey) => __awaiter(this, void 0, void 0, function* () {
                var _a, _b;
                const acc = yield queue;
                const resolveTraitValue = normalizeResolver((_b = (_a = traitsDefs[traitKey]) === null || _a === void 0 ? void 0 : _a.data) !== null && _b !== void 0 ? _b : {});
                const traitData = yield resolveTraitValue({ seq });
                return Object.assign(Object.assign({}, acc), traitData);
            }), resolveValue({ seq }));
            const defaultAssociations = {
                memberPlan: isSubscriptionFlowmemberPlanFactory(defaultData.memberPlan) ? {
                    create: yield defaultData.memberPlan.build()
                } : defaultData.memberPlan
            };
            const data = Object.assign(Object.assign(Object.assign(Object.assign({}, requiredScalarData), defaultData), defaultAssociations), inputData);
            return data;
        });
        const buildList = (inputData) => Promise.all(normalizeList(inputData).map(data => build(data)));
        const pickForConnect = (inputData) => ({
            id: inputData.id
        });
        const create = (...args_2) => __awaiter(this, [...args_2], void 0, function* (inputData = {}) {
            const data = yield build(inputData).then(screen);
            return yield getClient().subscriptionFlow.create({ data });
        });
        const createList = (inputData) => Promise.all(normalizeList(inputData).map(data => create(data)));
        const createForConnect = (inputData = {}) => create(inputData).then(pickForConnect);
        return {
            _factoryFor: "SubscriptionFlow",
            build,
            buildList,
            buildCreateInput: build,
            pickForConnect,
            create,
            createList,
            createForConnect,
        };
    };
    const factory = getFactoryWithTraits();
    const useTraits = (name, ...names) => {
        return getFactoryWithTraits([name, ...names]);
    };
    return Object.assign(Object.assign({}, factory), { use: useTraits });
}
/**
 * Define factory for {@link SubscriptionFlow} model.
 *
 * @param options
 * @returns factory {@link SubscriptionFlowFactoryInterface}
 */
export function defineSubscriptionFlowFactory(options) {
    return defineSubscriptionFlowFactoryInternal(options !== null && options !== void 0 ? options : {});
}
function isSubscriptionIntervalmailTemplateFactory(x) {
    return (x === null || x === void 0 ? void 0 : x._factoryFor) === "MailTemplate";
}
function isSubscriptionIntervalsubscriptionFlowFactory(x) {
    return (x === null || x === void 0 ? void 0 : x._factoryFor) === "SubscriptionFlow";
}
function autoGenerateSubscriptionIntervalScalarsOrEnums({ seq }) {
    return {
        event: "SUBSCRIBE"
    };
}
function defineSubscriptionIntervalFactoryInternal({ defaultData: defaultDataResolver, traits: traitsDefs = {} }) {
    const getFactoryWithTraits = (traitKeys = []) => {
        const seqKey = {};
        const getSeq = () => getSequenceCounter(seqKey);
        const screen = createScreener("SubscriptionInterval", modelFieldDefinitions);
        const build = (...args_1) => __awaiter(this, [...args_1], void 0, function* (inputData = {}) {
            const seq = getSeq();
            const requiredScalarData = autoGenerateSubscriptionIntervalScalarsOrEnums({ seq });
            const resolveValue = normalizeResolver(defaultDataResolver !== null && defaultDataResolver !== void 0 ? defaultDataResolver : {});
            const defaultData = yield traitKeys.reduce((queue, traitKey) => __awaiter(this, void 0, void 0, function* () {
                var _a, _b;
                const acc = yield queue;
                const resolveTraitValue = normalizeResolver((_b = (_a = traitsDefs[traitKey]) === null || _a === void 0 ? void 0 : _a.data) !== null && _b !== void 0 ? _b : {});
                const traitData = yield resolveTraitValue({ seq });
                return Object.assign(Object.assign({}, acc), traitData);
            }), resolveValue({ seq }));
            const defaultAssociations = {
                mailTemplate: isSubscriptionIntervalmailTemplateFactory(defaultData.mailTemplate) ? {
                    create: yield defaultData.mailTemplate.build()
                } : defaultData.mailTemplate,
                subscriptionFlow: isSubscriptionIntervalsubscriptionFlowFactory(defaultData.subscriptionFlow) ? {
                    create: yield defaultData.subscriptionFlow.build()
                } : defaultData.subscriptionFlow
            };
            const data = Object.assign(Object.assign(Object.assign(Object.assign({}, requiredScalarData), defaultData), defaultAssociations), inputData);
            return data;
        });
        const buildList = (inputData) => Promise.all(normalizeList(inputData).map(data => build(data)));
        const pickForConnect = (inputData) => ({
            id: inputData.id
        });
        const create = (...args_2) => __awaiter(this, [...args_2], void 0, function* (inputData = {}) {
            const data = yield build(inputData).then(screen);
            return yield getClient().subscriptionInterval.create({ data });
        });
        const createList = (inputData) => Promise.all(normalizeList(inputData).map(data => create(data)));
        const createForConnect = (inputData = {}) => create(inputData).then(pickForConnect);
        return {
            _factoryFor: "SubscriptionInterval",
            build,
            buildList,
            buildCreateInput: build,
            pickForConnect,
            create,
            createList,
            createForConnect,
        };
    };
    const factory = getFactoryWithTraits();
    const useTraits = (name, ...names) => {
        return getFactoryWithTraits([name, ...names]);
    };
    return Object.assign(Object.assign({}, factory), { use: useTraits });
}
/**
 * Define factory for {@link SubscriptionInterval} model.
 *
 * @param options
 * @returns factory {@link SubscriptionIntervalFactoryInterface}
 */
export function defineSubscriptionIntervalFactory(options) {
    return defineSubscriptionIntervalFactoryInternal(options);
}
function autoGenerateMailTemplateScalarsOrEnums({ seq }) {
    return {
        name: getScalarFieldValueGenerator().String({ modelName: "MailTemplate", fieldName: "name", isId: false, isUnique: false, seq }),
        externalMailTemplateId: getScalarFieldValueGenerator().String({ modelName: "MailTemplate", fieldName: "externalMailTemplateId", isId: false, isUnique: true, seq })
    };
}
function defineMailTemplateFactoryInternal({ defaultData: defaultDataResolver, traits: traitsDefs = {} }) {
    const getFactoryWithTraits = (traitKeys = []) => {
        const seqKey = {};
        const getSeq = () => getSequenceCounter(seqKey);
        const screen = createScreener("MailTemplate", modelFieldDefinitions);
        const build = (...args_1) => __awaiter(this, [...args_1], void 0, function* (inputData = {}) {
            const seq = getSeq();
            const requiredScalarData = autoGenerateMailTemplateScalarsOrEnums({ seq });
            const resolveValue = normalizeResolver(defaultDataResolver !== null && defaultDataResolver !== void 0 ? defaultDataResolver : {});
            const defaultData = yield traitKeys.reduce((queue, traitKey) => __awaiter(this, void 0, void 0, function* () {
                var _a, _b;
                const acc = yield queue;
                const resolveTraitValue = normalizeResolver((_b = (_a = traitsDefs[traitKey]) === null || _a === void 0 ? void 0 : _a.data) !== null && _b !== void 0 ? _b : {});
                const traitData = yield resolveTraitValue({ seq });
                return Object.assign(Object.assign({}, acc), traitData);
            }), resolveValue({ seq }));
            const defaultAssociations = {};
            const data = Object.assign(Object.assign(Object.assign(Object.assign({}, requiredScalarData), defaultData), defaultAssociations), inputData);
            return data;
        });
        const buildList = (inputData) => Promise.all(normalizeList(inputData).map(data => build(data)));
        const pickForConnect = (inputData) => ({
            id: inputData.id
        });
        const create = (...args_2) => __awaiter(this, [...args_2], void 0, function* (inputData = {}) {
            const data = yield build(inputData).then(screen);
            return yield getClient().mailTemplate.create({ data });
        });
        const createList = (inputData) => Promise.all(normalizeList(inputData).map(data => create(data)));
        const createForConnect = (inputData = {}) => create(inputData).then(pickForConnect);
        return {
            _factoryFor: "MailTemplate",
            build,
            buildList,
            buildCreateInput: build,
            pickForConnect,
            create,
            createList,
            createForConnect,
        };
    };
    const factory = getFactoryWithTraits();
    const useTraits = (name, ...names) => {
        return getFactoryWithTraits([name, ...names]);
    };
    return Object.assign(Object.assign({}, factory), { use: useTraits });
}
/**
 * Define factory for {@link MailTemplate} model.
 *
 * @param options
 * @returns factory {@link MailTemplateFactoryInterface}
 */
export function defineMailTemplateFactory(options) {
    return defineMailTemplateFactoryInternal(options !== null && options !== void 0 ? options : {});
}
function autoGeneratePeriodicJobScalarsOrEnums({ seq }) {
    return {
        date: getScalarFieldValueGenerator().DateTime({ modelName: "PeriodicJob", fieldName: "date", isId: false, isUnique: true, seq })
    };
}
function definePeriodicJobFactoryInternal({ defaultData: defaultDataResolver, traits: traitsDefs = {} }) {
    const getFactoryWithTraits = (traitKeys = []) => {
        const seqKey = {};
        const getSeq = () => getSequenceCounter(seqKey);
        const screen = createScreener("PeriodicJob", modelFieldDefinitions);
        const build = (...args_1) => __awaiter(this, [...args_1], void 0, function* (inputData = {}) {
            const seq = getSeq();
            const requiredScalarData = autoGeneratePeriodicJobScalarsOrEnums({ seq });
            const resolveValue = normalizeResolver(defaultDataResolver !== null && defaultDataResolver !== void 0 ? defaultDataResolver : {});
            const defaultData = yield traitKeys.reduce((queue, traitKey) => __awaiter(this, void 0, void 0, function* () {
                var _a, _b;
                const acc = yield queue;
                const resolveTraitValue = normalizeResolver((_b = (_a = traitsDefs[traitKey]) === null || _a === void 0 ? void 0 : _a.data) !== null && _b !== void 0 ? _b : {});
                const traitData = yield resolveTraitValue({ seq });
                return Object.assign(Object.assign({}, acc), traitData);
            }), resolveValue({ seq }));
            const defaultAssociations = {};
            const data = Object.assign(Object.assign(Object.assign(Object.assign({}, requiredScalarData), defaultData), defaultAssociations), inputData);
            return data;
        });
        const buildList = (inputData) => Promise.all(normalizeList(inputData).map(data => build(data)));
        const pickForConnect = (inputData) => ({
            id: inputData.id
        });
        const create = (...args_2) => __awaiter(this, [...args_2], void 0, function* (inputData = {}) {
            const data = yield build(inputData).then(screen);
            return yield getClient().periodicJob.create({ data });
        });
        const createList = (inputData) => Promise.all(normalizeList(inputData).map(data => create(data)));
        const createForConnect = (inputData = {}) => create(inputData).then(pickForConnect);
        return {
            _factoryFor: "PeriodicJob",
            build,
            buildList,
            buildCreateInput: build,
            pickForConnect,
            create,
            createList,
            createForConnect,
        };
    };
    const factory = getFactoryWithTraits();
    const useTraits = (name, ...names) => {
        return getFactoryWithTraits([name, ...names]);
    };
    return Object.assign(Object.assign({}, factory), { use: useTraits });
}
/**
 * Define factory for {@link PeriodicJob} model.
 *
 * @param options
 * @returns factory {@link PeriodicJobFactoryInterface}
 */
export function definePeriodicJobFactory(options) {
    return definePeriodicJobFactoryInternal(options !== null && options !== void 0 ? options : {});
}
function autoGenerateBlockStyleScalarsOrEnums({ seq }) {
    return {
        name: getScalarFieldValueGenerator().String({ modelName: "BlockStyle", fieldName: "name", isId: false, isUnique: true, seq })
    };
}
function defineBlockStyleFactoryInternal({ defaultData: defaultDataResolver, traits: traitsDefs = {} }) {
    const getFactoryWithTraits = (traitKeys = []) => {
        const seqKey = {};
        const getSeq = () => getSequenceCounter(seqKey);
        const screen = createScreener("BlockStyle", modelFieldDefinitions);
        const build = (...args_1) => __awaiter(this, [...args_1], void 0, function* (inputData = {}) {
            const seq = getSeq();
            const requiredScalarData = autoGenerateBlockStyleScalarsOrEnums({ seq });
            const resolveValue = normalizeResolver(defaultDataResolver !== null && defaultDataResolver !== void 0 ? defaultDataResolver : {});
            const defaultData = yield traitKeys.reduce((queue, traitKey) => __awaiter(this, void 0, void 0, function* () {
                var _a, _b;
                const acc = yield queue;
                const resolveTraitValue = normalizeResolver((_b = (_a = traitsDefs[traitKey]) === null || _a === void 0 ? void 0 : _a.data) !== null && _b !== void 0 ? _b : {});
                const traitData = yield resolveTraitValue({ seq });
                return Object.assign(Object.assign({}, acc), traitData);
            }), resolveValue({ seq }));
            const defaultAssociations = {};
            const data = Object.assign(Object.assign(Object.assign(Object.assign({}, requiredScalarData), defaultData), defaultAssociations), inputData);
            return data;
        });
        const buildList = (inputData) => Promise.all(normalizeList(inputData).map(data => build(data)));
        const pickForConnect = (inputData) => ({
            id: inputData.id
        });
        const create = (...args_2) => __awaiter(this, [...args_2], void 0, function* (inputData = {}) {
            const data = yield build(inputData).then(screen);
            return yield getClient().blockStyle.create({ data });
        });
        const createList = (inputData) => Promise.all(normalizeList(inputData).map(data => create(data)));
        const createForConnect = (inputData = {}) => create(inputData).then(pickForConnect);
        return {
            _factoryFor: "BlockStyle",
            build,
            buildList,
            buildCreateInput: build,
            pickForConnect,
            create,
            createList,
            createForConnect,
        };
    };
    const factory = getFactoryWithTraits();
    const useTraits = (name, ...names) => {
        return getFactoryWithTraits([name, ...names]);
    };
    return Object.assign(Object.assign({}, factory), { use: useTraits });
}
/**
 * Define factory for {@link BlockStyle} model.
 *
 * @param options
 * @returns factory {@link BlockStyleFactoryInterface}
 */
export function defineBlockStyleFactory(options) {
    return defineBlockStyleFactoryInternal(options !== null && options !== void 0 ? options : {});
}
