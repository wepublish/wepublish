import { forwardRef, Inject, Injectable, Logger, Scope } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import {
  ArticleDataloaderService,
  ArticleService,
  ArticleSort,
} from '@wepublish/article/api';
import type { UserSession } from '@wepublish/authentication/api';
import {
  EventDataloaderService,
  EventService,
  EventSort,
} from '@wepublish/event/api';
import { ImageDataloaderService } from '@wepublish/image/api';
import {
  MemberPlanDataloader,
  MemberPlanService,
} from '@wepublish/member-plan/api';
import {
  PageDataloaderService,
  PageService,
  PageSort,
} from '@wepublish/page/api';
import {
  limitAnswerCache,
  skipAnswerCache,
} from '@wepublish/public-content-cache/api';
import {
  ApiBlock,
  ApiPuckRegistry,
  FlatPuckBlock,
  flattenPuckBlocks,
  readStoredPuckBlocks,
  readStoredPuckRegistry,
} from '@wepublish/puck-content/api';
import { SortOrder } from '@wepublish/utils/api';

import {
  displayedPuckBlocks,
  nextPuckBlocksTimingChange,
} from '../timing/puck-timing';
import {
  emptyPuckBlockData,
  PuckBlockData,
  PuckBlockTemplateData,
} from './puck-block-data.model';
import {
  planPuckBlockData,
  PuckDataModel,
  puckDataModels,
  PuckDataSource,
  PuckListRequest,
} from './puck-block-data.plan';
import {
  LINKED_TEMPLATE_SLOT,
  LINKED_TEMPLATE_TYPE,
  MAX_LINKED_TEMPLATE_DEPTH,
} from './linked-template';

export type PuckDocumentOptions = {
  pruned: boolean;
  now: Date;
  preview: boolean;
};

export type PuckBlockDataRequest = {
  user?: UserSession | null;
  context: object;
};

type PuckRecord = { id: string };

type PuckRecords = Partial<Record<PuckDataModel, PuckRecord[]>>;

type PuckDocument = {
  blocks: ApiBlock[];
  options: PuckDocumentOptions;
  data?: Promise<Map<string, PuckBlockData>>;
};

export {
  LINKED_TEMPLATE_SLOT,
  LINKED_TEMPLATE_TYPE,
  MAX_LINKED_TEMPLATE_DEPTH,
} from './linked-template';

type TemplateRow = {
  id: string;
  name: string;
  puckBlocks: unknown;
  puckRegistry: unknown;
};

type LinkedContent = {
  id: string;
  name: string;
  blocks: ApiBlock[];
  registry: ApiPuckRegistry | null;
};

type Expansion = {
  tree: ApiBlock[];
  templates: Map<string, LinkedContent | null>;
};

const isLinked = (block: ApiBlock) => block.type === LINKED_TEMPLATE_TYPE;

const templateIdOf = ({ props }: ApiBlock) => {
  const templateId = (props as Record<string, unknown> | undefined)?.[
    'templateId'
  ];

  return typeof templateId === 'string' ? templateId : null;
};

const linkedBlocksIn = (blocks: ApiBlock[]): ApiBlock[] =>
  blocks.flatMap(block => [
    ...(isLinked(block) ? [block] : []),
    ...linkedBlocksIn(block.children ?? []),
  ]);

const mergeRegistries = (
  registries: (ApiPuckRegistry | null)[]
): ApiPuckRegistry | null => {
  const present = registries.filter(
    (registry): registry is ApiPuckRegistry => !!registry
  );

  if (!present.length) {
    return null;
  }

  return present.slice(1).reduce<ApiPuckRegistry>(
    (merged, registry) => ({
      ...merged,
      components: { ...registry.components, ...merged.components },
    }),
    present[0]
  );
};

const dataFields: Record<PuckDataModel, keyof PuckBlockData> = {
  article: 'articles',
  page: 'pages',
  event: 'events',
  image: 'images',
  memberPlan: 'memberPlans',
  userSubscription: 'userSubscriptions',
};

const isRecord = <Entry>(entry: Entry | Error | null): entry is Entry =>
  entry !== null && !(entry instanceof Error);

const isPublished = (
  { publishedAt }: { publishedAt?: Date | null },
  now: Date
) => !!publishedAt && publishedAt <= now;

const without = <Entry extends PuckRecord>(
  entries: Entry[],
  excluded: ReadonlySet<string>
) => entries.filter(({ id }) => !excluded.has(id));

const upcomingUntil = ({
  startsAt,
  endsAt,
}: {
  startsAt: Date;
  endsAt?: Date | null;
}) => (endsAt && endsAt > startsAt ? endsAt : startsAt);

@Injectable({ scope: Scope.REQUEST })
export class PuckBlockDataLoader {
  private readonly logger = new Logger(PuckBlockDataLoader.name);
  private documents = new WeakMap<object, PuckDocument>();

  constructor(
    @Inject(forwardRef(() => ArticleService))
    private articleService: ArticleService,
    @Inject(forwardRef(() => PageService))
    private pageService: PageService,
    private eventService: EventService,
    @Inject(forwardRef(() => MemberPlanService))
    private memberPlanService: MemberPlanService,
    @Inject(forwardRef(() => ArticleDataloaderService))
    private articles: ArticleDataloaderService,
    @Inject(forwardRef(() => PageDataloaderService))
    private pages: PageDataloaderService,
    private events: EventDataloaderService,
    private images: ImageDataloaderService,
    @Inject(forwardRef(() => MemberPlanDataloader))
    private memberPlans: MemberPlanDataloader,
    private prisma: PrismaClient
  ) {}

  flatten(blocks: ApiBlock[], options: PuckDocumentOptions): FlatPuckBlock[] {
    const document: PuckDocument = { blocks, options };
    const flat = flattenPuckBlocks(blocks);

    flat.forEach(block => this.documents.set(block, document));

    return flat;
  }

  async data(
    block: FlatPuckBlock,
    request: PuckBlockDataRequest
  ): Promise<PuckBlockData> {
    const document = this.documents.get(block);

    if (!document) {
      return emptyPuckBlockData;
    }

    document.data ??= this.resolve(document, request);

    return (await document.data).get(block.id) ?? emptyPuckBlockData;
  }

  private async expandLinked(
    blocks: ApiBlock[],
    options: PuckDocumentOptions,
    request: PuckBlockDataRequest
  ): Promise<Expansion> {
    const rows = new Map<string, TemplateRow | null>();
    const templates = new Map<string, LinkedContent | null>();

    const load = async (ids: string[]) => {
      const missing = [...new Set(ids)].filter(id => !rows.has(id));

      if (!missing.length) {
        return;
      }

      const found: TemplateRow[] = await this.prisma.blockTemplate.findMany({
        where: { id: { in: missing } },
        select: { id: true, name: true, puckBlocks: true, puckRegistry: true },
      });

      missing.forEach(id =>
        rows.set(id, found.find(row => row.id === id) ?? null)
      );
    };

    const expand = async (
      siblings: ApiBlock[],
      chain: string[],
      prefix: string | null,
      depth: number
    ): Promise<ApiBlock[]> => {
      await load(
        linkedBlocksIn(siblings).flatMap(block => templateIdOf(block) ?? [])
      );

      const visit = async (block: ApiBlock): Promise<ApiBlock> => {
        const id = prefix ? `${prefix}/${block.id}` : block.id;
        const children =
          block.children && (await Promise.all(block.children.map(visit)));
        const visited: ApiBlock = {
          ...block,
          id,
          ...(children ? { children } : {}),
        };

        if (!isLinked(block)) {
          return visited;
        }

        const templateId = templateIdOf(block);
        const row = templateId ? rows.get(templateId) : null;
        const problem =
          !templateId || !row ? `misses its block template ${templateId}`
          : chain.includes(templateId) ?
            `links back to block template ${templateId}`
          : depth >= MAX_LINKED_TEMPLATE_DEPTH ?
            `nests block template ${templateId} deeper than ${MAX_LINKED_TEMPLATE_DEPTH} levels`
          : null;

        if (problem || !row || !templateId) {
          this.logger.warn(
            `Linked block ${id} ${problem}, resolving it as empty.`
          );
          templates.set(id, null);

          return visited;
        }

        const stored = readStoredPuckBlocks(row.puckBlocks) ?? [];
        const displayed =
          options.pruned ? displayedPuckBlocks(stored, options.now) : stored;
        const changeAt = nextPuckBlocksTimingChange(stored, options.now);

        if (changeAt) {
          limitAnswerCache(request.context, changeAt);
        }

        const content = await expand(
          displayed,
          [...chain, templateId],
          id,
          depth + 1
        );
        const nested = linkedBlocksIn(content).map(
          ({ id: nestedId }) => templates.get(nestedId)?.registry ?? null
        );

        templates.set(id, {
          id: row.id,
          name: row.name,
          blocks: content,
          registry: mergeRegistries([
            readStoredPuckRegistry(row.puckRegistry),
            ...nested,
          ]),
        });

        return {
          ...visited,
          children: [
            ...(children ?? []),
            ...content.map(child => ({
              ...child,
              puckSlot: LINKED_TEMPLATE_SLOT,
            })),
          ],
        };
      };

      return Promise.all(siblings.map(visit));
    };

    if (!linkedBlocksIn(blocks).length) {
      return { tree: blocks, templates };
    }

    return { tree: await expand(blocks, [], null, 0), templates };
  }

  private templateData(
    document: PuckDocument,
    content: LinkedContent | null
  ): PuckBlockTemplateData | null {
    if (!content) {
      return null;
    }

    const flat = flattenPuckBlocks(content.blocks);

    flat.forEach(block => this.documents.set(block, document));

    return {
      id: content.id,
      name: content.name,
      puckBlocks: flat,
      puckRegistry: content.registry,
    };
  }

  private async resolve(document: PuckDocument, request: PuckBlockDataRequest) {
    const { options } = document;
    const { tree: blocks, templates } = await this.expandLinked(
      document.blocks,
      options,
      request
    );
    const plan = planPuckBlockData(blocks, options);
    const shown = Object.fromEntries(
      puckDataModels.map(model => [model, new Set(plan.pinned[model])])
    ) as Record<PuckDataModel, Set<string>>;

    if (
      options.preview ||
      plan.blocks.some(({ sources }) => sources.userSubscription)
    ) {
      skipAnswerCache(request.context);
    }

    const records: Record<string, PuckRecords> = Object.fromEntries(
      plan.blocks.map(({ id }) => [id, {}])
    );

    await Promise.all(
      plan.blocks.flatMap(({ id, sources }) =>
        puckDataModels.map(async model => {
          const source = sources[model];

          if (source?.type === 'pick') {
            records[id][model] = await this.pick(model, source.ids, options);
          }
        })
      )
    );

    for (const list of plan.lists) {
      const loaded = await this.list(list, shown[list.model], request);
      const shownRecords =
        list.shown === null ? loaded : loaded.slice(0, list.shown);

      records[list.block][list.model] = loaded;
      shownRecords.forEach(({ id }) => shown[list.model].add(id));
    }

    const yielded = (
      id: string,
      model: PuckDataModel,
      source: PuckDataSource
    ): PuckRecord[] => {
      if (source.type === 'list' && source.consumes !== null) {
        return (records[id][model] ?? []).slice(0, source.consumes);
      }

      if (source.type !== 'slot') {
        return records[id][model] ?? [];
      }

      const provided =
        source.provider ? (records[source.provider]?.[model] ?? []) : [];

      return provided.slice(source.index, source.index + 1);
    };

    return new Map(
      plan.blocks.map(({ id, sources }) => {
        const data: PuckBlockData = { ...emptyPuckBlockData };

        for (const model of puckDataModels) {
          const source = sources[model];

          if (source) {
            Object.assign(data, {
              [dataFields[model]]: yielded(id, model, source),
            });
          }
        }

        if (templates.has(id)) {
          data.template = this.templateData(
            document,
            templates.get(id) ?? null
          );
        }

        return [id, data];
      })
    );
  }

  private async pick(
    model: PuckDataModel,
    ids: string[],
    { now, preview }: PuckDocumentOptions
  ): Promise<PuckRecord[]> {
    if (!ids.length) {
      return [];
    }

    switch (model) {
      case 'article':
        return (await this.articles.loadMany(ids))
          .filter(isRecord)
          .filter(article => preview || isPublished(article, now));
      case 'page':
        return (await this.pages.loadMany(ids))
          .filter(isRecord)
          .filter(page => preview || isPublished(page, now));
      case 'event':
        return (await this.events.loadMany(ids)).filter(isRecord);
      case 'image':
        return (await this.images.loadMany(ids)).filter(isRecord);
      case 'memberPlan':
        return (await this.memberPlans.loadMany(ids)).filter(isRecord);
      case 'userSubscription':
        return [];
    }
  }

  private async list(
    { model, unique, count }: PuckListRequest,
    shown: ReadonlySet<string>,
    { user, context }: PuckBlockDataRequest
  ): Promise<PuckRecord[]> {
    if (count === 0) {
      return [];
    }

    const excluded: ReadonlySet<string> = unique ? shown : new Set();
    const take = count ?? 0;

    switch (model) {
      case 'article': {
        const { nodes } = await this.articleService.getArticles({
          filter: {
            published: true,
            ...(excluded.size ? { excludeIds: [...excluded] } : {}),
          },
          sort: ArticleSort.PublishedAt,
          order: SortOrder.Descending,
          take,
        });

        return nodes;
      }
      case 'page': {
        const { nodes } = await this.pageService.getPages({
          filter: { published: true },
          sort: PageSort.PublishedAt,
          order: SortOrder.Descending,
          take: take + excluded.size,
        });

        return without(nodes, excluded).slice(0, take);
      }
      case 'event': {
        const { nodes } = await this.eventService.getEvents({
          filter: { upcomingOnly: true },
          sort: EventSort.StartsAt,
          order: SortOrder.Ascending,
          take: take + excluded.size,
        });
        const upcoming = without(nodes, excluded).slice(0, take);

        if (upcoming.length) {
          limitAnswerCache(
            context,
            new Date(
              Math.min(...upcoming.map(event => upcomingUntil(event).getTime()))
            )
          );
        }

        return upcoming;
      }
      case 'memberPlan':
        return without(
          await this.memberPlanService.getActiveMemberPlans(),
          excluded
        );
      case 'userSubscription':
        return user?.user?.id ?
            without(
              await this.prisma.subscription.findMany({
                where: { userID: user.user.id },
              }),
              excluded
            )
          : [];
      case 'image':
        return [];
    }
  }
}
