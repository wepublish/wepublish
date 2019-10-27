import {ApolloError} from 'apollo-server'
import {ErrorCode} from '../../client/error'

export class TokenExpiredError extends ApolloError {
  constructor() {
    super('Token expired', ErrorCode.TokenExpired)
  }
}

export class InvalidTokenError extends ApolloError {
  constructor() {
    super('Invalid token', ErrorCode.InvalidToken)
  }
}

export class InvalidCredentialsError extends ApolloError {
  constructor() {
    super('Invalid credentials', ErrorCode.InvalidCredentials)
  }
}
