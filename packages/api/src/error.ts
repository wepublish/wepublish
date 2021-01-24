import {ApolloError} from 'apollo-server-express'

export enum ErrorCode {
  TokenExpired = 'TOKEN_EXPIRED',
  InvalidCredentials = 'INVALID_CREDENTIALS',
  UserNotFound = 'USER_NOT_FOUND',
  InvalidOAuth2Token = 'INVALID_OAUTH_TOKEN',
  OAuth2ProviderNotFound = 'OAUTH2_PROVIDER_NOT_FOUND',
  NotAuthorised = 'NOT_AUTHORISED',
  UserNotActive = 'USER_NOT_ACTIVE',
  NotFound = 'NOT_FOUND',
  MonthlyAmountNotEnough = 'MONTHLY_AMOUNT_NOT_ENOUGH',
  PaymentConfigurationNotAllowed = 'PAYMENT_CONFIGURATION_NOT_ALLOWED',
  DeleteBecauseLinkedNotAllowed = 'DELETE_BECAUSE_LINKED_NOT_ALLOWED'
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

export class NotActiveError extends ApolloError {
  constructor() {
    super('User is not active', ErrorCode.UserNotActive)
  }
}

export class NotFoundError extends ApolloError {
  constructor(model: string, id: string) {
    super(`${model} with ID: ${id} not found`, ErrorCode.NotFound)
  }
}

export class MonthlyAmountNotEnoughError extends ApolloError {
  constructor() {
    super(`Monthly amount is not enough`, ErrorCode.MonthlyAmountNotEnough)
  }
}

export class PaymentConfigurationNotAllowedError extends ApolloError {
  constructor() {
    super(
      `Payment configuration not allowed. Check method, periodicity and auto renew flag`,
      ErrorCode.PaymentConfigurationNotAllowed
    )
  }
}

export class DeleteBecauseLinkedNotAllowedError extends ApolloError {
  constructor(model: string, linkedModel: string, linkedId: string) {
    super(
      `Delete of ${model} not allowed because it's linked by ${linkedModel} with id ${linkedId}`,
      ErrorCode.MonthlyAmountNotEnough
    )
  }
}
