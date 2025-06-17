import {UserInputError} from 'apollo-server-express'

export class InvalidCredentialsError extends UserInputError {
  constructor() {
    super('The provided credentials are invalid.')
  }
}

export class NotActiveError extends UserInputError {
  constructor() {
    super('The user account is not active.')
  }
}

export class OAuth2ProviderNotFoundError extends UserInputError {
  constructor(name: string) {
    super(`The OAuth2 provider "${name}" does not exist.`)
  }
}

export class InvalidOAuth2TokenError extends UserInputError {
  constructor() {
    super('The provided OAuth2 token is invalid.')
  }
}

export class UserNotFoundError extends UserInputError {
  constructor() {
    super('The user was not found.')
  }
}
