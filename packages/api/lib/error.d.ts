import { ApolloError } from 'apollo-server-express';
export declare enum ErrorCode {
    TokenExpired = "TOKEN_EXPIRED",
    InvalidCredentials = "INVALID_CREDENTIALS",
    UserNotFound = "USER_NOT_FOUND",
    InvalidOAuth2Token = "INVALID_OAUTH_TOKEN",
    OAuth2ProviderNotFound = "OAUTH2_PROVIDER_NOT_FOUND",
    NotAuthenticated = "NOT_AUTHENTICATED",
    NotAuthorised = "NOT_AUTHORISED",
    UserNotActive = "USER_NOT_ACTIVE",
    NotFound = "NOT_FOUND",
    EmailAlreadyInUse = "EMAIL_ALREADY_IN_USE",
    MonthlyAmountNotEnough = "MONTHLY_AMOUNT_NOT_ENOUGH",
    PaymentConfigurationNotAllowed = "PAYMENT_CONFIGURATION_NOT_ALLOWED",
    UserInputError = "USER_INPUT_ERROR",
    DuplicatePageSlug = "DUPLICATE_PAGE_SLUG",
    CommentLengthError = "COMMENT_LENGTH_ERROR",
    PeerTokenInvalid = "PEER_TOKEN_INVALID",
    InternalError = "InternalError",
    DisabledPeerError = "DISABLED_PEER_ERROR",
    UserSubscriptionAlreadyDeactivated = "USER_SUBSCRIPTION_ALREADY_DEACTIVATED",
    ChallengeFailed = "ChallengeFailed",
    InvalidSettingData = "INVALID_SETTING_DATA"
}
export declare class TokenExpiredError extends ApolloError {
    constructor();
}
export declare class InvalidCredentialsError extends ApolloError {
    constructor();
}
export declare class UserNotFoundError extends ApolloError {
    constructor();
}
export declare class InvalidOAuth2TokenError extends ApolloError {
    constructor();
}
export declare class OAuth2ProviderNotFoundError extends ApolloError {
    constructor();
}
export declare class NotAuthorisedError extends ApolloError {
    constructor();
}
export declare class NotAuthenticatedError extends ApolloError {
    constructor();
}
export declare class NotActiveError extends ApolloError {
    constructor();
}
export declare class NotFound extends ApolloError {
    constructor(model: string, id: string);
}
export declare class EmailAlreadyInUseError extends ApolloError {
    constructor();
}
export declare class MonthlyAmountNotEnough extends ApolloError {
    constructor();
}
export declare class PaymentConfigurationNotAllowed extends ApolloError {
    constructor();
}
export declare class UserInputError extends ApolloError {
    constructor(actualError: string);
}
export declare class DisabledPeerError extends ApolloError {
    constructor();
}
export declare class DuplicatePageSlugError extends ApolloError {
    constructor(publishedPageID: string, slug: string);
}
export declare class DuplicateArticleSlugError extends ApolloError {
    constructor(publishedArticleID: string, slug: string);
}
export declare class CommentLengthError extends ApolloError {
    constructor();
}
export declare class CommentAuthenticationError extends ApolloError {
    constructor(msg: string);
}
export declare class AnonymousCommentsDisabledError extends ApolloError {
    constructor();
}
export declare class AnonymousCommentRatingDisabledError extends ApolloError {
    constructor();
}
export declare class AnonymousPollVotingDisabledError extends ApolloError {
    constructor();
}
export declare class AnonymousCommentError extends ApolloError {
    constructor();
}
export declare class ChallengeMissingCommentError extends ApolloError {
    constructor();
}
export declare class PeerTokenInvalidError extends ApolloError {
    constructor(peerUrl: string);
}
export declare class InternalError extends ApolloError {
    constructor();
}
export declare class UserSubscriptionAlreadyDeactivated extends ApolloError {
    constructor(deactivatedAt: Date);
}
export declare class GivenTokeExpiryToLongError extends ApolloError {
    constructor();
}
export declare class UserIdNotFound extends ApolloError {
    constructor();
}
export declare class InvalidSettingValueError extends ApolloError {
    constructor();
}
export declare class InvalidStarRatingValueError extends ApolloError {
    constructor();
}
export declare class PollNotOpenError extends ApolloError {
    constructor();
}
export declare class PollClosedError extends ApolloError {
    constructor();
}
export declare class SubscriptionNotFound extends ApolloError {
    constructor();
}
export declare class AlreadyUnpaidInvoices extends ApolloError {
    constructor();
}
export declare class PeerIdMissingCommentError extends ApolloError {
    constructor();
}
//# sourceMappingURL=error.d.ts.map