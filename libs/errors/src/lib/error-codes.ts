export enum ErrorCode {
  TokenExpired = 'TOKEN_EXPIRED',
  InvalidCredentials = 'INVALID_CREDENTIALS',
  UserNotFound = 'USER_NOT_FOUND',
  InvalidOAuth2Token = 'INVALID_OAUTH_TOKEN',
  OAuth2ProviderNotFound = 'OAUTH2_PROVIDER_NOT_FOUND',
  NotAuthenticated = 'NOT_AUTHENTICATED',
  NotAuthorised = 'NOT_AUTHORISED',
  UserNotActive = 'USER_NOT_ACTIVE',
  NotFound = 'NOT_FOUND',
  EmailAlreadyInUse = 'EMAIL_ALREADY_IN_USE',
  MonthlyAmountNotEnough = 'MONTHLY_AMOUNT_NOT_ENOUGH',
  PaymentConfigurationNotAllowed = 'PAYMENT_CONFIGURATION_NOT_ALLOWED',
  UserInputError = 'USER_INPUT_ERROR',
  DuplicatePageSlug = 'DUPLICATE_PAGE_SLUG',
  CommentLengthError = 'COMMENT_LENGTH_ERROR',
  PeerTokenInvalid = 'PEER_TOKEN_INVALID',
  InternalError = 'InternalError',
  DisabledPeerError = 'DISABLED_PEER_ERROR',
  UserSubscriptionAlreadyDeactivated = 'USER_SUBSCRIPTION_ALREADY_DEACTIVATED',
  ChallengeFailed = 'ChallengeFailed',
  InvalidSettingData = 'INVALID_SETTING_DATA',
  PaymentAlreadyRunning = 'PAYMENT_ALREADY_RUNNING'
}
