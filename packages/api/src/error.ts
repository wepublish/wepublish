import {ApolloError} from 'apollo-server-express'
import {MAX_COMMENT_LENGTH} from './utility'

export enum ErrorCode {
  TokenExpired = 'TOKEN_EXPIRED',
  InvalidCredentials = 'INVALID_CREDENTIALS',
  UserNotFound = 'USER_NOT_FOUND',
  InvalidOAuth2Token = 'INVALID_OAUTH_TOKEN',
  OAuth2ProviderNotFound = 'OAUTH2_PROVIDER_NOT_FOUND',
  NotAuthenticated = 'NOT_AUTHENTICATED',
  NotAuthorised = 'NOT_AUTHORISED',
  UserNotActive = 'USER_NOT_ACTIVE',
  NotFound = 'NOT_FOUND',
  EmailAlreadyInUse = 'EMAIL_ALREADY_IN_USE',
  MonthlyAmountNotEnough = 'MONTHLY_AMOUNT_NOT_ENOUGH',
  PaymentConfigurationNotAllowed = 'PAYMENT_CONFIGURATION_NOT_ALLOWED',
  UserInputError = 'USER_INPUT_ERROR',
  DuplicatePageSlug = 'DUPLICATE_PAGE_SLUG',
  CommentLengthError = 'COMMENT_LENGTH_ERROR',
  PeerTokenInvalid = 'PEER_TOKEN_INVALID',
  InternalError = 'InternalError',
  UserSubscriptionAlreadyDeactivated = 'USER_SUBSCRIPTION_ALREADY_DEACTIVATED',
  InvalidCaptcha = 'InvalidCaptcha'
}

export class TokenExpiredError extends ApolloError {
  constructor() {
    super('Token expired', ErrorCode.TokenExpired)
  }
}

export class InvalidCredentialsError extends ApolloError {
  constructor() {
    super('Invalid credentials', ErrorCode.InvalidCredentials)
  }
}

export class UserNotFoundError extends ApolloError {
  constructor() {
    super('User not found', ErrorCode.UserNotFound)
  }
}

export class InvalidOAuth2TokenError extends ApolloError {
  constructor() {
    super('OAuth2 Token from provider is invalid', ErrorCode.InvalidOAuth2Token)
  }
}

export class OAuth2ProviderNotFoundError extends ApolloError {
  constructor() {
    super('OAuth2 Provider not found', ErrorCode.OAuth2ProviderNotFound)
  }
}

export class NotAuthorisedError extends ApolloError {
  constructor() {
    super('User is not authorised', ErrorCode.NotAuthorised)
  }
}

export class NotAuthenticatedError extends ApolloError {
  constructor() {
    super('User is not authenticated', ErrorCode.NotAuthenticated)
  }
}

export class NotActiveError extends ApolloError {
  constructor() {
    super('User is not active', ErrorCode.UserNotActive)
  }
}

export class NotFound extends ApolloError {
  constructor(model: string, id: string) {
    super(`${model} with ID or Slug: '${id}' not found`, ErrorCode.NotFound)
  }
}

export class EmailAlreadyInUseError extends ApolloError {
  constructor() {
    super(`Email already in use`, ErrorCode.EmailAlreadyInUse)
  }
}

export class MonthlyAmountNotEnough extends ApolloError {
  constructor() {
    super(`Monthly amount is not enough`, ErrorCode.MonthlyAmountNotEnough)
  }
}

export class PaymentConfigurationNotAllowed extends ApolloError {
  constructor() {
    super(
      `Payment configuration not allowed. Check method, periodicity and auto renew flag`,
      ErrorCode.PaymentConfigurationNotAllowed
    )
  }
}

export class UserInputError extends ApolloError {
  constructor(actualError: string) {
    super(`User Input Error: \n${actualError}`, ErrorCode.UserInputError)
  }
}

export class DuplicatePageSlugError extends ApolloError {
  constructor(publishedPageID: string, slug: string) {
    super(
      `Page with ID ${publishedPageID} already uses the slug "${slug}"`,
      ErrorCode.DuplicatePageSlug
    )
  }
}

export class CommentLengthError extends ApolloError {
  constructor() {
    super(
      `Comment length should not exceed ${MAX_COMMENT_LENGTH} characters.`,
      ErrorCode.CommentLengthError
    )
  }
}

export class CommentAuthenticationError extends ApolloError {
  constructor(msg: string) {
    super(`Challenge validation failed with following message: ${msg}`, ErrorCode.InvalidCaptcha)
  }
}

export class AnonymousCommentError extends ApolloError {
  constructor() {
    super(`You need to give an anonymousname if your not authenticated`)
  }
}

export class PeerTokenInvalidError extends ApolloError {
  constructor(peerUrl: string) {
    super(`Token for peer ${peerUrl} is invalid`, ErrorCode.PeerTokenInvalid)
  }
}

export class InternalError extends ApolloError {
  constructor() {
    super(`Internal Error`, ErrorCode.InternalError)
  }
}

export class UserSubscriptionAlreadyDeactivated extends ApolloError {
  constructor(deactivatedAt: Date) {
    const msg =
      deactivatedAt < new Date()
        ? 'Subscription is already canceled'
        : 'Subscription is already marked to be canceled'
    super(msg, ErrorCode.UserSubscriptionAlreadyDeactivated)
  }
}
