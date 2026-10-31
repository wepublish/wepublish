import {
  ApiBlock,
  ApiBlockDatasources,
  orderPuckChildren,
} from '@wepublish/puck-content/api';

import { isPuckBlockDisplayed } from '../timing/puck-timing';

export const puckDataModels = [
  'article',
  'page',
  'event',
  'image',
  'memberPlan',
  'userSubscription',
] as const satisfies readonly (keyof ApiBlockDatasources)[];

export type PuckDataModel = (typeof puckDataModels)[number];

export const puckCollectionModels: readonly PuckDataModel[] = [
  'memberPlan',
  'userSubscription',
];

export type PuckPickSource = { type: 'pick'; ids: string[] };
export type PuckListSource = {
  type: 'list';
  list: number;
  consumes: number | null;
};
export type PuckSlotSource = {
  type: 'slot';
  provider: string | null;
  index: number;
};

export type PuckDataSource = PuckPickSource | PuckListSource | PuckSlotSource;

export type PuckBlockDataPlan = {
  id: string;
  hidden: boolean;
  sources: Partial<Record<PuckDataModel, PuckDataSource>>;
};

export type PuckListRequest = {
  block: string;
  model: PuckDataModel;
  unique: boolean;
  count: number | null;
  shown: number | null;
};

export type PuckDataPlan = {
  blocks: PuckBlockDataPlan[];
  pinned: Record<PuckDataModel, string[]>;
  lists: PuckListRequest[];
};

export type PlanPuckBlockDataOptions = {
  pruned: boolean;
  now: Date;
  timeZone?: string;
};

type Consumer = { source: PuckSlotSource; hidden: boolean };

type Provider = {
  id: string;
  consumers: Consumer[];
  consumes: number;
  list?: PuckListRequest;
  hidden: boolean;
  collection: boolean;
};

const emptyPinned = (): Record<PuckDataModel, string[]> => ({
  article: [],
  page: [],
  event: [],
  image: [],
  memberPlan: [],
  userSubscription: [],
});

const servingOrder = (consumers: Consumer[]) => [
  ...consumers.filter(({ hidden }) => !hidden),
  ...consumers.filter(({ hidden }) => hidden),
];

const settle = ({
  consumers,
  consumes,
  list,
  hidden,
  collection,
}: Provider) => {
  servingOrder(consumers).forEach(({ source }, index) => {
    source.index = consumes + index;
  });

  if (!list) {
    return;
  }

  const shownConsumers = consumers.filter(consumer => !consumer.hidden).length;

  list.count = collection ? null : consumes + consumers.length;
  list.shown =
    hidden ? 0
    : collection ? null
    : consumes + shownConsumers;
};

export const planPuckBlockData = (
  tree: ApiBlock[],
  { pruned, now, timeZone }: PlanPuckBlockDataOptions
): PuckDataPlan => {
  const blocks: PuckBlockDataPlan[] = [];
  const pinned = emptyPinned();
  const lists: PuckListRequest[] = [];
  const providers: Provider[] = [];

  const visit = (
    siblings: ApiBlock[],
    parentHidden: boolean,
    inherited: Partial<Record<PuckDataModel, Provider>>
  ) => {
    for (const block of siblings) {
      const hidden =
        parentHidden ||
        (!pruned && !isPuckBlockDisplayed(block, now, timeZone));
      const plan: PuckBlockDataPlan = { id: block.id, hidden, sources: {} };
      const nested = { ...inherited };

      blocks.push(plan);

      for (const model of puckDataModels) {
        const datasource = block.datasources?.[model];

        if (!datasource) {
          continue;
        }

        if (datasource.type === 'slot') {
          const provider = inherited[model];
          const source: PuckSlotSource = {
            type: 'slot',
            provider: provider?.id ?? null,
            index: 0,
          };

          plan.sources[model] = source;
          provider?.consumers.push({ source, hidden });
          continue;
        }

        const collection = puckCollectionModels.includes(model);
        const provider: Provider = {
          id: block.id,
          consumers: [],
          consumes: 0,
          hidden,
          collection,
        };

        if (datasource.type === 'single' || datasource.type === 'multiple') {
          const ids =
            datasource.type === 'single' ? [datasource.id] : datasource.ids;

          plan.sources[model] = { type: 'pick', ids };

          if (!hidden) {
            pinned[model].push(...ids);
          }
        } else {
          provider.consumes = collection ? 0 : (block.consumes ?? 0);
          provider.list = {
            block: block.id,
            model,
            unique: datasource.type === 'uniqueList',
            count: 0,
            shown: 0,
          };
          plan.sources[model] = {
            type: 'list',
            list: lists.length,
            consumes: provider.consumes || null,
          };
          lists.push(provider.list);
        }

        providers.push(provider);
        nested[model] = provider;
      }

      visit(orderPuckChildren(block.children ?? []), hidden, nested);
    }
  };

  visit(tree, false, {});
  providers.forEach(settle);

  return { blocks, pinned, lists };
};
