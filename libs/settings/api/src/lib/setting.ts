export type Setting<T = unknown> = {
  id: string;
  name: SettingName;
  value: T | null;
  settingRestriction?: SettingRestriction;
};

export enum SettingName {
  NEW_ARTICLE_PAYWALL = 'newArticlePaywall',
  NEW_ARTICLE_PEERING = 'newArticlePeering',

  ALLOW_GUEST_COMMENTING = 'allowGuestCommenting',
  ALLOW_GUEST_COMMENT_RATING = 'allowGuestCommentRating',
  ALLOW_GUEST_POLL_VOTING = 'allowGuestPollVoting',
  SEND_LOGIN_JWT_EXPIRES_MIN = 'sendLoginJwtExpiresMin',
  RESET_PASSWORD_JWT_EXPIRES_MIN = 'resetPasswordJwtExpiresMin',
  PEERING_TIMEOUT_MS = 'peeringTimeoutInMs',
  MAIL_PROVIDER_NAME = 'mailProviderName',

  MAKE_NEW_SUBSCRIBERS_API_PUBLIC = 'makeNewSubscribersApiPublic',
  MAKE_ACTIVE_SUBSCRIBERS_API_PUBLIC = 'makeActiveSubscribersApiPublic',
  MAKE_RENEWING_SUBSCRIBERS_API_PUBLIC = 'makeRenewingSubscribersApiPublic',
  MAKE_NEW_DEACTIVATIONS_API_PUBLIC = 'makeNewDeactivationsApiPublic',

  MAKE_EXPECTED_REVENUE_API_PUBLIC = 'makeExpectedRevenueApiPublic',
  MAKE_REVENUE_API_PUBLIC = 'makeRevenueApiPublic',
  COMMENT_CHAR_LIMIT = 'commentCharLimit',

  ALLOW_COMMENT_EDITING = 'allowCommentEditing',

  SHOW_PENDING_WHEN_NOT_PUBLISHED = 'showPendingWhenNotPublished',
}

export type CreateSettingArgs<T> = Omit<Setting<T>, 'id'>;

export type UpdateSettingArgs<T = unknown> = {
  name: SettingName;
  value: T;
};

export interface SettingRestriction {
  maxValue?: number;
  minValue?: number;
  inputLength?: number;
  allowedValues?: AllowedSettingVals;
}

export type AllowedSettingVals = {
  stringChoice?: string[];
  boolChoice?: boolean;
};

export type OptionalSetting = Setting | null;
