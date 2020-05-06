import {ApolloError} from 'apollo-server-express'

export enum ErrorCode {
  TokenExpired = 'TOKEN_EXPIRED',
  InvalidCredentials = 'INVALID_CREDENTIALS',
  UserNotFound = 'USER_NOT_FOUND',
  InvalidOAuth2Token = 'INVALID_OAUTH_TOKEN',
  OAuth2ProviderNotFound = 'OAUTH2_PROVIDER_NOT_FOUND',
  NotAuthorised = 'NOT_AUTHORISED'
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
