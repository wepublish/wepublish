"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PeerIdMissingCommentError = exports.AlreadyUnpaidInvoices = exports.SubscriptionNotFound = exports.PollClosedError = exports.PollNotOpenError = exports.InvalidStarRatingValueError = exports.InvalidSettingValueError = exports.UserIdNotFound = exports.GivenTokeExpiryToLongError = exports.UserSubscriptionAlreadyDeactivated = exports.InternalError = exports.PeerTokenInvalidError = exports.ChallengeMissingCommentError = exports.AnonymousCommentError = exports.AnonymousPollVotingDisabledError = exports.AnonymousCommentRatingDisabledError = exports.AnonymousCommentsDisabledError = exports.CommentAuthenticationError = exports.CommentLengthError = exports.DuplicateArticleSlugError = exports.DuplicatePageSlugError = exports.DisabledPeerError = exports.UserInputError = exports.PaymentConfigurationNotAllowed = exports.MonthlyAmountNotEnough = exports.EmailAlreadyInUseError = exports.NotFound = exports.NotActiveError = exports.NotAuthenticatedError = exports.NotAuthorisedError = exports.OAuth2ProviderNotFoundError = exports.InvalidOAuth2TokenError = exports.UserNotFoundError = exports.InvalidCredentialsError = exports.TokenExpiredError = exports.ErrorCode = void 0;
const apollo_server_express_1 = require("apollo-server-express");
const utility_1 = require("./utility");
var ErrorCode;
(function (ErrorCode) {
    ErrorCode["TokenExpired"] = "TOKEN_EXPIRED";
    ErrorCode["InvalidCredentials"] = "INVALID_CREDENTIALS";
    ErrorCode["UserNotFound"] = "USER_NOT_FOUND";
    ErrorCode["InvalidOAuth2Token"] = "INVALID_OAUTH_TOKEN";
    ErrorCode["OAuth2ProviderNotFound"] = "OAUTH2_PROVIDER_NOT_FOUND";
    ErrorCode["NotAuthenticated"] = "NOT_AUTHENTICATED";
    ErrorCode["NotAuthorised"] = "NOT_AUTHORISED";
    ErrorCode["UserNotActive"] = "USER_NOT_ACTIVE";
    ErrorCode["NotFound"] = "NOT_FOUND";
    ErrorCode["EmailAlreadyInUse"] = "EMAIL_ALREADY_IN_USE";
    ErrorCode["MonthlyAmountNotEnough"] = "MONTHLY_AMOUNT_NOT_ENOUGH";
    ErrorCode["PaymentConfigurationNotAllowed"] = "PAYMENT_CONFIGURATION_NOT_ALLOWED";
    ErrorCode["UserInputError"] = "USER_INPUT_ERROR";
    ErrorCode["DuplicatePageSlug"] = "DUPLICATE_PAGE_SLUG";
    ErrorCode["CommentLengthError"] = "COMMENT_LENGTH_ERROR";
    ErrorCode["PeerTokenInvalid"] = "PEER_TOKEN_INVALID";
    ErrorCode["InternalError"] = "InternalError";
    ErrorCode["DisabledPeerError"] = "DISABLED_PEER_ERROR";
    ErrorCode["UserSubscriptionAlreadyDeactivated"] = "USER_SUBSCRIPTION_ALREADY_DEACTIVATED";
    ErrorCode["ChallengeFailed"] = "ChallengeFailed";
    ErrorCode["InvalidSettingData"] = "INVALID_SETTING_DATA";
})(ErrorCode = exports.ErrorCode || (exports.ErrorCode = {}));
class TokenExpiredError extends apollo_server_express_1.ApolloError {
    constructor() {
        super('Token expired', ErrorCode.TokenExpired);
    }
}
exports.TokenExpiredError = TokenExpiredError;
class InvalidCredentialsError extends apollo_server_express_1.ApolloError {
    constructor() {
        super('Invalid credentials', ErrorCode.InvalidCredentials);
    }
}
exports.InvalidCredentialsError = InvalidCredentialsError;
class UserNotFoundError extends apollo_server_express_1.ApolloError {
    constructor() {
        super('User not found', ErrorCode.UserNotFound);
    }
}
exports.UserNotFoundError = UserNotFoundError;
class InvalidOAuth2TokenError extends apollo_server_express_1.ApolloError {
    constructor() {
        super('OAuth2 Token from provider is invalid', ErrorCode.InvalidOAuth2Token);
    }
}
exports.InvalidOAuth2TokenError = InvalidOAuth2TokenError;
class OAuth2ProviderNotFoundError extends apollo_server_express_1.ApolloError {
    constructor() {
        super('OAuth2 Provider not found', ErrorCode.OAuth2ProviderNotFound);
    }
}
exports.OAuth2ProviderNotFoundError = OAuth2ProviderNotFoundError;
class NotAuthorisedError extends apollo_server_express_1.ApolloError {
    constructor() {
        super('User is not authorised', ErrorCode.NotAuthorised);
    }
}
exports.NotAuthorisedError = NotAuthorisedError;
class NotAuthenticatedError extends apollo_server_express_1.ApolloError {
    constructor() {
        super('User is not authenticated', ErrorCode.NotAuthenticated);
    }
}
exports.NotAuthenticatedError = NotAuthenticatedError;
class NotActiveError extends apollo_server_express_1.ApolloError {
    constructor() {
        super('User is not active', ErrorCode.UserNotActive);
    }
}
exports.NotActiveError = NotActiveError;
class NotFound extends apollo_server_express_1.ApolloError {
    constructor(model, id) {
        super(`${model} with ID or Slug: '${id}' not found`, ErrorCode.NotFound);
    }
}
exports.NotFound = NotFound;
class EmailAlreadyInUseError extends apollo_server_express_1.ApolloError {
    constructor() {
        super(`Email already in use`, ErrorCode.EmailAlreadyInUse);
    }
}
exports.EmailAlreadyInUseError = EmailAlreadyInUseError;
class MonthlyAmountNotEnough extends apollo_server_express_1.ApolloError {
    constructor() {
        super(`Monthly amount is not enough`, ErrorCode.MonthlyAmountNotEnough);
    }
}
exports.MonthlyAmountNotEnough = MonthlyAmountNotEnough;
class PaymentConfigurationNotAllowed extends apollo_server_express_1.ApolloError {
    constructor() {
        super(`Payment configuration not allowed. Check method, periodicity and auto renew flag`, ErrorCode.PaymentConfigurationNotAllowed);
    }
}
exports.PaymentConfigurationNotAllowed = PaymentConfigurationNotAllowed;
class UserInputError extends apollo_server_express_1.ApolloError {
    constructor(actualError) {
        super(`User Input Error: \n${actualError}`, ErrorCode.UserInputError);
    }
}
exports.UserInputError = UserInputError;
class DisabledPeerError extends apollo_server_express_1.ApolloError {
    constructor() {
        super(`Cannot return disabled peer.`, ErrorCode.DisabledPeerError);
    }
}
exports.DisabledPeerError = DisabledPeerError;
class DuplicatePageSlugError extends apollo_server_express_1.ApolloError {
    constructor(publishedPageID, slug) {
        super(`Page with ID ${publishedPageID} already uses the slug "${slug}"`, ErrorCode.DuplicatePageSlug);
    }
}
exports.DuplicatePageSlugError = DuplicatePageSlugError;
class DuplicateArticleSlugError extends apollo_server_express_1.ApolloError {
    constructor(publishedArticleID, slug) {
        super(`Article with ID ${publishedArticleID} already uses the slug "${slug}"`, ErrorCode.DuplicatePageSlug);
    }
}
exports.DuplicateArticleSlugError = DuplicateArticleSlugError;
class CommentLengthError extends apollo_server_express_1.ApolloError {
    constructor() {
        super(`Comment length should not exceed ${utility_1.MAX_COMMENT_LENGTH} characters.`, ErrorCode.CommentLengthError);
    }
}
exports.CommentLengthError = CommentLengthError;
class CommentAuthenticationError extends apollo_server_express_1.ApolloError {
    constructor(msg) {
        super(`Challenge validation failed with following message: ${msg}`, ErrorCode.ChallengeFailed);
    }
}
exports.CommentAuthenticationError = CommentAuthenticationError;
class AnonymousCommentsDisabledError extends apollo_server_express_1.ApolloError {
    constructor() {
        super(`Anonymous comments are disabled!`);
    }
}
exports.AnonymousCommentsDisabledError = AnonymousCommentsDisabledError;
class AnonymousCommentRatingDisabledError extends apollo_server_express_1.ApolloError {
    constructor() {
        super('Anonymous rating on comments disabled!');
    }
}
exports.AnonymousCommentRatingDisabledError = AnonymousCommentRatingDisabledError;
class AnonymousPollVotingDisabledError extends apollo_server_express_1.ApolloError {
    constructor() {
        super('Anonymous voting on polls disabled!');
    }
}
exports.AnonymousPollVotingDisabledError = AnonymousPollVotingDisabledError;
class AnonymousCommentError extends apollo_server_express_1.ApolloError {
    constructor() {
        super(`You need to give an anonymous name if you're not authenticated`);
    }
}
exports.AnonymousCommentError = AnonymousCommentError;
class ChallengeMissingCommentError extends apollo_server_express_1.ApolloError {
    constructor() {
        super(`You need to give a challenge if you're not authenticated`);
    }
}
exports.ChallengeMissingCommentError = ChallengeMissingCommentError;
class PeerTokenInvalidError extends apollo_server_express_1.ApolloError {
    constructor(peerUrl) {
        super(`Token for peer ${peerUrl} is invalid`, ErrorCode.PeerTokenInvalid);
    }
}
exports.PeerTokenInvalidError = PeerTokenInvalidError;
class InternalError extends apollo_server_express_1.ApolloError {
    constructor() {
        super(`Internal Error`, ErrorCode.InternalError);
    }
}
exports.InternalError = InternalError;
class UserSubscriptionAlreadyDeactivated extends apollo_server_express_1.ApolloError {
    constructor(deactivatedAt) {
        const msg = deactivatedAt < new Date()
            ? 'Subscription is already canceled'
            : 'Subscription is already marked to be canceled';
        super(msg, ErrorCode.UserSubscriptionAlreadyDeactivated);
    }
}
exports.UserSubscriptionAlreadyDeactivated = UserSubscriptionAlreadyDeactivated;
class GivenTokeExpiryToLongError extends apollo_server_express_1.ApolloError {
    constructor() {
        super('Given token expiry is to long!');
    }
}
exports.GivenTokeExpiryToLongError = GivenTokeExpiryToLongError;
class UserIdNotFound extends apollo_server_express_1.ApolloError {
    constructor() {
        super('Given user ID not valid!');
    }
}
exports.UserIdNotFound = UserIdNotFound;
class InvalidSettingValueError extends apollo_server_express_1.ApolloError {
    constructor() {
        super('Invalid setting data', ErrorCode.InvalidSettingData);
    }
}
exports.InvalidSettingValueError = InvalidSettingValueError;
class InvalidStarRatingValueError extends apollo_server_express_1.ApolloError {
    constructor() {
        super('Value has to be between 0 and 5');
    }
}
exports.InvalidStarRatingValueError = InvalidStarRatingValueError;
class PollNotOpenError extends apollo_server_express_1.ApolloError {
    constructor() {
        super('Poll has not been opened for voting yet!');
    }
}
exports.PollNotOpenError = PollNotOpenError;
class PollClosedError extends apollo_server_express_1.ApolloError {
    constructor() {
        super('Poll voting has been closed already!');
    }
}
exports.PollClosedError = PollClosedError;
class SubscriptionNotFound extends apollo_server_express_1.ApolloError {
    constructor() {
        super('SubscriptionId given not found!', ErrorCode.UserInputError);
    }
}
exports.SubscriptionNotFound = SubscriptionNotFound;
class AlreadyUnpaidInvoices extends apollo_server_express_1.ApolloError {
    constructor() {
        super('You cant create new invoice while you have unpaid invoices!', ErrorCode.UserInputError);
    }
}
exports.AlreadyUnpaidInvoices = AlreadyUnpaidInvoices;
class PeerIdMissingCommentError extends apollo_server_express_1.ApolloError {
    constructor() {
        super(`Comment with itemType PeerArticle requires a peerId`);
    }
}
exports.PeerIdMissingCommentError = PeerIdMissingCommentError;
//# sourceMappingURL=error.js.map