"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.defineTagFactory = exports.defineSettingFactory = exports.defineUserRoleFactory = exports.defineUserFactory = exports.definePaymentProviderCustomerFactory = exports.defineUserOAuth2AccountFactory = exports.defineUserAddressFactory = exports.defineSubscriptionFactory = exports.defineSubscriptionDeactivationFactory = exports.defineSubscriptionPeriodFactory = exports.defineSessionFactory = exports.defineTokenFactory = exports.definePeerFactory = exports.definePeerProfileFactory = exports.definePaymentFactory = exports.definePaymentMethodFactory = exports.defineTaggedPagesFactory = exports.definePageFactory = exports.definePageRevisionFactory = exports.defineNavigationFactory = exports.defineNavigationLinkFactory = exports.defineMemberPlanFactory = exports.defineAvailablePaymentMethodFactory = exports.defineMailLogFactory = exports.defineInvoiceFactory = exports.defineInvoiceItemFactory = exports.defineCommentRatingOverrideFactory = exports.defineCommentRatingFactory = exports.defineCommentRatingSystemAnswerFactory = exports.defineCommentRatingSystemFactory = exports.defineTaggedCommentsFactory = exports.defineCommentFactory = exports.defineCommentsRevisionsFactory = exports.defineImageFactory = exports.defineFocalPointFactory = exports.defineTaggedAuthorsFactory = exports.defineAuthorFactory = exports.defineAuthorsLinksFactory = exports.defineTaggedArticlesFactory = exports.defineTrackingPixelMethodFactory = exports.defineArticleTrackingPixelsFactory = exports.defineArticleFactory = exports.defineArticleRevisionSocialMediaAuthorFactory = exports.defineArticleRevisionAuthorFactory = exports.defineArticleRevisionFactory = exports.defineMetadataPropertyFactory = exports.resetScalarFieldValueGenerator = exports.registerScalarFieldValueGenerator = exports.resetSequence = exports.initialize = void 0;
exports.defineCrowdfundingGoalFactory = exports.defineCrowdfundingFactory = exports.defineBannerActionFactory = exports.defineBannerFactory = exports.defineBlockStyleFactory = exports.definePeriodicJobFactory = exports.defineMailTemplateFactory = exports.defineSubscriptionIntervalFactory = exports.defineSubscriptionFlowFactory = exports.defineUserFlowMailFactory = exports.defineUserConsentFactory = exports.defineConsentFactory = exports.defineTaggedEventsFactory = exports.defineEventFactory = exports.definePollExternalVoteFactory = exports.definePollExternalVoteSourceFactory = exports.definePollVoteFactory = exports.definePollAnswerFactory = exports.definePollFactory = void 0;
var internal_1 = require("@quramy/prisma-fabbrica/lib/internal");
var internal_2 = require("@quramy/prisma-fabbrica/lib/internal");
Object.defineProperty(exports, "initialize", { enumerable: true, get: function () { return internal_2.initialize; } });
Object.defineProperty(exports, "resetSequence", { enumerable: true, get: function () { return internal_2.resetSequence; } });
Object.defineProperty(exports, "registerScalarFieldValueGenerator", { enumerable: true, get: function () { return internal_2.registerScalarFieldValueGenerator; } });
Object.defineProperty(exports, "resetScalarFieldValueGenerator", { enumerable: true, get: function () { return internal_2.resetScalarFieldValueGenerator; } });
var modelFieldDefinitions = [{
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
                name: "authors",
                type: "ArticleRevisionAuthor",
                relationName: "ArticleRevisionToArticleRevisionAuthor"
            }, {
                name: "socialMediaAuthors",
                type: "ArticleRevisionSocialMediaAuthor",
                relationName: "ArticleRevisionToArticleRevisionSocialMediaAuthor"
            }, {
                name: "image",
                type: "Image",
                relationName: "articleRevisionImage"
            }, {
                name: "socialMediaImage",
                type: "Image",
                relationName: "articleRevisionSocialMediaImage"
            }, {
                name: "article",
                type: "Article",
                relationName: "ArticleToArticleRevision"
            }, {
                name: "user",
                type: "User",
                relationName: "ArticleRevisionToUser"
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
                name: "peer",
                type: "Peer",
                relationName: "ArticleToPeer"
            }, {
                name: "navigations",
                type: "NavigationLink",
                relationName: "ArticleToNavigationLink"
            }, {
                name: "tags",
                type: "TaggedArticles",
                relationName: "ArticleToTaggedArticles"
            }, {
                name: "revisions",
                type: "ArticleRevision",
                relationName: "ArticleToArticleRevision"
            }, {
                name: "trackingPixels",
                type: "ArticleTrackingPixels",
                relationName: "ArticleToArticleTrackingPixels"
            }]
    }, {
        name: "ArticleTrackingPixels",
        fields: [{
                name: "article",
                type: "Article",
                relationName: "ArticleToArticleTrackingPixels"
            }, {
                name: "trackingPixelMethod",
                type: "TrackingPixelMethod",
                relationName: "ArticleTrackingPixelsToTrackingPixelMethod"
            }]
    }, {
        name: "TrackingPixelMethod",
        fields: [{
                name: "ArticleTrackingPixels",
                type: "ArticleTrackingPixels",
                relationName: "ArticleTrackingPixelsToTrackingPixelMethod"
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
                name: "peer",
                type: "Peer",
                relationName: "AuthorToPeer"
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
                name: "peer",
                type: "Peer",
                relationName: "ImageToPeer"
            }, {
                name: "users",
                type: "User",
                relationName: "ImageToUser"
            }, {
                name: "events",
                type: "Event",
                relationName: "EventToImage"
            }, {
                name: "paymentMethods",
                type: "PaymentMethod",
                relationName: "ImageToPaymentMethod"
            }, {
                name: "banners",
                type: "Banner",
                relationName: "BannerToImage"
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
                name: "migrateToTargetPaymentMethod",
                type: "PaymentMethod",
                relationName: "PaymentMethodMigration"
            }, {
                name: "image",
                type: "Image",
                relationName: "ImageToMemberPlan"
            }, {
                name: "successPage",
                type: "Page",
                relationName: "successPage"
            }, {
                name: "failPage",
                type: "Page",
                relationName: "failPage"
            }, {
                name: "confirmationPage",
                type: "Page",
                relationName: "confirmationPage"
            }, {
                name: "subscription",
                type: "Subscription",
                relationName: "MemberPlanToSubscription"
            }, {
                name: "subscriptionFlows",
                type: "SubscriptionFlow",
                relationName: "MemberPlanToSubscriptionFlow"
            }, {
                name: "crowdfundings",
                type: "Crowdfunding",
                relationName: "CrowdfundingToMemberPlan"
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
                name: "page",
                type: "Page",
                relationName: "PageToPageRevision"
            }, {
                name: "user",
                type: "User",
                relationName: "PageRevisionToUser"
            }]
    }, {
        name: "Page",
        fields: [{
                name: "revisions",
                type: "PageRevision",
                relationName: "PageToPageRevision"
            }, {
                name: "navigations",
                type: "NavigationLink",
                relationName: "NavigationLinkToPage"
            }, {
                name: "tags",
                type: "TaggedPages",
                relationName: "PageToTaggedPages"
            }, {
                name: "memberPlansSuccess",
                type: "MemberPlan",
                relationName: "successPage"
            }, {
                name: "memberPlansFail",
                type: "MemberPlan",
                relationName: "failPage"
            }, {
                name: "memberPlansConfirmation",
                type: "MemberPlan",
                relationName: "confirmationPage"
            }, {
                name: "banners",
                type: "Banner",
                relationName: "BannerToPage"
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
                name: "image",
                type: "Image",
                relationName: "ImageToPaymentMethod"
            }, {
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
            }, {
                name: "migrateFromPlans",
                type: "MemberPlan",
                relationName: "PaymentMethodMigration"
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
                name: "articles",
                type: "Article",
                relationName: "ArticleToPeer"
            }, {
                name: "images",
                type: "Image",
                relationName: "ImageToPeer"
            }, {
                name: "tags",
                type: "Tag",
                relationName: "PeerToTag"
            }, {
                name: "authors",
                type: "Author",
                relationName: "AuthorToPeer"
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
                name: "replacesSubscription",
                type: "Subscription",
                relationName: "ReplacementHistory"
            }, {
                name: "replacedBy",
                type: "Subscription",
                relationName: "ReplacementHistory"
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
                name: "comments",
                type: "Comment",
                relationName: "CommentToUser"
            }, {
                name: "sessions",
                type: "Session",
                relationName: "SessionToUser"
            }, {
                name: "subscriptions",
                type: "Subscription",
                relationName: "SubscriptionToUser"
            }, {
                name: "commentRatings",
                type: "CommentRating",
                relationName: "CommentRatingToUser"
            }, {
                name: "pollVotes",
                type: "PollVote",
                relationName: "PollVoteToUser"
            }, {
                name: "mailSent",
                type: "MailLog",
                relationName: "MailLogToUser"
            }, {
                name: "consents",
                type: "UserConsent",
                relationName: "UserToUserConsent"
            }, {
                name: "articleRevisions",
                type: "ArticleRevision",
                relationName: "ArticleRevisionToUser"
            }, {
                name: "pageRevisions",
                type: "PageRevision",
                relationName: "PageRevisionToUser"
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
                name: "peer",
                type: "Peer",
                relationName: "PeerToTag"
            }, {
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
    }, {
        name: "Banner",
        fields: [{
                name: "image",
                type: "Image",
                relationName: "BannerToImage"
            }, {
                name: "showOnPages",
                type: "Page",
                relationName: "BannerToPage"
            }, {
                name: "actions",
                type: "BannerAction",
                relationName: "BannerToBannerAction"
            }]
    }, {
        name: "BannerAction",
        fields: [{
                name: "banner",
                type: "Banner",
                relationName: "BannerToBannerAction"
            }]
    }, {
        name: "Crowdfunding",
        fields: [{
                name: "memberPlans",
                type: "MemberPlan",
                relationName: "CrowdfundingToMemberPlan"
            }, {
                name: "goals",
                type: "CrowdfundingGoal",
                relationName: "CrowdfundingToCrowdfundingGoal"
            }]
    }, {
        name: "CrowdfundingGoal",
        fields: [{
                name: "Crowdfunding",
                type: "Crowdfunding",
                relationName: "CrowdfundingToCrowdfundingGoal"
            }]
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
function autoGenerateMetadataPropertyScalarsOrEnums(_a) {
    var seq = _a.seq;
    return {
        key: (0, internal_1.getScalarFieldValueGenerator)().String({ modelName: "MetadataProperty", fieldName: "key", isId: false, isUnique: false, seq: seq }),
        value: (0, internal_1.getScalarFieldValueGenerator)().String({ modelName: "MetadataProperty", fieldName: "value", isId: false, isUnique: false, seq: seq }),
        public: (0, internal_1.getScalarFieldValueGenerator)().Boolean({ modelName: "MetadataProperty", fieldName: "public", isId: false, isUnique: false, seq: seq })
    };
}
function defineMetadataPropertyFactoryInternal(_a) {
    var _this = this;
    var defaultDataResolver = _a.defaultData, _b = _a.traits, traitsDefs = _b === void 0 ? {} : _b;
    var getFactoryWithTraits = function (traitKeys) {
        if (traitKeys === void 0) { traitKeys = []; }
        var seqKey = {};
        var getSeq = function () { return (0, internal_1.getSequenceCounter)(seqKey); };
        var screen = (0, internal_1.createScreener)("MetadataProperty", modelFieldDefinitions);
        var build = function () {
            var args_1 = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args_1[_i] = arguments[_i];
            }
            return __awaiter(_this, __spreadArray([], args_1, true), void 0, function (inputData) {
                var seq, requiredScalarData, resolveValue, defaultData, defaultAssociations, _a, _b, _c, _d, data;
                var _e, _f, _g, _h, _j;
                var _this = this;
                if (inputData === void 0) { inputData = {}; }
                return __generator(this, function (_k) {
                    switch (_k.label) {
                        case 0:
                            seq = getSeq();
                            requiredScalarData = autoGenerateMetadataPropertyScalarsOrEnums({ seq: seq });
                            resolveValue = (0, internal_1.normalizeResolver)(defaultDataResolver !== null && defaultDataResolver !== void 0 ? defaultDataResolver : {});
                            return [4 /*yield*/, traitKeys.reduce(function (queue, traitKey) { return __awaiter(_this, void 0, void 0, function () {
                                    var acc, resolveTraitValue, traitData;
                                    var _a, _b;
                                    return __generator(this, function (_c) {
                                        switch (_c.label) {
                                            case 0: return [4 /*yield*/, queue];
                                            case 1:
                                                acc = _c.sent();
                                                resolveTraitValue = (0, internal_1.normalizeResolver)((_b = (_a = traitsDefs[traitKey]) === null || _a === void 0 ? void 0 : _a.data) !== null && _b !== void 0 ? _b : {});
                                                return [4 /*yield*/, resolveTraitValue({ seq: seq })];
                                            case 2:
                                                traitData = _c.sent();
                                                return [2 /*return*/, __assign(__assign({}, acc), traitData)];
                                        }
                                    });
                                }); }, resolveValue({ seq: seq }))];
                        case 1:
                            defaultData = _k.sent();
                            _e = {};
                            if (!isMetadataPropertyArticleRevisionFactory(defaultData.ArticleRevision)) return [3 /*break*/, 3];
                            _f = {};
                            return [4 /*yield*/, defaultData.ArticleRevision.build()];
                        case 2:
                            _a = (_f.create = _k.sent(),
                                _f);
                            return [3 /*break*/, 4];
                        case 3:
                            _a = defaultData.ArticleRevision;
                            _k.label = 4;
                        case 4:
                            _e.ArticleRevision = _a;
                            if (!isMetadataPropertyPageRevisionFactory(defaultData.PageRevision)) return [3 /*break*/, 6];
                            _g = {};
                            return [4 /*yield*/, defaultData.PageRevision.build()];
                        case 5:
                            _b = (_g.create = _k.sent(),
                                _g);
                            return [3 /*break*/, 7];
                        case 6:
                            _b = defaultData.PageRevision;
                            _k.label = 7;
                        case 7:
                            _e.PageRevision = _b;
                            if (!isMetadataPropertySubscriptionFactory(defaultData.Subscription)) return [3 /*break*/, 9];
                            _h = {};
                            return [4 /*yield*/, defaultData.Subscription.build()];
                        case 8:
                            _c = (_h.create = _k.sent(),
                                _h);
                            return [3 /*break*/, 10];
                        case 9:
                            _c = defaultData.Subscription;
                            _k.label = 10;
                        case 10:
                            _e.Subscription = _c;
                            if (!isMetadataPropertyUserFactory(defaultData.User)) return [3 /*break*/, 12];
                            _j = {};
                            return [4 /*yield*/, defaultData.User.build()];
                        case 11:
                            _d = (_j.create = _k.sent(),
                                _j);
                            return [3 /*break*/, 13];
                        case 12:
                            _d = defaultData.User;
                            _k.label = 13;
                        case 13:
                            defaultAssociations = (_e.User = _d,
                                _e);
                            data = __assign(__assign(__assign(__assign({}, requiredScalarData), defaultData), defaultAssociations), inputData);
                            return [2 /*return*/, data];
                    }
                });
            });
        };
        var buildList = function (inputData) { return Promise.all((0, internal_1.normalizeList)(inputData).map(function (data) { return build(data); })); };
        var pickForConnect = function (inputData) { return ({
            id: inputData.id
        }); };
        var create = function () {
            var args_1 = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args_1[_i] = arguments[_i];
            }
            return __awaiter(_this, __spreadArray([], args_1, true), void 0, function (inputData) {
                var data;
                if (inputData === void 0) { inputData = {}; }
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, build(inputData).then(screen)];
                        case 1:
                            data = _a.sent();
                            return [4 /*yield*/, (0, internal_1.getClient)().metadataProperty.create({ data: data })];
                        case 2: return [2 /*return*/, _a.sent()];
                    }
                });
            });
        };
        var createList = function (inputData) { return Promise.all((0, internal_1.normalizeList)(inputData).map(function (data) { return create(data); })); };
        var createForConnect = function (inputData) {
            if (inputData === void 0) { inputData = {}; }
            return create(inputData).then(pickForConnect);
        };
        return {
            _factoryFor: "MetadataProperty",
            build: build,
            buildList: buildList,
            buildCreateInput: build,
            pickForConnect: pickForConnect,
            create: create,
            createList: createList,
            createForConnect: createForConnect,
        };
    };
    var factory = getFactoryWithTraits();
    var useTraits = function (name) {
        var names = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            names[_i - 1] = arguments[_i];
        }
        return getFactoryWithTraits(__spreadArray([name], names, true));
    };
    return __assign(__assign({}, factory), { use: useTraits });
}
/**
 * Define factory for {@link MetadataProperty} model.
 *
 * @param options
 * @returns factory {@link MetadataPropertyFactoryInterface}
 */
function defineMetadataPropertyFactory(options) {
    return defineMetadataPropertyFactoryInternal(options !== null && options !== void 0 ? options : {});
}
exports.defineMetadataPropertyFactory = defineMetadataPropertyFactory;
function isArticleRevisionimageFactory(x) {
    return (x === null || x === void 0 ? void 0 : x._factoryFor) === "Image";
}
function isArticleRevisionsocialMediaImageFactory(x) {
    return (x === null || x === void 0 ? void 0 : x._factoryFor) === "Image";
}
function isArticleRevisionarticleFactory(x) {
    return (x === null || x === void 0 ? void 0 : x._factoryFor) === "Article";
}
function isArticleRevisionuserFactory(x) {
    return (x === null || x === void 0 ? void 0 : x._factoryFor) === "User";
}
function autoGenerateArticleRevisionScalarsOrEnums(_a) {
    var seq = _a.seq;
    return {
        breaking: (0, internal_1.getScalarFieldValueGenerator)().Boolean({ modelName: "ArticleRevision", fieldName: "breaking", isId: false, isUnique: false, seq: seq }),
        blocks: (0, internal_1.getScalarFieldValueGenerator)().Json({ modelName: "ArticleRevision", fieldName: "blocks", isId: false, isUnique: false, seq: seq }),
        hideAuthor: (0, internal_1.getScalarFieldValueGenerator)().Boolean({ modelName: "ArticleRevision", fieldName: "hideAuthor", isId: false, isUnique: false, seq: seq })
    };
}
function defineArticleRevisionFactoryInternal(_a) {
    var _this = this;
    var defaultDataResolver = _a.defaultData, _b = _a.traits, traitsDefs = _b === void 0 ? {} : _b;
    var getFactoryWithTraits = function (traitKeys) {
        if (traitKeys === void 0) { traitKeys = []; }
        var seqKey = {};
        var getSeq = function () { return (0, internal_1.getSequenceCounter)(seqKey); };
        var screen = (0, internal_1.createScreener)("ArticleRevision", modelFieldDefinitions);
        var build = function () {
            var args_1 = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args_1[_i] = arguments[_i];
            }
            return __awaiter(_this, __spreadArray([], args_1, true), void 0, function (inputData) {
                var seq, requiredScalarData, resolveValue, defaultData, defaultAssociations, _a, _b, _c, _d, data;
                var _e, _f, _g, _h, _j;
                var _this = this;
                if (inputData === void 0) { inputData = {}; }
                return __generator(this, function (_k) {
                    switch (_k.label) {
                        case 0:
                            seq = getSeq();
                            requiredScalarData = autoGenerateArticleRevisionScalarsOrEnums({ seq: seq });
                            resolveValue = (0, internal_1.normalizeResolver)(defaultDataResolver !== null && defaultDataResolver !== void 0 ? defaultDataResolver : {});
                            return [4 /*yield*/, traitKeys.reduce(function (queue, traitKey) { return __awaiter(_this, void 0, void 0, function () {
                                    var acc, resolveTraitValue, traitData;
                                    var _a, _b;
                                    return __generator(this, function (_c) {
                                        switch (_c.label) {
                                            case 0: return [4 /*yield*/, queue];
                                            case 1:
                                                acc = _c.sent();
                                                resolveTraitValue = (0, internal_1.normalizeResolver)((_b = (_a = traitsDefs[traitKey]) === null || _a === void 0 ? void 0 : _a.data) !== null && _b !== void 0 ? _b : {});
                                                return [4 /*yield*/, resolveTraitValue({ seq: seq })];
                                            case 2:
                                                traitData = _c.sent();
                                                return [2 /*return*/, __assign(__assign({}, acc), traitData)];
                                        }
                                    });
                                }); }, resolveValue({ seq: seq }))];
                        case 1:
                            defaultData = _k.sent();
                            _e = {};
                            if (!isArticleRevisionimageFactory(defaultData.image)) return [3 /*break*/, 3];
                            _f = {};
                            return [4 /*yield*/, defaultData.image.build()];
                        case 2:
                            _a = (_f.create = _k.sent(),
                                _f);
                            return [3 /*break*/, 4];
                        case 3:
                            _a = defaultData.image;
                            _k.label = 4;
                        case 4:
                            _e.image = _a;
                            if (!isArticleRevisionsocialMediaImageFactory(defaultData.socialMediaImage)) return [3 /*break*/, 6];
                            _g = {};
                            return [4 /*yield*/, defaultData.socialMediaImage.build()];
                        case 5:
                            _b = (_g.create = _k.sent(),
                                _g);
                            return [3 /*break*/, 7];
                        case 6:
                            _b = defaultData.socialMediaImage;
                            _k.label = 7;
                        case 7:
                            _e.socialMediaImage = _b;
                            if (!isArticleRevisionarticleFactory(defaultData.article)) return [3 /*break*/, 9];
                            _h = {};
                            return [4 /*yield*/, defaultData.article.build()];
                        case 8:
                            _c = (_h.create = _k.sent(),
                                _h);
                            return [3 /*break*/, 10];
                        case 9:
                            _c = defaultData.article;
                            _k.label = 10;
                        case 10:
                            _e.article = _c;
                            if (!isArticleRevisionuserFactory(defaultData.user)) return [3 /*break*/, 12];
                            _j = {};
                            return [4 /*yield*/, defaultData.user.build()];
                        case 11:
                            _d = (_j.create = _k.sent(),
                                _j);
                            return [3 /*break*/, 13];
                        case 12:
                            _d = defaultData.user;
                            _k.label = 13;
                        case 13:
                            defaultAssociations = (_e.user = _d,
                                _e);
                            data = __assign(__assign(__assign(__assign({}, requiredScalarData), defaultData), defaultAssociations), inputData);
                            return [2 /*return*/, data];
                    }
                });
            });
        };
        var buildList = function (inputData) { return Promise.all((0, internal_1.normalizeList)(inputData).map(function (data) { return build(data); })); };
        var pickForConnect = function (inputData) { return ({
            id: inputData.id
        }); };
        var create = function () {
            var args_1 = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args_1[_i] = arguments[_i];
            }
            return __awaiter(_this, __spreadArray([], args_1, true), void 0, function (inputData) {
                var data;
                if (inputData === void 0) { inputData = {}; }
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, build(inputData).then(screen)];
                        case 1:
                            data = _a.sent();
                            return [4 /*yield*/, (0, internal_1.getClient)().articleRevision.create({ data: data })];
                        case 2: return [2 /*return*/, _a.sent()];
                    }
                });
            });
        };
        var createList = function (inputData) { return Promise.all((0, internal_1.normalizeList)(inputData).map(function (data) { return create(data); })); };
        var createForConnect = function (inputData) {
            if (inputData === void 0) { inputData = {}; }
            return create(inputData).then(pickForConnect);
        };
        return {
            _factoryFor: "ArticleRevision",
            build: build,
            buildList: buildList,
            buildCreateInput: build,
            pickForConnect: pickForConnect,
            create: create,
            createList: createList,
            createForConnect: createForConnect,
        };
    };
    var factory = getFactoryWithTraits();
    var useTraits = function (name) {
        var names = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            names[_i - 1] = arguments[_i];
        }
        return getFactoryWithTraits(__spreadArray([name], names, true));
    };
    return __assign(__assign({}, factory), { use: useTraits });
}
/**
 * Define factory for {@link ArticleRevision} model.
 *
 * @param options
 * @returns factory {@link ArticleRevisionFactoryInterface}
 */
function defineArticleRevisionFactory(options) {
    return defineArticleRevisionFactoryInternal(options);
}
exports.defineArticleRevisionFactory = defineArticleRevisionFactory;
function isArticleRevisionAuthorrevisionFactory(x) {
    return (x === null || x === void 0 ? void 0 : x._factoryFor) === "ArticleRevision";
}
function isArticleRevisionAuthorauthorFactory(x) {
    return (x === null || x === void 0 ? void 0 : x._factoryFor) === "Author";
}
function autoGenerateArticleRevisionAuthorScalarsOrEnums(_a) {
    var seq = _a.seq;
    return {};
}
function defineArticleRevisionAuthorFactoryInternal(_a) {
    var _this = this;
    var defaultDataResolver = _a.defaultData, _b = _a.traits, traitsDefs = _b === void 0 ? {} : _b;
    var getFactoryWithTraits = function (traitKeys) {
        if (traitKeys === void 0) { traitKeys = []; }
        var seqKey = {};
        var getSeq = function () { return (0, internal_1.getSequenceCounter)(seqKey); };
        var screen = (0, internal_1.createScreener)("ArticleRevisionAuthor", modelFieldDefinitions);
        var build = function () {
            var args_1 = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args_1[_i] = arguments[_i];
            }
            return __awaiter(_this, __spreadArray([], args_1, true), void 0, function (inputData) {
                var seq, requiredScalarData, resolveValue, defaultData, defaultAssociations, _a, _b, data;
                var _c, _d, _e;
                var _this = this;
                if (inputData === void 0) { inputData = {}; }
                return __generator(this, function (_f) {
                    switch (_f.label) {
                        case 0:
                            seq = getSeq();
                            requiredScalarData = autoGenerateArticleRevisionAuthorScalarsOrEnums({ seq: seq });
                            resolveValue = (0, internal_1.normalizeResolver)(defaultDataResolver !== null && defaultDataResolver !== void 0 ? defaultDataResolver : {});
                            return [4 /*yield*/, traitKeys.reduce(function (queue, traitKey) { return __awaiter(_this, void 0, void 0, function () {
                                    var acc, resolveTraitValue, traitData;
                                    var _a, _b;
                                    return __generator(this, function (_c) {
                                        switch (_c.label) {
                                            case 0: return [4 /*yield*/, queue];
                                            case 1:
                                                acc = _c.sent();
                                                resolveTraitValue = (0, internal_1.normalizeResolver)((_b = (_a = traitsDefs[traitKey]) === null || _a === void 0 ? void 0 : _a.data) !== null && _b !== void 0 ? _b : {});
                                                return [4 /*yield*/, resolveTraitValue({ seq: seq })];
                                            case 2:
                                                traitData = _c.sent();
                                                return [2 /*return*/, __assign(__assign({}, acc), traitData)];
                                        }
                                    });
                                }); }, resolveValue({ seq: seq }))];
                        case 1:
                            defaultData = _f.sent();
                            _c = {};
                            if (!isArticleRevisionAuthorrevisionFactory(defaultData.revision)) return [3 /*break*/, 3];
                            _d = {};
                            return [4 /*yield*/, defaultData.revision.build()];
                        case 2:
                            _a = (_d.create = _f.sent(),
                                _d);
                            return [3 /*break*/, 4];
                        case 3:
                            _a = defaultData.revision;
                            _f.label = 4;
                        case 4:
                            _c.revision = _a;
                            if (!isArticleRevisionAuthorauthorFactory(defaultData.author)) return [3 /*break*/, 6];
                            _e = {};
                            return [4 /*yield*/, defaultData.author.build()];
                        case 5:
                            _b = (_e.create = _f.sent(),
                                _e);
                            return [3 /*break*/, 7];
                        case 6:
                            _b = defaultData.author;
                            _f.label = 7;
                        case 7:
                            defaultAssociations = (_c.author = _b,
                                _c);
                            data = __assign(__assign(__assign(__assign({}, requiredScalarData), defaultData), defaultAssociations), inputData);
                            return [2 /*return*/, data];
                    }
                });
            });
        };
        var buildList = function (inputData) { return Promise.all((0, internal_1.normalizeList)(inputData).map(function (data) { return build(data); })); };
        var pickForConnect = function (inputData) { return ({
            revisionId: inputData.revisionId,
            authorId: inputData.authorId
        }); };
        var create = function () {
            var args_1 = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args_1[_i] = arguments[_i];
            }
            return __awaiter(_this, __spreadArray([], args_1, true), void 0, function (inputData) {
                var data;
                if (inputData === void 0) { inputData = {}; }
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, build(inputData).then(screen)];
                        case 1:
                            data = _a.sent();
                            return [4 /*yield*/, (0, internal_1.getClient)().articleRevisionAuthor.create({ data: data })];
                        case 2: return [2 /*return*/, _a.sent()];
                    }
                });
            });
        };
        var createList = function (inputData) { return Promise.all((0, internal_1.normalizeList)(inputData).map(function (data) { return create(data); })); };
        var createForConnect = function (inputData) {
            if (inputData === void 0) { inputData = {}; }
            return create(inputData).then(pickForConnect);
        };
        return {
            _factoryFor: "ArticleRevisionAuthor",
            build: build,
            buildList: buildList,
            buildCreateInput: build,
            pickForConnect: pickForConnect,
            create: create,
            createList: createList,
            createForConnect: createForConnect,
        };
    };
    var factory = getFactoryWithTraits();
    var useTraits = function (name) {
        var names = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            names[_i - 1] = arguments[_i];
        }
        return getFactoryWithTraits(__spreadArray([name], names, true));
    };
    return __assign(__assign({}, factory), { use: useTraits });
}
/**
 * Define factory for {@link ArticleRevisionAuthor} model.
 *
 * @param options
 * @returns factory {@link ArticleRevisionAuthorFactoryInterface}
 */
function defineArticleRevisionAuthorFactory(options) {
    return defineArticleRevisionAuthorFactoryInternal(options);
}
exports.defineArticleRevisionAuthorFactory = defineArticleRevisionAuthorFactory;
function isArticleRevisionSocialMediaAuthorrevisionFactory(x) {
    return (x === null || x === void 0 ? void 0 : x._factoryFor) === "ArticleRevision";
}
function isArticleRevisionSocialMediaAuthorauthorFactory(x) {
    return (x === null || x === void 0 ? void 0 : x._factoryFor) === "Author";
}
function autoGenerateArticleRevisionSocialMediaAuthorScalarsOrEnums(_a) {
    var seq = _a.seq;
    return {};
}
function defineArticleRevisionSocialMediaAuthorFactoryInternal(_a) {
    var _this = this;
    var defaultDataResolver = _a.defaultData, _b = _a.traits, traitsDefs = _b === void 0 ? {} : _b;
    var getFactoryWithTraits = function (traitKeys) {
        if (traitKeys === void 0) { traitKeys = []; }
        var seqKey = {};
        var getSeq = function () { return (0, internal_1.getSequenceCounter)(seqKey); };
        var screen = (0, internal_1.createScreener)("ArticleRevisionSocialMediaAuthor", modelFieldDefinitions);
        var build = function () {
            var args_1 = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args_1[_i] = arguments[_i];
            }
            return __awaiter(_this, __spreadArray([], args_1, true), void 0, function (inputData) {
                var seq, requiredScalarData, resolveValue, defaultData, defaultAssociations, _a, _b, data;
                var _c, _d, _e;
                var _this = this;
                if (inputData === void 0) { inputData = {}; }
                return __generator(this, function (_f) {
                    switch (_f.label) {
                        case 0:
                            seq = getSeq();
                            requiredScalarData = autoGenerateArticleRevisionSocialMediaAuthorScalarsOrEnums({ seq: seq });
                            resolveValue = (0, internal_1.normalizeResolver)(defaultDataResolver !== null && defaultDataResolver !== void 0 ? defaultDataResolver : {});
                            return [4 /*yield*/, traitKeys.reduce(function (queue, traitKey) { return __awaiter(_this, void 0, void 0, function () {
                                    var acc, resolveTraitValue, traitData;
                                    var _a, _b;
                                    return __generator(this, function (_c) {
                                        switch (_c.label) {
                                            case 0: return [4 /*yield*/, queue];
                                            case 1:
                                                acc = _c.sent();
                                                resolveTraitValue = (0, internal_1.normalizeResolver)((_b = (_a = traitsDefs[traitKey]) === null || _a === void 0 ? void 0 : _a.data) !== null && _b !== void 0 ? _b : {});
                                                return [4 /*yield*/, resolveTraitValue({ seq: seq })];
                                            case 2:
                                                traitData = _c.sent();
                                                return [2 /*return*/, __assign(__assign({}, acc), traitData)];
                                        }
                                    });
                                }); }, resolveValue({ seq: seq }))];
                        case 1:
                            defaultData = _f.sent();
                            _c = {};
                            if (!isArticleRevisionSocialMediaAuthorrevisionFactory(defaultData.revision)) return [3 /*break*/, 3];
                            _d = {};
                            return [4 /*yield*/, defaultData.revision.build()];
                        case 2:
                            _a = (_d.create = _f.sent(),
                                _d);
                            return [3 /*break*/, 4];
                        case 3:
                            _a = defaultData.revision;
                            _f.label = 4;
                        case 4:
                            _c.revision = _a;
                            if (!isArticleRevisionSocialMediaAuthorauthorFactory(defaultData.author)) return [3 /*break*/, 6];
                            _e = {};
                            return [4 /*yield*/, defaultData.author.build()];
                        case 5:
                            _b = (_e.create = _f.sent(),
                                _e);
                            return [3 /*break*/, 7];
                        case 6:
                            _b = defaultData.author;
                            _f.label = 7;
                        case 7:
                            defaultAssociations = (_c.author = _b,
                                _c);
                            data = __assign(__assign(__assign(__assign({}, requiredScalarData), defaultData), defaultAssociations), inputData);
                            return [2 /*return*/, data];
                    }
                });
            });
        };
        var buildList = function (inputData) { return Promise.all((0, internal_1.normalizeList)(inputData).map(function (data) { return build(data); })); };
        var pickForConnect = function (inputData) { return ({
            revisionId: inputData.revisionId,
            authorId: inputData.authorId
        }); };
        var create = function () {
            var args_1 = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args_1[_i] = arguments[_i];
            }
            return __awaiter(_this, __spreadArray([], args_1, true), void 0, function (inputData) {
                var data;
                if (inputData === void 0) { inputData = {}; }
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, build(inputData).then(screen)];
                        case 1:
                            data = _a.sent();
                            return [4 /*yield*/, (0, internal_1.getClient)().articleRevisionSocialMediaAuthor.create({ data: data })];
                        case 2: return [2 /*return*/, _a.sent()];
                    }
                });
            });
        };
        var createList = function (inputData) { return Promise.all((0, internal_1.normalizeList)(inputData).map(function (data) { return create(data); })); };
        var createForConnect = function (inputData) {
            if (inputData === void 0) { inputData = {}; }
            return create(inputData).then(pickForConnect);
        };
        return {
            _factoryFor: "ArticleRevisionSocialMediaAuthor",
            build: build,
            buildList: buildList,
            buildCreateInput: build,
            pickForConnect: pickForConnect,
            create: create,
            createList: createList,
            createForConnect: createForConnect,
        };
    };
    var factory = getFactoryWithTraits();
    var useTraits = function (name) {
        var names = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            names[_i - 1] = arguments[_i];
        }
        return getFactoryWithTraits(__spreadArray([name], names, true));
    };
    return __assign(__assign({}, factory), { use: useTraits });
}
/**
 * Define factory for {@link ArticleRevisionSocialMediaAuthor} model.
 *
 * @param options
 * @returns factory {@link ArticleRevisionSocialMediaAuthorFactoryInterface}
 */
function defineArticleRevisionSocialMediaAuthorFactory(options) {
    return defineArticleRevisionSocialMediaAuthorFactoryInternal(options);
}
exports.defineArticleRevisionSocialMediaAuthorFactory = defineArticleRevisionSocialMediaAuthorFactory;
function isArticlepeerFactory(x) {
    return (x === null || x === void 0 ? void 0 : x._factoryFor) === "Peer";
}
function autoGenerateArticleScalarsOrEnums(_a) {
    var seq = _a.seq;
    return {
        shared: (0, internal_1.getScalarFieldValueGenerator)().Boolean({ modelName: "Article", fieldName: "shared", isId: false, isUnique: false, seq: seq })
    };
}
function defineArticleFactoryInternal(_a) {
    var _this = this;
    var defaultDataResolver = _a.defaultData, _b = _a.traits, traitsDefs = _b === void 0 ? {} : _b;
    var getFactoryWithTraits = function (traitKeys) {
        if (traitKeys === void 0) { traitKeys = []; }
        var seqKey = {};
        var getSeq = function () { return (0, internal_1.getSequenceCounter)(seqKey); };
        var screen = (0, internal_1.createScreener)("Article", modelFieldDefinitions);
        var build = function () {
            var args_1 = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args_1[_i] = arguments[_i];
            }
            return __awaiter(_this, __spreadArray([], args_1, true), void 0, function (inputData) {
                var seq, requiredScalarData, resolveValue, defaultData, defaultAssociations, _a, data;
                var _b, _c;
                var _this = this;
                if (inputData === void 0) { inputData = {}; }
                return __generator(this, function (_d) {
                    switch (_d.label) {
                        case 0:
                            seq = getSeq();
                            requiredScalarData = autoGenerateArticleScalarsOrEnums({ seq: seq });
                            resolveValue = (0, internal_1.normalizeResolver)(defaultDataResolver !== null && defaultDataResolver !== void 0 ? defaultDataResolver : {});
                            return [4 /*yield*/, traitKeys.reduce(function (queue, traitKey) { return __awaiter(_this, void 0, void 0, function () {
                                    var acc, resolveTraitValue, traitData;
                                    var _a, _b;
                                    return __generator(this, function (_c) {
                                        switch (_c.label) {
                                            case 0: return [4 /*yield*/, queue];
                                            case 1:
                                                acc = _c.sent();
                                                resolveTraitValue = (0, internal_1.normalizeResolver)((_b = (_a = traitsDefs[traitKey]) === null || _a === void 0 ? void 0 : _a.data) !== null && _b !== void 0 ? _b : {});
                                                return [4 /*yield*/, resolveTraitValue({ seq: seq })];
                                            case 2:
                                                traitData = _c.sent();
                                                return [2 /*return*/, __assign(__assign({}, acc), traitData)];
                                        }
                                    });
                                }); }, resolveValue({ seq: seq }))];
                        case 1:
                            defaultData = _d.sent();
                            _b = {};
                            if (!isArticlepeerFactory(defaultData.peer)) return [3 /*break*/, 3];
                            _c = {};
                            return [4 /*yield*/, defaultData.peer.build()];
                        case 2:
                            _a = (_c.create = _d.sent(),
                                _c);
                            return [3 /*break*/, 4];
                        case 3:
                            _a = defaultData.peer;
                            _d.label = 4;
                        case 4:
                            defaultAssociations = (_b.peer = _a,
                                _b);
                            data = __assign(__assign(__assign(__assign({}, requiredScalarData), defaultData), defaultAssociations), inputData);
                            return [2 /*return*/, data];
                    }
                });
            });
        };
        var buildList = function (inputData) { return Promise.all((0, internal_1.normalizeList)(inputData).map(function (data) { return build(data); })); };
        var pickForConnect = function (inputData) { return ({
            id: inputData.id
        }); };
        var create = function () {
            var args_1 = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args_1[_i] = arguments[_i];
            }
            return __awaiter(_this, __spreadArray([], args_1, true), void 0, function (inputData) {
                var data;
                if (inputData === void 0) { inputData = {}; }
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, build(inputData).then(screen)];
                        case 1:
                            data = _a.sent();
                            return [4 /*yield*/, (0, internal_1.getClient)().article.create({ data: data })];
                        case 2: return [2 /*return*/, _a.sent()];
                    }
                });
            });
        };
        var createList = function (inputData) { return Promise.all((0, internal_1.normalizeList)(inputData).map(function (data) { return create(data); })); };
        var createForConnect = function (inputData) {
            if (inputData === void 0) { inputData = {}; }
            return create(inputData).then(pickForConnect);
        };
        return {
            _factoryFor: "Article",
            build: build,
            buildList: buildList,
            buildCreateInput: build,
            pickForConnect: pickForConnect,
            create: create,
            createList: createList,
            createForConnect: createForConnect,
        };
    };
    var factory = getFactoryWithTraits();
    var useTraits = function (name) {
        var names = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            names[_i - 1] = arguments[_i];
        }
        return getFactoryWithTraits(__spreadArray([name], names, true));
    };
    return __assign(__assign({}, factory), { use: useTraits });
}
/**
 * Define factory for {@link Article} model.
 *
 * @param options
 * @returns factory {@link ArticleFactoryInterface}
 */
function defineArticleFactory(options) {
    return defineArticleFactoryInternal(options !== null && options !== void 0 ? options : {});
}
exports.defineArticleFactory = defineArticleFactory;
function isArticleTrackingPixelsarticleFactory(x) {
    return (x === null || x === void 0 ? void 0 : x._factoryFor) === "Article";
}
function isArticleTrackingPixelstrackingPixelMethodFactory(x) {
    return (x === null || x === void 0 ? void 0 : x._factoryFor) === "TrackingPixelMethod";
}
function autoGenerateArticleTrackingPixelsScalarsOrEnums(_a) {
    var seq = _a.seq;
    return {};
}
function defineArticleTrackingPixelsFactoryInternal(_a) {
    var _this = this;
    var defaultDataResolver = _a.defaultData, _b = _a.traits, traitsDefs = _b === void 0 ? {} : _b;
    var getFactoryWithTraits = function (traitKeys) {
        if (traitKeys === void 0) { traitKeys = []; }
        var seqKey = {};
        var getSeq = function () { return (0, internal_1.getSequenceCounter)(seqKey); };
        var screen = (0, internal_1.createScreener)("ArticleTrackingPixels", modelFieldDefinitions);
        var build = function () {
            var args_1 = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args_1[_i] = arguments[_i];
            }
            return __awaiter(_this, __spreadArray([], args_1, true), void 0, function (inputData) {
                var seq, requiredScalarData, resolveValue, defaultData, defaultAssociations, _a, _b, data;
                var _c, _d, _e;
                var _this = this;
                if (inputData === void 0) { inputData = {}; }
                return __generator(this, function (_f) {
                    switch (_f.label) {
                        case 0:
                            seq = getSeq();
                            requiredScalarData = autoGenerateArticleTrackingPixelsScalarsOrEnums({ seq: seq });
                            resolveValue = (0, internal_1.normalizeResolver)(defaultDataResolver !== null && defaultDataResolver !== void 0 ? defaultDataResolver : {});
                            return [4 /*yield*/, traitKeys.reduce(function (queue, traitKey) { return __awaiter(_this, void 0, void 0, function () {
                                    var acc, resolveTraitValue, traitData;
                                    var _a, _b;
                                    return __generator(this, function (_c) {
                                        switch (_c.label) {
                                            case 0: return [4 /*yield*/, queue];
                                            case 1:
                                                acc = _c.sent();
                                                resolveTraitValue = (0, internal_1.normalizeResolver)((_b = (_a = traitsDefs[traitKey]) === null || _a === void 0 ? void 0 : _a.data) !== null && _b !== void 0 ? _b : {});
                                                return [4 /*yield*/, resolveTraitValue({ seq: seq })];
                                            case 2:
                                                traitData = _c.sent();
                                                return [2 /*return*/, __assign(__assign({}, acc), traitData)];
                                        }
                                    });
                                }); }, resolveValue({ seq: seq }))];
                        case 1:
                            defaultData = _f.sent();
                            _c = {};
                            if (!isArticleTrackingPixelsarticleFactory(defaultData.article)) return [3 /*break*/, 3];
                            _d = {};
                            return [4 /*yield*/, defaultData.article.build()];
                        case 2:
                            _a = (_d.create = _f.sent(),
                                _d);
                            return [3 /*break*/, 4];
                        case 3:
                            _a = defaultData.article;
                            _f.label = 4;
                        case 4:
                            _c.article = _a;
                            if (!isArticleTrackingPixelstrackingPixelMethodFactory(defaultData.trackingPixelMethod)) return [3 /*break*/, 6];
                            _e = {};
                            return [4 /*yield*/, defaultData.trackingPixelMethod.build()];
                        case 5:
                            _b = (_e.create = _f.sent(),
                                _e);
                            return [3 /*break*/, 7];
                        case 6:
                            _b = defaultData.trackingPixelMethod;
                            _f.label = 7;
                        case 7:
                            defaultAssociations = (_c.trackingPixelMethod = _b,
                                _c);
                            data = __assign(__assign(__assign(__assign({}, requiredScalarData), defaultData), defaultAssociations), inputData);
                            return [2 /*return*/, data];
                    }
                });
            });
        };
        var buildList = function (inputData) { return Promise.all((0, internal_1.normalizeList)(inputData).map(function (data) { return build(data); })); };
        var pickForConnect = function (inputData) { return ({
            id: inputData.id
        }); };
        var create = function () {
            var args_1 = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args_1[_i] = arguments[_i];
            }
            return __awaiter(_this, __spreadArray([], args_1, true), void 0, function (inputData) {
                var data;
                if (inputData === void 0) { inputData = {}; }
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, build(inputData).then(screen)];
                        case 1:
                            data = _a.sent();
                            return [4 /*yield*/, (0, internal_1.getClient)().articleTrackingPixels.create({ data: data })];
                        case 2: return [2 /*return*/, _a.sent()];
                    }
                });
            });
        };
        var createList = function (inputData) { return Promise.all((0, internal_1.normalizeList)(inputData).map(function (data) { return create(data); })); };
        var createForConnect = function (inputData) {
            if (inputData === void 0) { inputData = {}; }
            return create(inputData).then(pickForConnect);
        };
        return {
            _factoryFor: "ArticleTrackingPixels",
            build: build,
            buildList: buildList,
            buildCreateInput: build,
            pickForConnect: pickForConnect,
            create: create,
            createList: createList,
            createForConnect: createForConnect,
        };
    };
    var factory = getFactoryWithTraits();
    var useTraits = function (name) {
        var names = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            names[_i - 1] = arguments[_i];
        }
        return getFactoryWithTraits(__spreadArray([name], names, true));
    };
    return __assign(__assign({}, factory), { use: useTraits });
}
/**
 * Define factory for {@link ArticleTrackingPixels} model.
 *
 * @param options
 * @returns factory {@link ArticleTrackingPixelsFactoryInterface}
 */
function defineArticleTrackingPixelsFactory(options) {
    return defineArticleTrackingPixelsFactoryInternal(options);
}
exports.defineArticleTrackingPixelsFactory = defineArticleTrackingPixelsFactory;
function autoGenerateTrackingPixelMethodScalarsOrEnums(_a) {
    var seq = _a.seq;
    return {
        trackingPixelProviderID: (0, internal_1.getScalarFieldValueGenerator)().String({ modelName: "TrackingPixelMethod", fieldName: "trackingPixelProviderID", isId: false, isUnique: true, seq: seq }),
        trackingPixelProviderType: "prolitteris"
    };
}
function defineTrackingPixelMethodFactoryInternal(_a) {
    var _this = this;
    var defaultDataResolver = _a.defaultData, _b = _a.traits, traitsDefs = _b === void 0 ? {} : _b;
    var getFactoryWithTraits = function (traitKeys) {
        if (traitKeys === void 0) { traitKeys = []; }
        var seqKey = {};
        var getSeq = function () { return (0, internal_1.getSequenceCounter)(seqKey); };
        var screen = (0, internal_1.createScreener)("TrackingPixelMethod", modelFieldDefinitions);
        var build = function () {
            var args_1 = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args_1[_i] = arguments[_i];
            }
            return __awaiter(_this, __spreadArray([], args_1, true), void 0, function (inputData) {
                var seq, requiredScalarData, resolveValue, defaultData, defaultAssociations, data;
                var _this = this;
                if (inputData === void 0) { inputData = {}; }
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            seq = getSeq();
                            requiredScalarData = autoGenerateTrackingPixelMethodScalarsOrEnums({ seq: seq });
                            resolveValue = (0, internal_1.normalizeResolver)(defaultDataResolver !== null && defaultDataResolver !== void 0 ? defaultDataResolver : {});
                            return [4 /*yield*/, traitKeys.reduce(function (queue, traitKey) { return __awaiter(_this, void 0, void 0, function () {
                                    var acc, resolveTraitValue, traitData;
                                    var _a, _b;
                                    return __generator(this, function (_c) {
                                        switch (_c.label) {
                                            case 0: return [4 /*yield*/, queue];
                                            case 1:
                                                acc = _c.sent();
                                                resolveTraitValue = (0, internal_1.normalizeResolver)((_b = (_a = traitsDefs[traitKey]) === null || _a === void 0 ? void 0 : _a.data) !== null && _b !== void 0 ? _b : {});
                                                return [4 /*yield*/, resolveTraitValue({ seq: seq })];
                                            case 2:
                                                traitData = _c.sent();
                                                return [2 /*return*/, __assign(__assign({}, acc), traitData)];
                                        }
                                    });
                                }); }, resolveValue({ seq: seq }))];
                        case 1:
                            defaultData = _a.sent();
                            defaultAssociations = {};
                            data = __assign(__assign(__assign(__assign({}, requiredScalarData), defaultData), defaultAssociations), inputData);
                            return [2 /*return*/, data];
                    }
                });
            });
        };
        var buildList = function (inputData) { return Promise.all((0, internal_1.normalizeList)(inputData).map(function (data) { return build(data); })); };
        var pickForConnect = function (inputData) { return ({
            id: inputData.id
        }); };
        var create = function () {
            var args_1 = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args_1[_i] = arguments[_i];
            }
            return __awaiter(_this, __spreadArray([], args_1, true), void 0, function (inputData) {
                var data;
                if (inputData === void 0) { inputData = {}; }
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, build(inputData).then(screen)];
                        case 1:
                            data = _a.sent();
                            return [4 /*yield*/, (0, internal_1.getClient)().trackingPixelMethod.create({ data: data })];
                        case 2: return [2 /*return*/, _a.sent()];
                    }
                });
            });
        };
        var createList = function (inputData) { return Promise.all((0, internal_1.normalizeList)(inputData).map(function (data) { return create(data); })); };
        var createForConnect = function (inputData) {
            if (inputData === void 0) { inputData = {}; }
            return create(inputData).then(pickForConnect);
        };
        return {
            _factoryFor: "TrackingPixelMethod",
            build: build,
            buildList: buildList,
            buildCreateInput: build,
            pickForConnect: pickForConnect,
            create: create,
            createList: createList,
            createForConnect: createForConnect,
        };
    };
    var factory = getFactoryWithTraits();
    var useTraits = function (name) {
        var names = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            names[_i - 1] = arguments[_i];
        }
        return getFactoryWithTraits(__spreadArray([name], names, true));
    };
    return __assign(__assign({}, factory), { use: useTraits });
}
/**
 * Define factory for {@link TrackingPixelMethod} model.
 *
 * @param options
 * @returns factory {@link TrackingPixelMethodFactoryInterface}
 */
function defineTrackingPixelMethodFactory(options) {
    return defineTrackingPixelMethodFactoryInternal(options !== null && options !== void 0 ? options : {});
}
exports.defineTrackingPixelMethodFactory = defineTrackingPixelMethodFactory;
function isTaggedArticlesarticleFactory(x) {
    return (x === null || x === void 0 ? void 0 : x._factoryFor) === "Article";
}
function isTaggedArticlestagFactory(x) {
    return (x === null || x === void 0 ? void 0 : x._factoryFor) === "Tag";
}
function autoGenerateTaggedArticlesScalarsOrEnums(_a) {
    var seq = _a.seq;
    return {};
}
function defineTaggedArticlesFactoryInternal(_a) {
    var _this = this;
    var defaultDataResolver = _a.defaultData, _b = _a.traits, traitsDefs = _b === void 0 ? {} : _b;
    var getFactoryWithTraits = function (traitKeys) {
        if (traitKeys === void 0) { traitKeys = []; }
        var seqKey = {};
        var getSeq = function () { return (0, internal_1.getSequenceCounter)(seqKey); };
        var screen = (0, internal_1.createScreener)("TaggedArticles", modelFieldDefinitions);
        var build = function () {
            var args_1 = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args_1[_i] = arguments[_i];
            }
            return __awaiter(_this, __spreadArray([], args_1, true), void 0, function (inputData) {
                var seq, requiredScalarData, resolveValue, defaultData, defaultAssociations, _a, _b, data;
                var _c, _d, _e;
                var _this = this;
                if (inputData === void 0) { inputData = {}; }
                return __generator(this, function (_f) {
                    switch (_f.label) {
                        case 0:
                            seq = getSeq();
                            requiredScalarData = autoGenerateTaggedArticlesScalarsOrEnums({ seq: seq });
                            resolveValue = (0, internal_1.normalizeResolver)(defaultDataResolver !== null && defaultDataResolver !== void 0 ? defaultDataResolver : {});
                            return [4 /*yield*/, traitKeys.reduce(function (queue, traitKey) { return __awaiter(_this, void 0, void 0, function () {
                                    var acc, resolveTraitValue, traitData;
                                    var _a, _b;
                                    return __generator(this, function (_c) {
                                        switch (_c.label) {
                                            case 0: return [4 /*yield*/, queue];
                                            case 1:
                                                acc = _c.sent();
                                                resolveTraitValue = (0, internal_1.normalizeResolver)((_b = (_a = traitsDefs[traitKey]) === null || _a === void 0 ? void 0 : _a.data) !== null && _b !== void 0 ? _b : {});
                                                return [4 /*yield*/, resolveTraitValue({ seq: seq })];
                                            case 2:
                                                traitData = _c.sent();
                                                return [2 /*return*/, __assign(__assign({}, acc), traitData)];
                                        }
                                    });
                                }); }, resolveValue({ seq: seq }))];
                        case 1:
                            defaultData = _f.sent();
                            _c = {};
                            if (!isTaggedArticlesarticleFactory(defaultData.article)) return [3 /*break*/, 3];
                            _d = {};
                            return [4 /*yield*/, defaultData.article.build()];
                        case 2:
                            _a = (_d.create = _f.sent(),
                                _d);
                            return [3 /*break*/, 4];
                        case 3:
                            _a = defaultData.article;
                            _f.label = 4;
                        case 4:
                            _c.article = _a;
                            if (!isTaggedArticlestagFactory(defaultData.tag)) return [3 /*break*/, 6];
                            _e = {};
                            return [4 /*yield*/, defaultData.tag.build()];
                        case 5:
                            _b = (_e.create = _f.sent(),
                                _e);
                            return [3 /*break*/, 7];
                        case 6:
                            _b = defaultData.tag;
                            _f.label = 7;
                        case 7:
                            defaultAssociations = (_c.tag = _b,
                                _c);
                            data = __assign(__assign(__assign(__assign({}, requiredScalarData), defaultData), defaultAssociations), inputData);
                            return [2 /*return*/, data];
                    }
                });
            });
        };
        var buildList = function (inputData) { return Promise.all((0, internal_1.normalizeList)(inputData).map(function (data) { return build(data); })); };
        var pickForConnect = function (inputData) { return ({
            articleId: inputData.articleId,
            tagId: inputData.tagId
        }); };
        var create = function () {
            var args_1 = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args_1[_i] = arguments[_i];
            }
            return __awaiter(_this, __spreadArray([], args_1, true), void 0, function (inputData) {
                var data;
                if (inputData === void 0) { inputData = {}; }
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, build(inputData).then(screen)];
                        case 1:
                            data = _a.sent();
                            return [4 /*yield*/, (0, internal_1.getClient)().taggedArticles.create({ data: data })];
                        case 2: return [2 /*return*/, _a.sent()];
                    }
                });
            });
        };
        var createList = function (inputData) { return Promise.all((0, internal_1.normalizeList)(inputData).map(function (data) { return create(data); })); };
        var createForConnect = function (inputData) {
            if (inputData === void 0) { inputData = {}; }
            return create(inputData).then(pickForConnect);
        };
        return {
            _factoryFor: "TaggedArticles",
            build: build,
            buildList: buildList,
            buildCreateInput: build,
            pickForConnect: pickForConnect,
            create: create,
            createList: createList,
            createForConnect: createForConnect,
        };
    };
    var factory = getFactoryWithTraits();
    var useTraits = function (name) {
        var names = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            names[_i - 1] = arguments[_i];
        }
        return getFactoryWithTraits(__spreadArray([name], names, true));
    };
    return __assign(__assign({}, factory), { use: useTraits });
}
/**
 * Define factory for {@link TaggedArticles} model.
 *
 * @param options
 * @returns factory {@link TaggedArticlesFactoryInterface}
 */
function defineTaggedArticlesFactory(options) {
    return defineTaggedArticlesFactoryInternal(options);
}
exports.defineTaggedArticlesFactory = defineTaggedArticlesFactory;
function isAuthorsLinksAuthorFactory(x) {
    return (x === null || x === void 0 ? void 0 : x._factoryFor) === "Author";
}
function autoGenerateAuthorsLinksScalarsOrEnums(_a) {
    var seq = _a.seq;
    return {
        title: (0, internal_1.getScalarFieldValueGenerator)().String({ modelName: "AuthorsLinks", fieldName: "title", isId: false, isUnique: false, seq: seq }),
        url: (0, internal_1.getScalarFieldValueGenerator)().String({ modelName: "AuthorsLinks", fieldName: "url", isId: false, isUnique: false, seq: seq })
    };
}
function defineAuthorsLinksFactoryInternal(_a) {
    var _this = this;
    var defaultDataResolver = _a.defaultData, _b = _a.traits, traitsDefs = _b === void 0 ? {} : _b;
    var getFactoryWithTraits = function (traitKeys) {
        if (traitKeys === void 0) { traitKeys = []; }
        var seqKey = {};
        var getSeq = function () { return (0, internal_1.getSequenceCounter)(seqKey); };
        var screen = (0, internal_1.createScreener)("AuthorsLinks", modelFieldDefinitions);
        var build = function () {
            var args_1 = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args_1[_i] = arguments[_i];
            }
            return __awaiter(_this, __spreadArray([], args_1, true), void 0, function (inputData) {
                var seq, requiredScalarData, resolveValue, defaultData, defaultAssociations, _a, data;
                var _b, _c;
                var _this = this;
                if (inputData === void 0) { inputData = {}; }
                return __generator(this, function (_d) {
                    switch (_d.label) {
                        case 0:
                            seq = getSeq();
                            requiredScalarData = autoGenerateAuthorsLinksScalarsOrEnums({ seq: seq });
                            resolveValue = (0, internal_1.normalizeResolver)(defaultDataResolver !== null && defaultDataResolver !== void 0 ? defaultDataResolver : {});
                            return [4 /*yield*/, traitKeys.reduce(function (queue, traitKey) { return __awaiter(_this, void 0, void 0, function () {
                                    var acc, resolveTraitValue, traitData;
                                    var _a, _b;
                                    return __generator(this, function (_c) {
                                        switch (_c.label) {
                                            case 0: return [4 /*yield*/, queue];
                                            case 1:
                                                acc = _c.sent();
                                                resolveTraitValue = (0, internal_1.normalizeResolver)((_b = (_a = traitsDefs[traitKey]) === null || _a === void 0 ? void 0 : _a.data) !== null && _b !== void 0 ? _b : {});
                                                return [4 /*yield*/, resolveTraitValue({ seq: seq })];
                                            case 2:
                                                traitData = _c.sent();
                                                return [2 /*return*/, __assign(__assign({}, acc), traitData)];
                                        }
                                    });
                                }); }, resolveValue({ seq: seq }))];
                        case 1:
                            defaultData = _d.sent();
                            _b = {};
                            if (!isAuthorsLinksAuthorFactory(defaultData.Author)) return [3 /*break*/, 3];
                            _c = {};
                            return [4 /*yield*/, defaultData.Author.build()];
                        case 2:
                            _a = (_c.create = _d.sent(),
                                _c);
                            return [3 /*break*/, 4];
                        case 3:
                            _a = defaultData.Author;
                            _d.label = 4;
                        case 4:
                            defaultAssociations = (_b.Author = _a,
                                _b);
                            data = __assign(__assign(__assign(__assign({}, requiredScalarData), defaultData), defaultAssociations), inputData);
                            return [2 /*return*/, data];
                    }
                });
            });
        };
        var buildList = function (inputData) { return Promise.all((0, internal_1.normalizeList)(inputData).map(function (data) { return build(data); })); };
        var pickForConnect = function (inputData) { return ({
            id: inputData.id
        }); };
        var create = function () {
            var args_1 = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args_1[_i] = arguments[_i];
            }
            return __awaiter(_this, __spreadArray([], args_1, true), void 0, function (inputData) {
                var data;
                if (inputData === void 0) { inputData = {}; }
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, build(inputData).then(screen)];
                        case 1:
                            data = _a.sent();
                            return [4 /*yield*/, (0, internal_1.getClient)().authorsLinks.create({ data: data })];
                        case 2: return [2 /*return*/, _a.sent()];
                    }
                });
            });
        };
        var createList = function (inputData) { return Promise.all((0, internal_1.normalizeList)(inputData).map(function (data) { return create(data); })); };
        var createForConnect = function (inputData) {
            if (inputData === void 0) { inputData = {}; }
            return create(inputData).then(pickForConnect);
        };
        return {
            _factoryFor: "AuthorsLinks",
            build: build,
            buildList: buildList,
            buildCreateInput: build,
            pickForConnect: pickForConnect,
            create: create,
            createList: createList,
            createForConnect: createForConnect,
        };
    };
    var factory = getFactoryWithTraits();
    var useTraits = function (name) {
        var names = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            names[_i - 1] = arguments[_i];
        }
        return getFactoryWithTraits(__spreadArray([name], names, true));
    };
    return __assign(__assign({}, factory), { use: useTraits });
}
/**
 * Define factory for {@link AuthorsLinks} model.
 *
 * @param options
 * @returns factory {@link AuthorsLinksFactoryInterface}
 */
function defineAuthorsLinksFactory(options) {
    return defineAuthorsLinksFactoryInternal(options !== null && options !== void 0 ? options : {});
}
exports.defineAuthorsLinksFactory = defineAuthorsLinksFactory;
function isAuthorimageFactory(x) {
    return (x === null || x === void 0 ? void 0 : x._factoryFor) === "Image";
}
function isAuthorpeerFactory(x) {
    return (x === null || x === void 0 ? void 0 : x._factoryFor) === "Peer";
}
function autoGenerateAuthorScalarsOrEnums(_a) {
    var seq = _a.seq;
    return {
        name: (0, internal_1.getScalarFieldValueGenerator)().String({ modelName: "Author", fieldName: "name", isId: false, isUnique: false, seq: seq }),
        slug: (0, internal_1.getScalarFieldValueGenerator)().String({ modelName: "Author", fieldName: "slug", isId: false, isUnique: true, seq: seq })
    };
}
function defineAuthorFactoryInternal(_a) {
    var _this = this;
    var defaultDataResolver = _a.defaultData, _b = _a.traits, traitsDefs = _b === void 0 ? {} : _b;
    var getFactoryWithTraits = function (traitKeys) {
        if (traitKeys === void 0) { traitKeys = []; }
        var seqKey = {};
        var getSeq = function () { return (0, internal_1.getSequenceCounter)(seqKey); };
        var screen = (0, internal_1.createScreener)("Author", modelFieldDefinitions);
        var build = function () {
            var args_1 = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args_1[_i] = arguments[_i];
            }
            return __awaiter(_this, __spreadArray([], args_1, true), void 0, function (inputData) {
                var seq, requiredScalarData, resolveValue, defaultData, defaultAssociations, _a, _b, data;
                var _c, _d, _e;
                var _this = this;
                if (inputData === void 0) { inputData = {}; }
                return __generator(this, function (_f) {
                    switch (_f.label) {
                        case 0:
                            seq = getSeq();
                            requiredScalarData = autoGenerateAuthorScalarsOrEnums({ seq: seq });
                            resolveValue = (0, internal_1.normalizeResolver)(defaultDataResolver !== null && defaultDataResolver !== void 0 ? defaultDataResolver : {});
                            return [4 /*yield*/, traitKeys.reduce(function (queue, traitKey) { return __awaiter(_this, void 0, void 0, function () {
                                    var acc, resolveTraitValue, traitData;
                                    var _a, _b;
                                    return __generator(this, function (_c) {
                                        switch (_c.label) {
                                            case 0: return [4 /*yield*/, queue];
                                            case 1:
                                                acc = _c.sent();
                                                resolveTraitValue = (0, internal_1.normalizeResolver)((_b = (_a = traitsDefs[traitKey]) === null || _a === void 0 ? void 0 : _a.data) !== null && _b !== void 0 ? _b : {});
                                                return [4 /*yield*/, resolveTraitValue({ seq: seq })];
                                            case 2:
                                                traitData = _c.sent();
                                                return [2 /*return*/, __assign(__assign({}, acc), traitData)];
                                        }
                                    });
                                }); }, resolveValue({ seq: seq }))];
                        case 1:
                            defaultData = _f.sent();
                            _c = {};
                            if (!isAuthorimageFactory(defaultData.image)) return [3 /*break*/, 3];
                            _d = {};
                            return [4 /*yield*/, defaultData.image.build()];
                        case 2:
                            _a = (_d.create = _f.sent(),
                                _d);
                            return [3 /*break*/, 4];
                        case 3:
                            _a = defaultData.image;
                            _f.label = 4;
                        case 4:
                            _c.image = _a;
                            if (!isAuthorpeerFactory(defaultData.peer)) return [3 /*break*/, 6];
                            _e = {};
                            return [4 /*yield*/, defaultData.peer.build()];
                        case 5:
                            _b = (_e.create = _f.sent(),
                                _e);
                            return [3 /*break*/, 7];
                        case 6:
                            _b = defaultData.peer;
                            _f.label = 7;
                        case 7:
                            defaultAssociations = (_c.peer = _b,
                                _c);
                            data = __assign(__assign(__assign(__assign({}, requiredScalarData), defaultData), defaultAssociations), inputData);
                            return [2 /*return*/, data];
                    }
                });
            });
        };
        var buildList = function (inputData) { return Promise.all((0, internal_1.normalizeList)(inputData).map(function (data) { return build(data); })); };
        var pickForConnect = function (inputData) { return ({
            id: inputData.id
        }); };
        var create = function () {
            var args_1 = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args_1[_i] = arguments[_i];
            }
            return __awaiter(_this, __spreadArray([], args_1, true), void 0, function (inputData) {
                var data;
                if (inputData === void 0) { inputData = {}; }
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, build(inputData).then(screen)];
                        case 1:
                            data = _a.sent();
                            return [4 /*yield*/, (0, internal_1.getClient)().author.create({ data: data })];
                        case 2: return [2 /*return*/, _a.sent()];
                    }
                });
            });
        };
        var createList = function (inputData) { return Promise.all((0, internal_1.normalizeList)(inputData).map(function (data) { return create(data); })); };
        var createForConnect = function (inputData) {
            if (inputData === void 0) { inputData = {}; }
            return create(inputData).then(pickForConnect);
        };
        return {
            _factoryFor: "Author",
            build: build,
            buildList: buildList,
            buildCreateInput: build,
            pickForConnect: pickForConnect,
            create: create,
            createList: createList,
            createForConnect: createForConnect,
        };
    };
    var factory = getFactoryWithTraits();
    var useTraits = function (name) {
        var names = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            names[_i - 1] = arguments[_i];
        }
        return getFactoryWithTraits(__spreadArray([name], names, true));
    };
    return __assign(__assign({}, factory), { use: useTraits });
}
/**
 * Define factory for {@link Author} model.
 *
 * @param options
 * @returns factory {@link AuthorFactoryInterface}
 */
function defineAuthorFactory(options) {
    return defineAuthorFactoryInternal(options !== null && options !== void 0 ? options : {});
}
exports.defineAuthorFactory = defineAuthorFactory;
function isTaggedAuthorsauthorFactory(x) {
    return (x === null || x === void 0 ? void 0 : x._factoryFor) === "Author";
}
function isTaggedAuthorstagFactory(x) {
    return (x === null || x === void 0 ? void 0 : x._factoryFor) === "Tag";
}
function autoGenerateTaggedAuthorsScalarsOrEnums(_a) {
    var seq = _a.seq;
    return {};
}
function defineTaggedAuthorsFactoryInternal(_a) {
    var _this = this;
    var defaultDataResolver = _a.defaultData, _b = _a.traits, traitsDefs = _b === void 0 ? {} : _b;
    var getFactoryWithTraits = function (traitKeys) {
        if (traitKeys === void 0) { traitKeys = []; }
        var seqKey = {};
        var getSeq = function () { return (0, internal_1.getSequenceCounter)(seqKey); };
        var screen = (0, internal_1.createScreener)("TaggedAuthors", modelFieldDefinitions);
        var build = function () {
            var args_1 = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args_1[_i] = arguments[_i];
            }
            return __awaiter(_this, __spreadArray([], args_1, true), void 0, function (inputData) {
                var seq, requiredScalarData, resolveValue, defaultData, defaultAssociations, _a, _b, data;
                var _c, _d, _e;
                var _this = this;
                if (inputData === void 0) { inputData = {}; }
                return __generator(this, function (_f) {
                    switch (_f.label) {
                        case 0:
                            seq = getSeq();
                            requiredScalarData = autoGenerateTaggedAuthorsScalarsOrEnums({ seq: seq });
                            resolveValue = (0, internal_1.normalizeResolver)(defaultDataResolver !== null && defaultDataResolver !== void 0 ? defaultDataResolver : {});
                            return [4 /*yield*/, traitKeys.reduce(function (queue, traitKey) { return __awaiter(_this, void 0, void 0, function () {
                                    var acc, resolveTraitValue, traitData;
                                    var _a, _b;
                                    return __generator(this, function (_c) {
                                        switch (_c.label) {
                                            case 0: return [4 /*yield*/, queue];
                                            case 1:
                                                acc = _c.sent();
                                                resolveTraitValue = (0, internal_1.normalizeResolver)((_b = (_a = traitsDefs[traitKey]) === null || _a === void 0 ? void 0 : _a.data) !== null && _b !== void 0 ? _b : {});
                                                return [4 /*yield*/, resolveTraitValue({ seq: seq })];
                                            case 2:
                                                traitData = _c.sent();
                                                return [2 /*return*/, __assign(__assign({}, acc), traitData)];
                                        }
                                    });
                                }); }, resolveValue({ seq: seq }))];
                        case 1:
                            defaultData = _f.sent();
                            _c = {};
                            if (!isTaggedAuthorsauthorFactory(defaultData.author)) return [3 /*break*/, 3];
                            _d = {};
                            return [4 /*yield*/, defaultData.author.build()];
                        case 2:
                            _a = (_d.create = _f.sent(),
                                _d);
                            return [3 /*break*/, 4];
                        case 3:
                            _a = defaultData.author;
                            _f.label = 4;
                        case 4:
                            _c.author = _a;
                            if (!isTaggedAuthorstagFactory(defaultData.tag)) return [3 /*break*/, 6];
                            _e = {};
                            return [4 /*yield*/, defaultData.tag.build()];
                        case 5:
                            _b = (_e.create = _f.sent(),
                                _e);
                            return [3 /*break*/, 7];
                        case 6:
                            _b = defaultData.tag;
                            _f.label = 7;
                        case 7:
                            defaultAssociations = (_c.tag = _b,
                                _c);
                            data = __assign(__assign(__assign(__assign({}, requiredScalarData), defaultData), defaultAssociations), inputData);
                            return [2 /*return*/, data];
                    }
                });
            });
        };
        var buildList = function (inputData) { return Promise.all((0, internal_1.normalizeList)(inputData).map(function (data) { return build(data); })); };
        var pickForConnect = function (inputData) { return ({
            authorId: inputData.authorId,
            tagId: inputData.tagId
        }); };
        var create = function () {
            var args_1 = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args_1[_i] = arguments[_i];
            }
            return __awaiter(_this, __spreadArray([], args_1, true), void 0, function (inputData) {
                var data;
                if (inputData === void 0) { inputData = {}; }
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, build(inputData).then(screen)];
                        case 1:
                            data = _a.sent();
                            return [4 /*yield*/, (0, internal_1.getClient)().taggedAuthors.create({ data: data })];
                        case 2: return [2 /*return*/, _a.sent()];
                    }
                });
            });
        };
        var createList = function (inputData) { return Promise.all((0, internal_1.normalizeList)(inputData).map(function (data) { return create(data); })); };
        var createForConnect = function (inputData) {
            if (inputData === void 0) { inputData = {}; }
            return create(inputData).then(pickForConnect);
        };
        return {
            _factoryFor: "TaggedAuthors",
            build: build,
            buildList: buildList,
            buildCreateInput: build,
            pickForConnect: pickForConnect,
            create: create,
            createList: createList,
            createForConnect: createForConnect,
        };
    };
    var factory = getFactoryWithTraits();
    var useTraits = function (name) {
        var names = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            names[_i - 1] = arguments[_i];
        }
        return getFactoryWithTraits(__spreadArray([name], names, true));
    };
    return __assign(__assign({}, factory), { use: useTraits });
}
/**
 * Define factory for {@link TaggedAuthors} model.
 *
 * @param options
 * @returns factory {@link TaggedAuthorsFactoryInterface}
 */
function defineTaggedAuthorsFactory(options) {
    return defineTaggedAuthorsFactoryInternal(options);
}
exports.defineTaggedAuthorsFactory = defineTaggedAuthorsFactory;
function isFocalPointimageFactory(x) {
    return (x === null || x === void 0 ? void 0 : x._factoryFor) === "Image";
}
function autoGenerateFocalPointScalarsOrEnums(_a) {
    var seq = _a.seq;
    return {};
}
function defineFocalPointFactoryInternal(_a) {
    var _this = this;
    var defaultDataResolver = _a.defaultData, _b = _a.traits, traitsDefs = _b === void 0 ? {} : _b;
    var getFactoryWithTraits = function (traitKeys) {
        if (traitKeys === void 0) { traitKeys = []; }
        var seqKey = {};
        var getSeq = function () { return (0, internal_1.getSequenceCounter)(seqKey); };
        var screen = (0, internal_1.createScreener)("FocalPoint", modelFieldDefinitions);
        var build = function () {
            var args_1 = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args_1[_i] = arguments[_i];
            }
            return __awaiter(_this, __spreadArray([], args_1, true), void 0, function (inputData) {
                var seq, requiredScalarData, resolveValue, defaultData, defaultAssociations, _a, data;
                var _b, _c;
                var _this = this;
                if (inputData === void 0) { inputData = {}; }
                return __generator(this, function (_d) {
                    switch (_d.label) {
                        case 0:
                            seq = getSeq();
                            requiredScalarData = autoGenerateFocalPointScalarsOrEnums({ seq: seq });
                            resolveValue = (0, internal_1.normalizeResolver)(defaultDataResolver !== null && defaultDataResolver !== void 0 ? defaultDataResolver : {});
                            return [4 /*yield*/, traitKeys.reduce(function (queue, traitKey) { return __awaiter(_this, void 0, void 0, function () {
                                    var acc, resolveTraitValue, traitData;
                                    var _a, _b;
                                    return __generator(this, function (_c) {
                                        switch (_c.label) {
                                            case 0: return [4 /*yield*/, queue];
                                            case 1:
                                                acc = _c.sent();
                                                resolveTraitValue = (0, internal_1.normalizeResolver)((_b = (_a = traitsDefs[traitKey]) === null || _a === void 0 ? void 0 : _a.data) !== null && _b !== void 0 ? _b : {});
                                                return [4 /*yield*/, resolveTraitValue({ seq: seq })];
                                            case 2:
                                                traitData = _c.sent();
                                                return [2 /*return*/, __assign(__assign({}, acc), traitData)];
                                        }
                                    });
                                }); }, resolveValue({ seq: seq }))];
                        case 1:
                            defaultData = _d.sent();
                            _b = {};
                            if (!isFocalPointimageFactory(defaultData.image)) return [3 /*break*/, 3];
                            _c = {};
                            return [4 /*yield*/, defaultData.image.build()];
                        case 2:
                            _a = (_c.create = _d.sent(),
                                _c);
                            return [3 /*break*/, 4];
                        case 3:
                            _a = defaultData.image;
                            _d.label = 4;
                        case 4:
                            defaultAssociations = (_b.image = _a,
                                _b);
                            data = __assign(__assign(__assign(__assign({}, requiredScalarData), defaultData), defaultAssociations), inputData);
                            return [2 /*return*/, data];
                    }
                });
            });
        };
        var buildList = function (inputData) { return Promise.all((0, internal_1.normalizeList)(inputData).map(function (data) { return build(data); })); };
        var pickForConnect = function (inputData) { return ({
            imageId: inputData.imageId
        }); };
        var create = function () {
            var args_1 = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args_1[_i] = arguments[_i];
            }
            return __awaiter(_this, __spreadArray([], args_1, true), void 0, function (inputData) {
                var data;
                if (inputData === void 0) { inputData = {}; }
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, build(inputData).then(screen)];
                        case 1:
                            data = _a.sent();
                            return [4 /*yield*/, (0, internal_1.getClient)().focalPoint.create({ data: data })];
                        case 2: return [2 /*return*/, _a.sent()];
                    }
                });
            });
        };
        var createList = function (inputData) { return Promise.all((0, internal_1.normalizeList)(inputData).map(function (data) { return create(data); })); };
        var createForConnect = function (inputData) {
            if (inputData === void 0) { inputData = {}; }
            return create(inputData).then(pickForConnect);
        };
        return {
            _factoryFor: "FocalPoint",
            build: build,
            buildList: buildList,
            buildCreateInput: build,
            pickForConnect: pickForConnect,
            create: create,
            createList: createList,
            createForConnect: createForConnect,
        };
    };
    var factory = getFactoryWithTraits();
    var useTraits = function (name) {
        var names = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            names[_i - 1] = arguments[_i];
        }
        return getFactoryWithTraits(__spreadArray([name], names, true));
    };
    return __assign(__assign({}, factory), { use: useTraits });
}
/**
 * Define factory for {@link FocalPoint} model.
 *
 * @param options
 * @returns factory {@link FocalPointFactoryInterface}
 */
function defineFocalPointFactory(options) {
    return defineFocalPointFactoryInternal(options !== null && options !== void 0 ? options : {});
}
exports.defineFocalPointFactory = defineFocalPointFactory;
function isImagefocalPointFactory(x) {
    return (x === null || x === void 0 ? void 0 : x._factoryFor) === "FocalPoint";
}
function isImagepeerFactory(x) {
    return (x === null || x === void 0 ? void 0 : x._factoryFor) === "Peer";
}
function autoGenerateImageScalarsOrEnums(_a) {
    var seq = _a.seq;
    return {
        id: (0, internal_1.getScalarFieldValueGenerator)().String({ modelName: "Image", fieldName: "id", isId: true, isUnique: false, seq: seq }),
        extension: (0, internal_1.getScalarFieldValueGenerator)().String({ modelName: "Image", fieldName: "extension", isId: false, isUnique: false, seq: seq }),
        fileSize: (0, internal_1.getScalarFieldValueGenerator)().Int({ modelName: "Image", fieldName: "fileSize", isId: false, isUnique: false, seq: seq }),
        format: (0, internal_1.getScalarFieldValueGenerator)().String({ modelName: "Image", fieldName: "format", isId: false, isUnique: false, seq: seq }),
        mimeType: (0, internal_1.getScalarFieldValueGenerator)().String({ modelName: "Image", fieldName: "mimeType", isId: false, isUnique: false, seq: seq }),
        height: (0, internal_1.getScalarFieldValueGenerator)().Int({ modelName: "Image", fieldName: "height", isId: false, isUnique: false, seq: seq }),
        width: (0, internal_1.getScalarFieldValueGenerator)().Int({ modelName: "Image", fieldName: "width", isId: false, isUnique: false, seq: seq })
    };
}
function defineImageFactoryInternal(_a) {
    var _this = this;
    var defaultDataResolver = _a.defaultData, _b = _a.traits, traitsDefs = _b === void 0 ? {} : _b;
    var getFactoryWithTraits = function (traitKeys) {
        if (traitKeys === void 0) { traitKeys = []; }
        var seqKey = {};
        var getSeq = function () { return (0, internal_1.getSequenceCounter)(seqKey); };
        var screen = (0, internal_1.createScreener)("Image", modelFieldDefinitions);
        var build = function () {
            var args_1 = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args_1[_i] = arguments[_i];
            }
            return __awaiter(_this, __spreadArray([], args_1, true), void 0, function (inputData) {
                var seq, requiredScalarData, resolveValue, defaultData, defaultAssociations, _a, _b, data;
                var _c, _d, _e;
                var _this = this;
                if (inputData === void 0) { inputData = {}; }
                return __generator(this, function (_f) {
                    switch (_f.label) {
                        case 0:
                            seq = getSeq();
                            requiredScalarData = autoGenerateImageScalarsOrEnums({ seq: seq });
                            resolveValue = (0, internal_1.normalizeResolver)(defaultDataResolver !== null && defaultDataResolver !== void 0 ? defaultDataResolver : {});
                            return [4 /*yield*/, traitKeys.reduce(function (queue, traitKey) { return __awaiter(_this, void 0, void 0, function () {
                                    var acc, resolveTraitValue, traitData;
                                    var _a, _b;
                                    return __generator(this, function (_c) {
                                        switch (_c.label) {
                                            case 0: return [4 /*yield*/, queue];
                                            case 1:
                                                acc = _c.sent();
                                                resolveTraitValue = (0, internal_1.normalizeResolver)((_b = (_a = traitsDefs[traitKey]) === null || _a === void 0 ? void 0 : _a.data) !== null && _b !== void 0 ? _b : {});
                                                return [4 /*yield*/, resolveTraitValue({ seq: seq })];
                                            case 2:
                                                traitData = _c.sent();
                                                return [2 /*return*/, __assign(__assign({}, acc), traitData)];
                                        }
                                    });
                                }); }, resolveValue({ seq: seq }))];
                        case 1:
                            defaultData = _f.sent();
                            _c = {};
                            if (!isImagefocalPointFactory(defaultData.focalPoint)) return [3 /*break*/, 3];
                            _d = {};
                            return [4 /*yield*/, defaultData.focalPoint.build()];
                        case 2:
                            _a = (_d.create = _f.sent(),
                                _d);
                            return [3 /*break*/, 4];
                        case 3:
                            _a = defaultData.focalPoint;
                            _f.label = 4;
                        case 4:
                            _c.focalPoint = _a;
                            if (!isImagepeerFactory(defaultData.peer)) return [3 /*break*/, 6];
                            _e = {};
                            return [4 /*yield*/, defaultData.peer.build()];
                        case 5:
                            _b = (_e.create = _f.sent(),
                                _e);
                            return [3 /*break*/, 7];
                        case 6:
                            _b = defaultData.peer;
                            _f.label = 7;
                        case 7:
                            defaultAssociations = (_c.peer = _b,
                                _c);
                            data = __assign(__assign(__assign(__assign({}, requiredScalarData), defaultData), defaultAssociations), inputData);
                            return [2 /*return*/, data];
                    }
                });
            });
        };
        var buildList = function (inputData) { return Promise.all((0, internal_1.normalizeList)(inputData).map(function (data) { return build(data); })); };
        var pickForConnect = function (inputData) { return ({
            id: inputData.id
        }); };
        var create = function () {
            var args_1 = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args_1[_i] = arguments[_i];
            }
            return __awaiter(_this, __spreadArray([], args_1, true), void 0, function (inputData) {
                var data;
                if (inputData === void 0) { inputData = {}; }
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, build(inputData).then(screen)];
                        case 1:
                            data = _a.sent();
                            return [4 /*yield*/, (0, internal_1.getClient)().image.create({ data: data })];
                        case 2: return [2 /*return*/, _a.sent()];
                    }
                });
            });
        };
        var createList = function (inputData) { return Promise.all((0, internal_1.normalizeList)(inputData).map(function (data) { return create(data); })); };
        var createForConnect = function (inputData) {
            if (inputData === void 0) { inputData = {}; }
            return create(inputData).then(pickForConnect);
        };
        return {
            _factoryFor: "Image",
            build: build,
            buildList: buildList,
            buildCreateInput: build,
            pickForConnect: pickForConnect,
            create: create,
            createList: createList,
            createForConnect: createForConnect,
        };
    };
    var factory = getFactoryWithTraits();
    var useTraits = function (name) {
        var names = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            names[_i - 1] = arguments[_i];
        }
        return getFactoryWithTraits(__spreadArray([name], names, true));
    };
    return __assign(__assign({}, factory), { use: useTraits });
}
/**
 * Define factory for {@link Image} model.
 *
 * @param options
 * @returns factory {@link ImageFactoryInterface}
 */
function defineImageFactory(options) {
    return defineImageFactoryInternal(options !== null && options !== void 0 ? options : {});
}
exports.defineImageFactory = defineImageFactory;
function isCommentsRevisionsCommentFactory(x) {
    return (x === null || x === void 0 ? void 0 : x._factoryFor) === "Comment";
}
function autoGenerateCommentsRevisionsScalarsOrEnums(_a) {
    var seq = _a.seq;
    return {};
}
function defineCommentsRevisionsFactoryInternal(_a) {
    var _this = this;
    var defaultDataResolver = _a.defaultData, _b = _a.traits, traitsDefs = _b === void 0 ? {} : _b;
    var getFactoryWithTraits = function (traitKeys) {
        if (traitKeys === void 0) { traitKeys = []; }
        var seqKey = {};
        var getSeq = function () { return (0, internal_1.getSequenceCounter)(seqKey); };
        var screen = (0, internal_1.createScreener)("CommentsRevisions", modelFieldDefinitions);
        var build = function () {
            var args_1 = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args_1[_i] = arguments[_i];
            }
            return __awaiter(_this, __spreadArray([], args_1, true), void 0, function (inputData) {
                var seq, requiredScalarData, resolveValue, defaultData, defaultAssociations, _a, data;
                var _b, _c;
                var _this = this;
                if (inputData === void 0) { inputData = {}; }
                return __generator(this, function (_d) {
                    switch (_d.label) {
                        case 0:
                            seq = getSeq();
                            requiredScalarData = autoGenerateCommentsRevisionsScalarsOrEnums({ seq: seq });
                            resolveValue = (0, internal_1.normalizeResolver)(defaultDataResolver !== null && defaultDataResolver !== void 0 ? defaultDataResolver : {});
                            return [4 /*yield*/, traitKeys.reduce(function (queue, traitKey) { return __awaiter(_this, void 0, void 0, function () {
                                    var acc, resolveTraitValue, traitData;
                                    var _a, _b;
                                    return __generator(this, function (_c) {
                                        switch (_c.label) {
                                            case 0: return [4 /*yield*/, queue];
                                            case 1:
                                                acc = _c.sent();
                                                resolveTraitValue = (0, internal_1.normalizeResolver)((_b = (_a = traitsDefs[traitKey]) === null || _a === void 0 ? void 0 : _a.data) !== null && _b !== void 0 ? _b : {});
                                                return [4 /*yield*/, resolveTraitValue({ seq: seq })];
                                            case 2:
                                                traitData = _c.sent();
                                                return [2 /*return*/, __assign(__assign({}, acc), traitData)];
                                        }
                                    });
                                }); }, resolveValue({ seq: seq }))];
                        case 1:
                            defaultData = _d.sent();
                            _b = {};
                            if (!isCommentsRevisionsCommentFactory(defaultData.Comment)) return [3 /*break*/, 3];
                            _c = {};
                            return [4 /*yield*/, defaultData.Comment.build()];
                        case 2:
                            _a = (_c.create = _d.sent(),
                                _c);
                            return [3 /*break*/, 4];
                        case 3:
                            _a = defaultData.Comment;
                            _d.label = 4;
                        case 4:
                            defaultAssociations = (_b.Comment = _a,
                                _b);
                            data = __assign(__assign(__assign(__assign({}, requiredScalarData), defaultData), defaultAssociations), inputData);
                            return [2 /*return*/, data];
                    }
                });
            });
        };
        var buildList = function (inputData) { return Promise.all((0, internal_1.normalizeList)(inputData).map(function (data) { return build(data); })); };
        var pickForConnect = function (inputData) { return ({
            id: inputData.id
        }); };
        var create = function () {
            var args_1 = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args_1[_i] = arguments[_i];
            }
            return __awaiter(_this, __spreadArray([], args_1, true), void 0, function (inputData) {
                var data;
                if (inputData === void 0) { inputData = {}; }
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, build(inputData).then(screen)];
                        case 1:
                            data = _a.sent();
                            return [4 /*yield*/, (0, internal_1.getClient)().commentsRevisions.create({ data: data })];
                        case 2: return [2 /*return*/, _a.sent()];
                    }
                });
            });
        };
        var createList = function (inputData) { return Promise.all((0, internal_1.normalizeList)(inputData).map(function (data) { return create(data); })); };
        var createForConnect = function (inputData) {
            if (inputData === void 0) { inputData = {}; }
            return create(inputData).then(pickForConnect);
        };
        return {
            _factoryFor: "CommentsRevisions",
            build: build,
            buildList: buildList,
            buildCreateInput: build,
            pickForConnect: pickForConnect,
            create: create,
            createList: createList,
            createForConnect: createForConnect,
        };
    };
    var factory = getFactoryWithTraits();
    var useTraits = function (name) {
        var names = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            names[_i - 1] = arguments[_i];
        }
        return getFactoryWithTraits(__spreadArray([name], names, true));
    };
    return __assign(__assign({}, factory), { use: useTraits });
}
/**
 * Define factory for {@link CommentsRevisions} model.
 *
 * @param options
 * @returns factory {@link CommentsRevisionsFactoryInterface}
 */
function defineCommentsRevisionsFactory(options) {
    return defineCommentsRevisionsFactoryInternal(options !== null && options !== void 0 ? options : {});
}
exports.defineCommentsRevisionsFactory = defineCommentsRevisionsFactory;
function isCommentguestUserImageFactory(x) {
    return (x === null || x === void 0 ? void 0 : x._factoryFor) === "Image";
}
function isCommentuserFactory(x) {
    return (x === null || x === void 0 ? void 0 : x._factoryFor) === "User";
}
function autoGenerateCommentScalarsOrEnums(_a) {
    var seq = _a.seq;
    return {
        itemID: (0, internal_1.getScalarFieldValueGenerator)().String({ modelName: "Comment", fieldName: "itemID", isId: false, isUnique: false, seq: seq }),
        itemType: "article",
        state: "approved",
        authorType: "team"
    };
}
function defineCommentFactoryInternal(_a) {
    var _this = this;
    var defaultDataResolver = _a.defaultData, _b = _a.traits, traitsDefs = _b === void 0 ? {} : _b;
    var getFactoryWithTraits = function (traitKeys) {
        if (traitKeys === void 0) { traitKeys = []; }
        var seqKey = {};
        var getSeq = function () { return (0, internal_1.getSequenceCounter)(seqKey); };
        var screen = (0, internal_1.createScreener)("Comment", modelFieldDefinitions);
        var build = function () {
            var args_1 = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args_1[_i] = arguments[_i];
            }
            return __awaiter(_this, __spreadArray([], args_1, true), void 0, function (inputData) {
                var seq, requiredScalarData, resolveValue, defaultData, defaultAssociations, _a, _b, data;
                var _c, _d, _e;
                var _this = this;
                if (inputData === void 0) { inputData = {}; }
                return __generator(this, function (_f) {
                    switch (_f.label) {
                        case 0:
                            seq = getSeq();
                            requiredScalarData = autoGenerateCommentScalarsOrEnums({ seq: seq });
                            resolveValue = (0, internal_1.normalizeResolver)(defaultDataResolver !== null && defaultDataResolver !== void 0 ? defaultDataResolver : {});
                            return [4 /*yield*/, traitKeys.reduce(function (queue, traitKey) { return __awaiter(_this, void 0, void 0, function () {
                                    var acc, resolveTraitValue, traitData;
                                    var _a, _b;
                                    return __generator(this, function (_c) {
                                        switch (_c.label) {
                                            case 0: return [4 /*yield*/, queue];
                                            case 1:
                                                acc = _c.sent();
                                                resolveTraitValue = (0, internal_1.normalizeResolver)((_b = (_a = traitsDefs[traitKey]) === null || _a === void 0 ? void 0 : _a.data) !== null && _b !== void 0 ? _b : {});
                                                return [4 /*yield*/, resolveTraitValue({ seq: seq })];
                                            case 2:
                                                traitData = _c.sent();
                                                return [2 /*return*/, __assign(__assign({}, acc), traitData)];
                                        }
                                    });
                                }); }, resolveValue({ seq: seq }))];
                        case 1:
                            defaultData = _f.sent();
                            _c = {};
                            if (!isCommentguestUserImageFactory(defaultData.guestUserImage)) return [3 /*break*/, 3];
                            _d = {};
                            return [4 /*yield*/, defaultData.guestUserImage.build()];
                        case 2:
                            _a = (_d.create = _f.sent(),
                                _d);
                            return [3 /*break*/, 4];
                        case 3:
                            _a = defaultData.guestUserImage;
                            _f.label = 4;
                        case 4:
                            _c.guestUserImage = _a;
                            if (!isCommentuserFactory(defaultData.user)) return [3 /*break*/, 6];
                            _e = {};
                            return [4 /*yield*/, defaultData.user.build()];
                        case 5:
                            _b = (_e.create = _f.sent(),
                                _e);
                            return [3 /*break*/, 7];
                        case 6:
                            _b = defaultData.user;
                            _f.label = 7;
                        case 7:
                            defaultAssociations = (_c.user = _b,
                                _c);
                            data = __assign(__assign(__assign(__assign({}, requiredScalarData), defaultData), defaultAssociations), inputData);
                            return [2 /*return*/, data];
                    }
                });
            });
        };
        var buildList = function (inputData) { return Promise.all((0, internal_1.normalizeList)(inputData).map(function (data) { return build(data); })); };
        var pickForConnect = function (inputData) { return ({
            id: inputData.id
        }); };
        var create = function () {
            var args_1 = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args_1[_i] = arguments[_i];
            }
            return __awaiter(_this, __spreadArray([], args_1, true), void 0, function (inputData) {
                var data;
                if (inputData === void 0) { inputData = {}; }
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, build(inputData).then(screen)];
                        case 1:
                            data = _a.sent();
                            return [4 /*yield*/, (0, internal_1.getClient)().comment.create({ data: data })];
                        case 2: return [2 /*return*/, _a.sent()];
                    }
                });
            });
        };
        var createList = function (inputData) { return Promise.all((0, internal_1.normalizeList)(inputData).map(function (data) { return create(data); })); };
        var createForConnect = function (inputData) {
            if (inputData === void 0) { inputData = {}; }
            return create(inputData).then(pickForConnect);
        };
        return {
            _factoryFor: "Comment",
            build: build,
            buildList: buildList,
            buildCreateInput: build,
            pickForConnect: pickForConnect,
            create: create,
            createList: createList,
            createForConnect: createForConnect,
        };
    };
    var factory = getFactoryWithTraits();
    var useTraits = function (name) {
        var names = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            names[_i - 1] = arguments[_i];
        }
        return getFactoryWithTraits(__spreadArray([name], names, true));
    };
    return __assign(__assign({}, factory), { use: useTraits });
}
/**
 * Define factory for {@link Comment} model.
 *
 * @param options
 * @returns factory {@link CommentFactoryInterface}
 */
function defineCommentFactory(options) {
    return defineCommentFactoryInternal(options !== null && options !== void 0 ? options : {});
}
exports.defineCommentFactory = defineCommentFactory;
function isTaggedCommentscommentFactory(x) {
    return (x === null || x === void 0 ? void 0 : x._factoryFor) === "Comment";
}
function isTaggedCommentstagFactory(x) {
    return (x === null || x === void 0 ? void 0 : x._factoryFor) === "Tag";
}
function autoGenerateTaggedCommentsScalarsOrEnums(_a) {
    var seq = _a.seq;
    return {};
}
function defineTaggedCommentsFactoryInternal(_a) {
    var _this = this;
    var defaultDataResolver = _a.defaultData, _b = _a.traits, traitsDefs = _b === void 0 ? {} : _b;
    var getFactoryWithTraits = function (traitKeys) {
        if (traitKeys === void 0) { traitKeys = []; }
        var seqKey = {};
        var getSeq = function () { return (0, internal_1.getSequenceCounter)(seqKey); };
        var screen = (0, internal_1.createScreener)("TaggedComments", modelFieldDefinitions);
        var build = function () {
            var args_1 = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args_1[_i] = arguments[_i];
            }
            return __awaiter(_this, __spreadArray([], args_1, true), void 0, function (inputData) {
                var seq, requiredScalarData, resolveValue, defaultData, defaultAssociations, _a, _b, data;
                var _c, _d, _e;
                var _this = this;
                if (inputData === void 0) { inputData = {}; }
                return __generator(this, function (_f) {
                    switch (_f.label) {
                        case 0:
                            seq = getSeq();
                            requiredScalarData = autoGenerateTaggedCommentsScalarsOrEnums({ seq: seq });
                            resolveValue = (0, internal_1.normalizeResolver)(defaultDataResolver !== null && defaultDataResolver !== void 0 ? defaultDataResolver : {});
                            return [4 /*yield*/, traitKeys.reduce(function (queue, traitKey) { return __awaiter(_this, void 0, void 0, function () {
                                    var acc, resolveTraitValue, traitData;
                                    var _a, _b;
                                    return __generator(this, function (_c) {
                                        switch (_c.label) {
                                            case 0: return [4 /*yield*/, queue];
                                            case 1:
                                                acc = _c.sent();
                                                resolveTraitValue = (0, internal_1.normalizeResolver)((_b = (_a = traitsDefs[traitKey]) === null || _a === void 0 ? void 0 : _a.data) !== null && _b !== void 0 ? _b : {});
                                                return [4 /*yield*/, resolveTraitValue({ seq: seq })];
                                            case 2:
                                                traitData = _c.sent();
                                                return [2 /*return*/, __assign(__assign({}, acc), traitData)];
                                        }
                                    });
                                }); }, resolveValue({ seq: seq }))];
                        case 1:
                            defaultData = _f.sent();
                            _c = {};
                            if (!isTaggedCommentscommentFactory(defaultData.comment)) return [3 /*break*/, 3];
                            _d = {};
                            return [4 /*yield*/, defaultData.comment.build()];
                        case 2:
                            _a = (_d.create = _f.sent(),
                                _d);
                            return [3 /*break*/, 4];
                        case 3:
                            _a = defaultData.comment;
                            _f.label = 4;
                        case 4:
                            _c.comment = _a;
                            if (!isTaggedCommentstagFactory(defaultData.tag)) return [3 /*break*/, 6];
                            _e = {};
                            return [4 /*yield*/, defaultData.tag.build()];
                        case 5:
                            _b = (_e.create = _f.sent(),
                                _e);
                            return [3 /*break*/, 7];
                        case 6:
                            _b = defaultData.tag;
                            _f.label = 7;
                        case 7:
                            defaultAssociations = (_c.tag = _b,
                                _c);
                            data = __assign(__assign(__assign(__assign({}, requiredScalarData), defaultData), defaultAssociations), inputData);
                            return [2 /*return*/, data];
                    }
                });
            });
        };
        var buildList = function (inputData) { return Promise.all((0, internal_1.normalizeList)(inputData).map(function (data) { return build(data); })); };
        var pickForConnect = function (inputData) { return ({
            commentId: inputData.commentId,
            tagId: inputData.tagId
        }); };
        var create = function () {
            var args_1 = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args_1[_i] = arguments[_i];
            }
            return __awaiter(_this, __spreadArray([], args_1, true), void 0, function (inputData) {
                var data;
                if (inputData === void 0) { inputData = {}; }
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, build(inputData).then(screen)];
                        case 1:
                            data = _a.sent();
                            return [4 /*yield*/, (0, internal_1.getClient)().taggedComments.create({ data: data })];
                        case 2: return [2 /*return*/, _a.sent()];
                    }
                });
            });
        };
        var createList = function (inputData) { return Promise.all((0, internal_1.normalizeList)(inputData).map(function (data) { return create(data); })); };
        var createForConnect = function (inputData) {
            if (inputData === void 0) { inputData = {}; }
            return create(inputData).then(pickForConnect);
        };
        return {
            _factoryFor: "TaggedComments",
            build: build,
            buildList: buildList,
            buildCreateInput: build,
            pickForConnect: pickForConnect,
            create: create,
            createList: createList,
            createForConnect: createForConnect,
        };
    };
    var factory = getFactoryWithTraits();
    var useTraits = function (name) {
        var names = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            names[_i - 1] = arguments[_i];
        }
        return getFactoryWithTraits(__spreadArray([name], names, true));
    };
    return __assign(__assign({}, factory), { use: useTraits });
}
/**
 * Define factory for {@link TaggedComments} model.
 *
 * @param options
 * @returns factory {@link TaggedCommentsFactoryInterface}
 */
function defineTaggedCommentsFactory(options) {
    return defineTaggedCommentsFactoryInternal(options);
}
exports.defineTaggedCommentsFactory = defineTaggedCommentsFactory;
function autoGenerateCommentRatingSystemScalarsOrEnums(_a) {
    var seq = _a.seq;
    return {};
}
function defineCommentRatingSystemFactoryInternal(_a) {
    var _this = this;
    var defaultDataResolver = _a.defaultData, _b = _a.traits, traitsDefs = _b === void 0 ? {} : _b;
    var getFactoryWithTraits = function (traitKeys) {
        if (traitKeys === void 0) { traitKeys = []; }
        var seqKey = {};
        var getSeq = function () { return (0, internal_1.getSequenceCounter)(seqKey); };
        var screen = (0, internal_1.createScreener)("CommentRatingSystem", modelFieldDefinitions);
        var build = function () {
            var args_1 = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args_1[_i] = arguments[_i];
            }
            return __awaiter(_this, __spreadArray([], args_1, true), void 0, function (inputData) {
                var seq, requiredScalarData, resolveValue, defaultData, defaultAssociations, data;
                var _this = this;
                if (inputData === void 0) { inputData = {}; }
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            seq = getSeq();
                            requiredScalarData = autoGenerateCommentRatingSystemScalarsOrEnums({ seq: seq });
                            resolveValue = (0, internal_1.normalizeResolver)(defaultDataResolver !== null && defaultDataResolver !== void 0 ? defaultDataResolver : {});
                            return [4 /*yield*/, traitKeys.reduce(function (queue, traitKey) { return __awaiter(_this, void 0, void 0, function () {
                                    var acc, resolveTraitValue, traitData;
                                    var _a, _b;
                                    return __generator(this, function (_c) {
                                        switch (_c.label) {
                                            case 0: return [4 /*yield*/, queue];
                                            case 1:
                                                acc = _c.sent();
                                                resolveTraitValue = (0, internal_1.normalizeResolver)((_b = (_a = traitsDefs[traitKey]) === null || _a === void 0 ? void 0 : _a.data) !== null && _b !== void 0 ? _b : {});
                                                return [4 /*yield*/, resolveTraitValue({ seq: seq })];
                                            case 2:
                                                traitData = _c.sent();
                                                return [2 /*return*/, __assign(__assign({}, acc), traitData)];
                                        }
                                    });
                                }); }, resolveValue({ seq: seq }))];
                        case 1:
                            defaultData = _a.sent();
                            defaultAssociations = {};
                            data = __assign(__assign(__assign(__assign({}, requiredScalarData), defaultData), defaultAssociations), inputData);
                            return [2 /*return*/, data];
                    }
                });
            });
        };
        var buildList = function (inputData) { return Promise.all((0, internal_1.normalizeList)(inputData).map(function (data) { return build(data); })); };
        var pickForConnect = function (inputData) { return ({
            id: inputData.id
        }); };
        var create = function () {
            var args_1 = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args_1[_i] = arguments[_i];
            }
            return __awaiter(_this, __spreadArray([], args_1, true), void 0, function (inputData) {
                var data;
                if (inputData === void 0) { inputData = {}; }
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, build(inputData).then(screen)];
                        case 1:
                            data = _a.sent();
                            return [4 /*yield*/, (0, internal_1.getClient)().commentRatingSystem.create({ data: data })];
                        case 2: return [2 /*return*/, _a.sent()];
                    }
                });
            });
        };
        var createList = function (inputData) { return Promise.all((0, internal_1.normalizeList)(inputData).map(function (data) { return create(data); })); };
        var createForConnect = function (inputData) {
            if (inputData === void 0) { inputData = {}; }
            return create(inputData).then(pickForConnect);
        };
        return {
            _factoryFor: "CommentRatingSystem",
            build: build,
            buildList: buildList,
            buildCreateInput: build,
            pickForConnect: pickForConnect,
            create: create,
            createList: createList,
            createForConnect: createForConnect,
        };
    };
    var factory = getFactoryWithTraits();
    var useTraits = function (name) {
        var names = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            names[_i - 1] = arguments[_i];
        }
        return getFactoryWithTraits(__spreadArray([name], names, true));
    };
    return __assign(__assign({}, factory), { use: useTraits });
}
/**
 * Define factory for {@link CommentRatingSystem} model.
 *
 * @param options
 * @returns factory {@link CommentRatingSystemFactoryInterface}
 */
function defineCommentRatingSystemFactory(options) {
    return defineCommentRatingSystemFactoryInternal(options !== null && options !== void 0 ? options : {});
}
exports.defineCommentRatingSystemFactory = defineCommentRatingSystemFactory;
function isCommentRatingSystemAnswerratingSystemFactory(x) {
    return (x === null || x === void 0 ? void 0 : x._factoryFor) === "CommentRatingSystem";
}
function autoGenerateCommentRatingSystemAnswerScalarsOrEnums(_a) {
    var seq = _a.seq;
    return {
        type: "star"
    };
}
function defineCommentRatingSystemAnswerFactoryInternal(_a) {
    var _this = this;
    var defaultDataResolver = _a.defaultData, _b = _a.traits, traitsDefs = _b === void 0 ? {} : _b;
    var getFactoryWithTraits = function (traitKeys) {
        if (traitKeys === void 0) { traitKeys = []; }
        var seqKey = {};
        var getSeq = function () { return (0, internal_1.getSequenceCounter)(seqKey); };
        var screen = (0, internal_1.createScreener)("CommentRatingSystemAnswer", modelFieldDefinitions);
        var build = function () {
            var args_1 = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args_1[_i] = arguments[_i];
            }
            return __awaiter(_this, __spreadArray([], args_1, true), void 0, function (inputData) {
                var seq, requiredScalarData, resolveValue, defaultData, defaultAssociations, _a, data;
                var _b, _c;
                var _this = this;
                if (inputData === void 0) { inputData = {}; }
                return __generator(this, function (_d) {
                    switch (_d.label) {
                        case 0:
                            seq = getSeq();
                            requiredScalarData = autoGenerateCommentRatingSystemAnswerScalarsOrEnums({ seq: seq });
                            resolveValue = (0, internal_1.normalizeResolver)(defaultDataResolver !== null && defaultDataResolver !== void 0 ? defaultDataResolver : {});
                            return [4 /*yield*/, traitKeys.reduce(function (queue, traitKey) { return __awaiter(_this, void 0, void 0, function () {
                                    var acc, resolveTraitValue, traitData;
                                    var _a, _b;
                                    return __generator(this, function (_c) {
                                        switch (_c.label) {
                                            case 0: return [4 /*yield*/, queue];
                                            case 1:
                                                acc = _c.sent();
                                                resolveTraitValue = (0, internal_1.normalizeResolver)((_b = (_a = traitsDefs[traitKey]) === null || _a === void 0 ? void 0 : _a.data) !== null && _b !== void 0 ? _b : {});
                                                return [4 /*yield*/, resolveTraitValue({ seq: seq })];
                                            case 2:
                                                traitData = _c.sent();
                                                return [2 /*return*/, __assign(__assign({}, acc), traitData)];
                                        }
                                    });
                                }); }, resolveValue({ seq: seq }))];
                        case 1:
                            defaultData = _d.sent();
                            _b = {};
                            if (!isCommentRatingSystemAnswerratingSystemFactory(defaultData.ratingSystem)) return [3 /*break*/, 3];
                            _c = {};
                            return [4 /*yield*/, defaultData.ratingSystem.build()];
                        case 2:
                            _a = (_c.create = _d.sent(),
                                _c);
                            return [3 /*break*/, 4];
                        case 3:
                            _a = defaultData.ratingSystem;
                            _d.label = 4;
                        case 4:
                            defaultAssociations = (_b.ratingSystem = _a,
                                _b);
                            data = __assign(__assign(__assign(__assign({}, requiredScalarData), defaultData), defaultAssociations), inputData);
                            return [2 /*return*/, data];
                    }
                });
            });
        };
        var buildList = function (inputData) { return Promise.all((0, internal_1.normalizeList)(inputData).map(function (data) { return build(data); })); };
        var pickForConnect = function (inputData) { return ({
            id: inputData.id
        }); };
        var create = function () {
            var args_1 = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args_1[_i] = arguments[_i];
            }
            return __awaiter(_this, __spreadArray([], args_1, true), void 0, function (inputData) {
                var data;
                if (inputData === void 0) { inputData = {}; }
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, build(inputData).then(screen)];
                        case 1:
                            data = _a.sent();
                            return [4 /*yield*/, (0, internal_1.getClient)().commentRatingSystemAnswer.create({ data: data })];
                        case 2: return [2 /*return*/, _a.sent()];
                    }
                });
            });
        };
        var createList = function (inputData) { return Promise.all((0, internal_1.normalizeList)(inputData).map(function (data) { return create(data); })); };
        var createForConnect = function (inputData) {
            if (inputData === void 0) { inputData = {}; }
            return create(inputData).then(pickForConnect);
        };
        return {
            _factoryFor: "CommentRatingSystemAnswer",
            build: build,
            buildList: buildList,
            buildCreateInput: build,
            pickForConnect: pickForConnect,
            create: create,
            createList: createList,
            createForConnect: createForConnect,
        };
    };
    var factory = getFactoryWithTraits();
    var useTraits = function (name) {
        var names = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            names[_i - 1] = arguments[_i];
        }
        return getFactoryWithTraits(__spreadArray([name], names, true));
    };
    return __assign(__assign({}, factory), { use: useTraits });
}
/**
 * Define factory for {@link CommentRatingSystemAnswer} model.
 *
 * @param options
 * @returns factory {@link CommentRatingSystemAnswerFactoryInterface}
 */
function defineCommentRatingSystemAnswerFactory(options) {
    return defineCommentRatingSystemAnswerFactoryInternal(options);
}
exports.defineCommentRatingSystemAnswerFactory = defineCommentRatingSystemAnswerFactory;
function isCommentRatinguserFactory(x) {
    return (x === null || x === void 0 ? void 0 : x._factoryFor) === "User";
}
function isCommentRatinganswerFactory(x) {
    return (x === null || x === void 0 ? void 0 : x._factoryFor) === "CommentRatingSystemAnswer";
}
function isCommentRatingcommentFactory(x) {
    return (x === null || x === void 0 ? void 0 : x._factoryFor) === "Comment";
}
function autoGenerateCommentRatingScalarsOrEnums(_a) {
    var seq = _a.seq;
    return {
        value: (0, internal_1.getScalarFieldValueGenerator)().Int({ modelName: "CommentRating", fieldName: "value", isId: false, isUnique: false, seq: seq })
    };
}
function defineCommentRatingFactoryInternal(_a) {
    var _this = this;
    var defaultDataResolver = _a.defaultData, _b = _a.traits, traitsDefs = _b === void 0 ? {} : _b;
    var getFactoryWithTraits = function (traitKeys) {
        if (traitKeys === void 0) { traitKeys = []; }
        var seqKey = {};
        var getSeq = function () { return (0, internal_1.getSequenceCounter)(seqKey); };
        var screen = (0, internal_1.createScreener)("CommentRating", modelFieldDefinitions);
        var build = function () {
            var args_1 = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args_1[_i] = arguments[_i];
            }
            return __awaiter(_this, __spreadArray([], args_1, true), void 0, function (inputData) {
                var seq, requiredScalarData, resolveValue, defaultData, defaultAssociations, _a, _b, _c, data;
                var _d, _e, _f, _g;
                var _this = this;
                if (inputData === void 0) { inputData = {}; }
                return __generator(this, function (_h) {
                    switch (_h.label) {
                        case 0:
                            seq = getSeq();
                            requiredScalarData = autoGenerateCommentRatingScalarsOrEnums({ seq: seq });
                            resolveValue = (0, internal_1.normalizeResolver)(defaultDataResolver !== null && defaultDataResolver !== void 0 ? defaultDataResolver : {});
                            return [4 /*yield*/, traitKeys.reduce(function (queue, traitKey) { return __awaiter(_this, void 0, void 0, function () {
                                    var acc, resolveTraitValue, traitData;
                                    var _a, _b;
                                    return __generator(this, function (_c) {
                                        switch (_c.label) {
                                            case 0: return [4 /*yield*/, queue];
                                            case 1:
                                                acc = _c.sent();
                                                resolveTraitValue = (0, internal_1.normalizeResolver)((_b = (_a = traitsDefs[traitKey]) === null || _a === void 0 ? void 0 : _a.data) !== null && _b !== void 0 ? _b : {});
                                                return [4 /*yield*/, resolveTraitValue({ seq: seq })];
                                            case 2:
                                                traitData = _c.sent();
                                                return [2 /*return*/, __assign(__assign({}, acc), traitData)];
                                        }
                                    });
                                }); }, resolveValue({ seq: seq }))];
                        case 1:
                            defaultData = _h.sent();
                            _d = {};
                            if (!isCommentRatinguserFactory(defaultData.user)) return [3 /*break*/, 3];
                            _e = {};
                            return [4 /*yield*/, defaultData.user.build()];
                        case 2:
                            _a = (_e.create = _h.sent(),
                                _e);
                            return [3 /*break*/, 4];
                        case 3:
                            _a = defaultData.user;
                            _h.label = 4;
                        case 4:
                            _d.user = _a;
                            if (!isCommentRatinganswerFactory(defaultData.answer)) return [3 /*break*/, 6];
                            _f = {};
                            return [4 /*yield*/, defaultData.answer.build()];
                        case 5:
                            _b = (_f.create = _h.sent(),
                                _f);
                            return [3 /*break*/, 7];
                        case 6:
                            _b = defaultData.answer;
                            _h.label = 7;
                        case 7:
                            _d.answer = _b;
                            if (!isCommentRatingcommentFactory(defaultData.comment)) return [3 /*break*/, 9];
                            _g = {};
                            return [4 /*yield*/, defaultData.comment.build()];
                        case 8:
                            _c = (_g.create = _h.sent(),
                                _g);
                            return [3 /*break*/, 10];
                        case 9:
                            _c = defaultData.comment;
                            _h.label = 10;
                        case 10:
                            defaultAssociations = (_d.comment = _c,
                                _d);
                            data = __assign(__assign(__assign(__assign({}, requiredScalarData), defaultData), defaultAssociations), inputData);
                            return [2 /*return*/, data];
                    }
                });
            });
        };
        var buildList = function (inputData) { return Promise.all((0, internal_1.normalizeList)(inputData).map(function (data) { return build(data); })); };
        var pickForConnect = function (inputData) { return ({
            id: inputData.id
        }); };
        var create = function () {
            var args_1 = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args_1[_i] = arguments[_i];
            }
            return __awaiter(_this, __spreadArray([], args_1, true), void 0, function (inputData) {
                var data;
                if (inputData === void 0) { inputData = {}; }
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, build(inputData).then(screen)];
                        case 1:
                            data = _a.sent();
                            return [4 /*yield*/, (0, internal_1.getClient)().commentRating.create({ data: data })];
                        case 2: return [2 /*return*/, _a.sent()];
                    }
                });
            });
        };
        var createList = function (inputData) { return Promise.all((0, internal_1.normalizeList)(inputData).map(function (data) { return create(data); })); };
        var createForConnect = function (inputData) {
            if (inputData === void 0) { inputData = {}; }
            return create(inputData).then(pickForConnect);
        };
        return {
            _factoryFor: "CommentRating",
            build: build,
            buildList: buildList,
            buildCreateInput: build,
            pickForConnect: pickForConnect,
            create: create,
            createList: createList,
            createForConnect: createForConnect,
        };
    };
    var factory = getFactoryWithTraits();
    var useTraits = function (name) {
        var names = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            names[_i - 1] = arguments[_i];
        }
        return getFactoryWithTraits(__spreadArray([name], names, true));
    };
    return __assign(__assign({}, factory), { use: useTraits });
}
/**
 * Define factory for {@link CommentRating} model.
 *
 * @param options
 * @returns factory {@link CommentRatingFactoryInterface}
 */
function defineCommentRatingFactory(options) {
    return defineCommentRatingFactoryInternal(options);
}
exports.defineCommentRatingFactory = defineCommentRatingFactory;
function isCommentRatingOverrideanswerFactory(x) {
    return (x === null || x === void 0 ? void 0 : x._factoryFor) === "CommentRatingSystemAnswer";
}
function isCommentRatingOverridecommentFactory(x) {
    return (x === null || x === void 0 ? void 0 : x._factoryFor) === "Comment";
}
function autoGenerateCommentRatingOverrideScalarsOrEnums(_a) {
    var seq = _a.seq;
    return {};
}
function defineCommentRatingOverrideFactoryInternal(_a) {
    var _this = this;
    var defaultDataResolver = _a.defaultData, _b = _a.traits, traitsDefs = _b === void 0 ? {} : _b;
    var getFactoryWithTraits = function (traitKeys) {
        if (traitKeys === void 0) { traitKeys = []; }
        var seqKey = {};
        var getSeq = function () { return (0, internal_1.getSequenceCounter)(seqKey); };
        var screen = (0, internal_1.createScreener)("CommentRatingOverride", modelFieldDefinitions);
        var build = function () {
            var args_1 = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args_1[_i] = arguments[_i];
            }
            return __awaiter(_this, __spreadArray([], args_1, true), void 0, function (inputData) {
                var seq, requiredScalarData, resolveValue, defaultData, defaultAssociations, _a, _b, data;
                var _c, _d, _e;
                var _this = this;
                if (inputData === void 0) { inputData = {}; }
                return __generator(this, function (_f) {
                    switch (_f.label) {
                        case 0:
                            seq = getSeq();
                            requiredScalarData = autoGenerateCommentRatingOverrideScalarsOrEnums({ seq: seq });
                            resolveValue = (0, internal_1.normalizeResolver)(defaultDataResolver !== null && defaultDataResolver !== void 0 ? defaultDataResolver : {});
                            return [4 /*yield*/, traitKeys.reduce(function (queue, traitKey) { return __awaiter(_this, void 0, void 0, function () {
                                    var acc, resolveTraitValue, traitData;
                                    var _a, _b;
                                    return __generator(this, function (_c) {
                                        switch (_c.label) {
                                            case 0: return [4 /*yield*/, queue];
                                            case 1:
                                                acc = _c.sent();
                                                resolveTraitValue = (0, internal_1.normalizeResolver)((_b = (_a = traitsDefs[traitKey]) === null || _a === void 0 ? void 0 : _a.data) !== null && _b !== void 0 ? _b : {});
                                                return [4 /*yield*/, resolveTraitValue({ seq: seq })];
                                            case 2:
                                                traitData = _c.sent();
                                                return [2 /*return*/, __assign(__assign({}, acc), traitData)];
                                        }
                                    });
                                }); }, resolveValue({ seq: seq }))];
                        case 1:
                            defaultData = _f.sent();
                            _c = {};
                            if (!isCommentRatingOverrideanswerFactory(defaultData.answer)) return [3 /*break*/, 3];
                            _d = {};
                            return [4 /*yield*/, defaultData.answer.build()];
                        case 2:
                            _a = (_d.create = _f.sent(),
                                _d);
                            return [3 /*break*/, 4];
                        case 3:
                            _a = defaultData.answer;
                            _f.label = 4;
                        case 4:
                            _c.answer = _a;
                            if (!isCommentRatingOverridecommentFactory(defaultData.comment)) return [3 /*break*/, 6];
                            _e = {};
                            return [4 /*yield*/, defaultData.comment.build()];
                        case 5:
                            _b = (_e.create = _f.sent(),
                                _e);
                            return [3 /*break*/, 7];
                        case 6:
                            _b = defaultData.comment;
                            _f.label = 7;
                        case 7:
                            defaultAssociations = (_c.comment = _b,
                                _c);
                            data = __assign(__assign(__assign(__assign({}, requiredScalarData), defaultData), defaultAssociations), inputData);
                            return [2 /*return*/, data];
                    }
                });
            });
        };
        var buildList = function (inputData) { return Promise.all((0, internal_1.normalizeList)(inputData).map(function (data) { return build(data); })); };
        var pickForConnect = function (inputData) { return ({
            answerId: inputData.answerId,
            commentId: inputData.commentId
        }); };
        var create = function () {
            var args_1 = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args_1[_i] = arguments[_i];
            }
            return __awaiter(_this, __spreadArray([], args_1, true), void 0, function (inputData) {
                var data;
                if (inputData === void 0) { inputData = {}; }
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, build(inputData).then(screen)];
                        case 1:
                            data = _a.sent();
                            return [4 /*yield*/, (0, internal_1.getClient)().commentRatingOverride.create({ data: data })];
                        case 2: return [2 /*return*/, _a.sent()];
                    }
                });
            });
        };
        var createList = function (inputData) { return Promise.all((0, internal_1.normalizeList)(inputData).map(function (data) { return create(data); })); };
        var createForConnect = function (inputData) {
            if (inputData === void 0) { inputData = {}; }
            return create(inputData).then(pickForConnect);
        };
        return {
            _factoryFor: "CommentRatingOverride",
            build: build,
            buildList: buildList,
            buildCreateInput: build,
            pickForConnect: pickForConnect,
            create: create,
            createList: createList,
            createForConnect: createForConnect,
        };
    };
    var factory = getFactoryWithTraits();
    var useTraits = function (name) {
        var names = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            names[_i - 1] = arguments[_i];
        }
        return getFactoryWithTraits(__spreadArray([name], names, true));
    };
    return __assign(__assign({}, factory), { use: useTraits });
}
/**
 * Define factory for {@link CommentRatingOverride} model.
 *
 * @param options
 * @returns factory {@link CommentRatingOverrideFactoryInterface}
 */
function defineCommentRatingOverrideFactory(options) {
    return defineCommentRatingOverrideFactoryInternal(options);
}
exports.defineCommentRatingOverrideFactory = defineCommentRatingOverrideFactory;
function isInvoiceIteminvoicesFactory(x) {
    return (x === null || x === void 0 ? void 0 : x._factoryFor) === "Invoice";
}
function autoGenerateInvoiceItemScalarsOrEnums(_a) {
    var seq = _a.seq;
    return {
        name: (0, internal_1.getScalarFieldValueGenerator)().String({ modelName: "InvoiceItem", fieldName: "name", isId: false, isUnique: false, seq: seq }),
        quantity: (0, internal_1.getScalarFieldValueGenerator)().Int({ modelName: "InvoiceItem", fieldName: "quantity", isId: false, isUnique: false, seq: seq }),
        amount: (0, internal_1.getScalarFieldValueGenerator)().Int({ modelName: "InvoiceItem", fieldName: "amount", isId: false, isUnique: false, seq: seq })
    };
}
function defineInvoiceItemFactoryInternal(_a) {
    var _this = this;
    var defaultDataResolver = _a.defaultData, _b = _a.traits, traitsDefs = _b === void 0 ? {} : _b;
    var getFactoryWithTraits = function (traitKeys) {
        if (traitKeys === void 0) { traitKeys = []; }
        var seqKey = {};
        var getSeq = function () { return (0, internal_1.getSequenceCounter)(seqKey); };
        var screen = (0, internal_1.createScreener)("InvoiceItem", modelFieldDefinitions);
        var build = function () {
            var args_1 = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args_1[_i] = arguments[_i];
            }
            return __awaiter(_this, __spreadArray([], args_1, true), void 0, function (inputData) {
                var seq, requiredScalarData, resolveValue, defaultData, defaultAssociations, _a, data;
                var _b, _c;
                var _this = this;
                if (inputData === void 0) { inputData = {}; }
                return __generator(this, function (_d) {
                    switch (_d.label) {
                        case 0:
                            seq = getSeq();
                            requiredScalarData = autoGenerateInvoiceItemScalarsOrEnums({ seq: seq });
                            resolveValue = (0, internal_1.normalizeResolver)(defaultDataResolver !== null && defaultDataResolver !== void 0 ? defaultDataResolver : {});
                            return [4 /*yield*/, traitKeys.reduce(function (queue, traitKey) { return __awaiter(_this, void 0, void 0, function () {
                                    var acc, resolveTraitValue, traitData;
                                    var _a, _b;
                                    return __generator(this, function (_c) {
                                        switch (_c.label) {
                                            case 0: return [4 /*yield*/, queue];
                                            case 1:
                                                acc = _c.sent();
                                                resolveTraitValue = (0, internal_1.normalizeResolver)((_b = (_a = traitsDefs[traitKey]) === null || _a === void 0 ? void 0 : _a.data) !== null && _b !== void 0 ? _b : {});
                                                return [4 /*yield*/, resolveTraitValue({ seq: seq })];
                                            case 2:
                                                traitData = _c.sent();
                                                return [2 /*return*/, __assign(__assign({}, acc), traitData)];
                                        }
                                    });
                                }); }, resolveValue({ seq: seq }))];
                        case 1:
                            defaultData = _d.sent();
                            _b = {};
                            if (!isInvoiceIteminvoicesFactory(defaultData.invoices)) return [3 /*break*/, 3];
                            _c = {};
                            return [4 /*yield*/, defaultData.invoices.build()];
                        case 2:
                            _a = (_c.create = _d.sent(),
                                _c);
                            return [3 /*break*/, 4];
                        case 3:
                            _a = defaultData.invoices;
                            _d.label = 4;
                        case 4:
                            defaultAssociations = (_b.invoices = _a,
                                _b);
                            data = __assign(__assign(__assign(__assign({}, requiredScalarData), defaultData), defaultAssociations), inputData);
                            return [2 /*return*/, data];
                    }
                });
            });
        };
        var buildList = function (inputData) { return Promise.all((0, internal_1.normalizeList)(inputData).map(function (data) { return build(data); })); };
        var pickForConnect = function (inputData) { return ({
            id: inputData.id
        }); };
        var create = function () {
            var args_1 = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args_1[_i] = arguments[_i];
            }
            return __awaiter(_this, __spreadArray([], args_1, true), void 0, function (inputData) {
                var data;
                if (inputData === void 0) { inputData = {}; }
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, build(inputData).then(screen)];
                        case 1:
                            data = _a.sent();
                            return [4 /*yield*/, (0, internal_1.getClient)().invoiceItem.create({ data: data })];
                        case 2: return [2 /*return*/, _a.sent()];
                    }
                });
            });
        };
        var createList = function (inputData) { return Promise.all((0, internal_1.normalizeList)(inputData).map(function (data) { return create(data); })); };
        var createForConnect = function (inputData) {
            if (inputData === void 0) { inputData = {}; }
            return create(inputData).then(pickForConnect);
        };
        return {
            _factoryFor: "InvoiceItem",
            build: build,
            buildList: buildList,
            buildCreateInput: build,
            pickForConnect: pickForConnect,
            create: create,
            createList: createList,
            createForConnect: createForConnect,
        };
    };
    var factory = getFactoryWithTraits();
    var useTraits = function (name) {
        var names = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            names[_i - 1] = arguments[_i];
        }
        return getFactoryWithTraits(__spreadArray([name], names, true));
    };
    return __assign(__assign({}, factory), { use: useTraits });
}
/**
 * Define factory for {@link InvoiceItem} model.
 *
 * @param options
 * @returns factory {@link InvoiceItemFactoryInterface}
 */
function defineInvoiceItemFactory(options) {
    return defineInvoiceItemFactoryInternal(options !== null && options !== void 0 ? options : {});
}
exports.defineInvoiceItemFactory = defineInvoiceItemFactory;
function isInvoicesubscriptionFactory(x) {
    return (x === null || x === void 0 ? void 0 : x._factoryFor) === "Subscription";
}
function autoGenerateInvoiceScalarsOrEnums(_a) {
    var seq = _a.seq;
    return {
        mail: (0, internal_1.getScalarFieldValueGenerator)().String({ modelName: "Invoice", fieldName: "mail", isId: false, isUnique: false, seq: seq }),
        dueAt: (0, internal_1.getScalarFieldValueGenerator)().DateTime({ modelName: "Invoice", fieldName: "dueAt", isId: false, isUnique: false, seq: seq }),
        scheduledDeactivationAt: (0, internal_1.getScalarFieldValueGenerator)().DateTime({ modelName: "Invoice", fieldName: "scheduledDeactivationAt", isId: false, isUnique: false, seq: seq }),
        currency: "CHF"
    };
}
function defineInvoiceFactoryInternal(_a) {
    var _this = this;
    var defaultDataResolver = _a.defaultData, _b = _a.traits, traitsDefs = _b === void 0 ? {} : _b;
    var getFactoryWithTraits = function (traitKeys) {
        if (traitKeys === void 0) { traitKeys = []; }
        var seqKey = {};
        var getSeq = function () { return (0, internal_1.getSequenceCounter)(seqKey); };
        var screen = (0, internal_1.createScreener)("Invoice", modelFieldDefinitions);
        var build = function () {
            var args_1 = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args_1[_i] = arguments[_i];
            }
            return __awaiter(_this, __spreadArray([], args_1, true), void 0, function (inputData) {
                var seq, requiredScalarData, resolveValue, defaultData, defaultAssociations, _a, data;
                var _b, _c;
                var _this = this;
                if (inputData === void 0) { inputData = {}; }
                return __generator(this, function (_d) {
                    switch (_d.label) {
                        case 0:
                            seq = getSeq();
                            requiredScalarData = autoGenerateInvoiceScalarsOrEnums({ seq: seq });
                            resolveValue = (0, internal_1.normalizeResolver)(defaultDataResolver !== null && defaultDataResolver !== void 0 ? defaultDataResolver : {});
                            return [4 /*yield*/, traitKeys.reduce(function (queue, traitKey) { return __awaiter(_this, void 0, void 0, function () {
                                    var acc, resolveTraitValue, traitData;
                                    var _a, _b;
                                    return __generator(this, function (_c) {
                                        switch (_c.label) {
                                            case 0: return [4 /*yield*/, queue];
                                            case 1:
                                                acc = _c.sent();
                                                resolveTraitValue = (0, internal_1.normalizeResolver)((_b = (_a = traitsDefs[traitKey]) === null || _a === void 0 ? void 0 : _a.data) !== null && _b !== void 0 ? _b : {});
                                                return [4 /*yield*/, resolveTraitValue({ seq: seq })];
                                            case 2:
                                                traitData = _c.sent();
                                                return [2 /*return*/, __assign(__assign({}, acc), traitData)];
                                        }
                                    });
                                }); }, resolveValue({ seq: seq }))];
                        case 1:
                            defaultData = _d.sent();
                            _b = {};
                            if (!isInvoicesubscriptionFactory(defaultData.subscription)) return [3 /*break*/, 3];
                            _c = {};
                            return [4 /*yield*/, defaultData.subscription.build()];
                        case 2:
                            _a = (_c.create = _d.sent(),
                                _c);
                            return [3 /*break*/, 4];
                        case 3:
                            _a = defaultData.subscription;
                            _d.label = 4;
                        case 4:
                            defaultAssociations = (_b.subscription = _a,
                                _b);
                            data = __assign(__assign(__assign(__assign({}, requiredScalarData), defaultData), defaultAssociations), inputData);
                            return [2 /*return*/, data];
                    }
                });
            });
        };
        var buildList = function (inputData) { return Promise.all((0, internal_1.normalizeList)(inputData).map(function (data) { return build(data); })); };
        var pickForConnect = function (inputData) { return ({
            id: inputData.id
        }); };
        var create = function () {
            var args_1 = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args_1[_i] = arguments[_i];
            }
            return __awaiter(_this, __spreadArray([], args_1, true), void 0, function (inputData) {
                var data;
                if (inputData === void 0) { inputData = {}; }
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, build(inputData).then(screen)];
                        case 1:
                            data = _a.sent();
                            return [4 /*yield*/, (0, internal_1.getClient)().invoice.create({ data: data })];
                        case 2: return [2 /*return*/, _a.sent()];
                    }
                });
            });
        };
        var createList = function (inputData) { return Promise.all((0, internal_1.normalizeList)(inputData).map(function (data) { return create(data); })); };
        var createForConnect = function (inputData) {
            if (inputData === void 0) { inputData = {}; }
            return create(inputData).then(pickForConnect);
        };
        return {
            _factoryFor: "Invoice",
            build: build,
            buildList: buildList,
            buildCreateInput: build,
            pickForConnect: pickForConnect,
            create: create,
            createList: createList,
            createForConnect: createForConnect,
        };
    };
    var factory = getFactoryWithTraits();
    var useTraits = function (name) {
        var names = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            names[_i - 1] = arguments[_i];
        }
        return getFactoryWithTraits(__spreadArray([name], names, true));
    };
    return __assign(__assign({}, factory), { use: useTraits });
}
/**
 * Define factory for {@link Invoice} model.
 *
 * @param options
 * @returns factory {@link InvoiceFactoryInterface}
 */
function defineInvoiceFactory(options) {
    return defineInvoiceFactoryInternal(options !== null && options !== void 0 ? options : {});
}
exports.defineInvoiceFactory = defineInvoiceFactory;
function isMailLogrecipientFactory(x) {
    return (x === null || x === void 0 ? void 0 : x._factoryFor) === "User";
}
function isMailLogmailTemplateFactory(x) {
    return (x === null || x === void 0 ? void 0 : x._factoryFor) === "MailTemplate";
}
function autoGenerateMailLogScalarsOrEnums(_a) {
    var seq = _a.seq;
    return {
        state: "submitted",
        sentDate: (0, internal_1.getScalarFieldValueGenerator)().DateTime({ modelName: "MailLog", fieldName: "sentDate", isId: false, isUnique: false, seq: seq }),
        mailProviderID: (0, internal_1.getScalarFieldValueGenerator)().String({ modelName: "MailLog", fieldName: "mailProviderID", isId: false, isUnique: false, seq: seq }),
        mailIdentifier: (0, internal_1.getScalarFieldValueGenerator)().String({ modelName: "MailLog", fieldName: "mailIdentifier", isId: false, isUnique: false, seq: seq })
    };
}
function defineMailLogFactoryInternal(_a) {
    var _this = this;
    var defaultDataResolver = _a.defaultData, _b = _a.traits, traitsDefs = _b === void 0 ? {} : _b;
    var getFactoryWithTraits = function (traitKeys) {
        if (traitKeys === void 0) { traitKeys = []; }
        var seqKey = {};
        var getSeq = function () { return (0, internal_1.getSequenceCounter)(seqKey); };
        var screen = (0, internal_1.createScreener)("MailLog", modelFieldDefinitions);
        var build = function () {
            var args_1 = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args_1[_i] = arguments[_i];
            }
            return __awaiter(_this, __spreadArray([], args_1, true), void 0, function (inputData) {
                var seq, requiredScalarData, resolveValue, defaultData, defaultAssociations, _a, _b, data;
                var _c, _d, _e;
                var _this = this;
                if (inputData === void 0) { inputData = {}; }
                return __generator(this, function (_f) {
                    switch (_f.label) {
                        case 0:
                            seq = getSeq();
                            requiredScalarData = autoGenerateMailLogScalarsOrEnums({ seq: seq });
                            resolveValue = (0, internal_1.normalizeResolver)(defaultDataResolver !== null && defaultDataResolver !== void 0 ? defaultDataResolver : {});
                            return [4 /*yield*/, traitKeys.reduce(function (queue, traitKey) { return __awaiter(_this, void 0, void 0, function () {
                                    var acc, resolveTraitValue, traitData;
                                    var _a, _b;
                                    return __generator(this, function (_c) {
                                        switch (_c.label) {
                                            case 0: return [4 /*yield*/, queue];
                                            case 1:
                                                acc = _c.sent();
                                                resolveTraitValue = (0, internal_1.normalizeResolver)((_b = (_a = traitsDefs[traitKey]) === null || _a === void 0 ? void 0 : _a.data) !== null && _b !== void 0 ? _b : {});
                                                return [4 /*yield*/, resolveTraitValue({ seq: seq })];
                                            case 2:
                                                traitData = _c.sent();
                                                return [2 /*return*/, __assign(__assign({}, acc), traitData)];
                                        }
                                    });
                                }); }, resolveValue({ seq: seq }))];
                        case 1:
                            defaultData = _f.sent();
                            _c = {};
                            if (!isMailLogrecipientFactory(defaultData.recipient)) return [3 /*break*/, 3];
                            _d = {};
                            return [4 /*yield*/, defaultData.recipient.build()];
                        case 2:
                            _a = (_d.create = _f.sent(),
                                _d);
                            return [3 /*break*/, 4];
                        case 3:
                            _a = defaultData.recipient;
                            _f.label = 4;
                        case 4:
                            _c.recipient = _a;
                            if (!isMailLogmailTemplateFactory(defaultData.mailTemplate)) return [3 /*break*/, 6];
                            _e = {};
                            return [4 /*yield*/, defaultData.mailTemplate.build()];
                        case 5:
                            _b = (_e.create = _f.sent(),
                                _e);
                            return [3 /*break*/, 7];
                        case 6:
                            _b = defaultData.mailTemplate;
                            _f.label = 7;
                        case 7:
                            defaultAssociations = (_c.mailTemplate = _b,
                                _c);
                            data = __assign(__assign(__assign(__assign({}, requiredScalarData), defaultData), defaultAssociations), inputData);
                            return [2 /*return*/, data];
                    }
                });
            });
        };
        var buildList = function (inputData) { return Promise.all((0, internal_1.normalizeList)(inputData).map(function (data) { return build(data); })); };
        var pickForConnect = function (inputData) { return ({
            id: inputData.id
        }); };
        var create = function () {
            var args_1 = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args_1[_i] = arguments[_i];
            }
            return __awaiter(_this, __spreadArray([], args_1, true), void 0, function (inputData) {
                var data;
                if (inputData === void 0) { inputData = {}; }
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, build(inputData).then(screen)];
                        case 1:
                            data = _a.sent();
                            return [4 /*yield*/, (0, internal_1.getClient)().mailLog.create({ data: data })];
                        case 2: return [2 /*return*/, _a.sent()];
                    }
                });
            });
        };
        var createList = function (inputData) { return Promise.all((0, internal_1.normalizeList)(inputData).map(function (data) { return create(data); })); };
        var createForConnect = function (inputData) {
            if (inputData === void 0) { inputData = {}; }
            return create(inputData).then(pickForConnect);
        };
        return {
            _factoryFor: "MailLog",
            build: build,
            buildList: buildList,
            buildCreateInput: build,
            pickForConnect: pickForConnect,
            create: create,
            createList: createList,
            createForConnect: createForConnect,
        };
    };
    var factory = getFactoryWithTraits();
    var useTraits = function (name) {
        var names = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            names[_i - 1] = arguments[_i];
        }
        return getFactoryWithTraits(__spreadArray([name], names, true));
    };
    return __assign(__assign({}, factory), { use: useTraits });
}
/**
 * Define factory for {@link MailLog} model.
 *
 * @param options
 * @returns factory {@link MailLogFactoryInterface}
 */
function defineMailLogFactory(options) {
    return defineMailLogFactoryInternal(options);
}
exports.defineMailLogFactory = defineMailLogFactory;
function isAvailablePaymentMethodMemberPlanFactory(x) {
    return (x === null || x === void 0 ? void 0 : x._factoryFor) === "MemberPlan";
}
function autoGenerateAvailablePaymentMethodScalarsOrEnums(_a) {
    var seq = _a.seq;
    return {
        forceAutoRenewal: (0, internal_1.getScalarFieldValueGenerator)().Boolean({ modelName: "AvailablePaymentMethod", fieldName: "forceAutoRenewal", isId: false, isUnique: false, seq: seq })
    };
}
function defineAvailablePaymentMethodFactoryInternal(_a) {
    var _this = this;
    var defaultDataResolver = _a.defaultData, _b = _a.traits, traitsDefs = _b === void 0 ? {} : _b;
    var getFactoryWithTraits = function (traitKeys) {
        if (traitKeys === void 0) { traitKeys = []; }
        var seqKey = {};
        var getSeq = function () { return (0, internal_1.getSequenceCounter)(seqKey); };
        var screen = (0, internal_1.createScreener)("AvailablePaymentMethod", modelFieldDefinitions);
        var build = function () {
            var args_1 = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args_1[_i] = arguments[_i];
            }
            return __awaiter(_this, __spreadArray([], args_1, true), void 0, function (inputData) {
                var seq, requiredScalarData, resolveValue, defaultData, defaultAssociations, _a, data;
                var _b, _c;
                var _this = this;
                if (inputData === void 0) { inputData = {}; }
                return __generator(this, function (_d) {
                    switch (_d.label) {
                        case 0:
                            seq = getSeq();
                            requiredScalarData = autoGenerateAvailablePaymentMethodScalarsOrEnums({ seq: seq });
                            resolveValue = (0, internal_1.normalizeResolver)(defaultDataResolver !== null && defaultDataResolver !== void 0 ? defaultDataResolver : {});
                            return [4 /*yield*/, traitKeys.reduce(function (queue, traitKey) { return __awaiter(_this, void 0, void 0, function () {
                                    var acc, resolveTraitValue, traitData;
                                    var _a, _b;
                                    return __generator(this, function (_c) {
                                        switch (_c.label) {
                                            case 0: return [4 /*yield*/, queue];
                                            case 1:
                                                acc = _c.sent();
                                                resolveTraitValue = (0, internal_1.normalizeResolver)((_b = (_a = traitsDefs[traitKey]) === null || _a === void 0 ? void 0 : _a.data) !== null && _b !== void 0 ? _b : {});
                                                return [4 /*yield*/, resolveTraitValue({ seq: seq })];
                                            case 2:
                                                traitData = _c.sent();
                                                return [2 /*return*/, __assign(__assign({}, acc), traitData)];
                                        }
                                    });
                                }); }, resolveValue({ seq: seq }))];
                        case 1:
                            defaultData = _d.sent();
                            _b = {};
                            if (!isAvailablePaymentMethodMemberPlanFactory(defaultData.MemberPlan)) return [3 /*break*/, 3];
                            _c = {};
                            return [4 /*yield*/, defaultData.MemberPlan.build()];
                        case 2:
                            _a = (_c.create = _d.sent(),
                                _c);
                            return [3 /*break*/, 4];
                        case 3:
                            _a = defaultData.MemberPlan;
                            _d.label = 4;
                        case 4:
                            defaultAssociations = (_b.MemberPlan = _a,
                                _b);
                            data = __assign(__assign(__assign(__assign({}, requiredScalarData), defaultData), defaultAssociations), inputData);
                            return [2 /*return*/, data];
                    }
                });
            });
        };
        var buildList = function (inputData) { return Promise.all((0, internal_1.normalizeList)(inputData).map(function (data) { return build(data); })); };
        var pickForConnect = function (inputData) { return ({
            id: inputData.id
        }); };
        var create = function () {
            var args_1 = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args_1[_i] = arguments[_i];
            }
            return __awaiter(_this, __spreadArray([], args_1, true), void 0, function (inputData) {
                var data;
                if (inputData === void 0) { inputData = {}; }
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, build(inputData).then(screen)];
                        case 1:
                            data = _a.sent();
                            return [4 /*yield*/, (0, internal_1.getClient)().availablePaymentMethod.create({ data: data })];
                        case 2: return [2 /*return*/, _a.sent()];
                    }
                });
            });
        };
        var createList = function (inputData) { return Promise.all((0, internal_1.normalizeList)(inputData).map(function (data) { return create(data); })); };
        var createForConnect = function (inputData) {
            if (inputData === void 0) { inputData = {}; }
            return create(inputData).then(pickForConnect);
        };
        return {
            _factoryFor: "AvailablePaymentMethod",
            build: build,
            buildList: buildList,
            buildCreateInput: build,
            pickForConnect: pickForConnect,
            create: create,
            createList: createList,
            createForConnect: createForConnect,
        };
    };
    var factory = getFactoryWithTraits();
    var useTraits = function (name) {
        var names = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            names[_i - 1] = arguments[_i];
        }
        return getFactoryWithTraits(__spreadArray([name], names, true));
    };
    return __assign(__assign({}, factory), { use: useTraits });
}
/**
 * Define factory for {@link AvailablePaymentMethod} model.
 *
 * @param options
 * @returns factory {@link AvailablePaymentMethodFactoryInterface}
 */
function defineAvailablePaymentMethodFactory(options) {
    return defineAvailablePaymentMethodFactoryInternal(options !== null && options !== void 0 ? options : {});
}
exports.defineAvailablePaymentMethodFactory = defineAvailablePaymentMethodFactory;
function isMemberPlanmigrateToTargetPaymentMethodFactory(x) {
    return (x === null || x === void 0 ? void 0 : x._factoryFor) === "PaymentMethod";
}
function isMemberPlanimageFactory(x) {
    return (x === null || x === void 0 ? void 0 : x._factoryFor) === "Image";
}
function isMemberPlansuccessPageFactory(x) {
    return (x === null || x === void 0 ? void 0 : x._factoryFor) === "Page";
}
function isMemberPlanfailPageFactory(x) {
    return (x === null || x === void 0 ? void 0 : x._factoryFor) === "Page";
}
function isMemberPlanconfirmationPageFactory(x) {
    return (x === null || x === void 0 ? void 0 : x._factoryFor) === "Page";
}
function autoGenerateMemberPlanScalarsOrEnums(_a) {
    var seq = _a.seq;
    return {
        name: (0, internal_1.getScalarFieldValueGenerator)().String({ modelName: "MemberPlan", fieldName: "name", isId: false, isUnique: false, seq: seq }),
        slug: (0, internal_1.getScalarFieldValueGenerator)().String({ modelName: "MemberPlan", fieldName: "slug", isId: false, isUnique: true, seq: seq }),
        description: (0, internal_1.getScalarFieldValueGenerator)().Json({ modelName: "MemberPlan", fieldName: "description", isId: false, isUnique: false, seq: seq }),
        active: (0, internal_1.getScalarFieldValueGenerator)().Boolean({ modelName: "MemberPlan", fieldName: "active", isId: false, isUnique: false, seq: seq }),
        currency: "CHF",
        amountPerMonthMin: (0, internal_1.getScalarFieldValueGenerator)().Float({ modelName: "MemberPlan", fieldName: "amountPerMonthMin", isId: false, isUnique: false, seq: seq })
    };
}
function defineMemberPlanFactoryInternal(_a) {
    var _this = this;
    var defaultDataResolver = _a.defaultData, _b = _a.traits, traitsDefs = _b === void 0 ? {} : _b;
    var getFactoryWithTraits = function (traitKeys) {
        if (traitKeys === void 0) { traitKeys = []; }
        var seqKey = {};
        var getSeq = function () { return (0, internal_1.getSequenceCounter)(seqKey); };
        var screen = (0, internal_1.createScreener)("MemberPlan", modelFieldDefinitions);
        var build = function () {
            var args_1 = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args_1[_i] = arguments[_i];
            }
            return __awaiter(_this, __spreadArray([], args_1, true), void 0, function (inputData) {
                var seq, requiredScalarData, resolveValue, defaultData, defaultAssociations, _a, _b, _c, _d, _e, data;
                var _f, _g, _h, _j, _k, _l;
                var _this = this;
                if (inputData === void 0) { inputData = {}; }
                return __generator(this, function (_m) {
                    switch (_m.label) {
                        case 0:
                            seq = getSeq();
                            requiredScalarData = autoGenerateMemberPlanScalarsOrEnums({ seq: seq });
                            resolveValue = (0, internal_1.normalizeResolver)(defaultDataResolver !== null && defaultDataResolver !== void 0 ? defaultDataResolver : {});
                            return [4 /*yield*/, traitKeys.reduce(function (queue, traitKey) { return __awaiter(_this, void 0, void 0, function () {
                                    var acc, resolveTraitValue, traitData;
                                    var _a, _b;
                                    return __generator(this, function (_c) {
                                        switch (_c.label) {
                                            case 0: return [4 /*yield*/, queue];
                                            case 1:
                                                acc = _c.sent();
                                                resolveTraitValue = (0, internal_1.normalizeResolver)((_b = (_a = traitsDefs[traitKey]) === null || _a === void 0 ? void 0 : _a.data) !== null && _b !== void 0 ? _b : {});
                                                return [4 /*yield*/, resolveTraitValue({ seq: seq })];
                                            case 2:
                                                traitData = _c.sent();
                                                return [2 /*return*/, __assign(__assign({}, acc), traitData)];
                                        }
                                    });
                                }); }, resolveValue({ seq: seq }))];
                        case 1:
                            defaultData = _m.sent();
                            _f = {};
                            if (!isMemberPlanmigrateToTargetPaymentMethodFactory(defaultData.migrateToTargetPaymentMethod)) return [3 /*break*/, 3];
                            _g = {};
                            return [4 /*yield*/, defaultData.migrateToTargetPaymentMethod.build()];
                        case 2:
                            _a = (_g.create = _m.sent(),
                                _g);
                            return [3 /*break*/, 4];
                        case 3:
                            _a = defaultData.migrateToTargetPaymentMethod;
                            _m.label = 4;
                        case 4:
                            _f.migrateToTargetPaymentMethod = _a;
                            if (!isMemberPlanimageFactory(defaultData.image)) return [3 /*break*/, 6];
                            _h = {};
                            return [4 /*yield*/, defaultData.image.build()];
                        case 5:
                            _b = (_h.create = _m.sent(),
                                _h);
                            return [3 /*break*/, 7];
                        case 6:
                            _b = defaultData.image;
                            _m.label = 7;
                        case 7:
                            _f.image = _b;
                            if (!isMemberPlansuccessPageFactory(defaultData.successPage)) return [3 /*break*/, 9];
                            _j = {};
                            return [4 /*yield*/, defaultData.successPage.build()];
                        case 8:
                            _c = (_j.create = _m.sent(),
                                _j);
                            return [3 /*break*/, 10];
                        case 9:
                            _c = defaultData.successPage;
                            _m.label = 10;
                        case 10:
                            _f.successPage = _c;
                            if (!isMemberPlanfailPageFactory(defaultData.failPage)) return [3 /*break*/, 12];
                            _k = {};
                            return [4 /*yield*/, defaultData.failPage.build()];
                        case 11:
                            _d = (_k.create = _m.sent(),
                                _k);
                            return [3 /*break*/, 13];
                        case 12:
                            _d = defaultData.failPage;
                            _m.label = 13;
                        case 13:
                            _f.failPage = _d;
                            if (!isMemberPlanconfirmationPageFactory(defaultData.confirmationPage)) return [3 /*break*/, 15];
                            _l = {};
                            return [4 /*yield*/, defaultData.confirmationPage.build()];
                        case 14:
                            _e = (_l.create = _m.sent(),
                                _l);
                            return [3 /*break*/, 16];
                        case 15:
                            _e = defaultData.confirmationPage;
                            _m.label = 16;
                        case 16:
                            defaultAssociations = (_f.confirmationPage = _e,
                                _f);
                            data = __assign(__assign(__assign(__assign({}, requiredScalarData), defaultData), defaultAssociations), inputData);
                            return [2 /*return*/, data];
                    }
                });
            });
        };
        var buildList = function (inputData) { return Promise.all((0, internal_1.normalizeList)(inputData).map(function (data) { return build(data); })); };
        var pickForConnect = function (inputData) { return ({
            id: inputData.id
        }); };
        var create = function () {
            var args_1 = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args_1[_i] = arguments[_i];
            }
            return __awaiter(_this, __spreadArray([], args_1, true), void 0, function (inputData) {
                var data;
                if (inputData === void 0) { inputData = {}; }
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, build(inputData).then(screen)];
                        case 1:
                            data = _a.sent();
                            return [4 /*yield*/, (0, internal_1.getClient)().memberPlan.create({ data: data })];
                        case 2: return [2 /*return*/, _a.sent()];
                    }
                });
            });
        };
        var createList = function (inputData) { return Promise.all((0, internal_1.normalizeList)(inputData).map(function (data) { return create(data); })); };
        var createForConnect = function (inputData) {
            if (inputData === void 0) { inputData = {}; }
            return create(inputData).then(pickForConnect);
        };
        return {
            _factoryFor: "MemberPlan",
            build: build,
            buildList: buildList,
            buildCreateInput: build,
            pickForConnect: pickForConnect,
            create: create,
            createList: createList,
            createForConnect: createForConnect,
        };
    };
    var factory = getFactoryWithTraits();
    var useTraits = function (name) {
        var names = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            names[_i - 1] = arguments[_i];
        }
        return getFactoryWithTraits(__spreadArray([name], names, true));
    };
    return __assign(__assign({}, factory), { use: useTraits });
}
/**
 * Define factory for {@link MemberPlan} model.
 *
 * @param options
 * @returns factory {@link MemberPlanFactoryInterface}
 */
function defineMemberPlanFactory(options) {
    return defineMemberPlanFactoryInternal(options !== null && options !== void 0 ? options : {});
}
exports.defineMemberPlanFactory = defineMemberPlanFactory;
function isNavigationLinkpageFactory(x) {
    return (x === null || x === void 0 ? void 0 : x._factoryFor) === "Page";
}
function isNavigationLinkarticleFactory(x) {
    return (x === null || x === void 0 ? void 0 : x._factoryFor) === "Article";
}
function isNavigationLinknavigationFactory(x) {
    return (x === null || x === void 0 ? void 0 : x._factoryFor) === "Navigation";
}
function autoGenerateNavigationLinkScalarsOrEnums(_a) {
    var seq = _a.seq;
    return {
        label: (0, internal_1.getScalarFieldValueGenerator)().String({ modelName: "NavigationLink", fieldName: "label", isId: false, isUnique: false, seq: seq }),
        type: (0, internal_1.getScalarFieldValueGenerator)().String({ modelName: "NavigationLink", fieldName: "type", isId: false, isUnique: false, seq: seq })
    };
}
function defineNavigationLinkFactoryInternal(_a) {
    var _this = this;
    var defaultDataResolver = _a.defaultData, _b = _a.traits, traitsDefs = _b === void 0 ? {} : _b;
    var getFactoryWithTraits = function (traitKeys) {
        if (traitKeys === void 0) { traitKeys = []; }
        var seqKey = {};
        var getSeq = function () { return (0, internal_1.getSequenceCounter)(seqKey); };
        var screen = (0, internal_1.createScreener)("NavigationLink", modelFieldDefinitions);
        var build = function () {
            var args_1 = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args_1[_i] = arguments[_i];
            }
            return __awaiter(_this, __spreadArray([], args_1, true), void 0, function (inputData) {
                var seq, requiredScalarData, resolveValue, defaultData, defaultAssociations, _a, _b, _c, data;
                var _d, _e, _f, _g;
                var _this = this;
                if (inputData === void 0) { inputData = {}; }
                return __generator(this, function (_h) {
                    switch (_h.label) {
                        case 0:
                            seq = getSeq();
                            requiredScalarData = autoGenerateNavigationLinkScalarsOrEnums({ seq: seq });
                            resolveValue = (0, internal_1.normalizeResolver)(defaultDataResolver !== null && defaultDataResolver !== void 0 ? defaultDataResolver : {});
                            return [4 /*yield*/, traitKeys.reduce(function (queue, traitKey) { return __awaiter(_this, void 0, void 0, function () {
                                    var acc, resolveTraitValue, traitData;
                                    var _a, _b;
                                    return __generator(this, function (_c) {
                                        switch (_c.label) {
                                            case 0: return [4 /*yield*/, queue];
                                            case 1:
                                                acc = _c.sent();
                                                resolveTraitValue = (0, internal_1.normalizeResolver)((_b = (_a = traitsDefs[traitKey]) === null || _a === void 0 ? void 0 : _a.data) !== null && _b !== void 0 ? _b : {});
                                                return [4 /*yield*/, resolveTraitValue({ seq: seq })];
                                            case 2:
                                                traitData = _c.sent();
                                                return [2 /*return*/, __assign(__assign({}, acc), traitData)];
                                        }
                                    });
                                }); }, resolveValue({ seq: seq }))];
                        case 1:
                            defaultData = _h.sent();
                            _d = {};
                            if (!isNavigationLinkpageFactory(defaultData.page)) return [3 /*break*/, 3];
                            _e = {};
                            return [4 /*yield*/, defaultData.page.build()];
                        case 2:
                            _a = (_e.create = _h.sent(),
                                _e);
                            return [3 /*break*/, 4];
                        case 3:
                            _a = defaultData.page;
                            _h.label = 4;
                        case 4:
                            _d.page = _a;
                            if (!isNavigationLinkarticleFactory(defaultData.article)) return [3 /*break*/, 6];
                            _f = {};
                            return [4 /*yield*/, defaultData.article.build()];
                        case 5:
                            _b = (_f.create = _h.sent(),
                                _f);
                            return [3 /*break*/, 7];
                        case 6:
                            _b = defaultData.article;
                            _h.label = 7;
                        case 7:
                            _d.article = _b;
                            if (!isNavigationLinknavigationFactory(defaultData.navigation)) return [3 /*break*/, 9];
                            _g = {};
                            return [4 /*yield*/, defaultData.navigation.build()];
                        case 8:
                            _c = (_g.create = _h.sent(),
                                _g);
                            return [3 /*break*/, 10];
                        case 9:
                            _c = defaultData.navigation;
                            _h.label = 10;
                        case 10:
                            defaultAssociations = (_d.navigation = _c,
                                _d);
                            data = __assign(__assign(__assign(__assign({}, requiredScalarData), defaultData), defaultAssociations), inputData);
                            return [2 /*return*/, data];
                    }
                });
            });
        };
        var buildList = function (inputData) { return Promise.all((0, internal_1.normalizeList)(inputData).map(function (data) { return build(data); })); };
        var pickForConnect = function (inputData) { return ({
            id: inputData.id
        }); };
        var create = function () {
            var args_1 = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args_1[_i] = arguments[_i];
            }
            return __awaiter(_this, __spreadArray([], args_1, true), void 0, function (inputData) {
                var data;
                if (inputData === void 0) { inputData = {}; }
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, build(inputData).then(screen)];
                        case 1:
                            data = _a.sent();
                            return [4 /*yield*/, (0, internal_1.getClient)().navigationLink.create({ data: data })];
                        case 2: return [2 /*return*/, _a.sent()];
                    }
                });
            });
        };
        var createList = function (inputData) { return Promise.all((0, internal_1.normalizeList)(inputData).map(function (data) { return create(data); })); };
        var createForConnect = function (inputData) {
            if (inputData === void 0) { inputData = {}; }
            return create(inputData).then(pickForConnect);
        };
        return {
            _factoryFor: "NavigationLink",
            build: build,
            buildList: buildList,
            buildCreateInput: build,
            pickForConnect: pickForConnect,
            create: create,
            createList: createList,
            createForConnect: createForConnect,
        };
    };
    var factory = getFactoryWithTraits();
    var useTraits = function (name) {
        var names = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            names[_i - 1] = arguments[_i];
        }
        return getFactoryWithTraits(__spreadArray([name], names, true));
    };
    return __assign(__assign({}, factory), { use: useTraits });
}
/**
 * Define factory for {@link NavigationLink} model.
 *
 * @param options
 * @returns factory {@link NavigationLinkFactoryInterface}
 */
function defineNavigationLinkFactory(options) {
    return defineNavigationLinkFactoryInternal(options !== null && options !== void 0 ? options : {});
}
exports.defineNavigationLinkFactory = defineNavigationLinkFactory;
function autoGenerateNavigationScalarsOrEnums(_a) {
    var seq = _a.seq;
    return {
        key: (0, internal_1.getScalarFieldValueGenerator)().String({ modelName: "Navigation", fieldName: "key", isId: false, isUnique: true, seq: seq }),
        name: (0, internal_1.getScalarFieldValueGenerator)().String({ modelName: "Navigation", fieldName: "name", isId: false, isUnique: false, seq: seq })
    };
}
function defineNavigationFactoryInternal(_a) {
    var _this = this;
    var defaultDataResolver = _a.defaultData, _b = _a.traits, traitsDefs = _b === void 0 ? {} : _b;
    var getFactoryWithTraits = function (traitKeys) {
        if (traitKeys === void 0) { traitKeys = []; }
        var seqKey = {};
        var getSeq = function () { return (0, internal_1.getSequenceCounter)(seqKey); };
        var screen = (0, internal_1.createScreener)("Navigation", modelFieldDefinitions);
        var build = function () {
            var args_1 = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args_1[_i] = arguments[_i];
            }
            return __awaiter(_this, __spreadArray([], args_1, true), void 0, function (inputData) {
                var seq, requiredScalarData, resolveValue, defaultData, defaultAssociations, data;
                var _this = this;
                if (inputData === void 0) { inputData = {}; }
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            seq = getSeq();
                            requiredScalarData = autoGenerateNavigationScalarsOrEnums({ seq: seq });
                            resolveValue = (0, internal_1.normalizeResolver)(defaultDataResolver !== null && defaultDataResolver !== void 0 ? defaultDataResolver : {});
                            return [4 /*yield*/, traitKeys.reduce(function (queue, traitKey) { return __awaiter(_this, void 0, void 0, function () {
                                    var acc, resolveTraitValue, traitData;
                                    var _a, _b;
                                    return __generator(this, function (_c) {
                                        switch (_c.label) {
                                            case 0: return [4 /*yield*/, queue];
                                            case 1:
                                                acc = _c.sent();
                                                resolveTraitValue = (0, internal_1.normalizeResolver)((_b = (_a = traitsDefs[traitKey]) === null || _a === void 0 ? void 0 : _a.data) !== null && _b !== void 0 ? _b : {});
                                                return [4 /*yield*/, resolveTraitValue({ seq: seq })];
                                            case 2:
                                                traitData = _c.sent();
                                                return [2 /*return*/, __assign(__assign({}, acc), traitData)];
                                        }
                                    });
                                }); }, resolveValue({ seq: seq }))];
                        case 1:
                            defaultData = _a.sent();
                            defaultAssociations = {};
                            data = __assign(__assign(__assign(__assign({}, requiredScalarData), defaultData), defaultAssociations), inputData);
                            return [2 /*return*/, data];
                    }
                });
            });
        };
        var buildList = function (inputData) { return Promise.all((0, internal_1.normalizeList)(inputData).map(function (data) { return build(data); })); };
        var pickForConnect = function (inputData) { return ({
            id: inputData.id
        }); };
        var create = function () {
            var args_1 = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args_1[_i] = arguments[_i];
            }
            return __awaiter(_this, __spreadArray([], args_1, true), void 0, function (inputData) {
                var data;
                if (inputData === void 0) { inputData = {}; }
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, build(inputData).then(screen)];
                        case 1:
                            data = _a.sent();
                            return [4 /*yield*/, (0, internal_1.getClient)().navigation.create({ data: data })];
                        case 2: return [2 /*return*/, _a.sent()];
                    }
                });
            });
        };
        var createList = function (inputData) { return Promise.all((0, internal_1.normalizeList)(inputData).map(function (data) { return create(data); })); };
        var createForConnect = function (inputData) {
            if (inputData === void 0) { inputData = {}; }
            return create(inputData).then(pickForConnect);
        };
        return {
            _factoryFor: "Navigation",
            build: build,
            buildList: buildList,
            buildCreateInput: build,
            pickForConnect: pickForConnect,
            create: create,
            createList: createList,
            createForConnect: createForConnect,
        };
    };
    var factory = getFactoryWithTraits();
    var useTraits = function (name) {
        var names = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            names[_i - 1] = arguments[_i];
        }
        return getFactoryWithTraits(__spreadArray([name], names, true));
    };
    return __assign(__assign({}, factory), { use: useTraits });
}
/**
 * Define factory for {@link Navigation} model.
 *
 * @param options
 * @returns factory {@link NavigationFactoryInterface}
 */
function defineNavigationFactory(options) {
    return defineNavigationFactoryInternal(options !== null && options !== void 0 ? options : {});
}
exports.defineNavigationFactory = defineNavigationFactory;
function isPageRevisionimageFactory(x) {
    return (x === null || x === void 0 ? void 0 : x._factoryFor) === "Image";
}
function isPageRevisionsocialMediaImageFactory(x) {
    return (x === null || x === void 0 ? void 0 : x._factoryFor) === "Image";
}
function isPageRevisionpageFactory(x) {
    return (x === null || x === void 0 ? void 0 : x._factoryFor) === "Page";
}
function isPageRevisionuserFactory(x) {
    return (x === null || x === void 0 ? void 0 : x._factoryFor) === "User";
}
function autoGeneratePageRevisionScalarsOrEnums(_a) {
    var seq = _a.seq;
    return {
        blocks: (0, internal_1.getScalarFieldValueGenerator)().Json({ modelName: "PageRevision", fieldName: "blocks", isId: false, isUnique: false, seq: seq })
    };
}
function definePageRevisionFactoryInternal(_a) {
    var _this = this;
    var defaultDataResolver = _a.defaultData, _b = _a.traits, traitsDefs = _b === void 0 ? {} : _b;
    var getFactoryWithTraits = function (traitKeys) {
        if (traitKeys === void 0) { traitKeys = []; }
        var seqKey = {};
        var getSeq = function () { return (0, internal_1.getSequenceCounter)(seqKey); };
        var screen = (0, internal_1.createScreener)("PageRevision", modelFieldDefinitions);
        var build = function () {
            var args_1 = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args_1[_i] = arguments[_i];
            }
            return __awaiter(_this, __spreadArray([], args_1, true), void 0, function (inputData) {
                var seq, requiredScalarData, resolveValue, defaultData, defaultAssociations, _a, _b, _c, _d, data;
                var _e, _f, _g, _h, _j;
                var _this = this;
                if (inputData === void 0) { inputData = {}; }
                return __generator(this, function (_k) {
                    switch (_k.label) {
                        case 0:
                            seq = getSeq();
                            requiredScalarData = autoGeneratePageRevisionScalarsOrEnums({ seq: seq });
                            resolveValue = (0, internal_1.normalizeResolver)(defaultDataResolver !== null && defaultDataResolver !== void 0 ? defaultDataResolver : {});
                            return [4 /*yield*/, traitKeys.reduce(function (queue, traitKey) { return __awaiter(_this, void 0, void 0, function () {
                                    var acc, resolveTraitValue, traitData;
                                    var _a, _b;
                                    return __generator(this, function (_c) {
                                        switch (_c.label) {
                                            case 0: return [4 /*yield*/, queue];
                                            case 1:
                                                acc = _c.sent();
                                                resolveTraitValue = (0, internal_1.normalizeResolver)((_b = (_a = traitsDefs[traitKey]) === null || _a === void 0 ? void 0 : _a.data) !== null && _b !== void 0 ? _b : {});
                                                return [4 /*yield*/, resolveTraitValue({ seq: seq })];
                                            case 2:
                                                traitData = _c.sent();
                                                return [2 /*return*/, __assign(__assign({}, acc), traitData)];
                                        }
                                    });
                                }); }, resolveValue({ seq: seq }))];
                        case 1:
                            defaultData = _k.sent();
                            _e = {};
                            if (!isPageRevisionimageFactory(defaultData.image)) return [3 /*break*/, 3];
                            _f = {};
                            return [4 /*yield*/, defaultData.image.build()];
                        case 2:
                            _a = (_f.create = _k.sent(),
                                _f);
                            return [3 /*break*/, 4];
                        case 3:
                            _a = defaultData.image;
                            _k.label = 4;
                        case 4:
                            _e.image = _a;
                            if (!isPageRevisionsocialMediaImageFactory(defaultData.socialMediaImage)) return [3 /*break*/, 6];
                            _g = {};
                            return [4 /*yield*/, defaultData.socialMediaImage.build()];
                        case 5:
                            _b = (_g.create = _k.sent(),
                                _g);
                            return [3 /*break*/, 7];
                        case 6:
                            _b = defaultData.socialMediaImage;
                            _k.label = 7;
                        case 7:
                            _e.socialMediaImage = _b;
                            if (!isPageRevisionpageFactory(defaultData.page)) return [3 /*break*/, 9];
                            _h = {};
                            return [4 /*yield*/, defaultData.page.build()];
                        case 8:
                            _c = (_h.create = _k.sent(),
                                _h);
                            return [3 /*break*/, 10];
                        case 9:
                            _c = defaultData.page;
                            _k.label = 10;
                        case 10:
                            _e.page = _c;
                            if (!isPageRevisionuserFactory(defaultData.user)) return [3 /*break*/, 12];
                            _j = {};
                            return [4 /*yield*/, defaultData.user.build()];
                        case 11:
                            _d = (_j.create = _k.sent(),
                                _j);
                            return [3 /*break*/, 13];
                        case 12:
                            _d = defaultData.user;
                            _k.label = 13;
                        case 13:
                            defaultAssociations = (_e.user = _d,
                                _e);
                            data = __assign(__assign(__assign(__assign({}, requiredScalarData), defaultData), defaultAssociations), inputData);
                            return [2 /*return*/, data];
                    }
                });
            });
        };
        var buildList = function (inputData) { return Promise.all((0, internal_1.normalizeList)(inputData).map(function (data) { return build(data); })); };
        var pickForConnect = function (inputData) { return ({
            id: inputData.id
        }); };
        var create = function () {
            var args_1 = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args_1[_i] = arguments[_i];
            }
            return __awaiter(_this, __spreadArray([], args_1, true), void 0, function (inputData) {
                var data;
                if (inputData === void 0) { inputData = {}; }
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, build(inputData).then(screen)];
                        case 1:
                            data = _a.sent();
                            return [4 /*yield*/, (0, internal_1.getClient)().pageRevision.create({ data: data })];
                        case 2: return [2 /*return*/, _a.sent()];
                    }
                });
            });
        };
        var createList = function (inputData) { return Promise.all((0, internal_1.normalizeList)(inputData).map(function (data) { return create(data); })); };
        var createForConnect = function (inputData) {
            if (inputData === void 0) { inputData = {}; }
            return create(inputData).then(pickForConnect);
        };
        return {
            _factoryFor: "PageRevision",
            build: build,
            buildList: buildList,
            buildCreateInput: build,
            pickForConnect: pickForConnect,
            create: create,
            createList: createList,
            createForConnect: createForConnect,
        };
    };
    var factory = getFactoryWithTraits();
    var useTraits = function (name) {
        var names = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            names[_i - 1] = arguments[_i];
        }
        return getFactoryWithTraits(__spreadArray([name], names, true));
    };
    return __assign(__assign({}, factory), { use: useTraits });
}
/**
 * Define factory for {@link PageRevision} model.
 *
 * @param options
 * @returns factory {@link PageRevisionFactoryInterface}
 */
function definePageRevisionFactory(options) {
    return definePageRevisionFactoryInternal(options);
}
exports.definePageRevisionFactory = definePageRevisionFactory;
function autoGeneratePageScalarsOrEnums(_a) {
    var seq = _a.seq;
    return {};
}
function definePageFactoryInternal(_a) {
    var _this = this;
    var defaultDataResolver = _a.defaultData, _b = _a.traits, traitsDefs = _b === void 0 ? {} : _b;
    var getFactoryWithTraits = function (traitKeys) {
        if (traitKeys === void 0) { traitKeys = []; }
        var seqKey = {};
        var getSeq = function () { return (0, internal_1.getSequenceCounter)(seqKey); };
        var screen = (0, internal_1.createScreener)("Page", modelFieldDefinitions);
        var build = function () {
            var args_1 = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args_1[_i] = arguments[_i];
            }
            return __awaiter(_this, __spreadArray([], args_1, true), void 0, function (inputData) {
                var seq, requiredScalarData, resolveValue, defaultData, defaultAssociations, data;
                var _this = this;
                if (inputData === void 0) { inputData = {}; }
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            seq = getSeq();
                            requiredScalarData = autoGeneratePageScalarsOrEnums({ seq: seq });
                            resolveValue = (0, internal_1.normalizeResolver)(defaultDataResolver !== null && defaultDataResolver !== void 0 ? defaultDataResolver : {});
                            return [4 /*yield*/, traitKeys.reduce(function (queue, traitKey) { return __awaiter(_this, void 0, void 0, function () {
                                    var acc, resolveTraitValue, traitData;
                                    var _a, _b;
                                    return __generator(this, function (_c) {
                                        switch (_c.label) {
                                            case 0: return [4 /*yield*/, queue];
                                            case 1:
                                                acc = _c.sent();
                                                resolveTraitValue = (0, internal_1.normalizeResolver)((_b = (_a = traitsDefs[traitKey]) === null || _a === void 0 ? void 0 : _a.data) !== null && _b !== void 0 ? _b : {});
                                                return [4 /*yield*/, resolveTraitValue({ seq: seq })];
                                            case 2:
                                                traitData = _c.sent();
                                                return [2 /*return*/, __assign(__assign({}, acc), traitData)];
                                        }
                                    });
                                }); }, resolveValue({ seq: seq }))];
                        case 1:
                            defaultData = _a.sent();
                            defaultAssociations = {};
                            data = __assign(__assign(__assign(__assign({}, requiredScalarData), defaultData), defaultAssociations), inputData);
                            return [2 /*return*/, data];
                    }
                });
            });
        };
        var buildList = function (inputData) { return Promise.all((0, internal_1.normalizeList)(inputData).map(function (data) { return build(data); })); };
        var pickForConnect = function (inputData) { return ({
            id: inputData.id
        }); };
        var create = function () {
            var args_1 = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args_1[_i] = arguments[_i];
            }
            return __awaiter(_this, __spreadArray([], args_1, true), void 0, function (inputData) {
                var data;
                if (inputData === void 0) { inputData = {}; }
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, build(inputData).then(screen)];
                        case 1:
                            data = _a.sent();
                            return [4 /*yield*/, (0, internal_1.getClient)().page.create({ data: data })];
                        case 2: return [2 /*return*/, _a.sent()];
                    }
                });
            });
        };
        var createList = function (inputData) { return Promise.all((0, internal_1.normalizeList)(inputData).map(function (data) { return create(data); })); };
        var createForConnect = function (inputData) {
            if (inputData === void 0) { inputData = {}; }
            return create(inputData).then(pickForConnect);
        };
        return {
            _factoryFor: "Page",
            build: build,
            buildList: buildList,
            buildCreateInput: build,
            pickForConnect: pickForConnect,
            create: create,
            createList: createList,
            createForConnect: createForConnect,
        };
    };
    var factory = getFactoryWithTraits();
    var useTraits = function (name) {
        var names = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            names[_i - 1] = arguments[_i];
        }
        return getFactoryWithTraits(__spreadArray([name], names, true));
    };
    return __assign(__assign({}, factory), { use: useTraits });
}
/**
 * Define factory for {@link Page} model.
 *
 * @param options
 * @returns factory {@link PageFactoryInterface}
 */
function definePageFactory(options) {
    return definePageFactoryInternal(options !== null && options !== void 0 ? options : {});
}
exports.definePageFactory = definePageFactory;
function isTaggedPagespageFactory(x) {
    return (x === null || x === void 0 ? void 0 : x._factoryFor) === "Page";
}
function isTaggedPagestagFactory(x) {
    return (x === null || x === void 0 ? void 0 : x._factoryFor) === "Tag";
}
function autoGenerateTaggedPagesScalarsOrEnums(_a) {
    var seq = _a.seq;
    return {};
}
function defineTaggedPagesFactoryInternal(_a) {
    var _this = this;
    var defaultDataResolver = _a.defaultData, _b = _a.traits, traitsDefs = _b === void 0 ? {} : _b;
    var getFactoryWithTraits = function (traitKeys) {
        if (traitKeys === void 0) { traitKeys = []; }
        var seqKey = {};
        var getSeq = function () { return (0, internal_1.getSequenceCounter)(seqKey); };
        var screen = (0, internal_1.createScreener)("TaggedPages", modelFieldDefinitions);
        var build = function () {
            var args_1 = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args_1[_i] = arguments[_i];
            }
            return __awaiter(_this, __spreadArray([], args_1, true), void 0, function (inputData) {
                var seq, requiredScalarData, resolveValue, defaultData, defaultAssociations, _a, _b, data;
                var _c, _d, _e;
                var _this = this;
                if (inputData === void 0) { inputData = {}; }
                return __generator(this, function (_f) {
                    switch (_f.label) {
                        case 0:
                            seq = getSeq();
                            requiredScalarData = autoGenerateTaggedPagesScalarsOrEnums({ seq: seq });
                            resolveValue = (0, internal_1.normalizeResolver)(defaultDataResolver !== null && defaultDataResolver !== void 0 ? defaultDataResolver : {});
                            return [4 /*yield*/, traitKeys.reduce(function (queue, traitKey) { return __awaiter(_this, void 0, void 0, function () {
                                    var acc, resolveTraitValue, traitData;
                                    var _a, _b;
                                    return __generator(this, function (_c) {
                                        switch (_c.label) {
                                            case 0: return [4 /*yield*/, queue];
                                            case 1:
                                                acc = _c.sent();
                                                resolveTraitValue = (0, internal_1.normalizeResolver)((_b = (_a = traitsDefs[traitKey]) === null || _a === void 0 ? void 0 : _a.data) !== null && _b !== void 0 ? _b : {});
                                                return [4 /*yield*/, resolveTraitValue({ seq: seq })];
                                            case 2:
                                                traitData = _c.sent();
                                                return [2 /*return*/, __assign(__assign({}, acc), traitData)];
                                        }
                                    });
                                }); }, resolveValue({ seq: seq }))];
                        case 1:
                            defaultData = _f.sent();
                            _c = {};
                            if (!isTaggedPagespageFactory(defaultData.page)) return [3 /*break*/, 3];
                            _d = {};
                            return [4 /*yield*/, defaultData.page.build()];
                        case 2:
                            _a = (_d.create = _f.sent(),
                                _d);
                            return [3 /*break*/, 4];
                        case 3:
                            _a = defaultData.page;
                            _f.label = 4;
                        case 4:
                            _c.page = _a;
                            if (!isTaggedPagestagFactory(defaultData.tag)) return [3 /*break*/, 6];
                            _e = {};
                            return [4 /*yield*/, defaultData.tag.build()];
                        case 5:
                            _b = (_e.create = _f.sent(),
                                _e);
                            return [3 /*break*/, 7];
                        case 6:
                            _b = defaultData.tag;
                            _f.label = 7;
                        case 7:
                            defaultAssociations = (_c.tag = _b,
                                _c);
                            data = __assign(__assign(__assign(__assign({}, requiredScalarData), defaultData), defaultAssociations), inputData);
                            return [2 /*return*/, data];
                    }
                });
            });
        };
        var buildList = function (inputData) { return Promise.all((0, internal_1.normalizeList)(inputData).map(function (data) { return build(data); })); };
        var pickForConnect = function (inputData) { return ({
            pageId: inputData.pageId,
            tagId: inputData.tagId
        }); };
        var create = function () {
            var args_1 = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args_1[_i] = arguments[_i];
            }
            return __awaiter(_this, __spreadArray([], args_1, true), void 0, function (inputData) {
                var data;
                if (inputData === void 0) { inputData = {}; }
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, build(inputData).then(screen)];
                        case 1:
                            data = _a.sent();
                            return [4 /*yield*/, (0, internal_1.getClient)().taggedPages.create({ data: data })];
                        case 2: return [2 /*return*/, _a.sent()];
                    }
                });
            });
        };
        var createList = function (inputData) { return Promise.all((0, internal_1.normalizeList)(inputData).map(function (data) { return create(data); })); };
        var createForConnect = function (inputData) {
            if (inputData === void 0) { inputData = {}; }
            return create(inputData).then(pickForConnect);
        };
        return {
            _factoryFor: "TaggedPages",
            build: build,
            buildList: buildList,
            buildCreateInput: build,
            pickForConnect: pickForConnect,
            create: create,
            createList: createList,
            createForConnect: createForConnect,
        };
    };
    var factory = getFactoryWithTraits();
    var useTraits = function (name) {
        var names = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            names[_i - 1] = arguments[_i];
        }
        return getFactoryWithTraits(__spreadArray([name], names, true));
    };
    return __assign(__assign({}, factory), { use: useTraits });
}
/**
 * Define factory for {@link TaggedPages} model.
 *
 * @param options
 * @returns factory {@link TaggedPagesFactoryInterface}
 */
function defineTaggedPagesFactory(options) {
    return defineTaggedPagesFactoryInternal(options);
}
exports.defineTaggedPagesFactory = defineTaggedPagesFactory;
function isPaymentMethodimageFactory(x) {
    return (x === null || x === void 0 ? void 0 : x._factoryFor) === "Image";
}
function autoGeneratePaymentMethodScalarsOrEnums(_a) {
    var seq = _a.seq;
    return {
        name: (0, internal_1.getScalarFieldValueGenerator)().String({ modelName: "PaymentMethod", fieldName: "name", isId: false, isUnique: false, seq: seq }),
        slug: (0, internal_1.getScalarFieldValueGenerator)().String({ modelName: "PaymentMethod", fieldName: "slug", isId: false, isUnique: false, seq: seq }),
        description: (0, internal_1.getScalarFieldValueGenerator)().String({ modelName: "PaymentMethod", fieldName: "description", isId: false, isUnique: false, seq: seq }),
        paymentProviderID: (0, internal_1.getScalarFieldValueGenerator)().String({ modelName: "PaymentMethod", fieldName: "paymentProviderID", isId: false, isUnique: false, seq: seq }),
        active: (0, internal_1.getScalarFieldValueGenerator)().Boolean({ modelName: "PaymentMethod", fieldName: "active", isId: false, isUnique: false, seq: seq })
    };
}
function definePaymentMethodFactoryInternal(_a) {
    var _this = this;
    var defaultDataResolver = _a.defaultData, _b = _a.traits, traitsDefs = _b === void 0 ? {} : _b;
    var getFactoryWithTraits = function (traitKeys) {
        if (traitKeys === void 0) { traitKeys = []; }
        var seqKey = {};
        var getSeq = function () { return (0, internal_1.getSequenceCounter)(seqKey); };
        var screen = (0, internal_1.createScreener)("PaymentMethod", modelFieldDefinitions);
        var build = function () {
            var args_1 = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args_1[_i] = arguments[_i];
            }
            return __awaiter(_this, __spreadArray([], args_1, true), void 0, function (inputData) {
                var seq, requiredScalarData, resolveValue, defaultData, defaultAssociations, _a, data;
                var _b, _c;
                var _this = this;
                if (inputData === void 0) { inputData = {}; }
                return __generator(this, function (_d) {
                    switch (_d.label) {
                        case 0:
                            seq = getSeq();
                            requiredScalarData = autoGeneratePaymentMethodScalarsOrEnums({ seq: seq });
                            resolveValue = (0, internal_1.normalizeResolver)(defaultDataResolver !== null && defaultDataResolver !== void 0 ? defaultDataResolver : {});
                            return [4 /*yield*/, traitKeys.reduce(function (queue, traitKey) { return __awaiter(_this, void 0, void 0, function () {
                                    var acc, resolveTraitValue, traitData;
                                    var _a, _b;
                                    return __generator(this, function (_c) {
                                        switch (_c.label) {
                                            case 0: return [4 /*yield*/, queue];
                                            case 1:
                                                acc = _c.sent();
                                                resolveTraitValue = (0, internal_1.normalizeResolver)((_b = (_a = traitsDefs[traitKey]) === null || _a === void 0 ? void 0 : _a.data) !== null && _b !== void 0 ? _b : {});
                                                return [4 /*yield*/, resolveTraitValue({ seq: seq })];
                                            case 2:
                                                traitData = _c.sent();
                                                return [2 /*return*/, __assign(__assign({}, acc), traitData)];
                                        }
                                    });
                                }); }, resolveValue({ seq: seq }))];
                        case 1:
                            defaultData = _d.sent();
                            _b = {};
                            if (!isPaymentMethodimageFactory(defaultData.image)) return [3 /*break*/, 3];
                            _c = {};
                            return [4 /*yield*/, defaultData.image.build()];
                        case 2:
                            _a = (_c.create = _d.sent(),
                                _c);
                            return [3 /*break*/, 4];
                        case 3:
                            _a = defaultData.image;
                            _d.label = 4;
                        case 4:
                            defaultAssociations = (_b.image = _a,
                                _b);
                            data = __assign(__assign(__assign(__assign({}, requiredScalarData), defaultData), defaultAssociations), inputData);
                            return [2 /*return*/, data];
                    }
                });
            });
        };
        var buildList = function (inputData) { return Promise.all((0, internal_1.normalizeList)(inputData).map(function (data) { return build(data); })); };
        var pickForConnect = function (inputData) { return ({
            id: inputData.id
        }); };
        var create = function () {
            var args_1 = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args_1[_i] = arguments[_i];
            }
            return __awaiter(_this, __spreadArray([], args_1, true), void 0, function (inputData) {
                var data;
                if (inputData === void 0) { inputData = {}; }
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, build(inputData).then(screen)];
                        case 1:
                            data = _a.sent();
                            return [4 /*yield*/, (0, internal_1.getClient)().paymentMethod.create({ data: data })];
                        case 2: return [2 /*return*/, _a.sent()];
                    }
                });
            });
        };
        var createList = function (inputData) { return Promise.all((0, internal_1.normalizeList)(inputData).map(function (data) { return create(data); })); };
        var createForConnect = function (inputData) {
            if (inputData === void 0) { inputData = {}; }
            return create(inputData).then(pickForConnect);
        };
        return {
            _factoryFor: "PaymentMethod",
            build: build,
            buildList: buildList,
            buildCreateInput: build,
            pickForConnect: pickForConnect,
            create: create,
            createList: createList,
            createForConnect: createForConnect,
        };
    };
    var factory = getFactoryWithTraits();
    var useTraits = function (name) {
        var names = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            names[_i - 1] = arguments[_i];
        }
        return getFactoryWithTraits(__spreadArray([name], names, true));
    };
    return __assign(__assign({}, factory), { use: useTraits });
}
/**
 * Define factory for {@link PaymentMethod} model.
 *
 * @param options
 * @returns factory {@link PaymentMethodFactoryInterface}
 */
function definePaymentMethodFactory(options) {
    return definePaymentMethodFactoryInternal(options !== null && options !== void 0 ? options : {});
}
exports.definePaymentMethodFactory = definePaymentMethodFactory;
function isPaymentpaymentMethodFactory(x) {
    return (x === null || x === void 0 ? void 0 : x._factoryFor) === "PaymentMethod";
}
function autoGeneratePaymentScalarsOrEnums(_a) {
    var seq = _a.seq;
    return {
        invoiceID: (0, internal_1.getScalarFieldValueGenerator)().String({ modelName: "Payment", fieldName: "invoiceID", isId: false, isUnique: false, seq: seq }),
        state: "created"
    };
}
function definePaymentFactoryInternal(_a) {
    var _this = this;
    var defaultDataResolver = _a.defaultData, _b = _a.traits, traitsDefs = _b === void 0 ? {} : _b;
    var getFactoryWithTraits = function (traitKeys) {
        if (traitKeys === void 0) { traitKeys = []; }
        var seqKey = {};
        var getSeq = function () { return (0, internal_1.getSequenceCounter)(seqKey); };
        var screen = (0, internal_1.createScreener)("Payment", modelFieldDefinitions);
        var build = function () {
            var args_1 = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args_1[_i] = arguments[_i];
            }
            return __awaiter(_this, __spreadArray([], args_1, true), void 0, function (inputData) {
                var seq, requiredScalarData, resolveValue, defaultData, defaultAssociations, _a, data;
                var _b, _c;
                var _this = this;
                if (inputData === void 0) { inputData = {}; }
                return __generator(this, function (_d) {
                    switch (_d.label) {
                        case 0:
                            seq = getSeq();
                            requiredScalarData = autoGeneratePaymentScalarsOrEnums({ seq: seq });
                            resolveValue = (0, internal_1.normalizeResolver)(defaultDataResolver !== null && defaultDataResolver !== void 0 ? defaultDataResolver : {});
                            return [4 /*yield*/, traitKeys.reduce(function (queue, traitKey) { return __awaiter(_this, void 0, void 0, function () {
                                    var acc, resolveTraitValue, traitData;
                                    var _a, _b;
                                    return __generator(this, function (_c) {
                                        switch (_c.label) {
                                            case 0: return [4 /*yield*/, queue];
                                            case 1:
                                                acc = _c.sent();
                                                resolveTraitValue = (0, internal_1.normalizeResolver)((_b = (_a = traitsDefs[traitKey]) === null || _a === void 0 ? void 0 : _a.data) !== null && _b !== void 0 ? _b : {});
                                                return [4 /*yield*/, resolveTraitValue({ seq: seq })];
                                            case 2:
                                                traitData = _c.sent();
                                                return [2 /*return*/, __assign(__assign({}, acc), traitData)];
                                        }
                                    });
                                }); }, resolveValue({ seq: seq }))];
                        case 1:
                            defaultData = _d.sent();
                            _b = {};
                            if (!isPaymentpaymentMethodFactory(defaultData.paymentMethod)) return [3 /*break*/, 3];
                            _c = {};
                            return [4 /*yield*/, defaultData.paymentMethod.build()];
                        case 2:
                            _a = (_c.create = _d.sent(),
                                _c);
                            return [3 /*break*/, 4];
                        case 3:
                            _a = defaultData.paymentMethod;
                            _d.label = 4;
                        case 4:
                            defaultAssociations = (_b.paymentMethod = _a,
                                _b);
                            data = __assign(__assign(__assign(__assign({}, requiredScalarData), defaultData), defaultAssociations), inputData);
                            return [2 /*return*/, data];
                    }
                });
            });
        };
        var buildList = function (inputData) { return Promise.all((0, internal_1.normalizeList)(inputData).map(function (data) { return build(data); })); };
        var pickForConnect = function (inputData) { return ({
            id: inputData.id
        }); };
        var create = function () {
            var args_1 = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args_1[_i] = arguments[_i];
            }
            return __awaiter(_this, __spreadArray([], args_1, true), void 0, function (inputData) {
                var data;
                if (inputData === void 0) { inputData = {}; }
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, build(inputData).then(screen)];
                        case 1:
                            data = _a.sent();
                            return [4 /*yield*/, (0, internal_1.getClient)().payment.create({ data: data })];
                        case 2: return [2 /*return*/, _a.sent()];
                    }
                });
            });
        };
        var createList = function (inputData) { return Promise.all((0, internal_1.normalizeList)(inputData).map(function (data) { return create(data); })); };
        var createForConnect = function (inputData) {
            if (inputData === void 0) { inputData = {}; }
            return create(inputData).then(pickForConnect);
        };
        return {
            _factoryFor: "Payment",
            build: build,
            buildList: buildList,
            buildCreateInput: build,
            pickForConnect: pickForConnect,
            create: create,
            createList: createList,
            createForConnect: createForConnect,
        };
    };
    var factory = getFactoryWithTraits();
    var useTraits = function (name) {
        var names = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            names[_i - 1] = arguments[_i];
        }
        return getFactoryWithTraits(__spreadArray([name], names, true));
    };
    return __assign(__assign({}, factory), { use: useTraits });
}
/**
 * Define factory for {@link Payment} model.
 *
 * @param options
 * @returns factory {@link PaymentFactoryInterface}
 */
function definePaymentFactory(options) {
    return definePaymentFactoryInternal(options);
}
exports.definePaymentFactory = definePaymentFactory;
function isPeerProfilelogoFactory(x) {
    return (x === null || x === void 0 ? void 0 : x._factoryFor) === "Image";
}
function autoGeneratePeerProfileScalarsOrEnums(_a) {
    var seq = _a.seq;
    return {
        name: (0, internal_1.getScalarFieldValueGenerator)().String({ modelName: "PeerProfile", fieldName: "name", isId: false, isUnique: false, seq: seq }),
        themeColor: (0, internal_1.getScalarFieldValueGenerator)().String({ modelName: "PeerProfile", fieldName: "themeColor", isId: false, isUnique: false, seq: seq }),
        themeFontColor: (0, internal_1.getScalarFieldValueGenerator)().String({ modelName: "PeerProfile", fieldName: "themeFontColor", isId: false, isUnique: false, seq: seq }),
        callToActionURL: (0, internal_1.getScalarFieldValueGenerator)().String({ modelName: "PeerProfile", fieldName: "callToActionURL", isId: false, isUnique: false, seq: seq }),
        callToActionText: (0, internal_1.getScalarFieldValueGenerator)().Json({ modelName: "PeerProfile", fieldName: "callToActionText", isId: false, isUnique: false, seq: seq })
    };
}
function definePeerProfileFactoryInternal(_a) {
    var _this = this;
    var defaultDataResolver = _a.defaultData, _b = _a.traits, traitsDefs = _b === void 0 ? {} : _b;
    var getFactoryWithTraits = function (traitKeys) {
        if (traitKeys === void 0) { traitKeys = []; }
        var seqKey = {};
        var getSeq = function () { return (0, internal_1.getSequenceCounter)(seqKey); };
        var screen = (0, internal_1.createScreener)("PeerProfile", modelFieldDefinitions);
        var build = function () {
            var args_1 = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args_1[_i] = arguments[_i];
            }
            return __awaiter(_this, __spreadArray([], args_1, true), void 0, function (inputData) {
                var seq, requiredScalarData, resolveValue, defaultData, defaultAssociations, _a, data;
                var _b, _c;
                var _this = this;
                if (inputData === void 0) { inputData = {}; }
                return __generator(this, function (_d) {
                    switch (_d.label) {
                        case 0:
                            seq = getSeq();
                            requiredScalarData = autoGeneratePeerProfileScalarsOrEnums({ seq: seq });
                            resolveValue = (0, internal_1.normalizeResolver)(defaultDataResolver !== null && defaultDataResolver !== void 0 ? defaultDataResolver : {});
                            return [4 /*yield*/, traitKeys.reduce(function (queue, traitKey) { return __awaiter(_this, void 0, void 0, function () {
                                    var acc, resolveTraitValue, traitData;
                                    var _a, _b;
                                    return __generator(this, function (_c) {
                                        switch (_c.label) {
                                            case 0: return [4 /*yield*/, queue];
                                            case 1:
                                                acc = _c.sent();
                                                resolveTraitValue = (0, internal_1.normalizeResolver)((_b = (_a = traitsDefs[traitKey]) === null || _a === void 0 ? void 0 : _a.data) !== null && _b !== void 0 ? _b : {});
                                                return [4 /*yield*/, resolveTraitValue({ seq: seq })];
                                            case 2:
                                                traitData = _c.sent();
                                                return [2 /*return*/, __assign(__assign({}, acc), traitData)];
                                        }
                                    });
                                }); }, resolveValue({ seq: seq }))];
                        case 1:
                            defaultData = _d.sent();
                            _b = {};
                            if (!isPeerProfilelogoFactory(defaultData.logo)) return [3 /*break*/, 3];
                            _c = {};
                            return [4 /*yield*/, defaultData.logo.build()];
                        case 2:
                            _a = (_c.create = _d.sent(),
                                _c);
                            return [3 /*break*/, 4];
                        case 3:
                            _a = defaultData.logo;
                            _d.label = 4;
                        case 4:
                            defaultAssociations = (_b.logo = _a,
                                _b);
                            data = __assign(__assign(__assign(__assign({}, requiredScalarData), defaultData), defaultAssociations), inputData);
                            return [2 /*return*/, data];
                    }
                });
            });
        };
        var buildList = function (inputData) { return Promise.all((0, internal_1.normalizeList)(inputData).map(function (data) { return build(data); })); };
        var pickForConnect = function (inputData) { return ({
            id: inputData.id
        }); };
        var create = function () {
            var args_1 = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args_1[_i] = arguments[_i];
            }
            return __awaiter(_this, __spreadArray([], args_1, true), void 0, function (inputData) {
                var data;
                if (inputData === void 0) { inputData = {}; }
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, build(inputData).then(screen)];
                        case 1:
                            data = _a.sent();
                            return [4 /*yield*/, (0, internal_1.getClient)().peerProfile.create({ data: data })];
                        case 2: return [2 /*return*/, _a.sent()];
                    }
                });
            });
        };
        var createList = function (inputData) { return Promise.all((0, internal_1.normalizeList)(inputData).map(function (data) { return create(data); })); };
        var createForConnect = function (inputData) {
            if (inputData === void 0) { inputData = {}; }
            return create(inputData).then(pickForConnect);
        };
        return {
            _factoryFor: "PeerProfile",
            build: build,
            buildList: buildList,
            buildCreateInput: build,
            pickForConnect: pickForConnect,
            create: create,
            createList: createList,
            createForConnect: createForConnect,
        };
    };
    var factory = getFactoryWithTraits();
    var useTraits = function (name) {
        var names = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            names[_i - 1] = arguments[_i];
        }
        return getFactoryWithTraits(__spreadArray([name], names, true));
    };
    return __assign(__assign({}, factory), { use: useTraits });
}
/**
 * Define factory for {@link PeerProfile} model.
 *
 * @param options
 * @returns factory {@link PeerProfileFactoryInterface}
 */
function definePeerProfileFactory(options) {
    return definePeerProfileFactoryInternal(options !== null && options !== void 0 ? options : {});
}
exports.definePeerProfileFactory = definePeerProfileFactory;
function autoGeneratePeerScalarsOrEnums(_a) {
    var seq = _a.seq;
    return {
        name: (0, internal_1.getScalarFieldValueGenerator)().String({ modelName: "Peer", fieldName: "name", isId: false, isUnique: false, seq: seq }),
        slug: (0, internal_1.getScalarFieldValueGenerator)().String({ modelName: "Peer", fieldName: "slug", isId: false, isUnique: true, seq: seq }),
        hostURL: (0, internal_1.getScalarFieldValueGenerator)().String({ modelName: "Peer", fieldName: "hostURL", isId: false, isUnique: false, seq: seq }),
        token: (0, internal_1.getScalarFieldValueGenerator)().String({ modelName: "Peer", fieldName: "token", isId: false, isUnique: false, seq: seq })
    };
}
function definePeerFactoryInternal(_a) {
    var _this = this;
    var defaultDataResolver = _a.defaultData, _b = _a.traits, traitsDefs = _b === void 0 ? {} : _b;
    var getFactoryWithTraits = function (traitKeys) {
        if (traitKeys === void 0) { traitKeys = []; }
        var seqKey = {};
        var getSeq = function () { return (0, internal_1.getSequenceCounter)(seqKey); };
        var screen = (0, internal_1.createScreener)("Peer", modelFieldDefinitions);
        var build = function () {
            var args_1 = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args_1[_i] = arguments[_i];
            }
            return __awaiter(_this, __spreadArray([], args_1, true), void 0, function (inputData) {
                var seq, requiredScalarData, resolveValue, defaultData, defaultAssociations, data;
                var _this = this;
                if (inputData === void 0) { inputData = {}; }
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            seq = getSeq();
                            requiredScalarData = autoGeneratePeerScalarsOrEnums({ seq: seq });
                            resolveValue = (0, internal_1.normalizeResolver)(defaultDataResolver !== null && defaultDataResolver !== void 0 ? defaultDataResolver : {});
                            return [4 /*yield*/, traitKeys.reduce(function (queue, traitKey) { return __awaiter(_this, void 0, void 0, function () {
                                    var acc, resolveTraitValue, traitData;
                                    var _a, _b;
                                    return __generator(this, function (_c) {
                                        switch (_c.label) {
                                            case 0: return [4 /*yield*/, queue];
                                            case 1:
                                                acc = _c.sent();
                                                resolveTraitValue = (0, internal_1.normalizeResolver)((_b = (_a = traitsDefs[traitKey]) === null || _a === void 0 ? void 0 : _a.data) !== null && _b !== void 0 ? _b : {});
                                                return [4 /*yield*/, resolveTraitValue({ seq: seq })];
                                            case 2:
                                                traitData = _c.sent();
                                                return [2 /*return*/, __assign(__assign({}, acc), traitData)];
                                        }
                                    });
                                }); }, resolveValue({ seq: seq }))];
                        case 1:
                            defaultData = _a.sent();
                            defaultAssociations = {};
                            data = __assign(__assign(__assign(__assign({}, requiredScalarData), defaultData), defaultAssociations), inputData);
                            return [2 /*return*/, data];
                    }
                });
            });
        };
        var buildList = function (inputData) { return Promise.all((0, internal_1.normalizeList)(inputData).map(function (data) { return build(data); })); };
        var pickForConnect = function (inputData) { return ({
            id: inputData.id
        }); };
        var create = function () {
            var args_1 = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args_1[_i] = arguments[_i];
            }
            return __awaiter(_this, __spreadArray([], args_1, true), void 0, function (inputData) {
                var data;
                if (inputData === void 0) { inputData = {}; }
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, build(inputData).then(screen)];
                        case 1:
                            data = _a.sent();
                            return [4 /*yield*/, (0, internal_1.getClient)().peer.create({ data: data })];
                        case 2: return [2 /*return*/, _a.sent()];
                    }
                });
            });
        };
        var createList = function (inputData) { return Promise.all((0, internal_1.normalizeList)(inputData).map(function (data) { return create(data); })); };
        var createForConnect = function (inputData) {
            if (inputData === void 0) { inputData = {}; }
            return create(inputData).then(pickForConnect);
        };
        return {
            _factoryFor: "Peer",
            build: build,
            buildList: buildList,
            buildCreateInput: build,
            pickForConnect: pickForConnect,
            create: create,
            createList: createList,
            createForConnect: createForConnect,
        };
    };
    var factory = getFactoryWithTraits();
    var useTraits = function (name) {
        var names = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            names[_i - 1] = arguments[_i];
        }
        return getFactoryWithTraits(__spreadArray([name], names, true));
    };
    return __assign(__assign({}, factory), { use: useTraits });
}
/**
 * Define factory for {@link Peer} model.
 *
 * @param options
 * @returns factory {@link PeerFactoryInterface}
 */
function definePeerFactory(options) {
    return definePeerFactoryInternal(options !== null && options !== void 0 ? options : {});
}
exports.definePeerFactory = definePeerFactory;
function autoGenerateTokenScalarsOrEnums(_a) {
    var seq = _a.seq;
    return {
        name: (0, internal_1.getScalarFieldValueGenerator)().String({ modelName: "Token", fieldName: "name", isId: false, isUnique: true, seq: seq }),
        token: (0, internal_1.getScalarFieldValueGenerator)().String({ modelName: "Token", fieldName: "token", isId: false, isUnique: false, seq: seq })
    };
}
function defineTokenFactoryInternal(_a) {
    var _this = this;
    var defaultDataResolver = _a.defaultData, _b = _a.traits, traitsDefs = _b === void 0 ? {} : _b;
    var getFactoryWithTraits = function (traitKeys) {
        if (traitKeys === void 0) { traitKeys = []; }
        var seqKey = {};
        var getSeq = function () { return (0, internal_1.getSequenceCounter)(seqKey); };
        var screen = (0, internal_1.createScreener)("Token", modelFieldDefinitions);
        var build = function () {
            var args_1 = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args_1[_i] = arguments[_i];
            }
            return __awaiter(_this, __spreadArray([], args_1, true), void 0, function (inputData) {
                var seq, requiredScalarData, resolveValue, defaultData, defaultAssociations, data;
                var _this = this;
                if (inputData === void 0) { inputData = {}; }
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            seq = getSeq();
                            requiredScalarData = autoGenerateTokenScalarsOrEnums({ seq: seq });
                            resolveValue = (0, internal_1.normalizeResolver)(defaultDataResolver !== null && defaultDataResolver !== void 0 ? defaultDataResolver : {});
                            return [4 /*yield*/, traitKeys.reduce(function (queue, traitKey) { return __awaiter(_this, void 0, void 0, function () {
                                    var acc, resolveTraitValue, traitData;
                                    var _a, _b;
                                    return __generator(this, function (_c) {
                                        switch (_c.label) {
                                            case 0: return [4 /*yield*/, queue];
                                            case 1:
                                                acc = _c.sent();
                                                resolveTraitValue = (0, internal_1.normalizeResolver)((_b = (_a = traitsDefs[traitKey]) === null || _a === void 0 ? void 0 : _a.data) !== null && _b !== void 0 ? _b : {});
                                                return [4 /*yield*/, resolveTraitValue({ seq: seq })];
                                            case 2:
                                                traitData = _c.sent();
                                                return [2 /*return*/, __assign(__assign({}, acc), traitData)];
                                        }
                                    });
                                }); }, resolveValue({ seq: seq }))];
                        case 1:
                            defaultData = _a.sent();
                            defaultAssociations = {};
                            data = __assign(__assign(__assign(__assign({}, requiredScalarData), defaultData), defaultAssociations), inputData);
                            return [2 /*return*/, data];
                    }
                });
            });
        };
        var buildList = function (inputData) { return Promise.all((0, internal_1.normalizeList)(inputData).map(function (data) { return build(data); })); };
        var pickForConnect = function (inputData) { return ({
            id: inputData.id
        }); };
        var create = function () {
            var args_1 = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args_1[_i] = arguments[_i];
            }
            return __awaiter(_this, __spreadArray([], args_1, true), void 0, function (inputData) {
                var data;
                if (inputData === void 0) { inputData = {}; }
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, build(inputData).then(screen)];
                        case 1:
                            data = _a.sent();
                            return [4 /*yield*/, (0, internal_1.getClient)().token.create({ data: data })];
                        case 2: return [2 /*return*/, _a.sent()];
                    }
                });
            });
        };
        var createList = function (inputData) { return Promise.all((0, internal_1.normalizeList)(inputData).map(function (data) { return create(data); })); };
        var createForConnect = function (inputData) {
            if (inputData === void 0) { inputData = {}; }
            return create(inputData).then(pickForConnect);
        };
        return {
            _factoryFor: "Token",
            build: build,
            buildList: buildList,
            buildCreateInput: build,
            pickForConnect: pickForConnect,
            create: create,
            createList: createList,
            createForConnect: createForConnect,
        };
    };
    var factory = getFactoryWithTraits();
    var useTraits = function (name) {
        var names = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            names[_i - 1] = arguments[_i];
        }
        return getFactoryWithTraits(__spreadArray([name], names, true));
    };
    return __assign(__assign({}, factory), { use: useTraits });
}
/**
 * Define factory for {@link Token} model.
 *
 * @param options
 * @returns factory {@link TokenFactoryInterface}
 */
function defineTokenFactory(options) {
    return defineTokenFactoryInternal(options !== null && options !== void 0 ? options : {});
}
exports.defineTokenFactory = defineTokenFactory;
function isSessionuserFactory(x) {
    return (x === null || x === void 0 ? void 0 : x._factoryFor) === "User";
}
function autoGenerateSessionScalarsOrEnums(_a) {
    var seq = _a.seq;
    return {
        expiresAt: (0, internal_1.getScalarFieldValueGenerator)().DateTime({ modelName: "Session", fieldName: "expiresAt", isId: false, isUnique: false, seq: seq }),
        token: (0, internal_1.getScalarFieldValueGenerator)().String({ modelName: "Session", fieldName: "token", isId: false, isUnique: true, seq: seq })
    };
}
function defineSessionFactoryInternal(_a) {
    var _this = this;
    var defaultDataResolver = _a.defaultData, _b = _a.traits, traitsDefs = _b === void 0 ? {} : _b;
    var getFactoryWithTraits = function (traitKeys) {
        if (traitKeys === void 0) { traitKeys = []; }
        var seqKey = {};
        var getSeq = function () { return (0, internal_1.getSequenceCounter)(seqKey); };
        var screen = (0, internal_1.createScreener)("Session", modelFieldDefinitions);
        var build = function () {
            var args_1 = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args_1[_i] = arguments[_i];
            }
            return __awaiter(_this, __spreadArray([], args_1, true), void 0, function (inputData) {
                var seq, requiredScalarData, resolveValue, defaultData, defaultAssociations, _a, data;
                var _b, _c;
                var _this = this;
                if (inputData === void 0) { inputData = {}; }
                return __generator(this, function (_d) {
                    switch (_d.label) {
                        case 0:
                            seq = getSeq();
                            requiredScalarData = autoGenerateSessionScalarsOrEnums({ seq: seq });
                            resolveValue = (0, internal_1.normalizeResolver)(defaultDataResolver !== null && defaultDataResolver !== void 0 ? defaultDataResolver : {});
                            return [4 /*yield*/, traitKeys.reduce(function (queue, traitKey) { return __awaiter(_this, void 0, void 0, function () {
                                    var acc, resolveTraitValue, traitData;
                                    var _a, _b;
                                    return __generator(this, function (_c) {
                                        switch (_c.label) {
                                            case 0: return [4 /*yield*/, queue];
                                            case 1:
                                                acc = _c.sent();
                                                resolveTraitValue = (0, internal_1.normalizeResolver)((_b = (_a = traitsDefs[traitKey]) === null || _a === void 0 ? void 0 : _a.data) !== null && _b !== void 0 ? _b : {});
                                                return [4 /*yield*/, resolveTraitValue({ seq: seq })];
                                            case 2:
                                                traitData = _c.sent();
                                                return [2 /*return*/, __assign(__assign({}, acc), traitData)];
                                        }
                                    });
                                }); }, resolveValue({ seq: seq }))];
                        case 1:
                            defaultData = _d.sent();
                            _b = {};
                            if (!isSessionuserFactory(defaultData.user)) return [3 /*break*/, 3];
                            _c = {};
                            return [4 /*yield*/, defaultData.user.build()];
                        case 2:
                            _a = (_c.create = _d.sent(),
                                _c);
                            return [3 /*break*/, 4];
                        case 3:
                            _a = defaultData.user;
                            _d.label = 4;
                        case 4:
                            defaultAssociations = (_b.user = _a,
                                _b);
                            data = __assign(__assign(__assign(__assign({}, requiredScalarData), defaultData), defaultAssociations), inputData);
                            return [2 /*return*/, data];
                    }
                });
            });
        };
        var buildList = function (inputData) { return Promise.all((0, internal_1.normalizeList)(inputData).map(function (data) { return build(data); })); };
        var pickForConnect = function (inputData) { return ({
            id: inputData.id
        }); };
        var create = function () {
            var args_1 = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args_1[_i] = arguments[_i];
            }
            return __awaiter(_this, __spreadArray([], args_1, true), void 0, function (inputData) {
                var data;
                if (inputData === void 0) { inputData = {}; }
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, build(inputData).then(screen)];
                        case 1:
                            data = _a.sent();
                            return [4 /*yield*/, (0, internal_1.getClient)().session.create({ data: data })];
                        case 2: return [2 /*return*/, _a.sent()];
                    }
                });
            });
        };
        var createList = function (inputData) { return Promise.all((0, internal_1.normalizeList)(inputData).map(function (data) { return create(data); })); };
        var createForConnect = function (inputData) {
            if (inputData === void 0) { inputData = {}; }
            return create(inputData).then(pickForConnect);
        };
        return {
            _factoryFor: "Session",
            build: build,
            buildList: buildList,
            buildCreateInput: build,
            pickForConnect: pickForConnect,
            create: create,
            createList: createList,
            createForConnect: createForConnect,
        };
    };
    var factory = getFactoryWithTraits();
    var useTraits = function (name) {
        var names = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            names[_i - 1] = arguments[_i];
        }
        return getFactoryWithTraits(__spreadArray([name], names, true));
    };
    return __assign(__assign({}, factory), { use: useTraits });
}
/**
 * Define factory for {@link Session} model.
 *
 * @param options
 * @returns factory {@link SessionFactoryInterface}
 */
function defineSessionFactory(options) {
    return defineSessionFactoryInternal(options);
}
exports.defineSessionFactory = defineSessionFactory;
function isSubscriptionPeriodinvoiceFactory(x) {
    return (x === null || x === void 0 ? void 0 : x._factoryFor) === "Invoice";
}
function isSubscriptionPeriodsubscriptionFactory(x) {
    return (x === null || x === void 0 ? void 0 : x._factoryFor) === "Subscription";
}
function autoGenerateSubscriptionPeriodScalarsOrEnums(_a) {
    var seq = _a.seq;
    return {
        startsAt: (0, internal_1.getScalarFieldValueGenerator)().DateTime({ modelName: "SubscriptionPeriod", fieldName: "startsAt", isId: false, isUnique: false, seq: seq }),
        endsAt: (0, internal_1.getScalarFieldValueGenerator)().DateTime({ modelName: "SubscriptionPeriod", fieldName: "endsAt", isId: false, isUnique: false, seq: seq }),
        paymentPeriodicity: "monthly",
        amount: (0, internal_1.getScalarFieldValueGenerator)().Float({ modelName: "SubscriptionPeriod", fieldName: "amount", isId: false, isUnique: false, seq: seq })
    };
}
function defineSubscriptionPeriodFactoryInternal(_a) {
    var _this = this;
    var defaultDataResolver = _a.defaultData, _b = _a.traits, traitsDefs = _b === void 0 ? {} : _b;
    var getFactoryWithTraits = function (traitKeys) {
        if (traitKeys === void 0) { traitKeys = []; }
        var seqKey = {};
        var getSeq = function () { return (0, internal_1.getSequenceCounter)(seqKey); };
        var screen = (0, internal_1.createScreener)("SubscriptionPeriod", modelFieldDefinitions);
        var build = function () {
            var args_1 = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args_1[_i] = arguments[_i];
            }
            return __awaiter(_this, __spreadArray([], args_1, true), void 0, function (inputData) {
                var seq, requiredScalarData, resolveValue, defaultData, defaultAssociations, _a, _b, data;
                var _c, _d, _e;
                var _this = this;
                if (inputData === void 0) { inputData = {}; }
                return __generator(this, function (_f) {
                    switch (_f.label) {
                        case 0:
                            seq = getSeq();
                            requiredScalarData = autoGenerateSubscriptionPeriodScalarsOrEnums({ seq: seq });
                            resolveValue = (0, internal_1.normalizeResolver)(defaultDataResolver !== null && defaultDataResolver !== void 0 ? defaultDataResolver : {});
                            return [4 /*yield*/, traitKeys.reduce(function (queue, traitKey) { return __awaiter(_this, void 0, void 0, function () {
                                    var acc, resolveTraitValue, traitData;
                                    var _a, _b;
                                    return __generator(this, function (_c) {
                                        switch (_c.label) {
                                            case 0: return [4 /*yield*/, queue];
                                            case 1:
                                                acc = _c.sent();
                                                resolveTraitValue = (0, internal_1.normalizeResolver)((_b = (_a = traitsDefs[traitKey]) === null || _a === void 0 ? void 0 : _a.data) !== null && _b !== void 0 ? _b : {});
                                                return [4 /*yield*/, resolveTraitValue({ seq: seq })];
                                            case 2:
                                                traitData = _c.sent();
                                                return [2 /*return*/, __assign(__assign({}, acc), traitData)];
                                        }
                                    });
                                }); }, resolveValue({ seq: seq }))];
                        case 1:
                            defaultData = _f.sent();
                            _c = {};
                            if (!isSubscriptionPeriodinvoiceFactory(defaultData.invoice)) return [3 /*break*/, 3];
                            _d = {};
                            return [4 /*yield*/, defaultData.invoice.build()];
                        case 2:
                            _a = (_d.create = _f.sent(),
                                _d);
                            return [3 /*break*/, 4];
                        case 3:
                            _a = defaultData.invoice;
                            _f.label = 4;
                        case 4:
                            _c.invoice = _a;
                            if (!isSubscriptionPeriodsubscriptionFactory(defaultData.subscription)) return [3 /*break*/, 6];
                            _e = {};
                            return [4 /*yield*/, defaultData.subscription.build()];
                        case 5:
                            _b = (_e.create = _f.sent(),
                                _e);
                            return [3 /*break*/, 7];
                        case 6:
                            _b = defaultData.subscription;
                            _f.label = 7;
                        case 7:
                            defaultAssociations = (_c.subscription = _b,
                                _c);
                            data = __assign(__assign(__assign(__assign({}, requiredScalarData), defaultData), defaultAssociations), inputData);
                            return [2 /*return*/, data];
                    }
                });
            });
        };
        var buildList = function (inputData) { return Promise.all((0, internal_1.normalizeList)(inputData).map(function (data) { return build(data); })); };
        var pickForConnect = function (inputData) { return ({
            id: inputData.id
        }); };
        var create = function () {
            var args_1 = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args_1[_i] = arguments[_i];
            }
            return __awaiter(_this, __spreadArray([], args_1, true), void 0, function (inputData) {
                var data;
                if (inputData === void 0) { inputData = {}; }
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, build(inputData).then(screen)];
                        case 1:
                            data = _a.sent();
                            return [4 /*yield*/, (0, internal_1.getClient)().subscriptionPeriod.create({ data: data })];
                        case 2: return [2 /*return*/, _a.sent()];
                    }
                });
            });
        };
        var createList = function (inputData) { return Promise.all((0, internal_1.normalizeList)(inputData).map(function (data) { return create(data); })); };
        var createForConnect = function (inputData) {
            if (inputData === void 0) { inputData = {}; }
            return create(inputData).then(pickForConnect);
        };
        return {
            _factoryFor: "SubscriptionPeriod",
            build: build,
            buildList: buildList,
            buildCreateInput: build,
            pickForConnect: pickForConnect,
            create: create,
            createList: createList,
            createForConnect: createForConnect,
        };
    };
    var factory = getFactoryWithTraits();
    var useTraits = function (name) {
        var names = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            names[_i - 1] = arguments[_i];
        }
        return getFactoryWithTraits(__spreadArray([name], names, true));
    };
    return __assign(__assign({}, factory), { use: useTraits });
}
/**
 * Define factory for {@link SubscriptionPeriod} model.
 *
 * @param options
 * @returns factory {@link SubscriptionPeriodFactoryInterface}
 */
function defineSubscriptionPeriodFactory(options) {
    return defineSubscriptionPeriodFactoryInternal(options);
}
exports.defineSubscriptionPeriodFactory = defineSubscriptionPeriodFactory;
function isSubscriptionDeactivationsubscriptionFactory(x) {
    return (x === null || x === void 0 ? void 0 : x._factoryFor) === "Subscription";
}
function autoGenerateSubscriptionDeactivationScalarsOrEnums(_a) {
    var seq = _a.seq;
    return {
        date: (0, internal_1.getScalarFieldValueGenerator)().DateTime({ modelName: "SubscriptionDeactivation", fieldName: "date", isId: false, isUnique: false, seq: seq }),
        reason: "none"
    };
}
function defineSubscriptionDeactivationFactoryInternal(_a) {
    var _this = this;
    var defaultDataResolver = _a.defaultData, _b = _a.traits, traitsDefs = _b === void 0 ? {} : _b;
    var getFactoryWithTraits = function (traitKeys) {
        if (traitKeys === void 0) { traitKeys = []; }
        var seqKey = {};
        var getSeq = function () { return (0, internal_1.getSequenceCounter)(seqKey); };
        var screen = (0, internal_1.createScreener)("SubscriptionDeactivation", modelFieldDefinitions);
        var build = function () {
            var args_1 = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args_1[_i] = arguments[_i];
            }
            return __awaiter(_this, __spreadArray([], args_1, true), void 0, function (inputData) {
                var seq, requiredScalarData, resolveValue, defaultData, defaultAssociations, _a, data;
                var _b, _c;
                var _this = this;
                if (inputData === void 0) { inputData = {}; }
                return __generator(this, function (_d) {
                    switch (_d.label) {
                        case 0:
                            seq = getSeq();
                            requiredScalarData = autoGenerateSubscriptionDeactivationScalarsOrEnums({ seq: seq });
                            resolveValue = (0, internal_1.normalizeResolver)(defaultDataResolver !== null && defaultDataResolver !== void 0 ? defaultDataResolver : {});
                            return [4 /*yield*/, traitKeys.reduce(function (queue, traitKey) { return __awaiter(_this, void 0, void 0, function () {
                                    var acc, resolveTraitValue, traitData;
                                    var _a, _b;
                                    return __generator(this, function (_c) {
                                        switch (_c.label) {
                                            case 0: return [4 /*yield*/, queue];
                                            case 1:
                                                acc = _c.sent();
                                                resolveTraitValue = (0, internal_1.normalizeResolver)((_b = (_a = traitsDefs[traitKey]) === null || _a === void 0 ? void 0 : _a.data) !== null && _b !== void 0 ? _b : {});
                                                return [4 /*yield*/, resolveTraitValue({ seq: seq })];
                                            case 2:
                                                traitData = _c.sent();
                                                return [2 /*return*/, __assign(__assign({}, acc), traitData)];
                                        }
                                    });
                                }); }, resolveValue({ seq: seq }))];
                        case 1:
                            defaultData = _d.sent();
                            _b = {};
                            if (!isSubscriptionDeactivationsubscriptionFactory(defaultData.subscription)) return [3 /*break*/, 3];
                            _c = {};
                            return [4 /*yield*/, defaultData.subscription.build()];
                        case 2:
                            _a = (_c.create = _d.sent(),
                                _c);
                            return [3 /*break*/, 4];
                        case 3:
                            _a = defaultData.subscription;
                            _d.label = 4;
                        case 4:
                            defaultAssociations = (_b.subscription = _a,
                                _b);
                            data = __assign(__assign(__assign(__assign({}, requiredScalarData), defaultData), defaultAssociations), inputData);
                            return [2 /*return*/, data];
                    }
                });
            });
        };
        var buildList = function (inputData) { return Promise.all((0, internal_1.normalizeList)(inputData).map(function (data) { return build(data); })); };
        var pickForConnect = function (inputData) { return ({
            id: inputData.id
        }); };
        var create = function () {
            var args_1 = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args_1[_i] = arguments[_i];
            }
            return __awaiter(_this, __spreadArray([], args_1, true), void 0, function (inputData) {
                var data;
                if (inputData === void 0) { inputData = {}; }
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, build(inputData).then(screen)];
                        case 1:
                            data = _a.sent();
                            return [4 /*yield*/, (0, internal_1.getClient)().subscriptionDeactivation.create({ data: data })];
                        case 2: return [2 /*return*/, _a.sent()];
                    }
                });
            });
        };
        var createList = function (inputData) { return Promise.all((0, internal_1.normalizeList)(inputData).map(function (data) { return create(data); })); };
        var createForConnect = function (inputData) {
            if (inputData === void 0) { inputData = {}; }
            return create(inputData).then(pickForConnect);
        };
        return {
            _factoryFor: "SubscriptionDeactivation",
            build: build,
            buildList: buildList,
            buildCreateInput: build,
            pickForConnect: pickForConnect,
            create: create,
            createList: createList,
            createForConnect: createForConnect,
        };
    };
    var factory = getFactoryWithTraits();
    var useTraits = function (name) {
        var names = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            names[_i - 1] = arguments[_i];
        }
        return getFactoryWithTraits(__spreadArray([name], names, true));
    };
    return __assign(__assign({}, factory), { use: useTraits });
}
/**
 * Define factory for {@link SubscriptionDeactivation} model.
 *
 * @param options
 * @returns factory {@link SubscriptionDeactivationFactoryInterface}
 */
function defineSubscriptionDeactivationFactory(options) {
    return defineSubscriptionDeactivationFactoryInternal(options);
}
exports.defineSubscriptionDeactivationFactory = defineSubscriptionDeactivationFactory;
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
function isSubscriptionreplacesSubscriptionFactory(x) {
    return (x === null || x === void 0 ? void 0 : x._factoryFor) === "Subscription";
}
function autoGenerateSubscriptionScalarsOrEnums(_a) {
    var seq = _a.seq;
    return {
        paymentPeriodicity: "monthly",
        monthlyAmount: (0, internal_1.getScalarFieldValueGenerator)().Float({ modelName: "Subscription", fieldName: "monthlyAmount", isId: false, isUnique: false, seq: seq }),
        autoRenew: (0, internal_1.getScalarFieldValueGenerator)().Boolean({ modelName: "Subscription", fieldName: "autoRenew", isId: false, isUnique: false, seq: seq }),
        startsAt: (0, internal_1.getScalarFieldValueGenerator)().DateTime({ modelName: "Subscription", fieldName: "startsAt", isId: false, isUnique: false, seq: seq }),
        currency: "CHF"
    };
}
function defineSubscriptionFactoryInternal(_a) {
    var _this = this;
    var defaultDataResolver = _a.defaultData, _b = _a.traits, traitsDefs = _b === void 0 ? {} : _b;
    var getFactoryWithTraits = function (traitKeys) {
        if (traitKeys === void 0) { traitKeys = []; }
        var seqKey = {};
        var getSeq = function () { return (0, internal_1.getSequenceCounter)(seqKey); };
        var screen = (0, internal_1.createScreener)("Subscription", modelFieldDefinitions);
        var build = function () {
            var args_1 = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args_1[_i] = arguments[_i];
            }
            return __awaiter(_this, __spreadArray([], args_1, true), void 0, function (inputData) {
                var seq, requiredScalarData, resolveValue, defaultData, defaultAssociations, _a, _b, _c, _d, _e, data;
                var _f, _g, _h, _j, _k, _l;
                var _this = this;
                if (inputData === void 0) { inputData = {}; }
                return __generator(this, function (_m) {
                    switch (_m.label) {
                        case 0:
                            seq = getSeq();
                            requiredScalarData = autoGenerateSubscriptionScalarsOrEnums({ seq: seq });
                            resolveValue = (0, internal_1.normalizeResolver)(defaultDataResolver !== null && defaultDataResolver !== void 0 ? defaultDataResolver : {});
                            return [4 /*yield*/, traitKeys.reduce(function (queue, traitKey) { return __awaiter(_this, void 0, void 0, function () {
                                    var acc, resolveTraitValue, traitData;
                                    var _a, _b;
                                    return __generator(this, function (_c) {
                                        switch (_c.label) {
                                            case 0: return [4 /*yield*/, queue];
                                            case 1:
                                                acc = _c.sent();
                                                resolveTraitValue = (0, internal_1.normalizeResolver)((_b = (_a = traitsDefs[traitKey]) === null || _a === void 0 ? void 0 : _a.data) !== null && _b !== void 0 ? _b : {});
                                                return [4 /*yield*/, resolveTraitValue({ seq: seq })];
                                            case 2:
                                                traitData = _c.sent();
                                                return [2 /*return*/, __assign(__assign({}, acc), traitData)];
                                        }
                                    });
                                }); }, resolveValue({ seq: seq }))];
                        case 1:
                            defaultData = _m.sent();
                            _f = {};
                            if (!isSubscriptiondeactivationFactory(defaultData.deactivation)) return [3 /*break*/, 3];
                            _g = {};
                            return [4 /*yield*/, defaultData.deactivation.build()];
                        case 2:
                            _a = (_g.create = _m.sent(),
                                _g);
                            return [3 /*break*/, 4];
                        case 3:
                            _a = defaultData.deactivation;
                            _m.label = 4;
                        case 4:
                            _f.deactivation = _a;
                            if (!isSubscriptionpaymentMethodFactory(defaultData.paymentMethod)) return [3 /*break*/, 6];
                            _h = {};
                            return [4 /*yield*/, defaultData.paymentMethod.build()];
                        case 5:
                            _b = (_h.create = _m.sent(),
                                _h);
                            return [3 /*break*/, 7];
                        case 6:
                            _b = defaultData.paymentMethod;
                            _m.label = 7;
                        case 7:
                            _f.paymentMethod = _b;
                            if (!isSubscriptionmemberPlanFactory(defaultData.memberPlan)) return [3 /*break*/, 9];
                            _j = {};
                            return [4 /*yield*/, defaultData.memberPlan.build()];
                        case 8:
                            _c = (_j.create = _m.sent(),
                                _j);
                            return [3 /*break*/, 10];
                        case 9:
                            _c = defaultData.memberPlan;
                            _m.label = 10;
                        case 10:
                            _f.memberPlan = _c;
                            if (!isSubscriptionuserFactory(defaultData.user)) return [3 /*break*/, 12];
                            _k = {};
                            return [4 /*yield*/, defaultData.user.build()];
                        case 11:
                            _d = (_k.create = _m.sent(),
                                _k);
                            return [3 /*break*/, 13];
                        case 12:
                            _d = defaultData.user;
                            _m.label = 13;
                        case 13:
                            _f.user = _d;
                            if (!isSubscriptionreplacesSubscriptionFactory(defaultData.replacesSubscription)) return [3 /*break*/, 15];
                            _l = {};
                            return [4 /*yield*/, defaultData.replacesSubscription.build()];
                        case 14:
                            _e = (_l.create = _m.sent(),
                                _l);
                            return [3 /*break*/, 16];
                        case 15:
                            _e = defaultData.replacesSubscription;
                            _m.label = 16;
                        case 16:
                            defaultAssociations = (_f.replacesSubscription = _e,
                                _f);
                            data = __assign(__assign(__assign(__assign({}, requiredScalarData), defaultData), defaultAssociations), inputData);
                            return [2 /*return*/, data];
                    }
                });
            });
        };
        var buildList = function (inputData) { return Promise.all((0, internal_1.normalizeList)(inputData).map(function (data) { return build(data); })); };
        var pickForConnect = function (inputData) { return ({
            id: inputData.id
        }); };
        var create = function () {
            var args_1 = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args_1[_i] = arguments[_i];
            }
            return __awaiter(_this, __spreadArray([], args_1, true), void 0, function (inputData) {
                var data;
                if (inputData === void 0) { inputData = {}; }
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, build(inputData).then(screen)];
                        case 1:
                            data = _a.sent();
                            return [4 /*yield*/, (0, internal_1.getClient)().subscription.create({ data: data })];
                        case 2: return [2 /*return*/, _a.sent()];
                    }
                });
            });
        };
        var createList = function (inputData) { return Promise.all((0, internal_1.normalizeList)(inputData).map(function (data) { return create(data); })); };
        var createForConnect = function (inputData) {
            if (inputData === void 0) { inputData = {}; }
            return create(inputData).then(pickForConnect);
        };
        return {
            _factoryFor: "Subscription",
            build: build,
            buildList: buildList,
            buildCreateInput: build,
            pickForConnect: pickForConnect,
            create: create,
            createList: createList,
            createForConnect: createForConnect,
        };
    };
    var factory = getFactoryWithTraits();
    var useTraits = function (name) {
        var names = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            names[_i - 1] = arguments[_i];
        }
        return getFactoryWithTraits(__spreadArray([name], names, true));
    };
    return __assign(__assign({}, factory), { use: useTraits });
}
/**
 * Define factory for {@link Subscription} model.
 *
 * @param options
 * @returns factory {@link SubscriptionFactoryInterface}
 */
function defineSubscriptionFactory(options) {
    return defineSubscriptionFactoryInternal(options);
}
exports.defineSubscriptionFactory = defineSubscriptionFactory;
function isUserAddressUserFactory(x) {
    return (x === null || x === void 0 ? void 0 : x._factoryFor) === "User";
}
function autoGenerateUserAddressScalarsOrEnums(_a) {
    var seq = _a.seq;
    return {};
}
function defineUserAddressFactoryInternal(_a) {
    var _this = this;
    var defaultDataResolver = _a.defaultData, _b = _a.traits, traitsDefs = _b === void 0 ? {} : _b;
    var getFactoryWithTraits = function (traitKeys) {
        if (traitKeys === void 0) { traitKeys = []; }
        var seqKey = {};
        var getSeq = function () { return (0, internal_1.getSequenceCounter)(seqKey); };
        var screen = (0, internal_1.createScreener)("UserAddress", modelFieldDefinitions);
        var build = function () {
            var args_1 = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args_1[_i] = arguments[_i];
            }
            return __awaiter(_this, __spreadArray([], args_1, true), void 0, function (inputData) {
                var seq, requiredScalarData, resolveValue, defaultData, defaultAssociations, _a, data;
                var _b, _c;
                var _this = this;
                if (inputData === void 0) { inputData = {}; }
                return __generator(this, function (_d) {
                    switch (_d.label) {
                        case 0:
                            seq = getSeq();
                            requiredScalarData = autoGenerateUserAddressScalarsOrEnums({ seq: seq });
                            resolveValue = (0, internal_1.normalizeResolver)(defaultDataResolver !== null && defaultDataResolver !== void 0 ? defaultDataResolver : {});
                            return [4 /*yield*/, traitKeys.reduce(function (queue, traitKey) { return __awaiter(_this, void 0, void 0, function () {
                                    var acc, resolveTraitValue, traitData;
                                    var _a, _b;
                                    return __generator(this, function (_c) {
                                        switch (_c.label) {
                                            case 0: return [4 /*yield*/, queue];
                                            case 1:
                                                acc = _c.sent();
                                                resolveTraitValue = (0, internal_1.normalizeResolver)((_b = (_a = traitsDefs[traitKey]) === null || _a === void 0 ? void 0 : _a.data) !== null && _b !== void 0 ? _b : {});
                                                return [4 /*yield*/, resolveTraitValue({ seq: seq })];
                                            case 2:
                                                traitData = _c.sent();
                                                return [2 /*return*/, __assign(__assign({}, acc), traitData)];
                                        }
                                    });
                                }); }, resolveValue({ seq: seq }))];
                        case 1:
                            defaultData = _d.sent();
                            _b = {};
                            if (!isUserAddressUserFactory(defaultData.User)) return [3 /*break*/, 3];
                            _c = {};
                            return [4 /*yield*/, defaultData.User.build()];
                        case 2:
                            _a = (_c.create = _d.sent(),
                                _c);
                            return [3 /*break*/, 4];
                        case 3:
                            _a = defaultData.User;
                            _d.label = 4;
                        case 4:
                            defaultAssociations = (_b.User = _a,
                                _b);
                            data = __assign(__assign(__assign(__assign({}, requiredScalarData), defaultData), defaultAssociations), inputData);
                            return [2 /*return*/, data];
                    }
                });
            });
        };
        var buildList = function (inputData) { return Promise.all((0, internal_1.normalizeList)(inputData).map(function (data) { return build(data); })); };
        var pickForConnect = function (inputData) { return ({
            userId: inputData.userId
        }); };
        var create = function () {
            var args_1 = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args_1[_i] = arguments[_i];
            }
            return __awaiter(_this, __spreadArray([], args_1, true), void 0, function (inputData) {
                var data;
                if (inputData === void 0) { inputData = {}; }
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, build(inputData).then(screen)];
                        case 1:
                            data = _a.sent();
                            return [4 /*yield*/, (0, internal_1.getClient)().userAddress.create({ data: data })];
                        case 2: return [2 /*return*/, _a.sent()];
                    }
                });
            });
        };
        var createList = function (inputData) { return Promise.all((0, internal_1.normalizeList)(inputData).map(function (data) { return create(data); })); };
        var createForConnect = function (inputData) {
            if (inputData === void 0) { inputData = {}; }
            return create(inputData).then(pickForConnect);
        };
        return {
            _factoryFor: "UserAddress",
            build: build,
            buildList: buildList,
            buildCreateInput: build,
            pickForConnect: pickForConnect,
            create: create,
            createList: createList,
            createForConnect: createForConnect,
        };
    };
    var factory = getFactoryWithTraits();
    var useTraits = function (name) {
        var names = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            names[_i - 1] = arguments[_i];
        }
        return getFactoryWithTraits(__spreadArray([name], names, true));
    };
    return __assign(__assign({}, factory), { use: useTraits });
}
/**
 * Define factory for {@link UserAddress} model.
 *
 * @param options
 * @returns factory {@link UserAddressFactoryInterface}
 */
function defineUserAddressFactory(options) {
    return defineUserAddressFactoryInternal(options);
}
exports.defineUserAddressFactory = defineUserAddressFactory;
function isUserOAuth2AccountUserFactory(x) {
    return (x === null || x === void 0 ? void 0 : x._factoryFor) === "User";
}
function autoGenerateUserOAuth2AccountScalarsOrEnums(_a) {
    var seq = _a.seq;
    return {
        type: (0, internal_1.getScalarFieldValueGenerator)().String({ modelName: "UserOAuth2Account", fieldName: "type", isId: false, isUnique: false, seq: seq }),
        provider: (0, internal_1.getScalarFieldValueGenerator)().String({ modelName: "UserOAuth2Account", fieldName: "provider", isId: false, isUnique: false, seq: seq }),
        providerAccountId: (0, internal_1.getScalarFieldValueGenerator)().String({ modelName: "UserOAuth2Account", fieldName: "providerAccountId", isId: false, isUnique: false, seq: seq }),
        accessToken: (0, internal_1.getScalarFieldValueGenerator)().String({ modelName: "UserOAuth2Account", fieldName: "accessToken", isId: false, isUnique: false, seq: seq }),
        expiresAt: (0, internal_1.getScalarFieldValueGenerator)().Int({ modelName: "UserOAuth2Account", fieldName: "expiresAt", isId: false, isUnique: false, seq: seq }),
        tokenType: (0, internal_1.getScalarFieldValueGenerator)().String({ modelName: "UserOAuth2Account", fieldName: "tokenType", isId: false, isUnique: false, seq: seq }),
        scope: (0, internal_1.getScalarFieldValueGenerator)().String({ modelName: "UserOAuth2Account", fieldName: "scope", isId: false, isUnique: false, seq: seq }),
        idToken: (0, internal_1.getScalarFieldValueGenerator)().String({ modelName: "UserOAuth2Account", fieldName: "idToken", isId: false, isUnique: false, seq: seq })
    };
}
function defineUserOAuth2AccountFactoryInternal(_a) {
    var _this = this;
    var defaultDataResolver = _a.defaultData, _b = _a.traits, traitsDefs = _b === void 0 ? {} : _b;
    var getFactoryWithTraits = function (traitKeys) {
        if (traitKeys === void 0) { traitKeys = []; }
        var seqKey = {};
        var getSeq = function () { return (0, internal_1.getSequenceCounter)(seqKey); };
        var screen = (0, internal_1.createScreener)("UserOAuth2Account", modelFieldDefinitions);
        var build = function () {
            var args_1 = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args_1[_i] = arguments[_i];
            }
            return __awaiter(_this, __spreadArray([], args_1, true), void 0, function (inputData) {
                var seq, requiredScalarData, resolveValue, defaultData, defaultAssociations, _a, data;
                var _b, _c;
                var _this = this;
                if (inputData === void 0) { inputData = {}; }
                return __generator(this, function (_d) {
                    switch (_d.label) {
                        case 0:
                            seq = getSeq();
                            requiredScalarData = autoGenerateUserOAuth2AccountScalarsOrEnums({ seq: seq });
                            resolveValue = (0, internal_1.normalizeResolver)(defaultDataResolver !== null && defaultDataResolver !== void 0 ? defaultDataResolver : {});
                            return [4 /*yield*/, traitKeys.reduce(function (queue, traitKey) { return __awaiter(_this, void 0, void 0, function () {
                                    var acc, resolveTraitValue, traitData;
                                    var _a, _b;
                                    return __generator(this, function (_c) {
                                        switch (_c.label) {
                                            case 0: return [4 /*yield*/, queue];
                                            case 1:
                                                acc = _c.sent();
                                                resolveTraitValue = (0, internal_1.normalizeResolver)((_b = (_a = traitsDefs[traitKey]) === null || _a === void 0 ? void 0 : _a.data) !== null && _b !== void 0 ? _b : {});
                                                return [4 /*yield*/, resolveTraitValue({ seq: seq })];
                                            case 2:
                                                traitData = _c.sent();
                                                return [2 /*return*/, __assign(__assign({}, acc), traitData)];
                                        }
                                    });
                                }); }, resolveValue({ seq: seq }))];
                        case 1:
                            defaultData = _d.sent();
                            _b = {};
                            if (!isUserOAuth2AccountUserFactory(defaultData.User)) return [3 /*break*/, 3];
                            _c = {};
                            return [4 /*yield*/, defaultData.User.build()];
                        case 2:
                            _a = (_c.create = _d.sent(),
                                _c);
                            return [3 /*break*/, 4];
                        case 3:
                            _a = defaultData.User;
                            _d.label = 4;
                        case 4:
                            defaultAssociations = (_b.User = _a,
                                _b);
                            data = __assign(__assign(__assign(__assign({}, requiredScalarData), defaultData), defaultAssociations), inputData);
                            return [2 /*return*/, data];
                    }
                });
            });
        };
        var buildList = function (inputData) { return Promise.all((0, internal_1.normalizeList)(inputData).map(function (data) { return build(data); })); };
        var pickForConnect = function (inputData) { return ({
            id: inputData.id
        }); };
        var create = function () {
            var args_1 = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args_1[_i] = arguments[_i];
            }
            return __awaiter(_this, __spreadArray([], args_1, true), void 0, function (inputData) {
                var data;
                if (inputData === void 0) { inputData = {}; }
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, build(inputData).then(screen)];
                        case 1:
                            data = _a.sent();
                            return [4 /*yield*/, (0, internal_1.getClient)().userOAuth2Account.create({ data: data })];
                        case 2: return [2 /*return*/, _a.sent()];
                    }
                });
            });
        };
        var createList = function (inputData) { return Promise.all((0, internal_1.normalizeList)(inputData).map(function (data) { return create(data); })); };
        var createForConnect = function (inputData) {
            if (inputData === void 0) { inputData = {}; }
            return create(inputData).then(pickForConnect);
        };
        return {
            _factoryFor: "UserOAuth2Account",
            build: build,
            buildList: buildList,
            buildCreateInput: build,
            pickForConnect: pickForConnect,
            create: create,
            createList: createList,
            createForConnect: createForConnect,
        };
    };
    var factory = getFactoryWithTraits();
    var useTraits = function (name) {
        var names = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            names[_i - 1] = arguments[_i];
        }
        return getFactoryWithTraits(__spreadArray([name], names, true));
    };
    return __assign(__assign({}, factory), { use: useTraits });
}
/**
 * Define factory for {@link UserOAuth2Account} model.
 *
 * @param options
 * @returns factory {@link UserOAuth2AccountFactoryInterface}
 */
function defineUserOAuth2AccountFactory(options) {
    return defineUserOAuth2AccountFactoryInternal(options !== null && options !== void 0 ? options : {});
}
exports.defineUserOAuth2AccountFactory = defineUserOAuth2AccountFactory;
function isPaymentProviderCustomerUserFactory(x) {
    return (x === null || x === void 0 ? void 0 : x._factoryFor) === "User";
}
function autoGeneratePaymentProviderCustomerScalarsOrEnums(_a) {
    var seq = _a.seq;
    return {
        paymentProviderID: (0, internal_1.getScalarFieldValueGenerator)().String({ modelName: "PaymentProviderCustomer", fieldName: "paymentProviderID", isId: false, isUnique: false, seq: seq }),
        customerID: (0, internal_1.getScalarFieldValueGenerator)().String({ modelName: "PaymentProviderCustomer", fieldName: "customerID", isId: false, isUnique: false, seq: seq })
    };
}
function definePaymentProviderCustomerFactoryInternal(_a) {
    var _this = this;
    var defaultDataResolver = _a.defaultData, _b = _a.traits, traitsDefs = _b === void 0 ? {} : _b;
    var getFactoryWithTraits = function (traitKeys) {
        if (traitKeys === void 0) { traitKeys = []; }
        var seqKey = {};
        var getSeq = function () { return (0, internal_1.getSequenceCounter)(seqKey); };
        var screen = (0, internal_1.createScreener)("PaymentProviderCustomer", modelFieldDefinitions);
        var build = function () {
            var args_1 = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args_1[_i] = arguments[_i];
            }
            return __awaiter(_this, __spreadArray([], args_1, true), void 0, function (inputData) {
                var seq, requiredScalarData, resolveValue, defaultData, defaultAssociations, _a, data;
                var _b, _c;
                var _this = this;
                if (inputData === void 0) { inputData = {}; }
                return __generator(this, function (_d) {
                    switch (_d.label) {
                        case 0:
                            seq = getSeq();
                            requiredScalarData = autoGeneratePaymentProviderCustomerScalarsOrEnums({ seq: seq });
                            resolveValue = (0, internal_1.normalizeResolver)(defaultDataResolver !== null && defaultDataResolver !== void 0 ? defaultDataResolver : {});
                            return [4 /*yield*/, traitKeys.reduce(function (queue, traitKey) { return __awaiter(_this, void 0, void 0, function () {
                                    var acc, resolveTraitValue, traitData;
                                    var _a, _b;
                                    return __generator(this, function (_c) {
                                        switch (_c.label) {
                                            case 0: return [4 /*yield*/, queue];
                                            case 1:
                                                acc = _c.sent();
                                                resolveTraitValue = (0, internal_1.normalizeResolver)((_b = (_a = traitsDefs[traitKey]) === null || _a === void 0 ? void 0 : _a.data) !== null && _b !== void 0 ? _b : {});
                                                return [4 /*yield*/, resolveTraitValue({ seq: seq })];
                                            case 2:
                                                traitData = _c.sent();
                                                return [2 /*return*/, __assign(__assign({}, acc), traitData)];
                                        }
                                    });
                                }); }, resolveValue({ seq: seq }))];
                        case 1:
                            defaultData = _d.sent();
                            _b = {};
                            if (!isPaymentProviderCustomerUserFactory(defaultData.User)) return [3 /*break*/, 3];
                            _c = {};
                            return [4 /*yield*/, defaultData.User.build()];
                        case 2:
                            _a = (_c.create = _d.sent(),
                                _c);
                            return [3 /*break*/, 4];
                        case 3:
                            _a = defaultData.User;
                            _d.label = 4;
                        case 4:
                            defaultAssociations = (_b.User = _a,
                                _b);
                            data = __assign(__assign(__assign(__assign({}, requiredScalarData), defaultData), defaultAssociations), inputData);
                            return [2 /*return*/, data];
                    }
                });
            });
        };
        var buildList = function (inputData) { return Promise.all((0, internal_1.normalizeList)(inputData).map(function (data) { return build(data); })); };
        var pickForConnect = function (inputData) { return ({
            id: inputData.id
        }); };
        var create = function () {
            var args_1 = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args_1[_i] = arguments[_i];
            }
            return __awaiter(_this, __spreadArray([], args_1, true), void 0, function (inputData) {
                var data;
                if (inputData === void 0) { inputData = {}; }
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, build(inputData).then(screen)];
                        case 1:
                            data = _a.sent();
                            return [4 /*yield*/, (0, internal_1.getClient)().paymentProviderCustomer.create({ data: data })];
                        case 2: return [2 /*return*/, _a.sent()];
                    }
                });
            });
        };
        var createList = function (inputData) { return Promise.all((0, internal_1.normalizeList)(inputData).map(function (data) { return create(data); })); };
        var createForConnect = function (inputData) {
            if (inputData === void 0) { inputData = {}; }
            return create(inputData).then(pickForConnect);
        };
        return {
            _factoryFor: "PaymentProviderCustomer",
            build: build,
            buildList: buildList,
            buildCreateInput: build,
            pickForConnect: pickForConnect,
            create: create,
            createList: createList,
            createForConnect: createForConnect,
        };
    };
    var factory = getFactoryWithTraits();
    var useTraits = function (name) {
        var names = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            names[_i - 1] = arguments[_i];
        }
        return getFactoryWithTraits(__spreadArray([name], names, true));
    };
    return __assign(__assign({}, factory), { use: useTraits });
}
/**
 * Define factory for {@link PaymentProviderCustomer} model.
 *
 * @param options
 * @returns factory {@link PaymentProviderCustomerFactoryInterface}
 */
function definePaymentProviderCustomerFactory(options) {
    return definePaymentProviderCustomerFactoryInternal(options !== null && options !== void 0 ? options : {});
}
exports.definePaymentProviderCustomerFactory = definePaymentProviderCustomerFactory;
function isUseruserImageFactory(x) {
    return (x === null || x === void 0 ? void 0 : x._factoryFor) === "Image";
}
function isUseraddressFactory(x) {
    return (x === null || x === void 0 ? void 0 : x._factoryFor) === "UserAddress";
}
function autoGenerateUserScalarsOrEnums(_a) {
    var seq = _a.seq;
    return {
        email: (0, internal_1.getScalarFieldValueGenerator)().String({ modelName: "User", fieldName: "email", isId: false, isUnique: true, seq: seq }),
        name: (0, internal_1.getScalarFieldValueGenerator)().String({ modelName: "User", fieldName: "name", isId: false, isUnique: false, seq: seq }),
        password: (0, internal_1.getScalarFieldValueGenerator)().String({ modelName: "User", fieldName: "password", isId: false, isUnique: false, seq: seq }),
        active: (0, internal_1.getScalarFieldValueGenerator)().Boolean({ modelName: "User", fieldName: "active", isId: false, isUnique: false, seq: seq })
    };
}
function defineUserFactoryInternal(_a) {
    var _this = this;
    var defaultDataResolver = _a.defaultData, _b = _a.traits, traitsDefs = _b === void 0 ? {} : _b;
    var getFactoryWithTraits = function (traitKeys) {
        if (traitKeys === void 0) { traitKeys = []; }
        var seqKey = {};
        var getSeq = function () { return (0, internal_1.getSequenceCounter)(seqKey); };
        var screen = (0, internal_1.createScreener)("User", modelFieldDefinitions);
        var build = function () {
            var args_1 = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args_1[_i] = arguments[_i];
            }
            return __awaiter(_this, __spreadArray([], args_1, true), void 0, function (inputData) {
                var seq, requiredScalarData, resolveValue, defaultData, defaultAssociations, _a, _b, data;
                var _c, _d, _e;
                var _this = this;
                if (inputData === void 0) { inputData = {}; }
                return __generator(this, function (_f) {
                    switch (_f.label) {
                        case 0:
                            seq = getSeq();
                            requiredScalarData = autoGenerateUserScalarsOrEnums({ seq: seq });
                            resolveValue = (0, internal_1.normalizeResolver)(defaultDataResolver !== null && defaultDataResolver !== void 0 ? defaultDataResolver : {});
                            return [4 /*yield*/, traitKeys.reduce(function (queue, traitKey) { return __awaiter(_this, void 0, void 0, function () {
                                    var acc, resolveTraitValue, traitData;
                                    var _a, _b;
                                    return __generator(this, function (_c) {
                                        switch (_c.label) {
                                            case 0: return [4 /*yield*/, queue];
                                            case 1:
                                                acc = _c.sent();
                                                resolveTraitValue = (0, internal_1.normalizeResolver)((_b = (_a = traitsDefs[traitKey]) === null || _a === void 0 ? void 0 : _a.data) !== null && _b !== void 0 ? _b : {});
                                                return [4 /*yield*/, resolveTraitValue({ seq: seq })];
                                            case 2:
                                                traitData = _c.sent();
                                                return [2 /*return*/, __assign(__assign({}, acc), traitData)];
                                        }
                                    });
                                }); }, resolveValue({ seq: seq }))];
                        case 1:
                            defaultData = _f.sent();
                            _c = {};
                            if (!isUseruserImageFactory(defaultData.userImage)) return [3 /*break*/, 3];
                            _d = {};
                            return [4 /*yield*/, defaultData.userImage.build()];
                        case 2:
                            _a = (_d.create = _f.sent(),
                                _d);
                            return [3 /*break*/, 4];
                        case 3:
                            _a = defaultData.userImage;
                            _f.label = 4;
                        case 4:
                            _c.userImage = _a;
                            if (!isUseraddressFactory(defaultData.address)) return [3 /*break*/, 6];
                            _e = {};
                            return [4 /*yield*/, defaultData.address.build()];
                        case 5:
                            _b = (_e.create = _f.sent(),
                                _e);
                            return [3 /*break*/, 7];
                        case 6:
                            _b = defaultData.address;
                            _f.label = 7;
                        case 7:
                            defaultAssociations = (_c.address = _b,
                                _c);
                            data = __assign(__assign(__assign(__assign({}, requiredScalarData), defaultData), defaultAssociations), inputData);
                            return [2 /*return*/, data];
                    }
                });
            });
        };
        var buildList = function (inputData) { return Promise.all((0, internal_1.normalizeList)(inputData).map(function (data) { return build(data); })); };
        var pickForConnect = function (inputData) { return ({
            id: inputData.id
        }); };
        var create = function () {
            var args_1 = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args_1[_i] = arguments[_i];
            }
            return __awaiter(_this, __spreadArray([], args_1, true), void 0, function (inputData) {
                var data;
                if (inputData === void 0) { inputData = {}; }
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, build(inputData).then(screen)];
                        case 1:
                            data = _a.sent();
                            return [4 /*yield*/, (0, internal_1.getClient)().user.create({ data: data })];
                        case 2: return [2 /*return*/, _a.sent()];
                    }
                });
            });
        };
        var createList = function (inputData) { return Promise.all((0, internal_1.normalizeList)(inputData).map(function (data) { return create(data); })); };
        var createForConnect = function (inputData) {
            if (inputData === void 0) { inputData = {}; }
            return create(inputData).then(pickForConnect);
        };
        return {
            _factoryFor: "User",
            build: build,
            buildList: buildList,
            buildCreateInput: build,
            pickForConnect: pickForConnect,
            create: create,
            createList: createList,
            createForConnect: createForConnect,
        };
    };
    var factory = getFactoryWithTraits();
    var useTraits = function (name) {
        var names = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            names[_i - 1] = arguments[_i];
        }
        return getFactoryWithTraits(__spreadArray([name], names, true));
    };
    return __assign(__assign({}, factory), { use: useTraits });
}
/**
 * Define factory for {@link User} model.
 *
 * @param options
 * @returns factory {@link UserFactoryInterface}
 */
function defineUserFactory(options) {
    return defineUserFactoryInternal(options !== null && options !== void 0 ? options : {});
}
exports.defineUserFactory = defineUserFactory;
function autoGenerateUserRoleScalarsOrEnums(_a) {
    var seq = _a.seq;
    return {
        name: (0, internal_1.getScalarFieldValueGenerator)().String({ modelName: "UserRole", fieldName: "name", isId: false, isUnique: true, seq: seq }),
        systemRole: (0, internal_1.getScalarFieldValueGenerator)().Boolean({ modelName: "UserRole", fieldName: "systemRole", isId: false, isUnique: false, seq: seq })
    };
}
function defineUserRoleFactoryInternal(_a) {
    var _this = this;
    var defaultDataResolver = _a.defaultData, _b = _a.traits, traitsDefs = _b === void 0 ? {} : _b;
    var getFactoryWithTraits = function (traitKeys) {
        if (traitKeys === void 0) { traitKeys = []; }
        var seqKey = {};
        var getSeq = function () { return (0, internal_1.getSequenceCounter)(seqKey); };
        var screen = (0, internal_1.createScreener)("UserRole", modelFieldDefinitions);
        var build = function () {
            var args_1 = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args_1[_i] = arguments[_i];
            }
            return __awaiter(_this, __spreadArray([], args_1, true), void 0, function (inputData) {
                var seq, requiredScalarData, resolveValue, defaultData, defaultAssociations, data;
                var _this = this;
                if (inputData === void 0) { inputData = {}; }
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            seq = getSeq();
                            requiredScalarData = autoGenerateUserRoleScalarsOrEnums({ seq: seq });
                            resolveValue = (0, internal_1.normalizeResolver)(defaultDataResolver !== null && defaultDataResolver !== void 0 ? defaultDataResolver : {});
                            return [4 /*yield*/, traitKeys.reduce(function (queue, traitKey) { return __awaiter(_this, void 0, void 0, function () {
                                    var acc, resolveTraitValue, traitData;
                                    var _a, _b;
                                    return __generator(this, function (_c) {
                                        switch (_c.label) {
                                            case 0: return [4 /*yield*/, queue];
                                            case 1:
                                                acc = _c.sent();
                                                resolveTraitValue = (0, internal_1.normalizeResolver)((_b = (_a = traitsDefs[traitKey]) === null || _a === void 0 ? void 0 : _a.data) !== null && _b !== void 0 ? _b : {});
                                                return [4 /*yield*/, resolveTraitValue({ seq: seq })];
                                            case 2:
                                                traitData = _c.sent();
                                                return [2 /*return*/, __assign(__assign({}, acc), traitData)];
                                        }
                                    });
                                }); }, resolveValue({ seq: seq }))];
                        case 1:
                            defaultData = _a.sent();
                            defaultAssociations = {};
                            data = __assign(__assign(__assign(__assign({}, requiredScalarData), defaultData), defaultAssociations), inputData);
                            return [2 /*return*/, data];
                    }
                });
            });
        };
        var buildList = function (inputData) { return Promise.all((0, internal_1.normalizeList)(inputData).map(function (data) { return build(data); })); };
        var pickForConnect = function (inputData) { return ({
            id: inputData.id
        }); };
        var create = function () {
            var args_1 = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args_1[_i] = arguments[_i];
            }
            return __awaiter(_this, __spreadArray([], args_1, true), void 0, function (inputData) {
                var data;
                if (inputData === void 0) { inputData = {}; }
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, build(inputData).then(screen)];
                        case 1:
                            data = _a.sent();
                            return [4 /*yield*/, (0, internal_1.getClient)().userRole.create({ data: data })];
                        case 2: return [2 /*return*/, _a.sent()];
                    }
                });
            });
        };
        var createList = function (inputData) { return Promise.all((0, internal_1.normalizeList)(inputData).map(function (data) { return create(data); })); };
        var createForConnect = function (inputData) {
            if (inputData === void 0) { inputData = {}; }
            return create(inputData).then(pickForConnect);
        };
        return {
            _factoryFor: "UserRole",
            build: build,
            buildList: buildList,
            buildCreateInput: build,
            pickForConnect: pickForConnect,
            create: create,
            createList: createList,
            createForConnect: createForConnect,
        };
    };
    var factory = getFactoryWithTraits();
    var useTraits = function (name) {
        var names = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            names[_i - 1] = arguments[_i];
        }
        return getFactoryWithTraits(__spreadArray([name], names, true));
    };
    return __assign(__assign({}, factory), { use: useTraits });
}
/**
 * Define factory for {@link UserRole} model.
 *
 * @param options
 * @returns factory {@link UserRoleFactoryInterface}
 */
function defineUserRoleFactory(options) {
    return defineUserRoleFactoryInternal(options !== null && options !== void 0 ? options : {});
}
exports.defineUserRoleFactory = defineUserRoleFactory;
function autoGenerateSettingScalarsOrEnums(_a) {
    var seq = _a.seq;
    return {
        name: (0, internal_1.getScalarFieldValueGenerator)().String({ modelName: "Setting", fieldName: "name", isId: false, isUnique: true, seq: seq }),
        value: (0, internal_1.getScalarFieldValueGenerator)().Json({ modelName: "Setting", fieldName: "value", isId: false, isUnique: false, seq: seq }),
        settingRestriction: (0, internal_1.getScalarFieldValueGenerator)().Json({ modelName: "Setting", fieldName: "settingRestriction", isId: false, isUnique: false, seq: seq })
    };
}
function defineSettingFactoryInternal(_a) {
    var _this = this;
    var defaultDataResolver = _a.defaultData, _b = _a.traits, traitsDefs = _b === void 0 ? {} : _b;
    var getFactoryWithTraits = function (traitKeys) {
        if (traitKeys === void 0) { traitKeys = []; }
        var seqKey = {};
        var getSeq = function () { return (0, internal_1.getSequenceCounter)(seqKey); };
        var screen = (0, internal_1.createScreener)("Setting", modelFieldDefinitions);
        var build = function () {
            var args_1 = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args_1[_i] = arguments[_i];
            }
            return __awaiter(_this, __spreadArray([], args_1, true), void 0, function (inputData) {
                var seq, requiredScalarData, resolveValue, defaultData, defaultAssociations, data;
                var _this = this;
                if (inputData === void 0) { inputData = {}; }
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            seq = getSeq();
                            requiredScalarData = autoGenerateSettingScalarsOrEnums({ seq: seq });
                            resolveValue = (0, internal_1.normalizeResolver)(defaultDataResolver !== null && defaultDataResolver !== void 0 ? defaultDataResolver : {});
                            return [4 /*yield*/, traitKeys.reduce(function (queue, traitKey) { return __awaiter(_this, void 0, void 0, function () {
                                    var acc, resolveTraitValue, traitData;
                                    var _a, _b;
                                    return __generator(this, function (_c) {
                                        switch (_c.label) {
                                            case 0: return [4 /*yield*/, queue];
                                            case 1:
                                                acc = _c.sent();
                                                resolveTraitValue = (0, internal_1.normalizeResolver)((_b = (_a = traitsDefs[traitKey]) === null || _a === void 0 ? void 0 : _a.data) !== null && _b !== void 0 ? _b : {});
                                                return [4 /*yield*/, resolveTraitValue({ seq: seq })];
                                            case 2:
                                                traitData = _c.sent();
                                                return [2 /*return*/, __assign(__assign({}, acc), traitData)];
                                        }
                                    });
                                }); }, resolveValue({ seq: seq }))];
                        case 1:
                            defaultData = _a.sent();
                            defaultAssociations = {};
                            data = __assign(__assign(__assign(__assign({}, requiredScalarData), defaultData), defaultAssociations), inputData);
                            return [2 /*return*/, data];
                    }
                });
            });
        };
        var buildList = function (inputData) { return Promise.all((0, internal_1.normalizeList)(inputData).map(function (data) { return build(data); })); };
        var pickForConnect = function (inputData) { return ({
            id: inputData.id
        }); };
        var create = function () {
            var args_1 = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args_1[_i] = arguments[_i];
            }
            return __awaiter(_this, __spreadArray([], args_1, true), void 0, function (inputData) {
                var data;
                if (inputData === void 0) { inputData = {}; }
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, build(inputData).then(screen)];
                        case 1:
                            data = _a.sent();
                            return [4 /*yield*/, (0, internal_1.getClient)().setting.create({ data: data })];
                        case 2: return [2 /*return*/, _a.sent()];
                    }
                });
            });
        };
        var createList = function (inputData) { return Promise.all((0, internal_1.normalizeList)(inputData).map(function (data) { return create(data); })); };
        var createForConnect = function (inputData) {
            if (inputData === void 0) { inputData = {}; }
            return create(inputData).then(pickForConnect);
        };
        return {
            _factoryFor: "Setting",
            build: build,
            buildList: buildList,
            buildCreateInput: build,
            pickForConnect: pickForConnect,
            create: create,
            createList: createList,
            createForConnect: createForConnect,
        };
    };
    var factory = getFactoryWithTraits();
    var useTraits = function (name) {
        var names = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            names[_i - 1] = arguments[_i];
        }
        return getFactoryWithTraits(__spreadArray([name], names, true));
    };
    return __assign(__assign({}, factory), { use: useTraits });
}
/**
 * Define factory for {@link Setting} model.
 *
 * @param options
 * @returns factory {@link SettingFactoryInterface}
 */
function defineSettingFactory(options) {
    return defineSettingFactoryInternal(options !== null && options !== void 0 ? options : {});
}
exports.defineSettingFactory = defineSettingFactory;
function isTagpeerFactory(x) {
    return (x === null || x === void 0 ? void 0 : x._factoryFor) === "Peer";
}
function autoGenerateTagScalarsOrEnums(_a) {
    var seq = _a.seq;
    return {
        type: "Comment"
    };
}
function defineTagFactoryInternal(_a) {
    var _this = this;
    var defaultDataResolver = _a.defaultData, _b = _a.traits, traitsDefs = _b === void 0 ? {} : _b;
    var getFactoryWithTraits = function (traitKeys) {
        if (traitKeys === void 0) { traitKeys = []; }
        var seqKey = {};
        var getSeq = function () { return (0, internal_1.getSequenceCounter)(seqKey); };
        var screen = (0, internal_1.createScreener)("Tag", modelFieldDefinitions);
        var build = function () {
            var args_1 = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args_1[_i] = arguments[_i];
            }
            return __awaiter(_this, __spreadArray([], args_1, true), void 0, function (inputData) {
                var seq, requiredScalarData, resolveValue, defaultData, defaultAssociations, _a, data;
                var _b, _c;
                var _this = this;
                if (inputData === void 0) { inputData = {}; }
                return __generator(this, function (_d) {
                    switch (_d.label) {
                        case 0:
                            seq = getSeq();
                            requiredScalarData = autoGenerateTagScalarsOrEnums({ seq: seq });
                            resolveValue = (0, internal_1.normalizeResolver)(defaultDataResolver !== null && defaultDataResolver !== void 0 ? defaultDataResolver : {});
                            return [4 /*yield*/, traitKeys.reduce(function (queue, traitKey) { return __awaiter(_this, void 0, void 0, function () {
                                    var acc, resolveTraitValue, traitData;
                                    var _a, _b;
                                    return __generator(this, function (_c) {
                                        switch (_c.label) {
                                            case 0: return [4 /*yield*/, queue];
                                            case 1:
                                                acc = _c.sent();
                                                resolveTraitValue = (0, internal_1.normalizeResolver)((_b = (_a = traitsDefs[traitKey]) === null || _a === void 0 ? void 0 : _a.data) !== null && _b !== void 0 ? _b : {});
                                                return [4 /*yield*/, resolveTraitValue({ seq: seq })];
                                            case 2:
                                                traitData = _c.sent();
                                                return [2 /*return*/, __assign(__assign({}, acc), traitData)];
                                        }
                                    });
                                }); }, resolveValue({ seq: seq }))];
                        case 1:
                            defaultData = _d.sent();
                            _b = {};
                            if (!isTagpeerFactory(defaultData.peer)) return [3 /*break*/, 3];
                            _c = {};
                            return [4 /*yield*/, defaultData.peer.build()];
                        case 2:
                            _a = (_c.create = _d.sent(),
                                _c);
                            return [3 /*break*/, 4];
                        case 3:
                            _a = defaultData.peer;
                            _d.label = 4;
                        case 4:
                            defaultAssociations = (_b.peer = _a,
                                _b);
                            data = __assign(__assign(__assign(__assign({}, requiredScalarData), defaultData), defaultAssociations), inputData);
                            return [2 /*return*/, data];
                    }
                });
            });
        };
        var buildList = function (inputData) { return Promise.all((0, internal_1.normalizeList)(inputData).map(function (data) { return build(data); })); };
        var pickForConnect = function (inputData) { return ({
            id: inputData.id
        }); };
        var create = function () {
            var args_1 = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args_1[_i] = arguments[_i];
            }
            return __awaiter(_this, __spreadArray([], args_1, true), void 0, function (inputData) {
                var data;
                if (inputData === void 0) { inputData = {}; }
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, build(inputData).then(screen)];
                        case 1:
                            data = _a.sent();
                            return [4 /*yield*/, (0, internal_1.getClient)().tag.create({ data: data })];
                        case 2: return [2 /*return*/, _a.sent()];
                    }
                });
            });
        };
        var createList = function (inputData) { return Promise.all((0, internal_1.normalizeList)(inputData).map(function (data) { return create(data); })); };
        var createForConnect = function (inputData) {
            if (inputData === void 0) { inputData = {}; }
            return create(inputData).then(pickForConnect);
        };
        return {
            _factoryFor: "Tag",
            build: build,
            buildList: buildList,
            buildCreateInput: build,
            pickForConnect: pickForConnect,
            create: create,
            createList: createList,
            createForConnect: createForConnect,
        };
    };
    var factory = getFactoryWithTraits();
    var useTraits = function (name) {
        var names = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            names[_i - 1] = arguments[_i];
        }
        return getFactoryWithTraits(__spreadArray([name], names, true));
    };
    return __assign(__assign({}, factory), { use: useTraits });
}
/**
 * Define factory for {@link Tag} model.
 *
 * @param options
 * @returns factory {@link TagFactoryInterface}
 */
function defineTagFactory(options) {
    return defineTagFactoryInternal(options !== null && options !== void 0 ? options : {});
}
exports.defineTagFactory = defineTagFactory;
function autoGeneratePollScalarsOrEnums(_a) {
    var seq = _a.seq;
    return {};
}
function definePollFactoryInternal(_a) {
    var _this = this;
    var defaultDataResolver = _a.defaultData, _b = _a.traits, traitsDefs = _b === void 0 ? {} : _b;
    var getFactoryWithTraits = function (traitKeys) {
        if (traitKeys === void 0) { traitKeys = []; }
        var seqKey = {};
        var getSeq = function () { return (0, internal_1.getSequenceCounter)(seqKey); };
        var screen = (0, internal_1.createScreener)("Poll", modelFieldDefinitions);
        var build = function () {
            var args_1 = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args_1[_i] = arguments[_i];
            }
            return __awaiter(_this, __spreadArray([], args_1, true), void 0, function (inputData) {
                var seq, requiredScalarData, resolveValue, defaultData, defaultAssociations, data;
                var _this = this;
                if (inputData === void 0) { inputData = {}; }
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            seq = getSeq();
                            requiredScalarData = autoGeneratePollScalarsOrEnums({ seq: seq });
                            resolveValue = (0, internal_1.normalizeResolver)(defaultDataResolver !== null && defaultDataResolver !== void 0 ? defaultDataResolver : {});
                            return [4 /*yield*/, traitKeys.reduce(function (queue, traitKey) { return __awaiter(_this, void 0, void 0, function () {
                                    var acc, resolveTraitValue, traitData;
                                    var _a, _b;
                                    return __generator(this, function (_c) {
                                        switch (_c.label) {
                                            case 0: return [4 /*yield*/, queue];
                                            case 1:
                                                acc = _c.sent();
                                                resolveTraitValue = (0, internal_1.normalizeResolver)((_b = (_a = traitsDefs[traitKey]) === null || _a === void 0 ? void 0 : _a.data) !== null && _b !== void 0 ? _b : {});
                                                return [4 /*yield*/, resolveTraitValue({ seq: seq })];
                                            case 2:
                                                traitData = _c.sent();
                                                return [2 /*return*/, __assign(__assign({}, acc), traitData)];
                                        }
                                    });
                                }); }, resolveValue({ seq: seq }))];
                        case 1:
                            defaultData = _a.sent();
                            defaultAssociations = {};
                            data = __assign(__assign(__assign(__assign({}, requiredScalarData), defaultData), defaultAssociations), inputData);
                            return [2 /*return*/, data];
                    }
                });
            });
        };
        var buildList = function (inputData) { return Promise.all((0, internal_1.normalizeList)(inputData).map(function (data) { return build(data); })); };
        var pickForConnect = function (inputData) { return ({
            id: inputData.id
        }); };
        var create = function () {
            var args_1 = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args_1[_i] = arguments[_i];
            }
            return __awaiter(_this, __spreadArray([], args_1, true), void 0, function (inputData) {
                var data;
                if (inputData === void 0) { inputData = {}; }
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, build(inputData).then(screen)];
                        case 1:
                            data = _a.sent();
                            return [4 /*yield*/, (0, internal_1.getClient)().poll.create({ data: data })];
                        case 2: return [2 /*return*/, _a.sent()];
                    }
                });
            });
        };
        var createList = function (inputData) { return Promise.all((0, internal_1.normalizeList)(inputData).map(function (data) { return create(data); })); };
        var createForConnect = function (inputData) {
            if (inputData === void 0) { inputData = {}; }
            return create(inputData).then(pickForConnect);
        };
        return {
            _factoryFor: "Poll",
            build: build,
            buildList: buildList,
            buildCreateInput: build,
            pickForConnect: pickForConnect,
            create: create,
            createList: createList,
            createForConnect: createForConnect,
        };
    };
    var factory = getFactoryWithTraits();
    var useTraits = function (name) {
        var names = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            names[_i - 1] = arguments[_i];
        }
        return getFactoryWithTraits(__spreadArray([name], names, true));
    };
    return __assign(__assign({}, factory), { use: useTraits });
}
/**
 * Define factory for {@link Poll} model.
 *
 * @param options
 * @returns factory {@link PollFactoryInterface}
 */
function definePollFactory(options) {
    return definePollFactoryInternal(options !== null && options !== void 0 ? options : {});
}
exports.definePollFactory = definePollFactory;
function isPollAnswerpollFactory(x) {
    return (x === null || x === void 0 ? void 0 : x._factoryFor) === "Poll";
}
function autoGeneratePollAnswerScalarsOrEnums(_a) {
    var seq = _a.seq;
    return {};
}
function definePollAnswerFactoryInternal(_a) {
    var _this = this;
    var defaultDataResolver = _a.defaultData, _b = _a.traits, traitsDefs = _b === void 0 ? {} : _b;
    var getFactoryWithTraits = function (traitKeys) {
        if (traitKeys === void 0) { traitKeys = []; }
        var seqKey = {};
        var getSeq = function () { return (0, internal_1.getSequenceCounter)(seqKey); };
        var screen = (0, internal_1.createScreener)("PollAnswer", modelFieldDefinitions);
        var build = function () {
            var args_1 = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args_1[_i] = arguments[_i];
            }
            return __awaiter(_this, __spreadArray([], args_1, true), void 0, function (inputData) {
                var seq, requiredScalarData, resolveValue, defaultData, defaultAssociations, _a, data;
                var _b, _c;
                var _this = this;
                if (inputData === void 0) { inputData = {}; }
                return __generator(this, function (_d) {
                    switch (_d.label) {
                        case 0:
                            seq = getSeq();
                            requiredScalarData = autoGeneratePollAnswerScalarsOrEnums({ seq: seq });
                            resolveValue = (0, internal_1.normalizeResolver)(defaultDataResolver !== null && defaultDataResolver !== void 0 ? defaultDataResolver : {});
                            return [4 /*yield*/, traitKeys.reduce(function (queue, traitKey) { return __awaiter(_this, void 0, void 0, function () {
                                    var acc, resolveTraitValue, traitData;
                                    var _a, _b;
                                    return __generator(this, function (_c) {
                                        switch (_c.label) {
                                            case 0: return [4 /*yield*/, queue];
                                            case 1:
                                                acc = _c.sent();
                                                resolveTraitValue = (0, internal_1.normalizeResolver)((_b = (_a = traitsDefs[traitKey]) === null || _a === void 0 ? void 0 : _a.data) !== null && _b !== void 0 ? _b : {});
                                                return [4 /*yield*/, resolveTraitValue({ seq: seq })];
                                            case 2:
                                                traitData = _c.sent();
                                                return [2 /*return*/, __assign(__assign({}, acc), traitData)];
                                        }
                                    });
                                }); }, resolveValue({ seq: seq }))];
                        case 1:
                            defaultData = _d.sent();
                            _b = {};
                            if (!isPollAnswerpollFactory(defaultData.poll)) return [3 /*break*/, 3];
                            _c = {};
                            return [4 /*yield*/, defaultData.poll.build()];
                        case 2:
                            _a = (_c.create = _d.sent(),
                                _c);
                            return [3 /*break*/, 4];
                        case 3:
                            _a = defaultData.poll;
                            _d.label = 4;
                        case 4:
                            defaultAssociations = (_b.poll = _a,
                                _b);
                            data = __assign(__assign(__assign(__assign({}, requiredScalarData), defaultData), defaultAssociations), inputData);
                            return [2 /*return*/, data];
                    }
                });
            });
        };
        var buildList = function (inputData) { return Promise.all((0, internal_1.normalizeList)(inputData).map(function (data) { return build(data); })); };
        var pickForConnect = function (inputData) { return ({
            id: inputData.id
        }); };
        var create = function () {
            var args_1 = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args_1[_i] = arguments[_i];
            }
            return __awaiter(_this, __spreadArray([], args_1, true), void 0, function (inputData) {
                var data;
                if (inputData === void 0) { inputData = {}; }
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, build(inputData).then(screen)];
                        case 1:
                            data = _a.sent();
                            return [4 /*yield*/, (0, internal_1.getClient)().pollAnswer.create({ data: data })];
                        case 2: return [2 /*return*/, _a.sent()];
                    }
                });
            });
        };
        var createList = function (inputData) { return Promise.all((0, internal_1.normalizeList)(inputData).map(function (data) { return create(data); })); };
        var createForConnect = function (inputData) {
            if (inputData === void 0) { inputData = {}; }
            return create(inputData).then(pickForConnect);
        };
        return {
            _factoryFor: "PollAnswer",
            build: build,
            buildList: buildList,
            buildCreateInput: build,
            pickForConnect: pickForConnect,
            create: create,
            createList: createList,
            createForConnect: createForConnect,
        };
    };
    var factory = getFactoryWithTraits();
    var useTraits = function (name) {
        var names = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            names[_i - 1] = arguments[_i];
        }
        return getFactoryWithTraits(__spreadArray([name], names, true));
    };
    return __assign(__assign({}, factory), { use: useTraits });
}
/**
 * Define factory for {@link PollAnswer} model.
 *
 * @param options
 * @returns factory {@link PollAnswerFactoryInterface}
 */
function definePollAnswerFactory(options) {
    return definePollAnswerFactoryInternal(options);
}
exports.definePollAnswerFactory = definePollAnswerFactory;
function isPollVoteuserFactory(x) {
    return (x === null || x === void 0 ? void 0 : x._factoryFor) === "User";
}
function isPollVoteanswerFactory(x) {
    return (x === null || x === void 0 ? void 0 : x._factoryFor) === "PollAnswer";
}
function isPollVotepollFactory(x) {
    return (x === null || x === void 0 ? void 0 : x._factoryFor) === "Poll";
}
function autoGeneratePollVoteScalarsOrEnums(_a) {
    var seq = _a.seq;
    return {};
}
function definePollVoteFactoryInternal(_a) {
    var _this = this;
    var defaultDataResolver = _a.defaultData, _b = _a.traits, traitsDefs = _b === void 0 ? {} : _b;
    var getFactoryWithTraits = function (traitKeys) {
        if (traitKeys === void 0) { traitKeys = []; }
        var seqKey = {};
        var getSeq = function () { return (0, internal_1.getSequenceCounter)(seqKey); };
        var screen = (0, internal_1.createScreener)("PollVote", modelFieldDefinitions);
        var build = function () {
            var args_1 = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args_1[_i] = arguments[_i];
            }
            return __awaiter(_this, __spreadArray([], args_1, true), void 0, function (inputData) {
                var seq, requiredScalarData, resolveValue, defaultData, defaultAssociations, _a, _b, _c, data;
                var _d, _e, _f, _g;
                var _this = this;
                if (inputData === void 0) { inputData = {}; }
                return __generator(this, function (_h) {
                    switch (_h.label) {
                        case 0:
                            seq = getSeq();
                            requiredScalarData = autoGeneratePollVoteScalarsOrEnums({ seq: seq });
                            resolveValue = (0, internal_1.normalizeResolver)(defaultDataResolver !== null && defaultDataResolver !== void 0 ? defaultDataResolver : {});
                            return [4 /*yield*/, traitKeys.reduce(function (queue, traitKey) { return __awaiter(_this, void 0, void 0, function () {
                                    var acc, resolveTraitValue, traitData;
                                    var _a, _b;
                                    return __generator(this, function (_c) {
                                        switch (_c.label) {
                                            case 0: return [4 /*yield*/, queue];
                                            case 1:
                                                acc = _c.sent();
                                                resolveTraitValue = (0, internal_1.normalizeResolver)((_b = (_a = traitsDefs[traitKey]) === null || _a === void 0 ? void 0 : _a.data) !== null && _b !== void 0 ? _b : {});
                                                return [4 /*yield*/, resolveTraitValue({ seq: seq })];
                                            case 2:
                                                traitData = _c.sent();
                                                return [2 /*return*/, __assign(__assign({}, acc), traitData)];
                                        }
                                    });
                                }); }, resolveValue({ seq: seq }))];
                        case 1:
                            defaultData = _h.sent();
                            _d = {};
                            if (!isPollVoteuserFactory(defaultData.user)) return [3 /*break*/, 3];
                            _e = {};
                            return [4 /*yield*/, defaultData.user.build()];
                        case 2:
                            _a = (_e.create = _h.sent(),
                                _e);
                            return [3 /*break*/, 4];
                        case 3:
                            _a = defaultData.user;
                            _h.label = 4;
                        case 4:
                            _d.user = _a;
                            if (!isPollVoteanswerFactory(defaultData.answer)) return [3 /*break*/, 6];
                            _f = {};
                            return [4 /*yield*/, defaultData.answer.build()];
                        case 5:
                            _b = (_f.create = _h.sent(),
                                _f);
                            return [3 /*break*/, 7];
                        case 6:
                            _b = defaultData.answer;
                            _h.label = 7;
                        case 7:
                            _d.answer = _b;
                            if (!isPollVotepollFactory(defaultData.poll)) return [3 /*break*/, 9];
                            _g = {};
                            return [4 /*yield*/, defaultData.poll.build()];
                        case 8:
                            _c = (_g.create = _h.sent(),
                                _g);
                            return [3 /*break*/, 10];
                        case 9:
                            _c = defaultData.poll;
                            _h.label = 10;
                        case 10:
                            defaultAssociations = (_d.poll = _c,
                                _d);
                            data = __assign(__assign(__assign(__assign({}, requiredScalarData), defaultData), defaultAssociations), inputData);
                            return [2 /*return*/, data];
                    }
                });
            });
        };
        var buildList = function (inputData) { return Promise.all((0, internal_1.normalizeList)(inputData).map(function (data) { return build(data); })); };
        var pickForConnect = function (inputData) { return ({
            id: inputData.id
        }); };
        var create = function () {
            var args_1 = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args_1[_i] = arguments[_i];
            }
            return __awaiter(_this, __spreadArray([], args_1, true), void 0, function (inputData) {
                var data;
                if (inputData === void 0) { inputData = {}; }
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, build(inputData).then(screen)];
                        case 1:
                            data = _a.sent();
                            return [4 /*yield*/, (0, internal_1.getClient)().pollVote.create({ data: data })];
                        case 2: return [2 /*return*/, _a.sent()];
                    }
                });
            });
        };
        var createList = function (inputData) { return Promise.all((0, internal_1.normalizeList)(inputData).map(function (data) { return create(data); })); };
        var createForConnect = function (inputData) {
            if (inputData === void 0) { inputData = {}; }
            return create(inputData).then(pickForConnect);
        };
        return {
            _factoryFor: "PollVote",
            build: build,
            buildList: buildList,
            buildCreateInput: build,
            pickForConnect: pickForConnect,
            create: create,
            createList: createList,
            createForConnect: createForConnect,
        };
    };
    var factory = getFactoryWithTraits();
    var useTraits = function (name) {
        var names = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            names[_i - 1] = arguments[_i];
        }
        return getFactoryWithTraits(__spreadArray([name], names, true));
    };
    return __assign(__assign({}, factory), { use: useTraits });
}
/**
 * Define factory for {@link PollVote} model.
 *
 * @param options
 * @returns factory {@link PollVoteFactoryInterface}
 */
function definePollVoteFactory(options) {
    return definePollVoteFactoryInternal(options);
}
exports.definePollVoteFactory = definePollVoteFactory;
function isPollExternalVoteSourcepollFactory(x) {
    return (x === null || x === void 0 ? void 0 : x._factoryFor) === "Poll";
}
function autoGeneratePollExternalVoteSourceScalarsOrEnums(_a) {
    var seq = _a.seq;
    return {};
}
function definePollExternalVoteSourceFactoryInternal(_a) {
    var _this = this;
    var defaultDataResolver = _a.defaultData, _b = _a.traits, traitsDefs = _b === void 0 ? {} : _b;
    var getFactoryWithTraits = function (traitKeys) {
        if (traitKeys === void 0) { traitKeys = []; }
        var seqKey = {};
        var getSeq = function () { return (0, internal_1.getSequenceCounter)(seqKey); };
        var screen = (0, internal_1.createScreener)("PollExternalVoteSource", modelFieldDefinitions);
        var build = function () {
            var args_1 = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args_1[_i] = arguments[_i];
            }
            return __awaiter(_this, __spreadArray([], args_1, true), void 0, function (inputData) {
                var seq, requiredScalarData, resolveValue, defaultData, defaultAssociations, _a, data;
                var _b, _c;
                var _this = this;
                if (inputData === void 0) { inputData = {}; }
                return __generator(this, function (_d) {
                    switch (_d.label) {
                        case 0:
                            seq = getSeq();
                            requiredScalarData = autoGeneratePollExternalVoteSourceScalarsOrEnums({ seq: seq });
                            resolveValue = (0, internal_1.normalizeResolver)(defaultDataResolver !== null && defaultDataResolver !== void 0 ? defaultDataResolver : {});
                            return [4 /*yield*/, traitKeys.reduce(function (queue, traitKey) { return __awaiter(_this, void 0, void 0, function () {
                                    var acc, resolveTraitValue, traitData;
                                    var _a, _b;
                                    return __generator(this, function (_c) {
                                        switch (_c.label) {
                                            case 0: return [4 /*yield*/, queue];
                                            case 1:
                                                acc = _c.sent();
                                                resolveTraitValue = (0, internal_1.normalizeResolver)((_b = (_a = traitsDefs[traitKey]) === null || _a === void 0 ? void 0 : _a.data) !== null && _b !== void 0 ? _b : {});
                                                return [4 /*yield*/, resolveTraitValue({ seq: seq })];
                                            case 2:
                                                traitData = _c.sent();
                                                return [2 /*return*/, __assign(__assign({}, acc), traitData)];
                                        }
                                    });
                                }); }, resolveValue({ seq: seq }))];
                        case 1:
                            defaultData = _d.sent();
                            _b = {};
                            if (!isPollExternalVoteSourcepollFactory(defaultData.poll)) return [3 /*break*/, 3];
                            _c = {};
                            return [4 /*yield*/, defaultData.poll.build()];
                        case 2:
                            _a = (_c.create = _d.sent(),
                                _c);
                            return [3 /*break*/, 4];
                        case 3:
                            _a = defaultData.poll;
                            _d.label = 4;
                        case 4:
                            defaultAssociations = (_b.poll = _a,
                                _b);
                            data = __assign(__assign(__assign(__assign({}, requiredScalarData), defaultData), defaultAssociations), inputData);
                            return [2 /*return*/, data];
                    }
                });
            });
        };
        var buildList = function (inputData) { return Promise.all((0, internal_1.normalizeList)(inputData).map(function (data) { return build(data); })); };
        var pickForConnect = function (inputData) { return ({
            id: inputData.id
        }); };
        var create = function () {
            var args_1 = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args_1[_i] = arguments[_i];
            }
            return __awaiter(_this, __spreadArray([], args_1, true), void 0, function (inputData) {
                var data;
                if (inputData === void 0) { inputData = {}; }
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, build(inputData).then(screen)];
                        case 1:
                            data = _a.sent();
                            return [4 /*yield*/, (0, internal_1.getClient)().pollExternalVoteSource.create({ data: data })];
                        case 2: return [2 /*return*/, _a.sent()];
                    }
                });
            });
        };
        var createList = function (inputData) { return Promise.all((0, internal_1.normalizeList)(inputData).map(function (data) { return create(data); })); };
        var createForConnect = function (inputData) {
            if (inputData === void 0) { inputData = {}; }
            return create(inputData).then(pickForConnect);
        };
        return {
            _factoryFor: "PollExternalVoteSource",
            build: build,
            buildList: buildList,
            buildCreateInput: build,
            pickForConnect: pickForConnect,
            create: create,
            createList: createList,
            createForConnect: createForConnect,
        };
    };
    var factory = getFactoryWithTraits();
    var useTraits = function (name) {
        var names = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            names[_i - 1] = arguments[_i];
        }
        return getFactoryWithTraits(__spreadArray([name], names, true));
    };
    return __assign(__assign({}, factory), { use: useTraits });
}
/**
 * Define factory for {@link PollExternalVoteSource} model.
 *
 * @param options
 * @returns factory {@link PollExternalVoteSourceFactoryInterface}
 */
function definePollExternalVoteSourceFactory(options) {
    return definePollExternalVoteSourceFactoryInternal(options);
}
exports.definePollExternalVoteSourceFactory = definePollExternalVoteSourceFactory;
function isPollExternalVoteanswerFactory(x) {
    return (x === null || x === void 0 ? void 0 : x._factoryFor) === "PollAnswer";
}
function isPollExternalVotesourceFactory(x) {
    return (x === null || x === void 0 ? void 0 : x._factoryFor) === "PollExternalVoteSource";
}
function autoGeneratePollExternalVoteScalarsOrEnums(_a) {
    var seq = _a.seq;
    return {};
}
function definePollExternalVoteFactoryInternal(_a) {
    var _this = this;
    var defaultDataResolver = _a.defaultData, _b = _a.traits, traitsDefs = _b === void 0 ? {} : _b;
    var getFactoryWithTraits = function (traitKeys) {
        if (traitKeys === void 0) { traitKeys = []; }
        var seqKey = {};
        var getSeq = function () { return (0, internal_1.getSequenceCounter)(seqKey); };
        var screen = (0, internal_1.createScreener)("PollExternalVote", modelFieldDefinitions);
        var build = function () {
            var args_1 = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args_1[_i] = arguments[_i];
            }
            return __awaiter(_this, __spreadArray([], args_1, true), void 0, function (inputData) {
                var seq, requiredScalarData, resolveValue, defaultData, defaultAssociations, _a, _b, data;
                var _c, _d, _e;
                var _this = this;
                if (inputData === void 0) { inputData = {}; }
                return __generator(this, function (_f) {
                    switch (_f.label) {
                        case 0:
                            seq = getSeq();
                            requiredScalarData = autoGeneratePollExternalVoteScalarsOrEnums({ seq: seq });
                            resolveValue = (0, internal_1.normalizeResolver)(defaultDataResolver !== null && defaultDataResolver !== void 0 ? defaultDataResolver : {});
                            return [4 /*yield*/, traitKeys.reduce(function (queue, traitKey) { return __awaiter(_this, void 0, void 0, function () {
                                    var acc, resolveTraitValue, traitData;
                                    var _a, _b;
                                    return __generator(this, function (_c) {
                                        switch (_c.label) {
                                            case 0: return [4 /*yield*/, queue];
                                            case 1:
                                                acc = _c.sent();
                                                resolveTraitValue = (0, internal_1.normalizeResolver)((_b = (_a = traitsDefs[traitKey]) === null || _a === void 0 ? void 0 : _a.data) !== null && _b !== void 0 ? _b : {});
                                                return [4 /*yield*/, resolveTraitValue({ seq: seq })];
                                            case 2:
                                                traitData = _c.sent();
                                                return [2 /*return*/, __assign(__assign({}, acc), traitData)];
                                        }
                                    });
                                }); }, resolveValue({ seq: seq }))];
                        case 1:
                            defaultData = _f.sent();
                            _c = {};
                            if (!isPollExternalVoteanswerFactory(defaultData.answer)) return [3 /*break*/, 3];
                            _d = {};
                            return [4 /*yield*/, defaultData.answer.build()];
                        case 2:
                            _a = (_d.create = _f.sent(),
                                _d);
                            return [3 /*break*/, 4];
                        case 3:
                            _a = defaultData.answer;
                            _f.label = 4;
                        case 4:
                            _c.answer = _a;
                            if (!isPollExternalVotesourceFactory(defaultData.source)) return [3 /*break*/, 6];
                            _e = {};
                            return [4 /*yield*/, defaultData.source.build()];
                        case 5:
                            _b = (_e.create = _f.sent(),
                                _e);
                            return [3 /*break*/, 7];
                        case 6:
                            _b = defaultData.source;
                            _f.label = 7;
                        case 7:
                            defaultAssociations = (_c.source = _b,
                                _c);
                            data = __assign(__assign(__assign(__assign({}, requiredScalarData), defaultData), defaultAssociations), inputData);
                            return [2 /*return*/, data];
                    }
                });
            });
        };
        var buildList = function (inputData) { return Promise.all((0, internal_1.normalizeList)(inputData).map(function (data) { return build(data); })); };
        var pickForConnect = function (inputData) { return ({
            id: inputData.id
        }); };
        var create = function () {
            var args_1 = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args_1[_i] = arguments[_i];
            }
            return __awaiter(_this, __spreadArray([], args_1, true), void 0, function (inputData) {
                var data;
                if (inputData === void 0) { inputData = {}; }
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, build(inputData).then(screen)];
                        case 1:
                            data = _a.sent();
                            return [4 /*yield*/, (0, internal_1.getClient)().pollExternalVote.create({ data: data })];
                        case 2: return [2 /*return*/, _a.sent()];
                    }
                });
            });
        };
        var createList = function (inputData) { return Promise.all((0, internal_1.normalizeList)(inputData).map(function (data) { return create(data); })); };
        var createForConnect = function (inputData) {
            if (inputData === void 0) { inputData = {}; }
            return create(inputData).then(pickForConnect);
        };
        return {
            _factoryFor: "PollExternalVote",
            build: build,
            buildList: buildList,
            buildCreateInput: build,
            pickForConnect: pickForConnect,
            create: create,
            createList: createList,
            createForConnect: createForConnect,
        };
    };
    var factory = getFactoryWithTraits();
    var useTraits = function (name) {
        var names = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            names[_i - 1] = arguments[_i];
        }
        return getFactoryWithTraits(__spreadArray([name], names, true));
    };
    return __assign(__assign({}, factory), { use: useTraits });
}
/**
 * Define factory for {@link PollExternalVote} model.
 *
 * @param options
 * @returns factory {@link PollExternalVoteFactoryInterface}
 */
function definePollExternalVoteFactory(options) {
    return definePollExternalVoteFactoryInternal(options);
}
exports.definePollExternalVoteFactory = definePollExternalVoteFactory;
function isEventimageFactory(x) {
    return (x === null || x === void 0 ? void 0 : x._factoryFor) === "Image";
}
function autoGenerateEventScalarsOrEnums(_a) {
    var seq = _a.seq;
    return {
        name: (0, internal_1.getScalarFieldValueGenerator)().String({ modelName: "Event", fieldName: "name", isId: false, isUnique: false, seq: seq }),
        startsAt: (0, internal_1.getScalarFieldValueGenerator)().DateTime({ modelName: "Event", fieldName: "startsAt", isId: false, isUnique: false, seq: seq })
    };
}
function defineEventFactoryInternal(_a) {
    var _this = this;
    var defaultDataResolver = _a.defaultData, _b = _a.traits, traitsDefs = _b === void 0 ? {} : _b;
    var getFactoryWithTraits = function (traitKeys) {
        if (traitKeys === void 0) { traitKeys = []; }
        var seqKey = {};
        var getSeq = function () { return (0, internal_1.getSequenceCounter)(seqKey); };
        var screen = (0, internal_1.createScreener)("Event", modelFieldDefinitions);
        var build = function () {
            var args_1 = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args_1[_i] = arguments[_i];
            }
            return __awaiter(_this, __spreadArray([], args_1, true), void 0, function (inputData) {
                var seq, requiredScalarData, resolveValue, defaultData, defaultAssociations, _a, data;
                var _b, _c;
                var _this = this;
                if (inputData === void 0) { inputData = {}; }
                return __generator(this, function (_d) {
                    switch (_d.label) {
                        case 0:
                            seq = getSeq();
                            requiredScalarData = autoGenerateEventScalarsOrEnums({ seq: seq });
                            resolveValue = (0, internal_1.normalizeResolver)(defaultDataResolver !== null && defaultDataResolver !== void 0 ? defaultDataResolver : {});
                            return [4 /*yield*/, traitKeys.reduce(function (queue, traitKey) { return __awaiter(_this, void 0, void 0, function () {
                                    var acc, resolveTraitValue, traitData;
                                    var _a, _b;
                                    return __generator(this, function (_c) {
                                        switch (_c.label) {
                                            case 0: return [4 /*yield*/, queue];
                                            case 1:
                                                acc = _c.sent();
                                                resolveTraitValue = (0, internal_1.normalizeResolver)((_b = (_a = traitsDefs[traitKey]) === null || _a === void 0 ? void 0 : _a.data) !== null && _b !== void 0 ? _b : {});
                                                return [4 /*yield*/, resolveTraitValue({ seq: seq })];
                                            case 2:
                                                traitData = _c.sent();
                                                return [2 /*return*/, __assign(__assign({}, acc), traitData)];
                                        }
                                    });
                                }); }, resolveValue({ seq: seq }))];
                        case 1:
                            defaultData = _d.sent();
                            _b = {};
                            if (!isEventimageFactory(defaultData.image)) return [3 /*break*/, 3];
                            _c = {};
                            return [4 /*yield*/, defaultData.image.build()];
                        case 2:
                            _a = (_c.create = _d.sent(),
                                _c);
                            return [3 /*break*/, 4];
                        case 3:
                            _a = defaultData.image;
                            _d.label = 4;
                        case 4:
                            defaultAssociations = (_b.image = _a,
                                _b);
                            data = __assign(__assign(__assign(__assign({}, requiredScalarData), defaultData), defaultAssociations), inputData);
                            return [2 /*return*/, data];
                    }
                });
            });
        };
        var buildList = function (inputData) { return Promise.all((0, internal_1.normalizeList)(inputData).map(function (data) { return build(data); })); };
        var pickForConnect = function (inputData) { return ({
            id: inputData.id
        }); };
        var create = function () {
            var args_1 = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args_1[_i] = arguments[_i];
            }
            return __awaiter(_this, __spreadArray([], args_1, true), void 0, function (inputData) {
                var data;
                if (inputData === void 0) { inputData = {}; }
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, build(inputData).then(screen)];
                        case 1:
                            data = _a.sent();
                            return [4 /*yield*/, (0, internal_1.getClient)().event.create({ data: data })];
                        case 2: return [2 /*return*/, _a.sent()];
                    }
                });
            });
        };
        var createList = function (inputData) { return Promise.all((0, internal_1.normalizeList)(inputData).map(function (data) { return create(data); })); };
        var createForConnect = function (inputData) {
            if (inputData === void 0) { inputData = {}; }
            return create(inputData).then(pickForConnect);
        };
        return {
            _factoryFor: "Event",
            build: build,
            buildList: buildList,
            buildCreateInput: build,
            pickForConnect: pickForConnect,
            create: create,
            createList: createList,
            createForConnect: createForConnect,
        };
    };
    var factory = getFactoryWithTraits();
    var useTraits = function (name) {
        var names = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            names[_i - 1] = arguments[_i];
        }
        return getFactoryWithTraits(__spreadArray([name], names, true));
    };
    return __assign(__assign({}, factory), { use: useTraits });
}
/**
 * Define factory for {@link Event} model.
 *
 * @param options
 * @returns factory {@link EventFactoryInterface}
 */
function defineEventFactory(options) {
    return defineEventFactoryInternal(options !== null && options !== void 0 ? options : {});
}
exports.defineEventFactory = defineEventFactory;
function isTaggedEventseventFactory(x) {
    return (x === null || x === void 0 ? void 0 : x._factoryFor) === "Event";
}
function isTaggedEventstagFactory(x) {
    return (x === null || x === void 0 ? void 0 : x._factoryFor) === "Tag";
}
function autoGenerateTaggedEventsScalarsOrEnums(_a) {
    var seq = _a.seq;
    return {};
}
function defineTaggedEventsFactoryInternal(_a) {
    var _this = this;
    var defaultDataResolver = _a.defaultData, _b = _a.traits, traitsDefs = _b === void 0 ? {} : _b;
    var getFactoryWithTraits = function (traitKeys) {
        if (traitKeys === void 0) { traitKeys = []; }
        var seqKey = {};
        var getSeq = function () { return (0, internal_1.getSequenceCounter)(seqKey); };
        var screen = (0, internal_1.createScreener)("TaggedEvents", modelFieldDefinitions);
        var build = function () {
            var args_1 = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args_1[_i] = arguments[_i];
            }
            return __awaiter(_this, __spreadArray([], args_1, true), void 0, function (inputData) {
                var seq, requiredScalarData, resolveValue, defaultData, defaultAssociations, _a, _b, data;
                var _c, _d, _e;
                var _this = this;
                if (inputData === void 0) { inputData = {}; }
                return __generator(this, function (_f) {
                    switch (_f.label) {
                        case 0:
                            seq = getSeq();
                            requiredScalarData = autoGenerateTaggedEventsScalarsOrEnums({ seq: seq });
                            resolveValue = (0, internal_1.normalizeResolver)(defaultDataResolver !== null && defaultDataResolver !== void 0 ? defaultDataResolver : {});
                            return [4 /*yield*/, traitKeys.reduce(function (queue, traitKey) { return __awaiter(_this, void 0, void 0, function () {
                                    var acc, resolveTraitValue, traitData;
                                    var _a, _b;
                                    return __generator(this, function (_c) {
                                        switch (_c.label) {
                                            case 0: return [4 /*yield*/, queue];
                                            case 1:
                                                acc = _c.sent();
                                                resolveTraitValue = (0, internal_1.normalizeResolver)((_b = (_a = traitsDefs[traitKey]) === null || _a === void 0 ? void 0 : _a.data) !== null && _b !== void 0 ? _b : {});
                                                return [4 /*yield*/, resolveTraitValue({ seq: seq })];
                                            case 2:
                                                traitData = _c.sent();
                                                return [2 /*return*/, __assign(__assign({}, acc), traitData)];
                                        }
                                    });
                                }); }, resolveValue({ seq: seq }))];
                        case 1:
                            defaultData = _f.sent();
                            _c = {};
                            if (!isTaggedEventseventFactory(defaultData.event)) return [3 /*break*/, 3];
                            _d = {};
                            return [4 /*yield*/, defaultData.event.build()];
                        case 2:
                            _a = (_d.create = _f.sent(),
                                _d);
                            return [3 /*break*/, 4];
                        case 3:
                            _a = defaultData.event;
                            _f.label = 4;
                        case 4:
                            _c.event = _a;
                            if (!isTaggedEventstagFactory(defaultData.tag)) return [3 /*break*/, 6];
                            _e = {};
                            return [4 /*yield*/, defaultData.tag.build()];
                        case 5:
                            _b = (_e.create = _f.sent(),
                                _e);
                            return [3 /*break*/, 7];
                        case 6:
                            _b = defaultData.tag;
                            _f.label = 7;
                        case 7:
                            defaultAssociations = (_c.tag = _b,
                                _c);
                            data = __assign(__assign(__assign(__assign({}, requiredScalarData), defaultData), defaultAssociations), inputData);
                            return [2 /*return*/, data];
                    }
                });
            });
        };
        var buildList = function (inputData) { return Promise.all((0, internal_1.normalizeList)(inputData).map(function (data) { return build(data); })); };
        var pickForConnect = function (inputData) { return ({
            eventId: inputData.eventId,
            tagId: inputData.tagId
        }); };
        var create = function () {
            var args_1 = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args_1[_i] = arguments[_i];
            }
            return __awaiter(_this, __spreadArray([], args_1, true), void 0, function (inputData) {
                var data;
                if (inputData === void 0) { inputData = {}; }
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, build(inputData).then(screen)];
                        case 1:
                            data = _a.sent();
                            return [4 /*yield*/, (0, internal_1.getClient)().taggedEvents.create({ data: data })];
                        case 2: return [2 /*return*/, _a.sent()];
                    }
                });
            });
        };
        var createList = function (inputData) { return Promise.all((0, internal_1.normalizeList)(inputData).map(function (data) { return create(data); })); };
        var createForConnect = function (inputData) {
            if (inputData === void 0) { inputData = {}; }
            return create(inputData).then(pickForConnect);
        };
        return {
            _factoryFor: "TaggedEvents",
            build: build,
            buildList: buildList,
            buildCreateInput: build,
            pickForConnect: pickForConnect,
            create: create,
            createList: createList,
            createForConnect: createForConnect,
        };
    };
    var factory = getFactoryWithTraits();
    var useTraits = function (name) {
        var names = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            names[_i - 1] = arguments[_i];
        }
        return getFactoryWithTraits(__spreadArray([name], names, true));
    };
    return __assign(__assign({}, factory), { use: useTraits });
}
/**
 * Define factory for {@link TaggedEvents} model.
 *
 * @param options
 * @returns factory {@link TaggedEventsFactoryInterface}
 */
function defineTaggedEventsFactory(options) {
    return defineTaggedEventsFactoryInternal(options);
}
exports.defineTaggedEventsFactory = defineTaggedEventsFactory;
function autoGenerateConsentScalarsOrEnums(_a) {
    var seq = _a.seq;
    return {
        name: (0, internal_1.getScalarFieldValueGenerator)().String({ modelName: "Consent", fieldName: "name", isId: false, isUnique: false, seq: seq }),
        slug: (0, internal_1.getScalarFieldValueGenerator)().String({ modelName: "Consent", fieldName: "slug", isId: false, isUnique: true, seq: seq }),
        defaultValue: (0, internal_1.getScalarFieldValueGenerator)().Boolean({ modelName: "Consent", fieldName: "defaultValue", isId: false, isUnique: false, seq: seq })
    };
}
function defineConsentFactoryInternal(_a) {
    var _this = this;
    var defaultDataResolver = _a.defaultData, _b = _a.traits, traitsDefs = _b === void 0 ? {} : _b;
    var getFactoryWithTraits = function (traitKeys) {
        if (traitKeys === void 0) { traitKeys = []; }
        var seqKey = {};
        var getSeq = function () { return (0, internal_1.getSequenceCounter)(seqKey); };
        var screen = (0, internal_1.createScreener)("Consent", modelFieldDefinitions);
        var build = function () {
            var args_1 = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args_1[_i] = arguments[_i];
            }
            return __awaiter(_this, __spreadArray([], args_1, true), void 0, function (inputData) {
                var seq, requiredScalarData, resolveValue, defaultData, defaultAssociations, data;
                var _this = this;
                if (inputData === void 0) { inputData = {}; }
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            seq = getSeq();
                            requiredScalarData = autoGenerateConsentScalarsOrEnums({ seq: seq });
                            resolveValue = (0, internal_1.normalizeResolver)(defaultDataResolver !== null && defaultDataResolver !== void 0 ? defaultDataResolver : {});
                            return [4 /*yield*/, traitKeys.reduce(function (queue, traitKey) { return __awaiter(_this, void 0, void 0, function () {
                                    var acc, resolveTraitValue, traitData;
                                    var _a, _b;
                                    return __generator(this, function (_c) {
                                        switch (_c.label) {
                                            case 0: return [4 /*yield*/, queue];
                                            case 1:
                                                acc = _c.sent();
                                                resolveTraitValue = (0, internal_1.normalizeResolver)((_b = (_a = traitsDefs[traitKey]) === null || _a === void 0 ? void 0 : _a.data) !== null && _b !== void 0 ? _b : {});
                                                return [4 /*yield*/, resolveTraitValue({ seq: seq })];
                                            case 2:
                                                traitData = _c.sent();
                                                return [2 /*return*/, __assign(__assign({}, acc), traitData)];
                                        }
                                    });
                                }); }, resolveValue({ seq: seq }))];
                        case 1:
                            defaultData = _a.sent();
                            defaultAssociations = {};
                            data = __assign(__assign(__assign(__assign({}, requiredScalarData), defaultData), defaultAssociations), inputData);
                            return [2 /*return*/, data];
                    }
                });
            });
        };
        var buildList = function (inputData) { return Promise.all((0, internal_1.normalizeList)(inputData).map(function (data) { return build(data); })); };
        var pickForConnect = function (inputData) { return ({
            id: inputData.id
        }); };
        var create = function () {
            var args_1 = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args_1[_i] = arguments[_i];
            }
            return __awaiter(_this, __spreadArray([], args_1, true), void 0, function (inputData) {
                var data;
                if (inputData === void 0) { inputData = {}; }
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, build(inputData).then(screen)];
                        case 1:
                            data = _a.sent();
                            return [4 /*yield*/, (0, internal_1.getClient)().consent.create({ data: data })];
                        case 2: return [2 /*return*/, _a.sent()];
                    }
                });
            });
        };
        var createList = function (inputData) { return Promise.all((0, internal_1.normalizeList)(inputData).map(function (data) { return create(data); })); };
        var createForConnect = function (inputData) {
            if (inputData === void 0) { inputData = {}; }
            return create(inputData).then(pickForConnect);
        };
        return {
            _factoryFor: "Consent",
            build: build,
            buildList: buildList,
            buildCreateInput: build,
            pickForConnect: pickForConnect,
            create: create,
            createList: createList,
            createForConnect: createForConnect,
        };
    };
    var factory = getFactoryWithTraits();
    var useTraits = function (name) {
        var names = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            names[_i - 1] = arguments[_i];
        }
        return getFactoryWithTraits(__spreadArray([name], names, true));
    };
    return __assign(__assign({}, factory), { use: useTraits });
}
/**
 * Define factory for {@link Consent} model.
 *
 * @param options
 * @returns factory {@link ConsentFactoryInterface}
 */
function defineConsentFactory(options) {
    return defineConsentFactoryInternal(options !== null && options !== void 0 ? options : {});
}
exports.defineConsentFactory = defineConsentFactory;
function isUserConsentconsentFactory(x) {
    return (x === null || x === void 0 ? void 0 : x._factoryFor) === "Consent";
}
function isUserConsentuserFactory(x) {
    return (x === null || x === void 0 ? void 0 : x._factoryFor) === "User";
}
function autoGenerateUserConsentScalarsOrEnums(_a) {
    var seq = _a.seq;
    return {
        value: (0, internal_1.getScalarFieldValueGenerator)().Boolean({ modelName: "UserConsent", fieldName: "value", isId: false, isUnique: false, seq: seq })
    };
}
function defineUserConsentFactoryInternal(_a) {
    var _this = this;
    var defaultDataResolver = _a.defaultData, _b = _a.traits, traitsDefs = _b === void 0 ? {} : _b;
    var getFactoryWithTraits = function (traitKeys) {
        if (traitKeys === void 0) { traitKeys = []; }
        var seqKey = {};
        var getSeq = function () { return (0, internal_1.getSequenceCounter)(seqKey); };
        var screen = (0, internal_1.createScreener)("UserConsent", modelFieldDefinitions);
        var build = function () {
            var args_1 = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args_1[_i] = arguments[_i];
            }
            return __awaiter(_this, __spreadArray([], args_1, true), void 0, function (inputData) {
                var seq, requiredScalarData, resolveValue, defaultData, defaultAssociations, _a, _b, data;
                var _c, _d, _e;
                var _this = this;
                if (inputData === void 0) { inputData = {}; }
                return __generator(this, function (_f) {
                    switch (_f.label) {
                        case 0:
                            seq = getSeq();
                            requiredScalarData = autoGenerateUserConsentScalarsOrEnums({ seq: seq });
                            resolveValue = (0, internal_1.normalizeResolver)(defaultDataResolver !== null && defaultDataResolver !== void 0 ? defaultDataResolver : {});
                            return [4 /*yield*/, traitKeys.reduce(function (queue, traitKey) { return __awaiter(_this, void 0, void 0, function () {
                                    var acc, resolveTraitValue, traitData;
                                    var _a, _b;
                                    return __generator(this, function (_c) {
                                        switch (_c.label) {
                                            case 0: return [4 /*yield*/, queue];
                                            case 1:
                                                acc = _c.sent();
                                                resolveTraitValue = (0, internal_1.normalizeResolver)((_b = (_a = traitsDefs[traitKey]) === null || _a === void 0 ? void 0 : _a.data) !== null && _b !== void 0 ? _b : {});
                                                return [4 /*yield*/, resolveTraitValue({ seq: seq })];
                                            case 2:
                                                traitData = _c.sent();
                                                return [2 /*return*/, __assign(__assign({}, acc), traitData)];
                                        }
                                    });
                                }); }, resolveValue({ seq: seq }))];
                        case 1:
                            defaultData = _f.sent();
                            _c = {};
                            if (!isUserConsentconsentFactory(defaultData.consent)) return [3 /*break*/, 3];
                            _d = {};
                            return [4 /*yield*/, defaultData.consent.build()];
                        case 2:
                            _a = (_d.create = _f.sent(),
                                _d);
                            return [3 /*break*/, 4];
                        case 3:
                            _a = defaultData.consent;
                            _f.label = 4;
                        case 4:
                            _c.consent = _a;
                            if (!isUserConsentuserFactory(defaultData.user)) return [3 /*break*/, 6];
                            _e = {};
                            return [4 /*yield*/, defaultData.user.build()];
                        case 5:
                            _b = (_e.create = _f.sent(),
                                _e);
                            return [3 /*break*/, 7];
                        case 6:
                            _b = defaultData.user;
                            _f.label = 7;
                        case 7:
                            defaultAssociations = (_c.user = _b,
                                _c);
                            data = __assign(__assign(__assign(__assign({}, requiredScalarData), defaultData), defaultAssociations), inputData);
                            return [2 /*return*/, data];
                    }
                });
            });
        };
        var buildList = function (inputData) { return Promise.all((0, internal_1.normalizeList)(inputData).map(function (data) { return build(data); })); };
        var pickForConnect = function (inputData) { return ({
            id: inputData.id
        }); };
        var create = function () {
            var args_1 = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args_1[_i] = arguments[_i];
            }
            return __awaiter(_this, __spreadArray([], args_1, true), void 0, function (inputData) {
                var data;
                if (inputData === void 0) { inputData = {}; }
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, build(inputData).then(screen)];
                        case 1:
                            data = _a.sent();
                            return [4 /*yield*/, (0, internal_1.getClient)().userConsent.create({ data: data })];
                        case 2: return [2 /*return*/, _a.sent()];
                    }
                });
            });
        };
        var createList = function (inputData) { return Promise.all((0, internal_1.normalizeList)(inputData).map(function (data) { return create(data); })); };
        var createForConnect = function (inputData) {
            if (inputData === void 0) { inputData = {}; }
            return create(inputData).then(pickForConnect);
        };
        return {
            _factoryFor: "UserConsent",
            build: build,
            buildList: buildList,
            buildCreateInput: build,
            pickForConnect: pickForConnect,
            create: create,
            createList: createList,
            createForConnect: createForConnect,
        };
    };
    var factory = getFactoryWithTraits();
    var useTraits = function (name) {
        var names = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            names[_i - 1] = arguments[_i];
        }
        return getFactoryWithTraits(__spreadArray([name], names, true));
    };
    return __assign(__assign({}, factory), { use: useTraits });
}
/**
 * Define factory for {@link UserConsent} model.
 *
 * @param options
 * @returns factory {@link UserConsentFactoryInterface}
 */
function defineUserConsentFactory(options) {
    return defineUserConsentFactoryInternal(options);
}
exports.defineUserConsentFactory = defineUserConsentFactory;
function isUserFlowMailmailTemplateFactory(x) {
    return (x === null || x === void 0 ? void 0 : x._factoryFor) === "MailTemplate";
}
function autoGenerateUserFlowMailScalarsOrEnums(_a) {
    var seq = _a.seq;
    return {
        event: "ACCOUNT_CREATION"
    };
}
function defineUserFlowMailFactoryInternal(_a) {
    var _this = this;
    var defaultDataResolver = _a.defaultData, _b = _a.traits, traitsDefs = _b === void 0 ? {} : _b;
    var getFactoryWithTraits = function (traitKeys) {
        if (traitKeys === void 0) { traitKeys = []; }
        var seqKey = {};
        var getSeq = function () { return (0, internal_1.getSequenceCounter)(seqKey); };
        var screen = (0, internal_1.createScreener)("UserFlowMail", modelFieldDefinitions);
        var build = function () {
            var args_1 = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args_1[_i] = arguments[_i];
            }
            return __awaiter(_this, __spreadArray([], args_1, true), void 0, function (inputData) {
                var seq, requiredScalarData, resolveValue, defaultData, defaultAssociations, _a, data;
                var _b, _c;
                var _this = this;
                if (inputData === void 0) { inputData = {}; }
                return __generator(this, function (_d) {
                    switch (_d.label) {
                        case 0:
                            seq = getSeq();
                            requiredScalarData = autoGenerateUserFlowMailScalarsOrEnums({ seq: seq });
                            resolveValue = (0, internal_1.normalizeResolver)(defaultDataResolver !== null && defaultDataResolver !== void 0 ? defaultDataResolver : {});
                            return [4 /*yield*/, traitKeys.reduce(function (queue, traitKey) { return __awaiter(_this, void 0, void 0, function () {
                                    var acc, resolveTraitValue, traitData;
                                    var _a, _b;
                                    return __generator(this, function (_c) {
                                        switch (_c.label) {
                                            case 0: return [4 /*yield*/, queue];
                                            case 1:
                                                acc = _c.sent();
                                                resolveTraitValue = (0, internal_1.normalizeResolver)((_b = (_a = traitsDefs[traitKey]) === null || _a === void 0 ? void 0 : _a.data) !== null && _b !== void 0 ? _b : {});
                                                return [4 /*yield*/, resolveTraitValue({ seq: seq })];
                                            case 2:
                                                traitData = _c.sent();
                                                return [2 /*return*/, __assign(__assign({}, acc), traitData)];
                                        }
                                    });
                                }); }, resolveValue({ seq: seq }))];
                        case 1:
                            defaultData = _d.sent();
                            _b = {};
                            if (!isUserFlowMailmailTemplateFactory(defaultData.mailTemplate)) return [3 /*break*/, 3];
                            _c = {};
                            return [4 /*yield*/, defaultData.mailTemplate.build()];
                        case 2:
                            _a = (_c.create = _d.sent(),
                                _c);
                            return [3 /*break*/, 4];
                        case 3:
                            _a = defaultData.mailTemplate;
                            _d.label = 4;
                        case 4:
                            defaultAssociations = (_b.mailTemplate = _a,
                                _b);
                            data = __assign(__assign(__assign(__assign({}, requiredScalarData), defaultData), defaultAssociations), inputData);
                            return [2 /*return*/, data];
                    }
                });
            });
        };
        var buildList = function (inputData) { return Promise.all((0, internal_1.normalizeList)(inputData).map(function (data) { return build(data); })); };
        var pickForConnect = function (inputData) { return ({
            id: inputData.id
        }); };
        var create = function () {
            var args_1 = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args_1[_i] = arguments[_i];
            }
            return __awaiter(_this, __spreadArray([], args_1, true), void 0, function (inputData) {
                var data;
                if (inputData === void 0) { inputData = {}; }
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, build(inputData).then(screen)];
                        case 1:
                            data = _a.sent();
                            return [4 /*yield*/, (0, internal_1.getClient)().userFlowMail.create({ data: data })];
                        case 2: return [2 /*return*/, _a.sent()];
                    }
                });
            });
        };
        var createList = function (inputData) { return Promise.all((0, internal_1.normalizeList)(inputData).map(function (data) { return create(data); })); };
        var createForConnect = function (inputData) {
            if (inputData === void 0) { inputData = {}; }
            return create(inputData).then(pickForConnect);
        };
        return {
            _factoryFor: "UserFlowMail",
            build: build,
            buildList: buildList,
            buildCreateInput: build,
            pickForConnect: pickForConnect,
            create: create,
            createList: createList,
            createForConnect: createForConnect,
        };
    };
    var factory = getFactoryWithTraits();
    var useTraits = function (name) {
        var names = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            names[_i - 1] = arguments[_i];
        }
        return getFactoryWithTraits(__spreadArray([name], names, true));
    };
    return __assign(__assign({}, factory), { use: useTraits });
}
/**
 * Define factory for {@link UserFlowMail} model.
 *
 * @param options
 * @returns factory {@link UserFlowMailFactoryInterface}
 */
function defineUserFlowMailFactory(options) {
    return defineUserFlowMailFactoryInternal(options !== null && options !== void 0 ? options : {});
}
exports.defineUserFlowMailFactory = defineUserFlowMailFactory;
function isSubscriptionFlowmemberPlanFactory(x) {
    return (x === null || x === void 0 ? void 0 : x._factoryFor) === "MemberPlan";
}
function autoGenerateSubscriptionFlowScalarsOrEnums(_a) {
    var seq = _a.seq;
    return {};
}
function defineSubscriptionFlowFactoryInternal(_a) {
    var _this = this;
    var defaultDataResolver = _a.defaultData, _b = _a.traits, traitsDefs = _b === void 0 ? {} : _b;
    var getFactoryWithTraits = function (traitKeys) {
        if (traitKeys === void 0) { traitKeys = []; }
        var seqKey = {};
        var getSeq = function () { return (0, internal_1.getSequenceCounter)(seqKey); };
        var screen = (0, internal_1.createScreener)("SubscriptionFlow", modelFieldDefinitions);
        var build = function () {
            var args_1 = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args_1[_i] = arguments[_i];
            }
            return __awaiter(_this, __spreadArray([], args_1, true), void 0, function (inputData) {
                var seq, requiredScalarData, resolveValue, defaultData, defaultAssociations, _a, data;
                var _b, _c;
                var _this = this;
                if (inputData === void 0) { inputData = {}; }
                return __generator(this, function (_d) {
                    switch (_d.label) {
                        case 0:
                            seq = getSeq();
                            requiredScalarData = autoGenerateSubscriptionFlowScalarsOrEnums({ seq: seq });
                            resolveValue = (0, internal_1.normalizeResolver)(defaultDataResolver !== null && defaultDataResolver !== void 0 ? defaultDataResolver : {});
                            return [4 /*yield*/, traitKeys.reduce(function (queue, traitKey) { return __awaiter(_this, void 0, void 0, function () {
                                    var acc, resolveTraitValue, traitData;
                                    var _a, _b;
                                    return __generator(this, function (_c) {
                                        switch (_c.label) {
                                            case 0: return [4 /*yield*/, queue];
                                            case 1:
                                                acc = _c.sent();
                                                resolveTraitValue = (0, internal_1.normalizeResolver)((_b = (_a = traitsDefs[traitKey]) === null || _a === void 0 ? void 0 : _a.data) !== null && _b !== void 0 ? _b : {});
                                                return [4 /*yield*/, resolveTraitValue({ seq: seq })];
                                            case 2:
                                                traitData = _c.sent();
                                                return [2 /*return*/, __assign(__assign({}, acc), traitData)];
                                        }
                                    });
                                }); }, resolveValue({ seq: seq }))];
                        case 1:
                            defaultData = _d.sent();
                            _b = {};
                            if (!isSubscriptionFlowmemberPlanFactory(defaultData.memberPlan)) return [3 /*break*/, 3];
                            _c = {};
                            return [4 /*yield*/, defaultData.memberPlan.build()];
                        case 2:
                            _a = (_c.create = _d.sent(),
                                _c);
                            return [3 /*break*/, 4];
                        case 3:
                            _a = defaultData.memberPlan;
                            _d.label = 4;
                        case 4:
                            defaultAssociations = (_b.memberPlan = _a,
                                _b);
                            data = __assign(__assign(__assign(__assign({}, requiredScalarData), defaultData), defaultAssociations), inputData);
                            return [2 /*return*/, data];
                    }
                });
            });
        };
        var buildList = function (inputData) { return Promise.all((0, internal_1.normalizeList)(inputData).map(function (data) { return build(data); })); };
        var pickForConnect = function (inputData) { return ({
            id: inputData.id
        }); };
        var create = function () {
            var args_1 = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args_1[_i] = arguments[_i];
            }
            return __awaiter(_this, __spreadArray([], args_1, true), void 0, function (inputData) {
                var data;
                if (inputData === void 0) { inputData = {}; }
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, build(inputData).then(screen)];
                        case 1:
                            data = _a.sent();
                            return [4 /*yield*/, (0, internal_1.getClient)().subscriptionFlow.create({ data: data })];
                        case 2: return [2 /*return*/, _a.sent()];
                    }
                });
            });
        };
        var createList = function (inputData) { return Promise.all((0, internal_1.normalizeList)(inputData).map(function (data) { return create(data); })); };
        var createForConnect = function (inputData) {
            if (inputData === void 0) { inputData = {}; }
            return create(inputData).then(pickForConnect);
        };
        return {
            _factoryFor: "SubscriptionFlow",
            build: build,
            buildList: buildList,
            buildCreateInput: build,
            pickForConnect: pickForConnect,
            create: create,
            createList: createList,
            createForConnect: createForConnect,
        };
    };
    var factory = getFactoryWithTraits();
    var useTraits = function (name) {
        var names = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            names[_i - 1] = arguments[_i];
        }
        return getFactoryWithTraits(__spreadArray([name], names, true));
    };
    return __assign(__assign({}, factory), { use: useTraits });
}
/**
 * Define factory for {@link SubscriptionFlow} model.
 *
 * @param options
 * @returns factory {@link SubscriptionFlowFactoryInterface}
 */
function defineSubscriptionFlowFactory(options) {
    return defineSubscriptionFlowFactoryInternal(options !== null && options !== void 0 ? options : {});
}
exports.defineSubscriptionFlowFactory = defineSubscriptionFlowFactory;
function isSubscriptionIntervalmailTemplateFactory(x) {
    return (x === null || x === void 0 ? void 0 : x._factoryFor) === "MailTemplate";
}
function isSubscriptionIntervalsubscriptionFlowFactory(x) {
    return (x === null || x === void 0 ? void 0 : x._factoryFor) === "SubscriptionFlow";
}
function autoGenerateSubscriptionIntervalScalarsOrEnums(_a) {
    var seq = _a.seq;
    return {
        event: "SUBSCRIBE"
    };
}
function defineSubscriptionIntervalFactoryInternal(_a) {
    var _this = this;
    var defaultDataResolver = _a.defaultData, _b = _a.traits, traitsDefs = _b === void 0 ? {} : _b;
    var getFactoryWithTraits = function (traitKeys) {
        if (traitKeys === void 0) { traitKeys = []; }
        var seqKey = {};
        var getSeq = function () { return (0, internal_1.getSequenceCounter)(seqKey); };
        var screen = (0, internal_1.createScreener)("SubscriptionInterval", modelFieldDefinitions);
        var build = function () {
            var args_1 = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args_1[_i] = arguments[_i];
            }
            return __awaiter(_this, __spreadArray([], args_1, true), void 0, function (inputData) {
                var seq, requiredScalarData, resolveValue, defaultData, defaultAssociations, _a, _b, data;
                var _c, _d, _e;
                var _this = this;
                if (inputData === void 0) { inputData = {}; }
                return __generator(this, function (_f) {
                    switch (_f.label) {
                        case 0:
                            seq = getSeq();
                            requiredScalarData = autoGenerateSubscriptionIntervalScalarsOrEnums({ seq: seq });
                            resolveValue = (0, internal_1.normalizeResolver)(defaultDataResolver !== null && defaultDataResolver !== void 0 ? defaultDataResolver : {});
                            return [4 /*yield*/, traitKeys.reduce(function (queue, traitKey) { return __awaiter(_this, void 0, void 0, function () {
                                    var acc, resolveTraitValue, traitData;
                                    var _a, _b;
                                    return __generator(this, function (_c) {
                                        switch (_c.label) {
                                            case 0: return [4 /*yield*/, queue];
                                            case 1:
                                                acc = _c.sent();
                                                resolveTraitValue = (0, internal_1.normalizeResolver)((_b = (_a = traitsDefs[traitKey]) === null || _a === void 0 ? void 0 : _a.data) !== null && _b !== void 0 ? _b : {});
                                                return [4 /*yield*/, resolveTraitValue({ seq: seq })];
                                            case 2:
                                                traitData = _c.sent();
                                                return [2 /*return*/, __assign(__assign({}, acc), traitData)];
                                        }
                                    });
                                }); }, resolveValue({ seq: seq }))];
                        case 1:
                            defaultData = _f.sent();
                            _c = {};
                            if (!isSubscriptionIntervalmailTemplateFactory(defaultData.mailTemplate)) return [3 /*break*/, 3];
                            _d = {};
                            return [4 /*yield*/, defaultData.mailTemplate.build()];
                        case 2:
                            _a = (_d.create = _f.sent(),
                                _d);
                            return [3 /*break*/, 4];
                        case 3:
                            _a = defaultData.mailTemplate;
                            _f.label = 4;
                        case 4:
                            _c.mailTemplate = _a;
                            if (!isSubscriptionIntervalsubscriptionFlowFactory(defaultData.subscriptionFlow)) return [3 /*break*/, 6];
                            _e = {};
                            return [4 /*yield*/, defaultData.subscriptionFlow.build()];
                        case 5:
                            _b = (_e.create = _f.sent(),
                                _e);
                            return [3 /*break*/, 7];
                        case 6:
                            _b = defaultData.subscriptionFlow;
                            _f.label = 7;
                        case 7:
                            defaultAssociations = (_c.subscriptionFlow = _b,
                                _c);
                            data = __assign(__assign(__assign(__assign({}, requiredScalarData), defaultData), defaultAssociations), inputData);
                            return [2 /*return*/, data];
                    }
                });
            });
        };
        var buildList = function (inputData) { return Promise.all((0, internal_1.normalizeList)(inputData).map(function (data) { return build(data); })); };
        var pickForConnect = function (inputData) { return ({
            id: inputData.id
        }); };
        var create = function () {
            var args_1 = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args_1[_i] = arguments[_i];
            }
            return __awaiter(_this, __spreadArray([], args_1, true), void 0, function (inputData) {
                var data;
                if (inputData === void 0) { inputData = {}; }
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, build(inputData).then(screen)];
                        case 1:
                            data = _a.sent();
                            return [4 /*yield*/, (0, internal_1.getClient)().subscriptionInterval.create({ data: data })];
                        case 2: return [2 /*return*/, _a.sent()];
                    }
                });
            });
        };
        var createList = function (inputData) { return Promise.all((0, internal_1.normalizeList)(inputData).map(function (data) { return create(data); })); };
        var createForConnect = function (inputData) {
            if (inputData === void 0) { inputData = {}; }
            return create(inputData).then(pickForConnect);
        };
        return {
            _factoryFor: "SubscriptionInterval",
            build: build,
            buildList: buildList,
            buildCreateInput: build,
            pickForConnect: pickForConnect,
            create: create,
            createList: createList,
            createForConnect: createForConnect,
        };
    };
    var factory = getFactoryWithTraits();
    var useTraits = function (name) {
        var names = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            names[_i - 1] = arguments[_i];
        }
        return getFactoryWithTraits(__spreadArray([name], names, true));
    };
    return __assign(__assign({}, factory), { use: useTraits });
}
/**
 * Define factory for {@link SubscriptionInterval} model.
 *
 * @param options
 * @returns factory {@link SubscriptionIntervalFactoryInterface}
 */
function defineSubscriptionIntervalFactory(options) {
    return defineSubscriptionIntervalFactoryInternal(options);
}
exports.defineSubscriptionIntervalFactory = defineSubscriptionIntervalFactory;
function autoGenerateMailTemplateScalarsOrEnums(_a) {
    var seq = _a.seq;
    return {
        name: (0, internal_1.getScalarFieldValueGenerator)().String({ modelName: "MailTemplate", fieldName: "name", isId: false, isUnique: false, seq: seq }),
        externalMailTemplateId: (0, internal_1.getScalarFieldValueGenerator)().String({ modelName: "MailTemplate", fieldName: "externalMailTemplateId", isId: false, isUnique: true, seq: seq })
    };
}
function defineMailTemplateFactoryInternal(_a) {
    var _this = this;
    var defaultDataResolver = _a.defaultData, _b = _a.traits, traitsDefs = _b === void 0 ? {} : _b;
    var getFactoryWithTraits = function (traitKeys) {
        if (traitKeys === void 0) { traitKeys = []; }
        var seqKey = {};
        var getSeq = function () { return (0, internal_1.getSequenceCounter)(seqKey); };
        var screen = (0, internal_1.createScreener)("MailTemplate", modelFieldDefinitions);
        var build = function () {
            var args_1 = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args_1[_i] = arguments[_i];
            }
            return __awaiter(_this, __spreadArray([], args_1, true), void 0, function (inputData) {
                var seq, requiredScalarData, resolveValue, defaultData, defaultAssociations, data;
                var _this = this;
                if (inputData === void 0) { inputData = {}; }
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            seq = getSeq();
                            requiredScalarData = autoGenerateMailTemplateScalarsOrEnums({ seq: seq });
                            resolveValue = (0, internal_1.normalizeResolver)(defaultDataResolver !== null && defaultDataResolver !== void 0 ? defaultDataResolver : {});
                            return [4 /*yield*/, traitKeys.reduce(function (queue, traitKey) { return __awaiter(_this, void 0, void 0, function () {
                                    var acc, resolveTraitValue, traitData;
                                    var _a, _b;
                                    return __generator(this, function (_c) {
                                        switch (_c.label) {
                                            case 0: return [4 /*yield*/, queue];
                                            case 1:
                                                acc = _c.sent();
                                                resolveTraitValue = (0, internal_1.normalizeResolver)((_b = (_a = traitsDefs[traitKey]) === null || _a === void 0 ? void 0 : _a.data) !== null && _b !== void 0 ? _b : {});
                                                return [4 /*yield*/, resolveTraitValue({ seq: seq })];
                                            case 2:
                                                traitData = _c.sent();
                                                return [2 /*return*/, __assign(__assign({}, acc), traitData)];
                                        }
                                    });
                                }); }, resolveValue({ seq: seq }))];
                        case 1:
                            defaultData = _a.sent();
                            defaultAssociations = {};
                            data = __assign(__assign(__assign(__assign({}, requiredScalarData), defaultData), defaultAssociations), inputData);
                            return [2 /*return*/, data];
                    }
                });
            });
        };
        var buildList = function (inputData) { return Promise.all((0, internal_1.normalizeList)(inputData).map(function (data) { return build(data); })); };
        var pickForConnect = function (inputData) { return ({
            id: inputData.id
        }); };
        var create = function () {
            var args_1 = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args_1[_i] = arguments[_i];
            }
            return __awaiter(_this, __spreadArray([], args_1, true), void 0, function (inputData) {
                var data;
                if (inputData === void 0) { inputData = {}; }
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, build(inputData).then(screen)];
                        case 1:
                            data = _a.sent();
                            return [4 /*yield*/, (0, internal_1.getClient)().mailTemplate.create({ data: data })];
                        case 2: return [2 /*return*/, _a.sent()];
                    }
                });
            });
        };
        var createList = function (inputData) { return Promise.all((0, internal_1.normalizeList)(inputData).map(function (data) { return create(data); })); };
        var createForConnect = function (inputData) {
            if (inputData === void 0) { inputData = {}; }
            return create(inputData).then(pickForConnect);
        };
        return {
            _factoryFor: "MailTemplate",
            build: build,
            buildList: buildList,
            buildCreateInput: build,
            pickForConnect: pickForConnect,
            create: create,
            createList: createList,
            createForConnect: createForConnect,
        };
    };
    var factory = getFactoryWithTraits();
    var useTraits = function (name) {
        var names = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            names[_i - 1] = arguments[_i];
        }
        return getFactoryWithTraits(__spreadArray([name], names, true));
    };
    return __assign(__assign({}, factory), { use: useTraits });
}
/**
 * Define factory for {@link MailTemplate} model.
 *
 * @param options
 * @returns factory {@link MailTemplateFactoryInterface}
 */
function defineMailTemplateFactory(options) {
    return defineMailTemplateFactoryInternal(options !== null && options !== void 0 ? options : {});
}
exports.defineMailTemplateFactory = defineMailTemplateFactory;
function autoGeneratePeriodicJobScalarsOrEnums(_a) {
    var seq = _a.seq;
    return {
        date: (0, internal_1.getScalarFieldValueGenerator)().DateTime({ modelName: "PeriodicJob", fieldName: "date", isId: false, isUnique: true, seq: seq })
    };
}
function definePeriodicJobFactoryInternal(_a) {
    var _this = this;
    var defaultDataResolver = _a.defaultData, _b = _a.traits, traitsDefs = _b === void 0 ? {} : _b;
    var getFactoryWithTraits = function (traitKeys) {
        if (traitKeys === void 0) { traitKeys = []; }
        var seqKey = {};
        var getSeq = function () { return (0, internal_1.getSequenceCounter)(seqKey); };
        var screen = (0, internal_1.createScreener)("PeriodicJob", modelFieldDefinitions);
        var build = function () {
            var args_1 = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args_1[_i] = arguments[_i];
            }
            return __awaiter(_this, __spreadArray([], args_1, true), void 0, function (inputData) {
                var seq, requiredScalarData, resolveValue, defaultData, defaultAssociations, data;
                var _this = this;
                if (inputData === void 0) { inputData = {}; }
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            seq = getSeq();
                            requiredScalarData = autoGeneratePeriodicJobScalarsOrEnums({ seq: seq });
                            resolveValue = (0, internal_1.normalizeResolver)(defaultDataResolver !== null && defaultDataResolver !== void 0 ? defaultDataResolver : {});
                            return [4 /*yield*/, traitKeys.reduce(function (queue, traitKey) { return __awaiter(_this, void 0, void 0, function () {
                                    var acc, resolveTraitValue, traitData;
                                    var _a, _b;
                                    return __generator(this, function (_c) {
                                        switch (_c.label) {
                                            case 0: return [4 /*yield*/, queue];
                                            case 1:
                                                acc = _c.sent();
                                                resolveTraitValue = (0, internal_1.normalizeResolver)((_b = (_a = traitsDefs[traitKey]) === null || _a === void 0 ? void 0 : _a.data) !== null && _b !== void 0 ? _b : {});
                                                return [4 /*yield*/, resolveTraitValue({ seq: seq })];
                                            case 2:
                                                traitData = _c.sent();
                                                return [2 /*return*/, __assign(__assign({}, acc), traitData)];
                                        }
                                    });
                                }); }, resolveValue({ seq: seq }))];
                        case 1:
                            defaultData = _a.sent();
                            defaultAssociations = {};
                            data = __assign(__assign(__assign(__assign({}, requiredScalarData), defaultData), defaultAssociations), inputData);
                            return [2 /*return*/, data];
                    }
                });
            });
        };
        var buildList = function (inputData) { return Promise.all((0, internal_1.normalizeList)(inputData).map(function (data) { return build(data); })); };
        var pickForConnect = function (inputData) { return ({
            id: inputData.id
        }); };
        var create = function () {
            var args_1 = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args_1[_i] = arguments[_i];
            }
            return __awaiter(_this, __spreadArray([], args_1, true), void 0, function (inputData) {
                var data;
                if (inputData === void 0) { inputData = {}; }
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, build(inputData).then(screen)];
                        case 1:
                            data = _a.sent();
                            return [4 /*yield*/, (0, internal_1.getClient)().periodicJob.create({ data: data })];
                        case 2: return [2 /*return*/, _a.sent()];
                    }
                });
            });
        };
        var createList = function (inputData) { return Promise.all((0, internal_1.normalizeList)(inputData).map(function (data) { return create(data); })); };
        var createForConnect = function (inputData) {
            if (inputData === void 0) { inputData = {}; }
            return create(inputData).then(pickForConnect);
        };
        return {
            _factoryFor: "PeriodicJob",
            build: build,
            buildList: buildList,
            buildCreateInput: build,
            pickForConnect: pickForConnect,
            create: create,
            createList: createList,
            createForConnect: createForConnect,
        };
    };
    var factory = getFactoryWithTraits();
    var useTraits = function (name) {
        var names = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            names[_i - 1] = arguments[_i];
        }
        return getFactoryWithTraits(__spreadArray([name], names, true));
    };
    return __assign(__assign({}, factory), { use: useTraits });
}
/**
 * Define factory for {@link PeriodicJob} model.
 *
 * @param options
 * @returns factory {@link PeriodicJobFactoryInterface}
 */
function definePeriodicJobFactory(options) {
    return definePeriodicJobFactoryInternal(options !== null && options !== void 0 ? options : {});
}
exports.definePeriodicJobFactory = definePeriodicJobFactory;
function autoGenerateBlockStyleScalarsOrEnums(_a) {
    var seq = _a.seq;
    return {
        name: (0, internal_1.getScalarFieldValueGenerator)().String({ modelName: "BlockStyle", fieldName: "name", isId: false, isUnique: true, seq: seq })
    };
}
function defineBlockStyleFactoryInternal(_a) {
    var _this = this;
    var defaultDataResolver = _a.defaultData, _b = _a.traits, traitsDefs = _b === void 0 ? {} : _b;
    var getFactoryWithTraits = function (traitKeys) {
        if (traitKeys === void 0) { traitKeys = []; }
        var seqKey = {};
        var getSeq = function () { return (0, internal_1.getSequenceCounter)(seqKey); };
        var screen = (0, internal_1.createScreener)("BlockStyle", modelFieldDefinitions);
        var build = function () {
            var args_1 = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args_1[_i] = arguments[_i];
            }
            return __awaiter(_this, __spreadArray([], args_1, true), void 0, function (inputData) {
                var seq, requiredScalarData, resolveValue, defaultData, defaultAssociations, data;
                var _this = this;
                if (inputData === void 0) { inputData = {}; }
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            seq = getSeq();
                            requiredScalarData = autoGenerateBlockStyleScalarsOrEnums({ seq: seq });
                            resolveValue = (0, internal_1.normalizeResolver)(defaultDataResolver !== null && defaultDataResolver !== void 0 ? defaultDataResolver : {});
                            return [4 /*yield*/, traitKeys.reduce(function (queue, traitKey) { return __awaiter(_this, void 0, void 0, function () {
                                    var acc, resolveTraitValue, traitData;
                                    var _a, _b;
                                    return __generator(this, function (_c) {
                                        switch (_c.label) {
                                            case 0: return [4 /*yield*/, queue];
                                            case 1:
                                                acc = _c.sent();
                                                resolveTraitValue = (0, internal_1.normalizeResolver)((_b = (_a = traitsDefs[traitKey]) === null || _a === void 0 ? void 0 : _a.data) !== null && _b !== void 0 ? _b : {});
                                                return [4 /*yield*/, resolveTraitValue({ seq: seq })];
                                            case 2:
                                                traitData = _c.sent();
                                                return [2 /*return*/, __assign(__assign({}, acc), traitData)];
                                        }
                                    });
                                }); }, resolveValue({ seq: seq }))];
                        case 1:
                            defaultData = _a.sent();
                            defaultAssociations = {};
                            data = __assign(__assign(__assign(__assign({}, requiredScalarData), defaultData), defaultAssociations), inputData);
                            return [2 /*return*/, data];
                    }
                });
            });
        };
        var buildList = function (inputData) { return Promise.all((0, internal_1.normalizeList)(inputData).map(function (data) { return build(data); })); };
        var pickForConnect = function (inputData) { return ({
            id: inputData.id
        }); };
        var create = function () {
            var args_1 = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args_1[_i] = arguments[_i];
            }
            return __awaiter(_this, __spreadArray([], args_1, true), void 0, function (inputData) {
                var data;
                if (inputData === void 0) { inputData = {}; }
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, build(inputData).then(screen)];
                        case 1:
                            data = _a.sent();
                            return [4 /*yield*/, (0, internal_1.getClient)().blockStyle.create({ data: data })];
                        case 2: return [2 /*return*/, _a.sent()];
                    }
                });
            });
        };
        var createList = function (inputData) { return Promise.all((0, internal_1.normalizeList)(inputData).map(function (data) { return create(data); })); };
        var createForConnect = function (inputData) {
            if (inputData === void 0) { inputData = {}; }
            return create(inputData).then(pickForConnect);
        };
        return {
            _factoryFor: "BlockStyle",
            build: build,
            buildList: buildList,
            buildCreateInput: build,
            pickForConnect: pickForConnect,
            create: create,
            createList: createList,
            createForConnect: createForConnect,
        };
    };
    var factory = getFactoryWithTraits();
    var useTraits = function (name) {
        var names = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            names[_i - 1] = arguments[_i];
        }
        return getFactoryWithTraits(__spreadArray([name], names, true));
    };
    return __assign(__assign({}, factory), { use: useTraits });
}
/**
 * Define factory for {@link BlockStyle} model.
 *
 * @param options
 * @returns factory {@link BlockStyleFactoryInterface}
 */
function defineBlockStyleFactory(options) {
    return defineBlockStyleFactoryInternal(options !== null && options !== void 0 ? options : {});
}
exports.defineBlockStyleFactory = defineBlockStyleFactory;
function isBannerimageFactory(x) {
    return (x === null || x === void 0 ? void 0 : x._factoryFor) === "Image";
}
function autoGenerateBannerScalarsOrEnums(_a) {
    var seq = _a.seq;
    return {
        title: (0, internal_1.getScalarFieldValueGenerator)().String({ modelName: "Banner", fieldName: "title", isId: false, isUnique: false, seq: seq }),
        text: (0, internal_1.getScalarFieldValueGenerator)().String({ modelName: "Banner", fieldName: "text", isId: false, isUnique: false, seq: seq })
    };
}
function defineBannerFactoryInternal(_a) {
    var _this = this;
    var defaultDataResolver = _a.defaultData, _b = _a.traits, traitsDefs = _b === void 0 ? {} : _b;
    var getFactoryWithTraits = function (traitKeys) {
        if (traitKeys === void 0) { traitKeys = []; }
        var seqKey = {};
        var getSeq = function () { return (0, internal_1.getSequenceCounter)(seqKey); };
        var screen = (0, internal_1.createScreener)("Banner", modelFieldDefinitions);
        var build = function () {
            var args_1 = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args_1[_i] = arguments[_i];
            }
            return __awaiter(_this, __spreadArray([], args_1, true), void 0, function (inputData) {
                var seq, requiredScalarData, resolveValue, defaultData, defaultAssociations, _a, data;
                var _b, _c;
                var _this = this;
                if (inputData === void 0) { inputData = {}; }
                return __generator(this, function (_d) {
                    switch (_d.label) {
                        case 0:
                            seq = getSeq();
                            requiredScalarData = autoGenerateBannerScalarsOrEnums({ seq: seq });
                            resolveValue = (0, internal_1.normalizeResolver)(defaultDataResolver !== null && defaultDataResolver !== void 0 ? defaultDataResolver : {});
                            return [4 /*yield*/, traitKeys.reduce(function (queue, traitKey) { return __awaiter(_this, void 0, void 0, function () {
                                    var acc, resolveTraitValue, traitData;
                                    var _a, _b;
                                    return __generator(this, function (_c) {
                                        switch (_c.label) {
                                            case 0: return [4 /*yield*/, queue];
                                            case 1:
                                                acc = _c.sent();
                                                resolveTraitValue = (0, internal_1.normalizeResolver)((_b = (_a = traitsDefs[traitKey]) === null || _a === void 0 ? void 0 : _a.data) !== null && _b !== void 0 ? _b : {});
                                                return [4 /*yield*/, resolveTraitValue({ seq: seq })];
                                            case 2:
                                                traitData = _c.sent();
                                                return [2 /*return*/, __assign(__assign({}, acc), traitData)];
                                        }
                                    });
                                }); }, resolveValue({ seq: seq }))];
                        case 1:
                            defaultData = _d.sent();
                            _b = {};
                            if (!isBannerimageFactory(defaultData.image)) return [3 /*break*/, 3];
                            _c = {};
                            return [4 /*yield*/, defaultData.image.build()];
                        case 2:
                            _a = (_c.create = _d.sent(),
                                _c);
                            return [3 /*break*/, 4];
                        case 3:
                            _a = defaultData.image;
                            _d.label = 4;
                        case 4:
                            defaultAssociations = (_b.image = _a,
                                _b);
                            data = __assign(__assign(__assign(__assign({}, requiredScalarData), defaultData), defaultAssociations), inputData);
                            return [2 /*return*/, data];
                    }
                });
            });
        };
        var buildList = function (inputData) { return Promise.all((0, internal_1.normalizeList)(inputData).map(function (data) { return build(data); })); };
        var pickForConnect = function (inputData) { return ({
            id: inputData.id
        }); };
        var create = function () {
            var args_1 = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args_1[_i] = arguments[_i];
            }
            return __awaiter(_this, __spreadArray([], args_1, true), void 0, function (inputData) {
                var data;
                if (inputData === void 0) { inputData = {}; }
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, build(inputData).then(screen)];
                        case 1:
                            data = _a.sent();
                            return [4 /*yield*/, (0, internal_1.getClient)().banner.create({ data: data })];
                        case 2: return [2 /*return*/, _a.sent()];
                    }
                });
            });
        };
        var createList = function (inputData) { return Promise.all((0, internal_1.normalizeList)(inputData).map(function (data) { return create(data); })); };
        var createForConnect = function (inputData) {
            if (inputData === void 0) { inputData = {}; }
            return create(inputData).then(pickForConnect);
        };
        return {
            _factoryFor: "Banner",
            build: build,
            buildList: buildList,
            buildCreateInput: build,
            pickForConnect: pickForConnect,
            create: create,
            createList: createList,
            createForConnect: createForConnect,
        };
    };
    var factory = getFactoryWithTraits();
    var useTraits = function (name) {
        var names = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            names[_i - 1] = arguments[_i];
        }
        return getFactoryWithTraits(__spreadArray([name], names, true));
    };
    return __assign(__assign({}, factory), { use: useTraits });
}
/**
 * Define factory for {@link Banner} model.
 *
 * @param options
 * @returns factory {@link BannerFactoryInterface}
 */
function defineBannerFactory(options) {
    return defineBannerFactoryInternal(options !== null && options !== void 0 ? options : {});
}
exports.defineBannerFactory = defineBannerFactory;
function isBannerActionbannerFactory(x) {
    return (x === null || x === void 0 ? void 0 : x._factoryFor) === "Banner";
}
function autoGenerateBannerActionScalarsOrEnums(_a) {
    var seq = _a.seq;
    return {
        label: (0, internal_1.getScalarFieldValueGenerator)().String({ modelName: "BannerAction", fieldName: "label", isId: false, isUnique: false, seq: seq }),
        url: (0, internal_1.getScalarFieldValueGenerator)().String({ modelName: "BannerAction", fieldName: "url", isId: false, isUnique: false, seq: seq })
    };
}
function defineBannerActionFactoryInternal(_a) {
    var _this = this;
    var defaultDataResolver = _a.defaultData, _b = _a.traits, traitsDefs = _b === void 0 ? {} : _b;
    var getFactoryWithTraits = function (traitKeys) {
        if (traitKeys === void 0) { traitKeys = []; }
        var seqKey = {};
        var getSeq = function () { return (0, internal_1.getSequenceCounter)(seqKey); };
        var screen = (0, internal_1.createScreener)("BannerAction", modelFieldDefinitions);
        var build = function () {
            var args_1 = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args_1[_i] = arguments[_i];
            }
            return __awaiter(_this, __spreadArray([], args_1, true), void 0, function (inputData) {
                var seq, requiredScalarData, resolveValue, defaultData, defaultAssociations, _a, data;
                var _b, _c;
                var _this = this;
                if (inputData === void 0) { inputData = {}; }
                return __generator(this, function (_d) {
                    switch (_d.label) {
                        case 0:
                            seq = getSeq();
                            requiredScalarData = autoGenerateBannerActionScalarsOrEnums({ seq: seq });
                            resolveValue = (0, internal_1.normalizeResolver)(defaultDataResolver !== null && defaultDataResolver !== void 0 ? defaultDataResolver : {});
                            return [4 /*yield*/, traitKeys.reduce(function (queue, traitKey) { return __awaiter(_this, void 0, void 0, function () {
                                    var acc, resolveTraitValue, traitData;
                                    var _a, _b;
                                    return __generator(this, function (_c) {
                                        switch (_c.label) {
                                            case 0: return [4 /*yield*/, queue];
                                            case 1:
                                                acc = _c.sent();
                                                resolveTraitValue = (0, internal_1.normalizeResolver)((_b = (_a = traitsDefs[traitKey]) === null || _a === void 0 ? void 0 : _a.data) !== null && _b !== void 0 ? _b : {});
                                                return [4 /*yield*/, resolveTraitValue({ seq: seq })];
                                            case 2:
                                                traitData = _c.sent();
                                                return [2 /*return*/, __assign(__assign({}, acc), traitData)];
                                        }
                                    });
                                }); }, resolveValue({ seq: seq }))];
                        case 1:
                            defaultData = _d.sent();
                            _b = {};
                            if (!isBannerActionbannerFactory(defaultData.banner)) return [3 /*break*/, 3];
                            _c = {};
                            return [4 /*yield*/, defaultData.banner.build()];
                        case 2:
                            _a = (_c.create = _d.sent(),
                                _c);
                            return [3 /*break*/, 4];
                        case 3:
                            _a = defaultData.banner;
                            _d.label = 4;
                        case 4:
                            defaultAssociations = (_b.banner = _a,
                                _b);
                            data = __assign(__assign(__assign(__assign({}, requiredScalarData), defaultData), defaultAssociations), inputData);
                            return [2 /*return*/, data];
                    }
                });
            });
        };
        var buildList = function (inputData) { return Promise.all((0, internal_1.normalizeList)(inputData).map(function (data) { return build(data); })); };
        var pickForConnect = function (inputData) { return ({
            id: inputData.id
        }); };
        var create = function () {
            var args_1 = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args_1[_i] = arguments[_i];
            }
            return __awaiter(_this, __spreadArray([], args_1, true), void 0, function (inputData) {
                var data;
                if (inputData === void 0) { inputData = {}; }
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, build(inputData).then(screen)];
                        case 1:
                            data = _a.sent();
                            return [4 /*yield*/, (0, internal_1.getClient)().bannerAction.create({ data: data })];
                        case 2: return [2 /*return*/, _a.sent()];
                    }
                });
            });
        };
        var createList = function (inputData) { return Promise.all((0, internal_1.normalizeList)(inputData).map(function (data) { return create(data); })); };
        var createForConnect = function (inputData) {
            if (inputData === void 0) { inputData = {}; }
            return create(inputData).then(pickForConnect);
        };
        return {
            _factoryFor: "BannerAction",
            build: build,
            buildList: buildList,
            buildCreateInput: build,
            pickForConnect: pickForConnect,
            create: create,
            createList: createList,
            createForConnect: createForConnect,
        };
    };
    var factory = getFactoryWithTraits();
    var useTraits = function (name) {
        var names = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            names[_i - 1] = arguments[_i];
        }
        return getFactoryWithTraits(__spreadArray([name], names, true));
    };
    return __assign(__assign({}, factory), { use: useTraits });
}
/**
 * Define factory for {@link BannerAction} model.
 *
 * @param options
 * @returns factory {@link BannerActionFactoryInterface}
 */
function defineBannerActionFactory(options) {
    return defineBannerActionFactoryInternal(options);
}
exports.defineBannerActionFactory = defineBannerActionFactory;
function autoGenerateCrowdfundingScalarsOrEnums(_a) {
    var seq = _a.seq;
    return {
        name: (0, internal_1.getScalarFieldValueGenerator)().String({ modelName: "Crowdfunding", fieldName: "name", isId: false, isUnique: false, seq: seq })
    };
}
function defineCrowdfundingFactoryInternal(_a) {
    var _this = this;
    var defaultDataResolver = _a.defaultData, _b = _a.traits, traitsDefs = _b === void 0 ? {} : _b;
    var getFactoryWithTraits = function (traitKeys) {
        if (traitKeys === void 0) { traitKeys = []; }
        var seqKey = {};
        var getSeq = function () { return (0, internal_1.getSequenceCounter)(seqKey); };
        var screen = (0, internal_1.createScreener)("Crowdfunding", modelFieldDefinitions);
        var build = function () {
            var args_1 = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args_1[_i] = arguments[_i];
            }
            return __awaiter(_this, __spreadArray([], args_1, true), void 0, function (inputData) {
                var seq, requiredScalarData, resolveValue, defaultData, defaultAssociations, data;
                var _this = this;
                if (inputData === void 0) { inputData = {}; }
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            seq = getSeq();
                            requiredScalarData = autoGenerateCrowdfundingScalarsOrEnums({ seq: seq });
                            resolveValue = (0, internal_1.normalizeResolver)(defaultDataResolver !== null && defaultDataResolver !== void 0 ? defaultDataResolver : {});
                            return [4 /*yield*/, traitKeys.reduce(function (queue, traitKey) { return __awaiter(_this, void 0, void 0, function () {
                                    var acc, resolveTraitValue, traitData;
                                    var _a, _b;
                                    return __generator(this, function (_c) {
                                        switch (_c.label) {
                                            case 0: return [4 /*yield*/, queue];
                                            case 1:
                                                acc = _c.sent();
                                                resolveTraitValue = (0, internal_1.normalizeResolver)((_b = (_a = traitsDefs[traitKey]) === null || _a === void 0 ? void 0 : _a.data) !== null && _b !== void 0 ? _b : {});
                                                return [4 /*yield*/, resolveTraitValue({ seq: seq })];
                                            case 2:
                                                traitData = _c.sent();
                                                return [2 /*return*/, __assign(__assign({}, acc), traitData)];
                                        }
                                    });
                                }); }, resolveValue({ seq: seq }))];
                        case 1:
                            defaultData = _a.sent();
                            defaultAssociations = {};
                            data = __assign(__assign(__assign(__assign({}, requiredScalarData), defaultData), defaultAssociations), inputData);
                            return [2 /*return*/, data];
                    }
                });
            });
        };
        var buildList = function (inputData) { return Promise.all((0, internal_1.normalizeList)(inputData).map(function (data) { return build(data); })); };
        var pickForConnect = function (inputData) { return ({
            id: inputData.id
        }); };
        var create = function () {
            var args_1 = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args_1[_i] = arguments[_i];
            }
            return __awaiter(_this, __spreadArray([], args_1, true), void 0, function (inputData) {
                var data;
                if (inputData === void 0) { inputData = {}; }
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, build(inputData).then(screen)];
                        case 1:
                            data = _a.sent();
                            return [4 /*yield*/, (0, internal_1.getClient)().crowdfunding.create({ data: data })];
                        case 2: return [2 /*return*/, _a.sent()];
                    }
                });
            });
        };
        var createList = function (inputData) { return Promise.all((0, internal_1.normalizeList)(inputData).map(function (data) { return create(data); })); };
        var createForConnect = function (inputData) {
            if (inputData === void 0) { inputData = {}; }
            return create(inputData).then(pickForConnect);
        };
        return {
            _factoryFor: "Crowdfunding",
            build: build,
            buildList: buildList,
            buildCreateInput: build,
            pickForConnect: pickForConnect,
            create: create,
            createList: createList,
            createForConnect: createForConnect,
        };
    };
    var factory = getFactoryWithTraits();
    var useTraits = function (name) {
        var names = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            names[_i - 1] = arguments[_i];
        }
        return getFactoryWithTraits(__spreadArray([name], names, true));
    };
    return __assign(__assign({}, factory), { use: useTraits });
}
/**
 * Define factory for {@link Crowdfunding} model.
 *
 * @param options
 * @returns factory {@link CrowdfundingFactoryInterface}
 */
function defineCrowdfundingFactory(options) {
    return defineCrowdfundingFactoryInternal(options !== null && options !== void 0 ? options : {});
}
exports.defineCrowdfundingFactory = defineCrowdfundingFactory;
function isCrowdfundingGoalCrowdfundingFactory(x) {
    return (x === null || x === void 0 ? void 0 : x._factoryFor) === "Crowdfunding";
}
function autoGenerateCrowdfundingGoalScalarsOrEnums(_a) {
    var seq = _a.seq;
    return {
        title: (0, internal_1.getScalarFieldValueGenerator)().String({ modelName: "CrowdfundingGoal", fieldName: "title", isId: false, isUnique: false, seq: seq }),
        amount: (0, internal_1.getScalarFieldValueGenerator)().Int({ modelName: "CrowdfundingGoal", fieldName: "amount", isId: false, isUnique: false, seq: seq })
    };
}
function defineCrowdfundingGoalFactoryInternal(_a) {
    var _this = this;
    var defaultDataResolver = _a.defaultData, _b = _a.traits, traitsDefs = _b === void 0 ? {} : _b;
    var getFactoryWithTraits = function (traitKeys) {
        if (traitKeys === void 0) { traitKeys = []; }
        var seqKey = {};
        var getSeq = function () { return (0, internal_1.getSequenceCounter)(seqKey); };
        var screen = (0, internal_1.createScreener)("CrowdfundingGoal", modelFieldDefinitions);
        var build = function () {
            var args_1 = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args_1[_i] = arguments[_i];
            }
            return __awaiter(_this, __spreadArray([], args_1, true), void 0, function (inputData) {
                var seq, requiredScalarData, resolveValue, defaultData, defaultAssociations, _a, data;
                var _b, _c;
                var _this = this;
                if (inputData === void 0) { inputData = {}; }
                return __generator(this, function (_d) {
                    switch (_d.label) {
                        case 0:
                            seq = getSeq();
                            requiredScalarData = autoGenerateCrowdfundingGoalScalarsOrEnums({ seq: seq });
                            resolveValue = (0, internal_1.normalizeResolver)(defaultDataResolver !== null && defaultDataResolver !== void 0 ? defaultDataResolver : {});
                            return [4 /*yield*/, traitKeys.reduce(function (queue, traitKey) { return __awaiter(_this, void 0, void 0, function () {
                                    var acc, resolveTraitValue, traitData;
                                    var _a, _b;
                                    return __generator(this, function (_c) {
                                        switch (_c.label) {
                                            case 0: return [4 /*yield*/, queue];
                                            case 1:
                                                acc = _c.sent();
                                                resolveTraitValue = (0, internal_1.normalizeResolver)((_b = (_a = traitsDefs[traitKey]) === null || _a === void 0 ? void 0 : _a.data) !== null && _b !== void 0 ? _b : {});
                                                return [4 /*yield*/, resolveTraitValue({ seq: seq })];
                                            case 2:
                                                traitData = _c.sent();
                                                return [2 /*return*/, __assign(__assign({}, acc), traitData)];
                                        }
                                    });
                                }); }, resolveValue({ seq: seq }))];
                        case 1:
                            defaultData = _d.sent();
                            _b = {};
                            if (!isCrowdfundingGoalCrowdfundingFactory(defaultData.Crowdfunding)) return [3 /*break*/, 3];
                            _c = {};
                            return [4 /*yield*/, defaultData.Crowdfunding.build()];
                        case 2:
                            _a = (_c.create = _d.sent(),
                                _c);
                            return [3 /*break*/, 4];
                        case 3:
                            _a = defaultData.Crowdfunding;
                            _d.label = 4;
                        case 4:
                            defaultAssociations = (_b.Crowdfunding = _a,
                                _b);
                            data = __assign(__assign(__assign(__assign({}, requiredScalarData), defaultData), defaultAssociations), inputData);
                            return [2 /*return*/, data];
                    }
                });
            });
        };
        var buildList = function (inputData) { return Promise.all((0, internal_1.normalizeList)(inputData).map(function (data) { return build(data); })); };
        var pickForConnect = function (inputData) { return ({
            id: inputData.id
        }); };
        var create = function () {
            var args_1 = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args_1[_i] = arguments[_i];
            }
            return __awaiter(_this, __spreadArray([], args_1, true), void 0, function (inputData) {
                var data;
                if (inputData === void 0) { inputData = {}; }
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, build(inputData).then(screen)];
                        case 1:
                            data = _a.sent();
                            return [4 /*yield*/, (0, internal_1.getClient)().crowdfundingGoal.create({ data: data })];
                        case 2: return [2 /*return*/, _a.sent()];
                    }
                });
            });
        };
        var createList = function (inputData) { return Promise.all((0, internal_1.normalizeList)(inputData).map(function (data) { return create(data); })); };
        var createForConnect = function (inputData) {
            if (inputData === void 0) { inputData = {}; }
            return create(inputData).then(pickForConnect);
        };
        return {
            _factoryFor: "CrowdfundingGoal",
            build: build,
            buildList: buildList,
            buildCreateInput: build,
            pickForConnect: pickForConnect,
            create: create,
            createList: createList,
            createForConnect: createForConnect,
        };
    };
    var factory = getFactoryWithTraits();
    var useTraits = function (name) {
        var names = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            names[_i - 1] = arguments[_i];
        }
        return getFactoryWithTraits(__spreadArray([name], names, true));
    };
    return __assign(__assign({}, factory), { use: useTraits });
}
/**
 * Define factory for {@link CrowdfundingGoal} model.
 *
 * @param options
 * @returns factory {@link CrowdfundingGoalFactoryInterface}
 */
function defineCrowdfundingGoalFactory(options) {
    return defineCrowdfundingGoalFactoryInternal(options);
}
exports.defineCrowdfundingGoalFactory = defineCrowdfundingGoalFactory;
