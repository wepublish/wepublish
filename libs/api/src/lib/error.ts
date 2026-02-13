import { ApolloError } from 'apollo-server-express';
import { ErrorCode } from '@wepublish/errors';

export class NotAuthorisedError extends ApolloError {
  constructor() {
    super('User is not authorised', ErrorCode.NotAuthorised);
  }
}

export class CommentLengthError extends ApolloError {
  constructor(maxCommentLength: number) {
    super(
      `Comment length should not exceed ${maxCommentLength} characters.`,
      ErrorCode.CommentLengthError
    );
  }
}

export class CommentAuthenticationError extends ApolloError {
  constructor(msg: string) {
    super(
      `Challenge validation failed with following message: ${msg}`,
      ErrorCode.ChallengeFailed
    );
  }
}

export class AnonymousCommentsDisabledError extends ApolloError {
  constructor() {
    super(`Anonymous comments are disabled!`);
  }
}

export class AnonymousCommentRatingDisabledError extends ApolloError {
  constructor() {
    super('Anonymous rating on comments disabled!');
  }
}

export class AnonymousPollVotingDisabledError extends ApolloError {
  constructor() {
    super('Anonymous voting on polls disabled!');
  }
}

export class AnonymousCommentError extends ApolloError {
  constructor() {
    super(`You need to give an anonymous name if you're not authenticated`);
  }
}

export class ChallengeMissingCommentError extends ApolloError {
  constructor() {
    super(`You need to give a challenge if you're not authenticated`);
  }
}

export class InvalidStarRatingValueError extends ApolloError {
  constructor() {
    super('Value has to be between 0 and 5');
  }
}
