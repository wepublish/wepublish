export class NotAuthorisedError extends Error {
  constructor() {
    super('User is not authorised');
  }
}

export class CommentLengthError extends Error {
  constructor(maxCommentLength: number) {
    super(`Comment length should not exceed ${maxCommentLength} characters.`);
  }
}

export class CommentAuthenticationError extends Error {
  constructor(msg: string) {
    super(`Challenge validation failed with following message: ${msg}`);
  }
}

export class AnonymousCommentsDisabledError extends Error {
  constructor() {
    super(`Anonymous comments are disabled!`);
  }
}

export class AnonymousCommentRatingDisabledError extends Error {
  constructor() {
    super('Anonymous rating on comments disabled!');
  }
}

export class AnonymousPollVotingDisabledError extends Error {
  constructor() {
    super('Anonymous voting on polls disabled!');
  }
}

export class AnonymousCommentError extends Error {
  constructor() {
    super(`You need to give an anonymous name if you're not authenticated`);
  }
}

export class ChallengeMissingCommentError extends Error {
  constructor() {
    super(`You need to give a challenge if you're not authenticated`);
  }
}

export class InvalidStarRatingValueError extends Error {
  constructor() {
    super('Value has to be between 0 and 5');
  }
}
