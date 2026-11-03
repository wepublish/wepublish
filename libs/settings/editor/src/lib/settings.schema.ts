import { SettingName, type SettingsListQuery } from '@wepublish/editor/api';
import { formFields, type FormDefaultValues } from '@wepublish/form/editor';
import { z } from 'zod/v4';

export const settingsSchema = z.object({
  [SettingName.NewArticlePeering]: z.boolean().meta({
    label: 'settingList.newArticlePeering',
    description: 'settingList.warnings.newArticlePeering',
  }),
  [SettingName.ShowPendingWhenNotPublished]: z.boolean().meta({
    label: 'settingList.showPendingWhenNotPublished',
    description: 'settingList.warnings.showPendingWhenNotPublished',
  }),
  [SettingName.NewArticlePaywall]: formFields.paywall().nullish().meta({
    label: 'settingList.newArticlePaywall',
    description: 'settingList.warnings.newArticlePaywall',
  }),
  [SettingName.AllowGuestCommenting]: z.boolean().meta({
    label: 'settingList.guestCommenting',
    description: 'settingList.warnings.guestCommenting',
  }),
  [SettingName.AllowGuestCommentRating]: z.boolean().meta({
    label: 'settingList.allowGuestCommentRating',
    description: 'settingList.warnings.guestCommentRating',
  }),
  [SettingName.AllowCommentEditing]: z.boolean().meta({
    label: 'settingList.allowCommentEditing',
    description: 'settingList.info.allowCommentEditing',
  }),
  [SettingName.AllowGuestPollVoting]: z.boolean().meta({
    label: 'settingList.guestPollVote',
    description: 'settingList.warnings.guestPollVote',
  }),
  [SettingName.CommentCharLimit]: z.int().min(0).max(10000).meta({
    label: 'settingList.commentCharLimit',
    description: 'settingList.info.commentCharLimit',
  }),
  [SettingName.SubscriptionUpgradeBillsFullDifference]: z.boolean().meta({
    label: 'settingList.subscriptionUpgradeModel',
    description: 'settingList.warnings.subscriptionUpgradeModel',
  }),
  [SettingName.SubscriptionExtendWindowDays]: z.int().min(0).max(366).meta({
    label: 'settingList.subscriptionExtendWindowDays',
    description: 'settingList.info.subscriptionExtendWindowDays',
  }),
  [SettingName.PaymentMethodChangeExpiryDays]: z.int().min(1).max(90).meta({
    label: 'settingList.paymentMethodChangeExpiryDays',
    description: 'settingList.info.paymentMethodChangeExpiryDays',
  }),
  [SettingName.MakeNewSubscribersApiPublic]: z.boolean().meta({
    label: 'settingList.newSubscriptionsApiPublic',
    description: 'settingList.info.newSubscriptionsApiPublic',
  }),
  [SettingName.MakeActiveSubscribersApiPublic]: z.boolean().meta({
    label: 'settingList.activeSubscriptionsApiPublic',
    description: 'settingList.info.activeSubscriptionsApiPublic',
  }),
  [SettingName.MakeRenewingSubscribersApiPublic]: z.boolean().meta({
    label: 'settingList.renewingSubscriptionsApiPublic',
    description: 'settingList.info.renewingSubscriptionsApiPublic',
  }),
  [SettingName.MakeNewDeactivationsApiPublic]: z.boolean().meta({
    label: 'settingList.newDeactivationsApiPublic',
    description: 'settingList.info.newDeactivationsApiPublic',
  }),
  [SettingName.MakeExpectedRevenueApiPublic]: z.boolean().meta({
    label: 'settingList.expectedRevenueApiPublic',
    description: 'settingList.info.expectedRevenueApiPublic',
  }),
  [SettingName.MakeRevenueApiPublic]: z.boolean().meta({
    label: 'settingList.revenueApiPublic',
    description: 'settingList.info.revenueApiPublic',
  }),
  [SettingName.SessionTtlDays]: z.int().min(1).max(365).meta({
    label: 'settingList.sessionTtlDays',
    description: 'settingList.warnings.sessionTtlDays',
  }),
  [SettingName.SendLoginJwtExpiresMin]: z.int().min(1).max(10080).meta({
    label: 'settingList.loginMinutes',
    description: 'settingList.info.loginMinutes',
  }),
  [SettingName.ResetPasswordJwtExpiresMin]: z.int().min(10).max(10080).meta({
    label: 'settingList.passwordToken',
    description: 'settingList.info.passwordToken',
  }),
  [SettingName.PeeringTimeoutMs]: z.int().min(1000).max(10000).meta({
    label: 'settingList.peerToken',
    description: 'settingList.info.peerToken',
  }),
});

export const fromSettings = ({
  settings,
}: SettingsListQuery): FormDefaultValues<typeof settingsSchema> => {
  const values = Object.fromEntries(
    settings.map(({ name, value }) => [name, value])
  ) as FormDefaultValues<typeof settingsSchema>;

  return {
    ...values,
    [SettingName.NewArticlePaywall]:
      values[SettingName.NewArticlePaywall] || null,
  };
};
