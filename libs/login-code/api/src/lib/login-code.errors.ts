import { BadRequestException } from '@nestjs/common';

export const LOGIN_CODE_INVALID = 'LOGIN_CODE_INVALID';
export const TOO_MANY_ATTEMPTS = 'TOO_MANY_ATTEMPTS';
export const CHALLENGE_REQUIRED = 'CHALLENGE_REQUIRED';
export const LOGIN_CODE_DISABLED = 'LOGIN_CODE_DISABLED';

export class InvalidLoginCodeError extends BadRequestException {
  constructor() {
    super(LOGIN_CODE_INVALID);
  }
}

export class LoginCodeDisabledError extends BadRequestException {
  constructor() {
    super(LOGIN_CODE_DISABLED);
  }
}

export class TooManyAttemptsError extends BadRequestException {
  constructor() {
    super(TOO_MANY_ATTEMPTS);
  }
}

export class ChallengeRequiredError extends BadRequestException {
  constructor() {
    super(CHALLENGE_REQUIRED);
  }
}

export const SECOND_FACTOR_INVALID = 'SECOND_FACTOR_INVALID';

export class SecondFactorInvalidError extends BadRequestException {
  constructor() {
    super(SECOND_FACTOR_INVALID);
  }
}
