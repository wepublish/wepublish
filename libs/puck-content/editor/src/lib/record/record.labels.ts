import { useTranslation } from 'react-i18next';

import { RecordModel, RecordStatus } from './record.field';

export type RecordModelLabels = {
  one: string;
  many: string;
  search: string;
  add: string;
  empty: string;
  unknown: string;
};

export const useRecordModelLabels = () => {
  const { t } = useTranslation();

  return {
    article: {
      one: t('puck.record.article'),
      many: t('puck.record.articles'),
      search: t('puck.record.searchArticles'),
      add: t('puck.record.addArticle'),
      empty: t('puck.record.noArticlesFound'),
      unknown: t('puck.record.unknownArticle'),
    },
    page: {
      one: t('puck.record.page'),
      many: t('puck.record.pages'),
      search: t('puck.record.searchPages'),
      add: t('puck.record.addPage'),
      empty: t('puck.record.noPagesFound'),
      unknown: t('puck.record.unknownPage'),
    },
    event: {
      one: t('puck.record.event'),
      many: t('puck.record.events'),
      search: t('puck.record.searchEvents'),
      add: t('puck.record.addEvent'),
      empty: t('puck.record.noEventsFound'),
      unknown: t('puck.record.unknownEvent'),
    },
    memberPlan: {
      one: t('puck.record.memberPlan'),
      many: t('puck.record.memberPlans'),
      search: t('puck.record.searchMemberPlans'),
      add: t('puck.record.addMemberPlan'),
      empty: t('puck.record.noMemberPlansFound'),
      unknown: t('puck.record.unknownMemberPlan'),
    },
    author: {
      one: t('puck.record.author'),
      many: t('puck.record.authors'),
      search: t('puck.record.searchAuthors'),
      add: t('puck.record.addAuthor'),
      empty: t('puck.record.noAuthorsFound'),
      unknown: t('puck.record.unknownAuthor'),
    },
    paywall: {
      one: t('puck.record.paywall'),
      many: t('puck.record.paywalls'),
      search: t('puck.record.searchPaywalls'),
      add: t('puck.record.addPaywall'),
      empty: t('puck.record.noPaywallsFound'),
      unknown: t('puck.record.unknownPaywall'),
    },
  } satisfies Record<RecordModel, RecordModelLabels>;
};

export const useRecordStatusLabels = () => {
  const { t } = useTranslation();

  return {
    published: t('puck.record.published'),
    pending: t('puck.record.pending'),
    draft: t('puck.record.draft'),
    none: t('puck.record.unpublished'),
  } satisfies Record<RecordStatus, string>;
};
