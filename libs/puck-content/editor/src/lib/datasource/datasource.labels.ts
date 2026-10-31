import { useTranslation } from 'react-i18next';

import {
  DatasourceModel,
  DatasourceType,
  ListDatasourceType,
} from './datasource.field';

export const useDatasourceLabels = () => {
  const { t } = useTranslation();

  const models = {
    article: t('', 'Articles'),
    page: t('', 'Pages'),
    event: t('', 'Events'),
    image: t('', 'Images'),
    memberPlan: t('', 'Member plans'),
    userSubscription: t('', 'User subscriptions'),
  } satisfies Record<DatasourceModel, string>;

  const items = {
    article: t('', 'articles'),
    page: t('', 'pages'),
    event: t('', 'events'),
    image: t('', 'images'),
    memberPlan: t('', 'member plans'),
    userSubscription: t('', 'subscriptions of the signed-in reader'),
  } satisfies Record<DatasourceModel, string>;

  const descriptions = {
    list: (model: DatasourceModel) =>
      t('', 'Shows the newest {{items}} automatically.', {
        items: items[model],
      }),
    uniqueList: (model: DatasourceModel) =>
      t(
        '',
        'Shows the newest {{items}} automatically, skipping any already shown on the page.',
        { items: items[model] }
      ),
    slot: (model: DatasourceModel) =>
      t('', 'Shows the {{items}} handed down by the surrounding block.', {
        items: items[model],
      }),
  } satisfies Record<ListDatasourceType, (model: DatasourceModel) => string>;

  return {
    field: t('', 'Data sources'),
    empty: t('', 'No data connected yet.'),
    add: t('', 'Add data source'),
    remove: t('', 'Remove'),
    models,
    descriptions,
    removeModel: (model: DatasourceModel) =>
      t('', 'Remove {{model}} data source', { model: models[model] }),
    typeGroup: (model: DatasourceModel) =>
      t('', 'Which {{items}}', { items: items[model] }),
    types: {
      list: t('', 'Latest'),
      uniqueList: t('', 'Latest (no duplicates)'),
      single: t('', 'Pick one'),
      multiple: t('', 'Pick several'),
      slot: t('', 'From parent'),
    } satisfies Record<DatasourceType, string>,
    typeHints: {
      list: t('', 'The newest records, filled in automatically'),
      uniqueList: t(
        '',
        'The newest records, skipping those already shown on the page'
      ),
      single: t('', 'Choose one record yourself'),
      multiple: t('', 'Choose several records and their order yourself'),
      slot: t('', 'Use the records the surrounding block passes in'),
    } satisfies Record<DatasourceType, string>,
  };
};
