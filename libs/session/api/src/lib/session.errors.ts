import { BadRequestException } from '@nestjs/common';

export class InvalidCredentialsError extends BadRequestException {
  constructor() {
    super('The provided credentials are invalid.');
  }
}

export class NotActiveError extends BadRequestException {
  constructor() {
    super('The user account is not active.');
  }
}

export class UserNotFoundError extends BadRequestException {
  constructor() {
    super('The user was not found.');
  }
}
