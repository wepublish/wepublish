import {GraphQLError} from 'graphql'

import {ErrorCode} from '../../client/error'

export class TokenExpiredError extends GraphQLError {
  constructor() {
    super('Token expired.', undefined, undefined, undefined, undefined, undefined, {
      code: ErrorCode.TokenExpired
    })
  }
}

export class InvalidTokenError extends GraphQLError {
  constructor() {
    super('Invalid token.', undefined, undefined, undefined, undefined, undefined, {
      code: ErrorCode.InvalidToken
    })
  }
}

export class UnauthorizedError extends GraphQLError {
  constructor() {
    super('Unauthorized.', undefined, undefined, undefined, undefined, undefined, {
      code: ErrorCode.Unauthorized
    })
  }
}

export class InvalidCredentialsError extends GraphQLError {
  constructor() {
    super('Invalid credentials.', undefined, undefined, undefined, undefined, undefined, {
      code: ErrorCode.InvalidCredentials
    })
  }
}
