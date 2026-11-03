import { SettingName } from '@wepublish/editor/api';
import { formView } from '@wepublish/form/editor';

import { settingsSchema } from './settings.schema';

export const settingsView = formView(settingsSchema, {
  layout: 'cards',
  sections: [
    {
      title: 'settingList.articlePage',
      span: 'full',
      fields: [
        {
          group: [
            SettingName.NewArticlePeering,
            SettingName.ShowPendingWhenNotPublished,
          ],
        },
        SettingName.NewArticlePaywall,
      ],
    },
    {
      title: 'settingList.commentsAndPolls',
      fields: [
        {
          group: [
            SettingName.AllowGuestCommenting,
            SettingName.AllowGuestCommentRating,
            SettingName.AllowCommentEditing,
            SettingName.AllowGuestPollVoting,
          ],
        },
        SettingName.CommentCharLimit,
      ],
    },
    {
      title: 'settingList.login',
      fields: [
        SettingName.SessionTtlDays,
        SettingName.SendLoginJwtExpiresMin,
        SettingName.ResetPasswordJwtExpiresMin,
      ],
    },
    {
      title: 'settingList.subscriptionPlans',
      span: 'full',
      fields: [
        SettingName.SubscriptionUpgradeBillsFullDifference,
        [
          SettingName.SubscriptionExtendWindowDays,
          SettingName.PaymentMethodChangeExpiryDays,
        ],
      ],
    },
    {
      title: 'settingList.peering',
      fields: [SettingName.PeeringTimeoutMs],
    },
    {
      title: 'settingList.publicApi',
      description: 'settingList.publicApiInfo',
      collapsible: 'closed',
      fields: [
        {
          group: [
            SettingName.MakeNewSubscribersApiPublic,
            SettingName.MakeActiveSubscribersApiPublic,
            SettingName.MakeRenewingSubscribersApiPublic,
            SettingName.MakeNewDeactivationsApiPublic,
            SettingName.MakeExpectedRevenueApiPublic,
            SettingName.MakeRevenueApiPublic,
          ],
        },
      ],
    },
  ],
  fields: {
    [SettingName.SubscriptionExtendWindowDays]: {
      props: { unit: 'form.units.days' },
    },
    [SettingName.PaymentMethodChangeExpiryDays]: {
      props: { unit: 'form.units.days' },
    },
    [SettingName.SessionTtlDays]: { props: { unit: 'form.units.days' } },
    [SettingName.SendLoginJwtExpiresMin]: {
      props: { unit: 'form.units.minutes' },
    },
    [SettingName.ResetPasswordJwtExpiresMin]: {
      props: { unit: 'form.units.minutes' },
    },
    [SettingName.PeeringTimeoutMs]: {
      props: { unit: 'form.units.milliseconds' },
    },
  },
});
