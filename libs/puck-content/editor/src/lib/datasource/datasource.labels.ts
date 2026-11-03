import { useTranslation } from 'react-i18next';

import {
  DatasourceModel,
  DatasourceType,
  ListDatasourceType,
} from './datasource.field';

export const useDatasourceLabels = () => {
  const { t } = useTranslation();

  const models = {
    article: t('puck.datasource.models.article'),
    page: t('puck.datasource.models.page'),
    event: t('puck.datasource.models.event'),
    image: t('puck.datasource.models.image'),
    memberPlan: t('puck.datasource.models.memberPlan'),
    userSubscription: t('puck.datasource.models.userSubscription'),
  } satisfies Record<DatasourceModel, string>;

  const items = {
    article: t('puck.datasource.items.article'),
    page: t('puck.datasource.items.page'),
    event: t('puck.datasource.items.event'),
    image: t('puck.datasource.items.image'),
    memberPlan: t('puck.datasource.items.memberPlan'),
    userSubscription: t('puck.datasource.items.userSubscription'),
  } satisfies Record<DatasourceModel, string>;

  const types = {
    list: t('puck.datasource.types.list'),
    uniqueList: t('puck.datasource.types.uniqueList'),
    single: t('puck.datasource.types.single'),
    multiple: t('puck.datasource.types.multiple'),
    slot: t('puck.datasource.types.slot'),
  } satisfies Record<DatasourceType, string>;

  const collections: Partial<Record<DatasourceModel, string>> = {
    memberPlan: t('puck.datasource.descriptions.memberPlan'),
    userSubscription: t('puck.datasource.descriptions.userSubscription'),
  };

  const descriptions = {
    list: (model: DatasourceModel) =>
      collections[model] ??
      t('puck.datasource.descriptions.list', {
        items: items[model],
        slot: types.slot,
      }),
    uniqueList: (model: DatasourceModel) =>
      collections[model] ??
      t('puck.datasource.descriptions.uniqueList', {
        items: items[model],
        slot: types.slot,
      }),
    slot: (model: DatasourceModel) =>
      t('puck.datasource.descriptions.slot', {
        items: items[model],
      }),
  } satisfies Record<ListDatasourceType, (model: DatasourceModel) => string>;

  return {
    field: t('puck.datasource.field'),
    empty: t('puck.datasource.empty'),
    add: t('puck.datasource.add'),
    remove: t('puck.datasource.remove'),
    models,
    descriptions,
    removeModel: (model: DatasourceModel) =>
      t('puck.datasource.removeModel', { model: models[model] }),
    typeGroup: (model: DatasourceModel) =>
      t('puck.datasource.typeGroup', { items: items[model] }),
    types,
    typeHints: {
      list: t('puck.datasource.typeHints.list'),
      uniqueList: t('puck.datasource.typeHints.uniqueList'),
      single: t('puck.datasource.typeHints.single'),
      multiple: t('puck.datasource.typeHints.multiple'),
      slot: t('puck.datasource.typeHints.slot'),
    } satisfies Record<DatasourceType, string>,
  };
};
