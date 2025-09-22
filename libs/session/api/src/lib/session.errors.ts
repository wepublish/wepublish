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

export class UserNotFoundError extends UserInputError {
  constructor() {
    super('The user was not found.')
  }
}
