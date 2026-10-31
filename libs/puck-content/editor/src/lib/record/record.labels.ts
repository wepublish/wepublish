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
      one: t('', 'Article'),
      many: t('', 'Articles'),
      search: t('', 'Search articles…'),
      add: t('', 'Add article'),
      empty: t('', 'No articles found'),
      unknown: t('', 'Unknown article'),
    },
    page: {
      one: t('', 'Page'),
      many: t('', 'Pages'),
      search: t('', 'Search pages…'),
      add: t('', 'Add page'),
      empty: t('', 'No pages found'),
      unknown: t('', 'Unknown page'),
    },
    event: {
      one: t('', 'Event'),
      many: t('', 'Events'),
      search: t('', 'Search events…'),
      add: t('', 'Add event'),
      empty: t('', 'No events found'),
      unknown: t('', 'Unknown event'),
    },
    memberPlan: {
      one: t('', 'Member plan'),
      many: t('', 'Member plans'),
      search: t('', 'Search member plans…'),
      add: t('', 'Add member plan'),
      empty: t('', 'No member plans found'),
      unknown: t('', 'Unknown member plan'),
    },
    author: {
      one: t('', 'Author'),
      many: t('', 'Authors'),
      search: t('', 'Search authors…'),
      add: t('', 'Add author'),
      empty: t('', 'No authors found'),
      unknown: t('', 'Unknown author'),
    },
    paywall: {
      one: t('', 'Paywall'),
      many: t('', 'Paywalls'),
      search: t('', 'Search paywalls…'),
      add: t('', 'Add paywall'),
      empty: t('', 'No paywalls found'),
      unknown: t('', 'Unknown paywall'),
    },
  } satisfies Record<RecordModel, RecordModelLabels>;
};

export const useRecordStatusLabels = () => {
  const { t } = useTranslation();

  return {
    published: t('', 'Published'),
    pending: t('', 'Pending'),
    draft: t('', 'Draft'),
    none: t('', 'Unpublished'),
  } satisfies Record<RecordStatus, string>;
};
