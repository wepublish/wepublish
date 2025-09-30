import { ApolloError } from 'apollo-server-express';
import { ErrorCode } from '@wepublish/errors';

export class TokenExpiredError extends ApolloError {
  constructor() {
    super('Token expired', ErrorCode.TokenExpired);
  }
}

export class InvalidCredentialsError extends ApolloError {
  constructor() {
    super('Invalid credentials', ErrorCode.InvalidCredentials);
  }
}

export class UserNotFoundError extends ApolloError {
  constructor() {
    super('User not found', ErrorCode.UserNotFound);
  }
}

export class NotAuthorisedError extends ApolloError {
  constructor() {
    super('User is not authorised', ErrorCode.NotAuthorised);
  }
}

export class NotAuthenticatedError extends ApolloError {
  constructor() {
    super('User is not authenticated', ErrorCode.NotAuthenticated);
  }
}

export class NotActiveError extends ApolloError {
  constructor() {
    super('User is not active', ErrorCode.UserNotActive);
  }
}

export class NotFound extends ApolloError {
  constructor(model: string, id: string) {
    super(`${model} with ID or Slug: '${id}' not found`, ErrorCode.NotFound);
  }
}

export class EmailAlreadyInUseError extends ApolloError {
  constructor() {
    super(`Email already in use`, ErrorCode.EmailAlreadyInUse);
  }
}

export class MonthlyAmountNotEnough extends ApolloError {
  constructor() {
    super(`Monthly amount is not enough`, ErrorCode.MonthlyAmountNotEnough);
  }
}

export class MonthlyTargetAmountNotEnough extends ApolloError {
  constructor() {
    super(
      `Monthly target amount mus be greater than minimal monthly amount`,
      ErrorCode.MonthlyTargetAmountNotEnough
    );
  }
}

export class SubscriptionToDeactivateDoesNotExist extends ApolloError {
  constructor(id: string) {
    super(
      `Subscription to deactivate with id ${id} not found or the subscription is already deactivated!`,
      ErrorCode.NotFound
    );
  }
}

export class PaymentConfigurationNotAllowed extends ApolloError {
  constructor() {
    super(
      `Payment configuration not allowed. Check method, periodicity and auto renew flag`,
      ErrorCode.PaymentConfigurationNotAllowed
    );
  }
}

export class UserInputError extends ApolloError {
  constructor(actualError: string) {
    super(`User Input Error: \n${actualError}`, ErrorCode.UserInputError);
  }
}

export class DisabledPeerError extends ApolloError {
  constructor() {
    super(`Cannot return disabled peer.`, ErrorCode.DisabledPeerError);
  }
}

export class DuplicatePageSlugError extends ApolloError {
  constructor(publishedPageID: string, slug: string) {
    super(
      `Page with ID ${publishedPageID} already uses the slug "${slug}"`,
      ErrorCode.DuplicatePageSlug
    );
  }
}

export class DuplicateArticleSlugError extends ApolloError {
  constructor(publishedArticleID: string, slug: string) {
    super(
      `Article with ID ${publishedArticleID} already uses the slug "${slug}"`,
      ErrorCode.DuplicatePageSlug
    );
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

export class PeerTokenInvalidError extends ApolloError {
  constructor(peerUrl: string) {
    super(`Token for peer ${peerUrl} is invalid`, ErrorCode.PeerTokenInvalid);
  }
}

export class InternalError extends ApolloError {
  constructor() {
    super(`Internal Error`, ErrorCode.InternalError);
  }
}

export class UserSubscriptionAlreadyDeactivated extends ApolloError {
  constructor(deactivatedAt: Date) {
    const msg =
      deactivatedAt < new Date() ?
        'Subscription is already canceled'
      : 'Subscription is already marked to be canceled';
    super(msg, ErrorCode.UserSubscriptionAlreadyDeactivated);
  }
}

export class GivenTokeExpiryToLongError extends ApolloError {
  constructor() {
    super('Given token expiry is to long!');
  }
}

export class UserIdNotFound extends ApolloError {
  constructor() {
    super('Given user ID not valid!');
  }
}
export class InvalidSettingValueError extends ApolloError {
  constructor() {
    super('Invalid setting data', ErrorCode.InvalidSettingData);
  }
}

export class InvalidStarRatingValueError extends ApolloError {
  constructor() {
    super('Value has to be between 0 and 5');
  }
}

export class PollNotOpenError extends ApolloError {
  constructor() {
    super('Poll has not been opened for voting yet!');
  }
}

export class PollClosedError extends ApolloError {
  constructor() {
    super('Poll voting has been closed already!');
  }
}

export class SubscriptionNotFound extends ApolloError {
  constructor() {
    super('SubscriptionId given not found!', ErrorCode.UserInputError);
  }
}

export class AlreadyUnpaidInvoices extends ApolloError {
  constructor() {
    super(
      'You cant create new invoice while you have unpaid invoices!',
      ErrorCode.UserInputError
    );
  }
}

export class PeerIdMissingCommentError extends ApolloError {
  constructor() {
    super(`Comment with itemType PeerArticle requires a peerId`);
  }
}

export class PaymentAlreadyRunning extends ApolloError {
  constructor(id: string) {
    super(
      `Payment with id ${id} already running!`,
      ErrorCode.PaymentAlreadyRunning
    );
  }
}

export class InvoiceAlreadyPaidOrCanceled extends ApolloError {
  constructor(id: string) {
    super(
      `Invoice with id ${id} is already paid or canceled!`,
      ErrorCode.UserInputError
    );
  }
}

export class SubscriptionNotExtendable extends ApolloError {
  constructor(id: string) {
    super(
      `Subscription with id ${id} is not extendable!`,
      ErrorCode.UserInputError
    );
  }
}

export class InvalidMemberPlanSettings extends ApolloError {
  constructor() {
    super(
      `Memberplan cannot be non-renewable and auto-renew at the same time.`
    );
  }
}
